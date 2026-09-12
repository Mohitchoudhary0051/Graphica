/* ============================================
   GRAPHICA — Learning Module & Emergency Guide
   ============================================ */

const Learning = (() => {

  // ── Module List ───────────────────────
  function render(container) {
    const modules = Storage.getData(Storage.KEYS.MODULES, []);
    const user = Auth.getCurrentUser();
    const allProgress = Storage.getData(Storage.KEYS.PROGRESS, {});
    const progress = allProgress[user.id] || { modules: {} };

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Learn</h1>
        <p class="page-subtitle">Structured safety modules for every disaster type</p>
      </div>

      <div class="flex flex-col gap-3">
        ${modules.map(m => {
          const mp = progress.modules[m.id] || { status: 'not-started', progress: 0 };
          const pct = mp.progress || 0;
          const barClass = pct >= 100 ? '' : pct >= 50 ? 'progress-amber' : 'progress-orange';

          return `
            <div class="module-card" onclick="App.navigateTo('learn-${m.id}')">
              <div class="module-icon ${App.getModuleIconClass(m.id)}">
                ${App.icon(m.icon, 20)}
              </div>
              <div class="module-info">
                <div class="module-title">${App.escapeHtml(m.title)}</div>
                <div class="module-meta">${m.duration} · ${App.capitalize(m.difficulty)}</div>
                <p class="text-small mb-3">${App.escapeHtml(m.description)}</p>
                <div class="progress-label">
                  <span>${App.getStatusBadge(mp.status)}</span>
                  <span>${pct}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-bar-fill ${barClass}" style="width:${pct}%"></div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    App.refreshIcons();
  }

  // ── Individual Module ─────────────────
  function renderModule(container, moduleId) {
    const modules = Storage.getData(Storage.KEYS.MODULES, []);
    const module = modules.find(m => m.id === moduleId);

    if (!module) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${App.icon('file-question', 48)}</div>
          <h3 class="empty-title">Module not found</h3>
          <p class="empty-text">This learning module doesn't exist.</p>
          <button class="btn btn-primary" onclick="App.navigateTo('learn')">Back to modules</button>
        </div>
      `;
      App.refreshIcons();
      return;
    }

    const user = Auth.getCurrentUser();
    const allProgress = Storage.getData(Storage.KEYS.PROGRESS, {});
    const userProgress = allProgress[user.id] || { modules: {} };
    const mp = userProgress.modules[moduleId] || { status: 'not-started', progress: 0, completedSections: [] };
    const completedSections = mp.completedSections || [];

    // Mark as in-progress if first visit
    if (mp.status === 'not-started') {
      updateModuleProgress(moduleId, 'in-progress', completedSections);
    }

    const sections = [
      { id: 'overview', title: 'Overview', content: renderOverview(module) },
      { id: 'before', title: 'Before', content: renderListSection('What to do before', module.before, moduleId, 'before', completedSections) },
      { id: 'during', title: 'During', content: renderListSection('What to do during', module.during, moduleId, 'during', completedSections) },
      { id: 'after', title: 'After', content: renderListSection('What to do after', module.after, moduleId, 'after', completedSections) },
      { id: 'do-dont', title: "Do / Don't", content: renderDoDont(module, moduleId, completedSections) },
      { id: 'checklist', title: 'Checklist', content: renderChecklist(module, moduleId) }
    ];

    container.innerHTML = `
      <div class="flex items-center gap-3 mb-6">
        <button class="btn btn-ghost btn-sm" onclick="App.navigateTo('learn')">
          ${App.icon('arrow-left', 16)} Back
        </button>
        <div class="module-icon ${App.getModuleIconClass(moduleId)}" style="width:36px;height:36px;">
          ${App.icon(module.icon, 20)}
        </div>
        <div>
          <h1 style="font-size:var(--text-2xl);font-weight:700;">${App.escapeHtml(module.title)}</h1>
          <p class="text-small">${module.duration} · ${App.capitalize(module.difficulty)}</p>
        </div>
        <div class="ml-auto">
          <button class="btn btn-primary btn-sm" onclick="App.navigateTo('quiz-${moduleId}')">
            ${App.icon('clipboard-check', 16)} Take quiz
          </button>
        </div>
      </div>

      <div class="tabs" id="module-tabs">
        ${sections.map((s, i) => `
          <div class="tab-item ${i === 0 ? 'active' : ''}" data-tab="${s.id}" onclick="Learning.switchTab('${s.id}')">
            ${completedSections.includes(s.id) ? App.icon('check', 14) : ''} ${s.title}
          </div>
        `).join('')}
      </div>

      <div id="module-content">
        ${sections.map((s, i) => `
          <div class="tab-content ${i === 0 ? '' : 'hidden'}" id="tab-${s.id}">
            ${s.content}
          </div>
        `).join('')}
      </div>

      <div class="flex justify-between mt-6">
        <button class="btn btn-secondary" id="prev-section-btn" onclick="Learning.prevSection()" style="visibility:hidden;">
          ${App.icon('arrow-left', 16)} Previous
        </button>
        <button class="btn btn-primary" id="next-section-btn" onclick="Learning.nextSection()">
          Next ${App.icon('arrow-right', 16)}
        </button>
      </div>
    `;
    App.refreshIcons();
  }

  let currentSectionIndex = 0;
  const sectionIds = ['overview', 'before', 'during', 'after', 'do-dont', 'checklist'];

  function switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab-item[data-tab="${tabId}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');

    currentSectionIndex = sectionIds.indexOf(tabId);

    // Update nav buttons
    const prevBtn = document.getElementById('prev-section-btn');
    const nextBtn = document.getElementById('next-section-btn');
    if (prevBtn) prevBtn.style.visibility = currentSectionIndex === 0 ? 'hidden' : 'visible';
    if (nextBtn) nextBtn.textContent = currentSectionIndex === sectionIds.length - 1 ? 'Complete module' : 'Next';
  }

  function nextSection() {
    // Mark current section as completed
    const currentModuleId = window.location.hash.replace('#learn-', '');
    markSectionComplete(currentModuleId, sectionIds[currentSectionIndex]);

    if (currentSectionIndex < sectionIds.length - 1) {
      currentSectionIndex++;
      switchTab(sectionIds[currentSectionIndex]);
    } else {
      // Complete module
      completeModule(currentModuleId);
    }
  }

  function prevSection() {
    if (currentSectionIndex > 0) {
      currentSectionIndex--;
      switchTab(sectionIds[currentSectionIndex]);
    }
  }

  function renderOverview(module) {
    return `
      <div style="max-width:640px;">
        <p style="font-size:var(--text-base);line-height:1.8;color:var(--text-primary);">${App.escapeHtml(module.overview)}</p>
        <div class="flex gap-4 mt-6">
          <div class="stat-card stat-card-sm" style="padding:var(--sp-4);">
            <div class="stat-label">Duration</div>
            <div style="font-size:var(--text-lg);font-weight:600;">${module.duration}</div>
          </div>
          <div class="stat-card stat-card-sm" style="padding:var(--sp-4);">
            <div class="stat-label">Level</div>
            <div style="font-size:var(--text-lg);font-weight:600;">${module.difficulty}</div>
          </div>
          <div class="stat-card stat-card-sm" style="padding:var(--sp-4);">
            <div class="stat-label">Sections</div>
            <div style="font-size:var(--text-lg);font-weight:600;">6</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderListSection(title, items, moduleId, sectionId, completedSections) {
    const isCompleted = completedSections.includes(sectionId);
    return `
      <div style="max-width:640px;">
        <h3 style="font-size:var(--text-xl);font-weight:600;margin-bottom:var(--sp-4);">${title}</h3>
        <ul style="display:flex;flex-direction:column;gap:var(--sp-3);">
          ${items.map((item, i) => `
            <li style="display:flex;gap:var(--sp-3);align-items:flex-start;">
              <span style="flex-shrink:0;width:24px;height:24px;border-radius:50%;background:var(--bg-soft);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:600;color:var(--text-muted);margin-top:2px;">${i + 1}</span>
              <span style="line-height:1.6;">${App.escapeHtml(item)}</span>
            </li>
          `).join('')}
        </ul>
        ${!isCompleted ? `
          <button class="btn btn-secondary btn-sm mt-4" onclick="Learning.markSectionComplete('${moduleId}', '${sectionId}'); this.textContent='Completed'; this.disabled=true; this.className='btn btn-success btn-sm mt-4';">
            ${App.icon('check', 14)} Mark as read
          </button>
        ` : `<div class="badge badge-green mt-4">${App.icon('check', 12)} Completed</div>`}
      </div>
    `;
  }

  function renderDoDont(module, moduleId, completedSections) {
    const isCompleted = completedSections.includes('do-dont');
    return `
      <div style="max-width:640px;">
        <div class="grid-2 gap-6">
          <div>
            <h3 style="font-size:var(--text-lg);font-weight:600;color:var(--green);margin-bottom:var(--sp-3);display:flex;align-items:center;gap:var(--sp-2);">
              ${App.icon('check-circle', 18)} Do
            </h3>
            <ul style="display:flex;flex-direction:column;gap:var(--sp-2);">
              ${module.doList.map(item => `
                <li style="display:flex;gap:var(--sp-2);align-items:flex-start;font-size:var(--text-sm);line-height:1.6;">
                  <span style="color:var(--green);flex-shrink:0;margin-top:3px;">${App.icon('check', 14)}</span>
                  ${App.escapeHtml(item)}
                </li>
              `).join('')}
            </ul>
          </div>
          <div>
            <h3 style="font-size:var(--text-lg);font-weight:600;color:var(--red);margin-bottom:var(--sp-3);display:flex;align-items:center;gap:var(--sp-2);">
              ${App.icon('x-circle', 18)} Don't
            </h3>
            <ul style="display:flex;flex-direction:column;gap:var(--sp-2);">
              ${module.dontList.map(item => `
                <li style="display:flex;gap:var(--sp-2);align-items:flex-start;font-size:var(--text-sm);line-height:1.6;">
                  <span style="color:var(--red);flex-shrink:0;margin-top:3px;">${App.icon('x', 14)}</span>
                  ${App.escapeHtml(item)}
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
        ${!isCompleted ? `
          <button class="btn btn-secondary btn-sm mt-4" onclick="Learning.markSectionComplete('${moduleId}', 'do-dont'); this.textContent='Completed'; this.disabled=true; this.className='btn btn-success btn-sm mt-4';">
            ${App.icon('check', 14)} Mark as read
          </button>
        ` : `<div class="badge badge-green mt-4">${App.icon('check', 12)} Completed</div>`}
      </div>
    `;
  }

  function renderChecklist(module, moduleId) {
    return `
      <div style="max-width:640px;">
        <h3 style="font-size:var(--text-xl);font-weight:600;margin-bottom:var(--sp-4);">Quick checklist</h3>
        <p class="text-small mb-4">Confirm you understand the key points of this module.</p>
        <div class="card">
          ${module.checklist.map((item, i) => `
            <div class="checklist-item" id="checklist-${moduleId}-${i}">
              <input type="checkbox" id="check-${moduleId}-${i}" onchange="Learning.handleChecklistChange('${moduleId}')">
              <label for="check-${moduleId}-${i}">${App.escapeHtml(item)}</label>
            </div>
          `).join('')}
        </div>
        <div class="flex gap-3 mt-4">
          <button class="btn btn-primary btn-sm" onclick="Learning.completeModule('${moduleId}')">
            ${App.icon('check-circle', 14)} Complete module
          </button>
          <button class="btn btn-secondary btn-sm" onclick="App.navigateTo('quiz-${moduleId}')">
            ${App.icon('clipboard-check', 14)} Take quiz
          </button>
        </div>
      </div>
    `;
  }

  function handleChecklistChange(moduleId) {
    // Auto-mark checklist section as complete if all checked
    const module = Storage.getData(Storage.KEYS.MODULES, []).find(m => m.id === moduleId);
    if (!module) return;
    const total = module.checklist.length;
    let checked = 0;
    for (let i = 0; i < total; i++) {
      const cb = document.getElementById(`check-${moduleId}-${i}`);
      if (cb && cb.checked) checked++;
    }
    if (checked === total) {
      markSectionComplete(moduleId, 'checklist');
    }
  }

  // ── Progress Management ───────────────
  function markSectionComplete(moduleId, sectionId) {
    const user = Auth.getCurrentUser();
    const allProgress = Storage.getData(Storage.KEYS.PROGRESS, {});
    if (!allProgress[user.id]) allProgress[user.id] = { modules: {}, quizAttempts: [], simAttempts: [], drillParticipation: [] };
    if (!allProgress[user.id].modules[moduleId]) {
      allProgress[user.id].modules[moduleId] = { status: 'in-progress', progress: 0, completedSections: [], startDate: new Date().toISOString().split('T')[0] };
    }

    const mp = allProgress[user.id].modules[moduleId];
    if (!mp.completedSections.includes(sectionId)) {
      mp.completedSections.push(sectionId);
    }
    mp.progress = Math.round((mp.completedSections.length / 6) * 100);
    if (mp.progress >= 100) {
      mp.status = 'completed';
      mp.completedDate = new Date().toISOString().split('T')[0];
    } else {
      mp.status = 'in-progress';
    }

    Storage.saveData(Storage.KEYS.PROGRESS, allProgress);
    if (allProgress[user.id]?.modules?.[moduleId]?.status === 'completed') Training.meaningful('lesson', moduleId, 'lesson-' + moduleId, 100);

    // Update tab indicator
    const tab = document.querySelector(`.tab-item[data-tab="${sectionId}"]`);
    if (tab && !tab.innerHTML.includes('check')) {
      tab.innerHTML = App.icon('check', 14) + ' ' + tab.textContent.trim();
      App.refreshIcons();
    }
  }

  function updateModuleProgress(moduleId, status, completedSections) {
    const user = Auth.getCurrentUser();
    const allProgress = Storage.getData(Storage.KEYS.PROGRESS, {});
    if (!allProgress[user.id]) allProgress[user.id] = { modules: {}, quizAttempts: [], simAttempts: [], drillParticipation: [] };
    if (!allProgress[user.id].modules[moduleId]) {
      allProgress[user.id].modules[moduleId] = { status: status, progress: 0, completedSections: completedSections || [], startDate: new Date().toISOString().split('T')[0] };
    }
    Storage.saveData(Storage.KEYS.PROGRESS, allProgress);
  }

  function completeModule(moduleId) {
    const user = Auth.getCurrentUser();
    const allProgress = Storage.getData(Storage.KEYS.PROGRESS, {});
    if (!allProgress[user.id]) allProgress[user.id] = { modules: {}, quizAttempts: [], simAttempts: [], drillParticipation: [] };
    if (!allProgress[user.id].modules[moduleId]) {
      allProgress[user.id].modules[moduleId] = { status: 'completed', progress: 100, completedSections: sectionIds.slice(), startDate: new Date().toISOString().split('T')[0] };
    } else {
      allProgress[user.id].modules[moduleId].status = 'completed';
      allProgress[user.id].modules[moduleId].progress = 100;
      allProgress[user.id].modules[moduleId].completedSections = sectionIds.slice();
      allProgress[user.id].modules[moduleId].completedDate = new Date().toISOString().split('T')[0];
    }
    Storage.saveData(Storage.KEYS.PROGRESS, allProgress);

    // Notification
    const module = Storage.getData(Storage.KEYS.MODULES, []).find(m => m.id === moduleId);
    if (module) {
      App.addNotification(user.id, `${module.title} module completed.`, 'learning');
    }

    Training.meaningful('lesson', moduleId, 'lesson-' + moduleId, 100);
    App.showToast('Module completed! Well done.', 'success');
    App.navigateTo('learn');
  }

  // ── Emergency Guide ───────────────────
  function renderEmergencyGuide(container) {
    const modules = Storage.getData(Storage.KEYS.MODULES, []);
    const settings = Storage.getData(Storage.KEYS.SETTINGS, {});
    const contacts = settings.emergencyContacts || DemoData.emergencyContacts;

    const categories = [
      { id: 'fire-safety', title: 'Fire', icon: 'flame', color: 'icon-fire', desc: 'Fire prevention, evacuation, and extinguisher use' },
      { id: 'earthquake-safety', title: 'Earthquake', icon: 'mountain', color: 'icon-earthquake', desc: 'Drop, Cover, Hold On and post-quake safety' },
      { id: 'electrical-safety', title: 'Electrical', icon: 'zap', color: 'icon-electrical', desc: 'Electrical hazard response and shock treatment' },
      { id: 'flood-safety', title: 'Flood', icon: 'droplets', color: 'icon-flood', desc: 'Flood evacuation and water safety' },
      { id: 'medical', title: 'Medical', icon: 'heart-pulse', color: 'icon-fire', desc: 'First aid basics and when to call for help' },
      { id: 'severe-weather', title: 'Severe Weather', icon: 'cloud-lightning', color: 'icon-weather', desc: 'Storm shelter, lightning, and heat safety' }
    ];

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Emergency guide</h1>
        <p class="page-subtitle">Quick reference for emergency situations. Tap a category for detailed instructions.</p>
      </div>

      <div class="grid-2 mb-8">
        ${categories.map(cat => `
          <div class="guide-category" onclick="Learning.showGuideDetail('${cat.id}')">
            <div class="guide-icon module-icon ${cat.color}">
              ${App.icon(cat.icon, 24)}
            </div>
            <div>
              <div class="guide-title">${cat.title}</div>
              <div class="guide-desc">${cat.desc}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Emergency contacts</h3>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr><th>Contact</th><th>Phone</th><th>Available</th></tr>
            </thead>
            <tbody>
              ${contacts.map(c => `
                <tr>
                  <td style="font-weight:500;">${App.escapeHtml(c.name)}</td>
                  <td><a href="tel:${c.phone}" style="font-weight:600;">${c.phone}</a></td>
                  <td class="text-small">${c.available}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div id="guide-detail-area" class="mt-6"></div>
    `;
    App.refreshIcons();
  }

  function showGuideDetail(categoryId) {
    const modules = Storage.getData(Storage.KEYS.MODULES, []);
    const module = modules.find(m => m.id === categoryId);
    const area = document.getElementById('guide-detail-area');

    if (categoryId === 'medical') {
      // Medical is a special case without a full module
      App.showModal({
        title: 'Medical Emergency',
        size: 'lg',
        body: `
          <h4 style="font-size:var(--text-lg);font-weight:600;margin-bottom:var(--sp-3);color:var(--green);">What to do</h4>
          <ul style="display:flex;flex-direction:column;gap:var(--sp-2);margin-bottom:var(--sp-5);">
            <li style="display:flex;gap:var(--sp-2);font-size:var(--text-sm);line-height:1.6;"><span style="color:var(--green);">${App.icon('check', 14)}</span> Call campus medical room or emergency services immediately.</li>
            <li style="display:flex;gap:var(--sp-2);font-size:var(--text-sm);line-height:1.6;"><span style="color:var(--green);">${App.icon('check', 14)}</span> Do not move an injured person unless they are in danger.</li>
            <li style="display:flex;gap:var(--sp-2);font-size:var(--text-sm);line-height:1.6;"><span style="color:var(--green);">${App.icon('check', 14)}</span> Apply pressure to bleeding wounds with clean cloth.</li>
            <li style="display:flex;gap:var(--sp-2);font-size:var(--text-sm);line-height:1.6;"><span style="color:var(--green);">${App.icon('check', 14)}</span> For burns: cool with running water for at least 10 minutes.</li>
            <li style="display:flex;gap:var(--sp-2);font-size:var(--text-sm);line-height:1.6;"><span style="color:var(--green);">${App.icon('check', 14)}</span> For choking: perform back blows and abdominal thrusts.</li>
            <li style="display:flex;gap:var(--sp-2);font-size:var(--text-sm);line-height:1.6;"><span style="color:var(--green);">${App.icon('check', 14)}</span> If CPR trained, begin CPR if the person is unresponsive and not breathing.</li>
          </ul>
          <h4 style="font-size:var(--text-lg);font-weight:600;margin-bottom:var(--sp-3);color:var(--red);">What NOT to do</h4>
          <ul style="display:flex;flex-direction:column;gap:var(--sp-2);">
            <li style="display:flex;gap:var(--sp-2);font-size:var(--text-sm);line-height:1.6;"><span style="color:var(--red);">${App.icon('x', 14)}</span> Do not give food or water to an unconscious person.</li>
            <li style="display:flex;gap:var(--sp-2);font-size:var(--text-sm);line-height:1.6;"><span style="color:var(--red);">${App.icon('x', 14)}</span> Do not remove embedded objects from wounds.</li>
            <li style="display:flex;gap:var(--sp-2);font-size:var(--text-sm);line-height:1.6;"><span style="color:var(--red);">${App.icon('x', 14)}</span> Do not apply ointments to burns.</li>
            <li style="display:flex;gap:var(--sp-2);font-size:var(--text-sm);line-height:1.6;"><span style="color:var(--red);">${App.icon('x', 14)}</span> Do not attempt procedures you are not trained for.</li>
          </ul>
        `
      });
      App.refreshIcons();
      return;
    }

    if (!module) return;

    App.showModal({
      title: module.title + ' — Emergency Guide',
      size: 'lg',
      body: `
        <div class="tabs mb-4" id="guide-tabs">
          <div class="tab-item active" onclick="Learning.switchGuideTab('guide-during')">During</div>
          <div class="tab-item" onclick="Learning.switchGuideTab('guide-before')">Before</div>
          <div class="tab-item" onclick="Learning.switchGuideTab('guide-after')">After</div>
          <div class="tab-item" onclick="Learning.switchGuideTab('guide-do')">Do</div>
          <div class="tab-item" onclick="Learning.switchGuideTab('guide-dont')">Don't</div>
        </div>

        <div id="guide-during">
          <h4 style="font-size:var(--text-lg);font-weight:600;margin-bottom:var(--sp-3);">What to do during</h4>
          ${module.during.map(item => `<div style="display:flex;gap:var(--sp-2);margin-bottom:var(--sp-2);font-size:var(--text-sm);line-height:1.6;"><span style="color:var(--green);flex-shrink:0;margin-top:3px;">${App.icon('check', 14)}</span> ${App.escapeHtml(item)}</div>`).join('')}
        </div>
        <div id="guide-before" class="hidden">
          <h4 style="font-size:var(--text-lg);font-weight:600;margin-bottom:var(--sp-3);">Before</h4>
          ${module.before.map(item => `<div style="display:flex;gap:var(--sp-2);margin-bottom:var(--sp-2);font-size:var(--text-sm);line-height:1.6;"><span style="flex-shrink:0;margin-top:3px;">${App.icon('info', 14)}</span> ${App.escapeHtml(item)}</div>`).join('')}
        </div>
        <div id="guide-after" class="hidden">
          <h4 style="font-size:var(--text-lg);font-weight:600;margin-bottom:var(--sp-3);">After</h4>
          ${module.after.map(item => `<div style="display:flex;gap:var(--sp-2);margin-bottom:var(--sp-2);font-size:var(--text-sm);line-height:1.6;"><span style="flex-shrink:0;margin-top:3px;">${App.icon('info', 14)}</span> ${App.escapeHtml(item)}</div>`).join('')}
        </div>
        <div id="guide-do" class="hidden">
          <h4 style="font-size:var(--text-lg);font-weight:600;margin-bottom:var(--sp-3);color:var(--green);">Do</h4>
          ${module.doList.map(item => `<div style="display:flex;gap:var(--sp-2);margin-bottom:var(--sp-2);font-size:var(--text-sm);line-height:1.6;"><span style="color:var(--green);flex-shrink:0;margin-top:3px;">${App.icon('check', 14)}</span> ${App.escapeHtml(item)}</div>`).join('')}
        </div>
        <div id="guide-dont" class="hidden">
          <h4 style="font-size:var(--text-lg);font-weight:600;margin-bottom:var(--sp-3);color:var(--red);">Don't</h4>
          ${module.dontList.map(item => `<div style="display:flex;gap:var(--sp-2);margin-bottom:var(--sp-2);font-size:var(--text-sm);line-height:1.6;"><span style="color:var(--red);flex-shrink:0;margin-top:3px;">${App.icon('x', 14)}</span> ${App.escapeHtml(item)}</div>`).join('')}
        </div>
      `
    });
    App.refreshIcons();
  }

  function switchGuideTab(tabId) {
    const tabs = ['guide-during', 'guide-before', 'guide-after', 'guide-do', 'guide-dont'];
    tabs.forEach(t => {
      const el = document.getElementById(t);
      if (el) el.classList.toggle('hidden', t !== tabId);
    });
    // Update tab active state
    const modal = document.getElementById('modal-container');
    if (modal) {
      modal.querySelectorAll('#guide-tabs .tab-item').forEach((t, i) => {
        t.classList.toggle('active', tabs[i] === tabId);
      });
    }
  }

  return {
    render,
    renderModule,
    renderEmergencyGuide,
    switchTab,
    nextSection,
    prevSection,
    markSectionComplete,
    completeModule,
    handleChecklistChange,
    showGuideDetail,
    switchGuideTab
  };
})();
