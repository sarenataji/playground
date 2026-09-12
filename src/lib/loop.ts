export type Point = { x: number; y: number };

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** A forgiving single-stroke heart, independent of pointer event frequency. */
export function isHeart(points: Point[]): boolean {
  const stroke: Point[] = [];
  for (const p of points) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return false;
    const previous = stroke.at(-1);
    if (!previous || distance(p, previous) > 0.5) stroke.push(p);
  }
  if (stroke.length < 8) return false;

  const bounds = getBounds(stroke);
  if (bounds.w < 24 || bounds.h < 24) return false;
  // A finger need not land exactly where it started.
  if (distance(stroke[0], stroke.at(-1)!) > Math.min(bounds.w, bounds.h) * 0.65) return false;

  const closed = [...stroke, stroke[0]];
  let length = 0;
  const lengths = closed.map((p, i) => {
    if (i) length += distance(closed[i - 1], p);
    return length;
  });
  // Resample by distance so fast strokes and pauses have equal influence.
  const samples: Point[] = [];
  let segment = 1;
  for (let i = 0; i < 96; i++) {
    const target = length * i / 96;
    while (segment < closed.length - 1 && lengths[segment] < target) segment++;
    const a = closed[segment - 1];
    const b = closed[segment];
    const span = lengths[segment] - lengths[segment - 1];
    const t = span ? (target - lengths[segment - 1]) / span : 0;
    samples.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }

  // Allow a natural lean in either direction, with either drawing direction/start.
  for (let degrees = -40; degrees <= 40; degrees += 10) {
    const angle = degrees * Math.PI / 180;
    const rotated = samples.map((p) => ({
      x: (p.x - bounds.x) * Math.cos(angle) - (p.y - bounds.y) * Math.sin(angle),
      y: (p.x - bounds.x) * Math.sin(angle) + (p.y - bounds.y) * Math.cos(angle),
    }));
    if (hasHeartShape(rotated, length)) return true;
  }
  return false;
}

function getBounds(points: Point[]) {
  let x = Infinity, y = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    x = Math.min(x, p.x);
    y = Math.min(y, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { x, y, w: maxX - x, h: maxY - y };
}

function hasHeartShape(points: Point[], length: number): boolean {
  const { x, y, w, h } = getBounds(points);
  if (w / h < 0.4 || w / h > 2.1) return false;
  if (length < (w + h) * 1.3 || length > (w + h) * 2.8) return false;
  const normalized = points.map((p) => ({ x: (p.x - x) / w, y: (p.y - y) / h }));

  // Compare the upper outline, not arbitrary points near the middle of the stroke.
  // Using arbitrary points mistakes round shapes for a cleft and misses deep clefts.
  const top = (left: number, right: number) => Math.min(...normalized
    .filter((p) => p.x >= left && p.x <= right).map((p) => p.y));
  const leftLobe = top(0.08, 0.4);
  const rightLobe = top(0.6, 0.92);
  const cleft = top(0.46, 0.54);
  if (!Number.isFinite(leftLobe + rightLobe + cleft)) return false;
  if (leftLobe > 0.4 || rightLobe > 0.4 || cleft > 0.65) return false;
  if (cleft < (leftLobe + rightLobe) / 2 + 0.025
    || cleft < Math.min(leftLobe, rightLobe) + 0.055) return false;

  const base = normalized.filter((p) => p.y > 0.85);
  const baseLeft = Math.min(...base.map((p) => p.x));
  const baseRight = Math.max(...base.map((p) => p.x));
  if (baseRight - baseLeft > 0.65 || (baseLeft + baseRight) / 2 < 0.2
    || (baseLeft + baseRight) / 2 > 0.8) return false;

  // A heart encloses an area; retraced lines and dense scribbles should not qualify.
  const area = Math.abs(normalized.reduce((sum, p, i) => {
    const next = normalized[(i + 1) % normalized.length];
    return sum + p.x * next.y - next.x * p.y;
  }, 0)) / 2;
  return area > 0.3;
}
