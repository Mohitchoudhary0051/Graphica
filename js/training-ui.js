/* Cross-feature dashboard, drill and progress integrations. */
const TrainingUI = (() => {
  const T = Training;
  const checks = () =>
    T.modules().flatMap((m) =>
      (Storage.getData(Storage.KEYS.QUIZZES, {})[m.id] || [])
        .slice(0, 2)
        .map((q) => ({ ...q, topic: m.id })),
    );
  function dailyCard() {
    const q = checks()[T.dayNumber(T.today()) % checks().length],
      done = T.read("daily_quiz").find(
        (r) => r.userId === T.user().id && r.date === T.today(),
      );
    return `<article class="card" id="daily-safety"><h3>Today's safety check</h3><p>${T.esc(q.question)}</p>${done ? `<p>✓ Daily Safety Check · ${done.correct ? "Correct" : "Review the explanation"} · +5 learning points</p><p>${T.esc(q.explanation)}</p>` : `<div class="training-choices">${q.options.map((o, i) => T.button(o, "daily-answer", i)).join("")}</div>`}</article>`;
  }
  function dashboard(container) {
    const isStaff = Auth.isStaff(),
      a = Assignments.getStudentAssignments(T.user().id)
        .filter((a) => a.status !== "passed")
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const block = document.createElement("section");
    block.className = "training";
    block.innerHTML = isStaff
      ? `<article class="card"><h2>Assessment actions</h2><p>${Assignments.students().filter((s) => T.weakTopics(s.id).length).length} students need follow-up · ${Assignments.getAssignmentAnalytics().overdue} assessments overdue · ${T.read("assignment_results").filter((r) => Date.now() - new Date(r.date) < 7 * 86400000).length} completed this week</p><div class="training-actions"><a class="btn btn-primary" href="#assignments">Review assignments</a>${T.button("Assign assessment", "assign-new")}${T.button("Assign Based on Progress", "recommend")}<a class="btn btn-secondary" href="#training-analytics">Learning analytics</a></div></article>`
      : `${
          a.length
            ? `<article class="card"><h2>Action required — Assigned assessments</h2>${a
                .slice(0, 3)
                .map(
                  (x) =>
                    `<p><strong>${T.esc(x.title)}</strong> · ${T.esc(x.priority)} · Due ${T.esc(x.dueDate)} · ${T.esc(x.displayStatus)} ${T.button("Open assessment", "assignment-detail", x.id)}</p>`,
                )
                .join(
                  "",
                )}<a href="#assignments">View all assigned assessments</a></article>`
            : ""
        }${dailyCard()}<article class="card"><h3>Recommended for you</h3>${
          T.recommendations(T.user().id)
            .map(
              (r) =>
                `<p>${T.esc(r.reason)} <a href="#quiz-${T.esc(r.quizId)}">Practice ${T.esc(T.title(r.quizId))}</a></p>`,
            )
            .join("") ||
          "<p>No performance-based follow-up yet. Start a learning activity to build your record.</p>"
        }<p>${T.streak(T.user().id)}-day preparedness streak</p><a class="btn btn-secondary" href="#learn">Explore the Learning Hub</a></article>`;
    const header = container.querySelector(".page-header");
    if (header) header.after(block);
    else container.prepend(block);
  }
  function progress(container) {
    const uid = T.user().id,
      r = T.results(uid),
      a = T.achievements(uid),
      levels = [
        "Awareness",
        "Prepared",
        "Practiced",
        "Response Ready",
        "Safety Champion",
      ];
    const unlocked = T.read("badges", {});
    unlocked[uid] = a.badges.filter(([, ok]) => ok).map(([name]) => name);
    T.write("badges", unlocked);
    const section = document.createElement("section");
    section.className = "training";
    section.innerHTML = `<article class="card"><h2>Interactive learning progress</h2><p>Level ${a.level} — ${levels[a.level - 1]} · ${a.points} learning points${a.level < 5 ? " / " + a.level * 150 + " for next level" : ""} · ${T.streak(uid)}-day streak</p><p>Levels describe learning participation. Preparedness uses the five performance components below.</p><div class="training-actions">${a.badges.map(([name, ok]) => `<span class="badge ${ok ? "badge-green" : "badge-neutral"}">${ok ? "✓" : "Locked"} ${name}</span>`).join("")}</div>${[
      "video",
      "flashcards",
      "hunt",
      "decision",
      "escape",
      "matching",
      "infographic",
      "route",
    ]
      .map((type) => {
        const total = Activities.catalog().filter(
            (a) => a.enabled && a.type === type,
          ).length,
          done = new Set(
            r
              .filter(
                (x) =>
                  x.type === type &&
                  Activities.catalog().some(
                    (a) => a.id === x.activityId && a.enabled,
                  ),
              )
              .map((x) => x.activityId),
          ).size;
        return `<div class="training-bar"><span>${type}</span><progress max="${total || 1}" value="${done}"></progress><strong>${done}/${total}</strong></div>`;
      })
      .join("")}<h3>Measured skills</h3>${[
      ["Hazard identification", "hunt"],
      ["Emergency decisions", "decision"],
      ["Evacuation knowledge", "route"],
      ["Safety recall", "flashcards"],
    ]
      .map(([label, type]) => {
        const scores = r.filter((x) => x.type === type).map((x) => x.score),
          avg = T.mean(scores);
        return `<p>${label}: <strong>${avg === null ? "Not assessed" : avg >= 80 ? "Strong" : avg >= 60 ? "Moderate" : "Needs practice"}</strong>${avg === null ? "" : ` (${avg}%)`}</p>`;
      })
      .join("")}</article>`;
    container.append(section);
  }
  const checklist = [
    "I know the nearest safe exit",
    "I know the assembly point",
    "I know not to use elevators",
    "I know the emergency contact",
    "I completed the relevant safety module",
  ];
  function drills(container) {
    const rows = Storage.getData(Storage.KEYS.DRILLS, []),
      section = document.createElement("section");
    section.className = "training";
    section.innerHTML = `<h2>Drill preparation & reflection</h2>${rows
      .map((d) => {
        const s =
            T.read("drill_checklists", {})[T.user().id + ":" + d.id] || [],
          reflection = T.read("drill_reflections").find(
            (r) => r.userId === T.user().id && r.drillId === d.id,
          );
        return `<article class="card"><h3>${T.esc(d.type)} — ${T.esc(d.date)}</h3>${d.status === "upcoming" ? `${checklist.map((text, i) => `<label class="training-option"><input type="checkbox" data-drill="${T.esc(d.id)}" data-check="${i}" ${s.includes(i) ? "checked" : ""}>${text}</label>`).join("")}<p id="ready-${T.esc(d.id)}">${s.length === 5 ? "✓ Drill ready" : "Complete the checklist before the drill."}</p>` : `${reflection ? `<p>Reflection saved · Confidence ${reflection.confidence}/5 · ${T.esc(reflection.difficulty)}</p><p>${T.esc(reflection.improvement)}</p>` : T.button("Record participation & reflect", "drill-reflect", d.id)}`}</article>`;
      })
      .join("")}`;
    container.append(section);
    section.querySelectorAll("[data-drill]").forEach(
      (el) =>
        (el.onchange = () => {
          const d = rows.find((d) => d.id === el.dataset.drill),
            i = +el.dataset.check;
          if (i === 4 && el.checked) {
            const m = T.modules().find((m) => m.category === d.category);
            if (
              !m ||
              T.progress(T.user().id).modules?.[m.id]?.status !== "completed"
            ) {
              el.checked = false;
              App.showToast(
                "Complete the relevant learning module first.",
                "error",
              );
              return;
            }
          }
          const all = T.read("drill_checklists", {}),
            k = T.user().id + ":" + d.id;
          all[k] = (all[k] || []).filter((x) => x !== i);
          if (el.checked) all[k].push(i);
          T.write("drill_checklists", all);
          document.getElementById("ready-" + d.id).textContent =
            all[k].length === 5
              ? "✓ Drill ready"
              : "Complete the checklist before the drill.";
        }),
    );
  }
  function reflection(id) {
    const drill = Storage.getData(Storage.KEYS.DRILLS, []).find(
      (d) => d.id === id && d.status === "completed",
    );
    if (!drill)
      throw Error("Reflections are available after a completed drill.");
    App.showModal({
      title: "After-drill reflection",
      body: `<form id="reflection-form" class="training"><label><input name="participated" type="checkbox" required> I participated in this completed drill</label><label>Confidence (1 = not confident, 5 = very confident)<select name="confidence">${[1, 2, 3, 4, 5].map((n) => `<option>${n}</option>`).join("")}</select></label><label>What was difficult?<select name="difficulty">${["Finding the exit", "Hearing instructions", "Staying calm", "Finding assembly point", "Understanding instructions", "Nothing"].map((x) => `<option>${x}</option>`).join("")}</select></label><label>What should improve?<textarea name="improvement" maxlength="1000"></textarea></label><button class="btn btn-primary">Save reflection</button></form>`,
    });
    document.getElementById("reflection-form").onsubmit = (e) => {
      e.preventDefault();
      const v = new FormData(e.target),
        rows = T.read("drill_reflections").filter(
          (r) => !(r.userId === T.user().id && r.drillId === id),
        );
      rows.push({
        id: T.id(),
        userId: T.user().id,
        drillId: id,
        confidence: +v.get("confidence"),
        difficulty: v.get("difficulty"),
        improvement: v.get("improvement").trim(),
        date: new Date().toISOString(),
      });
      T.write("drill_reflections", rows);
      const p = Storage.getData(Storage.KEYS.PROGRESS, {});
      p[T.user().id] = p[T.user().id] || {
        modules: {},
        quizAttempts: [],
        simAttempts: [],
      };
      p[T.user().id].drillParticipation = [
        ...new Set([...(p[T.user().id].drillParticipation || []), id]),
      ];
      Storage.saveData(Storage.KEYS.PROGRESS, p);
      T.meaningful("drill", drill.category + "-safety", "drill-" + id);
      App.closeModal();
      Drills.renderStudentView(document.getElementById("main-view"));
      drills(document.getElementById("main-view"));
    };
  }
  function analytics(container) {
    if (!Auth.isStaff()) throw Error("Staff access required.");
    const r = T.read("activity_progress"),
      students = Assignments.students(),
      reflections = T.read("drill_reflections");
    container.innerHTML = `<section class="training"><h1 class="page-title">Interactive learning analytics</h1><p>Actual local browser records. This is training-performance analysis, not a prediction of real-world disaster behavior.</p><article class="card"><h2>Completion by activity type</h2>${[
      "video",
      "flashcards",
      "hunt",
      "decision",
      "matching",
      "route",
    ]
      .map((type) => {
        const activities = Activities.catalog().filter(
            (a) => a.type === type && a.enabled,
          ),
          done = new Set(
            r
              .filter(
                (r) =>
                  r.type === type &&
                  students.some((s) => s.id === r.userId) &&
                  activities.some((a) => a.id === r.activityId),
              )
              .map((r) => r.userId + ":" + r.activityId),
          ).size,
          total = activities.length * students.length,
          pct = total ? Math.round((done / total) * 100) : 0;
        return `<div class="training-bar"><span>${type}</span><progress max="100" value="${pct}"></progress><strong>${pct}% (${done}/${total})</strong></div>`;
      })
      .join(
        "",
      )}</article><article class="card"><h2>Students requiring follow-up</h2>${
      students
        .flatMap((s) => T.weakTopics(s.id).map((w) => ({ s, w })))
        .sort((a, b) => a.w.score - b.w.score)
        .map(
          ({ s, w }) =>
            `<p><strong>${T.esc(s.name)} · ${T.esc(T.title(w.topic))} · ${w.score}%</strong><br>${T.esc(w.reason)} ${T.button("Review student", "student-profile", s.id)} ${T.button("Assign recommended quiz", "recommend-one", s.id + "|" + w.topic)}</p>`,
        )
        .join("") || "<p>No below-threshold records.</p>"
    }<h3>Strong measured skills</h3>${
      T.modules()
        .map((m) => {
          const score = T.mean(
            r
              .filter(
                (x) =>
                  x.topic === m.id &&
                  !["poll", "discussion", "wordcloud"].includes(x.type),
              )
              .map((x) => x.score),
          );
          return score !== null && score >= 80
            ? `<p>${T.esc(m.title)} — ${score}%</p>`
            : "";
        })
        .join("") || "<p>No qualifying activity results yet.</p>"
    }</article><article class="card"><h2>Drill reflections</h2><p>${reflections.length} responses · Average confidence ${T.mean(reflections.map((r) => r.confidence)) ?? "—"}/5</p>${reflections.map((r) => `<p>${T.esc(r.difficulty)} — ${T.esc(r.improvement)}</p>`).join("")}</article><a class="btn btn-secondary" href="#assignments">Assignment and department analytics</a></section>`;
  }
  function handle(action, value) {
    if (action === "daily-answer") {
      const rows = T.read("daily_quiz");
      if (rows.some((r) => r.userId === T.user().id && r.date === T.today()))
        return true;
      const q = checks()[T.dayNumber(T.today()) % checks().length];
      rows.push({
        userId: T.user().id,
        date: T.today(),
        answer: +value,
        correct: +value === q.correct,
      });
      T.write("daily_quiz", rows);
      T.meaningful(
        "daily-check",
        q.topic,
        "daily-" + T.today(),
        +value === q.correct ? 100 : 0,
      );
      document.getElementById("daily-safety").outerHTML = dailyCard();
      return true;
    }
    if (action === "drill-reflect") {
      reflection(value);
      return true;
    }
    return false;
  }
  function init() {
    document.addEventListener(
      "click",
      (e) => {
        const b = e.target.closest("[data-action]");
        if (!b || b.disabled) return;
        try {
          if (!T.user()) return;
          const { action, value } = b.dataset;
          if (Assignments.handle(action, value)) return;
          if (TrainingUI.handle(action, value)) return;
          Activities.handle(action, value);
        } catch (err) {
          App.showToast(err.message, "error");
        }
      },
      true,
    );
    document.addEventListener("keydown", (e) => {
      const overlay = document.getElementById("modal-overlay");
      if (!overlay?.classList.contains("active")) return;
      if (e.key === "Escape") {
        App.closeModal();
        return;
      }
      if (e.key === "Tab") {
        const els = [
          ...overlay.querySelectorAll("button,input,select,textarea,a[href]"),
        ].filter((el) => !el.disabled && el.offsetParent !== null);
        const first = els[0],
          last = els.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    });
  }
  return { init, dashboard, progress, drills, analytics, handle };
})();
