import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alignment,
  EventType,
  Fit,
  Layout,
  StateMachineInputType,
  useRive,
  type EventCallback,
  type StateMachineInput,
} from "@rive-app/react-canvas";
import { isHeart, type Point } from "@/lib/loop";
import { playUnlockChime } from "@/lib/chime";
import { prefersReducedMotion } from "@/lib/motion";

type Props = {
  onUnlock: () => void;
};

export function Gate({ onUnlock }: Props) {
  const [reduced] = useState(prefersReducedMotion);
  const completed = useRef(false);
  const callback = useRef(onUnlock);

  useEffect(() => {
    callback.current = onUnlock;
  }, [onUnlock]);

  const finish = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    callback.current();
  }, []);

  useEffect(() => {
    if (reduced) finish();
  }, [reduced, finish]);

  // Do not mount or load the animation when the ritual is bypassed.
  return reduced ? null : <EntryRitual onUnlock={finish} />;
}

function EntryRitual({ onUnlock }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const points = useRef<Point[]>([]);
  const strokeLength = useRef(0);
  const activePointer = useRef<number | null>(null);
  const unlocking = useRef(false);
  const triggerFired = useRef(false);
  const progressInput = useRef<StateMachineInput | null>(null);
  const [hint, setHint] = useState("Draw a heart. Come in.");
  const [accepted, setAccepted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  const { rive, RiveComponent } = useRive({
    // Vite serves public assets from the site root.
    src: "/rive/gate_frost.riv",
    autoplay: false,
    layout: new Layout({ fit: Fit.Cover, alignment: Alignment.Center }),
    onLoadError: () => setFailed(true),
  });

  useEffect(() => {
    if (!rive) return;

    // Use the default artboard's first machine without requiring an authoring name.
    const machine = rive.stateMachineNames[0];
    if (!machine) {
      setFailed(true);
      return;
    }
    // Inputs are available only after the runtime instantiates the machine.
    rive.play(machine);
    const inputs = rive.stateMachineInputs(machine) ?? [];
    const progress = inputs.find((input) => input.name === "drawProgress" && input.type === StateMachineInputType.Number);
    const trigger = inputs.find((input) => input.name === "unlockTrigger" && input.type === StateMachineInputType.Trigger);
    if (!progress || !trigger) {
      rive.pause(machine);
      setFailed(true);
      return;
    }
    progressInput.current = progress;
    // Progress is cumulative stroke length in CSS pixels, reset for each attempt.
    progress.value = strokeLength.current;

    const complete: EventCallback = (event) => {
      if (!triggerFired.current) return;
      const data = event.data;
      const reportedComplete = event.type === EventType.RiveEvent
        && typeof data === "object" && data !== null && "name" in data
        && data.name === "onComplete";
      // The terminal Exit state must follow the full melt/dissolution animation.
      const exited = event.type === EventType.StateChange
        && (Array.isArray(data) ? data : [data]).includes("Exit");
      if (reportedComplete || exited) onUnlock();
    };
    rive.on(EventType.RiveEvent, complete);
    rive.on(EventType.StateChange, complete);
    setReady(true);

    // A heart drawn while the file was loading is retained and fired once ready.
    if (accepted && !triggerFired.current) {
      triggerFired.current = true;
      trigger.fire();
    }

    return () => {
      progressInput.current = null;
      rive.off(EventType.RiveEvent, complete);
      rive.off(EventType.StateChange, complete);
    };
  }, [rive, accepted, onUnlock]);

  useEffect(() => {
    // Missing or incompatible artwork must not trap a valid gesture at the gate.
    if (failed && accepted) onUnlock();
  }, [failed, accepted, onUnlock]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let resetTimer: number | undefined;

    const paint = () => {
      paintStroke(ctx, canvas.clientWidth, canvas.clientHeight, points.current, !ready || failed);
    };
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint();
    };
    resize();
    window.addEventListener("resize", resize);

    const pos = (e: PointerEvent): Point => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const reset = () => {
      points.current = [];
      strokeLength.current = 0;
      if (progressInput.current) progressInput.current.value = 0;
      paint();
    };
    const append = (e: PointerEvent) => {
      const next = pos(e);
      const last = points.current.at(-1);
      if (last) strokeLength.current += Math.hypot(next.x - last.x, next.y - last.y);
      points.current.push(next);
      if (progressInput.current) progressInput.current.value = strokeLength.current;
    };
    const down = (e: PointerEvent) => {
      if (unlocking.current || activePointer.current !== null || !e.isPrimary || e.button !== 0) return;
      window.clearTimeout(resetTimer);
      reset();
      activePointer.current = e.pointerId;
      append(e);
      canvas.setPointerCapture(e.pointerId);
      paint();
    };
    const move = (e: PointerEvent) => {
      if (activePointer.current !== e.pointerId || unlocking.current) return;
      const samples = e.getCoalescedEvents?.();
      for (const sample of samples?.length ? samples : [e]) append(sample);
      paint();
    };
    const release = (e: PointerEvent) => {
      activePointer.current = null;
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    };
    const up = (e: PointerEvent) => {
      if (activePointer.current !== e.pointerId || unlocking.current) return;
      append(e);
      release(e);
      paint();
      if (isHeart(points.current)) {
        unlocking.current = true;
        setHint("The quiet is opening");
        setAccepted(true);
        playUnlockChime();
      } else {
        setHint("Unhurried — two curves, then home");
        resetTimer = window.setTimeout(reset, 420);
      }
    };
    const cancel = (e: PointerEvent) => {
      if (activePointer.current !== e.pointerId) return;
      release(e);
      reset();
    };

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", cancel);
    canvas.addEventListener("lostpointercapture", cancel);
    return () => {
      window.clearTimeout(resetTimer);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", cancel);
      canvas.removeEventListener("lostpointercapture", cancel);
    };
  }, [ready, failed]);

  return (
    <section className="gate" aria-label="Enter a quiet place">
      <RiveComponent aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
      <canvas ref={canvasRef} className="gate-canvas" style={{ position: "absolute", inset: 0 }} aria-hidden="true" />
      <div className="gate-copy">
        <p className="gate-kicker">You are welcome here</p>
        <p className="gate-hint" aria-live="polite">{hint}</p>
        <button type="button" className="text-btn" style={{ pointerEvents: "auto" }} onClick={onUnlock}>
          I am already home
        </button>
      </div>
    </section>
  );
}

function paintStroke(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pts: Point[],
  fallback: boolean,
) {
  ctx.clearRect(0, 0, w, h);
  if (fallback) {
    ctx.fillStyle = "rgba(236, 230, 220, 0.94)";
    ctx.fillRect(0, 0, w, h);
  }
  // Keep the canvas transparent so Rive owns the frost and its dissolution.
  if (pts.length < 2) return;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(22, 20, 18, 0.85)";
  ctx.lineWidth = 3.6;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
}
