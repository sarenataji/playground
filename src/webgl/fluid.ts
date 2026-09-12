/**
 * Compact WebGL2 stable-fluids ink solver with obstacle avoidance.
 * Velocity + dye ping-pong, splat / advect / pressure / deflect, display as premultiplied ink.
 */

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

function frag(body: string) {
  return `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
${body}`;
}

type Program = {
  id: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
};

type Fbo = {
  w: number;
  h: number;
  fbo: WebGLFramebuffer;
  tex: WebGLTexture;
};

export type InkColor = [number, number, number];

export class InkFluid {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  private simW: number;
  private dyeW: number;
  private blit: WebGLVertexArrayObject;
  private programs: Record<string, Program>;
  private velocity: [Fbo, Fbo];
  private dye: [Fbo, Fbo];
  private divergence: Fbo;
  private pressure: [Fbo, Fbo];
  private ping = { vel: 0, dye: 0, pressure: 0 };
  splatRadius = 0.00028;
  splatForce = 42;
  color: InkColor = [0.09, 0.07, 0.05];
  target: InkColor = [0.09, 0.07, 0.05];
  obstacle: [number, number, number, number] = [0, 0, 0, 0]; // [cx, cy, radius_aspect, enabled]
  private disposed = false;
  enabled = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
    });
    if (!gl) throw new Error("WebGL2 is required for the ink table.");
    this.gl = gl;
    gl.getExtension("EXT_color_buffer_float");
    gl.getExtension("OES_texture_float_linear");

    const scale = Math.min(1, 1400 / Math.max(window.innerWidth, 1));
    this.simW = Math.max(96, Math.round(128 * scale));
    this.dyeW = Math.max(256, Math.round(384 * scale));

    this.blit = this.makeBlit();
    this.programs = {
      splat: this.makeProgram(
        frag(`
          uniform sampler2D uTarget;
          uniform float uAspect;
          uniform vec3 uColor;
          uniform vec2 uPoint;
          uniform float uRadius;
          uniform vec4 uObstacle;
          void main() {
            vec4 base = texture(uTarget, vUv);
            if (uObstacle.w > 0.5) {
              vec2 op = vUv - uObstacle.xy;
              op.x *= uAspect;
              if (length(op) < uObstacle.z) {
                outColor = vec4(0.0);
                return;
              }
            }
            vec2 p = vUv - uPoint;
            p.x *= uAspect;
            float fall = exp(-dot(p, p) / uRadius);
            if (uObstacle.w > 0.5) {
              vec2 op = vUv - uObstacle.xy;
              op.x *= uAspect;
              fall *= smoothstep(uObstacle.z, uObstacle.z + 0.02, length(op));
            }
            outColor = base + vec4(uColor * fall, fall);
          }`),
      ),
      advect: this.makeProgram(
        frag(`
          uniform sampler2D uVelocity;
          uniform sampler2D uSource;
          uniform vec2 uTexel;
          uniform float uDt;
          uniform float uDissipation;
          uniform vec4 uObstacle;
          uniform float uAspect;
          void main() {
            if (uObstacle.w > 0.5) {
              vec2 op = vUv - uObstacle.xy;
              op.x *= uAspect;
              if (length(op) < uObstacle.z) {
                outColor = vec4(0.0);
                return;
              }
            }
            vec2 vel = texture(uVelocity, vUv).xy;
            vec2 coord = vUv - uDt * vel * uTexel * 256.0;
            if (uObstacle.w > 0.5) {
              vec2 cop = coord - uObstacle.xy;
              cop.x *= uAspect;
              if (length(cop) < uObstacle.z) {
                coord = vUv;
              }
            }
            outColor = texture(uSource, coord) * uDissipation;
          }`),
      ),
      deflect: this.makeProgram(
        frag(`
          uniform sampler2D uVelocity;
          uniform vec4 uObstacle;
          uniform float uAspect;
          void main() {
            vec2 vel = texture(uVelocity, vUv).xy;
            if (uObstacle.w > 0.5) {
              vec2 op = vUv - uObstacle.xy;
              op.x *= uAspect;
              float dist = length(op);
              if (dist < uObstacle.z) {
                vec2 n = normalize(vec2(op.x / uAspect, op.y));
                outColor = vec4(n * 0.2, 0.0, 1.0);
                return;
              }
              float margin = uObstacle.z * 1.35;
              if (dist < margin) {
                vec2 n = normalize(vec2(op.x / uAspect, op.y));
                float vn = dot(vel, n);
                if (vn < 0.0) {
                  vel -= n * vn * 1.3;
                }
                float repulse = smoothstep(margin, uObstacle.z, dist) * 0.7;
                vel += n * repulse;
              }
            }
            outColor = vec4(vel, 0.0, 1.0);
          }`),
      ),
      divergence: this.makeProgram(
        frag(`
          uniform sampler2D uVelocity;
          uniform vec2 uTexel;
          void main() {
            float L = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
            float R = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
            float B = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
            float T = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
            vec2 C = texture(uVelocity, vUv).xy;
            if (vUv.x < uTexel.x) L = -C.x;
            if (vUv.x > 1.0 - uTexel.x) R = -C.x;
            if (vUv.y < uTexel.y) B = -C.y;
            if (vUv.y > 1.0 - uTexel.y) T = -C.y;
            outColor = vec4(0.5 * ((R - L) + (T - B)), 0.0, 0.0, 1.0);\n          }`),
      ),
      clear: this.makeProgram(
        frag(`
          uniform sampler2D uTexture;
          uniform float uValue;
          void main() {
            outColor = texture(uTexture, vUv) * uValue;
          }`),
      ),
      jacobi: this.makeProgram(
        frag(`
          uniform sampler2D uPressure;
          uniform sampler2D uDivergence;
          uniform vec2 uTexel;
          void main() {
            float L = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
            float R = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
            float B = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
            float T = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
            float div = texture(uDivergence, vUv).x;
            outColor = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);
          }`),
      ),
      gradient: this.makeProgram(
        frag(`
          uniform sampler2D uPressure;
          uniform sampler2D uVelocity;
          uniform vec2 uTexel;
          void main() {
            float L = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
            float R = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
            float B = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
            float T = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
            vec2 vel = texture(uVelocity, vUv).xy;
            vel -= vec2(R - L, T - B);
            outColor = vec4(vel, 0.0, 1.0);
          }`),
      ),
      display: this.makeProgram(
        frag(`
          uniform sampler2D uDye;
          uniform vec3 uInk;
          uniform vec4 uObstacle;
          uniform float uAspect;
          void main() {
            if (uObstacle.w > 0.5) {
              vec2 op = vUv - uObstacle.xy;
              op.x *= uAspect;
              if (length(op) < uObstacle.z) {
                outColor = vec4(0.0);
                return;
              }
            }
            float d = texture(uDye, vUv).x;
            float a = smoothstep(0.02, 0.55, d);
            a = pow(a, 0.85);
            if (uObstacle.w > 0.5) {
              vec2 op = vUv - uObstacle.xy;
              op.x *= uAspect;
              a *= smoothstep(uObstacle.z, uObstacle.z + 0.015, length(op));
            }
            outColor = vec4(uInk * a, a);
          }`),
      ),
    };

    const half = this.gl.HALF_FLOAT;
    this.velocity = [
      this.makeFbo(this.simW, this.simW, this.gl.RGBA16F, half),
      this.makeFbo(this.simW, this.simW, this.gl.RGBA16F, half),
    ];
    this.pressure = [
      this.makeFbo(this.simW, this.simW, this.gl.RGBA16F, half),
      this.makeFbo(this.simW, this.simW, this.gl.RGBA16F, half),
    ];
    this.divergence = this.makeFbo(this.simW, this.simW, this.gl.RGBA16F, half);
    this.dye = [
      this.makeFbo(this.dyeW, this.dyeW, this.gl.RGBA16F, half),
      this.makeFbo(this.dyeW, this.dyeW, this.gl.RGBA16F, half),
    ];

    this.resize();
  }

  setObstacle(screenX: number, screenY: number, screenRadius: number) {
    const w = Math.max(1, this.canvas.clientWidth || window.innerWidth);
    const h = Math.max(1, this.canvas.clientHeight || window.innerHeight);
    const cx = screenX / w;
    const cy = 1.0 - screenY / h;
    const radiusAspect = screenRadius / h;
    this.obstacle = [cx, cy, radiusAspect, 1.0];
  }

  clearObstacle() {
    this.obstacle = [0, 0, 0, 0];
  }

  resize() {
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.floor(this.canvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  splat(nx: number, ny: number, dx: number, dy: number, amount = 1) {
    const aspect = this.canvas.width / Math.max(this.canvas.height, 1);
    if (this.obstacle[3] > 0.5) {
      const px = (nx - this.obstacle[0]) * aspect;
      const py = (1 - ny) - this.obstacle[1];
      if (Math.hypot(px, py) < this.obstacle[2] * 0.95) {
        return;
      }
    }

    const p = this.programs.splat;
    const force = this.splatForce * amount;

    this.draw(p, this.velocity[this.ping.vel], this.velocity[this.ping.vel ^ 1], {
      uTarget: this.velocity[this.ping.vel].tex,
      uAspect: aspect,
      uPoint: [nx, 1 - ny],
      uRadius: this.splatRadius,
      uColor: [dx * force, -dy * force, 0],
      uObstacle: this.obstacle,
    });
    this.ping.vel ^= 1;

    this.draw(p, this.dye[this.ping.dye], this.dye[this.ping.dye ^ 1], {
      uTarget: this.dye[this.ping.dye].tex,
      uAspect: aspect,
      uPoint: [nx, 1 - ny],
      uRadius: this.splatRadius * 1.8,
      uColor: [0.9 * amount, 0.9 * amount, 0.9 * amount],
      uObstacle: this.obstacle,
    });
    this.ping.dye ^= 1;
  }

  dump(nx: number, ny: number) {
    const aspect = this.canvas.width / Math.max(this.canvas.height, 1);
    if (this.obstacle[3] > 0.5) {
      const px = (nx - this.obstacle[0]) * aspect;
      const py = (1 - ny) - this.obstacle[1];
      if (Math.hypot(px, py) < this.obstacle[2]) {
        return;
      }
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      this.splat(
        nx + Math.cos(a) * 0.02,
        ny + Math.sin(a) * 0.02,
        Math.cos(a) * 0.08,
        Math.sin(a) * 0.08,
        1.6,
      );
    }
  }

  step() {
    if (this.disposed || !this.enabled) return;
    const k = 0.048;
    this.color[0] += (this.target[0] - this.color[0]) * k;
    this.color[1] += (this.target[1] - this.color[1]) * k;
    this.color[2] += (this.target[2] - this.color[2]) * k;
    this.resize();
    const aspect = this.canvas.width / Math.max(this.canvas.height, 1);
    const dt = 0.016;
    const simTexel = [1 / this.simW, 1 / this.simW] as const;
    const dyeTexel = [1 / this.dyeW, 1 / this.dyeW] as const;

    this.draw(
      this.programs.advect,
      this.velocity[this.ping.vel],
      this.velocity[this.ping.vel ^ 1],
      {
        uVelocity: this.velocity[this.ping.vel].tex,
        uSource: this.velocity[this.ping.vel].tex,
        uTexel: simTexel,
        uDt: dt,
        uDissipation: 0.99,
        uObstacle: this.obstacle,
        uAspect: aspect,
      },
    );
    this.ping.vel ^= 1;

    if (this.obstacle[3] > 0.5) {
      this.draw(
        this.programs.deflect,
        this.velocity[this.ping.vel],
        this.velocity[this.ping.vel ^ 1],
        {
          uVelocity: this.velocity[this.ping.vel].tex,
          uObstacle: this.obstacle,
          uAspect: aspect,
        },
      );
      this.ping.vel ^= 1;
    }

    this.draw(
      this.programs.advect,
      this.dye[this.ping.dye],
      this.dye[this.ping.dye ^ 1],
      {
        uVelocity: this.velocity[this.ping.vel].tex,
        uSource: this.dye[this.ping.dye].tex,
        uTexel: dyeTexel,
        uDt: dt,
        uDissipation: 0.992,
        uObstacle: this.obstacle,
        uAspect: aspect,
      },
    );
    this.ping.dye ^= 1;

    this.draw(this.programs.divergence, this.velocity[this.ping.vel], this.divergence, {
      uVelocity: this.velocity[this.ping.vel].tex,
      uTexel: simTexel,
    });

    this.draw(this.programs.clear, this.pressure[this.ping.pressure], this.pressure[this.ping.pressure ^ 1], {
      uTexture: this.pressure[this.ping.pressure].tex,
      uValue: 0.8,
    });
    this.ping.pressure ^= 1;

    for (let i = 0; i < 8; i++) {
      this.draw(
        this.programs.jacobi,
        this.pressure[this.ping.pressure],
        this.pressure[this.ping.pressure ^ 1],
        {
          uPressure: this.pressure[this.ping.pressure].tex,
          uDivergence: this.divergence.tex,
          uTexel: simTexel,
        },
      );
      this.ping.pressure ^= 1;
    }

    this.draw(
      this.programs.gradient,
      this.velocity[this.ping.vel],
      this.velocity[this.ping.vel ^ 1],
      {
        uPressure: this.pressure[this.ping.pressure].tex,
        uVelocity: this.velocity[this.ping.vel].tex,
        uTexel: simTexel,
      },
    );
    this.ping.vel ^= 1;

    this.display();
  }

  destroy() {
    this.disposed = true;
    this.enabled = false;
  }

  private display() {
    const gl = this.gl;
    const p = this.programs.display;
    const aspect = this.canvas.width / Math.max(this.canvas.height, 1);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.disable(gl.BLEND);
    gl.useProgram(p.id);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.dye[this.ping.dye].tex);
    gl.uniform1i(p.uniforms.uDye, 0);
    gl.uniform3f(p.uniforms.uInk, this.color[0], this.color[1], this.color[2]);
    if (p.uniforms.uObstacle) {
      gl.uniform4f(
        p.uniforms.uObstacle,
        this.obstacle[0],
        this.obstacle[1],
        this.obstacle[2],
        this.obstacle[3],
      );
    }
    if (p.uniforms.uAspect) {
      gl.uniform1f(p.uniforms.uAspect, aspect);
    }
    gl.bindVertexArray(this.blit);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private draw(
    program: Program,
    _read: Fbo | { tex: WebGLTexture },
    write: Fbo,
    uniforms: Record<string, number | number[] | readonly number[] | WebGLTexture>,
  ) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, write.fbo);
    gl.viewport(0, 0, write.w, write.h);
    gl.useProgram(program.id);
    let unit = 0;
    for (const [key, value] of Object.entries(uniforms)) {
      const loc = program.uniforms[key];
      if (!loc) continue;
      if (typeof value === "number") {
        gl.uniform1f(loc, value);
      } else if (Array.isArray(value)) {
        if (value.length === 2) gl.uniform2f(loc, value[0], value[1]);
        else if (value.length === 3) gl.uniform3f(loc, value[0], value[1], value[2]);
        else if (value.length === 4) gl.uniform4f(loc, value[0], value[1], value[2], value[3]);
      } else {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, value);
        gl.uniform1i(loc, unit);
        unit += 1;
      }
    }
    gl.bindVertexArray(this.blit);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private makeBlit() {
    const gl = this.gl;
    const vao = gl.createVertexArray();
    const buf = gl.createBuffer();
    if (!vao || !buf) throw new Error("GL buffer");
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    return vao;
  }

  private makeProgram(fs: string): Program {
    const gl = this.gl;
    const vert = this.compile(gl.VERTEX_SHADER, VERT);
    const fragSh = this.compile(gl.FRAGMENT_SHADER, fs);
    const id = gl.createProgram();
    if (!id) throw new Error("program");
    gl.attachShader(id, vert);
    gl.attachShader(id, fragSh);
    gl.bindAttribLocation(id, 0, "aPos");
    gl.linkProgram(id);
    if (!gl.getProgramParameter(id, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(id) ?? "link");
    }
    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    const n = gl.getProgramParameter(id, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(id, i);
      if (!info) continue;
      uniforms[info.name] = gl.getUniformLocation(id, info.name);
    }
    return { id, uniforms };
  }

  private compile(type: number, src: string) {
    const gl = this.gl;
    const sh = gl.createShader(type);
    if (!sh) throw new Error("shader");
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(sh) ?? src.slice(0, 80));
    }
    return sh;
  }

  private makeFbo(w: number, h: number, internalFormat: number, type: number): Fbo {
    const gl = this.gl;
    const tex = gl.createTexture();
    if (!tex) throw new Error("tex");
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, gl.RGBA, type, null);

    const fbo = gl.createFramebuffer();
    if (!fbo) throw new Error("fbo");
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      tex,
      0,
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { w, h, fbo, tex };
  }
}
