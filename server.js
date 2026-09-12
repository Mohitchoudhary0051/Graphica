const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer, WebSocket } = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── In-Memory Database (Seeded with initial data) ──
let users = [
  {
    id: 'user-001',
    name: 'Arjun Mehta',
    email: 'student@graphica.demo',
    password: 'demo123',
    role: 'student',
    department: 'Computer Science',
    avatar: null,
    status: 'active',
    joinDate: '2025-08-15'
  },
  {
    id: 'user-002',
    name: 'Priya Sharma',
    email: 'staff@graphica.demo',
    password: 'demo123',
    role: 'staff',
    department: 'Safety & Facilities',
    avatar: null,
    status: 'active',
    joinDate: '2023-06-01'
  },
  {
    id: 'user-003',
    name: 'Dr. Rajesh Kapoor',
    email: 'admin@graphica.demo',
    password: 'demo123',
    role: 'admin',
    department: 'Administration',
    avatar: null,
    status: 'active',
    joinDate: '2021-01-10'
  },
  {
    id: 'user-004',
    name: 'Sneha Patel',
    email: 'sneha@greenfield.edu',
    password: 'demo123',
    role: 'student',
    department: 'Electrical Engineering',
    avatar: null,
    status: 'active',
    joinDate: '2025-08-15'
  },
  {
    id: 'user-005',
    name: 'Vikram Rao',
    email: 'vikram@greenfield.edu',
    password: 'demo123',
    role: 'staff',
    department: 'Maintenance',
    avatar: null,
    status: 'active',
    joinDate: '2024-03-20'
  }
];

let alerts = [
  {
    id: 'alert-001',
    title: 'Electrical maintenance in Block B',
    message: 'Rooms B-201 to B-210 will undergo electrical maintenance on September 13. Classes relocated to Block A. Avoid the 2nd floor of Block B during 9 AM – 4 PM.',
    severity: 'warning',
    type: 'maintenance',
    building: 'block-b',
    audience: 'all',
    createdBy: 'Dr. Rajesh Kapoor (Admin)',
    createdDate: '2026-09-11T09:00:00.000Z',
    active: true,
    acknowledgments: []
  },
  {
    id: 'alert-002',
    title: 'Fire evacuation drill — Block A',
    message: 'A fire evacuation drill is scheduled for Block A on September 15 at 10:30 AM. All occupants must participate. Proceed to Assembly Point A (front lawn) when the alarm sounds.',
    severity: 'info',
    type: 'drill',
    building: 'block-a',
    audience: 'all',
    createdBy: 'Dr. Rajesh Kapoor (Admin)',
    createdDate: '2026-09-10T10:30:00.000Z',
    active: true,
    acknowledgments: []
  }
];

// Connected WebSocket Clients
// ws -> { id, user: { id, name, email, role }, userAgent, ip, connectedAt, lastSeen }
const connectedClients = new Map();

// Helper to notify admins about presence changes
function broadcastPresenceUpdate() {
  const activeList = getActiveUsersList();
  const payload = JSON.stringify({
    type: 'PRESENCE_UPDATE',
    data: activeList
  });

  for (const [ws, info] of connectedClients.entries()) {
    if (ws.readyState === WebSocket.OPEN && info.user && info.user.role === 'admin') {
      ws.send(payload);
    }
  }
}

function getActiveUsersList() {
  const sessions = [];
  for (const [ws, info] of connectedClients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      sessions.push({
        socketId: info.id,
        user: info.user || { name: 'Visitor / Guest', role: 'guest', email: 'guest@device' },
        connectedAt: info.connectedAt,
        userAgent: info.userAgent,
        ip: info.ip,
        deviceType: parseDeviceType(info.userAgent)
      });
    }
  }
  return {
    totalConnected: sessions.length,
    sessions
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

// ── WebSocket Server ──
wss.on('connection', (ws, req) => {
  const socketId = 'sock_' + Math.random().toString(36).substring(2, 9);
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown Device';

  connectedClients.set(ws, {
    id: socketId,
    user: null,
    userAgent,
    ip,
    connectedAt: new Date().toISOString(),
    lastSeen: Date.now()
  });

  // Send initial welcome & connection confirmation
  ws.send(JSON.stringify({
    type: 'CONNECTION_ESTABLISHED',
    socketId,
    timestamp: new Date().toISOString()
  }));

  ws.on('message', (msgStr) => {
    try {
      const message = JSON.parse(msgStr);
      const client = connectedClients.get(ws);
      if (!client) return;

      client.lastSeen = Date.now();

      if (message.type === 'IDENTIFY') {
        // User logged in or identified on client
        client.user = message.user;
        broadcastPresenceUpdate();

        // If newly connected user is admin, immediately push current active list
        if (client.user && client.user.role === 'admin') {
          ws.send(JSON.stringify({
            type: 'PRESENCE_UPDATE',
            data: getActiveUsersList()
          }));
        }
      } else if (message.type === 'ACKNOWLEDGE_ALERT') {
        // User clicked "I am safe / Acknowledged"
        const alertId = message.alertId;
        const targetAlert = alerts.find(a => a.id === alertId);
        if (targetAlert) {
          if (!targetAlert.acknowledgments) targetAlert.acknowledgments = [];
          const existing = targetAlert.acknowledgments.find(ack => ack.userId === (client.user?.id || client.id));
          if (!existing) {
            targetAlert.acknowledgments.push({
              userId: client.user?.id || client.id,
              userName: client.user?.name || 'Anonymous Device',
              role: client.user?.role || 'visitor',
              time: new Date().toISOString()
            });
          }

          // Broadcast acknowledgment update to Staff and Admins
          const ackPayload = JSON.stringify({
            type: 'ALERT_ACK_UPDATE',
            alertId,
            acknowledgments: targetAlert.acknowledgments
          });
          for (const [otherWs, otherInfo] of connectedClients.entries()) {
            if (otherWs.readyState === WebSocket.OPEN && otherInfo.user && (otherInfo.user.role === 'admin' || otherInfo.user.role === 'staff')) {
              otherWs.send(ackPayload);
            }
          }
        }
      } else if (message.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      }
    } catch (err) {
      console.error('Error handling WS message:', err);
    }
  });

  ws.on('close', () => {
    connectedClients.delete(ws);
    broadcastPresenceUpdate();
  });

  ws.on('error', (err) => {
    console.error('WS client error:', err);
    connectedClients.delete(ws);
    broadcastPresenceUpdate();
  });
});

// Periodic ping to prune dead sockets
setInterval(() => {
  const now = Date.now();
  for (const [ws, info] of connectedClients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      if (now - info.lastSeen > 60000) {
        ws.terminate();
        connectedClients.delete(ws);
        broadcastPresenceUpdate();
      }
    }
  }
}, 30000);

