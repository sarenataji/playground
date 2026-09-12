import { useEffect, useRef } from "react";
import { InkFluid } from "@/webgl/fluid";
import { getStampObstacle, isOverTable, recordInkPoint, setInk } from "@/lib/inkBus";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";

export function InkLayer({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !active || prefersReducedMotion()) return;

    let fluid: InkFluid;
    try {
      fluid = new InkFluid(canvas);
    } catch {
      return;
    }
    setInk(fluid);

    const last = { x: 0, y: 0, t: 0 };
    let keys = "";
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      const obstacle = getStampObstacle();
      let cx = e.clientX;
      let cy = e.clientY;
      const now = performance.now();
      const dt = Math.max(8, now - last.t);
      let dx = (e.clientX - last.x) / dt;
      let dy = (e.clientY - last.y) / dt;
      last.x = e.clientX;
      last.y = e.clientY;
      last.t = now;

      // Obstacle barrier: do not allow ink to spawn inside the stamp circle
      if (obstacle) {
        const ox = cx - obstacle.x;
        const oy = cy - obstacle.y;
        const dist = Math.hypot(ox, oy);
        const margin = obstacle.radius + 6;
        if (dist < margin) {
          if (dist > 0.001) {
            // Push splat location outside the circle
            cx = obstacle.x + (ox / dist) * margin;
            cy = obstacle.y + (oy / dist) * margin;
            // Deflect velocity tangentially around the circle
            const nx = ox / dist;
            const ny = oy / dist;
            const vDotN = dx * nx + dy * ny;
            if (vDotN < 0) {
              dx -= nx * vDotN * 1.4;
              dy -= ny * vDotN * 1.4;
            }
          } else {
            // Exactly at center: push to top edge
            cy = obstacle.y - margin;
            dx = 1;
          }
        }
      }

      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      const x = (cx - rect.left) / w;
      const y = (cy - rect.top) / h;

      const boost = isOverTable() ? 1.8 : 0.7;
      fluid.splatRadius = isOverTable() ? 0.00055 : 0.00022;
      fluid.splat(x, y, dx * 0.35, dy * 0.35, boost);
      recordInkPoint(cx, cy, dx, dy, boost);
    };

    const onDown = (e: PointerEvent) => {
      const obstacle = getStampObstacle();
      if (obstacle) {
        const dist = Math.hypot(e.clientX - obstacle.x, e.clientY - obstacle.y);
        if (dist < obstacle.radius) return;
      }
      if (!isOverTable()) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;

      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      const x = (e.clientX - rect.left) / w;
      const y = (e.clientY - rect.top) / h;
      fluid.dump(x, y);
      recordInkPoint(e.clientX, e.clientY, 0, 0, 2);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      keys = (keys + e.key.toLowerCase()).slice(-8);
      if (keys.includes("ink")) {
        fluid.dump(0.5, 0.45);
        keys = "";
      }
    };

    const tick = () => {
      fluid.step();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
      setInk(null);
      fluid.destroy();
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={ref}
      className={`ink-layer${hasFinePointer() ? " ink-layer--cursor" : ""}`}
      aria-hidden
    />
  );
}
