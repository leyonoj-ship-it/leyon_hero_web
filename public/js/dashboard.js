/**
 * =========================================================================
 *  FUTURISTIC SCI-FI EMERGENCY DASHBOARD: ANTI-GRAVITY 3D ENGINE
 *  Upward Neon Particle Canvas, Mouse Parallax Orbit, Real-Time SOS Uplink
 * =========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Anti-Gravity Upward Particle Canvas
  initAntiGravityCanvas();

  // 2. Initialize 3D Mouse Parallax & View Modes
  init3DParallax();

  // 3. Initialize Interactive SOS Broadcast & Threat Selection
  initSosBroadcaster();

  // 4. Initialize Encrypted Comm Link with Leon
  initEncryptedComm();

  // 5. Initialize UE5 8K Render Dossier Modal
  initUe5Dossier();

  // 6. Connect Real-time SSE Stream
  initSseListener();
});

/* =========================================================================
   1. UPWARD ANTI-GRAVITY NEON PARTICLE SIMULATION
   Particles drift UPWARDS against gravity with vibrant neon glow
   ========================================================================= */
function initAntiGravityCanvas() {
  const canvas = document.getElementById('antiGravityCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particleColors = [
    '#00f0ff', // Neon Cyan
    '#38bdf8', // Light Blue
    '#ff007f', // Electric Magenta
    '#f5d77f', // Angelic Gold
    '#ffffff'  // Pure Starlight
  ];

  const particles = [];
  const PARTICLE_COUNT = Math.min(130, Math.floor(window.innerWidth / 12));

  class UpwardParticle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      // Start near bottom or scattered initially
      this.y = initial ? Math.random() * height : height + Math.random() * 40;
      this.radius = Math.random() * 2.2 + 0.8;
      // Anti-gravity velocity: ALWAYS UPWARD (-vy)
      this.vy = -(Math.random() * 1.6 + 0.5);
      this.vx = (Math.random() - 0.5) * 0.6;
      this.color = particleColors[Math.floor(Math.random() * particleColors.length)];
      this.alpha = Math.random() * 0.7 + 0.3;
      this.pulseSpeed = Math.random() * 0.03 + 0.01;
      this.pulseDir = 1;
      this.trailLength = Math.random() * 12 + 6;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Subtle horizontal sway
      this.vx += (Math.random() - 0.5) * 0.04;
      this.vx = Math.max(-1.2, Math.min(1.2, this.vx));

      // Twinkle alpha
      this.alpha += this.pulseSpeed * this.pulseDir;
      if (this.alpha > 0.9) this.pulseDir = -1;
      if (this.alpha < 0.2) this.pulseDir = 1;

      // Reset when floating past the top
      if (this.y < -20) {
        this.reset(false);
      }
      if (this.x < 0) this.x = width;
      if (this.x > width) this.x = 0;
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.shadowBlur = 14;
      ctx.shadowColor = this.color;

      // Draw subtle upward light streak
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.radius * 0.8;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.vx * 3, this.y - this.vy * (this.trailLength / 2));
      ctx.stroke();

      // Glowing particle head
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new UpwardParticle());
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }

    requestAnimationFrame(render);
  }

  render();
}

/* =========================================================================
   2. 3D MOUSE PARALLAX & VIEW MODE CONTROLS
   ========================================================================= */
