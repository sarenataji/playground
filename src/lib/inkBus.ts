import type { InkFluid } from "@/webgl/fluid";

let fluid: InkFluid | null = null;
let overTable = false;
let pendingColor: [number, number, number] | null = null;
const listeners = new Set<(f: InkFluid | null) => void>();

export type Obstacle = {
  x: number;
  y: number;
  radius: number;
};

let stampObstacle: Obstacle | null = null;

export function setStampObstacle(next: Obstacle | null) {
  stampObstacle = next;
  if (fluid) {
    if (next) {
      fluid.setObstacle(next.x, next.y, next.radius);
    } else {
      fluid.clearObstacle();
    }
  }
}

export function getStampObstacle() {
  return stampObstacle;
}

export type InkSplatter = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  strength: number;
  time: number;
};

const inkHistory: InkSplatter[] = [];

export function recordInkPoint(x: number, y: number, vx: number, vy: number, strength = 1) {
  const now = performance.now();
  inkHistory.push({ x, y, vx, vy, strength, time: now });
  if (inkHistory.length > 80) {
    inkHistory.shift();
  }
}

export function getInkNear(
  cx: number,
  cy: number,
  maxDist: number,
): { x: number; y: number; strength: number } | null {
  const now = performance.now();
  let sumX = 0;
  let sumY = 0;
  let totalWeight = 0;

  for (let i = inkHistory.length - 1; i >= 0; i--) {
    const p = inkHistory[i];
    const age = (now - p.time) / 1000;
    if (age > 3.0) continue;
    const decay = Math.max(0, 1 - age / 3.0);
    const d = Math.hypot(p.x - cx, p.y - cy);
    if (d < maxDist) {
      // Weight points closer to the circle edge higher
      const w = decay * p.strength * Math.max(0.1, 1 - d / maxDist);
      sumX += p.x * w;
      sumY += p.y * w;
      totalWeight += w;
    }
  }

  if (totalWeight > 0.04) {
    return {
      x: sumX / totalWeight,
      y: sumY / totalWeight,
      strength: totalWeight,
    };
  }
  return null;
}

export function setInk(next: InkFluid | null) {
  fluid = next;
  if (fluid && pendingColor) {
    fluid.target = pendingColor;
    fluid.color = [...pendingColor];
  }
  if (fluid && stampObstacle) {
    fluid.setObstacle(stampObstacle.x, stampObstacle.y, stampObstacle.radius);
  }
  listeners.forEach((fn) => fn(fluid));
}

export function getInk() {
  return fluid;
}

export function onInk(fn: (f: InkFluid | null) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setOverTable(v: boolean) {
  overTable = v;
}

export function isOverTable() {
  return overTable;
}

function luma(rgb: [number, number, number]) {
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

/** On a dark field, lift near-black dye so trails stay visible. */
export function visibleInk(
  rgb: [number, number, number],
  dark: boolean,
): [number, number, number] {
  if (!dark || luma(rgb) > 0.42) return rgb;
  return [
    Math.min(1, rgb[0] * 0.22 + 0.86),
    Math.min(1, rgb[1] * 0.22 + 0.8),
    Math.min(1, rgb[2] * 0.22 + 0.72),
  ];
}

export function tintInk(rgb: [number, number, number], dark = false) {
  const next = visibleInk(rgb, dark);
  pendingColor = next;
  if (fluid) fluid.target = next;
}
