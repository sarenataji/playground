import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

const verbs = [
  {
    from: "A pause",
    verb: "Rest",
    copy: "Nothing is asked of you. Sit with the motion. Let the page do the thinking for a while.",
  },
  {
    from: "A breath",
    verb: "Soften",
    copy: "Hold, drag, watch things fall. The body of the site is gentle. You do not have to finish anything.",
  },
  {
    from: "A stay",
    verb: "Stay",
    copy: "Ink listens. Letters have weight. A heart opened the door. This room will wait as long as you need.",
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
      <p className="kicker">Three ways to be here</p>
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
