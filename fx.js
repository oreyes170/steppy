// Celebration effects: confetti, fireworks, emoji rain, flying tokens, banners.

const COLORS = ['#ff6f91', '#ffc75f', '#4ecdc4', '#a78bfa', '#ff9671', '#7dd3fc', '#f9f871'];

let palette = COLORS;
/** Holiday themes swap the confetti colours. Pass null for the default. */
export function setPalette(colors) {
  palette = colors && colors.length ? colors : COLORS;
}

const canvas = document.getElementById('fx');
const ctx = canvas.getContext('2d');
let particles = [];
let running = false;

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', resize);
resize();

export function confetti({
  count = 140,
  x = innerWidth / 2,
  y = innerHeight * 0.4,
  spread = 0.9,
  power = 1,
  colors = palette,
} = {}) {
  if (reducedMotion()) return;
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * spread;
    const speed = (7 + Math.random() * 9) * power;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: 6 + Math.random() * 6,
      h: 9 + Math.random() * 8,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.35,
      color: colors[i % colors.length],
      life: 0,
      max: 140 + Math.random() * 70,
      shape: Math.random() < 0.3 ? 'circle' : 'rect',
    });
  }
  if (!running) {
    running = true;
    requestAnimationFrame(tick);
  }
}

function tick() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  particles = particles.filter((p) => p.life < p.max && p.y < innerHeight + 40);
  for (const p of particles) {
    p.life++;
    p.vy += 0.28;
    p.vx *= 0.985;
    p.vy *= 0.985;
    p.x += p.vx + Math.sin(p.life * 0.08) * 0.6;
    p.y += p.vy;
    p.rot += p.vr;
    ctx.save();
    ctx.globalAlpha = Math.min(1, (p.max - p.life) / 30);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    if (p.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.life * 0.12)) + 2);
    }
    ctx.restore();
  }
  if (particles.length) requestAnimationFrame(tick);
  else {
    running = false;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
  }
}

/** Side cannons — used for the big goal. */
export function cannons() {
  confetti({ count: 110, x: 0, y: innerHeight * 0.75, spread: 0.35, power: 1.35 });
  confetti({ count: 110, x: innerWidth, y: innerHeight * 0.75, spread: 0.35, power: 1.35 });
  // aim the cannons inward
  for (const p of particles.slice(-220)) {
    if (p.x === 0) p.vx = Math.abs(p.vx) + 4;
    else p.vx = -Math.abs(p.vx) - 4;
  }
}

/** Bursts all over the sky — used for streak milestones. */
export function fireworks(bursts = 6) {
  if (reducedMotion()) return;
  for (let i = 0; i < bursts; i++) {
    setTimeout(() => {
      confetti({
        count: 70,
        x: innerWidth * (0.15 + Math.random() * 0.7),
        y: innerHeight * (0.15 + Math.random() * 0.35),
        spread: 2,
        power: 0.55,
      });
    }, i * 380);
  }
}

export function emojiRain(emojis, count = 28) {
  if (reducedMotion()) return;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'emoji-drop';
    el.textContent = emojis[i % emojis.length];
    el.style.left = `${Math.random() * 100}vw`;
    el.style.fontSize = `${22 + Math.random() * 26}px`;
    el.style.animationDuration = `${2.2 + Math.random() * 1.8}s`;
    el.style.animationDelay = `${Math.random() * 0.9}s`;
    el.style.setProperty('--drift', `${(Math.random() - 0.5) * 120}px`);
    el.addEventListener('animationend', () => el.remove());
    document.body.appendChild(el);
  }
}

/** A big word that pops in the middle of the screen, e.g. "BIG GOAL!". */
export function banner(text, sub = '') {
  const el = document.createElement('div');
  el.className = 'banner-pop';
  el.innerHTML = `<div class="banner-text"></div>${sub ? '<div class="banner-sub"></div>' : ''}`;
  el.querySelector('.banner-text').textContent = text;
  if (sub) el.querySelector('.banner-sub').textContent = sub;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}

/** Fly an emoji from one element to another (e.g. a ticket into the skip counter). */
export function flyTo(emoji, fromEl, toEl) {
  return new Promise((resolve) => {
    if (!toEl) return resolve();
    const to = toEl.getBoundingClientRect();
    const from = fromEl
      ? fromEl.getBoundingClientRect()
      : { left: innerWidth / 2 - 20, top: innerHeight / 2 - 20, width: 40, height: 40 };
    const el = document.createElement('span');
    el.className = 'flyer';
    el.textContent = emoji;
    document.body.appendChild(el);
    const sx = from.left + from.width / 2;
    const sy = from.top + from.height / 2;
    const ex = to.left + to.width / 2;
    const ey = to.top + to.height / 2;
    if (reducedMotion() || !el.animate) {
      el.remove();
      pulse(toEl);
      return resolve();
    }
    const anim = el.animate(
      [
        { transform: `translate(${sx}px, ${sy}px) scale(1) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${(sx + ex) / 2}px, ${Math.min(sy, ey) - 120}px) scale(2.2) rotate(-20deg)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${ex}px, ${ey}px) scale(0.8) rotate(10deg)`, opacity: 0.9 },
      ],
      { duration: 1000, easing: 'cubic-bezier(.5,0,.3,1)' },
    );
    anim.onfinish = () => {
      el.remove();
      pulse(toEl);
      resolve();
    };
  });
}

export function pulse(el, cls = 'pulse') {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth; // restart the animation
  el.classList.add(cls);
}

export function vibrate(pattern) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* not supported */
  }
}
