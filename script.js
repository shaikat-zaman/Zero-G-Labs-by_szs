(() => {
  'use strict';

  const page = document.body.dataset.page;
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode') === 'easy' ? 'easy' : 'normal';

  const RADAR_CENTER = 150;
  const RADAR_RANGE = 95;

  function go(file) { window.location.href = file; }

  /* ---------------------------------------------------------
     01 — Idle
  --------------------------------------------------------- */
  if (page === 'idle') {
    // UPDATED: Now goes to Register page instead of Welcome
    document.getElementById('btn-start').addEventListener('click', () => go('01b-register.html'));
  }

  /* ---------------------------------------------------------
     01b — Register (NEW PAGE LOGIC)
  --------------------------------------------------------- */
  if (page === 'register') {
    document.getElementById('btn-register').addEventListener('click', () => {
      const nameVal = document.getElementById('input-name').value.trim();
      const phoneVal = document.getElementById('input-phone').value.trim();
      
      // Save data locally in browser
      localStorage.setItem('explorerName', nameVal || 'UNKNOWN EXPLORER');
      localStorage.setItem('explorerPhone', phoneVal || 'N/A');
      
      go('02-welcome.html');
    });
  }

  /* ---------------------------------------------------------
     02 — Welcome (mode select)
  --------------------------------------------------------- */
  if (page === 'welcome') {
    document.getElementById('btn-mode-normal').addEventListener('click', () => go('03-safety.html?mode=normal'));
    
    // UPDATED: Easy mode goes DIRECTLY to 07-easy.html
    document.getElementById('btn-mode-easy').addEventListener('click', () => go('07-easy.html?mode=easy'));
  }

  /* ---------------------------------------------------------
     03 — Safety
  --------------------------------------------------------- */
  if (page === 'safety') {
    const confirmFit = document.getElementById('confirm-fit');
    const btnAgree = document.getElementById('btn-agree');

    confirmFit.addEventListener('change', () => {
      btnAgree.disabled = !confirmFit.checked;
    });
    btnAgree.addEventListener('click', () => {
      if (!btnAgree.disabled) go('04-calibration.html?mode=' + mode);
    });
    document.getElementById('estop-demo').addEventListener('click', (e) => {
      e.currentTarget.style.transform = 'scale(0.9)';
      setTimeout(() => { e.currentTarget.style.transform = 'scale(1)'; }, 150);
    });
  }

  /* ---------------------------------------------------------
     04 — Calibration (auto-advance)
  --------------------------------------------------------- */
  if (page === 'calibration') {
    setTimeout(() => go('05-countdown.html?mode=' + mode), 2800);
  }

  /* ---------------------------------------------------------
     05 — Countdown
  --------------------------------------------------------- */
  if (page === 'countdown') {
    const numEl = document.getElementById('countdown-num');
    let n = 3;

    const tick = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(tick);
        go(mode === 'normal' ? '06-active.html' : '07-easy.html');
        return;
      }
      numEl.textContent = n;
      numEl.style.animation = 'none';
      void numEl.offsetWidth;
      numEl.style.animation = '';
    }, 900);
  }

  /* ---------------------------------------------------------
     06 — Active test (normal mode, simulated telemetry)
  --------------------------------------------------------- */
  if (page === 'active') {
    const dot = document.getElementById('cog-dot-active');
    const pitchEl = document.getElementById('pitch-active');
    const rollEl = document.getElementById('roll-active');
    const balEl = document.getElementById('balance-active');
    const samples = [];

    let elapsed = 0;
    const duration = 8000;

    function finish() {
      const avg = Math.round(samples.reduce((a, b) => a + b, 0) / (samples.length || 1));
      goToResult(avg);
    }

    const interval = setInterval(() => {
      elapsed += 500;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * RADAR_RANGE * 0.55;
      const x = RADAR_CENTER + Math.cos(angle) * dist;
      const y = RADAR_CENTER + Math.sin(angle) * dist;
      dot.setAttribute('cx', x.toFixed(1));
      dot.setAttribute('cy', y.toFixed(1));

      const pitch = ((y - RADAR_CENTER) / RADAR_RANGE * 30).toFixed(1);
      const roll = ((x - RADAR_CENTER) / RADAR_RANGE * 30).toFixed(1);
      pitchEl.textContent = (pitch >= 0 ? '+' : '') + pitch + '\u00B0';
      rollEl.textContent = (roll >= 0 ? '+' : '') + roll + '\u00B0';

      const balance = Math.max(40, 100 - Math.round(dist / RADAR_RANGE * 60));
      samples.push(balance);
      balEl.textContent = '_' + balance + '%';

      if (elapsed >= duration) {
        clearInterval(interval);
        finish();
      }
    }, 500);

    document.querySelector('[data-estop]').addEventListener('click', () => {
      clearInterval(interval);
      finish();
    });
  }

  /* ---------------------------------------------------------
     07 — Easy mode (draggable dot, visual-only)
  --------------------------------------------------------- */
  if (page === 'easy') {
    const svg = document.querySelector('#easy-radar .radar-svg');
    const dot = document.getElementById('cog-dot-easy');
    const pitchEl = document.getElementById('pitch-easy');
    const rollEl = document.getElementById('roll-easy');
    const balEl = document.getElementById('balance-easy');
    const samples = [];
    let dragging = false;

    function svgPoint(evt) {
      const rect = svg.getBoundingClientRect();
      const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
      const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
      return {
        x: (clientX - rect.left) * (300 / rect.width),
        y: (clientY - rect.top) * (300 / rect.height),
      };
    }

    function updateDot(x, y) {
      const dx = x - RADAR_CENTER;
      const dy = y - RADAR_CENTER;
      const dist = Math.min(Math.hypot(dx, dy), RADAR_RANGE);
      const angle = Math.atan2(dy, dx);
      const cx = RADAR_CENTER + Math.cos(angle) * dist;
      const cy = RADAR_CENTER + Math.sin(angle) * dist;
      dot.setAttribute('cx', cx.toFixed(1));
      dot.setAttribute('cy', cy.toFixed(1));

      const pitch = ((cy - RADAR_CENTER) / RADAR_RANGE * 30).toFixed(1);
      const roll = ((cx - RADAR_CENTER) / RADAR_RANGE * 30).toFixed(1);
      pitchEl.textContent = (pitch >= 0 ? '+' : '') + pitch + '\u00B0';
      rollEl.textContent = (roll >= 0 ? '+' : '') + roll + '\u00B0';

      const balance = Math.max(35, 100 - Math.round(dist / RADAR_RANGE * 65));
      samples.push(balance);
      balEl.textContent = '_' + balance + '%';
    }

    function start(evt) { dragging = true; const p = svgPoint(evt); updateDot(p.x, p.y); }
    function move(evt) { if (dragging) { evt.preventDefault(); const p = svgPoint(evt); updateDot(p.x, p.y); } }
    function end() { dragging = false; }

    dot.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    dot.addEventListener('touchstart', start, { passive: true });
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);

    let t = 0;
    const drift = setInterval(() => {
      if (dragging) return;
      t += 0.15;
      updateDot(RADAR_CENTER + Math.sin(t) * 18, RADAR_CENTER + Math.cos(t * 0.7) * 14);
    }, 400);

    function finish() {
      clearInterval(drift);
      const avg = Math.round(samples.reduce((a, b) => a + b, 0) / (samples.length || 1));
      goToResult(avg);
    }

    setTimeout(finish, 10000);
    document.querySelector('[data-estop]').addEventListener('click', finish);
  }

  /* Shared helper: build result URL with computed stats */
  function goToResult(avg) {
    const avgPitch = (Math.random() * 2 + 0.3).toFixed(1);
    const avgRoll = (Math.random() * 1.5 + 0.2).toFixed(1);
    const warn = avg < 60 ? '2 MINOR' : 'NONE';
    const q = new URLSearchParams({ score: avg, pitch: avgPitch, roll: avgRoll, warn }).toString();
    go('08-result.html?' + q);
  }

  /* ---------------------------------------------------------
     08 — Result
  --------------------------------------------------------- */
  if (page === 'result') {
    // NEW: Retrieve Name from Local Storage
    const savedName = localStorage.getItem('explorerName') || 'SUBJECT 0000';
    const nameDisplay = document.getElementById('explorer-name-display');
    if (nameDisplay) {
      nameDisplay.textContent = savedName.toUpperCase();
    }

    const score = parseInt(params.get('score'), 10) || 84;
    const pitch = params.get('pitch') || '1.2';
    const roll = params.get('roll') || '0.8';
    const warn = params.get('warn') || 'NONE';
    const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : 'D';

    document.getElementById('score-num').textContent = score + '%';
    document.getElementById('score-grade').textContent = 'GRADE: ' + grade;
    document.getElementById('stat-pitch').textContent = pitch + '\u00B0';
    document.getElementById('stat-roll').textContent = roll + '\u00B0';
    document.getElementById('stat-warn').textContent = warn;

    const circumference = 364.4;
    const fill = document.getElementById('score-fill');
    fill.style.strokeDashoffset = circumference;
    requestAnimationFrame(() => {
      fill.style.strokeDashoffset = String(circumference - (circumference * score) / 100);
    });

    drawQrPattern(document.getElementById('qr-canvas'), 'ZEROG-' + score + '-' + Date.now());

    document.getElementById('btn-exit').addEventListener('click', () => go('09-exit.html'));
  }

  function drawQrPattern(canvas, seed) {
    const ctx = canvas.getContext('2d');
    const cells = 18;
    const size = canvas.width / cells;
    let s = 0;
    for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
    function rand() { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';

    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        const inFinder = (x < 5 && y < 5) || (x > cells - 6 && y < 5) || (x < 5 && y > cells - 6);
        if (inFinder) continue;
        if (rand() > 0.55) ctx.fillRect(x * size, y * size, size, size);
      }
    }
    [[0, 0], [cells - 5, 0], [0, cells - 5]].forEach(([fx, fy]) => {
      ctx.fillStyle = '#000';
      ctx.fillRect(fx * size, fy * size, 5 * size, 5 * size);
      ctx.fillStyle = '#fff';
      ctx.fillRect((fx + 1) * size, (fy + 1) * size, 3 * size, 3 * size);
      ctx.fillStyle = '#000';
      ctx.fillRect((fx + 2) * size, (fy + 2) * size, 1 * size, 1 * size);
    });
  }

  /* ---------------------------------------------------------
     09 — Exit (progress bar, then reset to idle)
  --------------------------------------------------------- */
  if (page === 'exit') {
    const fillEl = document.getElementById('exit-progress');
    let pct = 0;
    const interval = setInterval(() => {
      pct += 2;
      fillEl.style.width = Math.min(pct, 100) + '%';
      if (pct >= 100) {
        clearInterval(interval);
        
        // Clear data so the next person starts fresh
        localStorage.removeItem('explorerName');
        localStorage.removeItem('explorerPhone');
        
        // FIXED BUG: Now properly redirects to the idle page
        setTimeout(() => go('01-idle.html'), 500);
      }
    }, 60);
  }
})();