/**
 * =========================================================================
 *  LEON - ARCH-SENTINEL COMMAND HUB & PUBLIC PORTAL SERVER
 *  Zero-dependency, high-performance Node.js HTTP & Real-Time Backend
 *  Secure Admin Authentication & Tactical Global Distress Telemetry Console
 * =========================================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Admin Security Passcode (default or environment override)
const ADMIN_PASSCODE = process.env.LEON_ADMIN_KEY || 'AEGIS-777';

// Active Authenticated Admin Session Tokens
const activeAdminTokens = new Set();

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

// SSE connected clients
const sseClients = new Set();

function broadcastEvent(eventType, payload) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(message);
    } catch (err) {
      sseClients.delete(res);
    }
  }
}

// Helper: read JSON safely
function readJson(filename, defaultValue = []) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) return defaultValue;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filename}:`, err.message);
    return defaultValue;
  }
}

// Helper: write JSON safely
function writeJson(filename, data) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing ${filename}:`, err.message);
  }
}

// Parse request body
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 15 * 1024 * 1024) { // 15MB limit for images
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        resolve(parsed);
      } catch (err) {
        resolve({ raw: body });
      }
    });
    req.on('error', reject);
  });
}

// Send JSON response
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token'
  });
  res.end(JSON.stringify(data));
}

// Check admin authorization
function isAuthenticatedAdmin(req, body = null) {
  const authHeader = req.headers['authorization'] || '';
  const xToken = req.headers['x-admin-token'] || '';
  const bodyToken = (body && body.adminToken) || '';

  let candidateToken = '';
  if (authHeader.startsWith('Bearer ')) {
    candidateToken = authHeader.substring(7).trim();
  } else if (xToken) {
    candidateToken = xToken.trim();
  } else if (bodyToken) {
    candidateToken = bodyToken.trim();
  }

  return candidateToken && activeAdminTokens.has(candidateToken);
}

// Intelligent Leon Tactical Dispatcher Responses
const LEON_TACTICAL_RESPONSES = [
  "Coordinates locked into orbital guidance. Teleportation fold in progress — hold tight, I am arriving in 3 seconds.",
  "Danger Detection pulse confirmed. An angelic light barrier has been initialized at your sector. Stay low and do not panic.",
  "I have sensed your distress signal. My telekinetic field is securing the immediate perimeter. You are under Archangel protection.",
  "Light-speed transit underway. Structural scan shows unstable ground near you — move 20 paces toward the open avenue immediately.",
  "Omniscience sensor attuned to your voice. First responders and my celestial aegis are converging on your location now."
];

function triggerLeonAutoResponse(userMsg, distressCoords = null) {
  setTimeout(() => {
    const chat = readJson('chat.json', []);
    let responseText = LEON_TACTICAL_RESPONSES[Math.floor(Math.random() * LEON_TACTICAL_RESPONSES.length)];

    const lower = (userMsg.content || '').toLowerCase();
    if (lower.includes('fire') || lower.includes('burn') || lower.includes('smoke')) {
      responseText = "Aegis shield deployed to seal oxygen starvation and quench the inferno. Stay close to the ground, my cooling aura is reaching you.";
    } else if (lower.includes('trapped') || lower.includes('debris') || lower.includes('rubble') || lower.includes('fall')) {
      responseText = "Telekinetic suspension active. The rubble above you has been weightlessly locked. Stand clear as I extract you.";
    } else if (lower.includes('attack') || lower.includes('rob') || lower.includes('monster') || lower.includes('villain') || lower.includes('meta')) {
      responseText = "Hostile threat designated Code-Red. I am touching down between you and the aggressor right now. Justice is at hand.";
    }

    const leonMsg = {
      id: 'msg-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex'),
      sender: 'Leon',
      role: 'admin',
      avatar: '/assets/images/leon_portrait.jpg',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isLeon: true,
      priority: 'TACTICAL_RESPONSE',
      content: responseText
    };

    chat.push(leonMsg);
    writeJson('chat.json', chat);
    broadcastEvent('chat_message', leonMsg);
  }, 1200);
}

// Server handler
const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token'
    });
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Real-time SSE Stream
  if (pathname === '/api/stream' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write('retry: 3000\n\n');
    res.write(`event: connected\ndata: {"status":"CONNECTED_TO_LEON_QUANTUM_CORE","timestamp":"${new Date().toISOString()}"}\n\n`);

    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  // --- API ENDPOINTS ---

  // 1. System Status
  if (pathname === '/api/status' && req.method === 'GET') {
    const distress = readJson('distress.json', []);
    const posts = readJson('posts.json', []);
    const activeBeacons = distress.filter(d => d.status !== 'RESOLVED').length;

    sendJson(res, 200, {
      status: 'ONLINE',
      core: 'ARCH-SENTINEL QUANTUM UPLINK',
      encryption: 'CELESTIAL-256 (SACRED AEGIS)',
      orbitalStatus: 'WATCHING OVER EARTH — SECTOR 0 TO 360',
      activeDistressCount: activeBeacons,
      totalCommunityReports: posts.length,
      averageEta: '3.8 seconds',
      lightSpeedMultiplier: '1.0 c',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // 2. SECURE ADMIN AUTHENTICATION
  if (pathname === '/api/admin/login' && req.method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const passcode = (body.passcode || '').trim();

      if (passcode === ADMIN_PASSCODE) {
        const token = 'aegis_' + crypto.randomBytes(28).toString('hex');
        activeAdminTokens.add(token);

        sendJson(res, 200, {
          success: true,
          authenticated: true,
          token: token,
          role: 'admin',
          heroAlias: 'Leon (Arch-Sentinel)',
          expiresIn: 86400,
          message: 'QUANTUM ENCRYPTION CONFIRMED. WELCOME, ARCH-SENTINEL.'
        });
      } else {
        sendJson(res, 401, {
          success: false,
          error: 'ACCESS DENIED: Invalid Archangel Passcode. Authentication failed.'
        });
      }
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  if (pathname === '/api/admin/verify' && (req.method === 'GET' || req.method === 'POST')) {
    const body = req.method === 'POST' ? await parseRequestBody(req) : null;
    const isAuth = isAuthenticatedAdmin(req, body);
    sendJson(res, 200, { authenticated: isAuth });
    return;
  }

  if (pathname === '/api/admin/logout' && req.method === 'POST') {
    const body = await parseRequestBody(req);
    const authHeader = req.headers['authorization'] || '';
    const token = (authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '') || body.token;
    if (token) activeAdminTokens.delete(token);
    sendJson(res, 200, { success: true, message: 'ADMIN SESSION TERMINATED.' });
    return;
  }

  // 3. ADMIN TACTICAL DISTRESS CONSOLE (VIEW ALL BROADCASTS)
  if (pathname === '/api/admin/distress' && req.method === 'GET') {
    const distress = readJson('distress.json', []);
    sendJson(res, 200, distress);
    return;
  }

  // Admin Dispatch Rescue to a Distress Beacon
  const dispatchMatch = pathname.match(/^\/api\/admin\/distress\/([a-zA-Z0-9_-]+)\/dispatch$/);
  if (dispatchMatch && req.method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      if (!isAuthenticatedAdmin(req, body)) {
        sendJson(res, 403, { error: 'ACCESS FORBIDDEN: Valid Archangel credentials required to dispatch tactical rescues.' });
        return;
      }

      const beaconId = dispatchMatch[1];
      const distress = readJson('distress.json', []);
      const index = distress.findIndex(d => d.id === beaconId);
      if (index === -1) {
        sendJson(res, 404, { error: 'Beacon not found' });
        return;
      }

      const beacon = distress[index];
      const actionType = body.action || 'LIGHT_SPEED_INTERCEPT';
      beacon.status = 'EN_ROUTE';
      beacon.dispatchedAt = new Date().toISOString();
      beacon.dispatchDirective = body.directive || 'Archangel Leon airborne at relativistic velocity';
      beacon.eta = '1.8 seconds';

      writeJson('distress.json', distress);
      broadcastEvent('distress_updated', beacon);

      // Post broadcast update into emergency chat
      const chat = readJson('chat.json', []);
      const tacticalChatMsg = {
        id: 'msg-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex'),
        sender: 'Leon',
        role: 'admin',
        avatar: '/assets/images/leon_portrait.jpg',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        isLeon: true,
        priority: 'TACTICAL_RESPONSE',
        content: `⚡ DIRECTIVE FOR ${beacon.sector.toUpperCase()}: Dispatched ${actionType.replace(/_/g, ' ')}. Coordinates locked at [${beacon.latitude.toFixed(4)}, ${beacon.longitude.toFixed(4)}]. Divine aegis descending in 2 seconds.`
      };
      chat.push(tacticalChatMsg);
      writeJson('chat.json', chat);
      broadcastEvent('chat_message', tacticalChatMsg);

      sendJson(res, 200, { success: true, beacon, tacticalMessage: tacticalChatMsg });
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // Admin Mark Distress Beacon Resolved
  const resolveMatch = pathname.match(/^\/api\/admin\/distress\/([a-zA-Z0-9_-]+)\/resolve$/);
  if (resolveMatch && req.method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      if (!isAuthenticatedAdmin(req, body)) {
        sendJson(res, 403, { error: 'ACCESS FORBIDDEN: Valid Archangel credentials required to resolve distress signals.' });
        return;
      }

      const beaconId = resolveMatch[1];
      const distress = readJson('distress.json', []);
      const index = distress.findIndex(d => d.id === beaconId);
      if (index === -1) {
        sendJson(res, 404, { error: 'Beacon not found' });
        return;
      }

      const beacon = distress[index];
      beacon.status = 'RESOLVED';
      beacon.resolvedAt = new Date().toISOString();
      beacon.resolutionNotes = body.notes || 'Threat neutralized, perimeter stabilized by Leon.';

      writeJson('distress.json', distress);
      broadcastEvent('distress_resolved', beacon);

      // Post in chat
      const chat = readJson('chat.json', []);
      const resolvedMsg = {
        id: 'msg-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex'),
        sender: 'Leon',
        role: 'admin',
        avatar: '/assets/images/leon_portrait.jpg',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        isLeon: true,
        priority: 'TACTICAL_RESPONSE',
        content: `✅ PERIMETER SECURED: ${beacon.sector} crisis resolved. All civilians are protected. The Aegis holds.`
      };
      chat.push(resolvedMsg);
      writeJson('chat.json', chat);
      broadcastEvent('chat_message', resolvedMsg);

      sendJson(res, 200, { success: true, beacon });
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // 4. Emergency Distress Beacons (Citizen Broadcast)
  if (pathname === '/api/emergency/distress') {
    if (req.method === 'GET') {
      const distress = readJson('distress.json', []);
      sendJson(res, 200, distress);
      return;
    }
    if (req.method === 'POST') {
      try {
        const body = await parseRequestBody(req);
        const distress = readJson('distress.json', []);
        const newBeacon = {
          id: 'sos-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex'),
          timestamp: new Date().toISOString(),
          latitude: Number(body.latitude) || 40.7128,
          longitude: Number(body.longitude) || -74.0060,
          accuracy: body.accuracy || 10,
          sector: body.sector || 'Direct Telemetry Sector',
          threatType: body.threatType || 'Immediate Life Threat',
          urgency: body.urgency || 'CRITICAL',
          status: 'ACTIVE_TRACKING',
          citizenName: body.citizenName || 'Citizen in Peril',
          notes: body.notes || 'Emergency distress pulse initiated'
        };

        distress.unshift(newBeacon);
        writeJson('distress.json', distress);

        broadcastEvent('distress_signal', newBeacon);

        // Create a priority chat notification in the emergency channel
        const chat = readJson('chat.json', []);
        const alertMsg = {
          id: 'msg-' + Date.now(),
          sender: 'DISTRESS RADAR',
          role: 'system',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          isLeon: false,
          priority: 'CRITICAL',
          content: `🚨 BEACON ACQUIRED: Coordinates [${Number(newBeacon.latitude).toFixed(4)}, ${Number(newBeacon.longitude).toFixed(4)}]. Urgency: ${newBeacon.urgency}. Threat: ${newBeacon.threatType}. Leon tracking lock engaged.`
        };
        chat.push(alertMsg);
        writeJson('chat.json', chat);
        broadcastEvent('chat_message', alertMsg);

        // Leon immediately acknowledges
        triggerLeonAutoResponse({ content: `Distress beacon acknowledged at [${Number(newBeacon.latitude).toFixed(4)}, ${Number(newBeacon.longitude).toFixed(4)}]. ETA under 4 seconds.` });

        sendJson(res, 201, { success: true, beacon: newBeacon });
      } catch (err) {
        sendJson(res, 500, { error: err.message });
      }
      return;
    }
  }

  // 5. Emergency Direct Chat with Leon
  if (pathname === '/api/emergency/chat') {
    if (req.method === 'GET') {
      const chat = readJson('chat.json', []);
      sendJson(res, 200, chat);
      return;
    }
    if (req.method === 'POST') {
      try {
        const body = await parseRequestBody(req);
        if (!body.content || !body.content.trim()) {
          sendJson(res, 400, { error: 'Message content is required' });
          return;
        }

        // Verify if sender claims to be Leon / admin
        let isLeon = false;
        if (body.isLeon === true || body.role === 'admin') {
          if (isAuthenticatedAdmin(req, body)) {
            isLeon = true;
          }
        }

        const chat = readJson('chat.json', []);
        const newMsg = {
          id: 'msg-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex'),
          sender: isLeon ? 'Leon' : (body.sender || 'Citizen'),
          role: isLeon ? 'admin' : 'citizen',
          avatar: isLeon ? '/assets/images/leon_portrait.jpg' : (body.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          isLeon: isLeon,
          priority: isLeon ? 'TACTICAL_RESPONSE' : (body.priority || 'HIGH'),
          content: body.content.trim(),
          coords: body.coords || null
        };

        chat.push(newMsg);
        writeJson('chat.json', chat);
        broadcastEvent('chat_message', newMsg);

        // If a citizen sent it, have Leon dispatch a real-time reassuring tactical response
        if (!isLeon) {
          triggerLeonAutoResponse(newMsg, body.coords);
        }

        sendJson(res, 201, { success: true, message: newMsg });
      } catch (err) {
        sendJson(res, 500, { error: err.message });
      }
      return;
    }
  }

  // 6. Community Feed Posts
  if (pathname === '/api/posts') {
    if (req.method === 'GET') {
      const posts = readJson('posts.json', []);
      sendJson(res, 200, posts);
      return;
    }
    if (req.method === 'POST') {
      try {
        const body = await parseRequestBody(req);
        if (!body.content || !body.content.trim()) {
          sendJson(res, 400, { error: 'Post content is required' });
          return;
        }

        // Verify admin token if posting as Leon
        let isLeon = false;
        if (body.isLeon === true || body.role === 'admin') {
          if (isAuthenticatedAdmin(req, body)) {
            isLeon = true;
          }
        }

        const posts = readJson('posts.json', []);
        const newPost = {
          id: 'post-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex'),
          author: isLeon ? 'Leon' : (body.author || 'Anonymous Citizen'),
          handle: isLeon ? '@ArchSentinel' : (body.handle || '@citizen_' + Math.floor(1000 + Math.random() * 9000)),
          role: isLeon ? 'admin' : (body.role || 'citizen'),
          avatar: isLeon ? '/assets/images/leon_portrait.jpg' : (body.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'),
          timestamp: 'Just now',
          tag: body.tag || (isLeon ? 'Archangel Decree' : 'Citizen Report'),
          content: body.content.trim(),
          image: body.image || null,
          likes: isLeon ? 142 : 0,
          userLiked: false,
          comments: []
        };

        posts.unshift(newPost);
        writeJson('posts.json', posts);
        broadcastEvent('new_post', newPost);

        sendJson(res, 201, { success: true, post: newPost });
      } catch (err) {
        sendJson(res, 500, { error: err.message });
      }
      return;
    }
  }

  // 7. Post Comments
  const commentMatch = pathname.match(/^\/api\/posts\/([a-zA-Z0-9_-]+)\/comments$/);
  if (commentMatch && req.method === 'POST') {
    try {
      const postId = commentMatch[1];
      const body = await parseRequestBody(req);
      if (!body.content || !body.content.trim()) {
        sendJson(res, 400, { error: 'Comment content is required' });
        return;
      }

      const posts = readJson('posts.json', []);
      const postIndex = posts.findIndex(p => p.id === postId);
      if (postIndex === -1) {
        sendJson(res, 404, { error: 'Post not found' });
        return;
      }

      // Check if admin
      let isLeon = false;
      if (body.isLeon === true || body.role === 'admin') {
        if (isAuthenticatedAdmin(req, body)) {
          isLeon = true;
        }
      }

      const newComment = {
        id: 'c-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex'),
        author: isLeon ? 'Leon' : (body.author || 'Citizen'),
        handle: isLeon ? '@ArchSentinel' : (body.handle || '@citizen'),
        role: isLeon ? 'admin' : 'citizen',
        avatar: isLeon ? '/assets/images/leon_portrait.jpg' : (body.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'),
        timestamp: 'Just now',
        content: body.content.trim(),
        isLeon: isLeon
      };

      if (!posts[postIndex].comments) posts[postIndex].comments = [];
      posts[postIndex].comments.push(newComment);
      writeJson('posts.json', posts);

      broadcastEvent('new_comment', { postId, comment: newComment });
      sendJson(res, 201, { success: true, comment: newComment });
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // 8. Post Like Toggle
  const likeMatch = pathname.match(/^\/api\/posts\/([a-zA-Z0-9_-]+)\/like$/);
  if (likeMatch && req.method === 'POST') {
    try {
      const postId = likeMatch[1];
      const posts = readJson('posts.json', []);
      const postIndex = posts.findIndex(p => p.id === postId);
      if (postIndex === -1) {
        sendJson(res, 404, { error: 'Post not found' });
        return;
      }

      const post = posts[postIndex];
      post.userLiked = !post.userLiked;
      post.likes = Math.max(0, (post.likes || 0) + (post.userLiked ? 1 : -1));

      writeJson('posts.json', posts);
      broadcastEvent('post_liked', { postId, likes: post.likes, userLiked: post.userLiked });

      sendJson(res, 200, { success: true, likes: post.likes, userLiked: post.userLiked });
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // --- STATIC FILE SERVING ---
  let filePath = '';
  let cleanPath = pathname;

  if (cleanPath === '/' || cleanPath === '/index' || cleanPath === '/home') {
    cleanPath = '/index.html';
  } else if (cleanPath === '/emergency') {
    cleanPath = '/emergency.html';
  } else if (cleanPath === '/interaction') {
    cleanPath = '/interaction.html';
  } else if (cleanPath === '/origin') {
    cleanPath = '/origin.html';
  } else if (cleanPath === '/admin') {
    cleanPath = '/admin.html';
  }

  // Check public directory first
  const publicCandidate = path.join(PUBLIC_DIR, cleanPath);
  const rootCandidate = path.join(__dirname, cleanPath);

  if (fs.existsSync(publicCandidate) && fs.statSync(publicCandidate).isFile()) {
    filePath = publicCandidate;
  } else if (fs.existsSync(rootCandidate) && fs.statSync(rootCandidate).isFile()) {
    filePath = rootCandidate;
  } else {
    // 404
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>404 - Sector Not Found | Leon Command Hub</title>
        <link rel="stylesheet" href="/css/style.css">
      </head>
      <body class="bg-void text-white flex-center" style="min-height:100vh; text-align:center; padding:2rem;">
        <div>
          <h1 style="font-size:4rem; color:var(--gold);">404</h1>
          <h2 style="margin:1rem 0;">Sector Telemetry Not Found</h2>
          <p style="color:var(--text-muted); margin-bottom:2rem;">This frequency or page has dissolved into the celestial fold.</p>
          <a href="/" class="btn btn-gold">Return to Command Hub</a>
        </div>
      </body>
      </html>
    `);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading file: ' + err.message);
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400'
    });
    res.end(content);
  });
});

// Start listening
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`⚡ LEON COMMAND HUB ACTIVE AT http://localhost:${PORT}`);
  console.log(`⚡ ARCH-SENTINEL QUANTUM CORE: READY & WATCHING EARTH`);
  console.log(`🔒 ADMIN PASSCODE CONFIGURED: ${ADMIN_PASSCODE}`);
  console.log(`=======================================================`);
});
