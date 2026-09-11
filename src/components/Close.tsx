import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

export function Close() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!root.current || prefersReducedMotion()) return;
      gsap.fromTo(
        ".sig-path",
        { strokeDashoffset: 480 },
        {
          strokeDashoffset: 0,
          duration: 1.8,
          ease: "power2.inOut",
          scrollTrigger: { trigger: root.current, start: "top 70%" },
        },
      );
    },
    { scope: root },
  );

  return (
    <footer ref={root} className="close" id="close">
      <p className="kicker">The thoughts can stay outside</p>
      <p className="display close-title">You can come back.</p>
      <svg className="signature" viewBox="0 0 420 140" fill="none" aria-label="Sarena">
        <path
          className="sig-path"
          d="M20 90 C 40 40, 80 40, 90 88 C 98 128, 70 120, 78 80 C 110 20, 170 30, 190 86 C 200 118, 230 40, 270 70 C 300 94, 320 40, 360 78 C 380 96, 400 88, 408 72"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={480}
          style={{ strokeDasharray: 480 }}
        />
      </svg>
      <p className="close-note">
        This room will be here. Come rest whenever the mind is loud.
      </p>
    </footer>
  );
}
