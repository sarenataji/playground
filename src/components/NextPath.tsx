import { nextRoom } from "@/lib/rooms";
import { usePath } from "@/lib/path";

export function NextPath() {
  const path = usePath();
  const next = nextRoom(path);
  return (
    <nav className="next-path" aria-label="Next room">
      <a href={next.path} className="next-path-link">
        <span className="next-swatch" style={{ background: next.accent }} />
        <span>
          <span className="kicker">Continue</span>
          <strong>{next.name}</strong>
        </span>
        <span className="next-arrow" aria-hidden>
          →
        </span>
      </a>
    </nav>
  );
}
