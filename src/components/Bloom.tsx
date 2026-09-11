import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { useInView } from "@/lib/useInView";
import { cssVar } from "@/lib/theme";

type Flower = {
  x: number;
  y: number;
  petals: number;
  hue: number;
  age: number;
  sway: number;
};

export function Bloom() {
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useInView(root);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const flowers: Flower[] = [];
    const resize = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const plant = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      flowers.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        petals: 5 + Math.floor(Math.random() * 4),
        hue: 8 + Math.random() * 40,
        age: 0,
        sway: Math.random() * Math.PI * 2,
      });
      if (flowers.length > 28) flowers.shift();
    };
    canvas.addEventListener("pointerdown", plant);

    let raf = 0;
    const tick = (t: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const paper = cssVar("--paper") || "#f3e6dc";
      const bloom = cssVar("--bloom") || "#f0c8b4";
      ctx.fillStyle = paper;
      ctx.fillRect(0, 0, w, h);
      const wash = ctx.createRadialGradient(w * 0.5, h * 0.2, 40, w * 0.5, h * 0.2, w * 0.7);
      wash.addColorStop(0, bloom);
      wash.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = wash;
      ctx.globalAlpha = 0.35;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;

      for (const f of flowers) {
        if (live && !prefersReducedMotion()) f.age = Math.min(1, f.age + 0.018);
        const scale = 8 + f.age * 28;
        const sway = prefersReducedMotion() ? 0 : Math.sin(t * 0.0014 + f.sway) * 0.12;
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(sway);
        for (let i = 0; i < f.petals; i++) {
          const a = (i / f.petals) * Math.PI * 2;
          ctx.beginPath();
          ctx.ellipse(Math.cos(a) * scale * 0.45, Math.sin(a) * scale * 0.45, scale * 0.42, scale * 0.22, a, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${f.hue}, 55%, ${72 - f.age * 8}%, 0.85)`;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(0, 0, scale * 0.18, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${f.hue + 28}, 60%, 58%, 0.95)`;
        ctx.fill();
        ctx.restore();
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", plant);
    };
  }, [live]);

  return (
    <section ref={root} className="room bloom-room" id="bloom">
      <div className="room-copy">
        <p className="kicker">Something living</p>
        <h2 className="display">Leave a bloom.</h2>
        <p className="lede">
          Tap anywhere. Petals remember your hand. They will sway until you go.
        </p>
      </div>
      <canvas ref={canvasRef} className="room-canvas well" />
    </section>
  );
}
