import { useEffect, useRef, useState } from "react";
import { pointer } from "@/lib/pointer";
import { prefersReducedMotion } from "@/lib/motion";
import { useInView } from "@/lib/useInView";
import { tintInk } from "@/lib/inkBus";

type Orb = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  q: number;
  hue: number;
};

export function Magnets() {
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useInView(root);
  const [mode, setMode] = useState<"pull" | "push">("pull");
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    if (live) tintInk([0.55, 0.35, 0.12]);
  }, [live]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let orbs: Orb[] = [];
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
      orbs = Array.from({ length: 22 }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: 0,
        vy: 0,
        r: 10 + (i % 5) * 5,
        q: i % 2 === 0 ? 1 : -1,
        hue: i % 3 === 0 ? 28 : i % 3 === 1 ? 40 : 18,
      }));
    };
    seed();

    let raf = 0;
    const tick = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.fillStyle = "#0d1116";
      ctx.fillRect(0, 0, w, h);

      if (live && !prefersReducedMotion()) {
        const mx = pointer.nx * w;
        const my = pointer.ny * h;
        const sign = modeRef.current === "pull" ? -1 : 1;
        for (const o of orbs) {
          const dx = o.x - mx;
          const dy = o.y - my;
          const d2 = dx * dx + dy * dy + 80;
          const f = (1800 * sign * o.q) / d2;
          o.vx += (dx / Math.sqrt(d2)) * f * 0.04;
          o.vy += (dy / Math.sqrt(d2)) * f * 0.04;

          for (const b of orbs) {
            if (b === o) continue;
            const rx = o.x - b.x;
            const ry = o.y - b.y;
            const rr = rx * rx + ry * ry + 40;
            const coul = (o.q * b.q * 90) / rr;
            o.vx += (rx / Math.sqrt(rr)) * coul * 0.02;
            o.vy += (ry / Math.sqrt(rr)) * coul * 0.02;
          }

          o.vx *= 0.96;
          o.vy *= 0.96;
          o.x += o.vx;
          o.y += o.vy;
          if (o.x < o.r) {
            o.x = o.r;
            o.vx *= -0.7;
          }
          if (o.x > w - o.r) {
            o.x = w - o.r;
            o.vx *= -0.7;
          }
          if (o.y < o.r) {
            o.y = o.r;
            o.vy *= -0.7;
          }
          if (o.y > h - o.r) {
            o.y = h - o.r;
            o.vy *= -0.7;
          }
        }

        ctx.beginPath();
        ctx.arc(mx, my, 18, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(232, 196, 120, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      for (const o of orbs) {
        const g = ctx.createRadialGradient(o.x - o.r * 0.3, o.y - o.r * 0.3, 2, o.x, o.y, o.r);
        g.addColorStop(0, `hsla(${o.hue}, 70%, 72%, 0.95)`);
        g.addColorStop(1, `hsla(${o.hue}, 50%, 28%, 0.2)`);
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = g;
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
    <section ref={root} className="room magnets" id="magnets">
      <canvas ref={canvasRef} className="room-canvas" />
      <div className="room-copy invert">
        <p className="kicker invert">Field · Coulomb</p>
        <h2 className="display">Opposite rooms.</h2>
        <p className="lede invert">Your pointer is a charge. Flip it.</p>
        <button
          type="button"
          className="text-btn invert"
          onClick={() => setMode((m) => (m === "pull" ? "push" : "pull"))}
        >
          Mode: {mode}
        </button>
      </div>
    </section>
  );
}
