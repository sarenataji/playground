import type { InkFluid } from "@/webgl/fluid";

let fluid: InkFluid | null = null;
let overTable = false;
let pendingColor: [number, number, number] | null = null;
const listeners = new Set<(f: InkFluid | null) => void>();

export function setInk(next: InkFluid | null) {
  fluid = next;
  if (fluid && pendingColor) {
    fluid.target = pendingColor;
    fluid.color = [...pendingColor];
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
