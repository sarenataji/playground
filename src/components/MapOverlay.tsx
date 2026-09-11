import { useEffect } from "react";
import { RoomGrid } from "./RoomGrid";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function MapOverlay({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="map-overlay" role="dialog" aria-label="Rooms">
      <div className="map-overlay-bar">
        <p className="kicker">Choose a room</p>
        <button type="button" className="text-btn" onClick={onClose}>
          Close
        </button>
      </div>
      <RoomGrid />
    </div>
  );
}
