/* ============================================
   GRAPHICA — Hazard Reporting & History
   ============================================ */

const Hazards = (() => {

  // ── Rule-based Classifier ─────────────
  function classifyHazard(description) {
    const text = (description || '').toLowerCase();

    const rules = [
      { keywords: ['wire', 'socket', 'switch', 'spark', 'electric', 'short circuit', 'outlet', 'voltage', 'current', 'shock', 'power', 'circuit', 'breaker', 'fuse'], category: 'Electrical', priority: 'high' },
      { keywords: ['smoke', 'flame', 'fire', 'burn', 'extinguisher', 'alarm', 'combustible', 'flammable', 'ignit'], category: 'Fire Safety', priority: 'high' },
      { keywords: ['blocked', 'obstruction', 'exit blocked', 'door blocked', 'pathway', 'corridor blocked', 'access blocked'], category: 'Obstruction', priority: 'high' },
      { keywords: ['broken', 'damaged', 'crack', 'stair', 'railing', 'ceiling', 'wall', 'floor', 'leak', 'plumbing', 'window', 'tile', 'loose'], category: 'Maintenance', priority: 'medium' },
      { keywords: ['expired', 'missing', 'extinguisher', 'alarm', 'detector', 'sign', 'emergency equipment', 'first aid', 'kit'], category: 'Emergency Equipment', priority: 'medium' },
      { keywords: ['water', 'flood', 'leak', 'rain', 'drain', 'pipe'], category: 'Maintenance', priority: 'medium' }
    ];

    for (const rule of rules) {
      for (const keyword of rule.keywords) {
        if (text.includes(keyword)) {
          return { category: rule.category, priority: rule.priority };
        }
      }
    }

    return { category: 'Other', priority: 'medium' };
  }

  // ── Report Hazard Form ────────────────
  function renderReportForm(container) {
    const buildings = DemoData.buildings;

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Report a safety hazard</h1>
        <p class="page-subtitle">Help keep our campus safe by reporting potential hazards.</p>
      </div>

      <div class="grid-2">
        <div class="card">
          <form id="hazard-form" onsubmit="Hazards.submitReport(event)">
            <div class="form-group">
              <label class="form-label" for="hazard-title">Title <span class="required">*</span></label>
              <input class="form-input" type="text" id="hazard-title" placeholder="Brief description of the hazard" required oninput="Hazards.onDescriptionChange()">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="hazard-category">Category <span class="required">*</span></label>
                <select class="form-select" id="hazard-category" required>
                  <option value="">Select category</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Fire Safety">Fire Safety</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Obstruction">Obstruction</option>
                  <option value="Emergency Equipment">Emergency Equipment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="hazard-severity">Severity <span class="required">*</span></label>
                <select class="form-select" id="hazard-severity" required>
                  <option value="">Select severity</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="hazard-building">Building <span class="required">*</span></label>
              <select class="form-select" id="hazard-building" required>
                <option value="">Select building</option>
                ${buildings.map(b => `<option value="${b.id}">${App.escapeHtml(b.name)}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="hazard-location">Specific location <span class="required">*</span></label>
              <input class="form-input" type="text" id="hazard-location" placeholder="e.g., Block A — Room 204, 2nd Floor" required>
            </div>

            <div class="form-group">
              <label class="form-label" for="hazard-description">Description <span class="required">*</span></label>
              <textarea class="form-textarea" id="hazard-description" placeholder="Describe the hazard in detail…" required oninput="Hazards.onDescriptionChange()"></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Photo (optional)</label>
              <div class="file-upload" id="file-upload-area" onclick="document.getElementById('hazard-photo').click()">
                <input type="file" id="hazard-photo" accept=".jpg,.jpeg,.png,.webp" onchange="Hazards.handlePhotoUpload(event)">
                <div class="upload-icon">${App.icon('camera', 24)}</div>
                <div class="upload-text">Click to upload a photo</div>
                <div class="upload-hint">JPG, PNG, or WebP — Max 5 MB</div>
              </div>
              <div id="photo-preview" class="file-preview" style="display:none;">
                <img id="preview-img" alt="Hazard photo preview">
                <button class="remove-file" onclick="Hazards.removePhoto(event)" type="button">×</button>
              </div>
            </div>

            <div class="flex gap-3">
              <button type="submit" class="btn btn-primary btn-lg">
                ${App.icon('send', 16)} Submit report
              </button>
              <button type="button" class="btn btn-secondary btn-lg" onclick="App.navigateTo('hazard-history')">
                View my reports
              </button>
            </div>
          </form>
        </div>

        <div>
          <div class="card mb-4" id="ai-suggestion" style="display:none;">
            <div class="card-header">
              <h3 class="card-title" style="display:flex;align-items:center;gap:var(--sp-2);">
                ${App.icon('sparkles', 18)} Safety assistant
              </h3>
            </div>
            <div id="suggestion-content"></div>
            <div class="disclaimer mt-3">
              Automated suggestion — verify before taking action.
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Reporting guidelines</h3>
            </div>
            <div style="font-size:var(--text-sm);line-height:1.7;color:var(--text-secondary);">
              <p class="mb-3">Provide as much detail as possible to help the safety team assess and respond to the hazard.</p>
              <ul style="display:flex;flex-direction:column;gap:var(--sp-2);">
                <li style="display:flex;gap:var(--sp-2);"><span style="color:var(--green);">${App.icon('check', 14)}</span> Describe what you see, hear, or smell</li>
                <li style="display:flex;gap:var(--sp-2);"><span style="color:var(--green);">${App.icon('check', 14)}</span> Include the exact location (room, floor, area)</li>
                <li style="display:flex;gap:var(--sp-2);"><span style="color:var(--green);">${App.icon('check', 14)}</span> Take a photo if it is safe to do so</li>
                <li style="display:flex;gap:var(--sp-2);"><span style="color:var(--green);">${App.icon('check', 14)}</span> Assess severity honestly</li>
                <li style="display:flex;gap:var(--sp-2);"><span style="color:var(--red);">${App.icon('x', 14)}</span> Do not approach active hazards</li>
                <li style="display:flex;gap:var(--sp-2);"><span style="color:var(--red);">${App.icon('x', 14)}</span> Do not attempt to repair hazards yourself</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
    App.refreshIcons();
  }

  let debounceTimer = null;

  function onDescriptionChange() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const title = document.getElementById('hazard-title')?.value || '';
      const desc = document.getElementById('hazard-description')?.value || '';
      const combined = title + ' ' + desc;

      if (combined.trim().length < 5) {
        document.getElementById('ai-suggestion').style.display = 'none';
        return;
      }

      const suggestion = classifyHazard(combined);
      const suggestionEl = document.getElementById('ai-suggestion');
      const contentEl = document.getElementById('suggestion-content');

      if (suggestion.category !== 'Other') {
        suggestionEl.style.display = '';
        contentEl.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:var(--sp-3);">
            <div>
              <span class="text-small">Suggested category</span>
              <div style="font-size:var(--text-base);font-weight:600;">${suggestion.category}</div>
            </div>
            <div>
              <span class="text-small">Suggested priority</span>
              <div>${App.getSeverityBadge(suggestion.priority)}</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="Hazards.applySuggestion('${suggestion.category}', '${suggestion.priority}')">
              ${App.icon('check', 14)} Apply suggestion
            </button>
          </div>
        `;
        App.refreshIcons();
      } else {
        suggestionEl.style.display = 'none';
      }
    }, 500);
  }

  function applySuggestion(category, priority) {
    document.getElementById('hazard-category').value = category;
    document.getElementById('hazard-severity').value = priority;
    App.showToast('Suggestion applied.', 'info');
  }

  let uploadedPhoto = null;

  function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      App.showToast('Invalid file type. Use JPG, PNG, or WebP.', 'error');
      event.target.value = '';
      return;
    }

    // Validate size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      App.showToast('File too large. Maximum size is 5 MB.', 'error');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedPhoto = e.target.result;
      document.getElementById('preview-img').src = uploadedPhoto;
      document.getElementById('photo-preview').style.display = '';
      document.getElementById('file-upload-area').style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  function removePhoto(event) {
    event.stopPropagation();
    uploadedPhoto = null;
    document.getElementById('hazard-photo').value = '';
    document.getElementById('photo-preview').style.display = 'none';
    document.getElementById('file-upload-area').style.display = '';
  }

  function submitReport(event) {
    event.preventDefault();

    const user = Auth.getCurrentUser();
    const reports = Storage.getData(Storage.KEYS.REPORTS, []);

    const title = document.getElementById('hazard-title').value.trim();
    const category = document.getElementById('hazard-category').value;
    const severity = document.getElementById('hazard-severity').value;
    const building = document.getElementById('hazard-building').value;
    const location = document.getElementById('hazard-location').value.trim();
    const description = document.getElementById('hazard-description').value.trim();

    if (!title || !category || !severity || !building || !location || !description) {
      App.showToast('Please complete all required fields.', 'error');
      return;
    }

    const suggestion = classifyHazard(title + ' ' + description);
    const buildingName = DemoData.buildings.find(b => b.id === building)?.name || building;

    const report = {
      id: Storage.generateReportId(),
      title,
      category,
      location: `${buildingName} — ${location}`,
      building,
      description,
      severity,
      status: 'reported',
      reporter: user.id,
      reporterName: user.name,
      date: new Date().toISOString().split('T')[0],
      photo: uploadedPhoto,
      assignedTo: null,
      notes: [],
      suggestedCategory: suggestion.category,
      suggestedPriority: suggestion.priority
    };

    reports.push(report);
    Storage.saveData(Storage.KEYS.REPORTS, reports);

    // Notification
    App.addNotification(user.id, `Your hazard report ${report.id} has been submitted.`, 'report');

    // Notify admin
    const users = Storage.getData(Storage.KEYS.USERS, []);
    const admins = users.filter(u => u.role === 'admin');
    admins.forEach(admin => {
      App.addNotification(admin.id, `New hazard report submitted: ${report.id} — ${title}`, 'report');
    });

    uploadedPhoto = null;

    // Show success modal
    App.showModal({
      title: 'Report submitted',
      size: 'sm',
      body: `
        <div class="text-center">
          <div style="width:48px;height:48px;background:var(--green-bg);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto var(--sp-4);">
            ${App.icon('check', 24)}
          </div>
          <p style="font-size:var(--text-base);font-weight:600;margin-bottom:var(--sp-2);">Report submitted successfully</p>
          <p class="text-small mb-4">Your report has been assigned ID:</p>
          <div style="background:var(--bg-soft);border-radius:var(--radius);padding:var(--sp-3);font-family:var(--font-mono);font-size:var(--text-lg);font-weight:700;margin-bottom:var(--sp-3);">
            ${report.id}
          </div>
          <p class="text-small" style="color:var(--text-muted);">Status: Reported</p>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
        <button class="btn btn-primary" onclick="App.closeModal(); App.navigateTo('hazard-history');">View my reports</button>
      `
    });
    App.refreshIcons();
  }

  // ── Report History ────────────────────
  function renderHistory(container) {
    const user = Auth.getCurrentUser();
    const reports = Storage.getData(Storage.KEYS.REPORTS, []);
    const userReports = reports.filter(r => r.reporter === user.id).sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = `
      <div class="page-header">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="page-title">My hazard reports</h1>
            <p class="page-subtitle">Track the status of your submitted reports</p>
          </div>
          <button class="btn btn-primary" onclick="App.navigateTo('report-hazard')">
            ${App.icon('plus', 16)} New report
          </button>
        </div>
      </div>

      ${userReports.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">${App.icon('clipboard', 48)}</div>
          <h3 class="empty-title">No reports yet</h3>
          <p class="empty-text">You haven't submitted any hazard reports. Report a safety concern to help keep our campus safe.</p>
          <button class="btn btn-primary" onclick="App.navigateTo('report-hazard')">Report a hazard</button>
        </div>
      ` : `
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Category</th>
                <th>Location</th>
                <th>Severity</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${userReports.map(r => `
                <tr>
                  <td style="font-family:var(--font-mono);font-size:var(--text-xs);font-weight:600;">${r.id}</td>
                  <td>${App.escapeHtml(r.category)}</td>
                  <td class="text-small">${App.escapeHtml(r.location)}</td>
                  <td>${App.getSeverityBadge(r.severity)}</td>
                  <td class="text-small">${App.formatDate(r.date)}</td>
                  <td>${App.getStatusBadge(r.status)}</td>
                  <td>
                    <button class="btn btn-ghost btn-sm" onclick="Hazards.viewReport('${r.id}')">View</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    `;
    App.refreshIcons();
  }

  function viewReport(reportId) {
    const reports = Storage.getData(Storage.KEYS.REPORTS, []);
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    App.showModal({
      title: `Report ${report.id}`,
      size: 'lg',
      body: `
        <div class="flex gap-4 mb-4">
          <div style="flex:1;">
            <div class="text-small mb-1">Title</div>
            <div style="font-weight:500;">${App.escapeHtml(report.title)}</div>
          </div>
          <div>
            ${App.getSeverityBadge(report.severity)}
            ${App.getStatusBadge(report.status)}
          </div>
        </div>

        <div class="grid-2 mb-4">
          <div>
            <div class="text-small mb-1">Category</div>
            <div style="font-weight:500;">${App.escapeHtml(report.category)}</div>
          </div>
          <div>
            <div class="text-small mb-1">Location</div>
            <div style="font-weight:500;">${App.escapeHtml(report.location)}</div>
          </div>
          <div>
            <div class="text-small mb-1">Reported by</div>
            <div style="font-weight:500;">${App.escapeHtml(report.reporterName)}</div>
          </div>
          <div>
            <div class="text-small mb-1">Date</div>
            <div style="font-weight:500;">${App.formatDate(report.date)}</div>
          </div>
        </div>

        <div class="mb-4">
          <div class="text-small mb-1">Description</div>
          <div style="line-height:1.7;font-size:var(--text-sm);">${App.escapeHtml(report.description)}</div>
        </div>

        ${report.photo ? `
          <div class="mb-4">
            <div class="text-small mb-1">Photo</div>
            <img src="${report.photo}" alt="Hazard photo" style="max-height:200px;border-radius:var(--radius);border:1px solid var(--border);">
          </div>
        ` : ''}

        ${report.notes && report.notes.length > 0 ? `
          <div class="mb-4">
            <div class="text-small mb-2">Activity</div>
            <div class="timeline">
              ${report.notes.map(note => `
                <div class="timeline-item">
                  <div class="timeline-date">${App.formatDate(note.date)} — ${App.escapeHtml(note.author)}</div>
                  <div class="timeline-content">${App.escapeHtml(note.text)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${report.suggestedCategory ? `
          <div class="disclaimer">
            Safety assistant suggested: ${report.suggestedCategory} (${report.suggestedPriority} priority)
          </div>
        ` : ''}
      `
    });
    App.refreshIcons();
  }

  return {
    renderReportForm,
    renderHistory,
    submitReport,
    onDescriptionChange,
    applySuggestion,
    handlePhotoUpload,
    removePhoto,
    viewReport,
    classifyHazard
  };
})();
