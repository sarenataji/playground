import { useEffect, useRef } from "react";
import { useInView } from "@/lib/useInView";
import { tintInk } from "@/lib/inkBus";

export function Magnets() {
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wind = useRef({ x: 0.5, strength: 0, direction: 1 });
  const lastX = useRef<number | null>(null);
  const live = useInView(root);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("journey:ready", { detail: "/weather" }));
  }, []);
  useEffect(() => {
    if (live) tintInk([0.44, 0.49, 0.32], true);
  }, [live]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !live) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let previous = 0;
    let time = 0;
    let width = 0;
    let height = 0;
    const stems = Array.from({ length: 190 }, (_, i) => ({
      x: ((i * 0.61803398875) % 1),
      depth: (Math.sin(i * 127.1 + 31.7) * 43758.5453) % 1 * 0.5 + 0.5,
      length: 0.48 + ((Math.sin(i * 73.3 + 9.1) * 19341.17) % 1 * 0.5 + 0.5) * 0.48,
      bend: 0,
      velocity: 0,
    })).sort((a, b) => a.depth - b.depth);
    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    const draw = (now: number) => {
      const dt = previous ? Math.min((now - previous) / 1000, 0.04) : 0;
      previous = now;
      if (!motion.matches) time += dt;
      ctx.clearRect(0, 0, width, height);
      if (!motion.matches) wind.current.strength *= Math.exp(-dt * 0.65);
      const glow = ctx.createRadialGradient(width * 0.62, height * 0.58, 0, width * 0.62, height * 0.58, width * 0.65);
      glow.addColorStop(0, "rgba(122, 139, 89, 0.09)");
      glow.addColorStop(1, "rgba(122, 139, 89, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
      for (const stem of stems) {
        const proximity = Math.exp(-Math.pow((stem.x - wind.current.x) / 0.28, 2));
        const ambient = motion.matches ? 0 : Math.sin(time * 0.65 - stem.x * 7 + stem.depth * 2) * 0.075;
        const target = ambient + wind.current.direction * wind.current.strength * (0.22 + proximity * 0.78) * 0.64;
        if (motion.matches) stem.bend = target;
        else {
          stem.velocity += ((target - stem.bend) * 15 - stem.velocity * 5) * dt;
          stem.bend += stem.velocity * dt;
        }
        const x = stem.x * (width + 50) - 25;
        const y = height * (0.74 + stem.depth * 0.26);
        const length = height * stem.length * (0.25 + stem.depth * 0.35);
        const lean = stem.bend * length;
        const tipX = x + lean;
        const tipY = y - length + Math.abs(stem.bend) * length * 0.18;
        const alpha = 0.23 + stem.depth * 0.53;
        ctx.strokeStyle = `rgba(${stem.depth > 0.7 ? '187, 177, 125' : '128, 150, 118'}, ${alpha})`;
        ctx.lineWidth = 0.65 + stem.depth * 0.9;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.bezierCurveTo(x, y - length * 0.35, x + lean * 0.45, tipY + length * 0.12, tipX, tipY);
        ctx.stroke();
        // Small seed heads give the field a botanical silhouette.
        ctx.save();
        ctx.translate(tipX, tipY);
        ctx.rotate(Math.atan2(lean * 0.7, length * 0.3));
        ctx.fillStyle = `rgba(205, 187, 137, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.ellipse(0, -length * 0.035, 1.1 + stem.depth, length * 0.043, -0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      const fade = ctx.createLinearGradient(0, height * 0.83, 0, height);
      fade.addColorStop(0, "rgba(17, 27, 24, 0)");
      fade.addColorStop(1, "#111b18");
      ctx.fillStyle = fade;
      ctx.fillRect(0, height * 0.83, width, height * 0.17);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [live]);

  const breeze = () => {
    wind.current = { x: 0.5, strength: 1, direction: wind.current.direction === 1 ? -1 : 1 };
  };

  return (
    <section ref={root} className="room magnets breeze" id="magnets">
      <div className="room-copy breeze-copy">
        <p className="kicker">A passing breeze</p>
        <h2 className="display">Move gently.<br />Watch it travel.</h2>
        <div className="breeze-aside">
          <p className="lede">Brush across the field.<br />The grass bends, then finds its way back.</p>
          <button type="button" className="breeze-button" onClick={breeze}>Send a breeze <span aria-hidden="true">↗</span></button>
        </div>
      </div>
      <div className="breeze-field"
        onPointerMove={(event) => {
          if (!event.isPrimary) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
          const delta = lastX.current === null ? 0.005 : x - lastX.current;
          if (Math.abs(delta) > 0.0002) {
            wind.current = { x, strength: Math.min(1.15, wind.current.strength + Math.abs(delta) * 9), direction: delta > 0 ? 1 : -1 };
          }
          lastX.current = x;
        }}
        onPointerLeave={() => { lastX.current = null; }}
        onPointerCancel={() => { lastX.current = null; }}
        onPointerUp={(event) => { if (event.pointerType !== "mouse") lastX.current = null; }}
        aria-hidden="true">
        <canvas ref={canvasRef} />
        <span className="breeze-caption">a small movement, carried onward</span>
      </div>
    </section>
  );
}
