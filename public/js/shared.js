/**
 * =========================================================================
 *  LEON ARCH-SENTINEL: SHARED FRONTEND ENGINE
 *  Audio Synthesizer, Global SSE Bus, Admin Mode, Ambient Particle Stars
 * =========================================================================
 */

// Sound Synthesizer using Web Audio API (zero audio files needed!)
class TacticalAudio {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('leon_muted') === 'true';
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('leon_muted', this.muted);
    return this.muted;
  }

  // Tactical click / blip
  playBlip() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch (e) {}
  }

  // Emergency Alert Ping
  playEmergencyPing() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(520, now);
      osc1.frequency.exponentialRampToValueAtTime(1040, now + 0.2);
      osc2.frequency.setValueAtTime(260, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch (e) {}
  }

  // Angelic Chime (Leon response / verified action)
  playAngelicChime() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C - E - G - C octave
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = this.ctx.currentTime + idx * 0.08;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.6);
      });
    } catch (e) {}
  }
}

window.SoundFX = new TacticalAudio();

// Toast Notifications
function showToast(title, message, type = 'gold') {
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const borderCol = type === 'red' ? 'var(--crimson)' : (type === 'blue' ? 'var(--blue)' : 'var(--gold)');
  const glowCol = type === 'red' ? 'var(--crimson-glow)' : (type === 'blue' ? 'var(--blue-glow)' : 'var(--gold-glow)');
  
  toast.style.cssText = `
    background: rgba(14, 18, 28, 0.95);
    border: 1.5px solid ${borderCol};
    box-shadow: 0 10px 25px rgba(0,0,0,0.8), 0 0 20px ${glowCol};
    backdrop-filter: blur(16px);
    border-radius: var(--radius-md);
    padding: 14px 18px;
    color: var(--white);
    max-width: 380px;
    font-size: 0.9rem;
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
    animation: fadeInDown 0.3s ease-out;
  `;

  toast.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; font-weight:700; font-size:0.85rem; color:${borderCol};">
      <span>${title}</span>
      <span style="font-family:'JetBrains Mono',monospace; font-size:0.7rem; color:var(--text-dim);">${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
    </div>
    <div style="color:var(--text-main); font-size:0.85rem; line-height:1.4;">${message}</div>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}

// Global SSE Real-Time Event Subscriber
function setupSSE() {
  if (!window.EventSource) return;
  const es = new EventSource('/api/stream');

  es.addEventListener('chat_message', (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (window.handleIncomingChatMessage) {
        window.handleIncomingChatMessage(msg);
      }
      if (msg.isLeon) {
        window.SoundFX.playAngelicChime();
        showToast('🛡️ ARCH-SENTINEL DIRECTIVE', msg.content.substring(0, 90) + '...', 'gold');
      } else {
        window.SoundFX.playEmergencyPing();
      }
    } catch (err) {}
  });

  es.addEventListener('distress_signal', (e) => {
    try {
      const beacon = JSON.parse(e.data);
      if (window.handleIncomingDistress) {
        window.handleIncomingDistress(beacon);
      }
      window.SoundFX.playEmergencyPing();
      showToast('🚨 DISTRESS SIGNAL ACQUIRED', `Sector: ${beacon.sector || 'Active Vector'}. Threat: ${beacon.threatType}`, 'red');
    } catch (err) {}
  });

  es.addEventListener('new_post', (e) => {
    try {
      const post = JSON.parse(e.data);
      if (window.handleIncomingPost) {
        window.handleIncomingPost(post);
      }
    } catch (err) {}
  });

  es.addEventListener('new_comment', (e) => {
    try {
      const data = JSON.parse(e.data);
      if (window.handleIncomingComment) {
        window.handleIncomingComment(data.postId, data.comment);
      }
    } catch (err) {}
  });

  es.addEventListener('post_liked', (e) => {
    try {
      const data = JSON.parse(e.data);
      if (window.handleIncomingLike) {
        window.handleIncomingLike(data.postId, data.likes);
      }
    } catch (err) {}
  });
}

