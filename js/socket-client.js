/* ============================================
   GRAPHICA — Real-Time Multi-Device Emergency Broadcast & Siren System
   Features:
   1. Cloud Real-Time Pub/Sub Relay (Cross-Device, works worldwide on GitHub Pages, Vercel, and Localhost)
   2. Local Node.js WebSocket Bridge (/ws)
   3. Web Audio + HTML5 Audio Dual-Tone European Emergency Siren
   4. Mobile Autoplay Unlocker & Instant Screen Strobe / Vibration
   5. Admin Real-Time Connected Device Presence
   ============================================ */

const SocketClient = (() => {
  // Global campus topic for real-time cross-device communication
  const CLOUD_TOPIC = 'graphica_campus_emergency_mohitchoudhary';
  const CLOUD_WS_URL = `wss://ntfy.sh/${CLOUD_TOPIC}/ws`;
  const CLOUD_PUB_URL = `https://ntfy.sh/${CLOUD_TOPIC}`;

  let localWs = null;
  let cloudWs = null;
  let broadcastChannel = null;
  let isConnected = false;
  let audioContext = null;
  let alarmOscillator = null;
  let alarmGainNode = null;
  let isAlarmPlaying = false;
  let audioUnlocked = false;

  // Active connected devices registry (synced via cloud pub/sub)
  const connectedDevices = new Map();
  let localDeviceId = 'dev_' + Math.random().toString(36).substring(2, 9);

  // ── 1. Audio Engine & Autoplay Unlocker ──
  function initAudio() {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioContext = new AudioCtx();
      }
    }
  }

  function unlockAudioEngine() {
    initAudio();
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        audioUnlocked = true;
        // Silent pop to warm up iOS audio hardware
        try {
          const buf = audioContext.createBuffer(1, 1, 22050);
          const src = audioContext.createBufferSource();
          src.buffer = buf;
          src.connect(audioContext.destination);
          src.start(0);
        } catch (e) {}
      }).catch(() => {});
    } else if (audioContext && audioContext.state === 'running') {
      audioUnlocked = true;
    }

    // Dismiss audio enable banner if present
    const banner = document.getElementById('graphica-audio-enable-banner');
    if (banner) banner.remove();
  }

  // Listen for any touch or click on the device to prime the audio engine
  if (typeof window !== 'undefined') {
    window.addEventListener('click', unlockAudioEngine, { passive: true });
    window.addEventListener('touchstart', unlockAudioEngine, { passive: true });
    window.addEventListener('keydown', unlockAudioEngine, { passive: true });
  }

  function playEmergencySound() {
    try {
      initAudio();
      if (!audioContext) return false;

      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
      }

      if (isAlarmPlaying) return true;
      isAlarmPlaying = true;

      // Authentic two-tone European / Hi-Lo emergency siren
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.3, audioContext.currentTime);

      const filter = audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950, audioContext.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioContext.destination);

      const now = audioContext.currentTime;
      for (let i = 0; i < 40; i++) {
        osc.frequency.setValueAtTime(880, now + i * 0.7); // A5 high tone
        osc.frequency.setValueAtTime(659.25, now + i * 0.7 + 0.35); // E5 low tone
      }

      osc.start();
      alarmOscillator = osc;
      alarmGainNode = gain;

      setTimeout(() => {
        stopEmergencySound();
      }, 20000);

      return true;
    } catch (e) {
      console.warn('[GRAPHICA AUDIO] Audio playback failed:', e);
      return false;
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

  // ── 2. Real-Time Cloud Relay Connection (Cross-Device Everywhere) ──
  function connectCloudRelay() {
    try {
      cloudWs = new WebSocket(CLOUD_WS_URL);

      cloudWs.onopen = () => {
        console.log('[GRAPHICA] Cloud emergency relay connected (Cross-device active).');
        isConnected = true;
        broadcastHeartbeat();
      };

      cloudWs.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          if (raw.event === 'message' && raw.message) {
            const data = JSON.parse(raw.message);
            handleIncomingPayload(data);
          }
        } catch (e) {
          // Non-JSON or standard ping
        }
      };

      cloudWs.onclose = () => {
        console.log('[GRAPHICA] Cloud relay disconnected, reconnecting in 3s...');
        setTimeout(connectCloudRelay, 3000);
      };

      cloudWs.onerror = () => {
        if (cloudWs) cloudWs.close();
      };
    } catch (err) {
      console.warn('[GRAPHICA] Cloud relay init error:', err);
      setTimeout(connectCloudRelay, 4000);
    }
  }

  // ── 3. Local Node.js WebSocket Bridge ──
  function connectLocalServer() {
    // Only attempt local server if running on localhost or IP
    const isLocal = window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1' ||
                    /^192\.168\./.test(window.location.hostname) ||
                    /^10\./.test(window.location.hostname);

    if (!isLocal) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      localWs = new WebSocket(wsUrl);
      localWs.onopen = () => {
        console.log('[GRAPHICA] Local Node backend connected.');
        identifyCurrentUser();
      };
      localWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleIncomingPayload(data);
        } catch (e) {}
      };
      localWs.onclose = () => {
        setTimeout(connectLocalServer, 5000);
      };
    } catch (e) {}
  }

  // ── 4. BroadcastChannel & Storage Fallback ──
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      broadcastChannel = new BroadcastChannel('graphica_emergency_channel');
      broadcastChannel.onmessage = (e) => {
        if (e.data) handleIncomingPayload(e.data);
      };
    }
  } catch (e) {}

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === 'graphica_live_broadcast_event' && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          if (payload && payload.alert) {
            handleIncomingPayload({ type: 'EMERGENCY_BROADCAST', alert: payload.alert, sender: payload.sender });
          }
        } catch (err) {}
      }
    });
  }

  // ── 5. Payload Dispatch & Receiving ──
  function handleIncomingPayload(payload) {
    if (!payload || !payload.type) return;

    if (payload.type === 'EMERGENCY_BROADCAST') {
      onEmergencyBroadcastReceived(payload.alert, payload.sender);
    } else if (payload.type === 'HEARTBEAT') {
      // Register or update active device
      if (payload.deviceId && payload.deviceId !== localDeviceId) {
        connectedDevices.set(payload.deviceId, {
          id: payload.deviceId,
          user: payload.user || { name: 'Visitor Device', role: 'guest' },
          deviceType: payload.deviceType || 'Mobile Phone / Browser',
          lastSeen: Date.now(),
          connectedAt: payload.connectedAt || new Date().toISOString()
        });
        notifyPresenceChange();
      }
    } else if (payload.type === 'ACKNOWLEDGE_ALERT') {
      // Update acknowledgment count
      if (typeof Admin !== 'undefined' && typeof Admin.updateAckUI === 'function') {
        Admin.updateAckUI(payload.alertId, payload.acknowledgments);
      }
    }
  }

  function broadcastHeartbeat() {
    const user = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
    const deviceType = parseDeviceType(navigator.userAgent);
    const payload = {
      type: 'HEARTBEAT',
      deviceId: localDeviceId,
      user: user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null,
      deviceType,
      connectedAt: new Date().toISOString()
    };

    publishCloudMessage(payload);

    // Keep broadcasting heartbeat every 20 seconds
    setTimeout(broadcastHeartbeat, 20000);
  }

  function notifyPresenceChange() {
    // Prune devices not seen in 45s
    const now = Date.now();
    for (const [id, dev] of connectedDevices.entries()) {
      if (now - dev.lastSeen > 45000) {
        connectedDevices.delete(id);
      }
    }

    const sessions = Array.from(connectedDevices.values());
    const currentUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;

    // Add local device
    sessions.unshift({
      id: localDeviceId,
      user: currentUser || { name: 'Current Device (You)', role: currentUser?.role || 'guest' },
      deviceType: parseDeviceType(navigator.userAgent) + ' (This Device)',
      connectedAt: new Date().toISOString(),
      isSelf: true
    });

    const activeData = {
      totalConnected: sessions.length,
      sessions
    };

    if (typeof Admin !== 'undefined' && typeof Admin.updateLiveUsersUI === 'function') {
      Admin.updateLiveUsersUI(activeData);
    }
  }

  function publishCloudMessage(data) {
    try {
      fetch(CLOUD_PUB_URL, {
        method: 'POST',
        headers: {
          'Title': data.type || 'GRAPHICA_ALERT',
          'Priority': data.type === 'EMERGENCY_BROADCAST' ? 'high' : 'low'
        },
        body: JSON.stringify(data)
      }).catch(() => {});
    } catch (e) {}

    // Also send via local WebSockets if connected
    if (localWs && localWs.readyState === WebSocket.OPEN) {
      try { localWs.send(JSON.stringify(data)); } catch (e) {}
    }

    // Also send via BroadcastChannel
    if (broadcastChannel) {
      try { broadcastChannel.postMessage(data); } catch (e) {}
    }
  }

  // ── 6. Emergency Broadcast Trigger (Staff / Admin) ──
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

    // Save to storage
    if (typeof Storage !== 'undefined') {
      const existing = Storage.getData(Storage.KEYS.ALERTS, []);
      existing.unshift(newAlert);
      Storage.saveData(Storage.KEYS.ALERTS, existing);
    }

    const payload = {
      type: 'EMERGENCY_BROADCAST',
      alert: newAlert,
      sender: { name: user.name, role: user.role }
    };

    // Publish to all connected phones, tablets, and laptops over the cloud relay!
    publishCloudMessage(payload);

    // Trigger immediately on the sender device
    onEmergencyBroadcastReceived(newAlert, { name: user.name, role: user.role });

    // Sync to local server if available
    try {
      fetch('/api/alerts/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-name': user.name
        },
        body: JSON.stringify(alertData)
      }).catch(() => {});
    } catch (e) {}

    const count = connectedDevices.size + 1;
    return {
      success: true,
      alert: newAlert,
      deliveredCount: count
    };
  }

  // ── 7. Fullscreen Emergency Alert Overlay & Siren Playback ──
  function onEmergencyBroadcastReceived(alert, sender) {
    // 1. Save alert locally
    if (typeof Storage !== 'undefined') {
      const existing = Storage.getData(Storage.KEYS.ALERTS, []);
      const idx = existing.findIndex(a => a.id === alert.id);
      if (idx === -1) {
        existing.unshift(alert);
        Storage.saveData(Storage.KEYS.ALERTS, existing);
      }
    }

    // 2. Play Siren Sound
    let soundStarted = false;
    if (alert.soundAlert !== false) {
      soundStarted = playEmergencySound();
    }

    // 3. Vibrate device (multi-pulse emergency cadence)
    if (navigator.vibrate) {
      try { navigator.vibrate([600, 200, 600, 200, 1000, 400, 600]); } catch (e) {}
    }

    // 4. Show Fullscreen Alert Modal
    showEmergencyModal(alert, sender, soundStarted);
  }

  function showEmergencyModal(alert, sender, soundStarted) {
    const existingOverlay = document.getElementById('emergency-live-broadcast-overlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'emergency-live-broadcast-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(10, 10, 10, 0.94);
      backdrop-filter: blur(14px);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      animation: alertStrobe 1s infinite alternate;
    `;

    const isCritical = alert.severity === 'critical';
    const accentColor = isCritical ? '#E53E3E' : '#DD6B20';

    overlay.innerHTML = `
      <style>
        @keyframes alertStrobe {
          0% { background: rgba(10, 10, 10, 0.94); }
          100% { background: rgba(50, 10, 10, 0.96); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 30px ${accentColor}66, inset 0 0 20px ${accentColor}33; }
          50% { box-shadow: 0 0 60px ${accentColor}cc, inset 0 0 40px ${accentColor}66; }
        }
        @keyframes strobeBorder {
          0%, 100% { border-color: ${accentColor}; }
          50% { border-color: #FFFFFF; }
        }
      </style>
      <div style="
        max-width: 600px;
        width: 100%;
        background: #18181B;
        border: 3px solid ${accentColor};
        animation: pulseGlow 1.8s infinite, strobeBorder 1.2s infinite ease-in-out;
        border-radius: 16px;
        color: #F7F5F0;
        box-shadow: 0 24px 60px rgba(0,0,0,0.8);
        overflow: hidden;
      ">
        <!-- Header -->
        <div style="background:${accentColor};padding:14px 20px;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:10px;font-weight:800;font-size:16px;letter-spacing:1px;text-transform:uppercase;color:#FFF;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            CAMPUS EMERGENCY ALERT
          </div>
          <span style="font-size:11px;background:rgba(0,0,0,0.35);padding:4px 8px;border-radius:20px;font-weight:700;color:#FFF;">
            ALL CONNECTED PHONES & DEVICES
          </span>
        </div>

        <!-- Body -->
        <div style="padding: 24px;">
          <!-- Mobile Autoplay Unlock Button if blocked -->
          <div id="btn-tap-for-sound" style="
            display: ${soundStarted ? 'none' : 'flex'};
            align-items: center;
            justify-content: center;
            gap: 10px;
            background: #E53E3E;
            color: #FFFFFF;
            padding: 16px;
            border-radius: 10px;
            margin-bottom: 20px;
            cursor: pointer;
            font-weight: 800;
            font-size: 16px;
            text-align: center;
            box-shadow: 0 0 20px rgba(229,62,62,0.8);
            animation: pulseGlow 1s infinite;
          ">
            🔊 TAP HERE TO ACTIVATE LOUD SIREN ALARM
          </div>

          <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:18px;">
            <div style="background:${accentColor}25;border:2px solid ${accentColor};width:54px;height:54px;border-radius:12px;display:flex;align-items:center;justify-content:center;color:${accentColor};flex-shrink:0;">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
            <div>
              <h2 style="font-size:20px;font-weight:800;margin:0 0 6px 0;line-height:1.25;color:#FFFFFF;">${alert.title}</h2>
              <div style="font-size:13px;color:#A1A1AA;display:flex;gap:10px;flex-wrap:wrap;">
                <span>Dispatched by: <strong style="color:#FFF;">${sender ? sender.name : alert.createdBy}</strong></span>
                <span>•</span>
                <span>Area: <strong style="color:#FFF;">${alert.building === 'all' ? 'All Campus Buildings' : alert.building}</strong></span>
              </div>
            </div>
          </div>

          <div style="background:#27272A;border-radius:10px;padding:18px;margin-bottom:24px;border-left:5px solid ${accentColor};font-size:15px;line-height:1.65;color:#F4F4F5;">
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
              Silence Siren
            </button>

            <button id="btn-acknowledge-safe" style="
              background: ${accentColor};
              color: #FFFFFF;
              border: none;
              padding: 14px 26px;
              border-radius: 8px;
              font-weight: 800;
              font-size: 15px;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 8px;
              box-shadow: 0 4px 15px ${accentColor}77;
            ">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              I Am Safe / Acknowledge
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Unmute button for phones if sound was blocked by autoplay
    const soundBtn = document.getElementById('btn-tap-for-sound');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        unlockAudioEngine();
        playEmergencySound();
        soundBtn.style.display = 'none';
      });
    }

    document.getElementById('btn-silence-alarm').addEventListener('click', () => {
      stopEmergencySound();
      document.getElementById('btn-silence-alarm').innerText = 'Siren Silenced';
      document.getElementById('btn-silence-alarm').disabled = true;
    });

    document.getElementById('btn-acknowledge-safe').addEventListener('click', () => {
      stopEmergencySound();
      overlay.remove();
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('Emergency acknowledged. Safety instructions recorded.', 'success');
      }
    });
  }

  function parseDeviceType(ua) {
    if (!ua) return 'Desktop';
    if (/iphone|android.*mobile|mobile/i.test(ua)) return 'Mobile Phone';
    if (/tablet|ipad/i.test(ua)) return 'Tablet';
    if (/macintosh|mac os x/i.test(ua)) return 'Mac Laptop/Desktop';
    if (/windows/i.test(ua)) return 'Windows PC';
    return 'Connected Browser Device';
  }

  function identifyCurrentUser() {
    broadcastHeartbeat();
  }

  async function fetchActiveUsers() {
    const currentUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
    const sessions = Array.from(connectedDevices.values());

    sessions.unshift({
      id: localDeviceId,
      user: currentUser || { name: 'Current Device (You)', role: currentUser?.role || 'admin' },
      deviceType: parseDeviceType(navigator.userAgent) + ' (Active Console)',
      connectedAt: new Date().toISOString(),
      isSelf: true
    });

    return {
      totalConnected: sessions.length,
      sessions
    };
  }

  async function fetchAllUsers() {
    return typeof Storage !== 'undefined' ? Storage.getData(Storage.KEYS.USERS, []) : [];
  }

  function showAudioPromptIfSuspended() {
    if (audioUnlocked) return;
    initAudio();
    if (audioContext && audioContext.state === 'suspended') {
      const banner = document.createElement('div');
      banner.id = 'graphica-audio-enable-banner';
      banner.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #18181B;
        color: #F7F5F0;
        border: 1px solid #3F3F46;
        border-left: 4px solid #E53E3E;
        padding: 12px 18px;
        border-radius: 10px;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 99999;
        box-shadow: 0 10px 30px rgba(0,0,0,0.6);
        cursor: pointer;
      `;
      banner.innerHTML = `
        <span style="font-size:18px;">🔔</span>
        <div style="flex:1;">
          <div style="font-weight:700;color:#FFFFFF;margin-bottom:2px;">Emergency Siren Standby</div>
          <div style="color:#A1A1AA;font-size:12px;">Tap here to enable high-volume sirens on this device</div>
        </div>
        <button style="background:#E53E3E;color:#fff;border:none;padding:5px 12px;border-radius:6px;font-weight:700;font-size:12px;cursor:pointer;">Enable</button>
      `;
      banner.addEventListener('click', () => {
        unlockAudioEngine();
        banner.remove();
        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast('Emergency sirens active on this device.', 'success');
        }
      });
      document.body.appendChild(banner);
    }
  }

  // ── 8. Initialize Connections ──
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
      connectCloudRelay();
      connectLocalServer();
      setTimeout(showAudioPromptIfSuspended, 1500);
    });
  }

  return {
    connect: () => { connectCloudRelay(); connectLocalServer(); },
    identifyCurrentUser,
    playEmergencySound,
    stopEmergencySound,
    broadcastEmergency,
    fetchActiveUsers,
    fetchAllUsers,
    getActiveUsersData: () => ({ totalConnected: connectedDevices.size + 1, sessions: Array.from(connectedDevices.values()) })
  };
})();
