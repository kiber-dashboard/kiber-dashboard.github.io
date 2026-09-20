(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Staggered entrance animation.
     Once finished, the class is dropped so hover transforms are not locked by the animation fill. */
  const revealEls = document.querySelectorAll('.reveal');
  revealEls.forEach((el, i) => {
    el.style.animationDelay = `${i * 80}ms`;
    el.addEventListener('animationend', function done(e) {
      if (e.target !== el || !/^(reveal-in|panel-in)$/.test(e.animationName)) return;
      el.classList.remove('reveal');
      el.style.animationDelay = '';
      el.removeEventListener('animationend', done);
    });
  });

  /* Footer year */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Toast */
  const toast = document.getElementById('toast');
  const toastText = toast && toast.querySelector('.toast-text');
  let toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toastText.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 2200);
  }

  /* Copy-to-clipboard for the Telegram contact */
  const copyBtn = document.getElementById('copyBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const link = copyBtn.dataset.copy || '';
      try {
        await navigator.clipboard.writeText(link);
      } catch (err) {
        const textarea = document.createElement('textarea');
        textarea.value = link;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      copyBtn.classList.add('copied');
      showToast('Посилання скопійовано');
      setTimeout(() => copyBtn.classList.remove('copied'), 1800);
    });
  }

  /* Ripple on the primary button */
  const tgLink = document.querySelector('.tg-link');
  if (tgLink && !prefersReducedMotion) {
    tgLink.addEventListener('pointerdown', (e) => {
      const rect = tgLink.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) / 2;
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      tgLink.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  }

  /* Pointer tracking: panel tilt, spotlight, cursor glow */
  const panel = document.getElementById('panel');
  const cursorGlow = document.getElementById('cursorGlow');
  const pointer = { x: -9999, y: -9999, active: false };

  if (canHover && !prefersReducedMotion) {
    let glowX = window.innerWidth / 2;
    let glowY = window.innerHeight / 2;
    let rafPending = false;

    function updatePointerFx() {
      rafPending = false;
      glowX += (pointer.x - glowX) * 0.18;
      glowY += (pointer.y - glowY) * 0.18;
      if (cursorGlow) cursorGlow.style.transform = `translate(${glowX}px, ${glowY}px)`;

      if (panel) {
        const rect = panel.getBoundingClientRect();
        const px = (pointer.x - rect.left) / rect.width;
        const py = (pointer.y - rect.top) / rect.height;
        panel.style.setProperty('--mx', `${px * 100}%`);
        panel.style.setProperty('--my', `${py * 100}%`);

        const inside = px >= 0 && px <= 1 && py >= 0 && py <= 1;
        if (inside) {
          const rx = (0.5 - py) * 6;
          const ry = (px - 0.5) * 8;
          panel.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
        } else {
          panel.style.transform = '';
        }
      }

      if (Math.abs(pointer.x - glowX) > 0.5 || Math.abs(pointer.y - glowY) > 0.5) schedule();
    }

    function schedule() {
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(updatePointerFx);
      }
    }

    window.addEventListener('pointermove', (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      if (cursorGlow) cursorGlow.classList.add('active');
      schedule();
    }, { passive: true });

    document.addEventListener('pointerleave', () => {
      pointer.active = false;
      if (cursorGlow) cursorGlow.classList.remove('active');
      if (panel) panel.style.transform = '';
    });
  }

  /* Constellation particle background */
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || prefersReducedMotion) return;

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0;
  let height = 0;
  let particles = [];
  let running = true;

  const LINK_DIST = 130;
  const MOUSE_DIST = 180;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createParticles() {
    const count = Math.round(Math.min(80, Math.max(28, (width * height) / 22000)));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.5 + 0.2,
      phase: Math.random() * Math.PI * 2,
    }));
  }

  function tick(t) {
    if (!running) return;
    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
      if (pointer.active) {
        const dx = pointer.x - p.x;
        const dy = pointer.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < MOUSE_DIST && dist > 0) {
          const force = (1 - dist / MOUSE_DIST) * 0.02;
          p.x += dx * force * 0.3;
          p.y += dy * force * 0.3;
        }
      }
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      if (p.y > height + 10) p.y = -10;
    }

    ctx.lineWidth = 0.6;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK_DIST * LINK_DIST) {
          const o = (1 - Math.sqrt(d2) / LINK_DIST) * 0.22;
          ctx.strokeStyle = `rgba(167, 157, 255, ${o})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      if (pointer.active) {
        const dx = a.x - pointer.x;
        const dy = a.y - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < MOUSE_DIST) {
          ctx.strokeStyle = `rgba(111, 178, 255, ${(1 - d / MOUSE_DIST) * 0.35})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
      }
    }

    for (const p of particles) {
      const twinkle = 0.65 + Math.sin(t * 0.0015 + p.phase) * 0.35;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(215, 210, 255, ${p.alpha * twinkle})`;
      ctx.fill();
    }

    requestAnimationFrame(tick);
  }

  resize();
  createParticles();
  requestAnimationFrame(tick);

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      createParticles();
    }, 150);
  });

  document.addEventListener('visibilitychange', () => {
    const wasRunning = running;
    running = !document.hidden;
    if (running && !wasRunning) requestAnimationFrame(tick);
  });
})();