// Particle Stars Animation on Canvas
function initCelestialStars() {
  const canvas = document.createElement('canvas');
  canvas.id = 'celestialCanvas';
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 0;
    opacity: 0.6;
  `;
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const particles = [];
  const count = Math.min(60, Math.floor((width * height) / 20000));

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.2,
      speedY: -Math.random() * 0.4 - 0.1,
      alpha: Math.random() * 0.7 + 0.2,
      isGold: Math.random() > 0.4
    });
  }

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);

  function render() {
    ctx.clearRect(0, 0, width, height);
    for (let p of particles) {
      p.x += p.speedX;
      p.y += p.speedY;

      if (p.y < 0) {
        p.y = height;
        p.x = Math.random() * width;
      }
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.isGold
        ? `rgba(245, 215, 127, ${p.alpha})`
        : `rgba(255, 255, 255, ${p.alpha * 0.8})`;
      ctx.shadowBlur = p.isGold ? 8 : 4;
      ctx.shadowColor = p.isGold ? '#f5d77f' : '#ffffff';
      ctx.fill();
    }
    requestAnimationFrame(render);
  }
  render();
}

// Secure Admin / Citizen Mode Controller
function initAdminModeToggle() {
  const toggleBtn = document.getElementById('adminModeToggle');
  if (!toggleBtn) return;

  const token = sessionStorage.getItem('leon_admin_token');
  const isAdmin = !!token;
  updateAdminUI(isAdmin);

  toggleBtn.addEventListener('click', () => {
    const currentToken = sessionStorage.getItem('leon_admin_token');
    if (!currentToken) {
      // Prompt secure passcode modal
      openGlobalAdminAuthModal();
    } else {
      // Already authenticated -> Provide option to open Admin Map or Logout
      openAdminActionsModal();
    }
  });
}

function updateAdminUI(isAdmin) {
  const toggleBtn = document.getElementById('adminModeToggle');
  if (!toggleBtn) return;
  if (isAdmin) {
    toggleBtn.classList.add('active');
    toggleBtn.innerHTML = `🛡️ Mode: <strong>Leon (Admin)</strong> · <span>Map ➔</span>`;
    toggleBtn.title = "Authenticated as Arch-Sentinel. Click to open Command Map or Logout.";
  } else {
    toggleBtn.classList.remove('active');
    toggleBtn.innerHTML = `👤 Mode: <strong>Citizen</strong>`;
    toggleBtn.title = "Click to enter Archangel credentials for Admin Mode.";
  }
  if (window.onAdminModeChange) {
    window.onAdminModeChange(isAdmin);
  }
}

// Global Dynamic Admin Auth Modal
function openGlobalAdminAuthModal() {
  let modal = document.getElementById('globalAdminAuthModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'globalAdminAuthModal';
    modal.className = 'admin-auth-overlay';
    modal.innerHTML = `
      <div class="admin-auth-box">
        <div class="auth-crest">
          <img src="/assets/images/leon_portrait.jpg" alt="Leon Archangel Crest">
        </div>
        <div class="hero-pill" style="margin-bottom:0.75rem;">
          <span>🔒</span>
          <span class="mono">ARCHANGEL SECURITY GATE</span>
        </div>
        <h2 class="font-display" style="font-size:1.4rem; color:var(--white); margin-bottom:0.5rem;">
          Admin Authentication Required
        </h2>
        <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.5;">
          Access to official decrees and the global distress radar is restricted to Archangel Leon.
        </p>

        <form id="globalAdminAuthForm" style="margin-top:1rem;" onsubmit="event.preventDefault(); submitGlobalAdminAuth();">
          <input type="password" id="globalAdminPassInput" class="auth-pass-input" placeholder="PASSCODE" autofocus>
          
          <div class="auth-pass-hint" onclick="document.getElementById('globalAdminPassInput').value='AEGIS-777';">
            🔑 Default Key: <strong style="color:var(--gold);">AEGIS-777</strong> (click to insert)
          </div>

          <div style="display:flex; gap:10px;">
            <button type="button" class="btn btn-glass" style="flex:1;" onclick="closeGlobalAdminAuthModal()">Cancel</button>
            <button type="submit" class="btn btn-gold" style="flex:1;">
              <span>Authenticate</span>
              <span>➔</span>
            </button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
  const input = document.getElementById('globalAdminPassInput');
  if (input) {
    input.value = '';
    input.focus();
  }
}

function closeGlobalAdminAuthModal() {
  const modal = document.getElementById('globalAdminAuthModal');
  if (modal) modal.style.display = 'none';
}

async function submitGlobalAdminAuth() {
  const input = document.getElementById('globalAdminPassInput');
  if (!input) return;
  const passcode = input.value.trim();
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
      closeGlobalAdminAuthModal();
      updateAdminUI(true);
      window.SoundFX.playAngelicChime();
      showToast('🛡️ ARCH-SENTINEL AUTHORIZED', 'Secure Admin Mode active. You can now access the Tactical Distress Map.', 'gold');

      // Prompt to visit map
      setTimeout(() => {
        showToast('🗺️ TACTICAL MAP READY', '<a href="/admin.html" style="color:var(--gold); font-weight:700; text-decoration:underline;">Click here to open the live distress beacon map</a>', 'gold');
      }, 800);
    } else {
      input.style.borderColor = 'var(--crimson)';
      window.SoundFX.playEmergencyPing();
      showToast('SECURITY BREACH', data.error || 'Invalid passcode.', 'red');
    }
  } catch (err) {
    console.error('Auth error:', err);
  }
}

