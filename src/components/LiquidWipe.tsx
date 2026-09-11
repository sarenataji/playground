import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

export function LiquidWipe() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!root.current || prefersReducedMotion()) return;
      gsap.fromTo(
        ".wipe-fill",
        { yPercent: 110 },
        {
          yPercent: 0,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
      gsap.to(".wipe-wave", {
        xPercent: 12,
        scrollTrigger: {
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="wipe" id="wipe" aria-hidden={false}>
      <div className="wipe-fill">
        <svg className="wipe-wave" viewBox="0 0 1200 160" preserveAspectRatio="none">
          <path
            fill="#161412"
            d="M0 80 C 150 20, 300 140, 450 80 S 750 20, 900 90 1050 150, 1200 70 V160 H0 Z"
          />
        </svg>
        <div className="wipe-body">
          <p className="kicker invert">Slosh · liquid fill</p>
          <p className="wipe-copy">
            The screen fills with ink. Under it, the table is already wet.
          </p>
        </div>
      </div>
    </section>
  );
}
