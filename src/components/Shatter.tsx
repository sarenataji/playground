import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { useInView } from "@/lib/useInView";
import { tintInk } from "@/lib/inkBus";

type Shard = {
  pts: { x: number; y: number }[];
  cx: number;
  cy: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  ox: number;
  oy: number;
};

function makeShards(w: number, h: number): Shard[] {
  const cols = 6;
  const rows = 4;
  const shards: Shard[] = [];
  const cw = w / cols;
  const ch = h / rows;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const j = () => (Math.random() - 0.5) * 28;
      const pts = [
        { x: x * cw + j(), y: y * ch + j() },
        { x: (x + 1) * cw + j(), y: y * ch + j() },
        { x: (x + 1) * cw + j(), y: (y + 1) * ch + j() },
        { x: x * cw + j(), y: (y + 1) * ch + j() },
      ];
      const cx = pts.reduce((a, p) => a + p.x, 0) / 4;
      const cy = pts.reduce((a, p) => a + p.y, 0) / 4;
      shards.push({ pts, cx, cy, vx: 0, vy: 0, rot: 0, vr: 0, ox: cx, oy: cy });
    }
  }
  return shards;
}

export function Shatter() {
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fillRef = useRef<HTMLElement>(null);
  const live = useInView(root);
  const [broken, setBroken] = useState(false);
  const hold = useRef(false);
  const shards = useRef<Shard[]>([]);
  const brokenRef = useRef(false);
  const progress = useRef(0);

  useEffect(() => {
    if (live) tintInk([0.18, 0.05, 0.03], true);
  }, [live]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!brokenRef.current) shards.current = makeShards(canvas.clientWidth, canvas.clientHeight);
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--paper").trim() || "#2a1c18";
      ctx.fillRect(0, 0, w, h);

      if (hold.current && !brokenRef.current && !prefersReducedMotion()) {
        progress.current = Math.min(1, progress.current + 0.012);
        if (fillRef.current) fillRef.current.style.transform = `scaleX(${progress.current})`;
        if (progress.current >= 1) {
          brokenRef.current = true;
          setBroken(true);
          for (const s of shards.current) {
            const a = Math.atan2(s.cy - h / 2, s.cx - w / 2);
            s.vx = Math.cos(a) * (4 + Math.random() * 9);
            s.vy = Math.sin(a) * (3 + Math.random() * 7) - 6;
            s.vr = (Math.random() - 0.5) * 0.18;
          }
        }
      }

      for (const s of shards.current) {
        if (brokenRef.current) {
          s.vy += 0.28;
          s.vx *= 0.995;
          s.cx += s.vx;
          s.cy += s.vy;
          s.rot += s.vr;
          if (s.cy > h - 24) {
            s.cy = h - 24;
            s.vy *= -0.42;
            s.vr *= 0.7;
          }
        }
        ctx.save();
        ctx.translate(s.cx, s.cy);
        ctx.rotate(s.rot);
        ctx.beginPath();
        s.pts.forEach((p, i) => {
          const x = p.x - s.ox;
          const y = p.y - s.oy;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = "rgba(243, 232, 220, 0.16)";
        ctx.strokeStyle = "rgba(255, 236, 220, 0.55)";
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const start = () => {
    if (broken) return;
    hold.current = true;
  };
  const stop = () => {
    hold.current = false;
  };

  return (
    <section ref={root} className="room shatter" id="shatter">
      <canvas ref={canvasRef} className="room-canvas well" />
      <div className="room-copy invert">
        <p className="kicker invert">A little pressure</p>
        <h2 className="display">Hold until it lets go.</h2>
        <p className="lede invert">
          Some weight only wants a patient hand. Keep holding. It will become light.
        </p>
        <button
          type="button"
          className="hold-btn"
          onPointerDown={start}
          onPointerUp={stop}
          onPointerLeave={stop}
          onClick={start}
          disabled={broken}
        >
          {broken ? "Released" : "Hold"}
          <i ref={fillRef} />
        </button>
      </div>
    </section>
  );
}
