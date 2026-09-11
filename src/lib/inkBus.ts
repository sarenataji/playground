import type { InkFluid } from "@/webgl/fluid";

let fluid: InkFluid | null = null;
let overTable = false;
const listeners = new Set<(f: InkFluid | null) => void>();

export function setInk(next: InkFluid | null) {
  fluid = next;
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
