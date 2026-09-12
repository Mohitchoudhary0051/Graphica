/* ============================================
   GRAPHICA — Quiz Engine
   ============================================ */

const Quizzes = (() => {
  let currentQuiz = null;
  let currentQuestionIndex = 0;
  let selectedAnswer = -1;
  let answers = [];
  let submitted = false;

  function start(container, moduleId) {
    const allQuizzes = Storage.getData(Storage.KEYS.QUIZZES, {});
    const questions = allQuizzes[moduleId];

    if (!questions || questions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${App.icon('clipboard-x', 48)}</div>
          <h3 class="empty-title">No quiz available</h3>
          <p class="empty-text">There is no quiz for this module yet.</p>
          <button class="btn btn-primary" onclick="App.navigateTo('learn')">Back to modules</button>
        </div>
      `;
      App.refreshIcons();
      return;
    }

    currentQuiz = { moduleId, questions };
    currentQuestionIndex = 0;
    selectedAnswer = -1;
    answers = new Array(questions.length).fill(-1);
    submitted = false;

    renderQuestion(container);
  }

  function renderQuestion(container) {
    if (!currentQuiz) return;
    const q = currentQuiz.questions[currentQuestionIndex];
    const total = currentQuiz.questions.length;
    const idx = currentQuestionIndex;
    const progressPct = ((idx + 1) / total) * 100;
    const isAnswered = answers[idx] !== -1;
    const wasSubmitted = submitted;

    container.innerHTML = `
      <div class="flex items-center gap-3 mb-6">
        <button class="btn btn-ghost btn-sm" onclick="App.navigateTo('learn-${currentQuiz.moduleId}')">
          ${App.icon('arrow-left', 16)} Back to module
        </button>
        <h1 style="font-size:var(--text-xl);font-weight:600;">${App.capitalize(currentQuiz.moduleId.replace(/-/g, ' '))} — Quiz</h1>
      </div>

      <div class="quiz-container">
        <div class="quiz-progress">
          <span class="quiz-progress-text">Question ${idx + 1} of ${total}</span>
          <div class="progress-bar" style="flex:1;">
            <div class="progress-bar-fill" style="width:${progressPct}%"></div>
          </div>
        </div>

        <div class="quiz-question">${App.escapeHtml(q.question)}</div>

        <div class="quiz-options">
          ${q.options.map((opt, i) => {
            const letters = ['A', 'B', 'C', 'D'];
            let cls = 'quiz-option';
            if (wasSubmitted) {
              if (i === q.correct) cls += ' correct';
              else if (i === answers[idx] && i !== q.correct) cls += ' incorrect';
            } else if (answers[idx] === i) {
              cls += ' selected';
            }
            return `
              <div class="${cls}" onclick="Quizzes.selectAnswer(${i})" ${wasSubmitted ? 'style="pointer-events:none;"' : ''}>
                <span class="option-marker">${letters[i]}</span>
                <span>${App.escapeHtml(opt)}</span>
              </div>
            `;
          }).join('')}
        </div>

        ${wasSubmitted ? `
          <div class="quiz-explanation">
            <strong>${answers[idx] === q.correct ? '✓ Correct!' : '✗ Incorrect.'}</strong><br>
            ${App.escapeHtml(q.explanation)}
          </div>
        ` : ''}

        <div class="quiz-actions">
          <button class="btn btn-secondary" onclick="Quizzes.prevQuestion()" ${idx === 0 ? 'disabled' : ''}>
            ${App.icon('arrow-left', 14)} Previous
          </button>
          <div class="flex gap-3">
            ${!wasSubmitted ? `
              <button class="btn btn-primary" onclick="Quizzes.submitAnswer()" ${answers[idx] === -1 ? 'disabled' : ''} id="submit-btn">
                Submit answer
              </button>
            ` : `
              <button class="btn btn-primary" onclick="Quizzes.nextQuestion()">
                ${idx === total - 1 ? 'View results' : 'Next question'} ${App.icon('arrow-right', 14)}
              </button>
            `}
          </div>
        </div>
      </div>
    `;
    App.refreshIcons();
  }

  function selectAnswer(index) {
    if (submitted) return;
    answers[currentQuestionIndex] = index;
    selectedAnswer = index;

    // Update UI
    document.querySelectorAll('.quiz-option').forEach((opt, i) => {
      opt.classList.toggle('selected', i === index);
    });

    // Enable submit button
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.disabled = false;
  }

  function submitAnswer() {
    if (answers[currentQuestionIndex] === -1) return;
    submitted = true;
    const container = document.getElementById('main-view');
    renderQuestion(container);
  }

  function nextQuestion() {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      currentQuestionIndex++;
      submitted = false;
      selectedAnswer = answers[currentQuestionIndex];
      // If already answered, show submitted state
      if (selectedAnswer !== -1) submitted = true;
      const container = document.getElementById('main-view');
      renderQuestion(container);
    } else {
      showResults();
    }
  }

  function prevQuestion() {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      submitted = answers[currentQuestionIndex] !== -1;
      selectedAnswer = answers[currentQuestionIndex];
      const container = document.getElementById('main-view');
      renderQuestion(container);
    }
  }

  function showResults() {
    const container = document.getElementById('main-view');
    if (!currentQuiz) return;

    let correct = 0;
    currentQuiz.questions.forEach((q, i) => {
      if (answers[i] === q.correct) correct++;
    });

    const total = currentQuiz.questions.length;
    const pct = Math.round((correct / total) * 100);
    const scoreClass = pct >= 80 ? 'score-high' : pct >= 60 ? 'score-medium' : 'score-low';

    // Save attempt
    const user = Auth.getCurrentUser();
    const allProgress = Storage.getData(Storage.KEYS.PROGRESS, {});
    if (!allProgress[user.id]) allProgress[user.id] = { modules: {}, quizAttempts: [], simAttempts: [], drillParticipation: [] };
    allProgress[user.id].quizAttempts.push({
      quizId: currentQuiz.moduleId,
      score: correct,
      total: total,
      percentage: pct,
      date: new Date().toISOString().split('T')[0]
    });
    Storage.saveData(Storage.KEYS.PROGRESS, allProgress);

    container.innerHTML = `
      <div class="flex items-center gap-3 mb-6">
        <button class="btn btn-ghost btn-sm" onclick="App.navigateTo('learn')">
          ${App.icon('arrow-left', 16)} Back to modules
        </button>
        <h1 style="font-size:var(--text-xl);font-weight:600;">Quiz results</h1>
      </div>

      <div class="card" style="max-width:640px;">
        <div class="score-summary">
          <div class="score-circle ${scoreClass}">
            <span class="score-value">${pct}%</span>
            <span class="score-label">${correct}/${total}</span>
          </div>
          <h3 style="font-size:var(--text-2xl);font-weight:700;margin-bottom:var(--sp-2);">
            ${pct >= 80 ? 'Great work!' : pct >= 60 ? 'Good effort!' : 'Keep learning!'}
          </h3>
          <p class="text-secondary" style="margin-bottom:var(--sp-5);">
            ${pct >= 80 ? 'You have a strong understanding of this topic.' : pct >= 60 ? 'You are on the right track. Review the sections you missed.' : 'Review the module content and try again.'}
          </p>
          <div class="flex gap-3" style="justify-content:center;">
            <button class="btn btn-secondary" onclick="Quizzes.reviewAnswers()">
              ${App.icon('eye', 14)} Review answers
            </button>
            <button class="btn btn-primary" onclick="Quizzes.start(document.getElementById('main-view'), '${currentQuiz.moduleId}')">
              ${App.icon('rotate-cw', 14)} Retry quiz
            </button>
          </div>
        </div>
      </div>

      <div class="card mt-4" style="max-width:640px;" id="review-section" class="hidden">
      </div>
    `;
    App.refreshIcons();
  }

  function reviewAnswers() {
    const section = document.getElementById('review-section');
    if (!section || !currentQuiz) return;

    const letters = ['A', 'B', 'C', 'D'];

    section.classList.remove('hidden');
    section.innerHTML = `
      <div class="card-header">
        <h3 class="card-title">Answer review</h3>
      </div>
      ${currentQuiz.questions.map((q, i) => {
        const isCorrect = answers[i] === q.correct;
        return `
          <div style="margin-bottom:var(--sp-5);padding-bottom:var(--sp-5);border-bottom:1px solid var(--border-light);">
            <div class="flex items-center gap-2 mb-2">
              <span class="badge ${isCorrect ? 'badge-green' : 'badge-red'}">${isCorrect ? 'Correct' : 'Incorrect'}</span>
              <span class="text-small">Question ${i + 1}</span>
            </div>
            <p style="font-weight:500;margin-bottom:var(--sp-2);">${App.escapeHtml(q.question)}</p>
            <p class="text-small mb-2">
              Your answer: <strong>${letters[answers[i]] || '—'}. ${App.escapeHtml(q.options[answers[i]] || 'Not answered')}</strong>
              ${!isCorrect ? `<br>Correct answer: <strong style="color:var(--green);">${letters[q.correct]}. ${App.escapeHtml(q.options[q.correct])}</strong>` : ''}
            </p>
            <div class="quiz-explanation" style="margin:0;">
              ${App.escapeHtml(q.explanation)}
            </div>
          </div>
        `;
      }).join('')}
    `;
  }

  return {
    start,
    selectAnswer,
    submitAnswer,
    nextQuestion,
    prevQuestion,
    reviewAnswers
  };
})();
