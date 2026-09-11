import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

const panels = [
  { title: "Enough", note: "You already are", tone: "#ebe4d8" },
  { title: "Quiet", note: "Thoughts can wait", tone: "#d9cfc0" },
  { title: "Held", note: "Nothing to prove", tone: "#c45c26" },
  { title: "Stay", note: "There is time", tone: "#1c1714" },
  { title: "Home", note: "Everything is connected", tone: "#e8e2d6" },
];

export function Corridor() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!root.current || prefersReducedMotion()) return;
      const track = root.current.querySelector(".corridor-track");
      if (!track) return;
      gsap.to(track, {
        xPercent: -70,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          pin: true,
          scrub: 0.6,
          end: "+=180%",
          anticipatePin: 1,
        },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="corridor" id="corridor">
      <div className="corridor-pin">
        <div className="corridor-head">
          <p className="kicker invert">Words that walk with you</p>
          <h2 className="display">A hallway of quiet.</h2>
        </div>
        <div className="corridor-track">
          {panels.map((p) => (
            <article
              key={p.title}
              className="corridor-panel"
              style={{ background: p.tone, color: p.tone === "#1c1714" ? "#f3eee6" : "#161412" }}
            >
              <p className="kicker">{p.note}</p>
              <h3>{p.title}</h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
