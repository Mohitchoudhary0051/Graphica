/* ============================================
   GRAPHICA — Drills Module
   ============================================ */

const Drills = (() => {

  function renderStudentView(container) {
    const drills = Storage.getData(Storage.KEYS.DRILLS, []);
    const upcoming = drills.filter(d => d.status === 'upcoming').sort((a, b) => new Date(a.date) - new Date(b.date));
    const completed = drills.filter(d => d.status === 'completed').sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Drills</h1>
        <p class="page-subtitle">Scheduled safety drills and past records</p>
      </div>

      <div class="section-label mb-3">Upcoming drills</div>
      ${upcoming.length === 0 ? `
        <div class="card mb-6">
          <div class="empty-state" style="padding:var(--sp-6);">
            <div class="empty-icon">${App.icon('calendar', 32)}</div>
            <h3 class="empty-title" style="font-size:var(--text-base);">No upcoming drills</h3>
            <p class="empty-text">No safety drills are currently scheduled.</p>
          </div>
        </div>
      ` : `
        <div class="flex flex-col gap-3 mb-8">
          ${upcoming.map(drill => renderDrillCard(drill)).join('')}
        </div>
      `}

      <div class="section-label mb-3">Completed drills</div>
      ${completed.length === 0 ? `
        <div class="card">
          <p class="text-small">No completed drills recorded yet.</p>
        </div>
      ` : `
        <div class="flex flex-col gap-3">
          ${completed.map(drill => renderCompletedDrillCard(drill)).join('')}
        </div>
      `}
    `;
    App.refreshIcons();
  }

  function renderDrillCard(drill) {
    const date = new Date(drill.date);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();

    const iconMap = { fire: 'flame', earthquake: 'mountain', electrical: 'zap', flood: 'droplets' };
    const drillIcon = iconMap[drill.category] || 'siren';

    return `
      <div class="drill-card">
        <div class="drill-date-box">
          <div class="drill-month">${month}</div>
          <div class="drill-day">${day}</div>
        </div>
        <div class="drill-info" style="flex:1;">
          <div class="drill-type">${App.escapeHtml(drill.type)}</div>
          <div class="drill-details">
            <span>${App.icon('building-2', 14)} ${App.escapeHtml(drill.buildingName)}</span>
            <span>${App.icon('clock', 14)} ${drill.time}</span>
          </div>
          <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6;margin-top:var(--sp-2);">${App.escapeHtml(drill.instructions)}</p>
        </div>
        <div>
          ${App.getStatusBadge(drill.status)}
        </div>
      </div>
    `;
  }

  function renderCompletedDrillCard(drill) {
    const date = new Date(drill.date);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();

    return `
      <div class="drill-card" style="opacity:0.85;">
        <div class="drill-date-box">
          <div class="drill-month">${month}</div>
          <div class="drill-day">${day}</div>
        </div>
        <div class="drill-info" style="flex:1;">
          <div class="drill-type">${App.escapeHtml(drill.type)}</div>
          <div class="drill-details">
            <span>${App.icon('building-2', 14)} ${App.escapeHtml(drill.buildingName)}</span>
            <span>${App.icon('clock', 14)} ${drill.time}</span>
            ${drill.participation ? `<span>${App.icon('users', 14)} ${drill.participation}% participation</span>` : ''}
            ${drill.evacuationTime ? `<span>${App.icon('timer', 14)} ${drill.evacuationTime}</span>` : ''}
          </div>
          ${drill.observations ? `<p style="font-size:var(--text-xs);color:var(--text-muted);margin-top:var(--sp-2);">${App.escapeHtml(drill.observations)}</p>` : ''}
        </div>
        <div>
          <span class="badge badge-green">${App.icon('check', 12)} Completed</span>
        </div>
      </div>
    `;
  }

  return {
    renderStudentView,
    renderDrillCard
  };
})();
