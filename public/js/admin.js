/**
 * =========================================================================
 *  LEON ARCH-SENTINEL: ADMIN TACTICAL COMMAND & DISTRESS MAP CONTROLLER
 *  Secure Authentication, Real-Time Global Distress Markers & Rescue Dispatch
 * =========================================================================
 */

let adminMap = null;
let mapMarkers = {};
let flightVectorLine = null;
let currentDistressList = [];
let selectedBeacon = null;
let currentFilter = 'all';

// Orbital vantage point of Leon (simulated orbital satellite position)
const LEON_ORBITAL_POSITION = [40.7580, -73.9855];

// 1. Authentication Check
async function verifyAdminAuth() {
  const token = sessionStorage.getItem('leon_admin_token');
  const modal = document.getElementById('adminAuthModal');

  if (!token) {
    if (modal) modal.style.display = 'flex';
    return false;
  }

  try {
    const res = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (data.authenticated) {
      if (modal) modal.style.display = 'none';
      return true;
    } else {
      sessionStorage.removeItem('leon_admin_token');
      if (modal) modal.style.display = 'flex';
      return false;
    }
  } catch (err) {
    console.error('Auth verification error:', err);
    return false;
  }
}

// 2. Submit Passcode
async function submitAdminAuth() {
  const passInput = document.getElementById('adminPasscodeInput');
  if (!passInput) return;
  const passcode = passInput.value.trim();
  if (!passcode) return;

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      sessionStorage.setItem('leon_admin_token', data.token);
      localStorage.setItem('leon_admin_mode', 'true');
      document.getElementById('adminAuthModal').style.display = 'none';
      window.SoundFX.playAngelicChime();
      showToast('🛡️ ARCH-SENTINEL AUTHORIZED', 'Command Deck Unlocked. Satellite telemetry active.', 'gold');
      initAdminCommandDeck();
    } else {
      passInput.style.borderColor = 'var(--crimson)';
      passInput.value = '';
      window.SoundFX.playEmergencyPing();
      showToast('ACCESS DENIED', data.error || 'Invalid passcode.', 'red');
    }
  } catch (err) {
    console.error('Login error:', err);
  }
}

// 3. Logout
async function logoutAdminSession() {
  const token = sessionStorage.getItem('leon_admin_token');
  try {
    await fetch('/api/admin/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ token })
    });
  } catch (e) {}

  sessionStorage.removeItem('leon_admin_token');
  localStorage.setItem('leon_admin_mode', 'false');
  window.location.href = '/index.html';
}

