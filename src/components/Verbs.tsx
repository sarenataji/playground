import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

const verbs = [
  {
    from: "Zero",
    verb: "Draw",
    copy: "A closed loop unlocks the room. Frost spreads from the stroke, then melts. Hold gates later in the scroll pause the story until you mean it.",
  },
  {
    from: "Lando",
    verb: "Blob",
    copy: "Organic masks, pointer-tracked 3D, and a drawn signature. The crop is the identity — circles and metaballs instead of rectangles.",
  },
  {
    from: "Slosh",
    verb: "Slosh",
    copy: "The product is the medium. Ink fills the page, rides your cursor, and becomes a table you can actually paint on.",
  },
];

export function Verbs() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion() || !root.current) return;
      gsap.from(".verb-card", {
        y: 48,
        opacity: 0,
        stagger: 0.12,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 75%" },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="verbs" id="system">
      <p className="kicker">Three verbs, one material</p>
      <div className="verb-grid">
        {verbs.map((v) => (
          <article key={v.verb} className="verb-card">
            <p className="verb-from">{v.from}</p>
            <h2>{v.verb}</h2>
            <p>{v.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
