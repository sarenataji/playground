import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { useInView } from "@/lib/useInView";
import { tintInk } from "@/lib/inkBus";

gsap.registerPlugin(ScrollTrigger);

export function Tunnel() {
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progress = useRef(0);
  const live = useInView(root);

  useEffect(() => {
    if (live) tintInk([0.9, 0.86, 0.78], true);
  }, [live]);

  useGSAP(
    () => {
      if (!root.current || prefersReducedMotion()) return;
      gsap.to(progress, {
        current: 1,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    },
    { scope: root },
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const reducedMotion = prefersReducedMotion();
    const ripples: { x: number; y: number; born: number }[] = [];
    let lastRipple = -Infinity;
    const ripple = (event: PointerEvent) => {
      if (reducedMotion) return;
      const now = performance.now();
      if (now - lastRipple < 70) return;
      lastRipple = now;
      const bounds = canvas.getBoundingClientRect();
      ripples.push({ x: event.clientX - bounds.left, y: event.clientY - bounds.top, born: now });
      if (ripples.length > 12) ripples.shift();
    };
    canvas.addEventListener("pointermove", ripple);
    canvas.addEventListener("pointerdown", ripple);
    let raf = 0;
    const tick = (t: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      // This room stays dark even when embedded in the cream homepage.
      ctx.fillStyle = "#0b0d10";
      ctx.fillRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h * .62;
      const p = progress.current;
      while (ripples.length && t - ripples[0].born > 1800) ripples.shift();
      const rings = 38;
      for (let i = 0; i < rings; i++) {
        const z = ((i / rings + p * 2 + (reducedMotion ? 0 : t * 0.000025)) % 1);
        const scale = 0.04 + z * 1.4;
        const alpha = Math.min(1, z * 1.4) * (1 - z);
        ctx.beginPath();
        const rx = w * .53 * scale;
        const ry = h * .34 * scale;
        for (let step = 0; step <= 240; step++) {
          const angle = step / 240 * Math.PI * 2;
          const x = cx + Math.cos(angle) * rx;
          const y = cy + Math.sin(angle) * ry;
          let displacement = 0;
          for (const wave of ripples) {
            const age = (t - wave.born) / 1000;
            const distance = Math.hypot(x - wave.x, y - wave.y);
            const front = distance - age * 340;
            displacement += Math.sin(front * .055) * Math.exp(-Math.pow(front / 95, 2)) * 19 * Math.pow(1 - age / 1.8, 2);
          }
          const px = x + Math.cos(angle) * displacement;
          const py = y + Math.sin(angle) * displacement;
          if (step === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(243,238,230,${alpha * 0.85})`;
        ctx.lineWidth = 1.2 + (1 - z) * 2;
        ctx.stroke();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", ripple);
      canvas.removeEventListener("pointerdown", ripple);
    };
  }, []);

  return (
    <section ref={root} className="room tunnel" id="tunnel">
      <canvas ref={canvasRef} className="room-canvas" aria-hidden="true" />
      <div className="room-copy invert">
        <p className="kicker invert">Depth without hurry</p>
        <h2 className="display">There is no destination.</h2>
        <p className="lede invert">Move across the rings to send a ripple. Scroll to drift through. You are already where you need to be.</p>
      </div>
    </section>
  );
}
