import { dist } from "./motion";

export type Point = { x: number; y: number };

/** Zero-style closed-loop test, loosened so a human circle still unlocks. */
export function isClosedLoop(points: Point[]): boolean {
  if (points.length < 18) return false;

  let cx = 0;
  let cy = 0;
  for (const p of points) {
    cx += p.x;
    cy += p.y;
  }
  cx /= points.length;
  cy /= points.length;

  const radii = points.map((p) => dist(p.x, p.y, cx, cy));
  const mean = radii.reduce((a, b) => a + b, 0) / radii.length;
  if (mean < 28) return false;

  const variance =
    radii.reduce((a, r) => a + (r - mean) ** 2, 0) / radii.length;
  const cv = Math.sqrt(variance) / mean;

  const closed = dist(points[0].x, points[0].y, points.at(-1)!.x, points.at(-1)!.y);
  const wound = Math.abs(signedAngle(points, cx, cy));

  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += dist(points[i].x, points[i].y, points[i - 1].x, points[i - 1].y);
  }

  return (
    wound > 4.2 &&
    cv < 0.55 &&
    closed < mean * 0.65 &&
    length > mean * 3.4
  );
}

function signedAngle(points: Point[], cx: number, cy: number) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = Math.atan2(points[i - 1].y - cy, points[i - 1].x - cx);
    const b = Math.atan2(points[i].y - cy, points[i].x - cx);
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    total += d;
  }
  return total;
}
