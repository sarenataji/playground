export const pointer = {
  x: 0,
  y: 0,
  nx: 0.72,
  ny: 0.38,
};

export function bindPointer() {
  const move = (e: PointerEvent) => {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    pointer.nx = e.clientX / w;
    pointer.ny = e.clientY / h;
    pointer.x = pointer.nx * 2 - 1;
    pointer.y = -(pointer.ny * 2 - 1);
  };
  window.addEventListener("pointermove", move, { passive: true });
  return () => window.removeEventListener("pointermove", move);
}