function init3DParallax() {
  const stage = document.getElementById('orbitalStage');
  const stageWrapper = document.querySelector('.orbital-stage-wrapper');
  if (!stage || !stageWrapper) return;

  let currentMode = 'isometric'; // 'isometric' | 'free' | 'flat'
  let targetRotX = 34;
  let targetRotZ = -12;
  let targetRotY = 0;

  let currentRotX = 34;
  let currentRotZ = -12;
  let currentRotY = 0;

  // View Mode buttons
  const modeButtons = document.querySelectorAll('.view-mode-btn');
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.getAttribute('data-mode');

      if (window.SoundFX) window.SoundFX.playBlip();

      stage.classList.remove('mode-isometric', 'mode-free', 'mode-flat');
      stage.classList.add(`mode-${currentMode}`);

      if (currentMode === 'isometric') {
        targetRotX = 34;
        targetRotZ = -12;
        targetRotY = 0;
      } else if (currentMode === 'free') {
        targetRotX = 20;
        targetRotZ = 0;
        targetRotY = 0;
      } else if (currentMode === 'flat') {
        targetRotX = 0;
        targetRotZ = 0;
        targetRotY = 0;
      }
    });
  });

  // Dynamic parallax mouse tracking
  window.addEventListener('mousemove', (e) => {
    if (window.innerWidth <= 1100 || currentMode === 'flat') return;

    const normX = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to +1
    const normY = (e.clientY / window.innerHeight - 0.5) * 2;

    if (currentMode === 'isometric') {
      targetRotX = 34 - normY * 10;
      targetRotZ = -12 + normX * 8;
      targetRotY = normX * 6;
    } else if (currentMode === 'free') {
      targetRotX = 20 - normY * 16;
      targetRotY = normX * 18;
      targetRotZ = 0;
    }
  });

  // Smooth lerp loop
  function updateOrientation() {
    if (currentMode !== 'flat' && window.innerWidth > 1100) {
      currentRotX += (targetRotX - currentRotX) * 0.08;
      currentRotY += (targetRotY - currentRotY) * 0.08;
      currentRotZ += (targetRotZ - currentRotZ) * 0.08;

      if (currentMode === 'isometric') {
        stage.style.transform = `rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg) rotateZ(${currentRotZ.toFixed(2)}deg) scale(0.95)`;
      } else if (currentMode === 'free') {
        stage.style.transform = `rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg) scale(0.98)`;
      }
    }
    requestAnimationFrame(updateOrientation);
  }
  updateOrientation();
}

/* =========================================================================
   3. SOS DISTRESS BROADCASTER (Direct Quantum Uplink to Leon)
   ========================================================================= */
function initSosBroadcaster() {
  const threatButtons = document.querySelectorAll('.btn-threat-chip');
  let selectedThreat = 'Immediate Life Threat';

  threatButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      threatButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedThreat = btn.getAttribute('data-threat');
      if (window.SoundFX) window.SoundFX.playBlip();
    });
  });

  const broadcastBtn = document.getElementById('btnBroadcastSos3D');
  const sosStatusVal = document.getElementById('sosStatusVal');
  const telemetryLat = document.getElementById('dashLat');
  const telemetryLon = document.getElementById('dashLon');

  // Default coordinate acquisition
  let currentLat = 40.7128;
  let currentLon = -74.0060;

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        currentLat = pos.coords.latitude;
        currentLon = pos.coords.longitude;
        if (telemetryLat) telemetryLat.textContent = currentLat.toFixed(4) + '° N';
        if (telemetryLon) telemetryLon.textContent = currentLon.toFixed(4) + '° W';
      },
      err => {
        if (telemetryLat) telemetryLat.textContent = '40.7128° N';
        if (telemetryLon) telemetryLon.textContent = '74.0060° W';
      },
      { timeout: 5000 }
    );
  }

  if (broadcastBtn) {
    broadcastBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (window.SoundFX) window.SoundFX.playEmergencyPing();

      broadcastBtn.disabled = true;
      broadcastBtn.innerHTML = '<span>⚡</span> TRANSMITTING BEACON...';
      if (sosStatusVal) {
        sosStatusVal.textContent = 'BROADCASTING PULSE';
        sosStatusVal.style.color = '#ff3344';
      }

      try {
        const response = await fetch('/api/emergency/distress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: currentLat,
            longitude: currentLon,
            threatType: selectedThreat,
            urgency: 'CRITICAL_ALPHA',
            citizenName: 'Orbital Anti-Gravity Console',
            notes: `Transmitted via Anti-Gravity 3D Holographic Dashboard. Threat: ${selectedThreat}`
          })
        });

        const result = await response.json();
        if (result.success) {
          if (window.SoundFX) window.SoundFX.playAngelicChime();
          broadcastBtn.innerHTML = '<span>🛡️</span> BEACON ENGAGED · ETA 3.2s';
          broadcastBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
          broadcastBtn.style.borderColor = '#6ee7b7';

          if (sosStatusVal) {
            sosStatusVal.textContent = 'LEON EN ROUTE';
            sosStatusVal.style.color = '#10b981';
          }

          if (window.showToast) {
            window.showToast('SOS Beacon Locked', `Leon has acknowledged coordinates [${currentLat.toFixed(2)}, ${currentLon.toFixed(2)}]. Light-speed intercept initiated.`, 'gold');
          }
        }
      } catch (err) {
        console.error('Error broadcasting distress signal:', err);
        broadcastBtn.disabled = false;
        broadcastBtn.innerHTML = '<span>🚨</span> RETRY SOS TRANSMISSION';
      }
    });
  }
}

