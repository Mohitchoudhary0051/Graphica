/* ============================================
   GRAPHICA — Student Dashboard
   ============================================ */

const Dashboard = (() => {

  function render(container) {
    const user = Auth.getCurrentUser();
    const progress = getProgress();
    const reports = Storage.getData(Storage.KEYS.REPORTS, []);
    const drills = Storage.getData(Storage.KEYS.DRILLS, []);
    const modules = Storage.getData(Storage.KEYS.MODULES, []);

    const userReports = reports.filter(r => r.reporter === user.id && r.status !== 'resolved');
    const upcomingDrills = drills.filter(d => d.status === 'upcoming').sort((a, b) => new Date(a.date) - new Date(b.date));
    const nextDrill = upcomingDrills[0];

    // Calculate scores
    const prepScore = calculatePreparednessScore(user.id);
    const trainingPct = calculateTrainingProgress(user.id);
    const quizAvg = calculateQuizAverage(user.id);

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">${Auth.getGreeting()}, ${App.escapeHtml(user.name.split(' ')[0])}</h1>
        <p class="page-subtitle">Your safety preparedness overview</p>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">Preparedness score</div>
          <div class="stat-value">${prepScore}<span style="font-size:var(--text-lg);color:var(--text-muted);">/100</span></div>
          <div class="stat-meta">${prepScore >= 80 ? 'Well prepared' : prepScore >= 60 ? 'Making progress' : 'Needs improvement'}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Training progress</div>
          <div class="stat-value">${trainingPct}%</div>
          <div class="stat-meta">${Math.round(trainingPct / 100 * modules.length)} of ${modules.length} modules</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Quiz average</div>
          <div class="stat-value">${quizAvg}%</div>
          <div class="stat-meta">${progress.quizAttempts ? progress.quizAttempts.length : 0} quizzes taken</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Open reports</div>
          <div class="stat-value">${userReports.length}</div>
          <div class="stat-meta">Awaiting resolution</div>
        </div>
      </div>

      <div class="grid-2 mb-6">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Continue learning</h3>
            <button class="btn btn-ghost btn-sm" onclick="App.navigateTo('learn')">View all</button>
          </div>
          ${renderModuleProgress(modules, progress)}
        </div>

        <div>
          ${nextDrill ? `
            <div class="card mb-4">
              <div class="card-header">
                <h3 class="card-title">Upcoming drill</h3>
              </div>
              <div class="drill-card" style="border:none;padding:0;">
                <div class="drill-date-box">
                  <div class="drill-month">${new Date(nextDrill.date).toLocaleDateString('en-US', { month: 'short' })}</div>
                  <div class="drill-day">${new Date(nextDrill.date).getDate()}</div>
                </div>
                <div class="drill-info">
                  <div class="drill-type">${App.escapeHtml(nextDrill.type)}</div>
                  <div class="drill-details">
                    <span>${App.icon('building-2', 14)} ${App.escapeHtml(nextDrill.buildingName)}</span>
                    <span>${App.icon('clock', 14)} ${nextDrill.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ` : `
            <div class="card mb-4">
              <div class="card-header">
                <h3 class="card-title">Upcoming drill</h3>
              </div>
              <p class="text-small">No drills scheduled at this time.</p>
            </div>
          `}

          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Quick actions</h3>
            </div>
            <div class="quick-actions">
              <div class="quick-action" onclick="App.navigateTo('emergency-guide')">
                <span class="action-icon">${App.icon('shield', 20)}</span>
                <span class="action-label">Emergency guide</span>
              </div>
              <div class="quick-action" onclick="App.navigateTo('report-hazard')">
                <span class="action-icon">${App.icon('alert-triangle', 20)}</span>
                <span class="action-label">Report hazard</span>
              </div>
              <div class="quick-action" onclick="App.navigateTo('evacuation-map')">
                <span class="action-icon">${App.icon('map', 20)}</span>
                <span class="action-label">View map</span>
              </div>
              <div class="quick-action" onclick="App.navigateTo('practice')">
                <span class="action-icon">${App.icon('target', 20)}</span>
                <span class="action-label">Take quiz</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    App.refreshIcons();
  }

  function renderModuleProgress(modules, progress) {
    if (!modules.length) return '<p class="text-small">No modules available.</p>';

    const moduleProgress = progress.modules || {};

    return modules.map(m => {
      const mp = moduleProgress[m.id] || { status: 'not-started', progress: 0 };
      const pct = mp.progress || 0;
      const barClass = pct >= 100 ? '' : pct >= 50 ? 'progress-amber' : 'progress-orange';

      return `
        <div class="module-card mb-3" onclick="App.navigateTo('learn-${m.id}')">
          <div class="module-icon ${App.getModuleIconClass(m.id)}">
            ${App.icon(m.icon, 20)}
          </div>
          <div class="module-info">
            <div class="module-title">${App.escapeHtml(m.title)}</div>
            <div class="module-meta">${m.duration} · ${App.capitalize(m.difficulty)}</div>
            <div class="progress-label">
              <span>${App.capitalize(mp.status.replace('-', ' '))}</span>
              <span>${pct}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-bar-fill ${barClass}" style="width:${pct}%"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ── My Progress Page ──────────────────
  function renderProgress(container) {
    const user = Auth.getCurrentUser();
    const progress = getProgress();

    const learningScore = calculateTrainingProgress(user.id);
    const quizScore = calculateQuizAverage(user.id);
    const simScore = calculateSimAverage(user.id);
    const drillScore = calculateDrillParticipation(user.id);
    const overall = calculatePreparednessScore(user.id);

    const modules = Storage.getData(Storage.KEYS.MODULES, []);
    const moduleProgress = progress.modules || {};

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">My progress</h1>
        <p class="page-subtitle">Track your safety preparedness journey</p>
      </div>

      <div class="grid-2 mb-6">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Overall preparedness</h3>
          </div>
          <div class="risk-score-display" style="justify-content:center;">
            ${renderScoreGauge(overall, 100)}
            <div>
              <div style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--sp-3);">Score breakdown</div>
              ${renderScoreRow('Learning', learningScore)}
              ${renderScoreRow('Quizzes', quizScore)}
              ${renderScoreRow('Simulations', simScore)}
              ${renderScoreRow('Drill participation', drillScore)}
            </div>
          </div>
          <div class="disclaimer mt-4">
            Preparedness score is calculated from learning completion (25%), quiz performance (25%), simulation performance (25%), and drill participation (25%).
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Module completion</h3>
          </div>
          ${modules.map(m => {
            const mp = moduleProgress[m.id] || { status: 'not-started', progress: 0 };
            return `
              <div class="flex items-center gap-3 mb-4">
                <div class="module-icon ${App.getModuleIconClass(m.id)}" style="width:32px;height:32px;border-radius:var(--radius);">
                  ${App.icon(m.icon, 16)}
                </div>
                <div style="flex:1;min-width:0;">
                  <div class="flex justify-between mb-1">
                    <span style="font-size:var(--text-sm);font-weight:500;">${App.escapeHtml(m.title)}</span>
                    <span style="font-size:var(--text-xs);color:var(--text-muted);">${mp.progress}%</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-bar-fill ${mp.progress >= 100 ? '' : 'progress-amber'}" style="width:${mp.progress}%"></div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Quiz history</h3>
          </div>
          ${renderQuizHistory(progress)}
        </div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Simulation history</h3>
          </div>
          ${renderSimHistory(progress)}
        </div>
      </div>
    `;
    App.refreshIcons();
  }

  function renderScoreRow(label, score) {
    const color = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--amber)' : 'var(--orange)';
    return `
      <div class="flex items-center gap-3 mb-2">
        <span style="font-size:var(--text-sm);min-width:120px;">${label}</span>
        <div class="progress-bar" style="flex:1;">
          <div class="progress-bar-fill" style="width:${score}%;background:${color};"></div>
        </div>
        <span style="font-size:var(--text-sm);font-weight:600;min-width:36px;text-align:right;">${score}</span>
      </div>
    `;
  }

  function renderScoreGauge(score, max) {
    const pct = score / max;
    const color = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--amber)' : 'var(--red)';
    const label = score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'Low';
    const circumference = 2 * Math.PI * 48;
    const offset = circumference * (1 - pct);

    return `
      <div class="risk-gauge">
        <svg viewBox="0 0 120 120">
          <circle class="gauge-bg" cx="60" cy="60" r="48"></circle>
          <circle class="gauge-fill" cx="60" cy="60" r="48" stroke="${color}"
            stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"></circle>
        </svg>
        <div class="gauge-text">
          <span class="gauge-value" style="color:${color};">${score}</span>
          <span class="gauge-label" style="color:${color};">${label}</span>
        </div>
      </div>
    `;
  }

  function renderQuizHistory(progress) {
    const attempts = progress.quizAttempts || [];
    if (attempts.length === 0) {
      return '<p class="text-small">No quizzes attempted yet. <a href="#learn" style="color:var(--blue);">Start learning</a></p>';
    }
    return `
      <div class="table-container">
        <table class="data-table">
          <thead><tr><th>Topic</th><th>Score</th><th>Date</th></tr></thead>
          <tbody>
            ${attempts.map(a => `
              <tr>
                <td>${App.capitalize(a.quizId.replace(/-/g, ' '))}</td>
                <td><span class="badge ${a.percentage >= 80 ? 'badge-green' : a.percentage >= 60 ? 'badge-amber' : 'badge-red'}">${a.score}/${a.total} (${a.percentage}%)</span></td>
                <td class="text-small">${App.formatDate(a.date)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderSimHistory(progress) {
    const attempts = progress.simAttempts || [];
    if (attempts.length === 0) {
      return '<p class="text-small">No simulations completed yet. <a href="#practice" style="color:var(--blue);">Try a simulation</a></p>';
    }
    return `
      <div class="table-container">
        <table class="data-table">
          <thead><tr><th>Scenario</th><th>Score</th><th>Date</th></tr></thead>
          <tbody>
            ${attempts.map(a => `
              <tr>
                <td>${App.capitalize(a.simId.replace(/sim-/g, '').replace(/-/g, ' '))}</td>
                <td><span class="badge ${a.percentage >= 80 ? 'badge-green' : a.percentage >= 60 ? 'badge-amber' : 'badge-red'}">${a.correctDecisions}/${a.total} correct</span></td>
                <td class="text-small">${App.formatDate(a.date)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ── Score Calculations ────────────────
  function getProgress() {
    const user = Auth.getCurrentUser();
    const allProgress = Storage.getData(Storage.KEYS.PROGRESS, {});
    return allProgress[user.id] || { modules: {}, quizAttempts: [], simAttempts: [], drillParticipation: [] };
  }

  function calculateTrainingProgress(userId) {
    const allProgress = Storage.getData(Storage.KEYS.PROGRESS, {});
    const p = allProgress[userId] || { modules: {} };
    const modules = Storage.getData(Storage.KEYS.MODULES, []);
    if (modules.length === 0) return 0;

    let total = 0;
    modules.forEach(m => {
      const mp = (p.modules || {})[m.id];
      if (mp) total += mp.progress;
    });
    return Math.round(total / modules.length);
  }

  function calculateQuizAverage(userId) {
    const allProgress = Storage.getData(Storage.KEYS.PROGRESS, {});
    const p = allProgress[userId] || { quizAttempts: [] };
    const attempts = p.quizAttempts || [];
    if (attempts.length === 0) return 0;

    const total = attempts.reduce((sum, a) => sum + a.percentage, 0);
    return Math.round(total / attempts.length);
  }

  function calculateSimAverage(userId) {
    const allProgress = Storage.getData(Storage.KEYS.PROGRESS, {});
    const p = allProgress[userId] || { simAttempts: [] };
    const attempts = p.simAttempts || [];
    if (attempts.length === 0) return 0;

    const total = attempts.reduce((sum, a) => sum + a.percentage, 0);
    return Math.round(total / attempts.length);
  }

  function calculateDrillParticipation(userId) {
    const allProgress = Storage.getData(Storage.KEYS.PROGRESS, {});
    const p = allProgress[userId] || { drillParticipation: [] };
    const drills = Storage.getData(Storage.KEYS.DRILLS, []);
    const completed = drills.filter(d => d.status === 'completed');
    if (completed.length === 0) return 0;

    const participated = (p.drillParticipation || []).length;
    return Math.round((participated / completed.length) * 100);
  }

  function calculatePreparednessScore(userId) {
    const learning = calculateTrainingProgress(userId);
    const quiz = calculateQuizAverage(userId);
    const sim = calculateSimAverage(userId);
    const drill = calculateDrillParticipation(userId);
    return Math.round((learning * 0.25) + (quiz * 0.25) + (sim * 0.25) + (drill * 0.25));
  }

  return {
    render,
    renderProgress,
    calculatePreparednessScore,
    calculateTrainingProgress,
    calculateQuizAverage,
    calculateSimAverage,
    calculateDrillParticipation,
    getProgress,
    renderScoreGauge
  };
})();
