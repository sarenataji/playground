import { useEffect, useState } from "react";
import { usePath } from "@/lib/path";
import { roomByPath } from "@/lib/rooms";
import { MapOverlay } from "./MapOverlay";

const LINKS = [
  { href: "/playground", label: "Playground" },
  { href: "/breathe", label: "Breathe" },
  { href: "/dawn", label: "Dawn" },
  { href: "/pond", label: "Pond" },
  { href: "/ink", label: "Ink" },
];

export function Nav() {
  const path = usePath();
  const room = roomByPath(path);
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    setMapOpen(false);
  }, [path]);

  return (
    <>
      <header className={`nav${room.invert ? " is-invert" : ""}`}>
        <a className="nav-mark" href="/">
          Sarena
        </a>
        <nav>
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined}>
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
