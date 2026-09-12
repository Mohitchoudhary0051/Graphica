/* ============================================
   GRAPHICA — Main Application Controller
   SPA router, modals, toasts, search, core UI
   ============================================ */

const App = (() => {
  let currentView = '';
  let notificationPanelOpen = false;

  // ── Lucide icon helper ────────────────
  function icon(name, size = 18) {
    return `<i data-lucide="${name}" style="width:${size}px;height:${size}px;"></i>`;
  }

  // ── Initialize Application ────────────
  function init() {
    DemoData.initializeDemoData();
    TrainingUI.init();

    // Route based on hash or auth state
    window.addEventListener('hashchange', handleRoute);
    handleRoute();

    // Close notification panel when clicking outside
    document.addEventListener('click', (e) => {
      if (notificationPanelOpen && !e.target.closest('.notification-panel') && !e.target.closest('.notif-trigger')) {
        closeNotificationPanel();
      }
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
      const sr = document.getElementById('search-results');
      if (sr && !e.target.closest('.search-bar-wrapper')) {
        sr.classList.remove('active');
      }
    });
  }

  // ── Routing ───────────────────────────
  function handleRoute() {
    const hash = window.location.hash.slice(1) || '';
    Activities.cleanup();

    if (!hash || hash === 'home') {
      if (Auth.isAuthenticated()) {
        navigateTo('dashboard');
      } else {
        renderLanding();
      }
      return;
    }

    if (hash === 'login') {
      renderLogin();
      return;
    }

    if (hash === 'logout') {
      Auth.logout();
      window.location.hash = '#home';
      return;
    }

    // All other routes require auth
    if (!Auth.isAuthenticated()) {
      navigateTo('login');
      return;
    }

    // Admin-only routes
    const adminRoutes = ['admin-dashboard', 'admin-hazards', 'admin-learning', 'admin-simulations', 'admin-maps', 'admin-alerts', 'admin-drills', 'admin-users', 'admin-analytics', 'admin-settings'];
    if (adminRoutes.includes(hash) && !Auth.isAdmin()) {
      navigateTo('dashboard');
      return;
    }

    if ((hash === 'training-analytics' && !Auth.isStaff()) || (hash === 'activity-management' && !Auth.isAdmin()) || (hash === 'my-tasks' && !Auth.isStaff())) { navigateTo('dashboard'); return; }
    try { Assignments.processRules(); } catch (error) { console.error(error); }
    renderAppShell(hash);
  }

  function navigateTo(route) {
    window.location.hash = '#' + route;
  }

  // ── Landing Page ──────────────────────
  function renderLanding() {
    currentView = 'home';
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="landing-page">
        <nav class="landing-nav">
          <div class="nav-logo">
            <div class="logo-mark">G</div>
            <span>GRAPHICA</span>
          </div>
          <div class="nav-links">
            <a href="#home">Home</a>
            <a href="#login">Log in</a>
            <button class="btn btn-primary btn-sm" onclick="App.navigateTo('login')">Get started</button>
          </div>
        </nav>

        <section class="hero-section">
          <h1 class="hero-title">Prepare before<br>the emergency.</h1>
          <p class="hero-subtitle">A practical preparedness platform for safer schools and colleges.</p>
          <div class="hero-actions">
            <button class="btn btn-primary btn-lg" onclick="App.navigateTo('login')">
              ${icon('book-open', 16)} Start learning
            </button>
            <button class="btn btn-secondary btn-lg" onclick="App.navigateTo('login')">
              ${icon('shield', 16)} Explore safety guide
            </button>
          </div>
        </section>

        <section class="process-section">
          <div class="section-label">How it works</div>
          <h2 class="section-title">A continuous cycle of preparedness</h2>
          <p class="section-subtitle">GRAPHICA takes your institution through every stage — from learning to response to improvement.</p>
          <div class="process-steps">
            <div class="process-step">
              <div class="step-number">01</div>
              <div class="step-icon">${icon('book-open', 24)}</div>
              <div class="step-title">Learn</div>
              <div class="step-desc">Safety modules & guides</div>
            </div>
            <div class="process-arrow">${icon('arrow-right', 20)}</div>
            <div class="process-step">
              <div class="step-number">02</div>
              <div class="step-icon">${icon('target', 24)}</div>
              <div class="step-title">Practice</div>
              <div class="step-desc">Quizzes & simulations</div>
            </div>
            <div class="process-arrow">${icon('arrow-right', 20)}</div>
            <div class="process-step">
              <div class="step-number">03</div>
              <div class="step-icon">${icon('alert-triangle', 24)}</div>
              <div class="step-title">Report</div>
              <div class="step-desc">Hazard identification</div>
            </div>
            <div class="process-arrow">${icon('arrow-right', 20)}</div>
            <div class="process-step">
              <div class="step-number">04</div>
              <div class="step-icon">${icon('siren', 24)}</div>
              <div class="step-title">Respond</div>
              <div class="step-desc">Emergency action</div>
            </div>
          </div>
        </section>

        <section class="benefits-section">
          <div class="section-label">Why GRAPHICA</div>
          <h2 class="section-title mb-6">Built for real institutional safety</h2>
          <div class="benefits-grid">
            <div class="benefit-card">
              <div class="benefit-icon icon-green">${icon('users', 20)}</div>
              <h3 class="benefit-title">Prepared people</h3>
              <p class="benefit-text">Students and staff learn through structured modules, interactive quizzes, and realistic simulations — building confidence that lasts.</p>
            </div>
            <div class="benefit-card">
              <div class="benefit-icon icon-blue">${icon('building-2', 20)}</div>
              <h3 class="benefit-title">Safer facilities</h3>
              <p class="benefit-text">Hazard reporting, risk assessment, and evacuation mapping help identify and resolve safety issues before they become emergencies.</p>
            </div>
            <div class="benefit-card">
              <div class="benefit-icon icon-amber">${icon('clock', 20)}</div>
              <h3 class="benefit-title">Faster response</h3>
              <p class="benefit-text">Emergency alerts, drill management, and clear action guides reduce response time when every second matters.</p>
            </div>
          </div>
        </section>

        <section class="about-section">
          <div class="about-inner">
            <div>
              <div class="section-label">About GRAPHICA</div>
              <h2 class="about-title">Preparation is not done during a disaster.</h2>
              <p class="about-text">GRAPHICA turns disaster awareness into continuous, measurable preparedness. From structured learning to real-time hazard tracking, it gives educational institutions the tools to protect their communities.</p>
              <div class="about-features">
                <div class="about-feature">
                  <span class="feature-check">${icon('check', 16)}</span>
                  <span>Structured learning modules for every disaster type</span>
                </div>
                <div class="about-feature">
                  <span class="feature-check">${icon('check', 16)}</span>
                  <span>Interactive quizzes and realistic simulations</span>
                </div>
                <div class="about-feature">
                  <span class="feature-check">${icon('check', 16)}</span>
                  <span>Hazard reporting with automated classification</span>
                </div>
                <div class="about-feature">
                  <span class="feature-check">${icon('check', 16)}</span>
                  <span>Evacuation maps and emergency guides</span>
                </div>
                <div class="about-feature">
                  <span class="feature-check">${icon('check', 16)}</span>
                  <span>Drill scheduling and participation tracking</span>
                </div>
              </div>
            </div>
            <div>
              <div class="stat-grid">
                <div class="stat-card">
                  <div class="stat-label">Safety modules</div>
                  <div class="stat-value">5</div>
                  <div class="stat-meta">Disaster types covered</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Simulations</div>
                  <div class="stat-value">3</div>
                  <div class="stat-meta">Interactive scenarios</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Response time</div>
                  <div class="stat-value">40%</div>
                  <div class="stat-meta">Faster with preparation</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Compliance</div>
                  <div class="stat-value">100%</div>
                  <div class="stat-meta">Safety audit ready</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer class="landing-footer">
          <div class="footer-inner">
            <div class="footer-brand">
              <div>
                <div class="brand-name">GRAPHICA</div>
                <div class="brand-tagline">Prepare before the emergency.</div>
              </div>
            </div>
            <div class="footer-links">
              <a href="#">Safety</a>
              <a href="#">Privacy</a>
              <a href="#">Accessibility</a>
              <a href="#">About</a>
            </div>
            <div class="footer-note">Prototype for educational demonstration.</div>
          </div>
        </footer>
      </div>
    `;
    refreshIcons();
  }

  // ── Login Page ────────────────────────
  function renderLogin() {
    currentView = 'login';
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="login-page">
        <div class="login-card">
          <div class="login-logo">
            <div class="logo-mark">G</div>
            <span class="logo-text">GRAPHICA</span>
          </div>
          <h1 class="login-title">Sign in</h1>
          <p class="login-subtitle">Access your safety preparedness dashboard.</p>

          <div class="demo-accounts">
            <div class="demo-title">Demo accounts <span style="font-size:11px;color:var(--text-muted);">(password: demo123)</span></div>
            <div class="demo-account-item" onclick="App.fillLogin('student@graphica.demo','demo123')">
              <span class="account-email">student@graphica.demo</span>
              <span class="account-role badge badge-neutral">Student</span>
            </div>
            <div class="demo-account-item" onclick="App.fillLogin('sneha@greenfield.edu','demo123')">
              <span class="account-email">sneha@greenfield.edu</span>
              <span class="account-role badge badge-neutral">Student</span>
            </div>
            <div class="demo-account-item" onclick="App.fillLogin('staff@graphica.demo','demo123')">
              <span class="account-email">staff@graphica.demo</span>
              <span class="account-role badge badge-neutral">Staff</span>
            </div>
            <div class="demo-account-item" onclick="App.fillLogin('vikram@greenfield.edu','demo123')">
              <span class="account-email">vikram@greenfield.edu</span>
              <span class="account-role badge badge-neutral">Staff</span>
            </div>
            <div class="demo-account-item" onclick="App.fillLogin('admin@graphica.demo','demo123')">
              <span class="account-email">admin@graphica.demo</span>
              <span class="account-role badge badge-neutral">Admin</span>
            </div>
          </div>

          <div id="login-error" class="login-error"></div>

          <form id="login-form" onsubmit="App.handleLogin(event)">
            <div class="form-group">
              <label class="form-label" for="login-email">Email</label>
              <input class="form-input" type="email" id="login-email" placeholder="Enter your email" required autocomplete="email">
            </div>
            <div class="form-group">
              <label class="form-label" for="login-password">Password</label>
              <input class="form-input" type="password" id="login-password" placeholder="Enter your password" required autocomplete="current-password">
            </div>
            <button type="submit" class="btn btn-primary w-full btn-lg">Sign in</button>
          </form>

          <p class="text-small text-center mt-4">
            <a href="#home">← Back to home</a>
          </p>
        </div>
      </div>
    `;
    refreshIcons();
  }

  function fillLogin(email, password) {
    document.getElementById('login-email').value = email;
    document.getElementById('login-password').value = password;
  }

  function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    const result = Auth.login(email, password);
    if (result.success) {
      navigateTo(Auth.isAdmin() ? 'admin-dashboard' : 'dashboard');
    } else {
      errorEl.textContent = result.error;
      errorEl.classList.add('visible');
    }
  }

  // ── App Shell ─────────────────────────
  function renderAppShell(view) {
    const app = document.getElementById('app');
    const user = Auth.getCurrentUser();

    if (document.querySelector('.app-container')) {
      // Shell already rendered — just update main content
      currentView = view;
      renderView(view);
      updateActiveNav(view);
      return;
    }

    currentView = view;
    const isAdminUser = Auth.isAdmin();
    const isStaffUser = Auth.isStaff();

    // Build navigation items based on role
    let navItems = '';

    if (isAdminUser) {
      navItems = `
        <div class="nav-section-label">Overview</div>
        <a class="nav-item" data-view="admin-dashboard" onclick="App.navigateTo('admin-dashboard')">
          <span class="nav-icon">${icon('layout-dashboard')}</span> Dashboard
        </a>
        <div class="nav-section-label">Management</div>
        <a class="nav-item" data-view="admin-hazards" onclick="App.navigateTo('admin-hazards')">
          <span class="nav-icon">${icon('alert-triangle')}</span> Hazard reports
          <span class="nav-badge" id="nav-hazard-count"></span>
        </a>
        <a class="nav-item" data-view="admin-learning" onclick="App.navigateTo('admin-learning')">
          <span class="nav-icon">${icon('book-open')}</span> Learning
        </a>
        <a class="nav-item" data-view="admin-simulations" onclick="App.navigateTo('admin-simulations')">
          <span class="nav-icon">${icon('target')}</span> Simulations
        </a>
        <a class="nav-item" data-view="admin-maps" onclick="App.navigateTo('admin-maps')">
          <span class="nav-icon">${icon('map')}</span> Evacuation maps
        </a>
        <a class="nav-item" data-view="admin-alerts" onclick="App.navigateTo('admin-alerts')">
          <span class="nav-icon">${icon('bell-ring')}</span> Emergency alerts
        </a>
        <a class="nav-item" data-view="admin-drills" onclick="App.navigateTo('admin-drills')">
          <span class="nav-icon">${icon('siren')}</span> Drills
        </a>
        <div class="nav-section-label">Administration</div>
        <a class="nav-item" data-view="admin-users" onclick="App.navigateTo('admin-users')">
          <span class="nav-icon">${icon('users')}</span> Users
        </a>
        <a class="nav-item" data-view="admin-analytics" onclick="App.navigateTo('admin-analytics')">
          <span class="nav-icon">${icon('bar-chart-3')}</span> Analytics
        </a>
        <a class="nav-item" data-view="admin-settings" onclick="App.navigateTo('admin-settings')">
          <span class="nav-icon">${icon('settings')}</span> Settings
        </a>
      `;
    } else {
      navItems = `
        <div class="nav-section-label">Main</div>
        <a class="nav-item" data-view="dashboard" onclick="App.navigateTo('dashboard')">
          <span class="nav-icon">${icon('layout-dashboard')}</span> Dashboard
        </a>
        <a class="nav-item" data-view="learn" onclick="App.navigateTo('learn')">
          <span class="nav-icon">${icon('book-open')}</span> Learning Hub
        </a>
        <a class="nav-item" data-view="practice" onclick="App.navigateTo('practice')">
          <span class="nav-icon">${icon('target')}</span> Practice
        </a>
        <a class="nav-item" data-view="assignments" onclick="App.navigateTo('assignments')">
          <span class="nav-icon">${icon('clipboard-list')}</span> My Assessments
        </a>
        <div class="nav-section-label">Safety</div>
        <a class="nav-item" data-view="emergency-guide" onclick="App.navigateTo('emergency-guide')">
          <span class="nav-icon">${icon('shield')}</span> Emergency guide
        </a>
        <a class="nav-item" data-view="evacuation-map" onclick="App.navigateTo('evacuation-map')">
          <span class="nav-icon">${icon('map')}</span> Evacuation map
        </a>
        <a class="nav-item" data-view="report-hazard" onclick="App.navigateTo('report-hazard')">
          <span class="nav-icon">${icon('alert-triangle')}</span> Report hazard
        </a>
        <a class="nav-item" data-view="alerts" onclick="App.navigateTo('alerts')">
          <span class="nav-icon">${icon('bell-ring')}</span> Alerts
        </a>
        <a class="nav-item" data-view="drills" onclick="App.navigateTo('drills')">
          <span class="nav-icon">${icon('siren')}</span> Drills
        </a>
        <a class="nav-item" data-view="progress" onclick="App.navigateTo('progress')">
          <span class="nav-icon">${icon('trending-up')}</span> My progress
        </a>
        <a class="nav-item" data-view="settings" onclick="App.navigateTo('settings')">
          <span class="nav-icon">${icon('settings')}</span> Settings
        </a>
      `;
    }

    if (isStaffUser) {
      navItems += `<div class="nav-section-label">Staff</div>`;
      navItems += `<a class="nav-item" data-view="my-tasks" onclick="App.navigateTo('my-tasks')">${icon('clipboard-check')} My Tasks</a>`;
      navItems += `<a class="nav-item" style="color:var(--red);font-weight:600;cursor:pointer;" onclick="App.openEmergencyBroadcastModal()"><span class="nav-icon" style="color:var(--red);">${icon('siren')}</span> Broadcast Alert</a>`;
    }
    navItems += `<div class="nav-section-label">Training</div><a class="nav-item" href="#assignments" data-view="assignments">${icon('clipboard-list')} ${isStaffUser ? 'Quiz assignments' : 'Assigned assessments'}</a>${isAdminUser ? `<a class="nav-item" href="#learn" data-view="learn">${icon('book-open')} Learning Hub</a>` : ''}${isStaffUser ? `<a class="nav-item" href="#training-analytics" data-view="training-analytics">${icon('bar-chart-3')} Learning analytics</a>` : ''}${isAdminUser ? `<a class="nav-item" href="#activity-management" data-view="activity-management">${icon('settings')} Activity management</a>` : ''}`;

    // Count unread notifications
    const notifications = Storage.getData(Storage.KEYS.NOTIFICATIONS, []);
    const unreadCount = notifications.filter(n => n.userId === user.id && !n.read).length;

    // Count open hazards for admin badge
    const reports = Storage.getData(Storage.KEYS.REPORTS, []);
    const openReports = reports.filter(r => r.status !== 'resolved').length;

    app.innerHTML = `
      <div class="sidebar-overlay" id="sidebar-overlay" onclick="App.toggleSidebar()"></div>
      <div class="app-container">
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-logo">
            <div class="logo-mark">G</div>
            <span class="logo-text">GRAPHICA</span>
          </div>
          <nav class="sidebar-nav" role="navigation" aria-label="Main navigation">
            ${navItems}
          </nav>
          <div class="sidebar-footer">
            <div class="sidebar-user" onclick="App.navigateTo('${isAdminUser ? 'admin-settings' : 'settings'}')">
              <div class="user-avatar">${Auth.getInitials(user.name)}</div>
              <div class="user-info">
                <div class="user-name">${escapeHtml(user.name)}</div>
                <div class="user-role">${capitalize(user.role)}</div>
              </div>
            </div>
          </div>
        </aside>

        <div class="main-content">
          <header class="top-header">
            <div class="top-header-left">
              <button class="menu-toggle" onclick="App.toggleSidebar()" aria-label="Toggle menu">
                ${icon('menu', 20)}
              </button>
              <div class="search-bar-wrapper" style="position:relative;">
                <div class="search-bar">
                  <span class="search-icon">${icon('search', 16)}</span>
                  <input type="text" id="global-search" placeholder="Search modules, guides, reports…" oninput="App.handleSearch(this.value)" aria-label="Search">
                </div>
                <div class="search-results" id="search-results"></div>
              </div>
            </div>
            <div class="top-header-right">
              ${isStaffUser ? `
                <button class="btn btn-sm" onclick="App.openEmergencyBroadcastModal()" style="display:inline-flex;align-items:center;gap:6px;background:var(--red);color:#fff;font-weight:600;padding:6px 14px;border-radius:6px;border:none;box-shadow:0 2px 8px rgba(229,62,62,0.35);cursor:pointer;" title="Send emergency broadcast to all devices">
                  ${icon('siren', 16)} <span>Broadcast Alert</span>
                </button>
              ` : ''}
              <button class="header-btn notif-trigger" onclick="App.toggleNotificationPanel()" aria-label="Notifications">
                ${icon('bell', 18)}
                ${unreadCount > 0 ? '<span class="notification-dot"></span>' : ''}
              </button>
              <button class="header-btn" onclick="App.navigateTo('${isAdminUser ? 'admin-settings' : 'settings'}')" aria-label="Settings">
                ${icon('settings', 18)}
              </button>
              <button class="header-btn" onclick="App.navigateTo('logout')" aria-label="Sign out" title="Sign out">
                ${icon('log-out', 18)}
              </button>
            </div>
          </header>

          <div id="alert-banner-area"></div>

          <div class="page-content" id="main-view">
            <!-- Dynamic view content -->
          </div>

          <footer class="app-footer">
            <div class="footer-content">
              <span>GRAPHICA — Prepare before the emergency.</span>
              <div class="footer-links">
                <a href="#">Safety</a>
                <a href="#">Privacy</a>
                <a href="#">Accessibility</a>
              </div>
              <span>Prototype for educational demonstration.</span>
            </div>
          </footer>
        </div>
      </div>

      <div class="notification-panel" id="notification-panel">
        <div class="notification-panel-header">
          <h3 style="font-size:var(--text-base);font-weight:600;">Notifications</h3>
          <button class="btn btn-ghost btn-sm" onclick="App.markAllRead()">Mark all read</button>
        </div>
        <div class="notification-list" id="notification-list"></div>
      </div>

      <div class="modal-overlay" id="modal-overlay" onclick="App.closeModal(event)">
        <div class="modal" id="modal-container" onclick="event.stopPropagation()"></div>
      </div>

      <div class="toast-container" id="toast-container"></div>
    `;

    // Update admin hazard badge count
    const hazardBadge = document.getElementById('nav-hazard-count');
    if (hazardBadge && openReports > 0) {
      hazardBadge.textContent = openReports;
    }

    renderAlertBanners();
    renderView(view);
    updateActiveNav(view);
    refreshIcons();
  }

  function renderView(view) {
    const mainView = document.getElementById('main-view');
    if (!mainView) return;

    // Static routes
    const staticRoutes = {
      'dashboard': () => { Dashboard.render(mainView); TrainingUI.dashboard(mainView); },
      'learn': () => Activities.hub(mainView),
      'assignments': () => Assignments.render(mainView),
      'training-analytics': () => TrainingUI.analytics(mainView),
      'activity-management': () => Activities.management(mainView),
      'practice': () => Simulations.renderList(mainView),
      'emergency-guide': () => Learning.renderEmergencyGuide(mainView),
      'evacuation-map': () => { Maps.render(mainView); mainView.insertAdjacentHTML('afterbegin', '<section class="training"><a class="btn btn-secondary" href="#activity-route-fire">Practice the Route</a></section>'); },
      'report-hazard': () => Hazards.renderReportForm(mainView),
      'hazard-history': () => Hazards.renderHistory(mainView),
      'alerts': () => Alerts.renderList(mainView),
      'drills': () => { Drills.renderStudentView(mainView); TrainingUI.drills(mainView); },
      'progress': () => { Dashboard.renderProgress(mainView); TrainingUI.progress(mainView); },
      'my-tasks': () => Admin.renderMyTasks(mainView),
      'settings': () => Admin.renderSettings(mainView),
      'admin-dashboard': () => { Admin.renderDashboard(mainView); TrainingUI.dashboard(mainView); },
      'admin-hazards': () => Admin.renderHazards(mainView),
      'admin-learning': () => Admin.renderLearningMgmt(mainView),
      'admin-simulations': () => Admin.renderSimulationMgmt(mainView),
      'admin-maps': () => Maps.renderAdmin(mainView),
      'admin-alerts': () => Admin.renderAlerts(mainView),
      'admin-drills': () => Admin.renderDrills(mainView),
      'admin-users': () => Admin.renderUsers(mainView),
      'admin-analytics': () => Admin.renderAnalytics(mainView),
      'admin-settings': () => Admin.renderSettings(mainView)
    };

    if (staticRoutes[view]) {
      staticRoutes[view]();
    } else if (view.startsWith('activity-')) {
      Activities.open(view.slice(9));
    } else if (view.startsWith('learn-')) {
      Learning.renderModule(mainView, view.replace('learn-', ''));
    } else if (view.startsWith('quiz-')) {
      Quizzes.start(mainView, view.replace('quiz-', ''));
    } else if (view.startsWith('sim-')) {
      Simulations.start(mainView, view);
    } else {
      mainView.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${icon('file-question', 48)}</div>
          <h3 class="empty-title">Page not found</h3>
          <p class="empty-text">The page you're looking for doesn't exist.</p>
          <button class="btn btn-primary" onclick="App.navigateTo('dashboard')">Go to dashboard</button>
        </div>
      `;
    }
    refreshIcons();
    window.scrollTo(0, 0);
  }

  function updateActiveNav(view) {
    // Map sub-routes to their parent nav item
    let navView = view;
    if (view.startsWith('learn-')) navView = 'learn';
    else if (view.startsWith('quiz-')) navView = 'practice';
    else if (view.startsWith('sim-')) navView = 'practice';
    else if (view === 'hazard-history') navView = 'report-hazard';

    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === navView);
    });
  }

  // ── Alert Banners ─────────────────────
  function renderAlertBanners() {
    const area = document.getElementById('alert-banner-area');
    if (!area) return;

    const alerts = Storage.getData(Storage.KEYS.ALERTS, []);
    const now = new Date();
    const activeAlerts = alerts.filter(a => {
      if (!a.active) return false;
      if (a.expiryDate && new Date(a.expiryDate) < now) return false;
      return true;
    });

    if (activeAlerts.length === 0) {
      area.innerHTML = '';
      return;
    }

    area.innerHTML = activeAlerts.map(alert => `
      <div class="alert-banner alert-${alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'warning' : 'info'}">
        <span>${icon(alert.severity === 'critical' ? 'alert-circle' : alert.severity === 'warning' ? 'alert-triangle' : 'info', 16)}</span>
        <span><strong>${escapeHtml(alert.title)}</strong> — ${escapeHtml(alert.message)}</span>
        <button class="alert-dismiss" onclick="this.parentElement.remove()" aria-label="Dismiss">${icon('x', 14)}</button>
      </div>
    `).join('');
    refreshIcons();
  }

  // ── Sidebar Toggle ────────────────────
  function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  }

  // ── Modal System ──────────────────────
  function showModal(config) {
    const overlay = document.getElementById('modal-overlay');
    const container = document.getElementById('modal-container');
    if (!overlay || !container) return;

    container.className = `modal ${config.size === 'lg' ? 'modal-lg' : config.size === 'sm' ? 'modal-sm' : ''}`;
    container.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">${escapeHtml(config.title || '')}</h3>
        <button class="modal-close" onclick="App.closeModal()" aria-label="Close">${icon('x', 18)}</button>
      </div>
      <div class="modal-body">${config.body || ''}</div>
      ${config.footer ? `<div class="modal-footer">${config.footer}</div>` : ''}
    `;

    overlay.classList.add('active');
    refreshIcons();

    // Focus trap
    const focusable = container.querySelector('button, input, select, textarea');
    if (focusable) focusable.focus();
  }

  function closeModal(e) {
    if (e && e.target && !e.target.classList.contains('modal-overlay')) return;
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.remove('active');
  }

  // ── Toast System ──────────────────────
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const iconName = {
      success: 'check-circle',
      warning: 'alert-triangle',
      error: 'alert-circle',
      info: 'info'
    }[type] || 'info';

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icon(iconName, 18)}</span>
      <span class="toast-message">${escapeHtml(message)}</span>
      <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Close">${icon('x', 14)}</button>
    `;

    container.appendChild(toast);
    refreshIcons();

    // Animate in
    requestAnimationFrame(() => toast.classList.add('toast-visible'));

    // Auto remove
    setTimeout(() => {
      toast.classList.remove('toast-visible');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // ── Notification Panel ────────────────
  function toggleNotificationPanel() {
    const panel = document.getElementById('notification-panel');
    notificationPanelOpen = !notificationPanelOpen;
    panel.classList.toggle('open', notificationPanelOpen);
    if (notificationPanelOpen) renderNotifications();
  }

  function closeNotificationPanel() {
    const panel = document.getElementById('notification-panel');
    notificationPanelOpen = false;
    panel.classList.remove('open');
  }

  function renderNotifications() {
    const list = document.getElementById('notification-list');
    if (!list) return;

    const user = Auth.getCurrentUser();
    const notifications = Storage.getData(Storage.KEYS.NOTIFICATIONS, []);
    const userNotifs = notifications.filter(n => n.userId === user.id).sort((a, b) => new Date(b.date) - new Date(a.date));

    if (userNotifs.length === 0) {
      list.innerHTML = `
        <div class="empty-state" style="padding:var(--sp-8) var(--sp-4);">
          <div class="empty-icon">${icon('bell-off', 32)}</div>
          <p class="empty-title" style="font-size:var(--text-sm);">No notifications</p>
        </div>
      `;
      refreshIcons();
      return;
    }

    list.innerHTML = userNotifs.map(n => `
      <div class="notification-item ${n.read ? '' : 'unread'}" onclick="App.readNotification('${n.id}')">
        <span class="notif-dot"></span>
        <div>
          <div class="notif-text">${escapeHtml(n.message)}</div>
          <div class="notif-time">${formatRelativeDate(n.date)}</div>
        </div>
      </div>
    `).join('');
    refreshIcons();
  }

  function readNotification(id) {
    const notifications = Storage.getData(Storage.KEYS.NOTIFICATIONS, []);
    const idx = notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
      if (notifications[idx].userId !== Auth.getCurrentUser()?.id) return;
      notifications[idx].read = true;
      Storage.saveData(Storage.KEYS.NOTIFICATIONS, notifications);
      renderNotifications();
      if (notifications[idx].route) { closeNotificationPanel(); navigateTo(notifications[idx].route); }
      // Update dot
      const dot = document.querySelector('.notification-dot');
      const user = Auth.getCurrentUser();
      const unread = notifications.filter(n => n.userId === user.id && !n.read).length;
      if (dot && unread === 0) dot.remove();
    }
  }

  function markAllRead() {
    const user = Auth.getCurrentUser();
    const notifications = Storage.getData(Storage.KEYS.NOTIFICATIONS, []);
    notifications.forEach(n => {
      if (n.userId === user.id) n.read = true;
    });
    Storage.saveData(Storage.KEYS.NOTIFICATIONS, notifications);
    renderNotifications();
    const dot = document.querySelector('.notification-dot');
    if (dot) dot.remove();
    showToast('All notifications marked as read.', 'success');
  }

  function addNotification(userId, message, type = 'info') {
    const notifications = Storage.getData(Storage.KEYS.NOTIFICATIONS, []);
    notifications.push({
      id: 'notif-' + crypto.randomUUID(),
      userId,
      message,
      type,
      date: new Date().toISOString(),
      read: false
    });
    Storage.saveData(Storage.KEYS.NOTIFICATIONS, notifications);
  }

  // ── Global Search ─────────────────────
  function handleSearch(query) {
    const resultsEl = document.getElementById('search-results');
    if (!resultsEl) return;

    if (!query || query.length < 2) {
      resultsEl.classList.remove('active');
      return;
    }

    const q = query.toLowerCase();
    const results = [];

    // Search learning modules
    const modules = Storage.getData(Storage.KEYS.MODULES, []);
    modules.forEach(m => {
      if (m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)) {
        results.push({ type: 'Module', title: m.title, view: 'learn-' + m.id });
      }
    });

    // Search emergency guide categories
    const guideCategories = ['Fire', 'Earthquake', 'Electrical', 'Flood', 'Medical', 'Severe Weather'];
    guideCategories.forEach(cat => {
      if (cat.toLowerCase().includes(q)) {
        results.push({ type: 'Guide', title: cat + ' Emergency Guide', view: 'emergency-guide' });
      }
    });

    // Search hazard reports
    const reports = Storage.getData(Storage.KEYS.REPORTS, []);
    reports.forEach(r => {
      if (r.title.toLowerCase().includes(q) || r.category.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)) {
        results.push({ type: 'Report', title: `${r.id} — ${r.title}`, view: 'hazard-history' });
      }
    });

    // Search drills
    const drills = Storage.getData(Storage.KEYS.DRILLS, []);
    drills.forEach(d => {
      if (d.type.toLowerCase().includes(q) || d.buildingName.toLowerCase().includes(q)) {
        results.push({ type: 'Drill', title: d.type + ' — ' + d.buildingName, view: 'drills' });
      }
    });

    if (results.length === 0) {
      resultsEl.innerHTML = `<div class="search-result-item"><span class="text-muted">No results for "${escapeHtml(query)}"</span></div>`;
    } else {
      resultsEl.innerHTML = results.slice(0, 8).map(r => `
        <div class="search-result-item" onclick="App.navigateTo('${r.view}'); document.getElementById('search-results').classList.remove('active'); document.getElementById('global-search').value='';">
          <span class="result-type">${r.type}</span>
          <span>${escapeHtml(r.title)}</span>
        </div>
      `).join('');
    }

    resultsEl.classList.add('active');
  }

  // ── Utility Functions ─────────────────
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function formatRelativeDate(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const d = new Date(dateStr);
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr);
  }

  function refreshIcons() {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  function getSeverityBadge(severity) {
    const map = {
      critical: 'badge-red',
      high: 'badge-red',
      medium: 'badge-orange',
      low: 'badge-amber',
      info: 'badge-blue',
      information: 'badge-blue',
      warning: 'badge-orange'
    };
    return `<span class="badge ${map[severity] || 'badge-neutral'}">${capitalize(severity)}</span>`;
  }

  function getStatusBadge(status) {
    const map = {
      'reported': 'badge-amber',
      'under-review': 'badge-orange',
      'assigned': 'badge-blue',
      'in-progress': 'badge-blue',
      'resolved': 'badge-green',
      'completed': 'badge-green',
      'upcoming': 'badge-blue',
      'active': 'badge-green',
      'inactive': 'badge-neutral',
      'not-started': 'badge-neutral',
      'in-progress': 'badge-blue'
    };
    const label = status.replace(/-/g, ' ');
    return `<span class="badge ${map[status] || 'badge-neutral'}">${capitalize(label)}</span>`;
  }

  function getModuleIconClass(moduleId) {
    const map = {
      'fire-safety': 'icon-fire',
      'earthquake-safety': 'icon-earthquake',
      'electrical-safety': 'icon-electrical',
      'flood-safety': 'icon-flood',
      'severe-weather': 'icon-weather'
    };
    return map[moduleId] || 'icon-fire';
  }

  function openEmergencyBroadcastModal() {
    if (!Auth.isStaff()) {
      showToast('Unauthorized: Only Staff and Admins can broadcast emergency alerts.', 'error');
      return;
    }

    const activeData = (typeof SocketClient !== 'undefined' && SocketClient.getActiveUsersData)
      ? SocketClient.getActiveUsersData()
      : { totalConnected: 1 };
    const connectedCount = activeData.totalConnected || 1;

    showModal({
      title: '🚨 Dispatch Real-Time Emergency Broadcast',
      body: `
        <div style="background:var(--red-bg);border-left:4px solid var(--red);padding:12px 16px;border-radius:8px;margin-bottom:18px;">
          <div style="font-weight:700;color:var(--red);font-size:14px;display:flex;align-items:center;gap:6px;">
            ${icon('siren', 18)} High-Urgency Emergency Broadcast
          </div>
          <p style="font-size:13px;color:var(--text);margin-top:4px;line-height:1.5;">
            This emergency alert will <strong>immediately trigger on all connected device(s)</strong> with real-time warning overlays, browser sound sirens, and emergency instructions.
          </p>
        </div>

        <div class="form-group">
          <label class="form-label">Alert Headline / Title <span class="required">*</span></label>
          <input class="form-input" id="broadcast-alert-title" placeholder="e.g., Critical Fire Hazard — Evacuate Block A Immediately" required>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Threat Severity</label>
            <select class="form-select" id="broadcast-alert-severity">
              <option value="critical" selected>🚨 Critical (Immediate Danger / Evacuate)</option>
              <option value="warning">⚠️ Warning (Hazard Detected / Caution)</option>
              <option value="info">ℹ️ Informational (Safety Notice)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Threat Type</label>
            <select class="form-select" id="broadcast-alert-type">
              <option value="fire">Fire & Smoke Hazard</option>
              <option value="earthquake">Earthquake Tremor</option>
              <option value="weather">Severe Weather / Storm</option>
              <option value="intruder">Lockdown / Security Threat</option>
              <option value="chemical">Chemical / Gas Leak</option>
              <option value="drill">Emergency Drill Exercise</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Affected Building / Area</label>
            <select class="form-select" id="broadcast-alert-building">
              <option value="all" selected>All Campus Buildings (Campus-Wide)</option>
              <option value="block-a">Block A (Academic — Engineering)</option>
              <option value="block-b">Block B (Academic — Sciences)</option>
              <option value="science">Science Building (Laboratories)</option>
              <option value="admin">Administration Block</option>
              <option value="library">Central Library</option>
              <option value="auditorium">Main Auditorium</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Audio Siren Alarm</label>
            <div style="display:flex;align-items:center;gap:10px;height:42px;">
              <label style="display:flex;align-items:center;gap:8px;font-size:14px;cursor:pointer;">
                <input type="checkbox" id="broadcast-alert-sound" checked style="width:18px;height:18px;">
                Sound emergency siren on devices
              </label>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Instructions & Action Steps <span class="required">*</span></label>
          <textarea class="form-textarea" id="broadcast-alert-message" rows="3" placeholder="Provide clear, concise instructions for students and staff (e.g., Proceed to Emergency Exit 2 immediately. Do not use elevators. Gather at Assembly Point A.)" required></textarea>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-danger" id="btn-dispatch-broadcast" onclick="App.dispatchEmergencyBroadcast()" style="background:var(--red);color:#fff;font-weight:700;">
          ${icon('send', 16)} Dispatch Emergency Broadcast
        </button>
      `
    });
    refreshIcons();
  }

  async function dispatchEmergencyBroadcast() {
    const title = document.getElementById('broadcast-alert-title')?.value?.trim();
    const message = document.getElementById('broadcast-alert-message')?.value?.trim();
    const severity = document.getElementById('broadcast-alert-severity')?.value || 'critical';
    const type = document.getElementById('broadcast-alert-type')?.value || 'fire';
    const building = document.getElementById('broadcast-alert-building')?.value || 'all';
    const soundAlert = document.getElementById('broadcast-alert-sound')?.checked !== false;

    if (!title || !message) {
      showToast('Please enter both an alert headline and instructions.', 'error');
      return;
    }

    const dispatchBtn = document.getElementById('btn-dispatch-broadcast');
    if (dispatchBtn) {
      dispatchBtn.disabled = true;
      dispatchBtn.innerHTML = 'Broadcasting to devices…';
    }

    try {
      if (typeof SocketClient !== 'undefined' && SocketClient.broadcastEmergency) {
        const res = await SocketClient.broadcastEmergency({
          title,
          message,
          severity,
          type,
          building,
          soundAlert
        });
        closeModal();
        showToast(`🚨 Emergency broadcast sent to ${res.deliveredCount || 'all'} connected device(s)!`, 'success');
      } else {
        closeModal();
        showToast('Emergency alert saved locally.', 'info');
      }

      if (currentView === 'alerts' && typeof Alerts !== 'undefined') {
        Alerts.renderList(document.getElementById('main-view'));
      } else if (currentView === 'admin-alerts' && typeof Admin !== 'undefined') {
        Admin.renderAlerts(document.getElementById('main-view'));
      }
    } catch (err) {
      console.error(err);
      if (dispatchBtn) {
        dispatchBtn.disabled = false;
        dispatchBtn.innerHTML = 'Dispatch Emergency Broadcast';
      }
      showToast('Failed to broadcast: ' + (err.message || 'Server error'), 'error');
    }
  }

  return {
    init,
    navigateTo,
    renderAppShell,
    renderView,
    toggleSidebar,
    showModal,
    closeModal,
    showToast,
    toggleNotificationPanel,
    closeNotificationPanel,
    markAllRead,
    readNotification,
    addNotification,
    handleSearch,
    fillLogin,
    handleLogin,
    icon,
    escapeHtml,
    capitalize,
    formatDate,
    formatRelativeDate,
    refreshIcons,
    getSeverityBadge,
    getStatusBadge,
    getModuleIconClass,
    openEmergencyBroadcastModal,
    dispatchEmergencyBroadcast
  };
})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', App.init);
