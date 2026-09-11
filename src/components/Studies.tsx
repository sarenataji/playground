import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

const studies = [
  {
    n: "01",
    title: "The door",
    tag: "Heart",
    body: "A heart is enough to enter. Frost listens, then yields. You do not have to knock twice.",
  },
  {
    n: "02",
    title: "The crop",
    tag: "Soft",
    body: "The world arrives in round shapes, not boxes. Edges that breathe so the mind can too.",
  },
  {
    n: "03",
    title: "The wash",
    tag: "Ink",
    body: "Ink rises so you can sink. The next room is already wet, already waiting.",
  },
  {
    n: "04",
    title: "The table",
    tag: "Play",
    body: "Paint without a purpose. Flood the page if you want. There is no wrong mark here.",
  },
];

export function Studies() {
  const root = useRef<HTMLElement>(null);
  const [held, setHeld] = useState<string | null>(null);
  const holdRef = useRef(0);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !root.current) return;
      gsap.from(".study", {
        clipPath: "inset(12% 8% 12% 8% round 40% 40% 40% 40%)",
        opacity: 0.4,
        stagger: 0.1,
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="studies" id="studies">
      <div className="section-head">
        <p className="kicker">Rooms that wait for you</p>
        <h2 className="display">Hold a room until it opens.</h2>
      </div>
      <div className="study-grid">
        {studies.map((s) => (
          <article
            key={s.n}
            className={`study${held === s.n ? " is-open" : ""}`}
            onPointerDown={() => {
              window.clearTimeout(holdRef.current);
              holdRef.current = window.setTimeout(() => setHeld(s.n), 420);
            }}
            onPointerUp={() => window.clearTimeout(holdRef.current)}
            onPointerLeave={() => window.clearTimeout(holdRef.current)}
            onClick={() => setHeld(s.n)}
          >
            <header>
              <span>{s.n}</span>
              <span className="study-tag">{s.tag}</span>
            </header>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
            <i className="study-blob" />
          </article>
        ))}
      </div>
    </section>
  );
}