// 4. Initialize Map
function initAdminMap() {
  const mapEl = document.getElementById('adminDistressMap');
  if (!mapEl || typeof L === 'undefined' || adminMap) return;

  adminMap = L.map('adminDistressMap', {
    center: [40.7282, -73.9942],
    zoom: 13,
    zoomControl: true,
    attributionControl: false
  });

  // Dark Matter tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(adminMap);

  // Leon Orbital Watcher Marker
  const leonIcon = L.divIcon({
    className: 'leon-orbital-marker',
    html: `
      <div style="position:relative; width:44px; height:44px; display:flex; align-items:center; justify-content:center;">
        <div style="position:absolute; inset:0; border-radius:50%; background:rgba(245,215,127,0.3); animation:pulse-dot 2.5s infinite;"></div>
        <div style="width:26px; height:26px; border-radius:50%; background:var(--gold); border:2px solid #fff; box-shadow:0 0 20px var(--gold); display:flex; align-items:center; justify-content:center; font-size:0.75rem;">🛡️</div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });

  L.marker(LEON_ORBITAL_POSITION, { icon: leonIcon })
    .addTo(adminMap)
    .bindPopup(`
      <div style="color:#0f172a; font-family:'Outfit',sans-serif; padding:4px;">
        <strong style="color:#b8912e;">⚡ LEON: ORBITAL POSITION</strong><br>
        <span style="font-size:0.8rem;">Altitude: 450km Low Earth Orbit</span><br>
        <span style="font-size:0.75rem; color:#64748b;">Ready for instantaneous light-speed descent.</span>
      </div>
    `);
}

// 5. Fetch & Plot Distress Beacons
async function fetchDistressBeacons() {
  try {
    const res = await fetch('/api/admin/distress');
    if (res.ok) {
      currentDistressList = await res.json();
      renderDistressMarkers(currentDistressList);
      renderBeaconList(currentDistressList);
      updateActiveCountBadge(currentDistressList);
    }
  } catch (err) {
    console.error('Error fetching distress beacons:', err);
  }
}

function updateActiveCountBadge(list) {
  const activeCount = list.filter(b => b.status !== 'RESOLVED').length;
  const label = document.getElementById('activeSignalsCountLabel');
  if (label) {
    label.innerText = `SATELLITE RADAR: ${activeCount} ACTIVE`;
  }
}

function renderDistressMarkers(beacons) {
  if (!adminMap) return;

  // Clear existing markers
  Object.values(mapMarkers).forEach(m => adminMap.removeLayer(m));
  mapMarkers = {};

  beacons.forEach(beacon => {
    if (!beacon.latitude || !beacon.longitude) return;

    const isResolved = beacon.status === 'RESOLVED';
    const isEnRoute = beacon.status === 'EN_ROUTE';
    const isCritical = beacon.urgency === 'CRITICAL';

    let iconHtml = '';
    if (isResolved) {
      iconHtml = `
        <div style="position:relative; width:32px; height:32px; display:flex; align-items:center; justify-content:center;">
          <div style="width:20px; height:20px; border-radius:50%; background:#10b981; border:2px solid #fff; box-shadow:0 0 12px #10b981; display:flex; align-items:center; justify-content:center; font-size:0.65rem; color:#fff;">✓</div>
        </div>
      `;
    } else if (isEnRoute) {
      iconHtml = `
        <div style="position:relative; width:36px; height:36px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; inset:0; border-radius:50%; background:rgba(245,215,127,0.4); animation:beaconPulse 1s infinite;"></div>
          <div style="width:20px; height:20px; border-radius:50%; background:var(--gold); border:2px solid #fff; box-shadow:0 0 15px var(--gold); display:flex; align-items:center; justify-content:center; font-size:0.7rem;">⚡</div>
        </div>
      `;
    } else {
      const col = isCritical ? '#ff3b30' : '#f59e0b';
      iconHtml = `
        <div style="position:relative; width:38px; height:38px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; inset:0; border-radius:50%; background:${isCritical ? 'rgba(255,59,48,0.4)' : 'rgba(245,158,11,0.4)'}; animation:beaconPulse 1.2s infinite;"></div>
          <div style="width:18px; height:18px; border-radius:50%; background:${col}; border:2px solid #fff; box-shadow:0 0 15px ${col};"></div>
        </div>
      `;
    }

    const icon = L.divIcon({
      className: 'admin-marker-wrap',
      html: iconHtml,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    const marker = L.marker([beacon.latitude, beacon.longitude], { icon: icon }).addTo(adminMap);
    
    marker.on('click', () => {
      selectDistressMission(beacon.id);
    });

    marker.bindPopup(`
      <div style="font-family:'Outfit',sans-serif; color:#0f172a; padding:4px;">
        <strong style="color:${isResolved ? '#10b981' : '#ff3b30'};">${beacon.sector || 'Distress Beacon'}</strong><br>
        <span style="font-size:0.8rem; font-weight:600;">Threat: ${beacon.threatType}</span><br>
        <span style="font-size:0.75rem; color:#64748b;">Coords: [${Number(beacon.latitude).toFixed(4)}, ${Number(beacon.longitude).toFixed(4)}]</span><br>
        <button onclick="selectDistressMission('${beacon.id}')" style="margin-top:6px; background:#0f172a; color:#f5d77f; border:none; padding:4px 10px; border-radius:4px; font-size:0.75rem; cursor:pointer;">Inspect Telemetry</button>
      </div>
    `);

    mapMarkers[beacon.id] = marker;
  });
}

function renderBeaconList(beacons) {
  const container = document.getElementById('beaconListContainer');
  if (!container) return;

  const filtered = beacons.filter(b => {
    if (currentFilter === 'active') return b.status !== 'RESOLVED';
    if (currentFilter === 'resolved') return b.status === 'RESOLVED';
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-dim); font-size:0.85rem;">No distress beacons matching category.</div>`;
    return;
  }

  container.innerHTML = '';
  filtered.forEach(b => {
    const isResolved = b.status === 'RESOLVED';
    const isCritical = b.urgency === 'CRITICAL';
    const card = document.createElement('div');

    card.className = `beacon-item-card ${isResolved ? 'beacon-resolved' : (isCritical ? 'beacon-critical' : 'beacon-high')} ${selectedBeacon && selectedBeacon.id === b.id ? 'selected' : ''}`;
    card.id = `beacon-card-${b.id}`;
    card.onclick = () => selectDistressMission(b.id);

    const timeAgo = formatTimeAgo(b.timestamp);

    card.innerHTML = `
      <div class="beacon-card-header">
        <div class="beacon-card-sector">${b.sector || 'Unknown Sector'}</div>
        <span style="font-size:0.65rem; font-family:'JetBrains Mono'; color:${isResolved ? '#6ee7b7' : (isCritical ? '#ff8580' : '#fcd34d')}; font-weight:700;">
          ${b.status || 'ACTIVE'}
        </span>
      </div>
      <div class="beacon-card-threat">${b.threatType || 'Immediate Peril'}</div>
      <div class="beacon-card-footer">
        <span>Caller: ${b.citizenName || 'Citizen'}</span>
        <span>${timeAgo}</span>
      </div>
    `;

    container.appendChild(card);
  });
}

// 6. Select Mission & Draw Flight Path Vector
function selectDistressMission(beaconId) {
  const beacon = currentDistressList.find(b => b.id === beaconId);
  if (!beacon) return;

  selectedBeacon = beacon;
  window.SoundFX.playBlip();

  // Update selection UI in side list
  document.querySelectorAll('.beacon-item-card').forEach(el => el.classList.remove('selected'));
  const card = document.getElementById(`beacon-card-${beaconId}`);
  if (card) card.classList.add('selected');

  // Update Dossier Box
  const sectorEl = document.getElementById('dossierSectorName');
  const badgeEl = document.getElementById('dossierUrgencyBadge');
  const metaGrid = document.getElementById('dossierMetaGrid');
  const notesBox = document.getElementById('dossierNotesBox');
  const actionsGrid = document.getElementById('dossierActionsGrid');

  if (sectorEl) sectorEl.innerText = beacon.sector;
  if (badgeEl) {
    badgeEl.style.display = 'inline-block';
    badgeEl.innerText = beacon.urgency || 'CRITICAL';
    badgeEl.style.background = beacon.status === 'RESOLVED' ? 'var(--success)' : 'var(--crimson)';
  }

  document.getElementById('dossierCoords').innerText = `[${Number(beacon.latitude).toFixed(4)}, ${Number(beacon.longitude).toFixed(4)}]`;
  document.getElementById('dossierThreatType').innerText = beacon.threatType;
  document.getElementById('dossierCaller').innerText = beacon.citizenName || 'Citizen';
  document.getElementById('dossierStatus').innerText = beacon.status || 'ACTIVE';

  if (notesBox) {
    notesBox.style.display = 'block';
    document.getElementById('dossierNotesText').innerText = beacon.notes || 'Direct emergency distress pulse initiated.';
  }

  if (metaGrid) metaGrid.style.display = 'grid';
  if (actionsGrid) actionsGrid.style.display = 'grid';

  // Fly map to beacon
  if (adminMap) {
    adminMap.flyTo([beacon.latitude, beacon.longitude], 15, { duration: 1.2 });

    // Draw radiant flight trajectory line from Leon to Beacon
    if (flightVectorLine) {
      adminMap.removeLayer(flightVectorLine);
    }

    flightVectorLine = L.polyline([LEON_ORBITAL_POSITION, [beacon.latitude, beacon.longitude]], {
      color: '#f5d77f',
      weight: 3,
      opacity: 0.8,
      dashArray: '8, 8',
      lineCap: 'round'
    }).addTo(adminMap);
  }
}

// 7. Dispatch Rescue Actions
async function dispatchActionToCurrentBeacon(actionType) {
  if (!selectedBeacon) return;
  const token = sessionStorage.getItem('leon_admin_token');

  window.SoundFX.playAngelicChime();
  showToast('⚡ RESCUE DISPATCHED', `Archangel Leon en route to ${selectedBeacon.sector} via ${actionType.replace(/_/g, ' ')}!`, 'gold');

  try {
    const res = await fetch(`/api/admin/distress/${selectedBeacon.id}/dispatch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action: actionType })
    });

    if (res.ok) {
      const data = await res.json();
      selectedBeacon.status = 'EN_ROUTE';
      document.getElementById('dossierStatus').innerText = 'EN_ROUTE (1.8s ETA)';
      fetchDistressBeacons();
    }
  } catch (err) {
    console.error('Dispatch error:', err);
  }
}

async function resolveCurrentBeacon() {
  if (!selectedBeacon) return;
  const token = sessionStorage.getItem('leon_admin_token');

  window.SoundFX.playAngelicChime();
  showToast('✅ CRISIS RESOLVED', `${selectedBeacon.sector} marked secure and rescued.`, 'gold');

  try {
    const res = await fetch(`/api/admin/distress/${selectedBeacon.id}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ notes: 'Resolved by Archangel Leon on-site intervention.' })
    });

    if (res.ok) {
      selectedBeacon.status = 'RESOLVED';
      document.getElementById('dossierStatus').innerText = 'RESOLVED';
      fetchDistressBeacons();
    }
  } catch (err) {
    console.error('Resolve error:', err);
  }
}

function filterBeacons(filter) {
  currentFilter = filter;
  document.querySelectorAll('.panel-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.filter === filter);
  });
  renderBeaconList(currentDistressList);
}

function recenterMapToAllBeacons() {
  if (!adminMap) return;
  adminMap.setView([40.7282, -73.9942], 13);
}

function formatTimeAgo(isoString) {
  if (!isoString) return 'Recent';
  const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
}

// Global SSE Hook for Admin Console
window.handleIncomingDistress = function(beacon) {
  window.SoundFX.playEmergencyPing();
  showToast('🚨 INCOMING DISTRESS SIGNAL', `New SOS at ${beacon.sector}! Coordinates plotted on tactical radar.`, 'red');
  fetchDistressBeacons();
};

// Initialize Command Deck
function initAdminCommandDeck() {
  initAdminMap();
  fetchDistressBeacons();
}

document.addEventListener('DOMContentLoaded', async () => {
  const isAuth = await verifyAdminAuth();
  if (isAuth) {
    initAdminCommandDeck();
  }
});
