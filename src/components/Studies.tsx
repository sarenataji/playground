import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

const studies = [
  {
    n: "01",
    title: "Frost gate",
    tag: "Zero",
    body: "Gesture as door. Signed winding, roundness, closure — then a melt from the centroid.",
  },
  {
    n: "02",
    title: "Blob crop",
    tag: "Lando",
    body: "Metaballs decide what you see. The stamp tilts with the pointer. Type is a crop, not a box.",
  },
  {
    n: "03",
    title: "Liquid wipe",
    tag: "Slosh",
    body: "Ink climbs the viewport as you scroll. The next room is behind the meniscus.",
  },
  {
    n: "04",
    title: "Ink table",
    tag: "Function",
    body: "A GPU fluid you can play. Drag to paint, click to dump, type ink for a flood.",
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
        <p className="kicker">Rooms in the playground</p>
        <h2 className="display">Hold a study to open it.</h2>
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
