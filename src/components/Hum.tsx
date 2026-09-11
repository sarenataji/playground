import { useEffect, useRef, useState } from "react";
import { pointer } from "@/lib/pointer";
import { prefersReducedMotion } from "@/lib/motion";
import { useInView } from "@/lib/useInView";
import { playTone } from "@/lib/chime";
import { cssVar } from "@/lib/theme";

const NOTES = [
  { f: 261.63, name: "C" },
  { f: 293.66, name: "D" },
  { f: 329.63, name: "E" },
  { f: 392.0, name: "G" },
  { f: 440.0, name: "A" },
  { f: 523.25, name: "C" },
];

type Orb = {
  x: number;
  y: number;
  ox: number;
  oy: number;
  r: number;
  f: number;
  name: string;
  pulse: number;
};

export function Hum() {
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useInView(root);
  const [last, setLast] = useState("—");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let orbs: Orb[] = [];
    const layout = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      orbs = NOTES.map((n, i) => {
        const x = w * (0.14 + (i / (NOTES.length - 1)) * 0.72);
        const y = h * (0.42 + Math.sin(i) * 0.12);
        return { x, y, ox: x, oy: y, r: 28 + (i % 3) * 6, f: n.f, name: n.name, pulse: 0 };
      });
    };
    layout();
    window.addEventListener("resize", layout);

    const hit = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      let best: Orb | null = null;
      let bd = 1e9;
      for (const o of orbs) {
        const d = (o.x - x) ** 2 + (o.y - y) ** 2;
        if (d < bd) {
          bd = d;
          best = o;
        }
      }
      if (best && bd < (best.r + 24) ** 2) {
        best.pulse = 1;
        playTone(best.f, 1.4, 0.06);
        setLast(best.name);
      }
    };
    canvas.addEventListener("pointerdown", hit);

    let raf = 0;
    const tick = (t: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const paper = cssVar("--paper") || "#1c1830";
      const accent = cssVar("--accent") || "#d4b8f0";
      const bloom = cssVar("--bloom") || "#6a5a9a";
      ctx.fillStyle = paper;
      ctx.fillRect(0, 0, w, h);

      if (live && !prefersReducedMotion()) {
        const mx = pointer.nx * w;
        const my = pointer.ny * h;
        for (const o of orbs) {
          o.x += (o.ox - o.x) * 0.04;
          o.y += (o.oy - o.y) * 0.04 + Math.sin(t * 0.001 + o.f * 0.01) * 0.15;
          const dx = o.x - mx;
          const dy = o.y - my;
          const d = Math.hypot(dx, dy) || 1;
          if (d < 140) {
            o.x += (dx / d) * 0.6;
            o.y += (dy / d) * 0.6;
          }
          o.pulse *= 0.94;
        }
      }

      for (const o of orbs) {
        const rad = o.r * (1 + o.pulse * 0.45);
        const g = ctx.createRadialGradient(o.x - 6, o.y - 6, 4, o.x, o.y, rad);
        g.addColorStop(0, accent);
        g.addColorStop(1, bloom);
        ctx.beginPath();
        ctx.arc(o.x, o.y, rad, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.globalAlpha = 0.55 + o.pulse * 0.4;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = cssVar("--ink") || "#f4eefc";
        ctx.font = "500 14px Outfit, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(o.name, o.x, o.y);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", layout);
      canvas.removeEventListener("pointerdown", hit);
    };
  }, [live]);

  return (
    <section ref={root} className="room hum" id="hum">
      <div className="room-copy invert">
        <p className="kicker invert">Air that sings</p>
        <h2 className="display">Pluck a note.</h2>
        <p className="lede invert">
          Six quiet tones. Touch one and the room keeps it for a breath. Last
          note: {last}.
        </p>
      </div>
      <canvas ref={canvasRef} className="room-canvas well" />
    </section>
  );
}
