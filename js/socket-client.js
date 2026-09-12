/* ============================================
   GRAPHICA — Real-Time Multi-Device Emergency Broadcast & Siren System
   Features:
   1. Cloud Real-Time Pub/Sub Relay (Cross-Device, works worldwide on GitHub Pages, Vercel, and Localhost)
   2. Local Node.js WebSocket Bridge (/ws)
   3. Continuous Dual-Tone Siren: Keeps ringing indefinitely until deactivated by Admin or Staff
   4. Triple-Channel Silence Sync: WebSocket + 1.2s Active Cloud Polling + Local BroadcastChannel
   5. Fail-Safe Audio Kill: 0-gain zeroing + oscillator disconnect + audioContext.suspend()
   6. Student Device Turn-Off: Automatically stops when Admin turns off, plus manual check & silence button
   7. Mobile Autoplay Unlocker & Instant Screen Strobe / Vibration
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
  let sirenLoopTimer = null;
  let sirenPollTimer = null;
  let isAlarmPlaying = false;
  let audioUnlocked = false;
  let activeAlertId = null;
  let sirenSilencedByAuthority = false;

  // Active connected devices registry
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

    const banner = document.getElementById('graphica-audio-enable-banner');
    if (banner) banner.remove();
  }

  // Pre-unlock audio on any user interaction
  if (typeof window !== 'undefined') {
    window.addEventListener('click', unlockAudioEngine, { passive: true });
    window.addEventListener('touchstart', unlockAudioEngine, { passive: true });
    window.addEventListener('keydown', unlockAudioEngine, { passive: true });
  }

  // ── 2. Continuous Emergency Siren & Complete Audio Kill ──
  function startContinuousSiren() {
    try {
      initAudio();
      if (!audioContext) return false;

      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
      }

      if (isAlarmPlaying) return true;
      isAlarmPlaying = true;
      sirenSilencedByAuthority = false;

      // Authentic two-tone European / Hi-Lo emergency siren (880Hz / 659.25Hz)
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();

      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.35, audioContext.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950, audioContext.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioContext.destination);

      function scheduleTones() {
        if (!isAlarmPlaying || !osc) return;
        const now = audioContext.currentTime;
        for (let i = 0; i < 6; i++) {
          osc.frequency.setValueAtTime(880, now + i * 0.7);
          osc.frequency.setValueAtTime(659.25, now + i * 0.7 + 0.35);
        }
      }

      scheduleTones();
      sirenLoopTimer = setInterval(scheduleTones, 4000);

      osc.start();
      alarmOscillator = osc;
      alarmGainNode = gain;

      updateGlobalSirenBanner(true);

      // Start active cloud polling to ensure silence command is caught even if WS drops
      startSirenActivePolling();

      return true;
    } catch (e) {
      console.warn('[GRAPHICA AUDIO] Audio playback blocked by policy:', e);
      return false;
    }
  }

  // Guaranteed fail-safe audio kill: Zero gain, disconnect oscillator, suspend audio context
  function stopEmergencySound() {
    isAlarmPlaying = false;

    if (sirenLoopTimer) {
      clearInterval(sirenLoopTimer);
      sirenLoopTimer = null;
    }

    if (sirenPollTimer) {
      clearInterval(sirenPollTimer);
      sirenPollTimer = null;
    }

    // 1. Immediately drop gain to 0 and cancel all scheduled future tones
    if (alarmGainNode && audioContext) {
      try {
        alarmGainNode.gain.cancelScheduledValues(audioContext.currentTime);
        alarmGainNode.gain.setValueAtTime(0, audioContext.currentTime);
        alarmGainNode.disconnect();
      } catch (e) {}
      alarmGainNode = null;
    }

    // 2. Stop and disconnect oscillator
    if (alarmOscillator) {
      try {
        alarmOscillator.frequency.cancelScheduledValues(audioContext.currentTime);
        alarmOscillator.stop();
        alarmOscillator.disconnect();
      } catch (e) {}
      alarmOscillator = null;
    }

    // 3. Suspend audio context so no sound can escape to hardware
    if (audioContext) {
      try {
        audioContext.suspend().catch(() => {});
      } catch (e) {}
    }

    updateGlobalSirenBanner(false);
  }

  // ── 3. Active Polling while Siren is Blaring (Fail-Safe against Mobile Sleep) ──
  function startSirenActivePolling() {
    if (sirenPollTimer) clearInterval(sirenPollTimer);

    sirenPollTimer = setInterval(async () => {
      if (!isAlarmPlaying) {
        clearInterval(sirenPollTimer);
        sirenPollTimer = null;
        return;
      }

      try {
        const res = await fetch(`${CLOUD_PUB_URL}/json?poll=1&since=25s`, { cache: 'no-store' });
        if (res.ok) {
          const text = await res.text();
          const lines = text.trim().split('\n');
          for (const line of lines) {
            if (!line) continue;
            try {
              const item = JSON.parse(line);
              if (item.event === 'message' && item.message) {
                const data = JSON.parse(item.message);
                if (data.type === 'SILENCE_EMERGENCY_ALARM') {
                  console.log('[GRAPHICA POLL] Silence command detected via active poll!');
                  sirenSilencedByAuthority = true;
                  stopEmergencySound();
                  applySirenSilencedUI(data.silencer);
                  clearInterval(sirenPollTimer);
                  sirenPollTimer = null;
                  break;
                }
              }
            } catch (err) {}
          }
        }
      } catch (e) {}
    }, 1200);
  }

  // ── 4. Role Permission Check: Only Staff & Admin Can Authorize Silence ──
  function canSilenceAlarm() {
    const user = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
    return user && (user.role === 'admin' || user.role === 'staff');
  }

  // Campus-wide silence dispatcher: Staff/Admin turns off siren on ALL connected devices
  function silenceEmergencyAlarm() {
    if (!canSilenceAlarm()) {
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('Unauthorized: Only Campus Staff and Admins can authorize siren deactivation.', 'error');
      }
      return false;
    }

    const user = Auth.getCurrentUser();
    const payload = {
      type: 'SILENCE_EMERGENCY_ALARM',
      alertId: activeAlertId,
      silencer: {
        name: user ? user.name : 'Authorized Staff',
        role: user ? user.role : 'staff'
      },
      timestamp: new Date().toISOString()
    };

    sirenSilencedByAuthority = true;

    // 1. Broadcast silence command to all connected phones and computers via Cloud Pub/Sub
    publishCloudMessage(payload);

    // 2. Silence local audio immediately
    stopEmergencySound();

    // 3. Update overlay on this device
    applySirenSilencedUI(payload.silencer);

    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(`Emergency siren deactivated campus-wide by ${user.name}.`, 'success');
    }

    return true;
  }

  // ── 5. Real-Time Cloud Relay Connection ──
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
        } catch (e) {}
      };

      cloudWs.onclose = () => {
        setTimeout(connectCloudRelay, 3000);
      };

      cloudWs.onerror = () => {
        if (cloudWs) cloudWs.close();
      };
    } catch (err) {
      setTimeout(connectCloudRelay, 4000);
    }
  }

  // ── 6. Local Node.js WebSocket Bridge ──
  function connectLocalServer() {
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

  // ── 7. BroadcastChannel & Storage Fallback ──
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
          if (payload) handleIncomingPayload(payload);
        } catch (err) {}
      }
    });
  }

  // ── 8. Payload Dispatch & Receiving ──
  function handleIncomingPayload(payload) {
    if (!payload || !payload.type) return;

    if (payload.type === 'EMERGENCY_BROADCAST') {
      activeAlertId = payload.alert ? payload.alert.id : null;
      sirenSilencedByAuthority = false;
      onEmergencyBroadcastReceived(payload.alert, payload.sender);
    } else if (payload.type === 'SILENCE_EMERGENCY_ALARM') {
      console.log(`[GRAPHICA] Siren silenced campus-wide by ${payload.silencer?.name} (${payload.silencer?.role})`);
      sirenSilencedByAuthority = true;
      stopEmergencySound();
      applySirenSilencedUI(payload.silencer);
    } else if (payload.type === 'HEARTBEAT') {
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
    setTimeout(broadcastHeartbeat, 20000);
  }

  function notifyPresenceChange() {
    const now = Date.now();
    for (const [id, dev] of connectedDevices.entries()) {
      if (now - dev.lastSeen > 45000) {
        connectedDevices.delete(id);
      }
    }

    const sessions = Array.from(connectedDevices.values());
    const currentUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;

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
          'Priority': (data.type === 'EMERGENCY_BROADCAST' || data.type === 'SILENCE_EMERGENCY_ALARM') ? '5' : '3',
          'Tags': data.type === 'SILENCE_EMERGENCY_ALARM' ? 'white_check_mark' : 'rotating_light'
        },
        body: JSON.stringify(data)
      }).catch(() => {});
    } catch (e) {}

    if (localWs && localWs.readyState === WebSocket.OPEN) {
      try { localWs.send(JSON.stringify(data)); } catch (e) {}
    }

    if (broadcastChannel) {
      try { broadcastChannel.postMessage(data); } catch (e) {}
    }

    try {
      localStorage.setItem('graphica_live_broadcast_event', JSON.stringify(data));
      if (data.type === 'SILENCE_EMERGENCY_ALARM') {
        localStorage.setItem('graphica_last_silenced_timestamp', Date.now().toString());
      }
    } catch (e) {}
  }

  // ── 9. Emergency Broadcast Trigger (Staff / Admin) ──
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

    activeAlertId = newAlert.id;
    sirenSilencedByAuthority = false;

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

    publishCloudMessage(payload);
    onEmergencyBroadcastReceived(newAlert, { name: user.name, role: user.role });

    return {
      success: true,
      alert: newAlert,
      deliveredCount: connectedDevices.size + 1
    };
  }

  // ── 10. Emergency Alert Modal & Restricted Deactivation UI ──
  function onEmergencyBroadcastReceived(alert, sender) {
    if (typeof Storage !== 'undefined') {
      const existing = Storage.getData(Storage.KEYS.ALERTS, []);
      const idx = existing.findIndex(a => a.id === alert.id);
      if (idx === -1) {
        existing.unshift(alert);
        Storage.saveData(Storage.KEYS.ALERTS, existing);
      }
    }

    let soundStarted = false;
    if (alert.soundAlert !== false) {
      soundStarted = startContinuousSiren();
    }

    if (navigator.vibrate) {
      try { navigator.vibrate([600, 200, 600, 200, 1000, 400, 600]); } catch (e) {}
    }

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
      animation: alertStrobe 1.2s infinite alternate;
    `;

    const isCritical = alert.severity === 'critical';
    const accentColor = isCritical ? '#E53E3E' : '#DD6B20';
    const isStaffOrAdmin = canSilenceAlarm();

    overlay.innerHTML = `
      <style>
        @keyframes alertStrobe {
          0% { background: rgba(10, 10, 10, 0.94); }
          100% { background: rgba(50, 10, 10, 0.97); }
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
      <div id="emergency-modal-card" style="
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
        <div id="modal-header-banner" style="background:${accentColor};padding:14px 20px;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:10px;font-weight:800;font-size:16px;letter-spacing:1px;text-transform:uppercase;color:#FFF;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            CAMPUS EMERGENCY ALERT
          </div>
          <span style="font-size:11px;background:rgba(0,0,0,0.35);padding:4px 8px;border-radius:20px;font-weight:700;color:#FFF;">
            ACTIVE ON ALL DEVICES
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
            box-shadow: 0 0 25px rgba(229,62,62,0.9);
            animation: pulseGlow 1s infinite;
          ">
            🔊 TAP HERE TO HEAR LOUD EMERGENCY SIREN
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

          <div style="background:#27272A;border-radius:10px;padding:18px;margin-bottom:20px;border-left:5px solid ${accentColor};font-size:15px;line-height:1.65;color:#F4F4F5;">
            ${alert.message}
          </div>

          <!-- Permission Status Banner -->
          ${isStaffOrAdmin ? `
            <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 18px;">🛡️</span>
              <div style="font-size: 13px; color: #A7F3D0; line-height: 1.4;">
                <strong>Staff / Admin Authorized:</strong> You have the authority to silence the siren campus-wide across all connected devices.
              </div>
            </div>
          ` : `
            <div id="student-lock-notice" style="background: rgba(220, 38, 38, 0.15); border: 1px solid rgba(220, 38, 38, 0.4); border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 18px;">🔒</span>
              <div style="font-size: 13px; color: #FCA5A5; line-height: 1.4;">
                <strong>Continuous Siren Active:</strong> The emergency alarm will continue ringing until authorized Campus Staff or Admin deactivates it.
              </div>
            </div>
          `}

          <!-- Actions -->
          <div id="emergency-modal-actions" style="display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;">
            ${isStaffOrAdmin ? `
              <!-- ONLY STAFF / ADMIN GET THE SILENCE BUTTON -->
              <button id="btn-staff-silence" style="
                background: #DC2626;
                color: #FFFFFF;
                border: none;
                padding: 14px 22px;
                border-radius: 8px;
                font-weight: 800;
                font-size: 14px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 4px 15px rgba(220,38,38,0.6);
              ">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                🔕 Silence Siren (Campus-Wide)
              </button>
            ` : `
              <!-- STUDENT DEVICE TURN OFF BUTTON (VERIFIES DEACTIVATION) -->
              <button id="btn-student-silence-device" style="
                background: #374151;
                color: #F9FAFB;
                border: 1px solid #4B5563;
                padding: 12px 18px;
                border-radius: 8px;
                font-weight: 700;
                font-size: 13px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
              ">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                🔕 Turn Off Siren on My Device
              </button>
            `}

            <button id="btn-acknowledge-safe" style="
              background: #2563EB;
              color: #FFFFFF;
              border: none;
              padding: 14px 24px;
              border-radius: 8px;
              font-weight: 800;
              font-size: 14px;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 8px;
              box-shadow: 0 4px 15px rgba(37,99,235,0.5);
            ">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              I Am Safe / Report Status
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Audio unlock button
    const soundBtn = document.getElementById('btn-tap-for-sound');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        unlockAudioEngine();
        startContinuousSiren();
        soundBtn.style.display = 'none';
      });
    }

    // Staff/Admin Silence Handler
    const staffSilenceBtn = document.getElementById('btn-staff-silence');
    if (staffSilenceBtn) {
      staffSilenceBtn.addEventListener('click', () => {
        silenceEmergencyAlarm();
      });
    }

    // Student Local Turn Off Handler (Checks if Admin has silenced it)
    const studentSilenceBtn = document.getElementById('btn-student-silence-device');
    if (studentSilenceBtn) {
      studentSilenceBtn.addEventListener('click', async () => {
        studentSilenceBtn.disabled = true;
        studentSilenceBtn.innerText = 'Checking Staff Status…';

        // 1. Check if authority has already silenced it or query cloud relay
        let isAuthorized = sirenSilencedByAuthority;

        if (!isAuthorized) {
          try {
            const res = await fetch(`${CLOUD_PUB_URL}/json?poll=1&since=60s`, { cache: 'no-store' });
            if (res.ok) {
              const text = await res.text();
              const lines = text.trim().split('\n');
              for (const line of lines) {
                if (!line) continue;
                const item = JSON.parse(line);
                if (item.message) {
                  const data = JSON.parse(item.message);
                  if (data.type === 'SILENCE_EMERGENCY_ALARM') {
                    isAuthorized = true;
                    applySirenSilencedUI(data.silencer);
                    break;
                  }
                }
              }
            }
          } catch (e) {}
        }

        // 2. If deactivated by staff/admin or if student confirmed safety
        if (isAuthorized) {
          stopEmergencySound();
          if (typeof App !== 'undefined' && App.showToast) {
            App.showToast('✓ Siren stopped. Confirmed all-clear from admin.', 'success');
          }
        } else {
          studentSilenceBtn.disabled = false;
          studentSilenceBtn.innerText = '🔕 Turn Off Siren on My Device';
          if (typeof App !== 'undefined' && App.showToast) {
            App.showToast('Active emergency protocol: Siren can only be deactivated by staff/admin.', 'error');
          }
        }
      });
    }

    // Acknowledge Button (For students / anyone)
    const ackBtn = document.getElementById('btn-acknowledge-safe');
    if (ackBtn) {
      ackBtn.addEventListener('click', () => {
        ackBtn.innerText = '✓ Safe Status Reported';
        ackBtn.style.background = '#059669';
        ackBtn.disabled = true;

        if (typeof App !== 'undefined' && App.showToast) {
          if (isStaffOrAdmin) {
            App.showToast('Status acknowledged. Click Silence Siren above to deactivate the alarm when all-clear.', 'info');
          } else {
            App.showToast('Status reported safe. Siren remains active until deactivated by staff.', 'info');
          }
        }
      });
    }
  }

  // Called when siren is deactivated by Staff/Admin (on ALL devices)
  function applySirenSilencedUI(silencer) {
    sirenSilencedByAuthority = true;
    stopEmergencySound();

    const headerBanner = document.getElementById('modal-header-banner');
    if (headerBanner) {
      headerBanner.style.background = '#059669';
      headerBanner.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;font-weight:800;font-size:15px;letter-spacing:1px;text-transform:uppercase;color:#FFF;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          EMERGENCY SIREN DEACTIVATED
        </div>
        <span style="font-size:11px;background:rgba(0,0,0,0.3);padding:4px 8px;border-radius:20px;font-weight:700;color:#FFF;">
          ALL CLEAR
        </span>
      `;
    }

    const card = document.getElementById('emergency-modal-card');
    if (card) {
      card.style.borderColor = '#10B981';
      card.style.animation = 'none';
    }

    const soundBtn = document.getElementById('btn-tap-for-sound');
    if (soundBtn) soundBtn.remove();

    const actionsContainer = document.getElementById('emergency-modal-actions');
    if (actionsContainer) {
      actionsContainer.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#A7F3D0;">
          <span style="font-size:16px;">✓</span>
          <span>Siren silenced by <strong>${silencer ? silencer.name : 'Campus Staff'}</strong> (${silencer ? silencer.role.toUpperCase() : 'STAFF'}).</span>
        </div>
        <button id="btn-dismiss-alert-final" style="
          background: #10B981;
          color: #FFFFFF;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
        ">
          Dismiss Notice & Return
        </button>
      `;

      const dismissBtn = document.getElementById('btn-dismiss-alert-final');
      if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
          stopEmergencySound();
          const overlay = document.getElementById('emergency-live-broadcast-overlay');
          if (overlay) overlay.remove();
        });
      }
    }

    const lockNotice = document.getElementById('student-lock-notice');
    if (lockNotice) {
      lockNotice.style.background = 'rgba(16, 185, 129, 0.15)';
      lockNotice.style.borderColor = 'rgba(16, 185, 129, 0.4)';
      lockNotice.innerHTML = `
        <span style="font-size:18px;">✅</span>
        <div style="font-size:13px;color:#A7F3D0;">Siren deactivated by campus safety authority. Situation resolved or under control.</div>
      `;
    }
  }

  // Global Header Warning Bar for Staff / Admin
  function updateGlobalSirenBanner(active) {
    const existing = document.getElementById('global-staff-siren-controller');
    if (existing) existing.remove();

    if (!active || !canSilenceAlarm()) return;

    const banner = document.createElement('div');
    banner.id = 'global-staff-siren-controller';
    banner.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0;
      background: #DC2626;
      color: #FFFFFF;
      padding: 10px 20px;
      font-weight: 700;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 999998;
      box-shadow: 0 4px 15px rgba(220,38,38,0.6);
      animation: alertStrobe 1s infinite alternate;
    `;
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;">🚨</span>
        <span>EMERGENCY SIREN IS ACTIVELY RINGING ON ALL DEVICES</span>
      </div>
      <button id="btn-header-silence-now" style="
        background: #18181B;
        color: #FFFFFF;
        border: 1px solid #FFFFFF44;
        padding: 6px 16px;
        border-radius: 6px;
        font-weight: 800;
        font-size: 13px;
        cursor: pointer;
      ">
        🔕 Silence Siren Campus-Wide
      </button>
    `;

    document.body.appendChild(banner);

    const headerSilenceBtn = document.getElementById('btn-header-silence-now');
    if (headerSilenceBtn) {
      headerSilenceBtn.addEventListener('click', () => {
        silenceEmergencyAlarm();
      });
    }
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

  // ── 11. Initialize Connections ──
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
    playEmergencySound: startContinuousSiren,
    stopEmergencySound,
    broadcastEmergency,
    silenceEmergencyAlarm,
    canSilenceAlarm,
    fetchActiveUsers,
    fetchAllUsers,
    getActiveUsersData: () => ({ totalConnected: connectedDevices.size + 1, sessions: Array.from(connectedDevices.values()) })
  };
})();
