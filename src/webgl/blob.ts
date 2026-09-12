/** 2D metaball field — Lando-style organic mask, no 3D required. */

type Ball = { x: number; y: number; r: number; ox: number; oy: number; phase: number };

function smoothstep(min: number, max: number, value: number): number {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

export class BlobField {
  canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private balls: Ball[];
  mouse = { x: 0.72, y: 0.38 };
  private dpr = 1;
  disposed = false;

  constructor(canvas: HTMLCanvasElement, count = 7) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d");
    this.ctx = ctx;
    this.balls = Array.from({ length: count }, (_, i) => ({
      x: 0.55 + Math.cos(i) * 0.12,
      y: 0.42 + Math.sin(i * 1.7) * 0.1,
      r: 0.09 + (i % 3) * 0.03,
      ox: Math.random() * Math.PI * 2,
      oy: Math.random() * Math.PI * 2,
      phase: i,
    }));
  }

  setMouse(nx: number, ny: number) {
    this.mouse.x = nx;
    this.mouse.y = ny;
  }

  draw(t: number) {
    if (this.disposed) return;
    const { canvas, ctx } = this;
    const maxW = 640;
    const cssW = Math.max(1, canvas.clientWidth);
    const cssH = Math.max(1, canvas.clientHeight);
    const scale = Math.min(1, maxW / cssW);
    this.dpr = Math.min(1.25, window.devicePixelRatio || 1) * scale;
    const w = Math.max(1, Math.floor(cssW * this.dpr));
    const h = Math.max(1, Math.floor(cssH * this.dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.clearRect(0, 0, w, h);

    this.balls[0].x += (this.mouse.x - this.balls[0].x) * 0.12;
    this.balls[0].y += (this.mouse.y - this.balls[0].y) * 0.12;
    this.balls[0].r = 0.16;

    for (let i = 1; i < this.balls.length; i++) {
      const b = this.balls[i];
      b.x = 0.62 + Math.cos(t * 0.00035 + b.ox) * 0.16 + Math.sin(t * 0.0002 + b.phase) * 0.04;
      b.y = 0.4 + Math.sin(t * 0.00028 + b.oy) * 0.14;
    }

    const img = ctx.createImageData(w, h);
    const data = img.data;
    const aspect = w / h;
    const thresh = 1.05;

    for (let y = 0; y < h; y += 2) {
      const v = y / h;
      const fadeY = smoothstep(0, 0.15, v) * smoothstep(0, 0.15, 1 - v);

      for (let x = 0; x < w; x += 2) {
        const u = x / w;
        const fadeX = smoothstep(0, 0.12, u) * smoothstep(0, 0.12, 1 - u);
        const edgeFade = fadeX * fadeY;

        let sum = 0;
        for (const b of this.balls) {
          const dx = (u - b.x) * aspect;
          const dy = v - b.y;
          sum += (b.r * b.r) / (dx * dx + dy * dy + 0.0004);
        }
        if (sum > thresh) {
          const rawA = Math.min(255, (sum - thresh) * 90);
          const a = rawA * edgeFade;
          if (a > 0.5) {
            const i0 = (y * w + x) * 4;
            this.paint(data, i0, a);
            if (x + 1 < w) this.paint(data, i0 + 4, a);
            if (y + 1 < h) {
              this.paint(data, i0 + w * 4, a);
              if (x + 1 < w) this.paint(data, i0 + w * 4 + 4, a);
            }
          }
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  destroy() {
    this.disposed = true;
  }

  private paint(data: Uint8ClampedArray, i: number, a: number) {
    data[i] = 22;
    data[i + 1] = 20;
    data[i + 2] = 18;
    data[i + 3] = a;
  }
}
