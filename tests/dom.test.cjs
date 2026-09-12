/* Optional DOM integration suite: npm install --prefix /tmp/graphica-test-tools jsdom
   GRAPHICA_TEST_MODULES=/tmp/graphica-test-tools/node_modules node tests/dom.test.cjs
   This verifies DOM interactions, not browser rendering or actual media playback. */
const { JSDOM } = require(
  require("node:path").join(
    process.env.GRAPHICA_TEST_MODULES ||
      "/tmp/graphica-test-tools/node_modules",
    "jsdom",
  ),
);
const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm"),
  assert = require("node:assert/strict");
const base = path.join(__dirname, ".."),
  html = fs.readFileSync(path.join(base, "index.html"), "utf8");
const dom = new JSDOM(html.replace(/<script[\s\S]*?<\/script>/g, ""), {
    url: "http://localhost/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
  }),
  w = dom.window,
  d = w.document,
  errors = [];
w.scrollTo = () => {};
w.addEventListener("error", (e) => errors.push(e.error?.stack || e.message));
w.HTMLMediaElement.prototype.play = function () {
  this.onplay?.();
  return Promise.resolve();
};
w.HTMLMediaElement.prototype.pause = function () {};
const run = (s) => vm.runInContext(s, dom.getInternalVMContext());
for (const [, src] of html.matchAll(/<script src="(js\/[^\"]+)"/g))
  run(fs.readFileSync(path.join(base, src), "utf8"));
