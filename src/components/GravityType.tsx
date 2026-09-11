import { useEffect, useRef } from "react";
import { pointer } from "@/lib/pointer";
import { prefersReducedMotion } from "@/lib/motion";
import { useInView } from "@/lib/useInView";
import { tintInk } from "@/lib/inkBus";

type Body = {
  el: HTMLSpanElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  w: number;
  h: number;
};

const WORD = ["P", "E", "A", "C", "E"];

export function GravityType() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const live = useInView(root);

  useEffect(() => {
    if (live) tintInk([0.09, 0.07, 0.05]);
  }, [live]);

  useEffect(() => {
    const stageEl = stage.current;
    if (!stageEl || prefersReducedMotion()) return;
    const letters = [...stageEl.querySelectorAll<HTMLSpanElement>(".g-letter")];
    const bodies: Body[] = letters.map((el, i) => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      return {
        el,
        x: 40 + i * (stageEl.clientWidth / WORD.length) * 0.85,
        y: 40 + Math.random() * 30,
        vx: (Math.random() - 0.5) * 2,
        vy: 0,
        rot: (Math.random() - 0.5) * 0.2,
        vr: 0,
        w,
        h,
      };
    });

    let raf = 0;
    let dragging: Body | null = null;
    let lx = 0;
    let ly = 0;

    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      dragging = bodies.find((b) => b.el === t) ?? null;
      if (dragging) {
        dragging.el.setPointerCapture(e.pointerId);
        lx = e.clientX;
        ly = e.clientY;
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      dragging.x += e.clientX - lx;
      dragging.y += e.clientY - ly;
      dragging.vx = (e.clientX - lx) * 0.6;
      dragging.vy = (e.clientY - ly) * 0.6;
      lx = e.clientX;
      ly = e.clientY;
    };
    const onUp = () => {
      dragging = null;
    };

    stageEl.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    const tick = () => {
      if (!live) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const W = stageEl.clientWidth;
      const H = stageEl.clientHeight;
      const mx = pointer.nx * W;
      const my = pointer.ny * H;

      for (const b of bodies) {
        if (dragging !== b) {
          b.vy += 0.55;
          const dx = b.x + b.w / 2 - mx;
          const dy = b.y + b.h / 2 - my;
          const d = Math.hypot(dx, dy) || 1;
          if (d < 140) {
            b.vx += (dx / d) * 0.35;
            b.vy += (dy / d) * 0.15;
          }
          b.x += b.vx;
          b.y += b.vy;
          b.rot += b.vr;
          b.vx *= 0.99;
          b.vr *= 0.99;
        }

        if (b.x < 0) {
          b.x = 0;
          b.vx *= -0.62;
          b.vr += 0.04;
        }
        if (b.x + b.w > W) {
          b.x = W - b.w;
          b.vx *= -0.62;
          b.vr -= 0.04;
        }
        if (b.y + b.h > H) {
          b.y = H - b.h;
          b.vy *= -0.58;
          b.vr += b.vx * 0.01;
        }
        if (b.y < 0) {
          b.y = 0;
          b.vy *= -0.4;
        }

        b.el.style.transform = `translate(${b.x}px, ${b.y}px) rotate(${b.rot}rad)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      stageEl.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [live]);

  return (
    <section ref={root} className="room gravity" id="gravity">
      <div className="room-copy">
        <p className="kicker">Letters that can rest</p>
        <h2 className="display">Let the word find the floor.</h2>
        <p className="lede">Drag a letter. The others will settle when they are ready.</p>
      </div>
      <div ref={stage} className="gravity-stage">
        {WORD.map((ch, i) => (
          <span key={i} className="g-letter" style={{ transform: `translate(${40 + i * 72}px, 36px)` }}>
            {ch}
          </span>
        ))}
      </div>
    </section>
  );
}
