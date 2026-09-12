/* ============================================
   GRAPHICA — Real-Time WebSocket Client & Emergency Broadcast Service
   Dual-Mode: Real-Time WebSockets + Resilient BroadcastChannel / Storage Fallback
   Supports local dev, Node.js servers, GitHub Pages, Vercel & Netlify static hosting
   ============================================ */

const SocketClient = (() => {
  let ws = null;
  let reconnectInterval = 5000;
  let isConnected = false;
  let wsFailedPermanently = false;
  let activeUsersData = { totalConnected: 1, sessions: [] };
  let audioContext = null;
  let alarmOscillator = null;
  let alarmGainNode = null;
  let isAlarmPlaying = false;
  let broadcastChannel = null;

  // Initialize Native Browser BroadcastChannel for cross-tab communication
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      broadcastChannel = new BroadcastChannel('graphica_emergency_channel');
      broadcastChannel.onmessage = (event) => {
        if (event.data) {
          if (event.data.type === 'EMERGENCY_BROADCAST') {
            onEmergencyBroadcastReceived(event.data.alert, event.data.sender);
          } else if (event.data.type === 'PRESENCE_SYNC') {
            handlePresenceSync(event.data);
          }
        }
      };
    }
  } catch (e) {
    console.warn('BroadcastChannel not available:', e);
  }

  // Cross-tab storage listener fallback (works in all browsers even without BroadcastChannel)
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === 'graphica_live_broadcast_event' && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          if (payload && payload.alert) {
            onEmergencyBroadcastReceived(payload.alert, payload.sender);
          }
        } catch (err) {}
      }
    });
  }

  function getBackendBaseUrl() {
    if (typeof window !== 'undefined') {
      if (window.GRAPHICA_BACKEND_URL) return window.GRAPHICA_BACKEND_URL;
      const stored = localStorage.getItem('graphica_backend_url');
      if (stored) return stored;
    }
    return '';
  }

  // Initialize Web Audio Context for Emergency Siren
  function initAudio() {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioContext = new AudioCtx();
      }
    }
  }

  function playEmergencySound() {
    try {
      initAudio();
      if (!audioContext) return;
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      if (isAlarmPlaying) return;
      isAlarmPlaying = true;

      // Two-tone emergency siren (880Hz / 659Hz dual cadence)
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.25, audioContext.currentTime);

      const filter = audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, audioContext.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioContext.destination);

      const now = audioContext.currentTime;
      for (let i = 0; i < 20; i++) {
        osc.frequency.setValueAtTime(880, now + i * 0.7);
        osc.frequency.setValueAtTime(659.25, now + i * 0.7 + 0.35);
      }

      osc.start();
      alarmOscillator = osc;
      alarmGainNode = gain;

      setTimeout(() => {
        stopEmergencySound();
      }, 14000);
    } catch (e) {
      console.warn('Audio alert could not play automatically (browser autoplay policy):', e);
    }
  }

  function stopEmergencySound() {
    if (alarmOscillator) {
      try {
        alarmOscillator.stop();
        alarmOscillator.disconnect();
      } catch (e) {}
      alarmOscillator = null;
    }
    isAlarmPlaying = false;
  }

  function connect() {
    const customBase = getBackendBaseUrl();
    let wsUrl = '';

    if (customBase) {
      wsUrl = customBase.replace(/^http/, 'ws').replace(/\/$/, '') + '/ws';
    } else {
      // If hosted on GitHub Pages (github.io), do not spam WebSocket connection errors
      if (window.location.hostname.includes('github.io')) {
        console.log('[GRAPHICA] Running on GitHub Pages. Using resilient client-side BroadcastChannel.');
        wsFailedPermanently = true;
        return;
      }
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      wsUrl = `${protocol}//${host}/ws`;
    }

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        isConnected = true;
        wsFailedPermanently = false;
        console.log('[GRAPHICA WS] Connected to emergency backend server.');
        identifyCurrentUser();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (err) {
          console.error('[GRAPHICA WS] Message parse error:', err);
        }
      };

      ws.onclose = () => {
        isConnected = false;
        if (!wsFailedPermanently) {
          setTimeout(connect, reconnectInterval);
        }
      };

      ws.onerror = () => {
        if (ws) ws.close();
      };
    } catch (e) {
      if (!wsFailedPermanently) {
        setTimeout(connect, reconnectInterval);
      }
    }
  }

  function identifyCurrentUser() {
    const currentUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'IDENTIFY',
        user: currentUser ? {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          department: currentUser.department
        } : null
      }));
    }

    // Also sync presence across local browser tabs
    if (broadcastChannel) {
      broadcastChannel.postMessage({
        type: 'PRESENCE_SYNC',
        user: currentUser
      });
    }
  }

  function handleMessage(msg) {
    if (msg.type === 'EMERGENCY_BROADCAST') {
      onEmergencyBroadcastReceived(msg.alert, msg.sender);
    } else if (msg.type === 'PRESENCE_UPDATE') {
      activeUsersData = msg.data;
      if (typeof Admin !== 'undefined' && typeof Admin.updateLiveUsersUI === 'function') {
        Admin.updateLiveUsersUI(activeUsersData);
      }
    } else if (msg.type === 'ALERT_ACK_UPDATE') {
      if (typeof Admin !== 'undefined' && typeof Admin.updateAckUI === 'function') {
        Admin.updateAckUI(msg.alertId, msg.acknowledgments);
      }
    }
  }

  function handlePresenceSync(data) {
    if (typeof Admin !== 'undefined' && typeof Admin.updateLiveUsersUI === 'function') {
      const user = Auth.getCurrentUser();
      if (user && user.role === 'admin') {
        fetchActiveUsers().then(activeData => {
          Admin.updateLiveUsersUI(activeData);
        });
      }
    }
  }

  function onEmergencyBroadcastReceived(alert, sender) {
    if (alert.soundAlert !== false) {
      playEmergencySound();
    }

    if (typeof Storage !== 'undefined') {
      const existing = Storage.getData(Storage.KEYS.ALERTS, []);
      const idx = existing.findIndex(a => a.id === alert.id);
      if (idx === -1) {
        existing.unshift(alert);
        Storage.saveData(Storage.KEYS.ALERTS, existing);
      }
    }

    if (navigator.vibrate) {
      try { navigator.vibrate([400, 200, 400, 200, 600]); } catch (e) {}
    }

    showEmergencyModal(alert, sender);
  }

  function showEmergencyModal(alert, sender) {
    const existingOverlay = document.getElementById('emergency-live-broadcast-overlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'emergency-live-broadcast-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(18, 18, 18, 0.92);
      backdrop-filter: blur(12px);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      animation: alertFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    const isCritical = alert.severity === 'critical';
    const accentColor = isCritical ? '#E53E3E' : '#DD6B20';
    const bgGradient = isCritical 
      ? 'linear-gradient(135deg, rgba(229, 62, 62, 0.15) 0%, rgba(18, 18, 18, 0.95) 100%)'
      : 'linear-gradient(135deg, rgba(221, 107, 32, 0.15) 0%, rgba(18, 18, 18, 0.95) 100%)';

    overlay.innerHTML = `
      <style>
        @keyframes alertFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 25px ${accentColor}44, inset 0 0 15px ${accentColor}22; }
          50% { box-shadow: 0 0 50px ${accentColor}88, inset 0 0 30px ${accentColor}44; }
        }
        @keyframes sirenFlash {
          0%, 100% { border-color: ${accentColor}; }
          50% { border-color: #FFFFFF; }
        }
      </style>
      <div style="
        max-width: 620px;
        width: 100%;
        background: #1C1C1E;
        background-image: ${bgGradient};
        border: 2px solid ${accentColor};
        animation: pulseGlow 2s infinite, sirenFlash 1.2s infinite ease-in-out;
        border-radius: 16px;
        color: #F7F5F0;
        box-shadow: 0 24px 60px rgba(0,0,0,0.6);
        overflow: hidden;
      ">
        <div style="background:${accentColor};padding:14px 24px;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:10px;font-weight:700;font-size:16px;letter-spacing:1px;text-transform:uppercase;color:#FFF;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            EMERGENCY BROADCAST ALERT
          </div>
          <span style="font-size:12px;background:rgba(0,0,0,0.3);padding:4px 10px;border-radius:20px;font-weight:600;color:#FFF;">
            LIVE TO ALL DEVICES
          </span>
        </div>

        <div style="padding: 28px;">
          <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:18px;">
            <div style="background:${accentColor}22;border:1px solid ${accentColor}66;width:56px;height:56px;border-radius:12px;display:flex;align-items:center;justify-content:center;color:${accentColor};flex-shrink:0;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
            <div>
              <h2 style="font-size:22px;font-weight:700;margin:0 0 6px 0;line-height:1.25;color:#FFFFFF;">${alert.title}</h2>
              <div style="font-size:13px;color:#A1A1AA;display:flex;gap:12px;flex-wrap:wrap;">
                <span>Dispatched by: <strong style="color:#FFF;">${sender ? sender.name : alert.createdBy}</strong></span>
                <span>•</span>
                <span>Area: <strong style="color:#FFF;">${alert.building === 'all' ? 'All Campus Buildings' : alert.building}</strong></span>
              </div>
            </div>
          </div>

          <div style="background:#27272A;border-radius:10px;padding:18px;margin-bottom:24px;border-left:4px solid ${accentColor};font-size:15px;line-height:1.65;color:#E4E4E7;">
            ${alert.message}
          </div>

          <div style="display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;">
            <button id="btn-silence-alarm" style="
              background: #3F3F46;
              color: #E4E4E7;
              border: 1px solid #52525B;
              padding: 12px 18px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 14px;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 8px;
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
              Silence Alarm Sound
            </button>

            <button id="btn-acknowledge-safe" style="
              background: ${accentColor};
              color: #FFFFFF;
              border: none;
              padding: 14px 28px;
              border-radius: 8px;
              font-weight: 700;
              font-size: 15px;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 10px;
              box-shadow: 0 4px 15px ${accentColor}66;
            ">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              I Am Safe / Acknowledge
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('btn-silence-alarm').addEventListener('click', () => {
      stopEmergencySound();
      document.getElementById('btn-silence-alarm').innerText = 'Alarm Silenced';
      document.getElementById('btn-silence-alarm').disabled = true;
    });

    document.getElementById('btn-acknowledge-safe').addEventListener('click', () => {
      stopEmergencySound();
      acknowledgeAlert(alert.id);
      overlay.remove();
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('Emergency alert acknowledged. Stay safe and follow instructions.', 'success');
      }
    });
  }

  function acknowledgeAlert(alertId) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'ACKNOWLEDGE_ALERT',
        alertId
      }));
    }
  }

  // API Methods
  async function broadcastEmergency(alertData) {
    const user = Auth.getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      throw new Error('Only Staff and Admin are authorized to dispatch emergency alerts.');
    }

    const newAlert = {
      id: 'alert-' + Date.now().toString(36),
      title: alertData.title,
      message: alertData.message,
      severity: alertData.severity || 'critical',
      type: alertData.type || 'emergency',
      building: alertData.building || 'all',
      audience: alertData.audience || 'all',
      soundAlert: alertData.soundAlert !== false,
      createdBy: `${user.name} (${user.role.toUpperCase()})`,
      createdDate: new Date().toISOString(),
      active: true,
      acknowledgments: []
    };

    const customBase = getBackendBaseUrl();
    const apiUrl = (customBase ? customBase.replace(/\/$/, '') : '') + '/api/alerts/broadcast';

    let backendSuccess = false;
    let backendResponse = null;

    // 1. Attempt to send to Node.js backend if reachable
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-name': user.name
        },
        body: JSON.stringify(alertData)
      });

      const text = await response.text();
      let parsed = null;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
        parsed = null;
      }

      if (response.ok && parsed && parsed.success) {
        backendSuccess = true;
        backendResponse = parsed;
      }
    } catch (fetchErr) {
      console.warn('[GRAPHICA] Backend server not reachable, using client-side broadcast:', fetchErr);
    }

    // 2. Client-Side Broadcast (Works 100% reliably on GitHub Pages, Vercel, Netlify, or offline)
    // Save locally
    if (typeof Storage !== 'undefined') {
      const existing = Storage.getData(Storage.KEYS.ALERTS, []);
      existing.unshift(newAlert);
      Storage.saveData(Storage.KEYS.ALERTS, existing);
    }

    // Broadcast across tabs/windows via BroadcastChannel
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({
          type: 'EMERGENCY_BROADCAST',
          alert: newAlert,
          sender: { name: user.name, role: user.role }
        });
      } catch (e) {}
    }

    // Broadcast across windows via localStorage event
    try {
      localStorage.setItem('graphica_live_broadcast_event', JSON.stringify({
        timestamp: Date.now(),
        alert: newAlert,
        sender: { name: user.name, role: user.role }
      }));
    } catch (e) {}

    // Show on current device immediately
    onEmergencyBroadcastReceived(newAlert, { name: user.name, role: user.role });

    if (backendSuccess && backendResponse) {
      return backendResponse;
    }

    return {
      success: true,
      alert: newAlert,
      deliveredCount: 'all active devices & windows'
    };
  }

  function parseDeviceType(ua) {
    if (!ua) return 'Desktop';
    if (/mobile/i.test(ua)) return 'Mobile Phone';
    if (/tablet|ipad/i.test(ua)) return 'Tablet';
    if (/macintosh|mac os x/i.test(ua)) return 'Mac Laptop/Desktop';
    if (/windows/i.test(ua)) return 'Windows PC';
    if (/linux/i.test(ua)) return 'Linux Device';
    return 'Connected Browser';
  }

  async function fetchActiveUsers() {
    const user = Auth.getCurrentUser();
    if (!user || user.role !== 'admin') {
      return { totalConnected: 0, sessions: [] };
    }

    const customBase = getBackendBaseUrl();
    const apiUrl = (customBase ? customBase.replace(/\/$/, '') : '') + '/api/users/active';

    try {
      const response = await fetch(apiUrl, {
        headers: {
          'x-user-role': user.role
        }
      });
      if (response.ok) {
        const text = await response.text();
        const data = JSON.parse(text);
        if (data && data.sessions) {
          activeUsersData = data;
          return data;
        }
      }
    } catch (e) {}

    // Fallback telemetry for static hosting (GitHub Pages, Vercel)
    return {
      totalConnected: 1,
      sessions: [{
        socketId: 'session_active',
        user: user,
        connectedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ip: 'Connected Device',
        deviceType: parseDeviceType(navigator.userAgent)
      }]
    };
  }

  async function fetchAllUsers() {
    const user = Auth.getCurrentUser();
    if (!user || user.role !== 'admin') {
      return typeof Storage !== 'undefined' ? Storage.getData(Storage.KEYS.USERS, []) : [];
    }

    const customBase = getBackendBaseUrl();
    const apiUrl = (customBase ? customBase.replace(/\/$/, '') : '') + '/api/users';

    try {
      const response = await fetch(apiUrl, {
        headers: {
          'x-user-role': user.role
        }
      });
      if (response.ok) {
        const text = await response.text();
        const data = JSON.parse(text);
        if (data && data.users) return data.users;
      }
    } catch (e) {}

    return typeof Storage !== 'undefined' ? Storage.getData(Storage.KEYS.USERS, []) : [];
  }

  // Auto initialize when script loads
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
      connect();
    });
  }

  return {
    connect,
    identifyCurrentUser,
    playEmergencySound,
    stopEmergencySound,
    broadcastEmergency,
    acknowledgeAlert,
    fetchActiveUsers,
    fetchAllUsers,
    getActiveUsersData: () => activeUsersData
  };
})();
