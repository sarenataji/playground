import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, type PointerEvent } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { useInView } from "@/lib/useInView";
import { tintInk } from "@/lib/inkBus";

gsap.registerPlugin(ScrollTrigger);

const REST_RADIUS = "46% 38% 44% 36% / 36% 44% 34% 48%";
const SQUISH_RADIUS = "40% 50% 36% 52% / 52% 34% 50% 38%";

function pokePanel(el: HTMLElement, clientX: number, clientY: number) {
  if (prefersReducedMotion()) return;
  const box = el.getBoundingClientRect();
  const nx = (clientX - box.left) / box.width - 0.5;
  const ny = (clientY - box.top) / box.height - 0.5;
  const letters = el.querySelectorAll<HTMLElement>(".corridor-letter");
  const bloom = el.querySelector<HTMLElement>(".corridor-bloom");
  const parent = el.parentElement;
  const siblings = parent ? ([...parent.children].filter((n) => n !== el) as HTMLElement[]) : [];

  gsap.killTweensOf([el, bloom, ...letters, ...siblings].filter(Boolean));
  gsap.set(el, { scale: 1 });

  if (bloom) {
    gsap.set(bloom, {
      left: `${((nx + 0.5) * 100).toFixed(2)}%`,
      top: `${((ny + 0.5) * 100).toFixed(2)}%`,
      xPercent: -50,
      yPercent: -50,
    });
    gsap.fromTo(
      bloom,
      { scale: 0.15, opacity: 0.55 },
      { scale: 2.6, opacity: 0, duration: 0.78, ease: "power2.out" },
    );
  }

  gsap.fromTo(
    el,
    {
      scaleX: 0.9 + Math.abs(ny) * 0.05,
      scaleY: 0.86 + Math.abs(nx) * 0.05,
      rotate: nx * 7,
      x: nx * 22,
      y: ny * 16,
      borderRadius: SQUISH_RADIUS,
      filter: "brightness(1.08)",
    },
    {
      scaleX: 1,
      scaleY: 1,
      rotate: 0,
      x: 0,
      y: 0,
      borderRadius: REST_RADIUS,
      filter: "brightness(1)",
      duration: 1.12,
      ease: "elastic.out(1, 0.4)",
    },
  );

  if (letters.length) {
    gsap.fromTo(
      letters,
      { y: -22 + ny * 10, rotate: nx * 12, scale: 1.06 },
      {
        y: 0,
        rotate: 0,
        scale: 1,
        duration: 0.95,
        stagger: { each: 0.04, from: nx > 0 ? "end" : "start" },
        ease: "elastic.out(1, 0.46)",
      },
    );
  }

  siblings.forEach((sib) => {
    const away = sib.getBoundingClientRect().left > box.left ? 1 : -1;
    gsap.fromTo(
      sib,
      { rotate: away * 2.4, y: 6 },
      { rotate: 0, y: 0, duration: 0.95, ease: "elastic.out(1, 0.55)" },
    );
  });
}

function panelPointerDown(e: PointerEvent<HTMLElement>) {
  if (e.button !== 0) return;
  e.currentTarget.setPointerCapture(e.pointerId);
  e.currentTarget.dataset.pokeX = String(e.clientX);
  e.currentTarget.dataset.pokeY = String(e.clientY);
  if (prefersReducedMotion()) return;
  gsap.to(e.currentTarget, {
    scaleX: 0.97,
    scaleY: 0.95,
    duration: 0.12,
    ease: "power2.out",
    overwrite: "auto",
  });
}

function panelPointerUp(e: PointerEvent<HTMLElement>) {
  const startX = Number(e.currentTarget.dataset.pokeX ?? e.clientX);
  const startY = Number(e.currentTarget.dataset.pokeY ?? e.clientY);
  if (Math.hypot(e.clientX - startX, e.clientY - startY) > 18) {
    gsap.to(e.currentTarget, { scaleX: 1, scaleY: 1, duration: 0.2, overwrite: "auto" });
    return;
  }
  pokePanel(e.currentTarget, e.clientX, e.clientY);
}

const panels = [
  { title: "Enough", note: "You already are", tone: "#d5e4d6", ink: "#1a221c" },
  { title: "Quiet", note: "Thoughts can wait", tone: "#d3e0ea", ink: "#1a221c" },
  { title: "Held", note: "Nothing to prove", tone: "#f0c8b4", ink: "#2a2018" },
  { title: "Stay", note: "There is time", tone: "#1d2433", ink: "#f3eee6" },
  { title: "Alive", note: "Color is a pulse", tone: "#cfe3dc", ink: "#16332c" },
  { title: "Home", note: "Everything is connected", tone: "#efe4cc", ink: "#2a2214" },
];

const classicPanels = [
  { title: "Enough", note: "You already are", tone: "#ebe4d8", ink: "#161412" },
  { title: "Quiet", note: "Thoughts can wait", tone: "#d9cfc0", ink: "#161412" },
  { title: "Held", note: "Nothing to prove", tone: "#c45c26", ink: "#f3eee6" },
  { title: "Stay", note: "There is time", tone: "#1c1714", ink: "#f3eee6" },
  { title: "Home", note: "Everything is connected", tone: "#e8e2d6", ink: "#161412" },
];

export function Corridor({ classic = false }: { classic?: boolean }) {
  const root = useRef<HTMLElement>(null);
  const live = useInView(root);

  useEffect(() => {
    if (live) tintInk([0.09, 0.07, 0.05], true);
  }, [live]);

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
          {(classic ? classicPanels : panels).map((p) => (
            <article
              key={p.title}
              className="corridor-panel"
              style={{ background: p.tone, color: p.ink }}
              role="button"
              tabIndex={0}
              aria-label={`${p.title}. ${p.note}`}
              onPointerDown={panelPointerDown}
              onPointerUp={panelPointerUp}
              onPointerCancel={(e) => {
                gsap.to(e.currentTarget, { scaleX: 1, scaleY: 1, duration: 0.2, overwrite: "auto" });
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                const box = e.currentTarget.getBoundingClientRect();
                pokePanel(e.currentTarget, box.left + box.width * 0.5, box.top + box.height * 0.72);
              }}
            >
              <i className="corridor-bloom" aria-hidden />
              <p className="kicker">{p.note}</p>
              <h3>
                {[...p.title].map((ch, i) => (
                  <span key={`${p.title}-${i}`} className="corridor-letter">
                    {ch}
                  </span>
                ))}
              </h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
