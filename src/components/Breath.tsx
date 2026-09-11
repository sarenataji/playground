import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

const MOTES = Array.from({ length: 14 }, (_, i) => ({
  left: `${8 + ((i * 17) % 84)}%`,
  top: `${12 + ((i * 23) % 70)}%`,
  delay: `${(i * 0.45) % 8}s`,
  size: `${6 + (i % 4) * 3}px`,
}));

export function Breath() {
  const [phase, setPhase] = useState<"in" | "out">("in");
  const reduced = prefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const next = (now - start) % 8000 < 4000 ? "in" : "out";
      setPhase((p) => (p === next ? p : next));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return (
    <section className="breath" id="breathe">
      <div className="room-copy">
        <p className="kicker">A living room</p>
        <h2 className="display">Breathe until you feel here.</h2>
        <p className="lede">
          The circle is already alive. Match it. In, then out. Nothing else is
          required.
        </p>
      </div>
      <div className="breath-stage well" aria-live="polite">
        {MOTES.map((m, i) => (
          <i
            key={i}
            className="mote"
            style={{
              left: m.left,
              top: m.top,
              width: m.size,
              height: m.size,
              animationDelay: m.delay,
            }}
          />
        ))}
        <div className={`lung${reduced ? " is-still" : ""}`}>
          <span className="lung-word">{phase === "in" ? "In" : "Out"}</span>
        </div>
      </div>
    </section>
  );
}
