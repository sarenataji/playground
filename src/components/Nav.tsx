import { useEffect, useRef, useState } from "react";
import { usePath } from "@/lib/path";
import { roomByPath } from "@/lib/rooms";
import { MapOverlay } from "./MapOverlay";
import "./liquid-nav.css";

const ROOM_LINKS = [
  { href: "/witness", label: "Witness" },
  { href: "/practice", label: "Practice" },
  { href: "/rooms", label: "Rooms" },
  { href: "/breathe", label: "Breathe" },
  { href: "/dawn", label: "Dawn" },
  { href: "/pond", label: "Pond" },
  { href: "/ink", label: "Ink" },
];

export function Nav() {
  const path = usePath();
  const [expanded, setExpanded] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const onHome = path === "/" || path === "/playground";

  useEffect(() => {
    setMapOpen(false);
    setExpanded(false);
  }, [path]);

  useEffect(() => {
    if (!expanded) return;
    const startY = window.scrollY;
    const onOutside = (event: PointerEvent) => {
      if (!panel.current?.contains(event.target as Node)) setExpanded(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpanded(false);
        toggle.current?.focus();
      }
    };
    const onScroll = () => {
      if (Math.abs(window.scrollY - startY) > 35) {
        if (panel.current?.contains(document.activeElement)) toggle.current?.focus({ preventScroll: true });
        setExpanded(false);
      }
    };
    document.addEventListener("pointerdown", onOutside);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onOutside);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, [expanded]);

  useEffect(() => {
    let frame = 0;
    const updateContrast = () => {
      frame = 0;
      const button = toggle.current;
      if (!button) return;
      let dark = roomByPath(path).invert;
      const entrance = document.querySelector('.windows-threshold');
      const exit = document.querySelector('.windows-end');
      if (entrance && exit) {
        const start = entrance.getBoundingClientRect();
        const end = exit.getBoundingClientRect();
        const bounds = button.getBoundingClientRect();
        const y = bounds.top + bounds.height / 2;
        dark = y > start.top + start.height * .54 && y < end.top + end.height * .46;
      }
      button.style.setProperty('--signature-ink', dark ? '#edf4eb' : '#263e3d');
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(updateContrast); };
    updateContrast();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('journey:ready', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('journey:ready', schedule);
    };
  }, [path]);

  if (onHome) {
    return (
      <header className="nav">
        <a className="nav-mark" href="#top">
          Sarena
        </a>
        <nav>
          <a href="#system">Rest</a>
          <a href="#shatter">Motion</a>
          <a href="#play">Touch</a>
          <a href="/rooms">Rooms</a>
          <a href="/witness">Witness</a>
          <a href="/practice">Practice</a>
        </nav>
      </header>
    );
  }

  return (
    <>
      <div className="liquid-nav-space" aria-hidden="true" />
      <header ref={panel} className={`liquid-nav${expanded ? " is-expanded" : ""}`}
        onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setExpanded(false); }}>
        <button ref={toggle} type="button" className="liquid-nav-toggle" aria-expanded={expanded}
          aria-controls="sarena-navigation" aria-label={expanded ? "Close navigation" : "Sarena — open navigation"}
          onClick={() => setExpanded(value => !value)}>
          <span>Sarena</span><i aria-hidden="true"><b /><b /></i>
        </button>
        <div className="liquid-nav-reveal" inert={!expanded}>
          <nav id="sarena-navigation" aria-label="Main navigation" aria-hidden={!expanded}>
            <div className="liquid-nav-links">
              <a href="/" onClick={() => setExpanded(false)}>Home <span>↗</span></a>
              {ROOM_LINKS.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setExpanded(false)} aria-current={path === l.href || (l.href === "/practice" && path.startsWith("/practice/")) ? "page" : undefined}>
                  {l.label}<span>{path === l.href ? "●" : "↗"}</span>
                </a>
              ))}
            </div>
            <button type="button" className="liquid-nav-map" onClick={() => { setExpanded(false); setMapOpen(true); }}>Room map <span>↗</span></button>
          </nav>
        </div>
      </header>
      <MapOverlay open={mapOpen} onClose={() => setMapOpen(false)} />
    </>
  );
}
