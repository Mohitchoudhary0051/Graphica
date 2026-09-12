/* ============================================
   GRAPHICA — Alerts Module
   ============================================ */

const Alerts = (() => {

  function renderList(container) {
    const alerts = Storage.getData(Storage.KEYS.ALERTS, []);
    const now = new Date();

    // Separate active and expired
    const activeAlerts = alerts.filter(a => {
      if (!a.active) return false;
      if (a.expiryDate && new Date(a.expiryDate) < now) return false;
      return true;
    }).sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2, information: 2 };
      return (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3);
    });

    const pastAlerts = alerts.filter(a => {
      if (!a.active) return true;
      if (a.expiryDate && new Date(a.expiryDate) < now) return true;
      return false;
    });

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Emergency alerts</h1>
        <p class="page-subtitle">Active safety alerts and announcements</p>
      </div>

      ${activeAlerts.length === 0 ? `
        <div class="card mb-6">
          <div class="empty-state" style="padding:var(--sp-8);">
            <div class="empty-icon">${App.icon('bell-off', 40)}</div>
            <h3 class="empty-title">No active alerts</h3>
            <p class="empty-text">There are currently no emergency alerts or safety announcements.</p>
          </div>
        </div>
      ` : `
        <div class="flex flex-col gap-3 mb-8">
          ${activeAlerts.map(alert => renderAlertCard(alert)).join('')}
        </div>
      `}

      ${pastAlerts.length > 0 ? `
        <div class="section-label mb-3">Past alerts</div>
        <div class="flex flex-col gap-3">
          ${pastAlerts.map(alert => `
            <div class="card card-sm" style="opacity:0.7;">
              <div class="flex items-center gap-3">
                <span style="color:var(--text-muted);">${App.icon(alert.severity === 'critical' ? 'alert-circle' : 'info', 16)}</span>
                <div style="flex:1;">
                  <div style="font-size:var(--text-sm);font-weight:500;">${App.escapeHtml(alert.title)}</div>
                  <div class="text-xs">${App.formatDate(alert.createdDate)} · Expired</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
    App.refreshIcons();
  }

  function renderAlertCard(alert) {
    const colorMap = {
      critical: { bg: 'var(--red-bg)', border: 'var(--red-border)', icon: 'alert-circle', color: 'var(--red)' },
      warning: { bg: 'var(--orange-bg)', border: 'var(--orange-border)', icon: 'alert-triangle', color: 'var(--orange)' },
      info: { bg: 'var(--blue-bg)', border: 'var(--blue-border)', icon: 'info', color: 'var(--blue)' },
      information: { bg: 'var(--blue-bg)', border: 'var(--blue-border)', icon: 'info', color: 'var(--blue)' }
    };
    const style = colorMap[alert.severity] || colorMap.info;
    const buildingName = DemoData.buildings.find(b => b.id === alert.building)?.name || alert.building;

    return `
      <div class="card" style="border-left:4px solid ${style.color};background:${style.bg};">
        <div class="flex items-center gap-3 mb-2">
          <span style="color:${style.color};">${App.icon(style.icon, 20)}</span>
          <div style="flex:1;">
            <div style="font-size:var(--text-base);font-weight:600;">${App.escapeHtml(alert.title)}</div>
            <div class="text-xs">${App.formatDate(alert.createdDate)} · ${App.capitalize(alert.severity)} · ${App.escapeHtml(buildingName)}</div>
          </div>
          ${App.getSeverityBadge(alert.severity)}
        </div>
        <p style="font-size:var(--text-sm);line-height:1.7;margin-left:32px;">${App.escapeHtml(alert.message)}</p>
        ${alert.expiryDate ? `<div class="text-xs mt-2" style="margin-left:32px;color:var(--text-muted);">Expires: ${App.formatDate(alert.expiryDate)}</div>` : ''}
      </div>
    `;
  }

  return {
    renderList,
    renderAlertCard
  };
})();
