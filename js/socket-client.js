/* ============================================
   GRAPHICA — Real-Time WebSocket Client & Emergency Broadcast Service
   ============================================ */

const SocketClient = (() => {
  let ws = null;
  let reconnectInterval = 3000;
  let isConnected = false;
  let activeUsersData = { totalConnected: 0, sessions: [] };
  let audioContext = null;
  let alarmOscillator = null;
  let alarmGainNode = null;
  let isAlarmPlaying = false;

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

      // Two-tone European/hi-lo emergency siren
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.25, audioContext.currentTime);

      // Low pass filter to soften the harshness into an authentic emergency siren
      const filter = audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, audioContext.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioContext.destination);

      // Modulate frequency between 700Hz and 950Hz
      const now = audioContext.currentTime;
      for (let i = 0; i < 20; i++) {
        osc.frequency.setValueAtTime(880, now + i * 0.7);
        osc.frequency.setValueAtTime(659.25, now + i * 0.7 + 0.35);
      }

      osc.start();
      alarmOscillator = osc;
      alarmGainNode = gain;

      // Auto stop after 14 seconds if user doesn't acknowledge
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
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        isConnected = true;
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
        console.warn('[GRAPHICA WS] Disconnected. Reconnecting in 3s...');
        setTimeout(connect, reconnectInterval);
      };

      ws.onerror = (err) => {
        console.error('[GRAPHICA WS] Error:', err);
        ws.close();
      };
    } catch (e) {
      console.error('[GRAPHICA WS] Connection init failed:', e);
      setTimeout(connect, reconnectInterval);
    }
  }

  function identifyCurrentUser() {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const currentUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
    
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

  function handleMessage(msg) {
    if (msg.type === 'EMERGENCY_BROADCAST') {
      onEmergencyBroadcastReceived(msg.alert, msg.sender);
    } else if (msg.type === 'PRESENCE_UPDATE') {
      activeUsersData = msg.data;
      // If admin is currently looking at users or dashboard, update live UI
      if (typeof Admin !== 'undefined' && typeof Admin.updateLiveUsersUI === 'function') {
        Admin.updateLiveUsersUI(activeUsersData);
      }
    } else if (msg.type === 'ALERT_ACK_UPDATE') {
      if (typeof Admin !== 'undefined' && typeof Admin.updateAckUI === 'function') {
        Admin.updateAckUI(msg.alertId, msg.acknowledgments);
      }
    }
  }

  function onEmergencyBroadcastReceived(alert, sender) {
    // 1. Play alert sound if enabled
    if (alert.soundAlert !== false) {
      playEmergencySound();
    }

    // 2. Add to local alerts list so it stays visible
    if (typeof Storage !== 'undefined') {
      const existing = Storage.getData(Storage.KEYS.ALERTS, []);
      const idx = existing.findIndex(a => a.id === alert.id);
      if (idx === -1) {
        existing.unshift(alert);
        Storage.saveData(Storage.KEYS.ALERTS, existing);
      }
    }

    // 3. Vibrate device if supported
    if (navigator.vibrate) {
      navigator.vibrate([400, 200, 400, 200, 600]);
    }

    // 4. Render the Fullscreen Emergency Alert Overlay
    showEmergencyModal(alert, sender);
  }

  function showEmergencyModal(alert, sender) {
    // Remove existing emergency overlay if any
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
        <!-- Header Banner -->
        <div style="background:${accentColor};padding:14px 24px;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:10px;font-weight:700;font-size:16px;letter-spacing:1px;text-transform:uppercase;color:#FFF;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            EMERGENCY BROADCAST ALERT
          </div>
          <span style="font-size:12px;background:rgba(0,0,0,0.3);padding:4px 10px;border-radius:20px;font-weight:600;color:#FFF;">
            LIVE TO ALL DEVICES
          </span>
        </div>

        <!-- Body -->
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

    const response = await fetch('/api/alerts/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': user.role,
        'x-user-name': user.name
      },
      body: JSON.stringify(alertData)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to broadcast alert');
    }

    return await response.json();
  }

  async function fetchActiveUsers() {
    const user = Auth.getCurrentUser();
    if (!user || user.role !== 'admin') {
      return { totalConnected: 0, sessions: [] };
    }

    try {
      const response = await fetch('/api/users/active', {
        headers: {
          'x-user-role': user.role
        }
      });
      if (!response.ok) return { totalConnected: 0, sessions: [] };
      const data = await response.json();
      activeUsersData = data;
      return data;
    } catch (e) {
      console.error('Error fetching active users:', e);
      return activeUsersData;
    }
  }

  async function fetchAllUsers() {
    const user = Auth.getCurrentUser();
    if (!user || user.role !== 'admin') {
      return [];
    }

    try {
      const response = await fetch('/api/users', {
        headers: {
          'x-user-role': user.role
        }
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data.users || [];
    } catch (e) {
      console.error('Error fetching users:', e);
      return [];
    }
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