// ── REST API ROUTES ──

// Middleware: Check Admin header / role for admin-only routes
function requireAdmin(req, res, next) {
  const userRole = req.headers['x-user-role'];
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
}

// Middleware: Check Staff or Admin
function requireStaffOrAdmin(req, res, next) {
  const userRole = req.headers['x-user-role'];
  if (userRole !== 'admin' && userRole !== 'staff') {
    return res.status(403).json({ error: 'Access denied. Staff or Admin privileges required.' });
  }
  next();
}

// 1. GET all users (ADMIN ONLY)
app.get('/api/users', requireAdmin, (req, res) => {
  res.json({
    success: true,
    count: users.length,
    users
  });
});

// 2. GET current active/connected users & sessions (ADMIN ONLY)
app.get('/api/users/active', requireAdmin, (req, res) => {
  const activeData = getActiveUsersList();
  res.json({
    success: true,
    ...activeData
  });
});

// 3. POST create new user (ADMIN ONLY)
app.post('/api/users', requireAdmin, (req, res) => {
  const { name, email, password, role, department } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required.' });
  }

  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'A user with this email already exists.' });
  }

  const newUser = {
    id: 'user-' + Date.now().toString(36),
    name,
    email,
    password: password || 'demo123',
    role: role || 'student',
    department: department || 'General',
    avatar: null,
    status: 'active',
    joinDate: new Date().toISOString().split('T')[0]
  };

  users.push(newUser);
  res.status(201).json({ success: true, user: newUser });
});

// 4. PUT update user (ADMIN ONLY)
app.put('/api/users/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const { name, role, department, status } = req.body;
  if (name) users[idx].name = name;
  if (role) users[idx].role = role;
  if (department) users[idx].department = department;
  if (status) users[idx].status = status;

  res.json({ success: true, user: users[idx] });
});

// 5. GET alerts
app.get('/api/alerts', (req, res) => {
  res.json({ success: true, alerts });
});

// 6. POST broadcast emergency alert (STAFF or ADMIN ONLY)
app.post('/api/alerts/broadcast', requireStaffOrAdmin, (req, res) => {
  const { title, message, severity, type, building, audience, soundAlert } = req.body;
  const senderRole = req.headers['x-user-role'];
  const senderName = req.headers['x-user-name'] || 'Authorized Personnel';

  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required.' });
  }

  const newAlert = {
    id: 'alert-' + Date.now().toString(36),
    title,
    message,
    severity: severity || 'critical',
    type: type || 'emergency',
    building: building || 'all',
    audience: audience || 'all',
    soundAlert: soundAlert !== false,
    createdBy: `${senderName} (${senderRole.toUpperCase()})`,
    createdDate: new Date().toISOString(),
    active: true,
    acknowledgments: []
  };

  // Prepend to alerts list
  alerts.unshift(newAlert);

  // Broadcast to ALL connected WebSocket clients immediately
  const broadcastPayload = JSON.stringify({
    type: 'EMERGENCY_BROADCAST',
    alert: newAlert,
    broadcastAt: new Date().toISOString(),
    sender: {
      name: senderName,
      role: senderRole
    }
  });

  let deliveredCount = 0;
  for (const [ws, info] of connectedClients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(broadcastPayload);
      deliveredCount++;
    }
  }

  console.log(`[EMERGENCY BROADCAST] Dispatched by ${senderName} (${senderRole}) to ${deliveredCount} connected devices.`);

  res.status(201).json({
    success: true,
    alert: newAlert,
    deliveredCount
  });
});

// 7. POST resolve/deactivate alert (STAFF or ADMIN ONLY)
app.post('/api/alerts/:id/resolve', requireStaffOrAdmin, (req, res) => {
  const { id } = req.params;
  const alert = alerts.find(a => a.id === id);
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found.' });
  }

  alert.active = false;
  alert.resolvedAt = new Date().toISOString();

  // Notify clients
  const payload = JSON.stringify({
    type: 'ALERT_RESOLVED',
    alertId: id
  });
  for (const [ws] of connectedClients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }

  res.json({ success: true, alert });
});

// Fallback to index.html for single-page app routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  GRAPHICA Backend Server running at:`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  WebSocket endpoint: ws://localhost:${PORT}/ws`);
  console.log(`====================================================`);
});
