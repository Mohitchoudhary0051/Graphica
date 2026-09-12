/* Run with node tests/training.test.cjs. No dependencies required. */
const vm = require("node:vm"),
  fs = require("node:fs"),
  assert = require("node:assert/strict"),
  path = require("node:path");
const memory = new Map();
const ctx = vm.createContext({
  console,
  Date,
  Math,
  Set,
  Map,
  crypto: require("node:crypto").webcrypto,
  localStorage: {
    getItem: (k) => memory.get(k) ?? null,
    setItem: (k, v) => memory.set(k, v),
    removeItem: (k) => memory.delete(k),
  },
  App: { escapeHtml: (s) => String(s), showToast() {} },
});
for (const file of [
  "storage",
  "data",
  "auth",
  "dashboard",
  "training",
  "activities",
  "assignments",
])
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, "../js", file + ".js"), "utf8"),
    ctx,
  );
const run = (s) => vm.runInContext(s, ctx);
run(
  'DemoData.initializeDemoData(); Auth.login("staff@graphica.demo","demo123")',
);
const settings =
  '{dueDate:"2099-12-31",passingScore:70,maxAttempts:2,priority:"high"}';
run(`Assignments.assignQuiz('fire-safety',{type:'all'},${settings})`);
assert.equal(run("Assignments.getAssignmentAnalytics().assigned"), 2);
assert.equal(run("Assignments.getAssignmentAnalytics().completed"), 0);
run(
  `Assignments.assignQuiz('fire-safety',{type:'department',value:'Computer Science'},${settings})`,
);
assert.equal(run("Assignments.getAssignmentAnalytics().assigned"), 3);
run(
  `Assignments.assignQuiz('fire-safety',{type:'batch',value:'2025'},${settings})`,
);
assert.equal(run("Assignments.getAssignmentAnalytics().assigned"), 5);
run('Auth.login("student@graphica.demo","demo123")');
assert.throws(
  () => run(`Assignments.assignQuiz('fire-safety',{type:'all'},${settings})`),
  /Only staff/,
);
assert.equal(run('Assignments.getStudentAssignments("user-004").length'), 0);
run(
  'var mine=Assignments.getStudentAssignments("user-001")[0]; var before=Dashboard.calculatePreparednessScore("user-001"); Assignments.begin(mine.id); Assignments.saveDraft(mine.id,{answers:[0],index:0,submitted:true})',
);
assert.equal(run("Assignments.begin(mine.id).draft.answers[0]"), 0);
assert.equal(
  run('Dashboard.calculatePreparednessScore("user-001")'),
  run("before"),
);
assert.throws(
  () => run("Assignments.submit(mine.id,{answers:[0]})"),
  /Answer every/,
);
run(
  'var bank=Storage.getData(Storage.KEYS.QUIZZES)["fire-safety"]; Assignments.submit(mine.id,{answers:bank.map(q=>(q.correct+1)%q.options.length)})',
);
assert.equal(
  run("Assignments.updateAssignmentStatus(mine.id).status"),
  "needs-improvement",
);
assert.equal(
  run("Assignments.updateAssignmentStatus(mine.id).attemptsUsed"),
  1,
);
assert.throws(
  () => run("Assignments.submit(mine.id,{answers:bank.map(q=>q.correct)})"),
  /already ended/,
);
run(
  "Assignments.begin(mine.id); Assignments.submit(mine.id,{answers:bank.map(q=>q.correct)})",
);
assert.equal(
  run("Assignments.updateAssignmentStatus(mine.id).status"),
  "passed",
);
assert.equal(
  run("Assignments.updateAssignmentStatus(mine.id).attemptsUsed"),
  2,
);
assert.throws(() => run("Assignments.begin(mine.id)"), /No attempts/);
assert.equal(run('Training.recommendations("no-data").length'), 0);
run(
  'Auth.login("staff@graphica.demo","demo123"); Training.write("assignment_rules",[{id:"r1",enabled:true,trigger:"calendar",nextDate:Training.today(),anchorDate:Training.today(),recurrence:"weekly",delay:7,quizId:"electrical-safety",audience:{type:"all"},settings:{passingScore:70,maxAttempts:2},actor:Training.user()}]); Assignments.processRules(); var count=Assignments.getAssignmentAnalytics().assigned; Assignments.processRules()',
);
assert.equal(
  run("Assignments.getAssignmentAnalytics().assigned"),
  run("count"),
);
run(
  'Auth.login("student@graphica.demo","demo123"); Training.meaningful("lesson","fire-safety","unique"); Training.meaningful("lesson","fire-safety","unique")',
);
assert.equal(
  run('Training.read("student_progress").filter(r=>r.ref==="unique").length'),
  1,
);
assert.equal(run('Training.streak("user-001")'), 1);
assert.equal(run('Training.streak("user-004")'), 0);
assert(run('Activities.catalog().filter(a=>a.type==="video").length') >= 3);
assert(
  run(
    "Training.modules().reduce((n,m)=>n+(Storage.getData(Storage.KEYS.QUIZZES)[m.id]||[]).length,0)",
  ) >= 20,
);
console.log(
  "PASS: audiences, role checks, drafts, attempts, scoring guards, recurrence deduplication, recommendations, streak isolation, activity catalog",
);
