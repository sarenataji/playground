import { useEffect, useRef } from "react";
import { pointer } from "@/lib/pointer";
import { prefersReducedMotion } from "@/lib/motion";
import { useInView } from "@/lib/useInView";
import { cssVar } from "@/lib/theme";

type Star = { x: number; y: number; s: number };

export function Dawn() {
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useInView(root);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let stars: Star[] = [];
    const resize = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      stars = Array.from({ length: 48 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h * 0.55,
        s: 0.6 + Math.random() * 1.6,
      }));
    };
    resize();
    window.addEventListener("resize", resize);

    let sunY = 0.62;
    let raf = 0;
    const tick = (t: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const paper = cssVar("--paper") || "#f3d5c4";
      const bloom = cssVar("--bloom") || "#f0b48a";
      const accent = cssVar("--accent") || "#e08a4a";
      const sky = cssVar("--sky") || "#7eabc8";
      const ink = cssVar("--ink") || "#2a2018";

      const target = prefersReducedMotion() || !live ? 0.42 : pointer.ny;
      sunY += (target - sunY) * 0.04;
      const day = 1 - Math.min(1, Math.max(0, sunY));

      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, mix(sky, "#1a2438", 1 - day));
      g.addColorStop(0.45, mix(bloom, "#3a3048", 1 - day * 0.85));
      g.addColorStop(0.72, mix(paper, bloom, 0.35 + day * 0.2));
      g.addColorStop(1, mix(paper, accent, 0.12));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const night = Math.max(0, 1 - day * 1.35);
      if (night > 0.05) {
        for (const st of stars) {
          ctx.beginPath();
          ctx.arc(st.x, st.y, st.s, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,248,236,${night * 0.7})`;
          ctx.fill();
        }
      }

      const sx = w * (0.22 + pointer.nx * 0.56);
      const sy = h * (0.18 + sunY * 0.5);
      const sr = Math.min(w, h) * (0.07 + day * 0.04);
      const glow = ctx.createRadialGradient(sx, sy, sr * 0.2, sx, sy, sr * 6);
      glow.addColorStop(0, `rgba(255, 214, 150, ${0.55 + day * 0.3})`);
      glow.addColorStop(0.35, `rgba(240, 160, 90, ${0.18 + day * 0.12})`);
      glow.addColorStop(1, "rgba(240,160,90,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fillStyle = mix("#fff6d8", accent, 0.25);
      ctx.fill();

      const wave = Math.sin(t * 0.0004) * 8;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.72 + wave);
      ctx.quadraticCurveTo(w * 0.3, h * 0.68 - wave, w * 0.55, h * 0.74);
      ctx.quadraticCurveTo(w * 0.8, h * 0.8, w, h * 0.7 + wave * 0.4);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = mix(ink, paper, 0.82);
      ctx.globalAlpha = 0.28;
      ctx.fill();
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [live]);

  return (
    <section ref={root} className="room dawn" id="dawn">
      <div className="room-copy">
        <p className="kicker">A sky that stays</p>
        <h2 className="display">Move the sun with your hand.</h2>
        <p className="lede">
          Lift toward morning, or let the stars come back. The horizon does not
          hurry.
        </p>
      </div>
      <canvas ref={canvasRef} className="room-canvas well" />
    </section>
  );
}

function mix(a: string, b: string, t: number) {
  const pa = hex(a);
  const pb = hex(b);
  if (!pa || !pb) return a;
  const m = (i: number) => Math.round(pa[i] + (pb[i] - pa[i]) * t);
  return `rgb(${m(0)}, ${m(1)}, ${m(2)})`;
}

function hex(c: string): [number, number, number] | null {
  const h = c.trim();
  if (h.startsWith("#") && (h.length === 7 || h.length === 4)) {
    if (h.length === 4) {
      return [
        parseInt(h[1] + h[1], 16),
        parseInt(h[2] + h[2], 16),
        parseInt(h[3] + h[3], 16),
      ];
    }
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }
  return null;
}
