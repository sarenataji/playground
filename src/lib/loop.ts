import { dist } from "./motion";

export type Point = { x: number; y: number };

/** Closed heart: two upper lobes and a pointed base, loosened for a finger stroke. */
export function isHeart(points: Point[]): boolean {
  if (points.length < 22) return false;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  const w = maxX - minX;
  const h = maxY - minY;
  if (w < 36 || h < 36) return false;
  const aspect = w / h;
  if (aspect < 0.45 || aspect > 1.85) return false;

  const closed = dist(points[0].x, points[0].y, points.at(-1)!.x, points.at(-1)!.y);
  if (closed > Math.min(w, h) * 0.5) return false;

  const midX = (minX + maxX) / 2;
  const lowest = points.reduce((a, p) => (p.y > a.y ? p : a));
  if (Math.abs(lowest.x - midX) > w * 0.38) return false;
  if (lowest.y < minY + h * 0.72) return false;

  let leftTop: Point | null = null;
  let rightTop: Point | null = null;
  for (const p of points) {
    if (p.x < midX) {
      if (!leftTop || p.y < leftTop.y) leftTop = p;
    } else {
      if (!rightTop || p.y < rightTop.y) rightTop = p;
    }
  }
  if (!leftTop || !rightTop) return false;
  if (leftTop.y > minY + h * 0.38 || rightTop.y > minY + h * 0.38) return false;
  if (rightTop.x - leftTop.x < w * 0.22) return false;

  const cleftTop = minY + h * 0.42;
  let cleft = 0;
  for (const p of points) {
    if (Math.abs(p.x - midX) < w * 0.22 && p.y < cleftTop) {
      cleft = Math.max(cleft, p.y);
    }
  }
  const lobeY = Math.max(leftTop.y, rightTop.y);
  if (cleft - lobeY < h * 0.04) return false;

  return true;
}
