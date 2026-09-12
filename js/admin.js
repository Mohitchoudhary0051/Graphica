/* ============================================
   GRAPHICA — Admin Module
   Dashboard, management, analytics, settings
   ============================================ */

const Admin = (() => {

  // ── Admin Dashboard ───────────────────
  function renderDashboard(container) {
    const reports = Storage.getData(Storage.KEYS.REPORTS, []);
    const drills = Storage.getData(Storage.KEYS.DRILLS, []);
    const alerts = Storage.getData(Storage.KEYS.ALERTS, []);
    const users = Storage.getData(Storage.KEYS.USERS, []);

    const openReports = reports.filter(r => r.status !== 'resolved');
    const highPriority = reports.filter(r => (r.severity === 'high' || r.severity === 'critical') && r.status !== 'resolved');
    const inProgress = reports.filter(r => r.status === 'in-progress' || r.status === 'assigned');
    const resolved = reports.filter(r => r.status === 'resolved');

    // Calculate facility risk score
    const riskData = calculateFacilityRisk();

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Admin dashboard</h1>
        <p class="page-subtitle">Greenfield Institute of Technology — Safety overview</p>
      </div>

      <div class="stat-grid">
        <div class="stat-card stat-orange">
          <div class="stat-label">Open reports</div>
          <div class="stat-value">${openReports.length}</div>
          <div class="stat-meta">Awaiting resolution</div>
        </div>
        <div class="stat-card stat-red">
          <div class="stat-label">High priority</div>
          <div class="stat-value">${highPriority.length}</div>
          <div class="stat-meta">Require immediate attention</div>
        </div>
        <div class="stat-card stat-amber">
          <div class="stat-label">In progress</div>
          <div class="stat-value">${inProgress.length}</div>
          <div class="stat-meta">Being addressed</div>
        </div>
        <div class="stat-card stat-green">
          <div class="stat-label">Resolved</div>
          <div class="stat-value">${resolved.length}</div>
          <div class="stat-meta">Total resolved reports</div>
        </div>
      </div>

      <div class="grid-2 mb-6">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Facility safety indicator</h3>
          </div>
          <div class="risk-score-display">
            ${Dashboard.renderScoreGauge(riskData.score, 100)}
            <div style="flex:1;">
              <div style="font-size:var(--text-lg);font-weight:700;margin-bottom:var(--sp-1);">${riskData.score}/100</div>
              <div class="badge ${riskData.score >= 80 ? 'badge-green' : riskData.score >= 60 ? 'badge-amber' : 'badge-red'} mb-3">
                ${riskData.score >= 80 ? 'Low risk' : riskData.score >= 60 ? 'Medium risk' : 'High risk'}
              </div>

              <div style="font-size:var(--text-sm);font-weight:600;margin-bottom:var(--sp-2);">Contributing factors</div>
              ${riskData.factors.map(f => `
                <div style="font-size:var(--text-xs);color:var(--text-secondary);margin-bottom:var(--sp-1);display:flex;gap:var(--sp-2);">
                  <span style="color:${f.impact < 0 ? 'var(--red)' : 'var(--green)'};">${f.impact < 0 ? '−' : '+'}${Math.abs(f.impact)}</span>
                  ${App.escapeHtml(f.label)}
                </div>
              `).join('')}

              ${riskData.recommendations.length > 0 ? `
                <div style="font-size:var(--text-sm);font-weight:600;margin-top:var(--sp-3);margin-bottom:var(--sp-2);">Recommended actions</div>
                ${riskData.recommendations.map(r => `
                  <div style="font-size:var(--text-xs);color:var(--text-secondary);margin-bottom:var(--sp-1);display:flex;gap:var(--sp-2);">
                    <span style="color:var(--amber);">${App.icon('arrow-right', 12)}</span> ${App.escapeHtml(r)}
                  </div>
                `).join('')}
              ` : ''}
            </div>
          </div>
          <div class="disclaimer mt-4">
            Platform-generated preparedness indicator. It is not a structural or fire-safety certification.
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Recent reports</h3>
            <button class="btn btn-ghost btn-sm" onclick="App.navigateTo('admin-hazards')">View all</button>
          </div>
          ${openReports.length === 0 ? '<p class="text-small">No open reports.</p>' : `
            <div style="display:flex;flex-direction:column;gap:var(--sp-3);">
              ${openReports.slice(0, 4).map(r => `
                <div style="display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3);border:1px solid var(--border-light);border-radius:var(--radius);cursor:pointer;" onclick="App.navigateTo('admin-hazards')">
                  <div>
                    <div style="font-size:var(--text-sm);font-weight:500;">${App.escapeHtml(r.title)}</div>
                    <div class="text-xs">${r.id} · ${App.escapeHtml(r.location)}</div>
                  </div>
                  <div class="ml-auto">${App.getSeverityBadge(r.severity)}</div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Upcoming drills</h3>
            <button class="btn btn-ghost btn-sm" onclick="App.navigateTo('admin-drills')">Manage</button>
          </div>
          ${drills.filter(d => d.status === 'upcoming').length === 0 ? '<p class="text-small">No upcoming drills.</p>' :
            drills.filter(d => d.status === 'upcoming').map(d => `
              <div style="display:flex;gap:var(--sp-3);margin-bottom:var(--sp-3);">
                <div class="drill-date-box" style="width:50px;">
                  <div class="drill-month" style="font-size:10px;">${new Date(d.date).toLocaleDateString('en-US', { month: 'short' })}</div>
                  <div class="drill-day" style="font-size:var(--text-xl);">${new Date(d.date).getDate()}</div>
                </div>
                <div>
                  <div style="font-size:var(--text-sm);font-weight:500;">${d.type}</div>
                  <div class="text-xs">${d.buildingName} · ${d.time}</div>
                </div>
              </div>
            `).join('')
          }
        </div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Quick actions</h3>
          </div>
          <div class="quick-actions">
            <div class="quick-action" onclick="App.navigateTo('admin-alerts')">
              <span class="action-icon">${App.icon('bell-ring', 20)}</span>
              <span class="action-label">Publish alert</span>
            </div>
            <div class="quick-action" onclick="App.navigateTo('admin-drills')">
              <span class="action-icon">${App.icon('siren', 20)}</span>
              <span class="action-label">Schedule drill</span>
            </div>
            <div class="quick-action" onclick="App.navigateTo('admin-hazards')">
              <span class="action-icon">${App.icon('alert-triangle', 20)}</span>
              <span class="action-label">Review reports</span>
            </div>
            <div class="quick-action" onclick="App.navigateTo('admin-analytics')">
              <span class="action-icon">${App.icon('bar-chart-3', 20)}</span>
              <span class="action-label">View analytics</span>
            </div>
          </div>
        </div>
      </div>
    `;
    App.refreshIcons();
  }

  // ── Facility Risk Score ───────────────
  function calculateFacilityRisk() {
    const reports = Storage.getData(Storage.KEYS.REPORTS, []);
    const drills = Storage.getData(Storage.KEYS.DRILLS, []);

    let score = 100;
    const factors = [];
    const recommendations = [];

    const criticalOpen = reports.filter(r => r.severity === 'critical' && r.status !== 'resolved').length;
    const highOpen = reports.filter(r => r.severity === 'high' && r.status !== 'resolved').length;
    const mediumOpen = reports.filter(r => r.severity === 'medium' && r.status !== 'resolved').length;

    if (criticalOpen > 0) {
      const impact = criticalOpen * -15;
      score += impact;
      factors.push({ label: `${criticalOpen} unresolved critical hazard${criticalOpen > 1 ? 's' : ''}`, impact });
      recommendations.push('Resolve critical hazard reports immediately');
    }
    if (highOpen > 0) {
      const impact = highOpen * -8;
      score += impact;
      factors.push({ label: `${highOpen} unresolved high-severity hazard${highOpen > 1 ? 's' : ''}`, impact });
      recommendations.push('Address high-priority hazard reports');
    }
    if (mediumOpen > 0) {
      const impact = mediumOpen * -4;
      score += impact;
      factors.push({ label: `${mediumOpen} unresolved medium hazard${mediumOpen > 1 ? 's' : ''}`, impact });
    }

    // Check drill participation
    const completedDrills = drills.filter(d => d.status === 'completed');
    if (completedDrills.length === 0) {
      score -= 10;
      factors.push({ label: 'No completed drills on record', impact: -10 });
      recommendations.push('Schedule and conduct a safety drill');
    } else {
      const avgParticipation = completedDrills.reduce((sum, d) => sum + (d.participation || 0), 0) / completedDrills.length;
      if (avgParticipation < 80) {
        score -= 5;
        factors.push({ label: `Low average drill participation (${Math.round(avgParticipation)}%)`, impact: -5 });
        recommendations.push('Improve drill participation rates');
      } else {
        factors.push({ label: `Good drill participation (${Math.round(avgParticipation)}%)`, impact: 0 });
      }
    }

    const resolvedCount = reports.filter(r => r.status === 'resolved').length;
    if (resolvedCount > 0) {
      factors.push({ label: `${resolvedCount} hazard${resolvedCount > 1 ? 's' : ''} resolved`, impact: 0 });
    }

    score = Math.max(0, Math.min(100, score));

    return { score, factors, recommendations };
  }

  // ── Hazard Management ─────────────────
  function renderHazards(container) {
    const reports = Storage.getData(Storage.KEYS.REPORTS, []);

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Hazard reports</h1>
        <p class="page-subtitle">Review, assign, and manage reported safety hazards</p>
      </div>

      <div class="stat-grid mb-6">
        <div class="stat-card stat-orange"><div class="stat-label">Open</div><div class="stat-value">${reports.filter(r => r.status !== 'resolved').length}</div></div>
        <div class="stat-card stat-red"><div class="stat-label">High priority</div><div class="stat-value">${reports.filter(r => (r.severity === 'high' || r.severity === 'critical') && r.status !== 'resolved').length}</div></div>
        <div class="stat-card stat-blue"><div class="stat-label">In progress</div><div class="stat-value">${reports.filter(r => r.status === 'in-progress' || r.status === 'assigned').length}</div></div>
        <div class="stat-card stat-green"><div class="stat-label">Resolved</div><div class="stat-value">${reports.filter(r => r.status === 'resolved').length}</div></div>
      </div>

      <div class="filter-bar">
        <select class="form-select" id="filter-category" onchange="Admin.filterHazards()">
          <option value="">All categories</option>
          <option value="Electrical">Electrical</option>
          <option value="Fire Safety">Fire Safety</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Obstruction">Obstruction</option>
          <option value="Emergency Equipment">Emergency Equipment</option>
        </select>
        <select class="form-select" id="filter-severity" onchange="Admin.filterHazards()">
          <option value="">All severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select class="form-select" id="filter-status" onchange="Admin.filterHazards()">
          <option value="">All status</option>
          <option value="reported">Reported</option>
          <option value="under-review">Under review</option>
          <option value="assigned">Assigned</option>
          <option value="in-progress">In progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div class="table-container" id="hazards-table">
        ${renderHazardsTable(reports)}
      </div>
    `;
    App.refreshIcons();
  }

  function renderHazardsTable(reports) {
    if (reports.length === 0) {
      return `<div class="empty-state" style="padding:var(--sp-8);"><h3 class="empty-title">No reports found</h3></div>`;
    }
    return `
      <table class="data-table">
        <thead>
          <tr><th>ID</th><th>Category</th><th>Location</th><th>Severity</th><th>Reporter</th><th>Date</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          ${reports.sort((a, b) => new Date(b.date) - new Date(a.date)).map(r => `
            <tr>
              <td style="font-family:var(--font-mono);font-size:var(--text-xs);font-weight:600;">${r.id}</td>
              <td>${App.escapeHtml(r.category)}</td>
              <td class="text-small" style="max-width:150px;overflow:hidden;text-overflow:ellipsis;">${App.escapeHtml(r.location)}</td>
              <td>${App.getSeverityBadge(r.severity)}</td>
              <td class="text-small">${App.escapeHtml(r.reporterName)}</td>
              <td class="text-small">${App.formatDate(r.date)}</td>
              <td>${App.getStatusBadge(r.status)}</td>
              <td>
                <div class="table-actions">
                  <button class="btn btn-ghost btn-sm" onclick="Hazards.viewReport('${r.id}')">View</button>
                  <button class="btn btn-ghost btn-sm" onclick="Admin.changeReportStatus('${r.id}')">Update</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  function filterHazards() {
    const cat = document.getElementById('filter-category')?.value;
    const sev = document.getElementById('filter-severity')?.value;
    const stat = document.getElementById('filter-status')?.value;

    let reports = Storage.getData(Storage.KEYS.REPORTS, []);
    if (cat) reports = reports.filter(r => r.category === cat);
    if (sev) reports = reports.filter(r => r.severity === sev);
    if (stat) reports = reports.filter(r => r.status === stat);

    document.getElementById('hazards-table').innerHTML = renderHazardsTable(reports);
    App.refreshIcons();
  }

  function changeReportStatus(reportId) {
    const reports = Storage.getData(Storage.KEYS.REPORTS, []);
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    const users = Storage.getData(Storage.KEYS.USERS, []);
    const staffUsers = users.filter(u => u.role === 'staff' || u.role === 'admin');

    App.showModal({
      title: `Update report ${report.id}`,
      body: `
        <div class="mb-4">
          <strong>${App.escapeHtml(report.title)}</strong>
          <div class="text-small">${App.escapeHtml(report.location)} · ${App.escapeHtml(report.category)}</div>
        </div>

        ${report.suggestedCategory ? `
          <div style="background:var(--bg-soft);border-radius:var(--radius);padding:var(--sp-3);margin-bottom:var(--sp-4);font-size:var(--text-sm);">
            <div style="display:flex;align-items:center;gap:var(--sp-2);margin-bottom:var(--sp-1);">
              ${App.icon('sparkles', 14)} <strong>Safety assistant suggestion</strong>
            </div>
            Category: ${report.suggestedCategory} · Priority: ${App.capitalize(report.suggestedPriority)}
            <div class="disclaimer mt-2" style="padding:var(--sp-2);font-size:11px;">Automated suggestion — verify before taking action.</div>
          </div>
        ` : ''}

        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select" id="update-status">
            <option value="reported" ${report.status === 'reported' ? 'selected' : ''}>Reported</option>
            <option value="under-review" ${report.status === 'under-review' ? 'selected' : ''}>Under review</option>
            <option value="assigned" ${report.status === 'assigned' ? 'selected' : ''}>Assigned</option>
            <option value="in-progress" ${report.status === 'in-progress' ? 'selected' : ''}>In progress</option>
            <option value="resolved" ${report.status === 'resolved' ? 'selected' : ''}>Resolved</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Assign to</label>
          <select class="form-select" id="update-assignee">
            <option value="">Unassigned</option>
            ${staffUsers.map(u => `<option value="${u.id}" ${report.assignedTo === u.id ? 'selected' : ''}>${App.escapeHtml(u.name)} (${u.role})</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Add note</label>
          <textarea class="form-textarea" id="update-note" placeholder="Add a note about this update…" style="min-height:80px;"></textarea>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Admin.saveReportUpdate('${reportId}')">Save changes</button>
      `
    });
    App.refreshIcons();
  }

  function saveReportUpdate(reportId) {
    const reports = Storage.getData(Storage.KEYS.REPORTS, []);
    const idx = reports.findIndex(r => r.id === reportId);
    if (idx === -1) return;

    const newStatus = document.getElementById('update-status')?.value;
    const assignee = document.getElementById('update-assignee')?.value;
    const note = document.getElementById('update-note')?.value?.trim();
    const user = Auth.getCurrentUser();

    reports[idx].status = newStatus;
    if (assignee) reports[idx].assignedTo = assignee;
    if (newStatus === 'resolved') reports[idx].resolvedDate = new Date().toISOString().split('T')[0];

    if (note) {
      if (!reports[idx].notes) reports[idx].notes = [];
      reports[idx].notes.push({
        author: user.name,
        date: new Date().toISOString().split('T')[0],
        text: note
      });
    }

    Storage.saveData(Storage.KEYS.REPORTS, reports);

    // Notify reporter
    App.addNotification(reports[idx].reporter, `Your hazard report ${reportId} is now ${newStatus.replace(/-/g, ' ')}.`, 'report');

    App.closeModal();
    App.showToast('Report updated.', 'success');
    renderHazards(document.getElementById('main-view'));
  }

  // ── Alert Management ──────────────────
  function renderAlerts(container) {
    const alerts = Storage.getData(Storage.KEYS.ALERTS, []);

    container.innerHTML = `
      <div class="page-header">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="page-title">Emergency alerts</h1>
            <p class="page-subtitle">Create and manage safety alerts and announcements</p>
          </div>
          <button class="btn btn-primary" onclick="Admin.createAlert()">
            ${App.icon('plus', 16)} Create alert
          </button>
        </div>
      </div>

      ${alerts.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">${App.icon('bell-off', 48)}</div>
          <h3 class="empty-title">No alerts created</h3>
          <p class="empty-text">Create an emergency alert to notify students and staff.</p>
        </div>
      ` : `
        <div class="flex flex-col gap-3">
          ${alerts.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate)).map(alert => `
            <div class="card" style="display:flex;align-items:flex-start;gap:var(--sp-4);">
              <div style="flex:1;">
                <div class="flex items-center gap-2 mb-1">
                  ${App.getSeverityBadge(alert.severity)}
                  <span style="font-size:var(--text-base);font-weight:600;">${App.escapeHtml(alert.title)}</span>
                </div>
                <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6;margin-bottom:var(--sp-2);">${App.escapeHtml(alert.message)}</p>
                <div class="text-xs">
                  Created: ${App.formatDate(alert.createdDate)}
                  ${alert.expiryDate ? ` · Expires: ${App.formatDate(alert.expiryDate)}` : ''}
                  · ${alert.active ? '<span style="color:var(--green);">Active</span>' : '<span style="color:var(--text-muted);">Inactive</span>'}
                </div>
              </div>
              <div class="flex gap-2">
                <button class="btn btn-ghost btn-sm" onclick="Admin.toggleAlert('${alert.id}')">${alert.active ? 'Deactivate' : 'Activate'}</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--red);" onclick="Admin.deleteAlert('${alert.id}')">Delete</button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
    App.refreshIcons();
  }

  function createAlert() {
    const buildings = DemoData.buildings;
    App.showModal({
      title: 'Create emergency alert',
      body: `
        <div class="form-group">
          <label class="form-label">Title <span class="required">*</span></label>
          <input class="form-input" id="alert-title" placeholder="Alert title" required>
        </div>
        <div class="form-group">
          <label class="form-label">Message <span class="required">*</span></label>
          <textarea class="form-textarea" id="alert-message" placeholder="Detailed alert message…" required></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Severity</label>
            <select class="form-select" id="alert-severity">
              <option value="info">Information</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Building</label>
            <select class="form-select" id="alert-building">
              <option value="all">All buildings</option>
              ${buildings.map(b => `<option value="${b.id}">${App.escapeHtml(b.name)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Expiry date</label>
          <input class="form-input" type="date" id="alert-expiry">
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Admin.saveAlert()">Publish alert</button>
      `
    });
  }

  function saveAlert() {
    const title = document.getElementById('alert-title')?.value?.trim();
    const message = document.getElementById('alert-message')?.value?.trim();
    const severity = document.getElementById('alert-severity')?.value;
    const building = document.getElementById('alert-building')?.value;
    const expiry = document.getElementById('alert-expiry')?.value;

    if (!title || !message) {
      App.showToast('Please enter title and message.', 'error');
      return;
    }

    const user = Auth.getCurrentUser();
    const alerts = Storage.getData(Storage.KEYS.ALERTS, []);
    const alert = {
      id: 'alert-' + Date.now(),
      title,
      message,
      severity,
      building,
      audience: 'all',
      createdBy: user.id,
      createdDate: new Date().toISOString().split('T')[0],
      expiryDate: expiry || null,
      active: true
    };
    alerts.push(alert);
    Storage.saveData(Storage.KEYS.ALERTS, alerts);

    // Notify all users
    const users = Storage.getData(Storage.KEYS.USERS, []);
    users.forEach(u => {
      App.addNotification(u.id, `${severity === 'critical' ? 'CRITICAL: ' : ''}${title}`, 'alert');
    });

    App.closeModal();
    App.showToast('Alert published.', 'success');
    renderAlerts(document.getElementById('main-view'));
  }

  function toggleAlert(alertId) {
    const alerts = Storage.getData(Storage.KEYS.ALERTS, []);
    const idx = alerts.findIndex(a => a.id === alertId);
    if (idx !== -1) {
      alerts[idx].active = !alerts[idx].active;
      Storage.saveData(Storage.KEYS.ALERTS, alerts);
      App.showToast(alerts[idx].active ? 'Alert activated.' : 'Alert deactivated.', 'info');
      renderAlerts(document.getElementById('main-view'));
    }
  }

  function deleteAlert(alertId) {
    const alerts = Storage.getData(Storage.KEYS.ALERTS, []).filter(a => a.id !== alertId);
    Storage.saveData(Storage.KEYS.ALERTS, alerts);
    App.showToast('Alert deleted.', 'success');
    renderAlerts(document.getElementById('main-view'));
  }

  // ── Drill Management ──────────────────
  function renderDrills(container) {
    const drills = Storage.getData(Storage.KEYS.DRILLS, []);
    const upcoming = drills.filter(d => d.status === 'upcoming');
    const completed = drills.filter(d => d.status === 'completed');

    container.innerHTML = `
      <div class="page-header">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="page-title">Drill management</h1>
            <p class="page-subtitle">Schedule, manage, and record safety drills</p>
          </div>
          <button class="btn btn-primary" onclick="Admin.createDrill()">
            ${App.icon('plus', 16)} Schedule drill
          </button>
        </div>
      </div>

      <div class="section-label mb-3">Upcoming (${upcoming.length})</div>
      ${upcoming.length === 0 ? '<div class="card mb-6"><p class="text-small">No upcoming drills scheduled.</p></div>' : `
        <div class="flex flex-col gap-3 mb-8">
          ${upcoming.map(d => `
            <div class="drill-card">
              <div class="drill-date-box">
                <div class="drill-month">${new Date(d.date).toLocaleDateString('en-US', { month: 'short' })}</div>
                <div class="drill-day">${new Date(d.date).getDate()}</div>
              </div>
              <div class="drill-info" style="flex:1;">
                <div class="drill-type">${App.escapeHtml(d.type)}</div>
                <div class="drill-details">
                  <span>${App.icon('building-2', 14)} ${App.escapeHtml(d.buildingName)}</span>
                  <span>${App.icon('clock', 14)} ${d.time}</span>
                </div>
              </div>
              <div class="flex gap-2">
                <button class="btn btn-secondary btn-sm" onclick="Admin.recordDrillOutcome('${d.id}')">Record outcome</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--red);" onclick="Admin.deleteDrill('${d.id}')">Cancel</button>
              </div>
            </div>
          `).join('')}
        </div>
      `}

      <div class="section-label mb-3">Completed (${completed.length})</div>
      ${completed.length === 0 ? '<div class="card"><p class="text-small">No completed drills recorded.</p></div>' : `
        <div class="flex flex-col gap-3">
          ${completed.map(d => `
            <div class="drill-card" style="opacity:0.85;">
              <div class="drill-date-box">
                <div class="drill-month">${new Date(d.date).toLocaleDateString('en-US', { month: 'short' })}</div>
                <div class="drill-day">${new Date(d.date).getDate()}</div>
              </div>
              <div class="drill-info" style="flex:1;">
                <div class="drill-type">${App.escapeHtml(d.type)}</div>
                <div class="drill-details">
                  <span>${App.icon('building-2', 14)} ${App.escapeHtml(d.buildingName)}</span>
                  <span>${App.icon('users', 14)} ${d.participation || 0}% participation</span>
                  <span>${App.icon('timer', 14)} ${d.evacuationTime || 'N/A'}</span>
                </div>
                ${d.observations ? `<p class="text-xs mt-1" style="color:var(--text-muted);">${App.escapeHtml(d.observations)}</p>` : ''}
                ${d.issues ? `<p class="text-xs mt-1" style="color:var(--red);">Issues: ${App.escapeHtml(d.issues)}</p>` : ''}
              </div>
              <span class="badge badge-green">${App.icon('check', 12)} Done</span>
            </div>
          `).join('')}
        </div>
      `}
    `;
    App.refreshIcons();
  }

  function createDrill() {
    const buildings = DemoData.buildings;
    App.showModal({
      title: 'Schedule a drill',
      body: `
        <div class="form-group">
          <label class="form-label">Disaster type <span class="required">*</span></label>
          <select class="form-select" id="drill-type">
            <option value="Fire Evacuation Drill">Fire evacuation</option>
            <option value="Earthquake Drill">Earthquake</option>
            <option value="Flood Evacuation Drill">Flood evacuation</option>
            <option value="Electrical Emergency Drill">Electrical emergency</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Building <span class="required">*</span></label>
          <select class="form-select" id="drill-building">
            ${buildings.map(b => `<option value="${b.id}" data-name="${App.escapeHtml(b.name)}">${App.escapeHtml(b.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Date <span class="required">*</span></label>
            <input class="form-input" type="date" id="drill-date" required>
          </div>
          <div class="form-group">
            <label class="form-label">Time <span class="required">*</span></label>
            <input class="form-input" type="time" id="drill-time" required>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Instructions</label>
          <textarea class="form-textarea" id="drill-instructions" placeholder="Special instructions for this drill…"></textarea>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Admin.saveDrill()">Schedule drill</button>
      `
    });
  }

  function saveDrill() {
    const type = document.getElementById('drill-type')?.value;
    const buildingSelect = document.getElementById('drill-building');
    const building = buildingSelect?.value;
    const buildingName = buildingSelect?.options[buildingSelect.selectedIndex]?.dataset?.name || building;
    const date = document.getElementById('drill-date')?.value;
    const time = document.getElementById('drill-time')?.value;
    const instructions = document.getElementById('drill-instructions')?.value?.trim();

    if (!type || !building || !date || !time) {
      App.showToast('Please fill in all required fields.', 'error');
      return;
    }

    const categoryMap = { 'Fire Evacuation Drill': 'fire', 'Earthquake Drill': 'earthquake', 'Flood Evacuation Drill': 'flood', 'Electrical Emergency Drill': 'electrical' };

    const drills = Storage.getData(Storage.KEYS.DRILLS, []);
    drills.push({
      id: 'drill-' + Date.now(),
      type,
      category: categoryMap[type] || 'fire',
      building,
      buildingName,
      date,
      time,
      instructions: instructions || `Standard ${type.toLowerCase()} procedure for ${buildingName}.`,
      status: 'upcoming',
      createdBy: Auth.getCurrentUser().id,
      participation: null,
      evacuationTime: null,
      observations: null,
      issues: null
    });
    Storage.saveData(Storage.KEYS.DRILLS, drills);

    // Notify all users
    const users = Storage.getData(Storage.KEYS.USERS, []);
    users.forEach(u => {
      App.addNotification(u.id, `New ${type.toLowerCase()} scheduled for ${buildingName} on ${App.formatDate(date)}.`, 'drill');
    });

    App.closeModal();
    App.showToast('Drill scheduled.', 'success');
    renderDrills(document.getElementById('main-view'));
  }

  function recordDrillOutcome(drillId) {
    App.showModal({
      title: 'Record drill outcome',
      body: `
        <div class="form-group">
          <label class="form-label">Participation rate (%)</label>
          <input class="form-input" type="number" id="drill-participation" min="0" max="100" placeholder="e.g., 87">
        </div>
        <div class="form-group">
          <label class="form-label">Evacuation time</label>
          <input class="form-input" id="drill-evac-time" placeholder="e.g., 4 min 12 sec">
        </div>
        <div class="form-group">
          <label class="form-label">Observations</label>
          <textarea class="form-textarea" id="drill-observations" placeholder="General observations about the drill…"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Issues identified</label>
          <textarea class="form-textarea" id="drill-issues" placeholder="Any problems or concerns…"></textarea>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Admin.saveDrillOutcome('${drillId}')">Save outcome</button>
      `
    });
  }

  function saveDrillOutcome(drillId) {
    const drills = Storage.getData(Storage.KEYS.DRILLS, []);
    const idx = drills.findIndex(d => d.id === drillId);
    if (idx === -1) return;

    drills[idx].status = 'completed';
    drills[idx].participation = parseInt(document.getElementById('drill-participation')?.value) || 0;
    drills[idx].evacuationTime = document.getElementById('drill-evac-time')?.value?.trim() || null;
    drills[idx].observations = document.getElementById('drill-observations')?.value?.trim() || null;
    drills[idx].issues = document.getElementById('drill-issues')?.value?.trim() || null;

    Storage.saveData(Storage.KEYS.DRILLS, drills);
    App.closeModal();
    App.showToast('Drill outcome recorded.', 'success');
    renderDrills(document.getElementById('main-view'));
  }

  function deleteDrill(drillId) {
    const drills = Storage.getData(Storage.KEYS.DRILLS, []).filter(d => d.id !== drillId);
    Storage.saveData(Storage.KEYS.DRILLS, drills);
    App.showToast('Drill cancelled.', 'success');
    renderDrills(document.getElementById('main-view'));
  }

  // ── User Management ───────────────────
  function renderUsers(container) {
    const users = Storage.getData(Storage.KEYS.USERS, []);

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Users</h1>
        <p class="page-subtitle">Manage user accounts and roles</p>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td style="font-weight:500;">${App.escapeHtml(u.name)}</td>
                <td class="text-small">${App.escapeHtml(u.email)}</td>
                <td>${App.getStatusBadge(u.role)}</td>
                <td class="text-small">${App.escapeHtml(u.department)}</td>
                <td><span class="badge ${u.status === 'active' ? 'badge-green' : 'badge-neutral'}">${App.capitalize(u.status)}</span></td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-ghost btn-sm" onclick="Admin.editUser('${u.id}')">Edit</button>
                    <button class="btn btn-ghost btn-sm" onclick="Admin.toggleUserStatus('${u.id}')" style="color:${u.status === 'active' ? 'var(--red)' : 'var(--green)'};">
                      ${u.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    App.refreshIcons();
  }

  function editUser(userId) {
    const users = Storage.getData(Storage.KEYS.USERS, []);
    const user = users.find(u => u.id === userId);
    if (!user) return;

    App.showModal({
      title: `Edit user — ${user.name}`,
      body: `
        <div class="form-group">
          <label class="form-label">Name</label>
          <input class="form-input" id="edit-user-name" value="${App.escapeHtml(user.name)}">
        </div>
        <div class="form-group">
          <label class="form-label">Role</label>
          <select class="form-select" id="edit-user-role">
            <option value="student" ${user.role === 'student' ? 'selected' : ''}>Student</option>
            <option value="staff" ${user.role === 'staff' ? 'selected' : ''}>Staff</option>
            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Department</label>
          <input class="form-input" id="edit-user-dept" value="${App.escapeHtml(user.department)}">
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Admin.saveUserEdit('${userId}')">Save</button>
      `
    });
  }

  function saveUserEdit(userId) {
    const users = Storage.getData(Storage.KEYS.USERS, []);
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return;

    users[idx].name = document.getElementById('edit-user-name')?.value?.trim() || users[idx].name;
    users[idx].role = document.getElementById('edit-user-role')?.value || users[idx].role;
    users[idx].department = document.getElementById('edit-user-dept')?.value?.trim() || users[idx].department;

    Storage.saveData(Storage.KEYS.USERS, users);
    App.closeModal();
    App.showToast('User updated.', 'success');
    renderUsers(document.getElementById('main-view'));
  }

  function toggleUserStatus(userId) {
    const users = Storage.getData(Storage.KEYS.USERS, []);
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return;
    users[idx].status = users[idx].status === 'active' ? 'inactive' : 'active';
    Storage.saveData(Storage.KEYS.USERS, users);
    App.showToast(`User ${users[idx].status === 'active' ? 'activated' : 'deactivated'}.`, 'info');
    renderUsers(document.getElementById('main-view'));
  }

  // ── Learning Management ───────────────
  function renderLearningMgmt(container) {
    const modules = Storage.getData(Storage.KEYS.MODULES, []);
    const allProgress = Storage.getData(Storage.KEYS.PROGRESS, {});
    const users = Storage.getData(Storage.KEYS.USERS, []);
    const students = users.filter(u => u.role === 'student');

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Learning management</h1>
        <p class="page-subtitle">Monitor training progress and module completion</p>
      </div>

      <div class="flex flex-col gap-3">
        ${modules.map(m => {
          let completed = 0;
          let inProgress = 0;
          students.forEach(s => {
            const p = allProgress[s.id]?.modules?.[m.id];
            if (p?.status === 'completed') completed++;
            else if (p?.status === 'in-progress') inProgress++;
          });
          const totalStudents = students.length || 1;
          const completionRate = Math.round((completed / totalStudents) * 100);

          return `
            <div class="card" style="display:flex;align-items:center;gap:var(--sp-4);">
              <div class="module-icon ${App.getModuleIconClass(m.id)}" style="width:40px;height:40px;">
                ${App.icon(m.icon, 20)}
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:var(--text-base);font-weight:600;">${App.escapeHtml(m.title)}</div>
                <div class="text-xs">${m.duration} · ${m.difficulty}</div>
                <div class="progress-bar mt-2">
                  <div class="progress-bar-fill" style="width:${completionRate}%"></div>
                </div>
              </div>
              <div style="text-align:right;min-width:100px;">
                <div style="font-size:var(--text-lg);font-weight:700;">${completionRate}%</div>
                <div class="text-xs">${completed} completed · ${inProgress} in progress</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    App.refreshIcons();
  }

  // ── Simulation Management ─────────────
  function renderSimulationMgmt(container) {
    const sims = DemoData.simulations;
    const allProgress = Storage.getData(Storage.KEYS.PROGRESS, {});

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Simulation management</h1>
        <p class="page-subtitle">Overview of interactive safety simulations</p>
      </div>

      <div class="flex flex-col gap-3">
        ${sims.map(sim => {
          let attempts = 0;
          let totalScore = 0;
          Object.values(allProgress).forEach(p => {
            (p.simAttempts || []).forEach(a => {
              if (a.simId === sim.id) { attempts++; totalScore += a.percentage; }
            });
          });
          const avgScore = attempts > 0 ? Math.round(totalScore / attempts) : 0;

          return `
            <div class="card" style="display:flex;align-items:center;gap:var(--sp-4);">
              <div class="module-icon ${App.getModuleIconClass(sim.category + '-safety')}" style="width:40px;height:40px;">
                ${App.icon(sim.icon, 20)}
              </div>
              <div style="flex:1;">
                <div style="font-size:var(--text-base);font-weight:600;">${App.escapeHtml(sim.title)}</div>
                <div class="text-xs">${sim.duration} · ${sim.difficulty} · ${sim.steps.length} steps</div>
              </div>
              <div style="text-align:right;min-width:100px;">
                <div style="font-size:var(--text-lg);font-weight:700;">${attempts}</div>
                <div class="text-xs">attempts${avgScore > 0 ? ` · avg ${avgScore}%` : ''}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    App.refreshIcons();
  }

  // ── Analytics ─────────────────────────
  function renderAnalytics(container) {
    const reports = Storage.getData(Storage.KEYS.REPORTS, []);
    const modules = Storage.getData(Storage.KEYS.MODULES, []);
    const allProgress = Storage.getData(Storage.KEYS.PROGRESS, {});
    const drills = Storage.getData(Storage.KEYS.DRILLS, []);
    const users = Storage.getData(Storage.KEYS.USERS, []);
    const students = users.filter(u => u.role === 'student');

    // Calculate analytics data
    const avgTraining = students.length > 0 ?
      Math.round(students.reduce((sum, s) => sum + Dashboard.calculateTrainingProgress(s.id), 0) / students.length) : 0;
    const avgQuiz = students.length > 0 ?
      Math.round(students.reduce((sum, s) => sum + Dashboard.calculateQuizAverage(s.id), 0) / students.length) : 0;
    const avgSim = students.length > 0 ?
      Math.round(students.reduce((sum, s) => sum + Dashboard.calculateSimAverage(s.id), 0) / students.length) : 0;
    const completedDrills = drills.filter(d => d.status === 'completed');
    const avgDrillPart = completedDrills.length > 0 ?
      Math.round(completedDrills.reduce((sum, d) => sum + (d.participation || 0), 0) / completedDrills.length) : 0;

    const resolvedReports = reports.filter(r => r.status === 'resolved').length;
    const openReports = reports.filter(r => r.status !== 'resolved').length;

    // Module completion data for bar chart
    const moduleData = modules.map(m => {
      let completed = 0;
      students.forEach(s => {
        if (allProgress[s.id]?.modules?.[m.id]?.status === 'completed') completed++;
      });
      return { name: m.title.split(' ')[0], value: students.length > 0 ? Math.round((completed / students.length) * 100) : 0 };
    });

    // Hazard category distribution
    const catCounts = {};
    reports.forEach(r => { catCounts[r.category] = (catCounts[r.category] || 0) + 1; });

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Analytics</h1>
        <p class="page-subtitle">Platform usage and safety preparedness metrics</p>
      </div>

      <div class="stat-grid mb-6">
        <div class="stat-card">
          <div class="stat-label">Avg. training progress</div>
          <div class="stat-value">${avgTraining}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Avg. quiz score</div>
          <div class="stat-value">${avgQuiz}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Avg. simulation score</div>
          <div class="stat-value">${avgSim}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Avg. drill participation</div>
          <div class="stat-value">${avgDrillPart}%</div>
        </div>
      </div>

      <div class="grid-2 mb-6">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Module completion rates</h3>
          </div>
          <div class="bar-chart">
            ${moduleData.map(d => `
              <div class="bar-chart-item">
                <div class="bar-chart-bar" style="height:${Math.max(d.value, 4)}%;background:${d.value >= 80 ? 'var(--green)' : d.value >= 50 ? 'var(--amber)' : 'var(--orange)'};">
                  <span class="bar-value">${d.value}%</span>
                </div>
                <div class="bar-chart-label">${d.name}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Hazard reports</h3>
          </div>
          <div class="flex items-center gap-6">
            <div class="donut-chart">
              <svg viewBox="0 0 120 120">
                ${renderDonutSegments(resolvedReports, openReports)}
              </svg>
              <div class="donut-center">
                <div style="font-size:var(--text-2xl);font-weight:700;">${reports.length}</div>
                <div style="font-size:var(--text-xs);color:var(--text-muted);">Total</div>
              </div>
            </div>
            <div>
              <div class="flex items-center gap-2 mb-2">
                <div style="width:12px;height:12px;border-radius:50%;background:var(--green);"></div>
                <span style="font-size:var(--text-sm);">Resolved (${resolvedReports})</span>
              </div>
              <div class="flex items-center gap-2">
                <div style="width:12px;height:12px;border-radius:50%;background:var(--orange);"></div>
                <span style="font-size:var(--text-sm);">Open (${openReports})</span>
              </div>
            </div>
          </div>

          ${Object.keys(catCounts).length > 0 ? `
            <div style="margin-top:var(--sp-5);border-top:1px solid var(--border-light);padding-top:var(--sp-4);">
              <div class="text-small font-semibold mb-2">By category</div>
              ${Object.entries(catCounts).sort((a, b) => b[1] - a[1]).map(([cat, count]) => `
                <div class="flex items-center gap-3 mb-2">
                  <span style="font-size:var(--text-sm);min-width:130px;">${cat}</span>
                  <div class="progress-bar" style="flex:1;"><div class="progress-bar-fill progress-amber" style="width:${(count / reports.length) * 100}%;"></div></div>
                  <span style="font-size:var(--text-xs);font-weight:600;min-width:20px;text-align:right;">${count}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Platform metrics</h3>
        </div>
        <div class="stat-grid">
          <div class="stat-card" style="padding:var(--sp-4);">
            <div class="stat-label">Total users</div>
            <div style="font-size:var(--text-2xl);font-weight:700;">${users.length}</div>
            <div class="text-xs">${students.length} students · ${users.filter(u => u.role === 'staff').length} staff · ${users.filter(u => u.role === 'admin').length} admin</div>
          </div>
          <div class="stat-card" style="padding:var(--sp-4);">
            <div class="stat-label">Drills conducted</div>
            <div style="font-size:var(--text-2xl);font-weight:700;">${completedDrills.length}</div>
            <div class="text-xs">${drills.filter(d => d.status === 'upcoming').length} upcoming</div>
          </div>
          <div class="stat-card" style="padding:var(--sp-4);">
            <div class="stat-label">Active alerts</div>
            <div style="font-size:var(--text-2xl);font-weight:700;">${Storage.getData(Storage.KEYS.ALERTS, []).filter(a => a.active).length}</div>
          </div>
          <div class="stat-card" style="padding:var(--sp-4);">
            <div class="stat-label">Learning modules</div>
            <div style="font-size:var(--text-2xl);font-weight:700;">${modules.length}</div>
          </div>
        </div>
      </div>
    `;
    App.refreshIcons();
  }

  function renderDonutSegments(resolved, open) {
    const total = resolved + open;
    if (total === 0) {
      return `<circle cx="60" cy="60" r="48" fill="none" stroke="var(--bg-soft)" stroke-width="12"/>`;
    }
    const circumference = 2 * Math.PI * 48;
    const resolvedPct = resolved / total;
    const resolvedLen = circumference * resolvedPct;
    const openLen = circumference * (1 - resolvedPct);

    return `
      <circle cx="60" cy="60" r="48" fill="none" stroke="var(--orange)" stroke-width="12"
        stroke-dasharray="${openLen} ${resolvedLen}" stroke-dashoffset="${circumference * 0.25}"/>
      <circle cx="60" cy="60" r="48" fill="none" stroke="var(--green)" stroke-width="12"
        stroke-dasharray="${resolvedLen} ${openLen}" stroke-dashoffset="${circumference * 0.25 - openLen}"/>
    `;
  }

  // ── Settings ──────────────────────────
  function renderSettings(container) {
    const settings = Storage.getData(Storage.KEYS.SETTINGS, DemoData.settings);
    const user = Auth.getCurrentUser();
    const isAdminUser = Auth.isAdmin();

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Settings</h1>
        <p class="page-subtitle">Manage your profile and platform settings</p>
      </div>

      <div class="grid-2">
        <div>
          <div class="card mb-4">
            <div class="card-header">
              <h3 class="card-title">Profile</h3>
            </div>
            <div class="flex items-center gap-4 mb-4">
              <div class="user-avatar" style="width:48px;height:48px;font-size:var(--text-lg);">${Auth.getInitials(user.name)}</div>
              <div>
                <div style="font-weight:600;">${App.escapeHtml(user.name)}</div>
                <div class="text-small">${App.escapeHtml(user.email)}</div>
                <div class="badge badge-neutral mt-1">${App.capitalize(user.role)}</div>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Department</label>
              <input class="form-input" value="${App.escapeHtml(user.department)}" disabled>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Notification preferences</h3>
            </div>
            <div style="display:flex;flex-direction:column;gap:var(--sp-3);">
              ${['Alerts', 'Drills', 'Reports', 'Learning'].map(pref => `
                <label class="flex items-center gap-3" style="cursor:pointer;">
                  <input type="checkbox" ${settings.notificationPreferences?.[pref.toLowerCase()] !== false ? 'checked' : ''} 
                    onchange="Admin.updateNotifPref('${pref.toLowerCase()}', this.checked)"
                    style="width:18px;height:18px;accent-color:var(--green);">
                  <span style="font-size:var(--text-sm);">${pref} notifications</span>
                </label>
              `).join('')}
            </div>
          </div>
        </div>

        <div>
          ${isAdminUser ? `
            <div class="card mb-4">
              <div class="card-header">
                <h3 class="card-title">Institution settings</h3>
              </div>
              <form onsubmit="Admin.saveInstitutionSettings(event)">
                <div class="form-group">
                  <label class="form-label">Institution name</label>
                  <input class="form-input" id="inst-name" value="${App.escapeHtml(settings.institution?.name || '')}">
                </div>
                <div class="form-group">
                  <label class="form-label">Campus name</label>
                  <input class="form-input" id="inst-campus" value="${App.escapeHtml(settings.institution?.campus || '')}">
                </div>
                <div class="form-group">
                  <label class="form-label">Default building</label>
                  <select class="form-select" id="inst-building">
                    ${DemoData.buildings.map(b => `
                      <option value="${b.id}" ${settings.defaultBuilding === b.id ? 'selected' : ''}>${App.escapeHtml(b.name)}</option>
                    `).join('')}
                  </select>
                </div>
                <button type="submit" class="btn btn-primary btn-sm">Save changes</button>
              </form>
            </div>

            <div class="card">
              <div class="card-header">
                <h3 class="card-title">Emergency contacts</h3>
              </div>
              <div style="display:flex;flex-direction:column;gap:var(--sp-3);">
                ${(settings.emergencyContacts || []).map((c, i) => `
                  <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--sp-2) 0;border-bottom:1px solid var(--border-light);">
                    <div>
                      <div style="font-size:var(--text-sm);font-weight:500;">${App.escapeHtml(c.name)}</div>
                      <div class="text-xs">${c.phone} · ${c.available}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : `
            <div class="card">
              <div class="card-header">
                <h3 class="card-title">Emergency contacts</h3>
              </div>
              <div style="display:flex;flex-direction:column;gap:var(--sp-3);">
                ${(settings.emergencyContacts || []).map(c => `
                  <div style="padding:var(--sp-2) 0;border-bottom:1px solid var(--border-light);">
                    <div style="font-size:var(--text-sm);font-weight:500;">${App.escapeHtml(c.name)}</div>
                    <div class="text-xs">${c.phone} · ${c.available}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          `}
        </div>
      </div>

      <div class="card mt-4">
        <div class="card-header">
          <h3 class="card-title">Session</h3>
        </div>
        <p class="text-small mb-3">Logged in as <strong>${App.escapeHtml(user.email)}</strong> (${App.capitalize(user.role)})</p>
        <button class="btn btn-secondary" onclick="App.navigateTo('logout')">
          ${App.icon('log-out', 16)} Sign out
        </button>
        <div class="disclaimer mt-4">
          This is a frontend prototype. Authentication is simulated using localStorage and is not production-secure.
        </div>
      </div>
    `;
    App.refreshIcons();
  }

  function saveInstitutionSettings(event) {
    event.preventDefault();
    const settings = Storage.getData(Storage.KEYS.SETTINGS, {});
    settings.institution = settings.institution || {};
    settings.institution.name = document.getElementById('inst-name')?.value?.trim() || settings.institution.name;
    settings.institution.campus = document.getElementById('inst-campus')?.value?.trim() || settings.institution.campus;
    settings.defaultBuilding = document.getElementById('inst-building')?.value || settings.defaultBuilding;
    Storage.saveData(Storage.KEYS.SETTINGS, settings);
    App.showToast('Settings saved.', 'success');
  }

  function updateNotifPref(key, value) {
    const settings = Storage.getData(Storage.KEYS.SETTINGS, {});
    if (!settings.notificationPreferences) settings.notificationPreferences = {};
    settings.notificationPreferences[key] = value;
    Storage.saveData(Storage.KEYS.SETTINGS, settings);
    App.showToast('Preference updated.', 'info');
  }

  return {
    renderDashboard,
    renderHazards,
    filterHazards,
    changeReportStatus,
    saveReportUpdate,
    renderAlerts,
    createAlert,
    saveAlert,
    toggleAlert,
    deleteAlert,
    renderDrills,
    createDrill,
    saveDrill,
    recordDrillOutcome,
    saveDrillOutcome,
    deleteDrill,
    renderUsers,
    editUser,
    saveUserEdit,
    toggleUserStatus,
    renderLearningMgmt,
    renderSimulationMgmt,
    renderAnalytics,
    renderSettings,
    saveInstitutionSettings,
    updateNotifPref,
    calculateFacilityRisk
  };
})();
