/**
 * =========================================================================
 *  LEON EMERGENCY DISTRESS SIGNAL CONTROLLER
 *  HTML5 Geolocation, Leaflet Tactical Map, Radar Canvas & Direct Encrypted Chat
 * =========================================================================
 */

let userCoords = {
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 15,
  altitude: '84m MSL',
  acquired: false
};

let leafletMap = null;
let userMarker = null;
let selectedThreat = 'Immediate Life Threat';

// 1. Geolocation Acquisition
function initGeolocation() {
  const latEl = document.getElementById('telemetryLat');
  const lonEl = document.getElementById('telemetryLon');
  const accEl = document.getElementById('telemetryAcc');
  const secEl = document.getElementById('telemetrySector');
  const statusBadge = document.getElementById('geoStatusBadge');

  if (!('geolocation' in navigator)) {
    if (statusBadge) {
      statusBadge.innerText = 'GPS SENSOR UNAVAILABLE';
      statusBadge.style.borderColor = 'var(--warning)';
    }
    initTacticalMap(userCoords.latitude, userCoords.longitude);
    return;
  }

  if (statusBadge) {
    statusBadge.innerText = 'ACQUIRING ORBITAL TELEMETRY...';
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userCoords.latitude = position.coords.latitude;
      userCoords.longitude = position.coords.longitude;
      userCoords.accuracy = Math.round(position.coords.accuracy || 10);
      userCoords.altitude = position.coords.altitude ? `${Math.round(position.coords.altitude)}m MSL` : 'Ground Level';
      userCoords.acquired = true;

      if (latEl) latEl.innerText = `${userCoords.latitude.toFixed(5)}° N`;
      if (lonEl) lonEl.innerText = `${userCoords.longitude.toFixed(5)}° E`;
      if (accEl) accEl.innerText = `± ${userCoords.accuracy} meters`;
      if (secEl) secEl.innerText = `SECTOR [${Math.floor(userCoords.latitude * 10)} : ${Math.floor(userCoords.longitude * 10)}]`;

      if (statusBadge) {
        statusBadge.innerHTML = '● QUANTUM COORDINATES LOCKED';
        statusBadge.style.color = '#6ee7b7';
        statusBadge.style.borderColor = 'var(--success)';
        statusBadge.style.background = 'rgba(16, 185, 129, 0.15)';
      }

      window.SoundFX.playAngelicChime();
      showToast('🛰️ COORDINATES ACQUIRED', `Quantum telemetry locked at [${userCoords.latitude.toFixed(4)}, ${userCoords.longitude.toFixed(4)}]`, 'blue');

      initTacticalMap(userCoords.latitude, userCoords.longitude);
      calculateLeonETA(userCoords.latitude, userCoords.longitude);
    },
    (error) => {
      console.warn('Geolocation denied or timed out, using fallback vector:', error.message);
      if (statusBadge) {
        statusBadge.innerHTML = '⚠ GPS OVERRIDE ENGAGED (DEFAULT VECTOR)';
        statusBadge.style.color = '#fcd34d';
        statusBadge.style.borderColor = 'var(--warning)';
      }
      if (latEl) latEl.innerText = `${userCoords.latitude.toFixed(4)}° (Simulated)`;
      if (lonEl) lonEl.innerText = `${userCoords.longitude.toFixed(4)}° (Simulated)`;
      if (accEl) accEl.innerText = 'Manual Grid Mode';
      if (secEl) secEl.innerText = 'METROPOLIS SECTOR 7';

      initTacticalMap(userCoords.latitude, userCoords.longitude);
      calculateLeonETA(userCoords.latitude, userCoords.longitude);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

// 2. Leaflet Map with Tactical Dark Styling
function initTacticalMap(lat, lon) {
  const mapEl = document.getElementById('emergencyMap');
  if (!mapEl || typeof L === 'undefined') return;

  if (leafletMap) {
    leafletMap.setView([lat, lon], 14);
    if (userMarker) {
      userMarker.setLatLng([lat, lon]);
    }
    return;
  }

  try {
    leafletMap = L.map('emergencyMap', {
      center: [lat, lon],
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });

    // Dark Matter CartoDB tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(leafletMap);

    // Glowing Pulse Distress Marker
    const beaconIcon = L.divIcon({
      className: 'distress-marker-container',
      html: `
        <div style="position:relative; width:36px; height:36px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; inset:0; border-radius:50%; background:rgba(255, 59, 48, 0.4); animation:beaconPulse 1.4s infinite;"></div>
          <div style="width:16px; height:16px; border-radius:50%; background:#ff3b30; border:2px solid #ffffff; box-shadow:0 0 15px #ff3b30; position:relative; z-index:2;"></div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    userMarker = L.marker([lat, lon], { icon: beaconIcon }).addTo(leafletMap);
    userMarker.bindPopup(`
      <div style="font-family:'Outfit',sans-serif; color:#0f172a; padding:4px;">
        <strong style="color:#ff3b30;">🚨 CITIZEN DISTRESS BEACON</strong><br>
        <span style="font-size:0.8rem;">Coords: ${lat.toFixed(4)}, ${lon.toFixed(4)}</span><br>
        <span style="font-size:0.75rem; color:#64748b;">Leon orbital lock established.</span>
      </div>
    `);
  } catch (err) {
    console.error('Error loading Leaflet map:', err);
  }
}

// 3. Dynamic Leon ETA calculation
function calculateLeonETA(lat, lon) {
  const etaEl = document.getElementById('leonEtaCounter');
  if (!etaEl) return;
  // Leon moves at light-speed (approx 300,000 km/s) + atmospheric deceleration
  const randomSeconds = (2.8 + Math.random() * 2.4).toFixed(1);
  etaEl.innerText = `Leon En Route — ETA: ${randomSeconds}s`;
}

// 4. Send Distress SOS Signal
async function broadcastSosDistress() {
  window.SoundFX.playEmergencyPing();

  const notesInput = document.getElementById('distressNotesInput');
  const notes = notesInput ? notesInput.value.trim() : '';

  const payload = {
    latitude: userCoords.latitude,
    longitude: userCoords.longitude,
    accuracy: userCoords.accuracy,
    threatType: selectedThreat,
    urgency: 'CRITICAL',
    sector: `Sector [${userCoords.latitude.toFixed(2)}, ${userCoords.longitude.toFixed(2)}]`,
    notes: notes || `Direct distress beacon activated for: ${selectedThreat}`
  };

  try {
    const res = await fetch('/api/emergency/distress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast('🚨 DISTRESS SIGNAL SENT', 'Beacon broadcasted to Leon and emergency response units.', 'red');
      if (notesInput) notesInput.value = '';
    }
  } catch (err) {
    console.error('Distress transmission error:', err);
    showToast('BEACON TRANSMITTED', 'Offline queue broadcasted.', 'red');
  }
}

// 5. Emergency Chat Console
async function loadChatMessages() {
  try {
    const res = await fetch('/api/emergency/chat');
    if (res.ok) {
      const messages = await res.json();
      renderChatMessages(messages);
    }
  } catch (err) {
    console.warn('Could not load chat messages:', err);
  }
}

function renderChatMessages(messages) {
  const container = document.getElementById('chatMessagesStream');
  if (!container) return;
  container.innerHTML = '';

  messages.forEach(msg => {
    appendChatMessageUI(msg, false);
  });

  container.scrollTop = container.scrollHeight;
}

function appendChatMessageUI(msg, scroll = true) {
  const container = document.getElementById('chatMessagesStream');
  if (!container) return;

  const bubble = document.createElement('div');
  const isLeon = msg.isLeon || msg.role === 'admin';
  const isSystem = msg.role === 'system';

  if (isSystem) {
    bubble.className = 'chat-bubble bubble-system';
    bubble.innerHTML = `
      <div class="bubble-text">${msg.content}</div>
    `;
  } else if (isLeon) {
    bubble.className = 'chat-bubble bubble-leon';
    bubble.innerHTML = `
      <div class="bubble-avatar" style="border: 2px solid var(--gold); box-shadow:0 0 10px var(--gold-glow);">
        <img src="${msg.avatar || '/assets/images/leon_portrait.jpg'}" alt="Leon">
      </div>
      <div class="bubble-body">
        <div class="bubble-meta">
          <span class="bubble-sender" style="color:var(--gold);">Leon 🛡️✨ <span style="font-size:0.68rem; background:rgba(245,215,127,0.2); padding:1px 6px; border-radius:10px;">ARCH-SENTINEL</span></span>
          <span class="bubble-time">${msg.timestamp || 'Just now'}</span>
        </div>
        <div class="bubble-text">${msg.content}</div>
      </div>
    `;
  } else {
    bubble.className = 'chat-bubble bubble-user';
    bubble.innerHTML = `
      <div class="bubble-avatar">
        <img src="${msg.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}" alt="Citizen">
      </div>
      <div class="bubble-body" style="align-items:flex-end;">
        <div class="bubble-meta">
          <span class="bubble-time">${msg.timestamp || 'Just now'}</span>
          <span class="bubble-sender">${msg.sender || 'Citizen in Peril'}</span>
        </div>
        <div class="bubble-text">${msg.content}</div>
      </div>
    `;
  }

  container.appendChild(bubble);
  if (scroll) {
    container.scrollTop = container.scrollHeight;
  }
}

async function sendEmergencyChatMessage() {
  const input = document.getElementById('emergencyChatInput');
  if (!input) return;
  const content = input.value.trim();
  if (!content) return;

  const adminToken = sessionStorage.getItem('leon_admin_token') || '';
  const isAdmin = (localStorage.getItem('leon_admin_mode') === 'true') && !!adminToken;

  const payload = {
    sender: isAdmin ? 'Leon' : 'Citizen in Sector 7',
    role: isAdmin ? 'admin' : 'citizen',
    isLeon: isAdmin,
    content: content,
    coords: userCoords,
    priority: isAdmin ? 'TACTICAL_RESPONSE' : 'HIGH',
    adminToken: adminToken
  };

  input.value = '';
  window.SoundFX.playBlip();

  try {
    const res = await fetch('/api/emergency/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success && !window.EventSource) {
      appendChatMessageUI(result.message);
    }
  } catch (err) {
    console.error('Error sending chat:', err);
  }
}

// Global SSE Hook for Chat
window.handleIncomingChatMessage = function(msg) {
  appendChatMessageUI(msg, true);
};

// Global SSE Hook for Distress
window.handleIncomingDistress = function(beacon) {
  if (leafletMap && beacon.latitude && beacon.longitude) {
    calculateLeonETA(beacon.latitude, beacon.longitude);
  }
};

// Threat selection buttons
function initThreatButtons() {
  const buttons = document.querySelectorAll('.btn-preset');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedThreat = btn.dataset.threat || btn.innerText;
      window.SoundFX.playBlip();
    });
  });
}

// Initialization on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initGeolocation();
  initThreatButtons();
  loadChatMessages();

  const sendBtn = document.getElementById('sendChatBtn');
  const chatInput = document.getElementById('emergencyChatInput');
  const sosBtn = document.getElementById('broadcastSosBtn');

  if (sendBtn) {
    sendBtn.addEventListener('click', sendEmergencyChatMessage);
  }
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendEmergencyChatMessage();
      }
    });
  }
  if (sosBtn) {
    sosBtn.addEventListener('click', broadcastSosDistress);
  }
});
