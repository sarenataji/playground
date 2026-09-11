import { tintInk } from "@/lib/inkBus";
import type { Room } from "@/lib/rooms";

export function applyTheme(room: Room) {
  const root = document.documentElement;
  root.dataset.room = room.id;
  root.style.setProperty("--paper", room.paper);
  root.style.setProperty("--ink", room.ink);
  root.style.setProperty("--dust", room.dust);
  root.style.setProperty("--accent", room.accent);
  root.style.setProperty("--bloom", room.bloom);
  root.style.setProperty("--sky", room.sky);
  document.body.style.background = room.paper;
  document.body.style.color = room.ink;
  document.title = `${room.name} · Sarena`;
  tintInk(room.inkRgb, room.invert);
}

export function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
