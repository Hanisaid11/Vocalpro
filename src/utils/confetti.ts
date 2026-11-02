/**
 * Zero-dependency HTML5 Canvas Particle Confetti
 * High-performance celebration burst for mobile and desktop without external npm packages.
 */
export function fire3StarCelebration() {
  if (typeof window === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    return;
  }

  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);

  const colors = ['#f59e0b', '#fbbf24', '#38bdf8', '#34d399', '#ec4899', '#a855f7', '#6366f1'];
  const particleCount = 100;
  const particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rotation: number;
    rotationSpeed: number;
    alpha: number;
    shape: 'rect' | 'circle';
  }> = [];

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.random() * Math.PI) / 2 + Math.PI / 4; // upward spread
    const speed = Math.random() * 12 + 8;
    particles.push({
      x: width * 0.5 + (Math.random() * 40 - 20),
      y: height * 0.65,
      vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
      vy: -Math.sin(angle) * speed,
      size: Math.random() * 7 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      alpha: 1,
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
    });
  }

  const startTime = performance.now();
  const duration = 2800; // ms

  function animate(now: number) {
    const elapsed = now - startTime;
    if (elapsed > duration) {
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      return;
    }

    ctx?.clearRect(0, 0, width, height);
    const gravity = 0.35;
    const drag = 0.985;
    const progress = elapsed / duration;
    const globalAlpha = Math.max(0, 1 - progress);

    for (const p of particles) {
      p.vx *= drag;
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;

      ctx!.save();
      ctx!.globalAlpha = p.alpha * globalAlpha;
      ctx!.translate(p.x, p.y);
      ctx!.rotate((p.rotation * Math.PI) / 180);
      ctx!.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else {
        ctx!.beginPath();
        ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.restore();
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}
