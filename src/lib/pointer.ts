export const pointer = {
  x: 0,
  y: 0,
  nx: 0.72,
  ny: 0.38,
  clientX: 0,
  clientY: 0,
  lastMove: 0,
};

export function bindPointer() {
  if (typeof window !== "undefined") {
    pointer.clientX = window.innerWidth * 0.72;
    pointer.clientY = window.innerHeight * 0.38;
  }
  const move = (e: PointerEvent) => {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    pointer.clientX = e.clientX;
    pointer.clientY = e.clientY;
    pointer.lastMove = performance.now();
    pointer.nx = e.clientX / w;
    pointer.ny = e.clientY / h;
    pointer.x = pointer.nx * 2 - 1;
    pointer.y = -(pointer.ny * 2 - 1);
  };
  window.addEventListener("pointermove", move, { passive: true });
  return () => window.removeEventListener("pointermove", move);
}
