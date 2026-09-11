import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

const panels = [
  { title: "Enough", note: "You already are", tone: "#d5e4d6", ink: "#1a221c" },
  { title: "Quiet", note: "Thoughts can wait", tone: "#d3e0ea", ink: "#1a221c" },
  { title: "Held", note: "Nothing to prove", tone: "#f0c8b4", ink: "#2a2018" },
  { title: "Stay", note: "There is time", tone: "#1d2433", ink: "#f3eee6" },
  { title: "Alive", note: "Color is a pulse", tone: "#cfe3dc", ink: "#16332c" },
  { title: "Home", note: "Everything is connected", tone: "#efe4cc", ink: "#2a2214" },
];

export function Corridor() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!root.current || prefersReducedMotion()) return;
      const track = root.current.querySelector<HTMLElement>(".corridor-track");
      if (!track) return;
      const extra = Math.max(0, track.scrollWidth - window.innerWidth + 80);
      gsap.to(track, {
        x: -extra,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          pin: true,
          scrub: 0.6,
          end: `+=${Math.round(extra + window.innerHeight * 0.6)}`,
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
              style={{ background: p.tone, color: p.ink }}
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
