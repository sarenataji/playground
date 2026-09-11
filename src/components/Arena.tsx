import { useEffect, useRef } from "react";
import { pointer } from "@/lib/pointer";
import { prefersReducedMotion } from "@/lib/motion";
import { useInView } from "@/lib/useInView";
import { tintInk } from "@/lib/inkBus";

type Ball = { x: number; y: number; vx: number; vy: number; r: number; c: string };

export function Arena() {
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useInView(root);

  useEffect(() => {
    if (live) tintInk([0.12, 0.22, 0.2]);
  }, [live]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let balls: Ball[] = [];
    const colors = ["#161412", "#c45c26", "#2c5a52", "#f3eee6", "#8a8175"];

    const resize = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const seed = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      balls = Array.from({ length: 14 }, (_, i) => ({
        x: 80 + Math.random() * (w - 160),
        y: 80 + Math.random() * (h - 160),
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        r: 16 + (i % 4) * 8,
        c: colors[i % colors.length],
      }));
    };
    seed();

    let raf = 0;
    const tick = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.fillStyle = "#c9ddd6";
      ctx.fillRect(0, 0, w, h);

      const px = pointer.nx * w;
      const py = pointer.ny * h;
      const pr = 28;

      if (live && !prefersReducedMotion()) {
        for (let i = 0; i < balls.length; i++) {
          const a = balls[i];
          a.x += a.vx;
          a.y += a.vy;
          if (a.x < a.r) {
            a.x = a.r;
            a.vx *= -1;
          }
          if (a.x > w - a.r) {
            a.x = w - a.r;
            a.vx *= -1;
          }
          if (a.y < a.r) {
            a.y = a.r;
            a.vy *= -1;
          }
          if (a.y > h - a.r) {
            a.y = h - a.r;
            a.vy *= -1;
          }

          const dx = a.x - px;
          const dy = a.y - py;
          const d = Math.hypot(dx, dy) || 1;
          const min = a.r + pr;
          if (d < min) {
            const nx = dx / d;
            const ny = dy / d;
            const overlap = min - d;
            a.x += nx * overlap;
            a.y += ny * overlap;
            const vn = a.vx * nx + a.vy * ny;
            a.vx -= 1.8 * vn * nx;
            a.vy -= 1.8 * vn * ny;
            a.vx += nx * 1.2;
            a.vy += ny * 1.2;
          }

          for (let j = i + 1; j < balls.length; j++) {
            const b = balls[j];
            const rx = b.x - a.x;
            const ry = b.y - a.y;
            const dist = Math.hypot(rx, ry) || 1;
            const need = a.r + b.r;
            if (dist < need) {
              const nx = rx / dist;
              const ny = ry / dist;
              const overlap = (need - dist) / 2;
              a.x -= nx * overlap;
              a.y -= ny * overlap;
              b.x += nx * overlap;
              b.y += ny * overlap;
              const av = a.vx * nx + a.vy * ny;
              const bv = b.vx * nx + b.vy * ny;
              a.vx += (bv - av) * nx;
              a.vy += (bv - av) * ny;
              b.vx += (av - bv) * nx;
              b.vy += (av - bv) * ny;
            }
          }
        }
      }

      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(22,20,18,0.18)";
      ctx.fill();
      ctx.strokeStyle = "#161412";
      ctx.lineWidth = 1.4;
      ctx.stroke();

      for (const b of balls) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = b.c;
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [live]);

  return (
    <section ref={root} className="room arena" id="arena">
      <canvas ref={canvasRef} className="room-canvas" />
      <div className="room-copy">
        <p className="kicker">Company, not a contest</p>
        <h2 className="display">A gentle knock.</h2>
        <p className="lede">Your cursor is a body among friends. Bump them. They will not mind.</p>
      </div>
    </section>
  );
}
