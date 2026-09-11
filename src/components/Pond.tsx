import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { useInView } from "@/lib/useInView";
import { cssVar } from "@/lib/theme";

type Ripple = { x: number; y: number; r: number; life: number };
type Lily = { x: number; y: number; r: number; phase: number };

export function Pond() {
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useInView(root);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ripples: Ripple[] = [];
    let lilies: Lily[] = [];

    const resize = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      lilies = Array.from({ length: 7 }, (_, i) => ({
        x: w * (0.12 + ((i * 0.13) % 0.76)),
        y: h * (0.28 + ((i * 0.17) % 0.52)),
        r: 16 + (i % 3) * 8,
        phase: i * 0.9,
      }));
    };
    resize();
    window.addEventListener("resize", resize);

    const splash = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      ripples.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        r: 8,
        life: 1,
      });
    };
    const move = (e: PointerEvent) => {
      if (e.buttons && ripples.length < 40) splash(e);
    };
    canvas.addEventListener("pointerdown", splash);
    canvas.addEventListener("pointermove", move);

    let raf = 0;
    const tick = (t: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const paper = cssVar("--paper") || "#c5ddd8";
      const accent = cssVar("--accent") || "#2f6b6a";
      const bloom = cssVar("--bloom") || "#9ec9c0";
      const ink = cssVar("--ink") || "#16332c";

      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, bloom);
      g.addColorStop(1, paper);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      if (live && !prefersReducedMotion()) {
        for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i];
          r.r += 1.6;
          r.life -= 0.008;
          if (r.life <= 0) ripples.splice(i, 1);
        }
      }

      for (const r of ripples) {
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(22, 51, 44, ${0.28 * r.life})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r * 0.62, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.22 * r.life})`;
        ctx.stroke();
      }

      for (const lily of lilies) {
        const bob = prefersReducedMotion() ? 0 : Math.sin(t * 0.0012 + lily.phase) * 4;
        ctx.beginPath();
        ctx.ellipse(lily.x, lily.y + bob, lily.r, lily.r * 0.62, 0.2, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.55;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(lily.x + 6, lily.y + bob - 4, 5, 0, Math.PI * 2);
        ctx.fillStyle = ink;
        ctx.globalAlpha = 0.35;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", splash);
      canvas.removeEventListener("pointermove", move);
    };
  }, [live]);

  return (
    <section ref={root} className="room pond" id="pond">
      <div className="room-copy">
        <p className="kicker">Water that listens</p>
        <h2 className="display">Touch, then let it still.</h2>
        <p className="lede">
          Every mark becomes a ring, then quiet. The pond does not keep score.
        </p>
      </div>
      <canvas ref={canvasRef} className="room-canvas well" />
    </section>
  );
}
