import { useEffect, useState } from "react";
import { usePath } from "@/lib/path";
import { roomByPath } from "@/lib/rooms";
import { MapOverlay } from "./MapOverlay";

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
  const room = roomByPath(path);
  const [mapOpen, setMapOpen] = useState(false);
  const onHome = path === "/" || path === "/playground";

  useEffect(() => {
    setMapOpen(false);
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
      <header className={`nav${room.invert ? " is-invert" : ""}`}>
        <a className="nav-mark" href="/">
          Sarena
        </a>
        <nav>
          {ROOM_LINKS.map((l) => (
            <a key={l.href} href={l.href} aria-current={path === l.href || (l.href === "/practice" && path.startsWith("/practice/")) ? "page" : undefined}>
              {l.label}
            </a>
          ))}
          <button type="button" className="nav-map-btn" onClick={() => setMapOpen(true)}>
            Map
          </button>
        </nav>
      </header>
      <MapOverlay open={mapOpen} onClose={() => setMapOpen(false)} />
    </>
  );
}
