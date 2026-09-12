import { useEffect, useState, useRef, useCallback } from "react";
import {
  useRive,
  useStateMachineInput,
  Layout,
  Fit,
  Alignment,
  type StateMachineInput,
} from "@rive-app/react-canvas";
import { prefersReducedMotion } from "@/lib/motion";
import { playTone } from "@/lib/chime";

const MOTES = Array.from({ length: 14 }, (_, i) => ({
  left: `${8 + ((i * 17) % 84)}%`,
  top: `${12 + ((i * 23) % 70)}%`,
  delay: `${(i * 0.45) % 8}s`,
  size: `${6 + (i % 4) * 3}px`,
}));

type BreathPhase = "inhale" | "hold" | "exhale";

const PHASE_CONFIG: Record<
  BreathPhase,
  { label: string; stageValue: number; duration: number; freq: number }
> = {
  inhale: { label: "Inhale", stageValue: 0, duration: 4000, freq: 330 }, // E4
  hold: { label: "Hold", stageValue: 1, duration: 2500, freq: 392 },   // G4
  exhale: { label: "Exhale", stageValue: 2, duration: 4000, freq: 220 }, // A3
};

export function Breath() {
  const [phase, setPhase] = useState<BreathPhase>("inhale");
  const [isInteracting, setIsInteracting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const reduced = prefersReducedMotion();

  // Load Rive file at /rive/breath.riv (served from /public/rive/breath.riv)
  const { rive, RiveComponent } = useRive({
    src: "/rive/breath.riv",
    stateMachines: "BreathMachine",
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

  // Rive State Machine Inputs
  const stageInput = useStateMachineInput(rive, "BreathMachine", "stage");
  const isHoveredInput = useStateMachineInput(rive, "BreathMachine", "isHovered");
  const isInteractingInput = useStateMachineInput(rive, "BreathMachine", "isInteracting");

  // Keep a pool of all matching state machine inputs
  const customInputsRef = useRef<{
    stage: StateMachineInput[];
    interacting: StateMachineInput[];
  }>({ stage: [], interacting: [] });

  useEffect(() => {
    if (!rive) return;
    const stages: StateMachineInput[] = [];
    const interactings: StateMachineInput[] = [];

    if (stageInput) stages.push(stageInput);
    if (isHoveredInput) interactings.push(isHoveredInput);
    if (isInteractingInput) interactings.push(isInteractingInput);

    const smNames = rive.stateMachineNames || [];
    for (const sm of smNames) {
      try {
        const inputs = rive.stateMachineInputs(sm);
        if (inputs) {
          for (const input of inputs) {
            const name = input.name.toLowerCase();
            if (
              (name === "stage" || name === "phase" || name === "state") &&
              !stages.includes(input)
            ) {
              stages.push(input);
            }
            if (
              (name === "ishovered" || name === "isinteracting" || name === "hover" || name === "active") &&
              !interactings.includes(input)
            ) {
              interactings.push(input);
            }
          }
        }
      } catch {
        // Safe check
      }
    }

    customInputsRef.current = { stage: stages, interacting: interactings };
  }, [rive, stageInput, isHoveredInput, isInteractingInput]);

  // Audio & subtle haptic feedback
  const triggerCue = useCallback((nextPhase: BreathPhase) => {
    const config = PHASE_CONFIG[nextPhase];
    // Gentle sine chime
    playTone(config.freq, 1.2, 0.035);

    // Subtle haptic pulse if supported
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate?.(12);
      } catch {
        // Vibration not supported or blocked
      }
    }
  }, []);

  // Update Rive inputs when phase changes
  const applyStageToRive = useCallback((stageNum: number) => {
    for (const input of customInputsRef.current.stage) {
      input.value = stageNum;
    }
  }, []);

  // Update interaction inputs
  useEffect(() => {
    for (const input of customInputsRef.current.interacting) {
      input.value = isInteracting;
    }
  }, [isInteracting]);

  // Breathing cycle timer (Inhale -> Hold -> Exhale -> Inhale)
  useEffect(() => {
    if (reduced) {
      applyStageToRive(1); // Still hold state for reduced motion
      return;
    }

    let timer: number;
    const nextPhaseMap: Record<BreathPhase, BreathPhase> = {
      inhale: "hold",
      hold: "exhale",
      exhale: "inhale",
    };

    const currentConfig = PHASE_CONFIG[phase];
    applyStageToRive(currentConfig.stageValue);

    timer = window.setTimeout(() => {
      const next = nextPhaseMap[phase];
      setPhase(next);
      triggerCue(next);
    }, currentConfig.duration);

    return () => clearTimeout(timer);
  }, [phase, reduced, applyStageToRive, triggerCue]);

  const currentLabel = PHASE_CONFIG[phase].label;

  return (
    <section className="breath" id="breathe">
      <div className="room-copy">
        <p className="kicker">A living room</p>
        <h2 className="display">Breathe until you feel here.</h2>
        <p className="lede">
          The circle is already alive. Match it. In, then out. Nothing else is
          required.
        </p>
      </div>

      <div
        className="breath-stage well"
        aria-live="polite"
        onPointerEnter={() => setIsInteracting(true)}
        onPointerLeave={() => setIsInteracting(false)}
        onPointerDown={() => setIsInteracting(true)}
        onPointerUp={() => setIsInteracting(false)}
      >
        {MOTES.map((m, i) => (
          <i
            key={i}
            className="mote"
            style={{
              left: m.left,
              top: m.top,
              width: m.size,
              height: m.size,
              animationDelay: m.delay,
            }}
          />
        ))}

        {isLoaded && !hasError ? (
          <div
            className="lung lung-rive"
            style={{
              position: "relative",
              cursor: "pointer",
              overflow: "hidden",
            }}
          >
            <RiveComponent
              style={{
                width: "100%",
                height: "100%",
                display: "block",
              }}
            />
            <span
              className="lung-word"
              style={{
                position: "absolute",
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              {currentLabel}
            </span>
          </div>
        ) : (
          <div
            className={`lung lung-phase-${phase}${reduced ? " is-still" : ""}`}
            style={{ cursor: "pointer" }}
          >
            <span className="lung-word">{currentLabel}</span>
          </div>
        )}
      </div>
    </section>
  );
}
