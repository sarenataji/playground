import { useEffect, useRef, useState } from "react";
import { isClosedLoop, type Point } from "@/lib/loop";
import { playUnlockChime } from "@/lib/chime";
import { prefersReducedMotion } from "@/lib/motion";

type Props = {
  onUnlock: () => void;
};

export function Gate({ onUnlock }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const points = useRef<Point[]>([]);
  const drawing = useRef(false);
  const [hint, setHint] = useState("Draw a circle to enter");
  const unlocking = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      onUnlock();
    }
  }, [onUnlock]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintFrost(ctx, canvas.clientWidth, canvas.clientHeight, points.current, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let melt = 0;
    let raf = 0;
    const tick = () => {
      if (unlocking.current) {
        melt = Math.min(1, melt + 0.018);
        paintFrost(ctx, canvas.clientWidth, canvas.clientHeight, points.current, melt);
        if (melt >= 1) {
          onUnlock();
          return;
        }
      } else {
        paintFrost(ctx, canvas.clientWidth, canvas.clientHeight, points.current, 0);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const pos = (e: PointerEvent): Point => ({
      x: e.clientX,
      y: e.clientY,
    });

    const down = (e: PointerEvent) => {
      if (unlocking.current) return;
      drawing.current = true;
      points.current = [pos(e)];
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!drawing.current || unlocking.current) return;
      points.current.push(pos(e));
    };
    const up = () => {
      if (!drawing.current || unlocking.current) return;
      drawing.current = false;
      if (isClosedLoop(points.current)) {
        unlocking.current = true;
        setHint("The frost is melting");
        playUnlockChime();
      } else {
        setHint("Close the loop — a circle, an O, a stamp");
        window.setTimeout(() => {
          if (!unlocking.current) points.current = [];
        }, 420);
      }
    };

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    };
  }, [onUnlock]);

  return (
    <section className="gate" aria-label="Enter the playground">
      <canvas ref={canvasRef} className="gate-canvas" />
      <div className="gate-copy">
        <p className="gate-kicker">Sarena · playground 001</p>
        <p className="gate-hint">{hint}</p>
        <button type="button" className="text-btn" onClick={onUnlock}>
          Skip the ritual
        </button>
      </div>
    </section>
  );
}

function paintFrost(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pts: Point[],
  melt: number,
) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = `rgba(236, 230, 220, ${0.94 * (1 - melt)})`;
  ctx.fillRect(0, 0, w, h);

  const grain = ctx.createLinearGradient(0, 0, w, h);
  grain.addColorStop(0, `rgba(255,255,255,${0.35 * (1 - melt)})`);
  grain.addColorStop(1, `rgba(180,170,155,${0.2 * (1 - melt)})`);
  ctx.fillStyle = grain;
  ctx.fillRect(0, 0, w, h);

  if (pts.length > 1) {
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = `rgba(22, 20, 18, ${0.85 * (1 - melt * 0.4)})`;
    ctx.lineWidth = 2.4 + (1 - melt) * 1.2;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();

    if (melt > 0) {
      const last = pts[Math.floor(pts.length / 2)];
      const r = melt * Math.max(w, h) * 1.1;
      const g = ctx.createRadialGradient(last.x, last.y, r * 0.1, last.x, last.y, r);
      g.addColorStop(0, "rgba(243,238,230,0.95)");
      g.addColorStop(0.6, "rgba(243,238,230,0.4)");
      g.addColorStop(1, "rgba(243,238,230,0)");
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
    }
  }
}
