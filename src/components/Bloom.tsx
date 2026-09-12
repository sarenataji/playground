import { useEffect, useRef, useState, useCallback } from "react";
import {
  useRive,
  useStateMachineInput,
  Layout,
  Fit,
  Alignment,
  type StateMachineInput,
} from "@rive-app/react-canvas";
import gsap from "gsap";
import { BloomGarden } from "./BloomGarden";
import { prefersReducedMotion } from "@/lib/motion";
import { useInView } from "@/lib/useInView";
import { cssVar } from "@/lib/theme";

/**
 * Bloom: a Rive flower surrounded by a persistent, interactive garden.
 *
 * Requirements:
 * 1. Load `/rive/bloom.riv` with state machine `BloomMachine`.
 * 2. Map normalized pointer coordinates to the 0–100 Rive blend axes.
 * 3. Bind click/drag progress to a `bloomProgress` Number input (0 to 100) or `tapBloom` Trigger.
 * 4. Keep the ambient editorial styling and color theme integration from `src/lib/theme.ts`.
 */
export function Bloom() {
  const root = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useInView(root);
  const reduced = prefersReducedMotion();

  // Public assets are served from the site root by Vite.
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Rive hook setup
  const { rive, RiveComponent } = useRive({
    src: "/rive/bloom.riv",
    stateMachine: "BloomMachine",
    autoplay: !reduced,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    onLoad: () => {
      setIsLoaded(true);
      setHasError(false);
    },
    onLoadError: () => {
      setHasError(true);
      setIsLoaded(false);
    },
  });

  useEffect(() => {
    if (!rive || !isLoaded) return;
    if (live && !reduced) rive.play("BloomMachine");
    else rive.pause();
  }, [rive, isLoaded, live, reduced]);

  useEffect(() => () => {
    gsap.killTweensOf(currentProgressRef);
    gsap.killTweensOf(cursorPosRef.current);
  }, []);

  // State machine inputs
  const cursorXInput = useStateMachineInput(rive, "BloomMachine", "cursorX");
  const cursorYInput = useStateMachineInput(rive, "BloomMachine", "cursorY");
  const bloomProgressInput = useStateMachineInput(rive, "BloomMachine", "bloomProgress");
  const tapBloomInput = useStateMachineInput(rive, "BloomMachine", "tapBloom");

  // Keep a pool of matching state machine inputs (handles alternative casing/naming)
  const inputsRef = useRef<{
    cursorX: StateMachineInput[];
    cursorY: StateMachineInput[];
    bloomProgress: StateMachineInput[];
    tapBloom: StateMachineInput[];
  }>({ cursorX: [], cursorY: [], bloomProgress: [], tapBloom: [] });

  const currentProgressRef = useRef(65);
  const cursorPosRef = useRef({ x: 0.5, y: 0.5 });
  const lastPulseTimeRef = useRef(0);
  const dragState = useRef<{
    isDragging: boolean;
    startX: number;
    startY: number;
    startProgress: number;
    hasMoved: boolean;
  }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startProgress: 65,
    hasMoved: false,
  });

  // Sync inputs when rive or inputs change
  useEffect(() => {
    const xInputs: StateMachineInput[] = [];
    const yInputs: StateMachineInput[] = [];
    const progressInputs: StateMachineInput[] = [];
    const tapInputs: StateMachineInput[] = [];

    if (cursorXInput) xInputs.push(cursorXInput);
    if (cursorYInput) yInputs.push(cursorYInput);
    if (bloomProgressInput) progressInputs.push(bloomProgressInput);
    if (tapBloomInput) tapInputs.push(tapBloomInput);

    if (rive) {
      const smNames = rive.stateMachineNames || [];
      for (const sm of smNames) {
        try {
          const inputs = rive.stateMachineInputs(sm);
          if (inputs) {
            for (const input of inputs) {
              const key = input.name.toLowerCase().replace(/[-_]/g, "");
              if (
                (key === "cursorx" || key === "pointerx" || key === "x") &&
                !xInputs.includes(input)
              ) {
                xInputs.push(input);
              } else if (
                (key === "cursory" || key === "pointery" || key === "y") &&
                !yInputs.includes(input)
              ) {
                yInputs.push(input);
              } else if (
                (key === "bloomprogress" || key === "progress" || key === "bloom") &&
                !progressInputs.includes(input)
              ) {
                progressInputs.push(input);
              } else if (
                (key === "tapbloom" || key === "tap" || key === "trigger" || key === "bloomtrigger") &&
                !tapInputs.includes(input)
              ) {
                tapInputs.push(input);
              }
            }
          }
        } catch {
          // Safe guard
        }
      }
    }

    inputsRef.current = {
      cursorX: xInputs,
      cursorY: yInputs,
      bloomProgress: progressInputs,
      tapBloom: tapInputs,
    };

    // Set initial bloom progress
    for (const input of progressInputs) {
      if (typeof input.value === "number") {
        input.value = currentProgressRef.current;
      }
    }
  }, [rive, cursorXInput, cursorYInput, bloomProgressInput, tapBloomInput]);

  // Pass normalized cursor position (cursorX, cursorY) in [0, 1] to steer bone/petal deflection
  const applyCursor = useCallback((nx: number, ny: number) => {
    const clampedX = Math.max(0, Math.min(1, nx));
    const clampedY = Math.max(0, Math.min(1, ny));
    cursorPosRef.current.x = clampedX;
    cursorPosRef.current.y = clampedY;

    for (const input of inputsRef.current.cursorX) {
      if (typeof input.value === "number") {
        input.value = clampedX * 100;
      }
    }
    for (const input of inputsRef.current.cursorY) {
      if (typeof input.value === "number") {
        input.value = clampedY * 100;
      }
    }
  }, []);

  // Bind bloom progress to 0 to 100
  const applyProgress = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    currentProgressRef.current = clamped;

    for (const input of inputsRef.current.bloomProgress) {
      if (typeof input.value === "number") {
        input.value = clamped;
      }
    }
  }, []);

  // Fire tapBloom trigger input
  const fireTapBloom = useCallback(() => {
    for (const input of inputsRef.current.tapBloom) {
      input.fire();
    }
  }, []);

  // Trigger bloom pulse / toggle animation on tap or click
  const triggerBloomPulse = useCallback(() => {
    const now = performance.now();
    if (now - lastPulseTimeRef.current < 250) return;
    lastPulseTimeRef.current = now;

    fireTapBloom();
    gsap.killTweensOf(currentProgressRef);
    if (reduced) { applyProgress(100); return; }
    const target = 100;
    gsap.to(currentProgressRef, {
      current: target,
      duration: 1.1,
      ease: "power2.out",
      onUpdate: () => {
        applyProgress(currentProgressRef.current);
      },
    });
  }, [fireTapBloom, applyProgress, reduced]);

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    applyCursor(nx, ny);

    gsap.killTweensOf(currentProgressRef);

    dragState.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startProgress: currentProgressRef.current,
      hasMoved: false,
    };
    setIsDragging(true);

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    gsap.killTweensOf(cursorPosRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    applyCursor(nx, ny);

    if (dragState.current.isDragging) {
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      if (Math.hypot(dx, dy) > 4) {
        dragState.current.hasMoved = true;
        const sensitivity = 100 / (rect.width * 0.5);
        const delta = (dx - dy) * sensitivity * 0.5;
        applyProgress(dragState.current.startProgress + delta);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (dragState.current.isDragging) {
      if (!dragState.current.hasMoved) {
        triggerBloomPulse();
      }
      dragState.current.isDragging = false;
      setIsDragging(false);
    }
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const handleClick = () => {
    if (!dragState.current.hasMoved) {
      triggerBloomPulse();
    }
  };

  const handlePointerLeave = () => {
    if (!dragState.current.isDragging) {
      // Smoothly return cursor deflection toward center
      gsap.to(cursorPosRef.current, {
        x: 0.5,
        y: 0.5,
        duration: 0.7,
        ease: "power2.out",
        onUpdate: () => {
          applyCursor(cursorPosRef.current.x, cursorPosRef.current.y);
        },
      });
    }
  };

  // Interactive skeletal vector mesh fallback canvas
  useEffect(() => {
    if (isLoaded && !hasError && !reduced) return;

    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = stage.clientWidth || canvas.clientWidth || 800;
      const h = stage.clientHeight || canvas.clientHeight || 500;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    requestAnimationFrame(resize);
    window.addEventListener("resize", resize);

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    ro?.observe(stage);

    const tick = (time: number) => {
      const w = stage.clientWidth || canvas.clientWidth || 800;
      const h = stage.clientHeight || canvas.clientHeight || 500;

      // Theme colors from theme.ts
      const paper = cssVar("--paper") || "#f3e6dc";
      const bloom = cssVar("--bloom") || "#f0c8b4";
      const accent = cssVar("--accent") || "#c45c26";
      const ink = cssVar("--ink") || "#161412";
      const dust = cssVar("--dust") || "#d8c4b2";

      ctx.fillStyle = paper;
      ctx.fillRect(0, 0, w, h);

      // Ambient radial wash centered in stage
      const cx = w * 0.5;
      const cy = h * 0.5;
      const wash = ctx.createRadialGradient(cx, cy, 30, cx, cy, Math.max(w, h) * 0.6);
      wash.addColorStop(0, bloom);
      wash.addColorStop(0.75, "rgba(0,0,0,0)");
      ctx.fillStyle = wash;
      ctx.globalAlpha = 0.45;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;

      // Normalized cursor deflection steer
      const targetDeflectX = reduced ? 0 : (cursorPosRef.current.x - 0.5) * 140;
      const targetDeflectY = reduced ? 0 : (cursorPosRef.current.y - 0.5) * 90;
      const sway = reduced ? 0 : Math.sin(time * 0.0014) * 12;

      // Bloom scale factor (0 to 1) from bloomProgress (0 to 100)
      const bloomFactor = Math.max(0.1, currentProgressRef.current / 100);

      // Skeletal stem curve points anchored from bottom of stage
      const stemBaseX = cx;
      const stemBaseY = h + 15;
      const flowerX = cx + targetDeflectX + sway;
      const flowerY = cy + targetDeflectY;
      const ctrlX = cx + targetDeflectX * 0.45;
      const ctrlY = (stemBaseY + flowerY) * 0.55;

      // Render skeletal stem
      ctx.beginPath();
      ctx.moveTo(stemBaseX, stemBaseY);
      ctx.quadraticCurveTo(ctrlX, ctrlY, flowerX, flowerY);
      ctx.strokeStyle = dust;
      ctx.lineWidth = 4.5;
      ctx.lineCap = "round";
      ctx.stroke();

      // Stem joints
      ctx.beginPath();
      ctx.arc(ctrlX, ctrlY, 3, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();

      // Skeletal Flower Head with vector mesh petals
      ctx.save();
      ctx.translate(flowerX, flowerY);

      const headAngle = Math.atan2(flowerY - ctrlY, flowerX - ctrlX) - Math.PI / 2;
      ctx.rotate(headAngle * 0.5);

      // Multi-layered petal counts
      const layers = [
        { count: 12, radius: 120 * bloomFactor, alpha: 0.55, color: bloom },
        { count: 8, radius: 85 * bloomFactor, alpha: 0.75, color: accent },
        { count: 6, radius: 50 * bloomFactor, alpha: 0.9, color: bloom },
      ];

      for (let l = 0; l < layers.length; l++) {
        const layer = layers[l];
        const angleOffset = (l * Math.PI) / layer.count;

        for (let i = 0; i < layer.count; i++) {
          const a = (i / layer.count) * Math.PI * 2 + angleOffset;
          const petalLength = layer.radius;
          const petalWidth = layer.radius * 0.38;

          ctx.save();
          ctx.rotate(a);

          // Vector petal mesh curve
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(
            petalWidth,
            petalLength * 0.35,
            petalWidth * 0.8,
            petalLength * 0.85,
            0,
            petalLength,
          );
          ctx.bezierCurveTo(
            -petalWidth * 0.8,
            petalLength * 0.85,
            -petalWidth,
            petalLength * 0.35,
            0,
            0,
          );

          ctx.fillStyle = layer.color;
          ctx.globalAlpha = layer.alpha;
          ctx.fill();

          // Petal central skeletal rib
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, petalLength * 0.88);
          ctx.strokeStyle = ink;
          ctx.globalAlpha = 0.12;
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.restore();
        }
      }

      // Floral Stamen & Core
      ctx.beginPath();
      ctx.arc(0, 0, 16 + bloomFactor * 8, 0, Math.PI * 2);
      ctx.fillStyle = ink;
      ctx.globalAlpha = 0.88;
      ctx.fill();

      // Pollen pistils
      const pistilCount = 9;
      for (let p = 0; p < pistilCount; p++) {
        const pa = (p / pistilCount) * Math.PI * 2;
        const pr = 12 + bloomFactor * 10;
        ctx.beginPath();
        ctx.arc(Math.cos(pa) * pr, Math.sin(pa) * pr, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.95;
        ctx.fill();
      }

      ctx.restore();

      if (live) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      ro?.disconnect();
    };
  }, [isLoaded, hasError, live, reduced]);

  return (
    <section ref={root} className="room bloom-room" id="bloom">
      <div className="room-copy">
        <p className="kicker">Something living</p>
        <h2 className="display">Leave a bloom.</h2>
        <p className="lede">
          Tap to plant a bloom. Brush past to stir the petals.
        </p>
      </div>

      <div
        ref={stageRef}
        className="room-canvas well bloom-stage"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        style={{
          position: "relative",
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "pan-y",
          userSelect: "none",
          overflow: "hidden",
        }}
        aria-label="Your interactive flower garden"
        role="region"
      >
        {/* Mount the Rive canvas immediately: useRive cannot load before it exists. */}
        <RiveComponent
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", visibility: isLoaded && !hasError && !reduced ? "visible" : "hidden" }}
        />
        {(!isLoaded || hasError || reduced) && (
          <canvas ref={canvasRef} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
        )}

        <BloomGarden live={live} reduced={reduced} onCenterTap={triggerBloomPulse} />
      </div>
    </section>
  );
}
