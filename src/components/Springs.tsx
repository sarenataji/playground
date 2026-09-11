import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { useInView } from "@/lib/useInView";
import { tintInk } from "@/lib/inkBus";

type Node = { x: number; y: number; ox: number; oy: number; vx: number; vy: number };

export function Springs() {
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useInView(root);

  useEffect(() => {
    if (live) tintInk([0.09, 0.07, 0.05]);
  }, [live]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cols = 10;
    const rows = 6;
    let nodes: Node[] = [];
    let grab = -1;

    const layout = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const padX = w * 0.08;
      const padY = h * 0.18;
      nodes = [];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = padX + (x / (cols - 1)) * (w - padX * 2);
          const py = padY + (y / (rows - 1)) * (h - padY * 2);
          nodes.push({ x: px, y: py, ox: px, oy: py, vx: 0, vy: 0 });
        }
      }
    };
    layout();
    window.addEventListener("resize", layout);

    const down = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      let best = 0;
      let bd = 1e9;
      nodes.forEach((n, i) => {
        const d = (n.x - x) ** 2 + (n.y - y) ** 2;
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      grab = best;
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (grab < 0) return;
      const rect = canvas.getBoundingClientRect();
      nodes[grab].x = e.clientX - rect.left;
      nodes[grab].y = e.clientY - rect.top;
      nodes[grab].vx = 0;
      nodes[grab].vy = 0;
    };
    const up = () => {
      grab = -1;
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);

    let raf = 0;
    const tick = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.fillStyle = "#e7e0d4";
      ctx.fillRect(0, 0, w, h);

      if (live && !prefersReducedMotion()) {
        const k = 0.08;
        const damp = 0.86;
        for (let i = 0; i < nodes.length; i++) {
          if (i === grab) continue;
          const n = nodes[i];
          n.vx += (n.ox - n.x) * k * 0.35;
          n.vy += (n.oy - n.y) * k * 0.35;
          const x = i % cols;
          const y = Math.floor(i / cols);
          const neighbors = [
            x > 0 ? i - 1 : -1,
            x < cols - 1 ? i + 1 : -1,
            y > 0 ? i - cols : -1,
            y < rows - 1 ? i + cols : -1,
          ];
          for (const j of neighbors) {
            if (j < 0) continue;
            const m = nodes[j];
            const restX = n.ox - m.ox;
            const restY = n.oy - m.oy;
            const dx = n.x - m.x - restX;
            const dy = n.y - m.y - restY;
            n.vx -= dx * k;
            n.vy -= dy * k;
          }
          n.vx *= damp;
          n.vy *= damp;
          n.x += n.vx;
          n.y += n.vy;
        }
      }

      ctx.strokeStyle = "rgba(22,20,18,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const n = nodes[i];
          if (x < cols - 1) {
            const m = nodes[i + 1];
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
          }
          if (y < rows - 1) {
            const m = nodes[i + cols];
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
          }
        }
      }
      ctx.stroke();

      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = "#161412";
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", layout);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
    };
  }, [live]);

  return (
    <section ref={root} className="room springs" id="springs">
      <canvas ref={canvasRef} className="room-canvas" />
      <div className="room-copy">
        <p className="kicker">Lattice · springs</p>
        <h2 className="display">Pull a node.</h2>
        <p className="lede">The mesh remembers where it was. Drag any joint.</p>
      </div>
    </section>
  );
}
