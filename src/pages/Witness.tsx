import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from "react";
import { clamp01 as clamp, phaseAt, phaseStops, type Attention } from "./witnessExperience";
import "./witness.css";

const WitnessScene = lazy(() => import("./WitnessScene"));
const attentionDetails = {
  message: { label: "The message", text: "Hey, is everything okay?", note: "Delivered · No reply yet" },
  window: { label: "The window", text: "Light through the curtain.", note: "It was here a moment ago, too." },
  cup: { label: "The cup", text: "A little warmth. A rising breath of steam.", note: "Another part of the very same moment." },
};

export function Witness() {
  const journey = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const orbit = useRef({ x: 0, y: 0, manual: false });
  const reduced = useRef(false);
  const motionPaused = useRef(false);
  const attention = useRef<Attention>(null);
  const anchorElements = useRef<(HTMLButtonElement | null)[]>([]);
  const pointerStart = useRef<{ x: number; angle: number } | null>(null);
  const [position, setPosition] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState<Attention>(null);
  const [thoughtDepth, setThoughtDepth] = useState(0);
  const [noticed, setNoticed] = useState(false);
  const phase = phaseAt(position);
  const interactive = phase === "orbit";
  const canAttend = phase === "inside" || phase === "attention";
  const white = clamp((position - .76) / .17);
  const collapse = Math.max(noticed ? 1 : 0, clamp((position - .825) / .07));

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const preference = () => setReduceMotion(media.matches);
    preference();
    media.addEventListener("change", preference);
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = journey.current;
        if (!el) return;
        progress.current = clamp(-el.getBoundingClientRect().top / (el.offsetHeight - window.innerHeight));
        setPosition(progress.current);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      media.removeEventListener("change", preference);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  useEffect(() => { reduced.current = reduceMotion; motionPaused.current = paused; }, [reduceMotion, paused]);
  useEffect(() => {
    attention.current = focused;
    setThoughtDepth(0);
    if (focused !== "message" || !canAttend) return;
    const first = window.setTimeout(() => setThoughtDepth(1), 850);
    const second = window.setTimeout(() => setThoughtDepth(2), 2300);
    return () => { clearTimeout(first); clearTimeout(second); };
  }, [focused, canAttend]);
  useEffect(() => { if (position < .74) setNoticed(false); }, [position]);
  useEffect(() => { setFocused(null); attention.current = null; }, [phase]);

  const visit = (p: number) => {
    const el = journey.current;
    if (!el) return;
    if (p === 0) { orbit.current = { x: 0, y: 0, manual: false }; setFocused(null); setNoticed(false); }
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + p * (el.offsetHeight - window.innerHeight), behavior: "instant" });
  };
  const nextStop = phaseStops.find(p => p > position + .04);
  const focus = (target: Attention) => { setFocused(target); attention.current = target; };
  const footer = {
    inside: "Let your attention land somewhere. Then scroll.",
    pullback: "Same moment. A little more room.",
    orbit: "Look around. The world is still playing.",
    attention: "Move between the details. Notice what comes forward.",
    observer: "Can the sense of watching be noticed, too?",
    rest: "Let your hand rest. There’s nothing to maintain.",
  }[phase];

  return (
    <main className={`witness-page${reduceMotion || paused ? " witness-still" : ""}`}>
      <header className="witness-nav"><a href="/">Sarena</a><span>Witness / A study of perspective</span><a href="/rooms">All rooms ↗</a></header>
      <section ref={journey} className="witness-journey" aria-label="An interactive exploration of attention and awareness">
        <div className="witness-stage" data-phase={phase} style={{ "--gallery": white } as CSSProperties}>
          <div className="witness-canvas-wrap" tabIndex={interactive ? 0 : -1} role="group"
            aria-label="A room and a seated figure. During the orbit, use the mouse, a horizontal drag, or left and right arrow keys to look around."
            onKeyDown={e => { if (interactive && (e.key === "ArrowLeft" || e.key === "ArrowRight")) { e.preventDefault(); orbit.current.manual = true; orbit.current.x = Math.max(-1, Math.min(1, orbit.current.x + (e.key === "ArrowRight" ? .16 : -.16))); } }}
            onPointerDown={e => { if (canAttend) focus(null); if (interactive && e.pointerType !== "mouse") { pointerStart.current = { x: e.clientX, angle: orbit.current.x }; e.currentTarget.setPointerCapture(e.pointerId); } }}
            onPointerMove={e => {
              if (!interactive || reduced.current) return;
              orbit.current.manual = true;
              if (e.pointerType === "mouse") { orbit.current.x = (e.clientX / window.innerWidth - .5) * 2; orbit.current.y = (e.clientY / window.innerHeight - .5) * 2; }
              else if (pointerStart.current) orbit.current.x = Math.max(-1, Math.min(1, pointerStart.current.angle + (e.clientX - pointerStart.current.x) / (window.innerWidth * .65)));
            }} onPointerUp={() => { pointerStart.current = null; }} onPointerCancel={() => { pointerStart.current = null; }}>
            <Suspense fallback={null}><WitnessScene progress={progress} orbit={orbit} reduced={reduced} attention={attention} anchors={anchorElements} motionPaused={motionPaused} onReady={() => setReady(true)} onError={() => setFailed(true)} /></Suspense>
          </div>
          {!ready && !failed && <div className="witness-loading">A little room for perspective<span /></div>}
          {failed && <div className="witness-loading">The 3D scene couldn’t start on this device.<p>You can still read the idea below.</p><button type="button" onClick={() => document.querySelector('.witness-after')?.scrollIntoView()}>Continue ↓</button></div>}
          <div className={`witness-edge${focused === "message" && canAttend ? " is-absorbed" : ""}`} />
          <h1 className="witness-sr-only">Witness: a study of perspective</h1>
          <div className="witness-details-layer" hidden={!canAttend || !ready}>
            {(["message", "window", "cup"] as const).map((target, index) => <button type="button" key={target} ref={el => { anchorElements.current[index] = el; }} className={`witness-detail${focused === target ? " is-selected" : ""}`} aria-label={attentionDetails[target].label} aria-pressed={focused === target} onPointerLeave={e => { if (e.pointerType === "mouse") focus(null); }} onBlur={() => focus(null)} onPointerEnter={e => { if (e.pointerType === "mouse") focus(target); }} onFocus={() => focus(target)} onClick={() => focus(target)}><i /><span>{attentionDetails[target].label}</span></button>)}
          </div>
          {canAttend && focused && <div className="witness-attention-caption" aria-live="polite"><span>{attentionDetails[focused].text}</span><small>{attentionDetails[focused].note}</small></div>}
          {canAttend && focused === "message" && <div className="witness-interpretations" aria-live="polite"><p className={thoughtDepth >= 1 ? "is-visible" : ""}>Did I say something wrong?</p><p className={thoughtDepth >= 2 ? "is-visible" : ""}>They must be upset with me.</p>{thoughtDepth >= 2 && <small>An interpretation begins to feel like the scene itself.</small>}</div>}
          {phase === "pullback" && <div className="witness-line"><span>Something shifts.</span><p>The message is still unanswered.<br />But it isn’t the whole view.</p></div>}
          {interactive && <><div className="witness-orbit-copy"><span className="witness-kicker">A different point of view</span><h2>Who is<br /><em>watching?</em></h2></div><div className="witness-orbit-help"><span className="witness-orbit-icon">↔</span><p>{reduceMotion ? "Choose a view below" : "Move across the scene to look around"}<small>The same world is still playing.</small></p><div>{["Back", "Side", "Front"].map((name, i) => <button type="button" key={name} onClick={() => { orbit.current.x = i * .5; orbit.current.manual = true; }}>{name}</button>)}</div></div></>}
          <div className="witness-awareness-field" aria-hidden={phase !== "observer" && phase !== "rest"} style={{ opacity: clamp((position - .74) / .035), pointerEvents: phase === "observer" ? "auto" : "none", "--collapse": collapse } as CSSProperties}>
            <div className="witness-field-ring" />
            <span className="witness-field-thought witness-field-thought-one" style={{ opacity: collapse }}>“They must be upset with me.”<small>A thought</small></span>
            <button className="witness-observer-thought" type="button" tabIndex={phase === "observer" ? 0 : -1} onClick={() => setNoticed(true)}><span>“I’m watching.”</span><small>{collapse > .5 ? "A thought, too" : "Notice this"}</small></button>
            <span className="witness-field-thought witness-field-thought-two" style={{ opacity: collapse }}>Warmth. Light. Breath.<small>Sensations</small></span>
            <p className="witness-field-note" style={{ opacity: collapse }}>Even the sense of watching<br />can be part of what is noticed.</p>
          </div>
          {phase === "rest" && <div className="witness-rest-copy"><span className="witness-kicker">Nothing to hold together</span><h2>Already<br /><em>happening.</em></h2><p>You can stop moving.<br />The moment continues.</p></div>}
          <footer className="witness-scene-footer"><span>{footer}</span><div><button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "Resume motion" : "Pause motion"}</button><button type="button" onClick={() => nextStop !== undefined ? visit(nextStop) : visit(0)}>{nextStop !== undefined ? "Continue ↗" : "Begin again ↗"}</button></div></footer>
          <div className="witness-scroll-track" aria-hidden="true"><i style={{ transform: `scaleY(${position})` }} /></div>
        </div>
      </section>
      <section className="witness-after">
        <span className="witness-kicker">What you may have noticed</span><h2>The scene continued.<br />Your relationship to it moved.</h2>
        <div className="witness-after-passages"><p><b>Attention gathers.</b> An unanswered message can become the centre of a whole story. Looking elsewhere doesn’t answer it; it reveals what else is present.</p><p><b>The frame opens.</b> The pullback makes room around that story. The TV and chair are a visual metaphor for noticing, not a separate self you must escape into.</p><p><b>The watcher can be noticed.</b> “I’m watching” appears alongside the earlier interpretation. This invites the question of whether the observer needs to stand outside experience.</p><p><b>The moment carries on.</b> The open white space represents room for changing experiences. There’s no calm state to achieve and no feeling you are required to have.</p></div>
        <details><summary>The ideas behind the experience <span>+</span></summary><p>In <a href="https://www.organism.earth/library/document/mind-over-mind" target="_blank" rel="noreferrer">Mind over Mind, 09:24–12:53</a>, Alan Watts describes witnessing thoughts, then questions whether the watching self is itself another thought. Ram Dass describes <a href="https://www.ramdass.org/mindfulness-daily-habit/" target="_blank" rel="noreferrer">cultivating the witness</a> as becoming less caught in life’s drama. These are related perspectives, not identical teachings. The experience is an artistic interpretation, not a literal diagram of consciousness.</p></details><button type="button" onClick={() => visit(0)}>Return to the scene ↗</button>
      </section>
    </main>
  );
}
