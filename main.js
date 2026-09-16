(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Staggered entrance animation */
  const revealEls = document.querySelectorAll('.reveal');
  revealEls.forEach((el, i) => {
    el.style.animationDelay = `${i * 90}ms`;
  });

  /* Footer year */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Copy-to-clipboard for the Telegram contact */
  const copyBtn = document.getElementById('copyBtn');
  const toast = document.getElementById('toast');
  let toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 2200);
  }

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
      setTimeout(() => copyBtn.classList.remove('copied'), 1500);
    });
  }

  /* Lightweight floating-particles background */
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || prefersReducedMotion) return;

  const ctx = canvas.getContext('2d');
  let width, height, particles;
  const PARTICLE_COUNT = 46;

  function resize() {
    width = canvas.width = window.innerWidth * window.devicePixelRatio;
    height = canvas.height = window.innerHeight * window.devicePixelRatio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
  }

  function createParticles() {
    particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: (Math.random() * 1.6 + 0.4) * window.devicePixelRatio,
      vx: (Math.random() - 0.5) * 0.15 * window.devicePixelRatio,
      vy: (Math.random() - 0.5) * 0.15 * window.devicePixelRatio,
      alpha: Math.random() * 0.5 + 0.15,
    }));
  }

  function tick() {
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 195, 255, ${p.alpha})`;
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }

  resize();
  createParticles();
  requestAnimationFrame(tick);

  window.addEventListener('resize', () => {
    resize();
    createParticles();
  });
})();
