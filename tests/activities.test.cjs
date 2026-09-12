/* State-transition and persistence tests with a minimal DOM adapter, not a visual browser test. */
const vm = require("node:vm"),
  fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const memory = new Map(),
  nodes = new Map();
const element = () => ({
  innerHTML: "",
  textContent: "",
  value: "",
  dataset: {},
  duration: 18,
  currentTime: 0,
  paused: true,
  seeking: false,
  querySelectorAll: () => [],
  play() {
    this.paused = false;
    this.onplay?.();
    return Promise.resolve();
  },
  pause() {
    this.paused = true;
  },
  insertAdjacentHTML() {},
  append() {},
  classList: { add() {}, remove() {} },
});
const document = {
  getElementById: (id) => {
    if (!nodes.has(id)) nodes.set(id, element());
    return nodes.get(id);
  },
  querySelectorAll: () => [],
  createElement: element,
};
const ctx = vm.createContext({
  console,
  Date,
  Math,
  Set,
  Map,
  crypto: require("node:crypto").webcrypto,
  clearInterval,
  document,
  localStorage: {
    getItem: (k) => memory.get(k) ?? null,
    setItem: (k, v) => memory.set(k, v),
    removeItem: (k) => memory.delete(k),
  },
  App: {
    escapeHtml: (s) => String(s),
    showToast() {},
    navigateTo() {},
    refreshIcons() {},
    showModal() {},
    closeModal() {},
  },
});
for (const file of [
  "storage",
  "data",
  "auth",
  "dashboard",
  "training",
  "activities",
  "assignments",
  "training-ui",
]) {
  let s = fs.readFileSync(path.join(__dirname, "../js", file + ".js"), "utf8");
  if (file === "activities")
    s = s.replace(
      /return\s*\{\s*catalog,/,
      "return {snapshot:()=>JSON.parse(JSON.stringify(state)),catalog,",
    );
  vm.runInContext(s, ctx);
}
const run = (s) => vm.runInContext(s, ctx);
run(
  'DemoData.initializeDemoData();Auth.login("student@graphica.demo","demo123")',
);
run(
  'Activities.open("flashcards-fire-safety",true);Activities.handle("flash-flip","");Activities.handle("flash-review","")',
);
assert.equal(run("Activities.snapshot().review.length"), 1);
assert(
  run("Activities.snapshot().queue.length") >
    run('Storage.getData(Storage.KEYS.QUIZZES)["fire-safety"].length'),
);
run('Activities.open("flashcards-fire-safety")');
assert.equal(run("Activities.snapshot().index"), 1);
for (let i = 0; i < 8 && !run("Activities.snapshot().finished"); i++)
  run('Activities.handle("flash-flip","");Activities.handle("flash-know","")');
assert.equal(run("Activities.snapshot().finished"), true);
run('Activities.open("matching-fire-safety",true)');
while (!run("Activities.snapshot().finished")) {
  const state = run("Activities.snapshot()");
  const p = state.deck.find((c) => !state.pairs.includes(c.pair)).pair;
  const inds = state.deck
    .map((c, i) => (c.pair === p ? i : -1))
    .filter((i) => i >= 0);
  run(
    `Activities.handle('match','${inds[0]}');Activities.handle('match','${inds[1]}')`,
  );
}
assert.equal(run("Activities.snapshot().result.score"), 100);
run(
  'Activities.open("hunt-0",true);Activities.handle("hunt","5");Activities.handle("hunt","0");Activities.handle("hunt-report","0")',
);
assert.equal(
  run('Training.read("hazard_training_draft").category'),
  "Electrical",
);
for (let i = 1; i < 5; i++) run(`Activities.handle('hunt','${i}')`);
run('Activities.handle("hunt-continue","")');
assert.equal(run("Activities.snapshot().result.score"), 83);
run(
  'Activities.open("decision-fire-safety",true);Activities.handle("decision","1")',
);
assert(run("!!Activities.snapshot().recovery"));
run('Activities.handle("decision-recover","safe")');
assert.equal(run("Activities.snapshot().index"), 1);
run('Activities.open("route-fire",true);Activities.handle("route","5")');
for (let i = 0; i < 5; i++) run(`Activities.handle('route','${i}')`);
assert.equal(run("Activities.snapshot().result.score"), 83);
run(
  'Activities.open("poll-0",true);Activities.handle("poll","0");Activities.handle("poll","1")',
);
assert.equal(run('Training.read("poll_votes").length'), 1);
run(
  'Activities.open("infographic-fire-safety",true);Activities.handle("info-finish","")',
);
assert(!run("Activities.snapshot().finished"));
for (let i = 0; i < 4; i++) run(`Activities.handle('info','${i}')`);
run('Activities.handle("info-finish","")');
assert.equal(run("Activities.snapshot().result.score"), 100);
run('Activities.open("video-fire-safety",true)');
const video = document.getElementById("training-video");
video.onloadedmetadata();
video.play();
video.currentTime = 4;
video.ontimeupdate();
assert(video.paused);
assert(!run("Activities.snapshot().finished"));
run('Activities.handle("video-answer","0|1")');
video.currentTime = 18;
video.onended();
assert(!run("Activities.snapshot().finished"));
run(
  'Activities.handle("video-note","");Activities.handle("video-answer","2|2")',
);
assert(!run("Activities.snapshot().finished"));
video.currentTime = 0;
video.onseeking();
video.play();
for (let n = 1; n <= 18; n++) {
  video.currentTime = n;
  video.ontimeupdate();
}
video.onended();
assert.equal(run("Activities.snapshot().finished"), true);
assert.equal(run("Activities.snapshot().result.interactions"), 3);
const before = run('Training.results("user-001").length');
run('Activities.open("video-fire-safety")');
assert.equal(run('Training.results("user-001").length'), before);
assert.equal(run(`Training.esc('\" onfocus=\"x')`), "&quot; onfocus=&quot;x");
run(
  'TrainingUI.handle("daily-answer","0");TrainingUI.handle("daily-answer","1")',
);
assert.equal(run('Training.read("daily_quiz").length'), 1);
run('Auth.login("staff@graphica.demo","demo123")');
assert.throws(
  () => run('Activities.management(document.getElementById("main-view"))'),
  /Administrator/,
);
console.log(
  "PASS: flashcard requeue/resume, matching, hazard accuracy/report draft, recovery branch, route errors, poll deduplication, infographic gating, video seek/completion gates, result deduplication, HTML escaping, daily deduplication, admin restriction",
);
