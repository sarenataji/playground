import { useEffect, useRef } from "react";
import { InkFluid } from "@/webgl/fluid";
import { isOverTable, setInk } from "@/lib/inkBus";
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

    const point = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      return {
        x: (e.clientX - rect.left) / w,
        y: (e.clientY - rect.top) / h,
      };
    };

    const onMove = (e: PointerEvent) => {
      const { x, y } = point(e);
      const now = performance.now();
      const dt = Math.max(8, now - last.t);
      const dx = (e.clientX - last.x) / dt;
      const dy = (e.clientY - last.y) / dt;
      last.x = e.clientX;
      last.y = e.clientY;
      last.t = now;
      const boost = isOverTable() ? 1.8 : 0.7;
      fluid.splatRadius = isOverTable() ? 0.00055 : 0.00022;
      fluid.splat(x, y, dx * 0.35, dy * 0.35, boost);
    };

    const onDown = (e: PointerEvent) => {
      if (!isOverTable()) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const { x, y } = point(e);
      fluid.dump(x, y);
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
