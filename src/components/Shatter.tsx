import { useEffect, useRef, useState } from "react";
import { tintInk } from "@/lib/inkBus";
import { useInView } from "@/lib/useInView";

// Keep the existing export and anchor for the playground and /release route.
export function Shatter() {
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const holding = useRef(false);
  const released = useRef(false);
  const live = useInView(root);
  const [held, setHeld] = useState(false);
  const [hasReleased, setHasReleased] = useState(false);

  const release = () => {
    if (!holding.current) return;
    holding.current = false;
    released.current = true;
    setHeld(false);
    setHasReleased(true);
  };
  const gather = () => {
    holding.current = true;
    setHeld(true);
  };

  useEffect(() => {
    if (live) tintInk([0.24, 0.13, 0.09]);
    else release();
  }, [live]);

  useEffect(() => {
    window.addEventListener("blur", release);
    const onVisibility = () => { if (document.hidden) release(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", release);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !live) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let previous = 0;
    let time = 0;
    let openness = released.current ? 1 : 0.22;
    let width = 0;
    let height = 0;
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
      const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
      previous = now;
      if (!motion.matches) time += dt;
      const target = holding.current ? 0 : released.current ? 1 : 0.22;
      openness = motion.matches ? target : openness + (target - openness) * (1 - Math.exp(-dt * (holding.current ? 2.8 : 1.3)));
      ctx.clearRect(0, 0, width, height);
      const scale = Math.min(width / 720, height / 600);
      const cx = width * 0.5;
      const cy = height * 0.49;
      // Each strand interpolates from a coiled path to a broad, open curve.
      // Holding only gathers; opening is triggered by the act of release.
      for (let strand = 0; strand < 9; strand++) {
        const phase = strand * 0.31;
        ctx.beginPath();
        for (let step = 0; step <= 240; step++) {
          const u = step / 240;
          const angle = u * Math.PI * 5.2 + phase;
          const breath = Math.sin(time * 0.28 + phase) * 5;
          const radius = 100 + 37 * Math.sin(u * Math.PI) + strand * 3 + breath;
          const knotX = Math.sin(angle) * radius + Math.sin(angle * 1.7 + phase) * 29;
          const knotY = Math.cos(angle * 0.79 + phase) * radius * 0.95;
          const openX = (u - 0.5) * 560;
          const openY = Math.sin(u * Math.PI * 1.65 + phase * 0.35 + time * 0.08) * 66 + (strand - 4) * 14 + Math.sin(u * Math.PI * 3 + phase) * 17;
          const x = cx + (knotX * (1 - openness) + openX * openness) * scale;
          const y = cy + (knotY * (1 - openness) + openY * openness) * scale;
          if (step === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = strand % 3 === 0 ? "rgba(145, 85, 58, 0.48)" : `rgba(64, 47, 39, ${0.42 + (strand % 3) * 0.12})`;
        ctx.lineWidth = (strand % 3 === 0 ? 1.2 : 1.65) * Math.max(0.7, scale);
        ctx.lineCap = "round";
        ctx.stroke();
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [live]);

  const pointerHandlers = {
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      gather();
    },
    onPointerUp: release,
    onPointerCancel: release,
    onLostPointerCapture: release,
    onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        if (!event.repeat) gather();
      }
    },
    onKeyUp: (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === " " || event.key === "Enter") { event.preventDefault(); release(); }
    },
    onBlur: release,
    // Assistive technology may activate a button without pointer/key events.
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
      if (event.detail === 0 && !released.current && !holding.current) { gather(); release(); }
    },
  };

  return (
    <section ref={root} className="room shatter loosen" id="shatter">
      <div className="room-copy loosen-copy">
        <p className="kicker">A little less holding</p>
        <h2 className="display">Let it<br />loosen.</h2>
        <p className="lede">Press and hold the thread.<br />Release, and watch it make room.</p>
        <button type="button" className="loosen-hold" {...pointerHandlers} aria-label="Hold to gather the thread, release to loosen">
          <span className={`loosen-dot${held ? " is-held" : ""}`} aria-hidden="true" />
          {held ? "Let go when you’re ready" : "Hold the thread"}
        </button>
        <p className="loosen-note" aria-live="polite">{held ? "Just a little holding." : hasReleased ? "Room to move. You can try again." : "No right pace. Nothing to finish."}</p>
      </div>
      <button type="button" className="loosen-stage" {...pointerHandlers} aria-label="Ink thread: hold to gather, release to loosen">
        <canvas ref={canvasRef} aria-hidden="true" />
        <span className="loosen-caption" aria-hidden="true">{held ? "gathering" : hasReleased ? "loosening" : "hold · release · explore"}</span>
      </button>
    </section>
  );
}
