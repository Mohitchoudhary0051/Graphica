/* Staff-assigned assessments reuse Quizzes. Each recipient has independent state. */
const Assignments = (() => {
  const T = Training;
  const students = () =>
    Storage.getData(Storage.KEYS.USERS, []).filter(
      (u) => u.role === "student" && u.status === "active",
    );
  const all = () => T.read("quiz_assignments");
  const staff = () => {
    if (!Auth.isStaff())
      throw Error("Only staff and administrators can assign assessments.");
  };
  const accessible = (a) =>
    a && (Auth.isStaff() || a.studentId === T.user()?.id);
  function status(a) {
    if (a.status === "passed") return "passed";
    if (a.dueDate < T.today()) return "overdue";
    return a.status;
  }
  function updateAssignmentStatus(assignmentId) {
    const rows = all(),
      a = rows.find((x) => x.id === assignmentId);
    if (!accessible(a)) throw Error("Assessment not available.");
    return { ...a, displayStatus: status(a) };
  }
  function audienceMembers(audience) {
    return students().filter(
      (s) =>
        audience.type === "all" ||
        (audience.type === "department" && s.department === audience.value) ||
        (audience.type === "batch" &&
          (s.batch || s.joinDate?.slice(0, 4)) === audience.value) ||
        (["individual", "multiple"].includes(audience.type) &&
          audience.studentIds?.includes(s.id)),
    );
  }
  function validate(quizId, settings) {
    if (!Storage.getData(Storage.KEYS.QUIZZES, {})[quizId]?.length)
      throw Error("Choose a quiz from the existing question bank.");
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(settings.dueDate) ||
      Number.isNaN(Date.parse(settings.dueDate))
    )
      throw Error("Choose a valid due date.");
    if (
      !Number.isFinite(+settings.passingScore) ||
      +settings.passingScore < 1 ||
      +settings.passingScore > 100
    )
      throw Error("Passing score must be between 1 and 100.");
    if (
      !Number.isInteger(+settings.maxAttempts) ||
      +settings.maxAttempts < 0 ||
      +settings.maxAttempts > 99
    )
      throw Error("Attempts must be 0 (unlimited) to 99.");
  }
  function create(quizId, audience, settings, actor, occurrence = null) {
    validate(quizId, settings);
    const recipients = audienceMembers(audience);
    if (!recipients.length)
      throw Error("No active students match this audience.");
    const rows = all(),
      created = [];
    for (const s of recipients) {
      if (
        occurrence &&
        rows.some((a) => a.occurrence === occurrence && a.studentId === s.id)
      )
        continue;
      const a = {
        id: T.id(),
        quizId,
        title: T.title(quizId) + " Assessment",
        topic: quizId,
        studentId: s.id,
        studentIds: [s.id],
        audienceType: audience.type,
        department: s.department,
        batch: s.batch || s.joinDate?.slice(0, 4),
        assignedBy: actor.id,
        assignedByName: actor.name,
        assignedAt: new Date().toISOString(),
        dueDate: settings.dueDate,
        passingScore: +settings.passingScore,
        maxAttempts: +settings.maxAttempts,
        priority: settings.priority || "medium",
        difficulty: settings.difficulty || "medium",
        mandatory: !!settings.mandatory,
        reminder: settings.reminder !== false,
        instructions: String(settings.instructions || "").slice(0, 2000),
        status: "assigned",
        attemptsUsed: 0,
        score: null,
        occurrence,
      };
      rows.push(a);
      created.push(a);
    }
    T.write("quiz_assignments", rows);
    for (const a of created)
      T.notify(
        a.studentId,
        `New assessment: ${a.title}. Due ${a.dueDate}.`,
        "assignments",
        "new-" + a.id,
      );
    return created;
  }
  function assignQuiz(quizId, audience, settings) {
    staff();
    if (settings.dueDate < T.today())
      throw Error("Choose today or a future due date.");
    return create(quizId, audience, settings, T.user());
  }
  function getStudentAssignments(uid) {
    if (!Auth.isStaff() && uid !== T.user()?.id) return [];
    return all()
      .filter((a) => a.studentId === uid)
      .map((a) => ({ ...a, displayStatus: status(a) }));
  }
  function getAssignmentAnalytics(rows = all()) {
    if (!Auth.isStaff())
      rows = rows.filter((a) => a.studentId === T.user()?.id);
    const completed = rows.filter((a) => a.score !== null).length,
      passed = rows.filter((a) => a.status === "passed").length;
    return {
      assigned: rows.length,
      completed,
      pending: rows.length - completed,
      passed,
      needsImprovement: rows.filter((a) => a.status === "needs-improvement")
        .length,
      overdue: rows.filter((a) => status(a) === "overdue").length,
      completionRate: rows.length
        ? Math.round((completed / rows.length) * 100)
        : 0,
      passRate: completed ? Math.round((passed / completed) * 100) : 0,
    };
  }
  function begin(id) {
    const rows = all(),
      a = rows.find((x) => x.id === id);
    if (!a || a.studentId !== T.user()?.id)
      throw Error("This assessment is assigned to another student.");
    if (
      a.status === "passed" ||
      (a.maxAttempts && a.attemptsUsed >= a.maxAttempts)
    )
      throw Error("No attempts remain for this assessment.");
    if (!a.draft) {
      a.draft = {
        id: T.id(),
        questions: Storage.getData(Storage.KEYS.QUIZZES, {})[a.quizId],
        answers: [],
        index: 0,
        submitted: false,
        startedAt: Date.now(),
      };
      a.status = "started";
      T.write("quiz_assignments", rows);
    }
    return a;
  }
  function saveDraft(id, draft) {
    const rows = all(),
      a = rows.find((x) => x.id === id);
    if (!a || a.studentId !== T.user()?.id || !a.draft)
      throw Error("Assessment session is not available.");
    a.draft = { ...a.draft, ...draft };
    a.status = "in-progress";
    T.write("quiz_assignments", rows);
  }
  function submit(id, attempt) {
    const rows = all(),
      a = rows.find((x) => x.id === id);
    if (!a || a.studentId !== T.user()?.id || !a.draft)
      throw Error("This assessment attempt has already ended.");
    if (a.maxAttempts && a.attemptsUsed >= a.maxAttempts)
      throw Error("No attempts remain.");
    const bank =
      a.draft.questions || Storage.getData(Storage.KEYS.QUIZZES, {})[a.quizId];
    if (
      !bank ||
      attempt.answers.length !== bank.length ||
      attempt.answers.some(
        (v, i) => !Number.isInteger(v) || v < 0 || v >= bank[i].options.length,
      )
    )
      throw Error("Answer every question before submitting.");
    const correct = bank.filter(
      (q, i) => q.correct === attempt.answers[i],
    ).length;
    const result = {
      id: a.draft.id,
      assignmentId: a.id,
      userId: a.studentId,
      quizId: a.quizId,
      score: correct,
      total: bank.length,
      percentage: Math.round((correct / bank.length) * 100),
      answers: attempt.answers,
      weakQuestions: bank
        .filter((q, i) => q.correct !== attempt.answers[i])
        .map((q) => q.question),
      seconds: Math.round((Date.now() - a.draft.startedAt) / 1000),
      date: new Date().toISOString(),
    };
    const results = T.read("assignment_results");
    if (!results.some((r) => r.id === result.id)) {
      results.push(result);
      T.write("assignment_results", results);
    }
    const previous = a.score;
    a.attemptsUsed++;
    a.score = result.percentage;
    a.status = a.score >= a.passingScore ? "passed" : "needs-improvement";
    a.completedAt = result.date;
    delete a.draft;
    T.write("quiz_assignments", rows);
    T.notify(
      a.studentId,
      `${a.title}: ${a.score}% — ${a.status === "passed" ? "Passed" : "Needs improvement. Review " + T.title(a.quizId) + " before retrying."}`,
      "assignments",
      "result-" + result.id,
    );
    T.notify(
      a.assignedBy,
      `${T.user().name} completed ${a.title}: ${a.score}%. ${a.status === "passed" ? "Passed." : "Follow-up recommended."}${previous !== null && a.score > previous ? " Performance improved." : ""}`,
      "assignments",
      "staff-result-" + result.id,
    );
    return result;
  }
  function addDays(date, n) {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + n);
    return T.today(d);
  }
  function nextDate(date, recurrence, anchor) {
    if (recurrence === "monthly") {
      const d = new Date(date + "T12:00:00");
      const desired = +(anchor || date).slice(-2);
      d.setDate(1);
      d.setMonth(d.getMonth() + 1);
      d.setDate(
        Math.min(
          desired,
          new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(),
        ),
      );
      return T.today(d);
    }
    return addDays(date, recurrence === "biweekly" ? 14 : 7);
  }
  function processRules() {
    if (!T.user()) return;
    // Recover the progress projection if a refresh interrupted a multi-key save.
    const progress = Storage.getData(Storage.KEYS.PROGRESS, {});
    let progressChanged = false;
    for (const result of T.read("assignment_results")) {
      const p = (progress[result.userId] ||= {
        modules: {},
        quizAttempts: [],
        simAttempts: [],
        drillParticipation: [],
      });
      p.quizAttempts ||= [];
      if (!p.quizAttempts.some((q) => q.id === result.id)) {
        p.quizAttempts.push({ ...result, date: result.date.slice(0, 10) });
        progressChanged = true;
      }
    }
    if (progressChanged && !Storage.saveData(Storage.KEYS.PROGRESS, progress))
      throw Error("Progress could not be saved.");
    const rules = T.read("assignment_rules");
    let changed = false;
    for (const rule of rules.filter((r) => r.enabled)) {
      const actor = Storage.getData(Storage.KEYS.USERS, []).find(
        (u) =>
          u.id === rule.actor.id &&
          ["admin", "staff"].includes(u.role) &&
          u.status === "active",
      );
      if (!actor) continue;
      if (rule.trigger === "calendar") {
        // At most one current occurrence on opening; skipped periods are not backfilled.
        if (rule.nextDate > T.today()) continue;
        let date = rule.nextDate,
          next = nextDate(date, rule.recurrence, rule.anchorDate);
        if (rule.recurrence !== "once")
          while (next <= T.today()) {
            date = next;
            next = nextDate(date, rule.recurrence, rule.anchorDate);
          }
        create(
          rule.quizId,
          rule.audience,
          { ...rule.settings, dueDate: addDays(T.today(), rule.delay) },
          actor,
          rule.id + ":" + date,
        );
        rule.nextDate = next;
        if (rule.recurrence === "once") rule.enabled = false;
        changed = true;
        T.notify(
          actor.id,
          "Recurring assessment generated locally when Graphica opened.",
          "assignments",
          rule.id + ":" + date,
        );
      } else {
        for (const student of audienceMembers(rule.audience)) {
          const p = T.progress(student.id),
            qs = (p.quizAttempts || []).filter((q) => q.quizId === rule.quizId),
            last = qs.at(-1);
          const qualifies =
            rule.trigger === "module"
              ? p.modules?.[rule.quizId]?.status === "completed"
              : rule.trigger === "weak"
                ? T.weakTopics(student.id).some((w) => w.topic === rule.quizId)
                : last &&
                  last.percentage < rule.settings.passingScore &&
                  T.dayNumber(T.today()) -
                    T.dayNumber(last.date.slice(0, 10)) >=
                    rule.delay;
          if (!qualifies) continue;
          const token =
            rule.id +
            ":" +
            student.id +
            ":" +
            (rule.trigger === "module" ? "module" : qs.length);
          create(
            rule.quizId,
            { type: "individual", studentIds: [student.id] },
            { ...rule.settings, dueDate: addDays(T.today(), rule.delay) },
            actor,
            token,
          );
        }
      }
    }
    if (changed) T.write("assignment_rules", rules);
    for (const a of all()) {
      if (a.status === "passed") continue;
      const days = T.dayNumber(a.dueDate) - T.dayNumber(T.today());
      if (days < 0 || (a.reminder && days <= 2)) {
        const message = `${a.title} is ${days < 0 ? "overdue" : "due soon"} (${a.dueDate}).`;
        T.notify(
          a.studentId,
          message,
          "assignments",
          a.id + (days < 0 ? ":overdue" : ":soon"),
        );
        if (days < 0)
          T.notify(a.assignedBy, message, "assignments", a.id + ":overdue");
      }
    }
  }
  const badge = (a) =>
    `<span class="badge ${status(a) === "passed" ? "badge-green" : status(a) === "overdue" ? "badge-red" : status(a) === "needs-improvement" ? "badge-amber" : "badge-neutral"}">${T.esc(status(a).replaceAll("-", " "))}</span>`;
  function render(container) {
    processRules();
    const isStaff = Auth.isStaff();
    container.innerHTML = `<section class="training" id="assessment-page"><div class="page-header"><h1 class="page-title">${isStaff ? "Quiz assignments" : "Assigned assessments"}</h1><p class="page-subtitle">Local browser training records. Assessments use the existing quiz engine.</p></div>${isStaff ? `<div class="training-actions">${T.button("+ Assign quiz", "assign-new")}${T.button("Assign Based on Progress", "recommend")}${T.button("Assessment rules", "rules")}${Auth.isAdmin() ? T.button("Manage quiz bank", "quiz-bank") : ""}${T.button("Load labeled demo assignments", "seed-assignments")}</div>` : ""}<div class="training-filters"><label>Search<input class="form-input" id="assignment-search" type="search" placeholder="Student or assessment"></label><label>Status<select class="form-select" id="assignment-status"><option value="">All</option>${["assigned", "started", "in-progress", "passed", "needs-improvement", "overdue"].map((s) => `<option>${s}</option>`).join("")}</select></label><label>Topic<select class="form-select" id="assignment-topic"><option value="">All</option>${T.modules()
      .map((m) => `<option value="${T.esc(m.id)}">${T.esc(m.title)}</option>`)
      .join(
        "",
      )}</select></label><label>Priority<select class="form-select" id="assignment-priority"><option value="">All</option>${["low", "medium", "high", "critical"].map((x) => `<option>${x}</option>`).join("")}</select></label><label>Difficulty<select class="form-select" id="assignment-difficulty"><option value="">All</option>${["easy", "medium", "hard", "expert"].map((x) => `<option>${x}</option>`).join("")}</select></label><label>Due by<input type="date" class="form-input" id="assignment-due"></label>${isStaff ? `<label>Department<select id="assignment-department" class="form-select"><option value="">Institution — all</option>${[...new Set(students().map((s) => s.department))].map((s) => `<option>${T.esc(s)}</option>`).join("")}</select></label><label>Batch<select id="assignment-batch" class="form-select"><option value="">All</option>${[...new Set(students().map((s) => s.batch || s.joinDate?.slice(0, 4)))].map((s) => `<option>${T.esc(s)}</option>`).join("")}</select></label>` : ""}</div><div id="assignment-results"></div></section>`;
    container
      .querySelectorAll(".training-filters input,.training-filters select")
      .forEach((el) => el.addEventListener("input", renderRows));
    renderRows();
  }
  function renderRows() {
    const val = (id) => document.getElementById(id)?.value || "";
    const rows = all()
      .filter(
        (a) =>
          (Auth.isStaff() || a.studentId === T.user().id) &&
          (!val("assignment-status") ||
            status(a) === val("assignment-status")) &&
          (!val("assignment-topic") || a.topic === val("assignment-topic")) &&
          (!val("assignment-priority") ||
            a.priority === val("assignment-priority")) &&
          (!val("assignment-difficulty") ||
            a.difficulty === val("assignment-difficulty")) &&
          (!val("assignment-due") || a.dueDate <= val("assignment-due")) &&
          (!val("assignment-department") ||
            a.department === val("assignment-department")) &&
          (!val("assignment-batch") || a.batch === val("assignment-batch")) &&
          (
            a.title +
            " " +
            (students().find((s) => s.id === a.studentId)?.name || "")
          )
            .toLowerCase()
            .includes(val("assignment-search").toLowerCase()),
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const stats = getAssignmentAnalytics(rows);
    document.getElementById("assignment-results").innerHTML =
      `<div class="training-stats">${Object.entries(stats)
        .map(
          ([k, v]) =>
            `<div><strong>${v}${k.endsWith("Rate") ? "%" : ""}</strong><span>${T.esc(k.replace(/[A-Z]/g, (x) => " " + x.toLowerCase()))}</span></div>`,
        )
        .join(
          "",
        )}</div><div class="table-container"><table class="data-table"><thead><tr><th>Student / quiz</th><th>Assigned / due</th><th>Score / attempts</th><th>Status / priority</th><th>Action</th></tr></thead><tbody>${rows.map((a) => `<tr><td>${T.esc(students().find((s) => s.id === a.studentId)?.name)}<br><strong>${T.esc(a.title)}</strong>${a.demo ? "<br>Demo record" : ""}<br>${T.esc(a.difficulty)} · ${a.mandatory ? "Mandatory" : "Optional"}</td><td>${T.esc(a.assignedAt.slice(0, 10))}<br>${T.esc(a.dueDate)}<br>By ${T.esc(a.assignedByName)}</td><td>${a.score ?? "—"}${a.score !== null ? "%" : ""} / pass ${a.passingScore}%<br>${a.attemptsUsed} of ${a.maxAttempts || "unlimited"}</td><td>${badge(a)}<br>${T.esc(a.priority)}</td><td>${T.button(Auth.isStaff() ? "View result" : "Open assessment", "assignment-detail", a.id)}${Auth.isStaff() ? T.button("Review student", "student-profile", a.studentId) : ""}</td></tr>`).join("") || '<tr><td colspan="5">No assessments match these filters.</td></tr>'}</tbody></table></div>`;
  }
  function form(quizId = "", studentId = "") {
    staff();
    App.showModal({
      title: "Assign quiz",
      size: "lg",
      body: `<form id="assign-form" class="training"><div class="training-filters"><label>Quiz<select name="quizId" required>${T.modules()
        .filter((m) => Storage.getData(Storage.KEYS.QUIZZES, {})[m.id]?.length)
        .map(
          (m) =>
            `<option value="${T.esc(m.id)}" ${m.id === quizId ? "selected" : ""}>${T.esc(m.title)}</option>`,
        )
        .join(
          "",
        )}</select></label><label>Audience<select name="audience"><option value="individual">Individual student</option><option value="multiple">Multiple students</option><option value="department">Department</option><option value="batch">Batch</option><option value="all">All students</option></select></label><label>Students (multiple selection supported)<select name="students" multiple size="4">${students()
        .map(
          (s) =>
            `<option value="${T.esc(s.id)}" ${s.id === studentId ? "selected" : ""}>${T.esc(s.name)}</option>`,
        )
        .join(
          "",
        )}</select></label><label>Department<select name="department">${[...new Set(students().map((s) => s.department))].map((d) => `<option>${T.esc(d)}</option>`).join("")}</select></label><label>Batch<select name="batch">${[...new Set(students().map((s) => s.batch || s.joinDate?.slice(0, 4)))].map((d) => `<option>${T.esc(d)}</option>`).join("")}</select></label><label>Due date<input name="dueDate" type="date" min="${T.today()}" value="${addDays(T.today(), 7)}" required></label><label>Passing score<input name="passingScore" type="number" min="1" max="100" value="70" required></label><label>Allowed attempts (0 = unlimited)<input name="maxAttempts" type="number" min="0" max="99" value="2" required></label><label>Priority<select name="priority"><option>medium</option><option>high</option><option>critical</option><option>low</option></select></label><label>Difficulty<select name="difficulty"><option>medium</option><option>easy</option><option>hard</option><option>expert</option></select></label></div><p class="text-small">Difficulty labels organize assignments; the existing question bank is retained.</p><label>Instructions<textarea name="instructions" maxlength="2000"></textarea></label><label><input type="checkbox" name="mandatory" checked> Mandatory</label><label><input type="checkbox" name="reminder" checked> Remind when due soon (on app opening)</label><details><summary>Optional recurring / progress rule</summary><label>Trigger<select name="trigger"><option value="none">No rule — assign now</option><option value="calendar">Calendar schedule</option><option value="weak">Weak topic</option><option value="module">Module completed</option><option value="failed">Failed assessment</option></select></label><label>Frequency<select name="recurrence"><option value="once">One-time</option><option value="weekly">Weekly</option><option value="biweekly">Biweekly</option><option value="monthly">Monthly</option></select></label><label>First run<input name="startDate" type="date" value="${T.today()}"></label><label>Days until due / failed-assessment delay<input name="delay" type="number" min="1" max="365" value="7"></label><p>Rules run locally when the app opens. Saving a rule authorizes assignments to its selected audience.</p></details><button class="btn btn-primary" type="submit">Save assignment / rule</button></form>`,
    });
    document.getElementById("assign-form").onsubmit = (e) => {
      e.preventDefault();
      try {
        staff();
        const f = e.target,
          v = new FormData(f),
          type = v.get("audience"),
          ids = [...f.elements.students.selectedOptions].map((o) => o.value);
        if (type === "individual" && ids.length !== 1)
          throw Error("Select exactly one student.");
        const audience = { type, studentIds: ids, value: v.get(type) },
          settings = {
            dueDate: v.get("dueDate"),
            passingScore: +v.get("passingScore"),
            maxAttempts: +v.get("maxAttempts"),
            priority: v.get("priority"),
            difficulty: v.get("difficulty"),
            instructions: v.get("instructions"),
            mandatory: v.has("mandatory"),
            reminder: v.has("reminder"),
          };
        validate(v.get("quizId"), settings);
        if (!audienceMembers(audience).length)
          throw Error("Select a matching audience.");
        if (v.get("trigger") === "none")
          assignQuiz(v.get("quizId"), audience, settings);
        else {
          const rules = T.read("assignment_rules");
          rules.push({
            id: T.id(),
            enabled: true,
            quizId: v.get("quizId"),
            audience,
            settings,
            actor: { id: T.user().id, name: T.user().name },
            trigger: v.get("trigger"),
            recurrence: v.get("recurrence"),
            nextDate: v.get("startDate") || T.today(),
            anchorDate: v.get("startDate") || T.today(),
            delay: +v.get("delay") || 7,
          });
          T.write("assignment_rules", rules);
          processRules();
        }
        App.closeModal();
        App.navigateTo("assignments");
        if (document.getElementById("assessment-page"))
          render(document.getElementById("main-view"));
        App.showToast("Saved.", "success");
      } catch (err) {
        App.showToast(err.message, "error");
      }
    };
  }
  function detail(id) {
    const a = updateAssignmentStatus(id),
      rs = T.read("assignment_results").filter((r) => r.assignmentId === id);
    App.showModal({
      title: a.title,
      size: "lg",
      body: `<section class="training"><p>${badge(a)} · Due ${T.esc(a.dueDate)} · Passing ${a.passingScore}%</p><p>Attempts remaining: ${a.maxAttempts ? Math.max(0, a.maxAttempts - a.attemptsUsed) : "Unlimited"}</p><p>${T.esc(a.instructions || "Answer each question and submit your assessment.")}</p>${rs.map((r) => `<article class="card"><strong>${r.percentage}% — ${r.score} correct / ${r.total - r.score} incorrect</strong><p>${r.seconds} seconds · ${T.esc(r.date.slice(0, 10))}</p><ul>${r.weakQuestions.map((q) => `<li>${T.esc(q)}</li>`).join("")}</ul></article>`).join("")}${a.score !== null && a.score < a.passingScore ? `<p>Follow-up recommended: <a href="#learn-${T.esc(a.quizId)}">Review ${T.esc(T.title(a.quizId))}</a> before reassessment.</p>` : ""}${a.studentId === T.user().id && a.status !== "passed" && (!a.maxAttempts || a.attemptsUsed < a.maxAttempts) ? T.button(a.draft ? "Continue quiz" : "Start quiz", "assignment-start", a.id) : ""}${Auth.isStaff() ? T.button("Assign reinforcement assessment", "reinforce", a.id) : ""}</section>`,
    });
  }
  function profile(uid) {
    staff();
    const s = students().find((s) => s.id === uid);
    if (!s) throw Error("Student unavailable.");
    const p = T.progress(uid),
      stats = getAssignmentAnalytics(getStudentAssignments(uid));
    App.showModal({
      title: s.name + " — Student Safety Profile",
      size: "lg",
      body: `<section class="training"><div class="training-stats">${[
        ["Preparedness", Dashboard.calculatePreparednessScore(uid)],
        ["Learning", Dashboard.calculateTrainingProgress(uid)],
        ["Quizzes", Dashboard.calculateQuizAverage(uid)],
        ["Simulations", Dashboard.calculateSimAverage(uid)],
        ["Interactive", T.interactiveScore(uid)],
        ["Drills", Dashboard.calculateDrillParticipation(uid)],
      ]
        .map(([k, v]) => `<div><strong>${v}%</strong>${k}</div>`)
        .join(
          "",
        )}</div><p>${stats.completed} completed · ${stats.pending} pending · ${stats.overdue} overdue · ${stats.needsImprovement} need review</p><h3>Topic performance</h3><table class="data-table"><thead><tr><th>Topic</th><th>Quiz average</th><th>Status</th></tr></thead><tbody>${T.modules()
        .map((m) => {
          const average = T.mean(
            (p.quizAttempts || [])
              .filter((q) => q.quizId === m.id)
              .map((q) => q.percentage),
          );
          return `<tr><td>${T.esc(m.title)}</td><td>${average === null ? "—" : average + "%"}</td><td>${average === null ? "Not assessed" : average >= 80 ? "Strong" : average >= 70 ? "Good" : "Needs review"}</td></tr>`;
        })
        .join(
          "",
        )}</tbody></table><h3>Recommended assessments</h3>${recommendationCards(uid)}<h3>Progress timeline</h3><ol class="training-timeline">${
        [
          ...T.read("student_progress")
            .filter((r) => r.userId === uid)
            .map((r) => ({
              date: r.date,
              text:
                r.type +
                " — " +
                T.title(r.topic) +
                (r.score !== null ? " " + r.score + "%" : ""),
            })),
          ...(p.quizAttempts || []).map((q) => ({
            date: q.date,
            text: T.title(q.quizId) + " quiz — " + q.percentage + "%",
          })),
          ...getStudentAssignments(uid).map((a) => ({
            date: a.assignedAt,
            text: "Assigned " + a.title,
          })),
        ]
          .sort((a, b) => b.date.localeCompare(a.date))
          .map(
            (r) => `<li>${T.esc(r.date.slice(0, 10))} — ${T.esc(r.text)}</li>`,
          )
          .join("") || "<li>No recorded activity.</li>"
      }</ol></section>`,
    });
  }
  function recommendationCards(uid) {
    return (
      T.recommendations(uid)
        .map(
          (r) =>
            `<article class="card"><strong>${T.esc(T.title(r.quizId))}</strong><p>${T.esc(r.reason)}</p>${r.repeated ? "<p>Attention required: the last three attempts remain below the review threshold. Review the lesson, hazard hunt and simulation before reassessment.</p>" : ""}${T.button("Assign recommended quiz", "recommend-one", uid + "|" + r.quizId)}</article>`,
        )
        .join("") || "<p>No recommendations supported by current records.</p>"
    );
  }
  function recommend() {
    staff();
    App.showModal({
      title: "Progress-Based Assessment Recommendations",
      size: "lg",
      body: `<section class="training"><p>Review the reasons before assigning. These are training indicators, not predictions of emergency behavior.</p>${students()
        .map((s) => `<h3>${T.esc(s.name)}</h3>${recommendationCards(s.id)}`)
        .join("")}</section>`,
    });
  }
  function rules() {
    staff();
    App.showModal({
      title: "Assessment rules",
      body: `<section class="training"><p>Date checks run when Graphica opens; no background server runs.</p>${
        T.read("assignment_rules")
          .map(
            (r) =>
              `<article class="card"><strong>${T.esc(T.title(r.quizId))}</strong><p>${T.esc(r.trigger)} · ${T.esc(r.recurrence)} · ${r.enabled ? "Enabled" : "Disabled"} · Next ${T.esc(r.nextDate)}</p>${T.button(r.enabled ? "Disable" : "Enable", "rule-toggle", r.id)}</article>`,
          )
          .join("") || "<p>No rules. Use Assign quiz to configure one.</p>"
      }</section>`,
    });
  }
  function seed() {
    staff();
    if (all().some((a) => a.demo)) {
      App.showToast("Demo assignments are already loaded.");
      return;
    }
    const people = students();
    if (!people.length) return;
    const rows = all();
    [
      ["electrical-safety", 58, "needs-improvement"],
      ["fire-safety", 86, "passed"],
      ["earthquake-safety", null, "assigned"],
    ].forEach(([quizId, score, state], i) =>
      rows.push({
        id: T.id(),
        demo: true,
        quizId,
        topic: quizId,
        title: "[Demo] " + T.title(quizId) + " Assessment",
        studentId: people[i % people.length].id,
        studentIds: [people[i % people.length].id],
        assignedBy: T.user().id,
        assignedByName: T.user().name,
        assignedAt: new Date().toISOString(),
        department: people[i % people.length].department,
        batch: people[i % people.length].joinDate?.slice(0, 4),
        dueDate: addDays(T.today(), i === 2 ? -2 : 7),
        passingScore: 70,
        maxAttempts: 2,
        attemptsUsed: score === null ? 0 : 1,
        score,
        status: state,
        difficulty: "medium",
        priority: "medium",
        instructions: "Clearly labeled fictional demonstration assignment.",
      }),
    );
    T.write("quiz_assignments", rows);
    renderRows();
  }
  function quizBank(topic = "fire-safety", questionId = "") {
    if (!Auth.isAdmin()) throw Error("Administrator access required.");
    const bank = Storage.getData(Storage.KEYS.QUIZZES, {}),
      questions = bank[topic] || [];
    const q = questions.find((q) => q.id === questionId) || {
      options: ["", "", "", ""],
      correct: 0,
    };
    App.showModal({
      title: "Manage quiz bank",
      size: "lg",
      body: `<section class="training"><label>Topic<select id="bank-topic">${T.modules()
        .map(
          (m) =>
            `<option value="${T.esc(m.id)}" ${m.id === topic ? "selected" : ""}>${T.esc(m.title)}</option>`,
        )
        .join(
          "",
        )}</select></label>${questions.map((q) => `<p>${T.esc(q.question)} ${T.button("Edit question", "bank-edit", topic + "|" + q.id)}</p>`).join("")}${T.button("New question", "bank-edit", topic + "|")}<form id="bank-form"><label>Question<textarea name="question" maxlength="500" required>${T.esc(q.question || "")}</textarea></label>${[0, 1, 2, 3].map((i) => `<label>Option ${i + 1}<input name="option${i}" maxlength="240" required value="${T.esc(q.options[i])}"></label>`).join("")}<label>Correct option<select name="correct">${[0, 1, 2, 3].map((i) => `<option value="${i}" ${q.correct === i ? "selected" : ""}>${i + 1}</option>`).join("")}</select></label><label>Explanation<textarea name="explanation" maxlength="1000" required>${T.esc(q.explanation || "")}</textarea></label><button class="btn btn-primary">Save question</button></form></section>`,
    });
    document.getElementById("bank-topic").onchange = (e) =>
      quizBank(e.target.value);
    document.getElementById("bank-form").onsubmit = (e) => {
      e.preventDefault();
      if (!Auth.isAdmin()) return;
      const v = new FormData(e.target),
        row = {
          id: q.id || T.id(),
          question: v.get("question").trim(),
          options: [0, 1, 2, 3].map((i) => v.get("option" + i).trim()),
          correct: +v.get("correct"),
          explanation: v.get("explanation").trim(),
        };
      if (!row.question || !row.explanation || row.options.some((o) => !o)) {
        App.showToast("Complete every field.", "error");
        return;
      }
      bank[topic] = q.id
        ? questions.map((item) => (item.id === row.id ? row : item))
        : questions.concat(row);
      if (!Storage.saveData(Storage.KEYS.QUIZZES, bank)) {
        App.showToast("Question could not be saved.", "error");
        return;
      }
      quizBank(topic);
      App.showToast(
        "Quiz bank updated. Existing assessment attempts keep their original questions.",
        "success",
      );
    };
  }
  function handle(action, value) {
    if (action === "quiz-bank") quizBank();
    else if (action === "bank-edit") {
      const [topic, id] = value.split("|");
      quizBank(topic, id);
    } else if (action === "assign-new") form();
    else if (action === "recommend") recommend();
    else if (action === "rules") rules();
    else if (action === "seed-assignments") seed();
    else if (action === "assignment-detail") detail(value);
    else if (action === "student-profile") profile(value);
    else if (action === "recommend-one") {
      const [uid, q] = value.split("|");
      form(q, uid);
    } else if (action === "reinforce") {
      const a = updateAssignmentStatus(value);
      form(a.quizId, a.studentId);
    } else if (action === "assignment-start") {
      App.closeModal();
      const a = begin(value);
      Quizzes.start(document.getElementById("main-view"), a.quizId, a.id);
    } else if (action === "rule-toggle") {
      staff();
      const rows = T.read("assignment_rules"),
        r = rows.find((r) => r.id === value);
      if (r) {
        r.enabled = !r.enabled;
        T.write("assignment_rules", rows);
        rules();
      }
    } else return false;
    return true;
  }
  return {
    render,
    handle,
    assignQuiz,
    getStudentAssignments,
    getAssignmentAnalytics,
    updateAssignmentStatus,
    getWeakTopics: T.weakTopics,
    getRecommendedAssessments: T.recommendations,
    begin,
    saveDraft,
    submit,
    processRules,
    status,
    students,
  };
})();
