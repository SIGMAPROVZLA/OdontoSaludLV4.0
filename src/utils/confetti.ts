/**
 * Feedback Positivo y Logros Clínicos en Cliente (AGENTS.md §4)
 * Motor ligero de Confeti en HTML5 Canvas a 60 FPS con respeto a prefers-reduced-motion.
 */

export function triggerClinicalConfetti(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Respetar estrictamente prefers-reduced-motion (AGENTS.md §2 Capa 4 y §4)
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const colors = ['#10B981', '#51405F', '#8B5CF6', '#F59E0B', '#06B6D4', '#EC4899'];
  const particles = Array.from({ length: 75 }, () => ({
    x: canvas.width * (0.3 + Math.random() * 0.4),
    y: canvas.height * 0.35,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 12 - 5,
    size: Math.random() * 7 + 5,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * Math.PI * 2,
    vRot: (Math.random() - 0.5) * 0.25,
    opacity: 1,
  }));

  let frame = 0;
  const maxFrames = 95;

  const render = () => {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      p.x += p.vx;
      p.vy += 0.38; // Gravedad
      p.y += p.vy;
      p.rotation += p.vRot;
      if (frame > maxFrames * 0.65) {
        p.opacity = Math.max(0, p.opacity - 0.035);
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
      ctx.restore();
    }

    if (frame < maxFrames) {
      requestAnimationFrame(render);
    } else {
      canvas.remove();
    }
  };

  requestAnimationFrame(render);
}
