/* ============================================
   GRAPHICA — Simulation Engine
   Interactive scenario-based simulations
   ============================================ */

const Simulations = (() => {
  let currentSim = null;
  let currentStep = 0;
  let simAnswers = [];
  let stepSubmitted = false;

  // ── Simulation List ───────────────────
  function renderList(container) {
    const sims = DemoData.simulations;
    const user = Auth.getCurrentUser();
    const allProgress = Storage.getData(Storage.KEYS.PROGRESS, {});
    const progress = allProgress[user.id] || { simAttempts: [] };
    const attempts = progress.simAttempts || [];

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Practice</h1>
        <p class="page-subtitle">Interactive safety simulations and quizzes to test your knowledge</p>
      </div>

      <div class="section-label mb-3">Simulations</div>
      <p class="text-small mb-5">Work through realistic emergency scenarios and make critical decisions.</p>

      <div class="flex flex-col gap-3 mb-8">
        ${sims.map(sim => {
          const attempt = attempts.find(a => a.simId === sim.id);
          return `
            <div class="module-card" onclick="App.navigateTo('${sim.id}')">
              <div class="module-icon ${App.getModuleIconClass(sim.category + '-safety')}">
                ${App.icon(sim.icon, 20)}
              </div>
              <div class="module-info">
                <div class="module-title">${App.escapeHtml(sim.title)}</div>
                <div class="module-meta">${sim.duration} · ${sim.difficulty} · ${sim.steps.length} decisions</div>
                <p class="text-small">${App.escapeHtml(sim.description)}</p>
                ${attempt ? `<div class="badge badge-green mt-2">${App.icon('check', 12)} Completed — ${attempt.percentage}%</div>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="section-label mb-3">Quizzes</div>
      <p class="text-small mb-5">Test your knowledge with multiple-choice questions for each module.</p>

      <div class="flex flex-col gap-3">
        ${Storage.getData(Storage.KEYS.MODULES, []).map(m => {
          const quizAttempts = (progress.quizAttempts || []).filter(a => a.quizId === m.id);
          const lastAttempt = quizAttempts[quizAttempts.length - 1];
          return `
            <div class="module-card" onclick="App.navigateTo('quiz-${m.id}')">
              <div class="module-icon ${App.getModuleIconClass(m.id)}">
                ${App.icon(m.icon, 20)}
              </div>
              <div class="module-info">
                <div class="module-title">${App.escapeHtml(m.title)} Quiz</div>
                <div class="module-meta">${m.duration} · Multiple choice</div>
                ${lastAttempt ? `<div class="badge ${lastAttempt.percentage >= 80 ? 'badge-green' : lastAttempt.percentage >= 60 ? 'badge-amber' : 'badge-red'} mt-2">Last score: ${lastAttempt.percentage}%</div>` : '<div class="badge badge-neutral mt-2">Not attempted</div>'}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    App.refreshIcons();
  }

  // ── Start Simulation ──────────────────
  function start(container, simId) {
    const sims = DemoData.simulations;
    currentSim = sims.find(s => s.id === simId);

    if (!currentSim) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${App.icon('file-question', 48)}</div>
          <h3 class="empty-title">Simulation not found</h3>
          <p class="empty-text">This simulation doesn't exist.</p>
          <button class="btn btn-primary" onclick="App.navigateTo('practice')">Back to practice</button>
        </div>
      `;
      App.refreshIcons();
      return;
    }

    currentStep = 0;
    simAnswers = [];
    stepSubmitted = false;

    renderStep(container);
  }

  function renderStep(container) {
    if (!currentSim) return;
    const step = currentSim.steps[currentStep];
    const total = currentSim.steps.length;
    const progressPct = ((currentStep + 1) / total) * 100;

    container.innerHTML = `
      <div class="flex items-center gap-3 mb-6">
        <button class="btn btn-ghost btn-sm" onclick="App.navigateTo('practice')">
          ${App.icon('arrow-left', 16)} Back
        </button>
        <div class="module-icon ${App.getModuleIconClass(currentSim.category + '-safety')}" style="width:32px;height:32px;">
          ${App.icon(currentSim.icon, 16)}
        </div>
        <div>
          <h1 style="font-size:var(--text-xl);font-weight:600;">${App.escapeHtml(currentSim.title)}</h1>
          <p class="text-small">Scenario ${currentStep + 1} of ${total}</p>
        </div>
      </div>

      <div style="max-width:680px;">
        <div class="quiz-progress mb-6">
          <span class="quiz-progress-text">Step ${currentStep + 1}/${total}</span>
          <div class="progress-bar" style="flex:1;">
            <div class="progress-bar-fill" style="width:${progressPct}%"></div>
          </div>
        </div>

        <div class="sim-narrative">
          ${App.escapeHtml(step.narrative)}
        </div>

        <div class="sim-question">${App.escapeHtml(step.question)}</div>

        <div class="sim-choices">
          ${step.choices.map((choice, i) => {
            let cls = 'sim-choice';
            if (stepSubmitted && simAnswers[currentStep] !== undefined) {
              if (simAnswers[currentStep] === i) {
                cls += choice.correct ? ' sim-correct' : ' sim-incorrect';
              } else if (choice.correct) {
                cls += ' sim-correct';
              }
            }
            return `
              <div class="${cls}" onclick="Simulations.selectChoice(${i})" ${stepSubmitted ? 'style="pointer-events:none;"' : ''}>
                ${App.escapeHtml(choice.text)}
              </div>
            `;
          }).join('')}
        </div>

        ${stepSubmitted && simAnswers[currentStep] !== undefined ? `
          <div class="sim-feedback ${step.choices[simAnswers[currentStep]].correct ? 'feedback-correct' : 'feedback-incorrect'}">
            <strong>${step.choices[simAnswers[currentStep]].correct ? '✓ Correct decision' : '✗ Wrong decision'}</strong><br>
            ${App.escapeHtml(step.choices[simAnswers[currentStep]].feedback)}
          </div>
          <button class="btn btn-primary" onclick="Simulations.nextStep()">
            ${currentStep === total - 1 ? 'View results' : 'Continue'} ${App.icon('arrow-right', 14)}
          </button>
        ` : ''}
      </div>
    `;
    App.refreshIcons();
  }

  function selectChoice(index) {
    if (stepSubmitted) return;
    simAnswers[currentStep] = index;
    stepSubmitted = true;
    const container = document.getElementById('main-view');
    renderStep(container);
  }

  function nextStep() {
    if (currentStep < currentSim.steps.length - 1) {
      currentStep++;
      stepSubmitted = false;
      const container = document.getElementById('main-view');
      renderStep(container);
    } else {
      showResults();
    }
  }

  function showResults() {
    const container = document.getElementById('main-view');
    if (!currentSim) return;

    let correctCount = 0;
    let criticalMistakes = 0;

    currentSim.steps.forEach((step, i) => {
      const chosenIdx = simAnswers[i];
      if (chosenIdx !== undefined && step.choices[chosenIdx].correct) {
        correctCount++;
      } else {
        criticalMistakes++;
      }
    });

    const total = currentSim.steps.length;
    const pct = Math.round((correctCount / total) * 100);
    const scoreClass = pct >= 80 ? 'score-high' : pct >= 60 ? 'score-medium' : 'score-low';

    // Save attempt
    const user = Auth.getCurrentUser();
    const allProgress = Storage.getData(Storage.KEYS.PROGRESS, {});
    if (!allProgress[user.id]) allProgress[user.id] = { modules: {}, quizAttempts: [], simAttempts: [], drillParticipation: [] };
    allProgress[user.id].simAttempts.push({
      simId: currentSim.id,
      score: correctCount,
      total: total,
      percentage: pct,
      correctDecisions: correctCount,
      criticalMistakes: criticalMistakes,
      date: new Date().toISOString().split('T')[0]
    });
    Storage.saveData(Storage.KEYS.PROGRESS, allProgress);

    // Determine recommended module
    const recommendedModule = currentSim.category + '-safety';

    container.innerHTML = `
      <div class="flex items-center gap-3 mb-6">
        <button class="btn btn-ghost btn-sm" onclick="App.navigateTo('practice')">
          ${App.icon('arrow-left', 16)} Back to practice
        </button>
        <h1 style="font-size:var(--text-xl);font-weight:600;">Simulation results</h1>
      </div>

      <div class="card" style="max-width:640px;">
        <div class="score-summary">
          <div class="score-circle ${scoreClass}">
            <span class="score-value">${pct}%</span>
            <span class="score-label">${correctCount}/${total}</span>
          </div>
          <h3 style="font-size:var(--text-2xl);font-weight:700;margin-bottom:var(--sp-4);">
            ${pct >= 80 ? 'Excellent response!' : pct >= 60 ? 'Decent response' : 'Needs improvement'}
          </h3>

          <div class="stat-grid" style="text-align:left;max-width:400px;margin:0 auto var(--sp-5);">
            <div class="stat-card stat-green" style="padding:var(--sp-4);">
              <div class="stat-label">Correct decisions</div>
              <div class="stat-value" style="font-size:var(--text-2xl);">${correctCount}</div>
            </div>
            <div class="stat-card ${criticalMistakes > 0 ? 'stat-red' : ''}" style="padding:var(--sp-4);">
              <div class="stat-label">Critical mistakes</div>
              <div class="stat-value" style="font-size:var(--text-2xl);">${criticalMistakes}</div>
            </div>
          </div>

          ${pct < 100 ? `
            <div style="background:var(--bg-soft);border-radius:var(--radius-md);padding:var(--sp-4);margin-bottom:var(--sp-5);text-align:left;max-width:400px;margin:0 auto var(--sp-5);">
              <div style="font-size:var(--text-sm);font-weight:600;margin-bottom:var(--sp-2);">Recommended review</div>
              <button class="btn btn-secondary btn-sm" onclick="App.navigateTo('learn-${recommendedModule}')">
                ${App.icon('book-open', 14)} Review ${App.capitalize(currentSim.category)} Safety module
              </button>
            </div>
          ` : ''}

          <div class="flex gap-3" style="justify-content:center;">
            <button class="btn btn-secondary" onclick="Simulations.start(document.getElementById('main-view'), '${currentSim.id}')">
              ${App.icon('rotate-cw', 14)} Retry simulation
            </button>
            <button class="btn btn-primary" onclick="App.navigateTo('practice')">
              ${App.icon('target', 14)} More practice
            </button>
          </div>
        </div>
      </div>
    `;
    App.refreshIcons();
  }

  return {
    renderList,
    start,
    selectChoice,
    nextStep
  };
})();
