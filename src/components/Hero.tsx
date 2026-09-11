import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";
import { Stamp } from "./Stamp";
import { BlobField } from "@/webgl/blob";
import { pointer } from "@/lib/pointer";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(SplitText, useGSAP);

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const blobRef = useRef<HTMLCanvasElement>(null);

  useGSAP(
    () => {
      if (!root.current || prefersReducedMotion()) return;
      document.fonts.ready.then(() => {
        const split = SplitText.create(".hero-line", {
          type: "chars",
          charsClass: "char",
        });
        gsap.from(split.chars, {
          yPercent: 110,
          rotateZ: 4,
          opacity: 0,
          stagger: 0.018,
          duration: 1.15,
          ease: "power4.out",
        });
      });
      gsap.from(".stamp", {
        scale: 0.6,
        opacity: 0,
        duration: 1,
        ease: "back.out(1.6)",
        delay: 0.45,
      });
      gsap.fromTo(
        ".hero-arrow path",
        { strokeDashoffset: 80 },
        { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut", delay: 0.9 },
      );
    },
    { scope: root },
  );

  useEffect(() => {
    const canvas = blobRef.current;
    if (!canvas || prefersReducedMotion()) return;
    const field = new BlobField(canvas, 5);
    let raf = 0;
    const tick = (t: number) => {
      field.setMouse(pointer.nx, pointer.ny);
      field.draw(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      field.destroy();
    };
  }, []);

  return (
    <section ref={root} className="hero" id="top">
      <canvas ref={blobRef} className="hero-blob" aria-hidden />
      <p className="kicker">You can put the thoughts down</p>
      <h1 className="hero-title">
        <span className="hero-line">Leave the</span>
        <span className="hero-row">
          <span className="hero-line play-word">thoughts</span>
          <Stamp />
        </span>
        <span className="hero-row of-row">
          <span className="hero-line">outside</span>
          <svg className="hero-arrow" viewBox="0 0 48 72" fill="none" aria-hidden>
            <path
              d="M24 4 C18 22, 32 34, 22 52"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              pathLength={80}
              style={{ strokeDasharray: 80 }}
            />
            <path
              d="M14 46 L22 54 L30 42"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={80}
              style={{ strokeDasharray: 80 }}
            />
          </svg>
        </span>
      </h1>
      <p className="hero-lede">
        This is a safe place. Motion will keep you company. Words will move so
        your mind does not have to.
      </p>
    </section>
  );
}