function openAdminActionsModal() {
  let modal = document.getElementById('adminActionsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'adminActionsModal';
    modal.className = 'admin-auth-overlay';
    modal.innerHTML = `
      <div class="admin-auth-box" style="max-width:380px;">
        <div class="hero-pill" style="margin-bottom:0.75rem;">
          <span>🛡️</span>
          <span class="mono">ADMIN SESSION ACTIVE</span>
        </div>
        <h3 class="font-display" style="color:var(--gold-light); margin-bottom:1rem;">Leon Arch-Sentinel</h3>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.5rem;">
          Select your tactical destination or terminate the authorized session.
        </p>
        <div style="display:flex; flex-direction:column; gap:10px;">
          <a href="/admin.html" class="btn btn-gold" style="width:100%;">
            <span>🗺️ Open Tactical Distress Map</span>
          </a>
          <button class="btn btn-crimson" style="width:100%;" onclick="logoutGlobalAdminSession()">
            <span>🔒 Logout / Exit Admin Mode</span>
          </button>
          <button class="btn btn-glass" style="width:100%;" onclick="document.getElementById('adminActionsModal').style.display='none';">
            <span>Continue on this page</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
}

async function logoutGlobalAdminSession() {
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
  const modal = document.getElementById('adminActionsModal');
  if (modal) modal.style.display = 'none';
  updateAdminUI(false);
  window.SoundFX.playBlip();
  showToast('SESSION TERMINATED', 'Returned to everyday citizen view.', 'blue');
}

// Global Audio Button Setup
function initAudioButton() {
  const btn = document.getElementById('audioToggleBtn');
  if (!btn) return;
  const updateBtn = () => {
    btn.innerHTML = window.SoundFX.muted ? '🔇' : '🔊';
    btn.title = window.SoundFX.muted ? 'Audio Muted' : 'Audio Active';
  };
  updateBtn();
  btn.addEventListener('click', () => {
    window.SoundFX.toggleMute();
    updateBtn();
    if (!window.SoundFX.muted) {
      window.SoundFX.playBlip();
    }
  });
}

// Global Celestial Navigation Drawer & Hamburger Controller
function initCelestialDrawer() {
  const navActions = document.querySelector('.nav-actions');
  let hamburgerBtn = document.getElementById('globalHamburgerBtn');

  if (navActions && !hamburgerBtn) {
    hamburgerBtn = document.createElement('button');
    hamburgerBtn.id = 'globalHamburgerBtn';
    hamburgerBtn.className = 'hamburger-menu-btn';
    hamburgerBtn.setAttribute('aria-label', 'Open Navigation Drawer');
    hamburgerBtn.title = 'Traverse Sections';
    hamburgerBtn.innerHTML = `
      <span class="hamburger-icon">
        <span></span>
        <span></span>
        <span></span>
      </span>
      <span class="hamburger-label">MENU</span>
    `;
    navActions.appendChild(hamburgerBtn);
  }

  // Ensure Backdrop Overlay exists
  let backdrop = document.getElementById('drawerBackdropOverlay');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'drawerBackdropOverlay';
    backdrop.className = 'drawer-backdrop';
    document.body.appendChild(backdrop);
  }

  // Ensure Drawer exists
  let drawer = document.getElementById('celestialNavDrawer');
  if (!drawer) {
    drawer = document.createElement('aside');
    drawer.id = 'celestialNavDrawer';
    drawer.className = 'celestial-nav-drawer';

    const currentPath = window.location.pathname.toLowerCase();
    const isHome = currentPath === '/' || currentPath.includes('index') || currentPath.includes('home');
    const isDashboard = currentPath.includes('dashboard');
    const isEmergency = currentPath.includes('emergency');
    const isInteraction = currentPath.includes('interaction');
    const isOrigin = currentPath.includes('origin');
    const isAdmin = currentPath.includes('admin');

    drawer.innerHTML = `
      <div class="drawer-header">
        <div class="drawer-brand">
          <div class="brand-crest" style="width:38px; height:38px;">
            <img src="/assets/images/leon_portrait.jpg" alt="Leon Crest">
          </div>
          <div>
            <div class="font-display" style="font-size:1.1rem; color:var(--white); line-height:1.1;">LEON PORTAL</div>
            <div style="font-size:0.65rem; font-family:'JetBrains Mono',monospace; color:var(--gold); letter-spacing:0.15em;">TRAVERSE SECTIONS</div>
          </div>
        </div>
        <button class="drawer-close-btn" id="drawerCloseBtn" title="Close Menu">✕</button>
      </div>

      <div class="drawer-body">
        <!-- 1. Home Hub -->
        <a href="/index.html" class="drawer-menu-item ${isHome ? 'active' : ''}">
          <div class="drawer-menu-left">
            <div class="drawer-menu-icon" style="color:var(--gold);">🏛️</div>
            <div>
              <div class="drawer-menu-title font-display">Home Hub</div>
              <div class="drawer-menu-sub">Central Command & Emergency Choice</div>
            </div>
          </div>
          <span class="drawer-arrow">➔</span>
        </a>

        <!-- 2. 3D Anti-Gravity Dashboard -->
        <a href="/dashboard.html" class="drawer-menu-item ${isDashboard ? 'active' : ''}" style="border-color:rgba(0,240,255,0.35);">
          <div class="drawer-menu-left">
            <div class="drawer-menu-icon" style="color:#00f0ff;">🛰️</div>
            <div>
              <div class="drawer-menu-title font-display" style="color:#00f0ff;">3D Anti-Gravity Dashboard</div>
              <div class="drawer-menu-sub">Weightless floating panels & upward neon particles</div>
            </div>
          </div>
          <span class="drawer-arrow" style="color:#00f0ff;">➔</span>
        </a>

        <!-- 3. Emergency SOS -->
        <a href="/emergency.html" class="drawer-menu-item drawer-item-emergency ${isEmergency ? 'active' : ''}">
          <div class="drawer-menu-left">
            <div class="drawer-menu-icon" style="color:var(--crimson-light);">🚨</div>
            <div>
              <div class="drawer-menu-title font-display" style="color:#ff8580;">Emergency SOS</div>
              <div class="drawer-menu-sub">Live GPS tracking & direct encrypted chat</div>
            </div>
          </div>
          <span class="drawer-arrow" style="color:var(--crimson-light);">➔</span>
        </a>

        <!-- 3. Community Feed -->
        <a href="/interaction.html" class="drawer-menu-item ${isInteraction ? 'active' : ''}">
          <div class="drawer-menu-left">
            <div class="drawer-menu-icon" style="color:var(--blue-light);">💬</div>
            <div>
              <div class="drawer-menu-title font-display">Community Feed</div>
              <div class="drawer-menu-sub">Citizen field reports & verified decrees</div>
            </div>
          </div>
          <span class="drawer-arrow">➔</span>
        </a>

        <!-- 4. Origin Lore -->
        <a href="/origin.html" class="drawer-menu-item ${isOrigin ? 'active' : ''}">
          <div class="drawer-menu-left">
            <div class="drawer-menu-icon" style="color:var(--gold);">📖</div>
            <div>
              <div class="drawer-menu-title font-display">Origin Lore</div>
              <div class="drawer-menu-sub">The Awakening of Leon & 4 Divine Pillars</div>
            </div>
          </div>
          <span class="drawer-arrow">➔</span>
        </a>

        <!-- 5. Admin Command Console -->
        <a href="/admin.html" class="drawer-menu-item ${isAdmin ? 'active' : ''}" style="border-color:rgba(245,215,127,0.35);">
          <div class="drawer-menu-left">
            <div class="drawer-menu-icon" style="color:var(--gold); border-color:var(--gold);">🛡️</div>
            <div>
              <div class="drawer-menu-title font-display" style="color:var(--gold-light);">Admin Command Map</div>
              <div class="drawer-menu-sub">Distress radar & rescue dispatch (Passcode)</div>
            </div>
          </div>
          <span class="drawer-arrow">➔</span>
        </a>
      </div>

      <div class="drawer-footer">
        <div class="status-pill" style="justify-content:center;">
          <div class="status-dot"></div>
          <span>ORBITAL VIGIL: ACTIVE 360°</span>
        </div>
        <div style="font-size:0.75rem; text-align:center; color:var(--text-dim); font-family:'JetBrains Mono',monospace;">
          "To eradicate evil and forge a safer world"
        </div>
      </div>
    `;

    document.body.appendChild(drawer);
  }

  // Toggle open / close logic
  function openDrawer() {
    drawer.classList.add('open');
    backdrop.classList.add('open');
    if (hamburgerBtn) hamburgerBtn.classList.add('active');
    document.body.style.overflow = 'hidden';
    window.SoundFX.playBlip();
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    if (hamburgerBtn) hamburgerBtn.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => {
      if (drawer.classList.contains('open')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });
  }

  const closeBtn = document.getElementById('drawerCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);

  // Close with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });

  // Support mobile toggle if present
  const mobileToggle = document.querySelector('.mobile-nav-toggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', openDrawer);
  }
}

// On DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initCelestialStars();
  initAdminModeToggle();
  initAudioButton();
  initCelestialDrawer();
  setupSSE();

  // Add click sound to all action buttons
  document.querySelectorAll('.btn, .action-card, .btn-preset').forEach(el => {
    el.addEventListener('click', () => {
      window.SoundFX.playBlip();
    });
  });
});
