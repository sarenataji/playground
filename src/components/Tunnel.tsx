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
    if (live) tintInk([0.9, 0.86, 0.78]);
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

    let raf = 0;
    const tick = (t: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--paper").trim() || "#0b0d10";
      ctx.fillRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const p = progress.current;
      const rings = 28;
      for (let i = 0; i < rings; i++) {
        const z = ((i / rings + p * 2 + t * 0.00004) % 1);
        const scale = 0.04 + z * 1.4;
        const alpha = Math.min(1, z * 1.4) * (1 - z);
        ctx.beginPath();
        ctx.ellipse(cx, cy, w * 0.18 * scale, h * 0.12 * scale, 0, 0, Math.PI * 2);
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
    };
  }, []);

  return (
    <section ref={root} className="room tunnel" id="tunnel">
      <canvas ref={canvasRef} className="room-canvas well" />
      <div className="room-copy invert">
        <p className="kicker invert">Depth without hurry</p>
        <h2 className="display">There is no destination.</h2>
        <p className="lede invert">Wheel through the rings. You are already where you need to be.</p>
      </div>
    </section>
  );
}
