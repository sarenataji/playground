import { useEffect, useRef, useState } from "react";
import {
  Alignment, Fit, Layout, StateMachineInputType, useRive,
  type StateMachineInput,
} from "@rive-app/react-canvas";
import { prefersReducedMotion } from "@/lib/motion";
import { useInView } from "@/lib/useInView";
import { tintInk } from "@/lib/inkBus";

const MACHINE = "MagnetsMachine";
const layout = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });
type Inputs = Record<"targetX" | "targetY" | "speed" | "mode", StateMachineInput>;
const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function Magnets() {
  const root = useRef<HTMLElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const live = useInView(root);
  const [mode, setMode] = useState<"pull" | "push">("pull");
  const [reduced, setReduced] = useState(prefersReducedMotion);
  const [failed, setFailed] = useState(false);
  const [inputs, setInputs] = useState<Inputs | null>(null);
  const { rive, RiveComponent } = useRive({
    src: "/rive/magnets.riv",
    stateMachines: MACHINE,
    autoplay: false,
    layout,
    onLoadError: () => setFailed(true),
  });

  useEffect(() => {
    if (inputs || failed) window.dispatchEvent(new CustomEvent("journey:ready", { detail: "/weather" }));
  }, [inputs, failed]);

  useEffect(() => {
    if (live) tintInk([0.55, 0.35, 0.12], true);
  }, [live]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!rive) return;
    rive.play(MACHINE);
    const available = rive.stateMachineInputs(MACHINE) ?? [];
    const bindings = {} as Inputs;
    for (const name of ["targetX", "targetY", "speed", "mode"] as const) {
      const input = available.find((item) => item.name === name && item.type === StateMachineInputType.Number);
      if (!input) {
        rive.pause();
        setFailed(true);
        return;
      }
      bindings[name] = input;
    }
    bindings.targetX.value = bindings.targetY.value = 50;
    bindings.speed.value = 0;
    setInputs(bindings);
    return () => setInputs(null);
  }, [rive]);

  useEffect(() => {
    if (inputs) inputs.mode.value = mode === "pull" ? 0 : 1;
  }, [inputs, mode]);

  useEffect(() => {
    const element = surface.current;
    if (!rive || !inputs || !element) return;
    let previous: { x: number; y: number; time: number; id: number } | null = null;
    let idleTimer: number | undefined;
    const reset = () => {
      window.clearTimeout(idleTimer);
      previous = null;
      inputs.targetX.value = inputs.targetY.value = 50;
      inputs.speed.value = 0;
    };
    const syncPlayback = () => {
      reset();
      if (live && !reduced && !document.hidden) rive.play(MACHINE);
      else rive.pause();
    };
    syncPlayback();
    const move = (event: PointerEvent) => {
      if (!live || reduced || document.hidden || !event.isPrimary) return;
      const rect = element.getBoundingClientRect();
      // Match Fit.Contain, including the letterbox around the 1000 × 600 artboard.
      const scale = Math.min(rect.width / 1000, rect.height / 600);
      if (scale <= 0) return;
      const x = clamp((event.clientX - rect.left - (rect.width - 1000 * scale) / 2) / (1000 * scale) * 100);
      const y = clamp((event.clientY - rect.top - (rect.height - 600 * scale) / 2) / (600 * scale) * 100);
      const elapsed = previous ? event.timeStamp - previous.time : 0;
      // Speed is normalized artboard units/second, capped at 100. No physics integration.
      inputs.speed.value = previous && previous.id === event.pointerId && elapsed > 0 && elapsed < 200
        ? clamp(Math.hypot(x - previous.x, y - previous.y) * 1000 / elapsed)
        : 0;
      inputs.targetX.value = x;
      inputs.targetY.value = y;
      previous = { x, y, time: event.timeStamp, id: event.pointerId };
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        inputs.speed.value = 0;
        previous = null;
      }, 100);
    };
    const up = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") reset();
    };
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerdown", move);
    element.addEventListener("pointerleave", reset);
    element.addEventListener("pointercancel", reset);
    element.addEventListener("pointerup", up);
    document.addEventListener("visibilitychange", syncPlayback);
    window.addEventListener("blur", reset);
    window.addEventListener("resize", reset);
    return () => {
      // useRive may dispose its inputs before this effect's unmount cleanup.
      // Clear pending work without writing into the destroyed WASM objects.
      window.clearTimeout(idleTimer);
      previous = null;
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerdown", move);
      element.removeEventListener("pointerleave", reset);
      element.removeEventListener("pointercancel", reset);
      element.removeEventListener("pointerup", up);
      document.removeEventListener("visibilitychange", syncPlayback);
      window.removeEventListener("blur", reset);
      window.removeEventListener("resize", reset);
      rive.pause();
    };
  }, [rive, inputs, live, reduced]);

  return (
    <section ref={root} className="room magnets" id="magnets">
      <div ref={surface} className="room-canvas well">
        <RiveComponent style={{ position: "absolute", inset: 0 }} aria-hidden="true" />
        {failed && <p role="status">The elastic shapes couldn’t load. Please refresh to try again.</p>}
      </div>
      <div className="room-copy invert">
        <p className="kicker invert">Come close, or make space</p>
        <h2 className="display">Your hand is the weather.</h2>
        <p className="lede invert">Draw things in, or give them room. Both are kindness.</p>
        <button
          type="button"
          className="text-btn invert"
          disabled={failed || !inputs || reduced}
          onClick={() => setMode((m) => (m === "pull" ? "push" : "pull"))}
        >
          Mode: {mode}
        </button>
      </div>
    </section>
  );
}
