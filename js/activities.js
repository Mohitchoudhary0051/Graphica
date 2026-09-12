/* Lightweight interactive learning catalog and reusable activity players. */
const Activities = (() => {
  const T = Training,
    types = {
      video: "Interactive Video",
      flashcards: "Flashcards",
      matching: "Matching",
      hunt: "Hazard Hunt",
      decision: "Decision Challenge",
      escape: "Escape Challenge",
      infographic: "Infographic",
      peer: "Peer Review",
      route: "Map Training",
      poll: "Safety Poll",
      wordcloud: "Word Cloud",
      discussion: "Discussion",
    };
  let active = null,
    state = null,
    root = null,
    videoTimer = null;
  const questions = (topic) =>
    Storage.getData(Storage.KEYS.QUIZZES, {})[topic] || [];
  function catalog() {
    const defaults = [];
    for (const m of T.modules()) {
      for (const type of ["flashcards", "infographic"])
        defaults.push({
          id: type + "-" + m.id,
          type,
          topic: m.id,
          title: m.title + " — " + types[type],
          difficulty: "easy",
          enabled: true,
        });
      if (["fire", "earthquake", "electrical"].includes(m.category))
        for (const type of ["video", "matching", "decision"])
          defaults.push({
            id: type + "-" + m.id,
            type,
            topic: m.id,
            title: m.title + " — " + types[type],
            difficulty: "medium",
            enabled: true,
          });
    }
    ["Classroom", "Laboratory", "Corridor"].forEach((name, i) =>
      defaults.push({
        id: "hunt-" + i,
        type: "hunt",
        topic: "electrical-safety",
        title: name + " Hazard Hunt",
        scene: name,
        difficulty: "medium",
        enabled: true,
      }),
    );
    ["escape", "peer", "route"].forEach((type) => {
      if (type === "escape") {
        // Add escape challenges for all disaster types
        [
          { topic: "fire-safety", title: "Fire Escape Challenge", category: "fire" },
          { topic: "earthquake-safety", title: "Earthquake Escape Challenge", category: "earthquake" },
          { topic: "electrical-safety", title: "Electrical Emergency Escape", category: "electrical" },
          { topic: "flood-safety", title: "Flood Escape Challenge", category: "flood" },
          { topic: "severe-weather", title: "Severe Weather Escape Challenge", category: "weather" },
        ].forEach((esc) =>
          defaults.push({
            id: "escape-" + esc.category,
            type: "escape",
            topic: esc.topic,
            title: esc.title,
            difficulty: "medium",
            enabled: true,
          }),
        );
      } else {
        defaults.push({
          id: type + "-fire",
          type,
          topic: "fire-safety",
          title: {
            peer: "Review a Safety Plan",
            route: "Practice the Route",
          }[type],
          difficulty: "medium",
          enabled: true,
        });
      }
    });
    [
      "Which campus risk is most overlooked?",
      "What should the next drill emphasize?",
      "Which safety topic needs more discussion?",
    ].forEach((prompt, i) =>
      defaults.push({
        id: "poll-" + i,
        type: "poll",
        topic: "fire-safety",
        title: prompt,
        difficulty: "easy",
        enabled: true,
      }),
    );
    [
      "What makes people panic during emergencies?",
      "What helps people stay calm?",
    ].forEach((prompt, i) =>
      defaults.push({
        id: "wordcloud-" + i,
        type: "wordcloud",
        topic: "fire-safety",
        title: prompt,
        difficulty: "easy",
        enabled: true,
      }),
    );
    defaults.push({
      id: "discussion",
      type: "discussion",
      topic: "fire-safety",
      title: "Safety Discussion",
      difficulty: "easy",
      enabled: true,
    });
    const custom = T.read("activities");
    return defaults
      .map((a) => ({ ...a, ...custom.find((c) => c.id === a.id) }))
      .concat(custom.filter((a) => !defaults.some((d) => d.id === a.id)));
  }
  const saved = () =>
    T.read("activity_sessions", {})[T.user().id + ":" + active.id];
  function persist() {
    const rows = T.read("activity_sessions", {});
    rows[T.user().id + ":" + active.id] = state;
    T.write("activity_sessions", rows);
  }
  function cleanup() {
    clearInterval(videoTimer);
    videoTimer = null;
  }
  function hub(container) {
    cleanup();
    container.innerHTML = `<section class="training"><div class="page-header"><h1 class="page-title">GRAPHICA Learning Hub</h1><p class="page-subtitle">Read · interact · decide · practice · apply · measure</p></div><div class="training-filters"><label>Disaster type<select id="hub-topic"><option value="">All disasters</option>${T.modules()
      .map((m) => `<option value="${T.esc(m.id)}">${T.esc(m.title)}</option>`)
      .join(
        "",
      )}</select></label><label>Activity type<select id="hub-type"><option value="">All activities</option><option value="lesson">Lessons</option><option value="quiz">Quizzes</option><option value="simulation">Simulations</option>${Object.entries(
      types,
    )
      .map(([v, t]) => `<option value="${v}">${t}</option>`)
      .join(
        "",
      )}</select></label><label>Difficulty<select id="hub-difficulty"><option value="">All difficulties</option>${["easy", "medium", "hard", "expert"].map((d) => `<option>${d}</option>`).join("")}</select></label><label>Completion<select id="hub-completion"><option value="">All statuses</option><option value="complete">Completed</option><option value="incomplete">Not completed</option></select></label></div><div class="training-grid" id="hub-results"></div></section>`;
    container
      .querySelectorAll("select")
      .forEach((s) => (s.onchange = hubResults));
    hubResults();
  }
  function hubResults() {
    const val = (id) => document.getElementById(id).value,
      p = T.progress(T.user().id),
      r = T.results(T.user().id);
    const all = [
      ...T.modules().map((m) => ({
        id: "lesson-" + m.id,
        topic: m.id,
        title: m.title,
        type: "lesson",
        difficulty: "easy",
        enabled: true,
        route: "learn-" + m.id,
        done: p.modules?.[m.id]?.status === "completed",
      })),
      ...T.modules()
        .filter((m) => questions(m.id).length)
        .map((m) => ({
          id: "quiz-" + m.id,
          topic: m.id,
          title: m.title + " Quiz",
          type: "quiz",
          difficulty: "medium",
          enabled: true,
          route: "quiz-" + m.id,
          done: (p.quizAttempts || []).some((q) => q.quizId === m.id),
        })),
      ...DemoData.simulations.map((s) => ({
        id: s.id,
        topic: s.category + "-safety",
        title: s.title,
        type: "simulation",
        difficulty: "medium",
        enabled: true,
        route: s.id,
        done: (p.simAttempts || []).some((a) => a.simId === s.id),
      })),
      ...catalog().map((a) => ({
        ...a,
        done: r.some((x) => x.activityId === a.id),
      })),
    ];
    document.getElementById("hub-results").innerHTML =
      all
        .filter(
          (a) =>
            a.enabled &&
            (!val("hub-topic") || a.topic === val("hub-topic")) &&
            (!val("hub-type") || a.type === val("hub-type")) &&
            (!val("hub-difficulty") ||
              a.difficulty === val("hub-difficulty")) &&
            (!val("hub-completion") ||
              (val("hub-completion") === "complete") === a.done),
        )
        .map(
          (a) =>
            `<article class="card"><span class="badge badge-neutral">${T.esc(types[a.type] || a.type)}</span><h3>${T.esc(a.title)}</h3><p>${T.esc(a.difficulty)} · ${a.done ? "✓ Completed" : "Not completed"}</p>${a.route ? `<a class="btn btn-secondary" href="#${T.esc(a.route)}">Open</a>` : T.button(a.done ? "Practice again" : "Start activity", "activity-open", a.id)}</article>`,
        )
        .join("") || "<p>No activities match these filters.</p>";
  }
  function open(id, restart = false) {
    cleanup();
    active = catalog().find((a) => a.id === id && a.enabled);
    if (!active) {
      document.getElementById("main-view").innerHTML =
        '<section class="training"><h1>Activity unavailable</h1><p>This activity was disabled or removed.</p><a href="#learn">Return to the Learning Hub</a></section>';
      return;
    }
    root = document.getElementById("main-view");
    state = (!restart && saved()) || {
      startedAt: Date.now(),
      index: 0,
      attempts: 0,
      correct: 0,
      found: [],
      seen: [],
      timeline: [],
      queue: [],
      known: [],
      review: [],
      pairs: [],
      selected: [],
      video: { time: 0, answered: {}, watched: [] },
    };
    if (state.finished && !restart) {
      showResult(state.result, false);
      return;
    }
    persist();
    render();
  }
  function shell(body) {
    root.innerHTML = `<section class="training"><div class="page-header"><a href="#learn">← Learning Hub</a><h1 class="page-title">${T.esc(active.title)}</h1><p class="page-subtitle">Training exercise — follow actual emergency procedures and physical signage in a real emergency.</p></div><div id="activity-body">${body}</div><div id="activity-feedback" class="training-feedback" role="status" aria-live="polite"></div></section>`;
  }
  function feedback(text) {
    const el = document.getElementById("activity-feedback");
    if (el) el.textContent = text;
  }
  function finish(score, details = {}) {
    if (state.finished) return;
    const result = T.complete(active, score, {
      seconds: Math.round((Date.now() - state.startedAt) / 1000),
      ...details,
    });
    state.finished = true;
    state.result = result;
    persist();
    cleanup();
    showResult(result);
  }
  function showResult(r, announce = true) {
    shell(
      `<article class="card"><span class="badge badge-green">✓ Activity complete</span><h2>${r.score}%</h2><p>${r.seconds} seconds · ${T.esc(types[active.type])}</p>${r.found ? `<p>${r.found.length} hazards identified · ${5 - r.found.length} missed</p>` : ""}<p>${r.attempts !== undefined ? `${r.attempts} attempts · ${r.correct ?? 0} correct decisions` : ""}</p><p>Recommended next: ${r.score < 70 ? "Review the lesson before reassessment." : "Test what you learned with the topic quiz."}</p><div class="training-actions">${T.button("Try again", "activity-restart", active.id)}<a class="btn btn-secondary" href="#learn-${T.esc(active.topic)}">Review lesson</a><a class="btn btn-primary" href="#quiz-${T.esc(active.topic)}">Take quiz</a></div></article>`,
    );
    if (announce)
      App.showToast(
        "Activity saved. Preparedness progress updated.",
        "success",
      );
  }
  function render() {
    const renderers = {
      flashcards: renderFlashcard,
      matching: renderMatchingGame,
      hunt: renderHazardHunt,
      decision: renderDecisionChallenge,
      escape: renderDecisionChallenge,
      video: renderInteractiveVideo,
      infographic: renderInfographic,
      peer: renderPeer,
      route: renderRoute,
      poll: renderPoll,
      wordcloud: renderWordCloud,
      discussion: renderDiscussion,
    };
    renderers[active.type]();
  }
  function renderFlashcard() {
    const qs = questions(active.topic);
    if (!qs.length) throw Error("No cards are available for this topic.");
    if (!state.queue.length) {
      state.queue = qs.map((_, i) => i);
      state.familiarity =
        T.read("flashcard_progress", {})[T.user().id + ":" + active.topic] ||
        {};
      state.known = Object.keys(state.familiarity)
        .map(Number)
        .filter((i) => state.familiarity[i] > 0 && i < qs.length);
      state.review = Object.keys(state.familiarity)
        .map(Number)
        .filter((i) => state.familiarity[i] === 0 && i < qs.length);
    }
    const i = state.queue[state.index],
      q = qs[i];
    shell(
      `<article class="card training-flash"><p>GRAPHICA Review Mode · ${state.seen.length} / ${qs.length} cards reviewed</p><p>Known: ${state.known.length} · Needs review: ${state.review.length} · Mastered: ${state.known.filter((i) => (state.familiarity?.[i] || 0) >= 2).length}</p><h2>${T.esc(q.question)}</h2>${state.flipped ? `<div class="training-answer">${T.esc(q.options[q.correct])}<p>${T.esc(q.explanation)}</p></div>` : T.button("Reveal answer", "flash-flip")}<div class="training-actions">${T.button("Previous", "flash-prev", "", state.index === 0 ? "disabled" : "")}${T.button("I know this", "flash-know", "", !state.flipped ? "disabled" : "")}${T.button("Review again", "flash-review", "", !state.flipped ? "disabled" : "")}${T.button("Next", "flash-next", "", !state.seen.includes(i) ? "disabled" : "")}</div><p class="text-small">Cards marked Review again return later in this session. This is a simple familiarity review, not a validated spaced-repetition algorithm.</p></article>`,
    );
    persist();
  }
  function flash(mark) {
    const i = state.queue[state.index];
    if (!state.flipped && ["know", "review"].includes(mark)) return;
    if (mark === "know" || mark === "review") {
      state.seen = [...new Set([...state.seen, i])];
      state.familiarity = state.familiarity || {};
      state.familiarity[i] =
        mark === "know" ? (state.familiarity[i] || 0) + 1 : 0;
      state.known = state.known.filter((x) => x !== i);
      state.review = state.review.filter((x) => x !== i);
      (mark === "know" ? state.known : state.review).push(i);
      if (mark === "review" && !state.queue.slice(state.index + 1).includes(i))
        state.queue.push(i);
      const familiarity = T.read("flashcard_progress", {});
      familiarity[T.user().id + ":" + active.topic] = state.familiarity;
      T.write("flashcard_progress", familiarity);
      state.index++;
    } else if (mark === "next") state.index++;
    else if (mark === "prev") state.index = Math.max(0, state.index - 1);
    else state.flipped = !state.flipped;
    if (mark !== "flip") state.flipped = false;
    persist();
    if (state.index >= state.queue.length)
      finish((state.known.length / questions(active.topic).length) * 100, {
        reviewed: state.seen.length,
        known: state.known.length,
      });
    else renderFlashcard();
  }
  const pairs = [
    ["Earthquake", "Drop, cover and hold on"],
    ["Fire alarm", "Use a safe designated exit"],
    ["Exposed wire", "Keep away and report"],
    ["Flood water", "Avoid entering moving water"],
    ["Assembly point", "Report for accountability"],
    ["Blocked exit", "Report the obstruction"],
  ];
  function renderMatchingGame() {
    if (!state.deck) {
      const offset = active.topic.startsWith("fire")
        ? 0
        : active.topic.startsWith("earthquake")
          ? 1
          : 2;
      state.deck = pairs
        .slice(offset, offset + 4)
        .flatMap((p, i) => p.map((text) => ({ pair: i, text })));
      for (let i = state.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [state.deck[i], state.deck[j]] = [state.deck[j], state.deck[i]];
      }
      persist();
    }
    shell(
      `<p>Match each hazard or situation to its response. ${state.pairs.length} / ${state.deck.length / 2} matched · ${state.attempts} attempts</p><div class="training-grid matching-grid">${state.deck.map((c, i) => T.button(state.pairs.includes(c.pair) ? "✓ " + c.text : c.text, "match", i, `aria-pressed="${state.selected.includes(i)}" ${state.pairs.includes(c.pair) ? "disabled" : ""}`)).join("")}</div>`,
    );
  }
  function match(i) {
    if (state.selected.includes(i) || state.pairs.includes(state.deck[i].pair))
      return;
    state.selected.push(i);
    if (state.selected.length === 2) {
      state.attempts++;
      const [a, b] = state.selected;
      const ok = state.deck[a].pair === state.deck[b].pair;
      if (ok) state.pairs.push(state.deck[a].pair);
      state.selected = [];
      persist();
      if (state.pairs.length === state.deck.length / 2)
        finish((state.pairs.length / state.attempts) * 100, {
          attempts: state.attempts,
          correct: state.pairs.length,
        });
      else {
        renderMatchingGame();
        feedback(
          ok ? "✓ Correct match." : "✕ These cards do not match. Try again.",
        );
      }
    } else {
      persist();
      renderMatchingGame();
    }
  }
  const hazards = [
    {
      name: "Loose electrical wire",
      category: "Electrical",
      priority: "High",
      x: 16,
      y: 71,
    },
    {
      name: "Blocked emergency exit",
      category: "Obstruction",
      priority: "High",
      x: 79,
      y: 47,
    },
    {
      name: "Overloaded socket",
      category: "Electrical",
      priority: "High",
      x: 23,
      y: 36,
    },
    {
      name: "Obstructed extinguisher",
      category: "Emergency Equipment",
      priority: "High",
      x: 61,
      y: 54,
    },
    {
      name: "Wet floor",
      category: "Maintenance",
      priority: "Medium",
      x: 53,
      y: 86,
    },
  ];
  function scene() {
    return `<svg viewBox="0 0 800 430" role="img" aria-label="${T.esc(active.scene || "Classroom")} training scene: inspect the fixtures, floor and exit"><rect width="800" height="430" fill="#f1eee6"/><path d="M0 280H800V430H0Z" fill="#dfd7c8"/><path d="M0 280H800" stroke="#a99b84" stroke-width="3"/><rect x="290" y="35" width="210" height="112" fill="#3c5146"/><text x="320" y="95" fill="white" font-size="22">${T.esc(active.scene || "Safety training")}</text><rect x="610" y="35" width="135" height="248" fill="#a48b6c"/><rect x="635" y="42" width="87" height="32" fill="#38624a"/><text x="647" y="65" fill="white" font-size="22">EXIT</text><rect x="570" y="210" width="132" height="82" fill="#b8956e" stroke="#705b40"/><rect x="670" y="181" width="72" height="111" fill="#b8956e" stroke="#705b40"/><rect x="140" y="110" width="90" height="47" rx="4" fill="white" stroke="#665b4a"/><path d="M155 130v30l35 20 10-35m-20-15v45m30-45v50" stroke="#38342d" stroke-width="6" fill="none"/><rect x="95" y="240" width="170" height="22" fill="#997a55"/><path d="M110 262v70m135-70v70" stroke="#665b4a" stroke-width="8"/><path d="M95 280q40 40 65 10l-20 27m5-3l-10 12m10-12l13 6" fill="none" stroke="#b04b32" stroke-width="5"/><rect x="462" y="172" width="27" height="67" rx="7" fill="#a7352b"/><path d="M467 173v-16h21v15" fill="none" stroke="#31312c" stroke-width="5"/><rect x="430" y="215" width="109" height="70" fill="#b8956e" stroke="#705b40"/><ellipse cx="425" cy="367" rx="71" ry="21" fill="#a4c1ba"/><rect x="46" y="45" width="76" height="82" fill="#d0ded8" stroke="#968871"/><path d="M84 45v82M46 85h76" stroke="#968871"/><rect x="316" y="249" width="78" height="26" fill="#8d795e"/><path d="M325 275v63m60-63v63" stroke="#5a5041" stroke-width="7"/></svg>`;
  }
  function renderHazardHunt() {
    shell(
      `<p>Find five hazards in this ${T.esc((active.scene || "room").toLowerCase())}. ${state.found.length}/5 found · ${state.attempts} inspections</p><div class="training-scene">${scene()}${hazards.map((h, i) => `<button class="scene-hotspot ${state.found.includes(i) ? "found" : ""}" style="left:${h.x}%;top:${h.y}%" data-action="hunt" data-value="${i}" aria-label="Inspect ${["desk wiring", "exit area", "wall socket", "wall equipment", "floor area"][i]}" ${state.found.includes(i) ? "disabled" : ""}>${state.found.includes(i) ? "✓" : "+"}</button>`).join("")}<button class="scene-hotspot" style="left:10%;top:20%" data-action="hunt" data-value="5" aria-label="Inspect window">+</button><button class="scene-hotspot" style="left:44%;top:22%" data-action="hunt" data-value="6" aria-label="Inspect notice board">+</button></div><div class="training-actions">${T.button("Finish inspection", "hunt-finish")}</div><div id="hunt-report"></div>`,
    );
  }
  function hunt(i) {
    if (state.found.includes(i)) return;
    state.attempts++;
    const h = hazards[i];
    if (h) state.found.push(i);
    persist();
    renderHazardHunt();
    feedback(
      h
        ? `✓ ${h.name} identified. ${h.category} · ${h.priority} priority. Keep clear and report to authorized personnel.`
        : "This area is not currently classified as a hazard. Inspect another area.",
    );
    if (h)
      document.getElementById("hunt-report").innerHTML =
        `<p>Would you report this hazard? The form will be marked as a training exercise.</p>${T.button("Report hazard", "hunt-report", i)} ${T.button("Continue", "hunt-continue")}`;
  }
  function decisionSteps() {
    // For escape challenges, map by topic category; for decision challenges, match by topic
    const topicCategory = active.topic.replace('-safety', '').replace('severe-', '');
    const sim = DemoData.simulations.find((s) =>
      active.type === "escape"
        ? s.category === topicCategory || active.topic.startsWith(s.category)
        : active.topic.startsWith(s.category),
    );
    return sim?.steps || DemoData.simulations[0].steps;
  }
  function renderDecisionChallenge() {
    const steps = decisionSteps(),
      step = steps[state.index];
    if (state.recovery && active.type === "decision") {
      shell(
        `<article class="card"><span class="badge badge-amber">Recovery branch</span><h2>Your previous choice changed the situation</h2><p>${T.esc(state.recovery)}</p><p>The group needs a clear correction before continuing. What do you do?</p><div class="training-choices">${T.button("Acknowledge the mistake and follow the safe response: " + step.choices.find((c) => c.correct).text, "decision-recover", "safe")}${T.button("Continue with the original unsafe action", "decision-recover", "unsafe")}</div></article><ol class="training-timeline">${state.timeline.map((e) => `<li>${T.esc(e.time)} — ${T.esc(e.text)}</li>`).join("")}</ol>`,
      );
      return;
    }
    shell(
      `${active.type === "escape" ? `<div class="training-scene compact-scene">${scene()}</div>` : ""}<p>Stage ${state.index + 1} of ${steps.length} · ${state.attempts - state.correct} mistakes</p><article class="card"><p>${T.esc(step.narrative)}</p>${state.recovery ? `<div class="training-answer"><strong>Recovery branch</strong><p>${T.esc(state.recovery)}</p><p>You must correct this decision before proceeding.</p></div>` : ""}<h2>${T.esc(step.question)}</h2><div class="training-choices">${step.choices.map((c, i) => T.button(c.text, "decision", i)).join("")}</div></article><ol class="training-timeline">${state.timeline.map((e) => `<li>${T.esc(e.time)} — ${T.esc(e.text)}</li>`).join("")}</ol>`,
    );
  }
  function decide(i) {
    const step = decisionSteps()[state.index],
      choice = step.choices[i];
    if (!choice) return;
    state.attempts++;
    state.timeline.push({
      time: new Date().toLocaleTimeString(),
      text: choice.text,
    });
    if (choice.correct) {
      state.correct++;
      state.index++;
      state.recovery = null;
    } else state.recovery = choice.feedback;
    persist();
    if (state.index === decisionSteps().length)
      finish((state.correct / state.attempts) * 100, {
        attempts: state.attempts,
        correct: state.correct,
        criticalMistakes: state.attempts - state.correct,
        timeline: state.timeline,
      });
    else {
      renderDecisionChallenge();
      feedback(choice.feedback);
    }
  }
  function renderInteractiveVideo() {
    const v = state.video,
      qs = questions(active.topic).slice(0, 2);
    shell(
      `<article class="card"><p>Local silent demo lesson. Read the on-screen guidance and complete the checkpoints.</p><video id="training-video" controls preload="metadata" playsinline aria-label="${T.esc(active.title)}"><source src="assets/${active.topic}.webm" type="video/webm"><track default kind="captions" src="assets/${active.topic}.vtt" srclang="en" label="English"></video><div class="training-actions">${T.button("Play / resume lesson", "video-play")}<span>00:04 Question → 00:09 Safety note → 00:14 Decision → 00:18 End</span></div><div id="video-progress" role="status"></div><div id="video-checkpoint"></div><details><summary>Text transcript</summary>${(T.modules().find((m) => m.id === active.topic)?.during || []).map((x) => `<p>${T.esc(x)}</p>`).join("")}</details></article>`,
    );
    const el = document.getElementById("training-video");
    let last = 0;
    el.onloadedmetadata = () => {
      el.currentTime = Math.min(v.time || 0, el.duration);
      last = el.currentTime;
      updateVideo();
    };
    el.onplay = () => {
      v.started = true;
      persist();
      updateVideo();
    };
    el.ontimeupdate = () => {
      if (
        !el.seeking &&
        el.currentTime >= last &&
        el.currentTime - last < 1.5 &&
        !el.paused
      ) {
        for (let n = Math.floor(last); n < Math.floor(el.currentTime); n++)
          v.watched = [...new Set([...v.watched, n])];
      }
      last = el.currentTime;
      v.time = el.currentTime;
      updateVideo();
    };
    el.onseeking = () => {
      last = el.currentTime;
      updateVideo();
    };
    el.onended = () => {
      v.ended = true;
      if (v.watched.includes(16)) v.watched = [...new Set([...v.watched, 17])];
      persist();
      updateVideo();
    };
    el.onerror = () =>
      feedback(
        "Video could not load. Read the transcript and retry playback. Completion is not awarded without playback and checkpoints.",
      );
    function updateVideo() {
      const checkpoint = [4, 9, 14].findIndex(
        (time, i) => el.currentTime >= time && !v.answered[i],
      );
      if (checkpoint >= 0) {
        el.pause();
        showCheckpoint(checkpoint, qs);
      } else document.getElementById("video-checkpoint").innerHTML = "";
      const watched = Math.min(100, Math.round((v.watched.length / 18) * 100));
      document.getElementById("video-progress").textContent =
        `Video watched: ${watched}% · Questions: ${[0, 2].filter((i) => v.answered[i]).length}/2 · Safety prompts: ${v.answered[1] ? 1 : 0}/1`;
      persist();
      if (
        v.ended &&
        v.watched.length >= 18 &&
        Object.keys(v.answered).length === 3
      )
        finish(([0, 2].filter((i) => v.answered[i].correct).length / 2) * 100, {
          videoWatched: watched,
          interactions: 3,
        });
    }
  }
  function showCheckpoint(i, qs) {
    const panel = document.getElementById("video-checkpoint");
    if (panel.dataset.index === String(i) && panel.innerHTML) return;
    panel.dataset.index = i;
    if (i === 1) {
      panel.innerHTML = `<h3>Safety note</h3><p>${T.esc((T.modules().find((m) => m.id === active.topic)?.during || [])[0] || "Follow institutional emergency procedures.")}</p>${T.button("I have read this · continue", "video-note")}`;
    } else {
      const q = qs[i === 0 ? 0 : 1];
      panel.innerHTML = `<h3>${T.esc(q.question)}</h3><div class="training-choices">${q.options.map((o, n) => T.button(o, "video-answer", i + "|" + n)).join("")}</div>`;
    }
  }
  function videoAnswer(value) {
    const [i, n] = value.split("|").map(Number),
      q = questions(active.topic)[i === 0 ? 0 : 1];
    if (state.video.answered[i]) return;
    state.video.answered[i] = { answer: n, correct: n === q.correct };
    persist();
    document.getElementById("video-checkpoint").innerHTML =
      `<p>${n === q.correct ? "✓ Correct" : "✕ Review"} — ${T.esc(q.explanation)}</p>${T.button("Continue video", "video-play")}`;
  }
  function renderInfographic() {
    const m = T.modules().find((m) => m.id === active.topic);
    const parts =
      active.topic === "fire-safety"
        ? [
            ["Safety pin", "Prevents accidental activation."],
            ["Handle", "Operates the extinguisher when squeezed."],
            ["Hose", "Directs the discharge."],
            [
              "Nozzle",
              "Points discharge toward the fire base. Only trained users should attempt use when safe.",
            ],
          ]
        : m.during.slice(0, 5).map((text, i) => ["Step " + (i + 1), text]);
    state.parts = parts;
    shell(
      `<article class="card">${active.topic === "fire-safety" ? '<svg class="extinguisher" viewBox="0 0 200 230" role="img" aria-label="Simplified extinguisher with safety pin, handle, hose and nozzle"><rect x="65" y="60" width="70" height="150" rx="18" fill="#ac3c2f"/><path d="M90 60V35h45M80 38h45M140 45q55 15 25 100l-10 20" fill="none" stroke="#403e36" stroke-width="9"/><circle cx="78" cy="45" r="12" fill="none" stroke="#b19135" stroke-width="5"/><rect x="72" y="112" width="56" height="46" fill="#f4ede0"/></svg>' : ""}<p>Select every component / step to explore its purpose.</p><div class="training-actions">${parts.map(([label], i) => T.button((state.seen.includes(i) ? "✓ " : "") + label, "info", i)).join("")}</div><div id="info-detail" class="training-answer">Choose a component above.</div>${T.button("Complete exploration", "info-finish", "", state.seen.length < parts.length ? "disabled" : "")}</article>`,
    );
  }
  const plan = [
    "Use the elevator during a fire.",
    "Wait in the classroom even when a safe exit is available.",
    "Exit only after the smoke clears.",
    "Report to the designated assembly point for accountability.",
  ];
  function renderPeer() {
    shell(
      `<article class="card"><h2>Fictional fire evacuation plan</h2><p>Select every unsafe instruction.</p>${plan.map((text, i) => `<label class="training-option"><input type="checkbox" data-peer="${i}" ${state.selected.includes(i) ? "checked" : ""}>${T.esc(text)}</label>`).join("")}${T.button("Review plan", "peer-submit")}</article>`,
    );
    root.querySelectorAll("[data-peer]").forEach(
      (el) =>
        (el.onchange = () => {
          const i = +el.dataset.peer;
          state.selected = state.selected.filter((x) => x !== i);
          if (el.checked) state.selected.push(i);
          persist();
        }),
    );
  }
  const route = [
    "Room 204",
    "Corridor",
    "Staircase",
    "Designated exit",
    "Assembly point",
  ];
  function renderRoute() {
    shell(
      `<p>You are in Block A, Room 204. Find a safe route to the assembly point. This is a fictional training map and does not replace real signs.</p><div class="training-route"><div class="training-grid">${[...route, "Elevator", "Restricted corridor"].map((n, i) => T.button((state.seen.includes(i) ? "✓ " : "") + n, "route", i, `aria-pressed="${state.seen.includes(i)}"`)).join("")}</div></div><ol class="training-timeline">${state.seen.map((i) => `<li>${route[i]}</li>`).join("")}</ol>`,
    );
  }
  function renderPoll() {
    const options = [
        "Electrical hazards",
        "Blocked exits",
        "Fire equipment",
        "Evacuation awareness",
        "Other",
      ],
      votes = T.read("poll_votes").filter((v) => v.activityId === active.id),
      voted = votes.some((v) => v.userId === T.user().id);
    shell(
      `<article class="card"><h2>${T.esc(active.title)}</h2><p>Current browser results — ${votes.length} local vote(s). These are not institution-wide live statistics.</p>${options.map((o, i) => (voted ? `<div class="training-bar"><span>${o}</span><progress max="100" value="${votes.length ? (votes.filter((v) => v.option === i).length / votes.length) * 100 : 0}"></progress><strong>${votes.length ? Math.round((votes.filter((v) => v.option === i).length / votes.length) * 100) : 0}%</strong></div>` : T.button(o, "poll", i))).join("")}</article>`,
    );
  }
  function renderWordCloud() {
    const rows = T.read("wordcloud_entries").filter(
        (r) => r.activityId === active.id,
      ),
      freq = {};
    rows.forEach((r) => (freq[r.text] = (freq[r.text] || 0) + 1));
    shell(
      `<article class="card"><p>Local browser contributions only. Larger text means more local mentions.</p><form id="word-form"><label>Short word or phrase<input name="word" maxlength="40" required></label><button class="btn btn-primary">Add phrase</button></form><div class="training-cloud">${
        Object.entries(freq)
          .map(
            ([text, n]) =>
              `<span style="font-size:${Math.min(36, 14 + n * 4)}px">${T.esc(text)} <small>(${n})</small></span>`,
          )
          .join("") || "<p>No phrases yet.</p>"
      }</div></article>`,
    );
    document.getElementById("word-form").onsubmit = (e) => {
      e.preventDefault();
      const text = new FormData(e.target).get("word").trim().toLowerCase();
      if (!text) return;
      const entries = T.read("wordcloud_entries");
      entries.push({
        id: T.id(),
        activityId: active.id,
        userId: T.user().id,
        text,
      });
      T.write("wordcloud_entries", entries);
      if (!T.results(T.user().id).some((r) => r.activityId === active.id))
        T.complete(active, 100);
      renderWordCloud();
    };
  }
  function seedDiscussions() {
    if (Storage.hasData("graphica_discussions")) return;
    T.write(
      "discussions",
      [
        "Where can I confirm the assembly point for Block B?",
        "How should a blocked exit be reported?",
        "Who checks fire equipment on campus?",
        "What should I bring to a scheduled drill?",
        "Where are electrical hazards reported?",
      ].map((message, i) => ({
        id: T.id(),
        name: "Demo participant " + (i + 1),
        topic: T.modules()[i].id,
        message,
        date: new Date().toISOString(),
        demo: true,
        replies: [],
        helpful: [],
        reports: [],
      })),
    );
  }
  function renderDiscussion() {
    seedDiscussions();
    shell(
      `<p>Demo discussion board — local browser data only. Confirm location-specific advice with authorized campus staff.</p><div class="training-filters"><label>Search<input id="discussion-search" type="search"></label><label>Topic<select id="discussion-topic"><option value="">All</option>${T.modules()
        .map((m) => `<option value="${m.id}">${T.esc(m.title)}</option>`)
        .join(
          "",
        )}<option value="evacuation">Evacuation</option><option value="general">General Safety</option></select></label></div><form id="discussion-form" class="card"><label>Name<input name="name" required maxlength="80" value="${T.esc(T.user().name)}"></label><label>Topic<select name="topic">${T.modules()
        .map((m) => `<option value="${m.id}">${T.esc(m.title)}</option>`)
        .join(
          "",
        )}<option value="evacuation">Evacuation</option><option value="general">General Safety</option></select></label><label>Question / message<textarea name="message" required maxlength="600"></textarea></label><button class="btn btn-primary">Post</button></form><div id="discussion-posts"></div>`,
    );
    document.getElementById("discussion-form").onsubmit = (e) => {
      e.preventDefault();
      const data = new FormData(e.target);
      const message = data.get("message").trim();
      if (!message) return;
      const rows = T.read("discussions");
      rows.push({
        id: T.id(),
        userId: T.user().id,
        name: data.get("name").trim(),
        topic: data.get("topic"),
        message,
        date: new Date().toISOString(),
        replies: [],
        helpful: [],
        reports: [],
      });
      T.write("discussions", rows);
      if (!T.results(T.user().id).some((r) => r.activityId === active.id))
        T.complete(active, 100);
      renderDiscussion();
    };
    root
      .querySelectorAll(".training-filters input,.training-filters select")
      .forEach((el) => (el.oninput = discussionPosts));
    discussionPosts();
  }
  function discussionPosts() {
    const search = document
        .getElementById("discussion-search")
        .value.toLowerCase(),
      topic = document.getElementById("discussion-topic").value;
    document.getElementById("discussion-posts").innerHTML =
      T.read("discussions")
        .filter(
          (p) =>
            (!topic || p.topic === topic) &&
            (p.message + " " + p.name).toLowerCase().includes(search),
        )
        .reverse()
        .map(
          (p) =>
            `<article class="card"><strong>${T.esc(p.name)}${p.demo ? " · Demo" : ""}</strong><p class="text-small">${T.esc(T.title(p.topic))} · ${T.esc(p.date.slice(0, 10))}</p><p>${T.esc(p.message)}</p>${(p.replies || []).map((r) => `<blockquote><strong>${T.esc(r.name)}</strong> ${T.esc(r.message)}</blockquote>`).join("")}<div class="training-actions">${T.button("Reply", "discussion-reply", p.id)}${T.button("Helpful (" + p.helpful.length + ")", "discussion-helpful", p.id)}${T.button(p.reports.includes(T.user().id) ? "Reported" : "Report inappropriate content", "discussion-report", p.id)}</div></article>`,
        )
        .join("") || "<p>No matching discussions.</p>";
  }
  function discussionAction(action, id) {
    const rows = T.read("discussions"),
      p = rows.find((p) => p.id === id);
    if (!p) return;
    if (action === "reply") {
      App.showModal({
        title: "Reply",
        body: `<form id="reply-form" class="training"><label>Reply<textarea name="message" maxlength="600" required></textarea></label><button class="btn btn-primary">Post reply</button></form>`,
      });
      document.getElementById("reply-form").onsubmit = (e) => {
        e.preventDefault();
        const message = new FormData(e.target).get("message").trim();
        if (!message) return;
        p.replies.push({
          name: T.user().name,
          userId: T.user().id,
          message,
          date: new Date().toISOString(),
        });
        T.write("discussions", rows);
        App.closeModal();
        discussionPosts();
      };
    } else {
      const field = action === "helpful" ? "helpful" : "reports";
      p[field] = [...new Set([...p[field], T.user().id])];
      T.write("discussions", rows);
      discussionPosts();
    }
  }
  function management(container) {
    if (!Auth.isAdmin()) throw Error("Administrator access required.");
    container.innerHTML = `<section class="training"><h1 class="page-title">Activity management</h1><p>Create configured activities using the existing reusable players and topic content.</p>${T.button("Create activity", "activity-edit")}<div class="table-container"><table class="data-table"><thead><tr><th>Activity</th><th>Type / difficulty</th><th>Completions / average</th><th>Actions</th></tr></thead><tbody>${catalog()
      .map((a) => {
        const rs = T.read("activity_progress").filter(
          (r) => r.activityId === a.id,
        );
        return `<tr><td>${T.esc(a.title)}</td><td>${types[a.type]} / ${T.esc(a.difficulty)}</td><td>${new Set(rs.map((r) => r.userId)).size} students / ${T.mean(rs.map((r) => r.score)) ?? "—"}%</td><td>${T.button("Edit", "activity-edit", a.id)}${T.button(a.enabled ? "Disable" : "Enable", "activity-toggle", a.id)}</td></tr>`;
      })
      .join("")}</tbody></table></div></section>`;
  }
  function edit(id) {
    if (!Auth.isAdmin()) throw Error("Administrator access required.");
    const a = catalog().find((a) => a.id === id) || {};
    App.showModal({
      title: a.id ? "Edit activity" : "Create activity",
      body: `<form class="training" id="activity-form"><label>Title<input name="title" required maxlength="120" value="${T.esc(a.title || "")}"></label><label>Type<select name="type">${Object.entries(
        types,
      )
        .map(
          ([k, v]) =>
            `<option value="${k}" ${a.type === k ? "selected" : ""}>${v}</option>`,
        )
        .join(
          "",
        )}</select></label><label>Disaster topic<select name="topic">${T.modules()
        .map(
          (m) =>
            `<option value="${m.id}" ${a.topic === m.id ? "selected" : ""}>${T.esc(m.title)}</option>`,
        )
        .join(
          "",
        )}</select></label><label>Difficulty<select name="difficulty">${["easy", "medium", "hard", "expert"].map((x) => `<option ${a.difficulty === x ? "selected" : ""}>${x}</option>`).join("")}</select></label><p>Players reuse the selected topic's questions and lesson content. Videos are available for Fire, Earthquake and Electrical Safety.</p><button class="btn btn-primary">Save</button></form>`,
    });
    document.getElementById("activity-form").onsubmit = (e) => {
      e.preventDefault();
      if (!Auth.isAdmin()) return;
      const v = Object.fromEntries(new FormData(e.target));
      if (
        v.type === "video" &&
        !["fire-safety", "earthquake-safety", "electrical-safety"].includes(
          v.topic,
        )
      ) {
        App.showToast("Choose a topic with a local video.", "error");
        return;
      }
      const rows = T.read("activities").filter((x) => x.id !== a.id);
      rows.push({
        ...a,
        ...v,
        id: a.id || T.id(),
        enabled: a.enabled !== false,
      });
      T.write("activities", rows);
      App.closeModal();
      management(document.getElementById("main-view"));
    };
  }
  function handle(action, value) {
    if (action === "activity-open") {
      App.navigateTo("activity-" + value);
      return true;
    }
    if (action === "activity-restart") {
      open(value, true);
      return true;
    }
    if (action === "activity-edit") {
      edit(value);
      return true;
    }
    if (action === "activity-toggle") {
      if (!Auth.isAdmin()) throw Error("Administrator access required.");
      const a = catalog().find((a) => a.id === value),
        rows = T.read("activities").filter((x) => x.id !== value);
      rows.push({ ...a, enabled: !a.enabled });
      T.write("activities", rows);
      management(document.getElementById("main-view"));
      return true;
    }
    if (!active) return false;
    if (action.startsWith("flash-")) flash(action.slice(6));
    else if (action === "match") match(+value);
    else if (action === "hunt") hunt(+value);
    else if (action === "hunt-finish") {
      if (!state.attempts) {
        feedback("Inspect at least one area first.");
        return true;
      }
      finish((state.found.length / Math.max(5, state.attempts)) * 100, {
        found: state.found,
        attempts: state.attempts,
        correct: state.found.length,
      });
    } else if (action === "hunt-continue") {
      if (state.found.length === 5)
        finish((5 / state.attempts) * 100, {
          found: state.found,
          attempts: state.attempts,
          correct: 5,
        });
      else renderHazardHunt();
    } else if (action === "hunt-report") {
      const h = hazards[+value];
      T.write("hazard_training_draft", {
        userId: T.user().id,
        category: h.category,
        title: "[Training exercise] " + h.name,
      });
      App.navigateTo("report-hazard");
    } else if (action === "decision") decide(+value);
    else if (action === "decision-recover") {
      state.attempts++;
      if (value === "safe") {
        state.correct++;
        state.index++;
        state.recovery = null;
        state.timeline.push({
          time: new Date().toLocaleTimeString(),
          text: "Corrected the unsafe action and followed the safe response.",
        });
      } else
        state.timeline.push({
          time: new Date().toLocaleTimeString(),
          text: "Continued unsafe action; correction still needed.",
        });
      persist();
      if (state.index === decisionSteps().length)
        finish((state.correct / state.attempts) * 100, {
          attempts: state.attempts,
          correct: state.correct,
          criticalMistakes: state.attempts - state.correct,
          timeline: state.timeline,
        });
      else renderDecisionChallenge();
    } else if (action === "video-answer") videoAnswer(value);
    else if (action === "video-note") {
      state.video.answered[1] = { correct: true };
      persist();
      document.getElementById("video-checkpoint").innerHTML = "";
      document
        .getElementById("training-video")
        .play()
        .catch(() => feedback("Press play to continue."));
    } else if (action === "video-play") {
      const el = document.getElementById("training-video");
      document.getElementById("video-checkpoint").dataset.index = "";
      el.play().catch(() =>
        feedback(
          "Playback could not start. Check that the local video file is available.",
        ),
      );
    } else if (action === "info") {
      const i = +value;
      state.seen = [...new Set([...state.seen, i])];
      persist();
      renderInfographic();
      document.getElementById("info-detail").textContent =
        state.parts[i].join(" — ");
    } else if (action === "info-finish") {
      if (state.seen.length === state.parts.length) finish(100);
    } else if (action === "peer-submit") {
      const correct = [0, 1, 2, 3].filter(
        (i) => i < 3 === state.selected.includes(i),
      ).length;
      finish((correct / 4) * 100, { correct, attempts: 4 });
      feedback(
        "Unsafe: instructions 1, 2 and 3. Use a safe designated exit promptly; report to the assembly point.",
      );
    } else if (action === "route") {
      const i = +value;
      state.attempts++;
      if (i === state.seen.length && i < 5) {
        state.seen.push(i);
        persist();
        if (state.seen.length === 5)
          finish((5 / state.attempts) * 100, {
            correct: 5,
            attempts: state.attempts,
          });
        else {
          renderRoute();
          feedback("✓ Safe next step.");
        }
      } else {
        persist();
        feedback(
          i >= 5
            ? "This route is restricted or uses an elevator. Choose a designated safe route."
            : "Choose the next connected location in order.",
        );
      }
    } else if (action === "poll") {
      const rows = T.read("poll_votes");
      if (
        !rows.some(
          (r) => r.activityId === active.id && r.userId === T.user().id,
        )
      ) {
        rows.push({
          activityId: active.id,
          userId: T.user().id,
          option: +value,
        });
        T.write("poll_votes", rows);
        T.complete(active, 100);
      }
      renderPoll();
    } else if (action.startsWith("discussion-"))
      discussionAction(action.slice(11), value);
    else return false;
    return true;
  }
  return {
    catalog,
    hub,
    open,
    cleanup,
    handle,
    management,
    renderFlashcard,
    renderMatchingGame,
    renderInteractiveVideo,
    renderHazardHunt,
    renderDecisionChallenge,
    renderPoll,
    renderWordCloud,
    renderDiscussion,
  };
})();
