/* Shared local training records. No network services or background scheduling. */
const Training = (() => {
  const key = (name) => "graphica_" + name;
  const read = (name, fallback = []) => Storage.getData(key(name), fallback);
  const write = (name, value) => {
    if (!Storage.saveData(key(name), value))
      throw new Error(
        "Your browser could not save this change. Free storage and try again.",
      );
    return value;
  };
  const id = () => "G-" + crypto.randomUUID();
  const today = (date = new Date()) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const dayNumber = (date) =>
    Math.floor(
      Date.UTC(...date.split("-").map((v, i) => +v - (i === 1 ? 1 : 0))) /
        86400000,
    );
  const mean = (rows) =>
    rows.length
      ? Math.round(rows.reduce((s, x) => s + x, 0) / rows.length)
      : null;
  const user = () => Auth.getCurrentUser();
  const progress = (uid) =>
    Storage.getData(Storage.KEYS.PROGRESS, {})[uid] || {};
  const modules = () => Storage.getData(Storage.KEYS.MODULES, []);
  const title = (topic) =>
    modules().find((m) => m.id === topic)?.title || topic;
  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (ch) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[ch],
    );
  const button = (text, action, value = "", extra = "") =>
    `<button class="btn btn-secondary" data-action="${action}" data-value="${esc(value)}" ${extra}>${esc(text)}</button>`;
  function notify(uid, message, route = "assignments", token = null) {
    const rows = Storage.getData(Storage.KEYS.NOTIFICATIONS, []);
    if (token && rows.some((n) => n.token === token && n.userId === uid))
      return;
    rows.push({
      id: id(),
      userId: uid,
      message,
      route,
      token,
      type: "learning",
      date: new Date().toISOString(),
      read: false,
    });
    if (!Storage.saveData(Storage.KEYS.NOTIFICATIONS, rows))
      throw Error("Notification could not be saved.");
  }
  function meaningful(type, topic, ref, score = null) {
    if (!user()) return;
    const uid = user().id,
      rows = read("student_progress");
    if (!rows.some((r) => r.userId === uid && r.ref === ref)) {
      rows.push({
        id: id(),
        userId: uid,
        type,
        topic,
        ref,
        score,
        date: new Date().toISOString(),
      });
      write("student_progress", rows);
    }
    const dates = read("streaks", {});
    dates[uid] = [...new Set([...(dates[uid] || []), today()])];
    write("streaks", dates);
    const earned = achievements(uid),
      stored = read("badges", {}),
      previous = stored[uid] || [];
    stored[uid] = earned.badges.filter(([, ok]) => ok).map(([name]) => name);
    write("badges", stored);
    for (const name of stored[uid].filter((name) => !previous.includes(name)))
      notify(
        uid,
        "Achievement earned: " + name,
        "progress",
        "badge-" + uid + "-" + name,
      );
    const levels = read("learning_levels", {});
    if (earned.level > (levels[uid] || 1))
      notify(
        uid,
        "Learning level " + earned.level + " reached.",
        "progress",
        "level-" + uid + "-" + earned.level,
      );
    levels[uid] = earned.level;
    write("learning_levels", levels);
  }
  function complete(activity, score, details = {}) {
    const rows = read("activity_progress");
    const record = {
      id: id(),
      userId: user().id,
      activityId: activity.id,
      type: activity.type,
      topic: activity.topic,
      score: Math.max(0, Math.min(100, Math.round(score))),
      date: new Date().toISOString(),
      ...details,
    };
    rows.push(record);
    write("activity_progress", rows);
    meaningful(activity.type, activity.topic, record.id, record.score);
    return record;
  }
  const results = (uid) =>
    read("activity_progress").filter((r) => r.userId === uid);
  function interactiveScore(uid) {
    const catalog =
      typeof Activities !== "undefined"
        ? Activities.catalog().filter(
            (a) =>
              a.enabled &&
              !["poll", "discussion", "wordcloud"].includes(a.type),
          )
        : [];
    return catalog.length
      ? Math.round(
          catalog.reduce(
            (sum, a) =>
              sum +
              Math.max(
                0,
                ...results(uid)
                  .filter((r) => r.activityId === a.id)
                  .map((r) => r.score),
              ),
            0,
          ) / catalog.length,
        )
      : 0;
  }
  function streak(uid) {
    const dates = new Set(read("streaks", {})[uid] || []);
    let n = dayNumber(today());
    if (!dates.has(today())) n--;
    let count = 0;
    const nums = new Set([...dates].map(dayNumber));
    while (nums.has(n--)) count++;
    return count;
  }
  function achievements(uid) {
    const p = progress(uid),
      r = results(uid),
      completed = Object.values(p.modules || {}).filter(
        (m) => m.status === "completed",
      ).length;
    const distinct = new Set(r.map((x) => x.activityId)).size;
    const points =
      completed * 20 +
      (p.quizAttempts || []).length * 10 +
      (p.simAttempts || []).length * 15 +
      distinct * 20 +
      read("daily_quiz").filter((x) => x.userId === uid).length * 5;
    const badges = [
      ["First Response", completed > 0],
      [
        "Hazard Spotter",
        new Set(
          r
            .filter((x) => x.type === "hunt")
            .flatMap((x) => (x.found || []).map((h) => x.activityId + ":" + h)),
        ).size >= 10,
      ],
      [
        "Fire Ready",
        p.modules?.["fire-safety"]?.status === "completed" &&
          (p.quizAttempts || []).some(
            (x) => x.quizId === "fire-safety" && x.percentage >= 70,
          ) &&
          (p.simAttempts || []).some(
            (x) => x.simId.includes("fire") && x.percentage >= 70,
          ),
      ],
      ["Drill Participant", (p.drillParticipation || []).length > 0],
      [
        "Safety Explorer",
        new Set([
          ...r.map((x) => x.topic),
          ...Object.keys(p.modules || {}).filter(
            (k) => p.modules[k].status === "completed",
          ),
        ]).size >= 5,
      ],
      [
        "Safety Champion",
        completed >= 5 &&
          interactiveScore(uid) >= 80 &&
          Dashboard.calculateQuizAverage(uid) >= 80 &&
          Dashboard.calculateSimAverage(uid) >= 80 &&
          Dashboard.calculateDrillParticipation(uid) > 0,
      ],
    ];
    return { points, level: Math.min(5, 1 + Math.floor(points / 150)), badges };
  }
  function weakTopics(uid, threshold = 70) {
    const p = progress(uid),
      out = [];
    for (const m of modules()) {
      const quizzes = (p.quizAttempts || []).filter((a) => a.quizId === m.id),
        sims = (p.simAttempts || []).filter((a) =>
          a.simId.includes(m.category),
        ),
        activities = results(uid).filter(
          (a) =>
            a.topic === m.id &&
            !["poll", "discussion", "wordcloud"].includes(a.type),
        );
      for (const [label, rows, limit] of [
        ["Quiz", quizzes, m.category === "electrical" ? 60 : threshold],
        ["Simulation", sims, m.category === "earthquake" ? 60 : threshold],
        ["Interactive activity", activities, threshold],
      ]) {
        const average = mean(rows.map((x) => x.percentage ?? x.score));
        if (average !== null && average < limit)
          out.push({
            topic: m.id,
            score: average,
            reason: `${label} average is ${average}%, below the ${limit}% review threshold.`,
            repeated:
              quizzes.length >= 3 &&
              quizzes.slice(-3).every((x) => x.percentage < limit),
          });
      }
    }
    return out;
  }
  function recommendations(uid) {
    const p = progress(uid),
      out = weakTopics(uid).map((w) => ({
        ...w,
        quizId: w.topic,
        priority: w.repeated ? "high" : "medium",
      }));
    for (const a of read("quiz_assignments").filter(
      (a) =>
        a.studentId === uid &&
        !a.demo &&
        a.score !== null &&
        a.score < a.passingScore,
    ))
      out.push({
        topic: a.quizId,
        quizId: a.quizId,
        priority: "high",
        reason: `Assigned assessment score is ${a.score}%, below its required ${a.passingScore}% passing score. Review and reassess.`,
      });
    for (const m of modules())
      if (
        p.modules?.[m.id]?.status === "completed" &&
        !(p.quizAttempts || []).some((q) => q.quizId === m.id)
      )
        out.push({
          topic: m.id,
          quizId: m.id,
          priority: "medium",
          reason:
            "Learning module completed; its assessment has not been attempted.",
        });
    const timeline = read("student_progress").filter((x) => x.userId === uid);
    const dates = [
      ...timeline.map((x) => x.date.slice(0, 10)),
      ...(p.quizAttempts || []).map((x) => x.date),
      ...(p.simAttempts || []).map((x) => x.date),
    ].sort();
    if (dates.length && dayNumber(today()) - dayNumber(dates.at(-1)) >= 30)
      out.push({
        topic: modules()[0]?.id,
        quizId: modules()[0]?.id,
        priority: "low",
        reason:
          "No recorded assessment or training completion in the last 30 days. A refresher is recommended.",
      });
    return out.filter(
      (x, i, a) => x.quizId && a.findIndex((y) => y.quizId === x.quizId) === i,
    );
  }
  return {
    read,
    write,
    id,
    today,
    dayNumber,
    mean,
    user,
    progress,
    modules,
    title,
    esc,
    button,
    notify,
    meaningful,
    complete,
    results,
    interactiveScore,
    streak,
    achievements,
    weakTopics,
    recommendations,
  };
})();
