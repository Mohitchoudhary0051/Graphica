/* ============================================
   GRAPHICA — Storage Module
   Centralized localStorage helper
   ============================================ */

const Storage = (() => {
  // Namespaced storage keys
  const KEYS = {
    USERS: 'graphica_users',
    SESSION: 'graphica_session',
    MODULES: 'graphica_modules',
    QUIZZES: 'graphica_quizzes',
    ATTEMPTS: 'graphica_attempts',
    REPORTS: 'graphica_reports',
    ALERTS: 'graphica_alerts',
    DRILLS: 'graphica_drills',
    MAPS: 'graphica_maps',
    NOTIFICATIONS: 'graphica_notifications',
    SETTINGS: 'graphica_settings',
    PROGRESS: 'graphica_progress',
    SIM_ATTEMPTS: 'graphica_sim_attempts',
    INITIALIZED: 'graphica_initialized'
  };

  /**
   * Save data to localStorage
   * @param {string} key - Storage key
   * @param {*} data - Data to save (will be JSON.stringified)
   */
  function saveData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Storage save error:', e);
      return false;
    }
  }

  /**
   * Get data from localStorage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} Parsed data or defaultValue
   */
  function getData(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      console.error('Storage read error:', e);
      return defaultValue;
    }
  }

  /**
   * Update data in localStorage (merge for objects, replace for arrays/primitives)
   * @param {string} key - Storage key
   * @param {*} data - Data to merge/replace
   */
  function updateData(key, data) {
    try {
      const existing = getData(key);
      if (existing && typeof existing === 'object' && !Array.isArray(existing) &&
          typeof data === 'object' && !Array.isArray(data)) {
        // Merge objects
        saveData(key, { ...existing, ...data });
      } else {
        // Replace for arrays and primitives
        saveData(key, data);
      }
      return true;
    } catch (e) {
      console.error('Storage update error:', e);
      return false;
    }
  }

  /**
   * Remove data from localStorage
   * @param {string} key - Storage key
   */
  function removeData(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Storage remove error:', e);
      return false;
    }
  }

  /**
   * Check if a key exists in localStorage
   * @param {string} key - Storage key
   * @returns {boolean}
   */
  function hasData(key) {
    return localStorage.getItem(key) !== null;
  }

  /**
   * Generate a unique ID with prefix
   * @param {string} prefix - ID prefix
   * @returns {string}
   */
  function generateId(prefix = 'GR') {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `${prefix}-${year}-${String(random).padStart(4, '0')}`;
  }

  /**
   * Generate sequential report ID
   * @returns {string}
   */
  function generateReportId() {
    const reports = getData(KEYS.REPORTS, []);
    const nextNum = reports.length + 1;
    const year = new Date().getFullYear();
    return `GR-${year}-${String(nextNum).padStart(4, '0')}`;
  }

  return {
    KEYS,
    saveData,
    getData,
    updateData,
    removeData,
    hasData,
    generateId,
    generateReportId
  };
})();
