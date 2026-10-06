(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Рік у футері ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Частинки з лініями-зв'язками ---------- */
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  let w, h, dpr, particles = [];
  const mouse = { x: -9999, y: -9999 };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.round(Math.min(90, (w * h) / 16000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.6,
      hue: Math.random() < 0.5 ? 190 : 255
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const maxDist = 130;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Легке відштовхування від курсора
      const dxm = p.x - mouse.x;
      const dym = p.y - mouse.y;
      const dm = Math.hypot(dxm, dym);
      if (dm < 120 && dm > 0) {
        p.x += (dxm / dm) * 1.2;
        p.y += (dym / dm) * 1.2;
      }

      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 90%, 75%, 0.8)`;
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dist = Math.hypot(p.x - q.x, p.y - q.y);
        if (dist < maxDist) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(160, 170, 255, ${0.14 * (1 - dist / maxDist)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    if (!reduceMotion) requestAnimationFrame(draw);
  }

  resize();
  draw();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  /* ---------- 3D-нахил картки та відблиск ---------- */
  const card = document.getElementById('card');
  const canHover = window.matchMedia('(hover: hover)').matches;

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('mouseleave', () => {
    mouse.x = mouse.y = -9999;
  });

  if (canHover && !reduceMotion) {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotY = (x - 0.5) * 10;
      const rotX = (0.5 - y) * 10;
      card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      card.style.setProperty('--mx', `${x * 100}%`);
      card.style.setProperty('--my', `${y * 100}%`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'rotateX(0) rotateY(0)';
      card.style.setProperty('--mx', '50%');
      card.style.setProperty('--my', '0%');
    });

    // Після появи картки знімаємо анімацію, щоб працював transform
    card.addEventListener('animationend', () => {
      card.style.opacity = '1';
      card.style.animation = 'none';
    }, { once: true });
  }
})();
