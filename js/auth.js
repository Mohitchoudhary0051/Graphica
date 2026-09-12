/* ============================================
   GRAPHICA — Authentication Module
   Frontend-only demo authentication
   ============================================ */

const Auth = (() => {

  /**
   * Attempt login with email and password
   * @param {string} email
   * @param {string} password
   * @returns {{ success: boolean, user?: object, error?: string }}
   */
  function login(email, password) {
    if (!email || !password) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    const users = Storage.getData(Storage.KEYS.USERS, []);
    const user = users.find(u =>
      u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) {
      return { success: false, error: 'Invalid email or password. Try a demo account.' };
    }

    if (user.status !== 'active') {
      return { success: false, error: 'This account has been deactivated.' };
    }

    // Save session (excluding password)
    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      loginTime: new Date().toISOString()
    };

    Storage.saveData(Storage.KEYS.SESSION, session);
    return { success: true, user: session };
  }

  /**
   * Log out the current user
   */
  function logout() {
    Storage.removeData(Storage.KEYS.SESSION);
  }

  /**
   * Get the currently logged-in user
   * @returns {object|null}
   */
  function getCurrentUser() {
    return Storage.getData(Storage.KEYS.SESSION, null);
  }

  /**
   * Check if a user is authenticated
   * @returns {boolean}
   */
  function isAuthenticated() {
    return getCurrentUser() !== null;
  }

  /**
   * Check if current user is admin
   * @returns {boolean}
   */
  function isAdmin() {
    const user = getCurrentUser();
    return user !== null && user.role === 'admin';
  }

  /**
   * Check if current user is staff
   * @returns {boolean}
   */
  function isStaff() {
    const user = getCurrentUser();
    return user !== null && (user.role === 'staff' || user.role === 'admin');
  }

  /**
   * Get initials from name
   * @param {string} name
   * @returns {string}
   */
  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  /**
   * Get greeting based on time of day
   * @returns {string}
   */
  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  return {
    login,
    logout,
    getCurrentUser,
    isAuthenticated,
    isAdmin,
    isStaff,
    getInitials,
    getGreeting
  };
})();