/* =========================================================================
   4. ENCRYPTED LEON UPLINK
   ========================================================================= */
function initEncryptedComm() {
  const commInput = document.getElementById('commInput');
  const commSendBtn = document.getElementById('commSendBtn');
  const transcriptBox = document.getElementById('commTranscriptBox');

  async function sendMessage() {
    if (!commInput || !commInput.value.trim()) return;
    const text = commInput.value.trim();
    commInput.value = '';

    if (window.SoundFX) window.SoundFX.playBlip();

    // Append citizen message locally
    appendCommMessage('Citizen', text, false);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'Citizen',
          content: text,
          role: 'citizen'
        })
      });
      const data = await res.json();
    } catch (e) {
      console.error('Comm send error:', e);
    }
  }

  function appendCommMessage(sender, text, isLeon) {
    if (!transcriptBox) return;
    const msgEl = document.createElement('div');
    msgEl.style.marginBottom = '6px';
    msgEl.style.fontSize = '0.74rem';

    if (isLeon) {
      msgEl.innerHTML = `<span style="color:#f5d77f; font-weight:700;">[LEON 🛡️]:</span> <span style="color:#ffffff;">${escapeHtml(text)}</span>`;
      if (window.SoundFX) window.SoundFX.playAngelicChime();
    } else {
      msgEl.innerHTML = `<span style="color:#38bdf8;">[YOU]:</span> <span style="color:#c7d2fe;">${escapeHtml(text)}</span>`;
    }

    transcriptBox.appendChild(msgEl);
    transcriptBox.scrollTop = transcriptBox.scrollHeight;
  }

  if (commSendBtn) commSendBtn.addEventListener('click', sendMessage);
  if (commInput) {
    commInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  // Initial greeting
  setTimeout(() => {
    appendCommMessage('Leon', 'Quantum link verified. I am tracking your anti-gravity orbital beacon.', true);
  }, 1200);
}

/* =========================================================================
   5. UNREAL ENGINE 5 8K RENDER DOSSIER MODAL
   ========================================================================= */
function initUe5Dossier() {
  const openBtn = document.getElementById('btnOpenUe5Dossier');
  const modalOverlay = document.getElementById('dossierModalOverlay');
  const closeBtn = document.getElementById('btnCloseDossier');

  if (openBtn && modalOverlay) {
    openBtn.addEventListener('click', () => {
      if (window.SoundFX) window.SoundFX.playBlip();
      modalOverlay.classList.add('active');
    });
  }

  if (closeBtn && modalOverlay) {
    closeBtn.addEventListener('click', () => {
      if (window.SoundFX) window.SoundFX.playBlip();
      modalOverlay.classList.remove('active');
    });
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.remove('active');
      }
    });
  }
}

/* =========================================================================
   6. SSE EVENT STREAM LISTENER
   ========================================================================= */
function initSseListener() {
  if (typeof EventSource === 'undefined') return;

  try {
    const sse = new EventSource('/api/stream');

    sse.addEventListener('chat_message', (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.isLeon) {
          const transcriptBox = document.getElementById('commTranscriptBox');
          if (transcriptBox) {
            const el = document.createElement('div');
            el.style.marginBottom = '6px';
            el.innerHTML = `<span style="color:#f5d77f; font-weight:700;">[LEON 🛡️]:</span> <span style="color:#ffffff;">${escapeHtml(msg.content)}</span>`;
            transcriptBox.appendChild(el);
            transcriptBox.scrollTop = transcriptBox.scrollHeight;
            if (window.SoundFX) window.SoundFX.playAngelicChime();
          }
        }
      } catch (err) {}
    });

    sse.addEventListener('distress_signal', (e) => {
      try {
        const beacon = JSON.parse(e.data);
        const sosStatusVal = document.getElementById('sosStatusVal');
        if (sosStatusVal) {
          sosStatusVal.textContent = 'ACTIVE TRACKING';
          sosStatusVal.style.color = '#ff3344';
        }
      } catch (err) {}
    });
  } catch (err) {
    console.warn('SSE connection skipped in dashboard:', err);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
