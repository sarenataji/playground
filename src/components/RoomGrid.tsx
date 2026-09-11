import { destinations, type Room } from "@/lib/rooms";

export function RoomGrid({ rooms = destinations }: { rooms?: Room[] }) {
  return (
    <div className="room-grid">
      {rooms.map((r) => (
        <a
          key={r.id}
          href={r.path}
          className={`room-tile room-tile--${r.id}${r.invert ? " is-invert" : ""}`}
          style={{
            background: r.paper,
            color: r.ink,
            ["--tile-accent" as string]: r.accent,
            ["--tile-bloom" as string]: r.bloom,
          }}
        >
          <span className="kicker">{r.verb}</span>
          <h3>{r.name}</h3>
          <p>{r.note}</p>
          <i className="room-tile-wash" />
        </a>
      ))}
    </div>
  );
}