const tick = () => new Promise((r) => setTimeout(r, 10));
const click = (s) => {
  const el = d.querySelector(s);
  assert(el, "Missing " + s);
  el.click();
};
const route = async (r) => {
  w.location.hash = "#" + r;
  await tick();
  assert(!errors.length, errors.join("\n"));
};
(async () => {
  await tick();
  run('Auth.login("student@graphica.demo","demo123")');
  await route("dashboard");
  assert(d.querySelector("#daily-safety"));
  for (const r of [
    "learn",
    "progress",
    "drills",
    "evacuation-map",
    "activity-flashcards-fire-safety",
    "activity-matching-fire-safety",
    "activity-hunt-0",
    "activity-decision-fire-safety",
    "activity-escape-fire",
    "activity-infographic-fire-safety",
    "activity-peer-fire",
    "activity-route-fire",
    "activity-poll-0",
    "activity-wordcloud-0",
    "activity-discussion",
    "activity-video-fire-safety",
  ]) {
    await route(r);
    assert(d.querySelector("#main-view").textContent.trim().length > 20, r);
  }
  await route("activity-discussion");
  d.querySelector('#discussion-form [name="message"]').value =
    "<img src=x onerror=alert(1)> Test message";
  click("#discussion-form button");
  assert(!d.querySelector("#discussion-posts img"));
  assert(d.querySelector("#discussion-posts").textContent.includes("<img"));
  click('[data-action="discussion-reply"]');
  d.querySelector("#reply-form textarea").value = "Test reply";
  click("#reply-form button");
  assert(
    d.querySelector("#discussion-posts").textContent.includes("Test reply"),
  );
  click('[data-action="discussion-helpful"]');
  click('[data-action="discussion-report"]');
  await route("activity-wordcloud-0");
  d.querySelector("#word-form input").value = "confusion";
  click("#word-form button");
  assert(d.querySelector(".training-cloud").textContent.includes("confusion"));
  await route("activity-peer-fire");
  for (const cb of d.querySelectorAll("[data-peer]"))
    if (+cb.dataset.peer < 3) {
      cb.checked = true;
      cb.dispatchEvent(new w.Event("change"));
    }
  click('[data-action="peer-submit"]');
  assert(d.querySelector("#main-view").textContent.includes("100%"));
  await route("activity-hunt-0");
  click('[data-action="hunt"][data-value="0"]');
  click('[data-action="hunt-report"]');
  await tick();
  assert.equal(d.querySelector("#hazard-category").value, "Electrical");
  assert(
    d.querySelector("#hazard-title").value.startsWith("[Training exercise]"),
  );
  await route("drills");
  click('[data-action="drill-reflect"]');
  d.querySelector('[name="participated"]').checked = true;
  d.querySelector('[name="improvement"]').value = "Clearer instructions";
  click("#reflection-form button");
  assert(
    d.querySelector("#main-view").textContent.includes("Reflection saved"),
  );
  run("Auth.logout()");
  await route("login");
  run('Auth.login("staff@graphica.demo","demo123")');
  await route("assignments");
  click('[data-action="assign-new"]');
  d.querySelector('[name="students"]').value = "user-001";
  click('#assign-form button[type="submit"]');
  assert.equal(run("Assignments.getAssignmentAnalytics().assigned"), 1);
  click('[data-action="student-profile"]');
  assert(
    d
      .querySelector("#modal-container")
      .textContent.includes("Student Safety Profile"),
  );
  run("App.closeModal()");
  await route("training-analytics");
  run("Auth.logout()");
  await route("login");
  run('Auth.login("student@graphica.demo","demo123")');
  await route("assignments");
  click('[data-action="assignment-detail"]');
  click('[data-action="assignment-start"]');
  click(".quiz-option");
  click("#submit-btn");
  await route("dashboard");
  await route("assignments");
  click('[data-action="assignment-detail"]');
  click('[data-action="assignment-start"]');
  assert(d.querySelector(".quiz-explanation"));
  const count = run(
    'Storage.getData(Storage.KEYS.QUIZZES)["fire-safety"].length',
  );
  for (let i = 0; i < count; i++) {
    if (d.querySelector("#submit-btn")) {
      click(".quiz-option");
      click("#submit-btn");
    }
    click(".quiz-actions .btn-primary");
  }
  assert(d.querySelector("#main-view").textContent.includes("Quiz results"));
  assert.equal(
    run('Assignments.getStudentAssignments("user-001")[0].attemptsUsed'),
    1,
  );
  assert.equal(run('Training.read("assignment_results").length'), 1);
  assert(run('Training.recommendations("user-001").length') > 0);
  run("Auth.logout()");
  await route("login");
  run('Auth.login("admin@graphica.demo","demo123")');
  await route("assignments");
  click('[data-action="quiz-bank"]');
  d.querySelector('#bank-form [name="question"]').value = "Test bank question";
  for (let i = 0; i < 4; i++)
    d.querySelector('#bank-form [name="option' + i + '"]').value =
      "Option " + i;
  d.querySelector('#bank-form [name="explanation"]').value = "Test explanation";
  click("#bank-form button");
  assert(
    run(
      'Storage.getData(Storage.KEYS.QUIZZES)["fire-safety"].some(q=>q.question==="Test bank question")',
    ),
  );
  run("App.closeModal()");
  await route("activity-management");
  click('[data-action="activity-edit"]');
  d.querySelector('[name="title"]').value = 'Test <activity> "safe"';
  d.querySelector('[name="type"]').value = "flashcards";
  click("#activity-form button");
  assert(
    d
      .querySelector("#main-view")
      .textContent.includes('Test <activity> "safe"'),
  );
  click('[data-action="activity-toggle"]');
  await route("admin-dashboard");
  assert(
    d.querySelector("#main-view").textContent.includes("Assessment actions"),
  );
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log(
    "PASS: all new routes, post/reply/report/helpful, injection escaping, word cloud, peer review, hazard report prefill, drill reflection, staff assignment/profile, quiz resume/result, admin activity create/toggle",
  );
  w.close();
})().catch((e) => {
  console.error(e);
  console.error(d.querySelector("#toast-container")?.textContent);
  console.error(d.querySelector("#main-view")?.textContent.slice(0, 1200));
  console.error(run('Assignments.getStudentAssignments("user-001")'));
  w.close();
  process.exitCode = 1;
});
