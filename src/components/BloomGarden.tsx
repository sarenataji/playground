import { useEffect, useRef, useState } from "react";
import { cssVar } from "@/lib/theme";

type Flower = { x: number; y: number; variant: number; size: number; born: number; pulse: number };
const storageKey = "sarena.bloom.garden.v1";
const limit = 24;
function restore(): Flower[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(data)) return [];
    return data.filter((f) => f && Number.isFinite(f.x) && f.x >= 0 && f.x <= 1 && Number.isFinite(f.y) && f.y >= 0 && f.y <= 1 && Number.isInteger(f.variant) && f.variant >= 0 && f.variant < 3 && Number.isFinite(f.size) && f.size >= 0.7 && f.size <= 1.2).slice(0, limit).map((f) => ({ ...f, born: -10000, pulse: -10000 }));
  } catch { return []; }
}

export function BloomGarden({ live, reduced, onCenterTap }: { live: boolean; reduced: boolean; onCenterTap: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [flowers, setFlowers] = useState<Flower[]>(restore);
  const flowersRef = useRef(flowers);
  const pointer = useRef({ x: -1000, y: -1000 });
  const touch = useRef<{ x: number; y: number; id: number } | null>(null);
  const ripple = useRef({ x: 0, y: 0, born: -10000 });
  const [announcement, setAnnouncement] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    flowersRef.current = flowers;
    try { localStorage.setItem(storageKey, JSON.stringify(flowers.map(({ x, y, variant, size }) => ({ x, y, variant, size })))); } catch { /* Garden remains usable without storage. */ }
  }, [flowers]);

  function plant(x: number, y: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height } = canvas.getBoundingClientRect();
    const now = performance.now();
    ripple.current = { x, y, born: now };
    const nearby = flowersRef.current.find((f) => Math.hypot((f.x - x) * width, (f.y - y) * height) < 42);
    if (nearby) {
      nearby.pulse = now;
      setAnnouncement("Petals flutter in the breeze.");
    } else if (Math.hypot((x - 0.5) * width, (y - 0.5) * height) < 95) {
      onCenterTap();
      setAnnouncement("Your first flower unfurls.");
    } else if (flowersRef.current.length < limit) {
      const next = [...flowersRef.current, { x, y, variant: Math.floor(Math.random() * 3), size: 0.7 + Math.random() * 0.5, born: now, pulse: -10000 }];
      flowersRef.current = next;
      setFlowers(next);
      setAnnouncement("A new bloom planted. Your garden is growing.");
    } else {
      flowersRef.current.forEach((f) => { f.pulse = now; });
      setAnnouncement("Your garden is full. The flowers sway together.");
    }
    setRevision((n) => n + 1);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    let width = 1;
    let height = 1;
    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      const accent = cssVar("--accent") || "#d4786a";
      const ink = cssVar("--ink") || "#3a241c";
      const colors = [accent, "#e7ac92", "#f4dfb8"];
      for (const f of [...flowersRef.current].sort((a, b) => a.y - b.y)) {
        const age = reduced ? 1 : Math.min(1, Math.max(0, (time - f.born) / 1100));
        const growth = 1 - Math.pow(1 - age, 3);
        const px = f.x * width;
        const py = f.y * height;
        const proximity = Math.max(0, 1 - Math.hypot(px - pointer.current.x, py - pointer.current.y) / 180);
        const pulseAge = (time - f.pulse) / 1000;
        const flutter = reduced || pulseAge > 2 ? 0 : Math.sin(pulseAge * 14) * Math.exp(-pulseAge * 2);
        const sway = reduced ? 0 : Math.sin(time * 0.0013 + f.x * 12) * 4 + (pointer.current.x - px) * proximity * 0.1;
        const stem = Math.min(125 * f.size, height - py + 20);
        const headY = py + stem * (1 - growth);
        const radius = Math.min(48, width * 0.065) * f.size * growth;
        ctx.save();
        ctx.globalAlpha = 0.86;
        ctx.strokeStyle = "#92947b";
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.moveTo(px, py + stem);
        ctx.quadraticCurveTo(px - sway * 0.4, py + stem * 0.4, px + sway, headY);
        ctx.stroke();
        ctx.save();
        ctx.translate(px, py + stem * 0.63);
        ctx.scale(growth, growth);
        ctx.fillStyle = "#a2a58a";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-30, -2, -28, -23, -27, -24);
        ctx.quadraticCurveTo(-4, -23, 0, 0);
        ctx.fill();
        ctx.restore();
        ctx.translate(px + sway, headY);
        ctx.rotate(sway * 0.012 + flutter * 0.12);
        const count = [8, 6, 12][f.variant];
        for (let layer = 0; layer < 2; layer++) {
          for (let p = 0; p < count; p++) {
            ctx.save();
            ctx.rotate(p / count * Math.PI * 2 + layer * 0.3);
            const length = radius * (layer ? 0.7 : 1) * (1 + flutter * 0.07);
            const petalWidth = length * (f.variant === 2 ? 0.23 : 0.46);
            ctx.fillStyle = layer ? "#f3cebb" : colors[f.variant];
            ctx.globalAlpha = layer ? 0.85 : 0.72;
            ctx.beginPath();
            ctx.moveTo(0, 3);
            ctx.bezierCurveTo(petalWidth, -length * 0.3, petalWidth, -length, 0, -length);
            ctx.bezierCurveTo(-petalWidth, -length, -petalWidth, -length * 0.3, 0, 3);
            ctx.fill();
            ctx.restore();
          }
        }
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.17, 0, Math.PI * 2);
        ctx.fill();
        if (!reduced && pulseAge >= 0 && pulseAge < 1.8) {
          ctx.fillStyle = "#cba66e";
          ctx.globalAlpha = (1 - pulseAge / 1.8) * 0.7;
          for (let p = 0; p < 7; p++) {
            const angle = p * 2.4;
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * (12 + pulseAge * 28), Math.sin(angle) * (12 + pulseAge * 20) - pulseAge * 25, 1.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }
      const age = (time - ripple.current.born) / 1000;
      if (!reduced && age >= 0 && age < 1.1) {
        const x = ripple.current.x * width;
        const y = ripple.current.y * height;
        const radius = 8 + age * 48;
        const wash = ctx.createRadialGradient(x, y, 0, x, y, radius);
        wash.addColorStop(0, "rgba(212,120,106,0.16)");
        wash.addColorStop(1, "rgba(212,120,106,0)");
        ctx.globalAlpha = 1 - age / 1.1;
        ctx.fillStyle = wash;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        ctx.strokeStyle = accent;
        ctx.globalAlpha *= 0.3;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (live && !reduced) frame = requestAnimationFrame(draw);
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cancelAnimationFrame(frame);
      draw(performance.now());
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [live, reduced, revision]);

  return <>
    <canvas ref={canvasRef} className="bloom-garden" tabIndex={0} role="button" aria-label="Plant a flower. Tap an empty spot, or press Enter or Space to plant. Tap a flower to stir its petals."
      onPointerDown={(e) => { e.stopPropagation(); touch.current = { x: e.clientX, y: e.clientY, id: e.pointerId }; }}
      onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); pointer.current = { x: e.clientX - r.left, y: e.clientY - r.top }; }}
      onPointerLeave={() => { pointer.current = { x: -1000, y: -1000 }; touch.current = null; }}
      onPointerCancel={(e) => { e.stopPropagation(); touch.current = null; }}
      onPointerUp={(e) => {
        e.stopPropagation();
        const start = touch.current;
        touch.current = null;
        if (!start || start.id !== e.pointerId || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) return;
        const r = e.currentTarget.getBoundingClientRect();
        plant((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
      }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); if (!e.repeat) plant(0.12 + Math.random() * 0.76, 0.2 + Math.random() * 0.55); } }}
    />
    {flowers.length === 0 && <div className="bloom-plant-hint" aria-hidden="true"><span>+</span> Plant here</div>}
    <div className="bloom-garden-footer">
      <span aria-hidden="true">{flowers.length ? "Your garden is growing." : "A little care, a little color."}</span>
      {flowers.length > 0 && <button type="button" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); flowersRef.current = []; setFlowers([]); setRevision((n) => n + 1); setAnnouncement("A fresh start. Plant a new bloom."); }}>Begin again <span aria-hidden="true">↺</span></button>}
    </div>
    <span className="bloom-announcement" role="status">{announcement}</span>
  </>;
}
