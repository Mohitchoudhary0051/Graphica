# GRAPHICA interactive learning and assessment upgrade

This branch extends the original static application. Open `index.html` or serve the directory with any static web server. No application build step, backend, database, or additional runtime library is required. The original external font and Lucide icon references remain unchanged.

## Student journey

1. Open **Learning Hub** and filter by disaster, activity, difficulty, or completion.
2. Complete a lesson, local interactive video, flashcards, matching set, hazard hunt, branching decision challenge, escape challenge, infographic, safety-plan review, or route exercise.
3. Find assigned assessments near the top of the dashboard or in **Assigned assessments**. Open the instructions, passing requirement and attempts remaining, then start the existing quiz engine. An unfinished attempt can be continued after reopening the assignment.
4. Review feedback, topic recommendations and progress. The preparedness score now weighs learning, quizzes, simulations, interactive activities and drills equally (20% each). Receiving an assignment earns no performance credit.
5. Prepare for a drill and submit a reflection after participation. Polls, word clouds and discussions are explicitly local browser demonstrations.

Daily safety checks rotate deterministically by local calendar date. Flashcards retain familiarity across review sessions and requeue cards marked for review. Video completion requires playback coverage and all embedded questions and safety prompts. Reopening a completed activity does not add another result; an explicit retry starts a new attempt.

## Staff and administrator journey

- **Quiz assignments** supports individual, multiple-student, department, intake batch and all-student audiences; due dates, passing scores, attempt limits, priority, instructions, mandatory status and reminders.
- Each student receives an independent assignment and result history. Overdue assessments remain available while attempts remain. A passed assessment cannot be retried as the same assignment.
- **Assign Based on Progress** explains the recorded score or missing assessment behind a recommendation. Staff reviews the recommendation and saves an assignment before it is issued.
- **Student Safety Profile** shows topic averages, preparedness components, assignment totals, recommendations and a chronological record.
- **Assessment rules** supports one-time, weekly, biweekly and monthly schedules, plus weak-topic, module-completion and failed-assessment triggers. Rules run on application opening/navigation, not on a background server. Calendar rules issue the latest due occurrence instead of flooding the user with every missed period. Occurrence identifiers prevent duplicates.
- **Learning analytics** summarizes stored activity completion, follow-up indicators, strong measured skills and drill reflections. Assignment filters include department and batch breakdowns.
- Administrators can create/edit/enable/disable configured activities and add/edit questions in **Manage quiz bank**. Started assigned quizzes retain a snapshot of their original questions.
- Labeled demo assignments are opt-in through **Load labeled demo assignments**, leaving existing user records intact.

## Prototype boundaries

- All data stays in the current browser and origin. Local role checks implement the requested prototype workflow; they are not server-enforced authorization or multi-device synchronization.
- The original user schema has no class field. Batch grouping uses an explicit `batch` when available, otherwise the intake year from `joinDate`.
- Difficulty labels organize assignments; the existing topic question bank supplies the assessment content. No unimplemented adaptive question generator is claimed.
- Activities are configurable instances of reusable players. Local video content is provided for Fire, Earthquake and Electrical Safety; additional video topics need a corresponding local asset.
- The three 18-second videos are silent, locally generated instructional slides with captions and a text transcript. They are demonstration lessons, not professional certification content.
- Flashcard mastery means two positive familiarity marks in this simple review mode. It is not a scientifically validated spaced-repetition algorithm.
- Map scenes are fictional training exercises. Hazard reports started from a hunt are visibly prefixed **[Training exercise]** and are not automatically submitted.
- The original seeded progress remains untouched. New statistics use stored records; no random performance values are generated.

## Files and storage

- `js/training.js`: shared records, date logic, scoring, streaks, achievements and explainable recommendations.
- `js/assignments.js`: audiences, assignment lifecycle, rules, student profiles, analytics and question-bank editing.
- `js/activities.js`: activity catalog and reusable activity players.
- `js/training-ui.js`: dashboard, daily checks, drills, analytics and accessible delegated controls.
- `css/training.css`: scoped responsive styles and reduced-motion support.
- `assets/`: small local WebM lessons and WebVTT captions.

Existing keys are retained. New data uses the same centralized `Storage` helper with `graphica_`-namespaced keys: `activities`, `activity_sessions`, `activity_progress`, `flashcard_progress`, `quiz_assignments`, `assignment_rules`, `assignment_results`, `student_progress`, `streaks`, `badges`, `learning_levels`, `daily_quiz`, `poll_votes`, `wordcloud_entries`, `discussions`, `drill_checklists`, `drill_reflections`, and the temporary `hazard_training_draft`. Notifications use the existing notifications collection. Assignment results are projected into existing quiz progress and reconciled on reopening if a save was interrupted.

## Verification

Optional development checks (Node is used only to run tests, never by the app):

```sh
node tests/training.test.cjs
node tests/activities.test.cjs
```

The optional DOM suite uses jsdom installed outside the application:

```sh
npm install --prefix /tmp/graphica-test-tools jsdom
GRAPHICA_TEST_MODULES=/tmp/graphica-test-tools/node_modules node tests/dom.test.cjs
```

Passed during implementation:

- Audience targeting, student role restrictions, independent attempts, pass/fail transitions and duplicate submission prevention.
- Saved drafts, recurrence deduplication, recommendation evidence and streak isolation.
- Flashcard requeue/resume, matching, hazard accuracy and report draft, decision recovery branches, route penalties and infographic gating.
- Video state-machine checkpoints, seek-without-completion prevention and completion/result deduplication.
- Poll/daily deduplication and user-input HTML escaping.
- DOM rendering of every new route, discussion actions, word cloud, peer review, drill reflection, hazard form integration, staff assignment/profile and student quiz resume/result.
- Administrator activity creation/toggling and quiz-bank editing.
- JavaScript syntax, whitespace checks and local media metadata.

**Not verified in a real browser:** rendered desktop/mobile layout, keyboard traversal and actual media playback. Local Chromium installation timed out, and the managed browser blocked the local test URL. The DOM and state-machine suites do not replace those checks. Before merging, run through a complete video, an assigned quiz, keyboard-only activities and a narrow mobile viewport in a normal browser.
