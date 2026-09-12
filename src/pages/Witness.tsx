import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { clamp01 as clamp, chapterAt, chapters, localProgress, type Attention } from "./witnessExperience";
import "./witness.css";

const WitnessScene = lazy(() => import("./WitnessScene"));
const feelings = { worry: "I am worried", tiredness: "I am tired", anger: "I am angry", joy: "I am joyful" };
const attentionDetails = {
  message: { label: "The message", text: "They’re disappointed in me.", note: "An interpretation comes forward. The reply is still unknown.", kind: "Meaning / an imagined answer" },
  window: { label: "The window", text: "Light moves across the curtain.", note: "The message is still unanswered. Another detail becomes available.", kind: "Seeing / light and movement" },
  cup: { label: "The cup", text: "Warmth. A little steam.", note: "Sensation comes forward. You don’t have to make the worry disappear.", kind: "Sensing / warmth in the hands" },
};
const watcherDetails = [
  { label: "An inner voice", title: "“I’m the one watching.”", note: "Can you hear that sentence as a thought, just as you heard the earlier story?", kind: "A thought", className: "voice" },
  { label: "A mental image", title: "A picture of me, here.", note: "Perhaps you imagine yourself sitting behind your eyes. Can that picture be noticed?", kind: "An image", className: "image" },
  { label: "A felt location", title: "Somewhere behind the eyes.", note: "Perhaps there is pressure, tension, or a sense of being here. What is that like, directly?", kind: "A sensation", className: "location" },
];
function Copy({ eyebrow, title, children, className = "" }: { eyebrow: string; title: ReactNode; children: ReactNode; className?: string }) {
  return <div className={`witness-copy ${className}`}><span className="witness-kicker">{eyebrow}</span><h2>{title}</h2><div className="witness-copy-body">{children}</div></div>;
}

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
  const [feeling, setFeeling] = useState<keyof typeof feelings>("worry");
  const [watcher, setWatcher] = useState(0);
  const [examined, setExamined] = useState<number[]>([]);
  const [reflection, setReflection] = useState<number | null>(null);
  const index = chapterAt(position);
  const chapter = chapters[index];
  const phase = chapter.phase;
  const local = localProgress(position);
  const interactive = phase === "orbit";
  const canAttend = phase === "inside" || phase === "attention";
  const fieldOpen = phase === "rest" ? 1 : phase === "unframe" ? clamp(local / .7) : 0;
  const dark = ["inside", "story", "sensation", "attention"].includes(phase);
  const sceneOpacity = phase === "unframe" ? 1 - clamp(local / .8) : phase === "rest" ? .24 * clamp(local / .22) : 1;

  useEffect(() => {
    if (ready || failed) window.dispatchEvent(new CustomEvent("journey:ready", { detail: "/witness" }));
  }, [ready, failed]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const preference = () => setReduceMotion(media.matches);
    preference(); media.addEventListener("change", preference);
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = journey.current;
        if (!el) return;
        progress.current = clamp(-el.getBoundingClientRect().top / Math.max(1, el.offsetHeight - window.innerHeight));
        setPosition(progress.current);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { cancelAnimationFrame(frame); media.removeEventListener("change", preference); window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
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
  useEffect(() => { setFocused(null); attention.current = null; }, [phase]);

  const visit = (p: number) => {
    const el = journey.current;
    if (!el) return;
    if (p === 0) { orbit.current = { x: 0, y: 0, manual: false }; setFocused(null); setNoticed(false); setExamined([]); setWatcher(0); setReflection(null); }
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + p * (el.offsetHeight - window.innerHeight), behavior: "instant" });
  };
  const focus = (target: Attention) => { setFocused(target); attention.current = target; };
  const examine = (item: number) => { setWatcher(item); setExamined(items => items.includes(item) ? items : [...items, item]); };

  return (
    <main className={`witness-page${reduceMotion || paused ? " witness-still" : ""}`}>
      <header className={`witness-nav${dark ? " is-dark" : ""}`}><a href="/">Sarena</a><span>Witness / An experience in ten chapters</span><a href="/rooms">All rooms ↗</a></header>
      <section ref={journey} className="witness-journey" aria-label="An interactive exploration of attention and awareness">
        <div className={`witness-stage${dark ? " is-dark" : ""}`} data-phase={phase} style={{ "--chapter-progress": local, "--field-open": fieldOpen } as CSSProperties}>
          <div className="witness-canvas-wrap" style={{ opacity: sceneOpacity }} tabIndex={interactive ? 0 : -1} role="group"
            aria-label="A room revealed inside the television head of a seated figure. In the viewer chapter, use left and right arrow keys or drag to look around."
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
          {failed && <div className="witness-fallback" role="status">The 3D room isn’t available here. The visual chapters and exercises still work.</div>}
          <div className={`witness-edge${focused === "message" || phase === "story" || phase === "sensation" ? " is-absorbed" : ""}`} />
          <h1 className="witness-sr-only">Witness: the movie, the viewer, and what comes next</h1>
          <nav className="witness-chapters" aria-label="Experience chapters">{chapters.map((item, i) => <button type="button" key={item.phase} aria-label={`${i + 1}. ${item.label}`} aria-current={i === index ? "step" : undefined} onClick={() => visit(item.start + .002)}><span>{String(i + 1).padStart(2, "0")}</span><i /><small>{item.label}</small></button>)}</nav>

          {phase === "inside" && <>
            <Copy eyebrow="01 / The movie" title={<>For a moment,<br /><em>this is everything.</em></>}><p>A room. Your phone. Something on your mind.<br />This is the movie of an ordinary afternoon.</p><p className="witness-instruction">Touch a detail. Then scroll to see what happens.</p></Copy>
            <div className="witness-film-label" aria-hidden="true"><i /> A moment, already unfolding</div>
          </>}
          {phase === "story" && <>
            <Copy eyebrow="02 / The dialogue" title={<>A fact becomes<br /><em>a whole story.</em></>}><p>There is no reply yet. The mind begins to fill in the silence.</p><p>Keep scrolling. Notice how much gets added to what you actually know.</p></Copy>
            <div className="witness-story-stack">
              <div className="witness-message-card"><span>What happened</span><p>Hey, is everything okay?</p><small>Delivered · No reply yet</small></div>
              <div className="witness-story-card" style={{ opacity: .35 + clamp(local * 3) * .65, transform: `translateY(${(1 - clamp(local * 3)) * 22}px)` }}><span>The interpretation</span><p>“They’re disappointed in me.”</p></div>
              <div className="witness-story-card is-identity" style={{ opacity: clamp((local - .25) * 3), transform: `translateY(${(1 - clamp((local - .25) * 3)) * 22}px)` }}><span>The story of me</span><p>“I always mess things up.”</p></div>
            </div>
          </>}
          {phase === "sensation" && <>
            <Copy eyebrow="03 / The soundtrack" title={<>And the story<br /><em>can be felt.</em></>}><p>Imagine a tightening chest. A held breath.<br />Now the thought can feel like a verdict.</p><p>The sensation and the interpretation are both part of the movie.</p></Copy>
            <div className="witness-body-visual"><div className="witness-body-head" /><div className="witness-body-outline" /><div className="witness-body-pulse"><i /><i /><i /><b /></div><span className="witness-body-label">Tension in the chest</span><span className="witness-body-thought">“I did something wrong.”</span><small>An illustration of how worry might feel</small></div>
          </>}
          {phase === "pullback" && <Copy eyebrow="04 / A little distance" title={<>The same moment.<br /><em>A wider view.</em></>} className="witness-copy-low"><p>The room is still there. The message is still unanswered.</p><p>What felt like the whole world becomes something you can notice.</p></Copy>}
          {interactive && <>
            <Copy eyebrow="05 / The viewer" title={<>“I can watch<br /><em>this happening.”</em></>}><p>The chair gives that shift a shape.<br />A thought can be present without becoming the whole truth.</p><p className="witness-instruction">Stay here a little. There is another discovery ahead.</p></Copy>
            <div className="witness-orbit-help"><span>↔</span><p>{reduceMotion ? "Choose a view" : "Move across the scene or drag to look around"}</p><div>{["Back", "Side", "Front"].map((name, i) => <button type="button" key={name} onClick={() => { orbit.current.x = i * .5; orbit.current.manual = true; }}>{name}</button>)}</div></div>
          </>}
          {phase === "attention" && <>
            <Copy eyebrow="06 / Attention edits the movie" title={<>One room.<br /><em>Different foregrounds.</em></>}><p>Attention gives one part of the moment more weight. Try moving it.</p>
              <div className="witness-attention-choices">{(["message", "window", "cup"] as const).map(item => <button type="button" key={item} aria-pressed={focused === item} onClick={() => focus(item)}>{attentionDetails[item].label}</button>)}</div>
            </Copy>
            <div className="witness-attention-readout" aria-live="polite"><span className="witness-kicker">{focused ? attentionDetails[focused].kind : "Choose a detail"}</span><p>{focused ? attentionDetails[focused].text : "What comes forward for you?"}</p><small>{focused ? attentionDetails[focused].note : "The room continues while your attention moves."}</small></div>
          </>}
          <div className="witness-details-layer" hidden={!canAttend || !ready}>{(["message", "window", "cup"] as const).map((target, i) => <button type="button" key={target} ref={el => { anchorElements.current[i] = el; }} className={`witness-detail${focused === target ? " is-selected" : ""}`} aria-label={`Notice ${attentionDetails[target].label.toLowerCase()}`} aria-pressed={focused === target} onPointerEnter={e => { if (e.pointerType === "mouse") focus(target); }} onFocus={() => focus(target)} onClick={() => focus(target)}><i /><span>{attentionDetails[target].label}</span></button>)}</div>
          {phase === "inside" && focused && <div className="witness-opening-detail" aria-live="polite"><span className="witness-kicker">{attentionDetails[focused].label}</span><p>{focused === "message" ? thoughtDepth >= 2 ? "“They must be upset with me.”" : thoughtDepth >= 1 ? "“Did I say something wrong?”" : "Hey, is everything okay?" : attentionDetails[focused].text}</p><small>{focused === "message" ? "No reply yet. Notice the associations arriving." : attentionDetails[focused].note}</small></div>}

          {phase === "observer" && <section className="witness-practice" aria-label="Practice noticing a feeling">
            <span className="witness-kicker">07 / Try the first shift</span><h2>Make a little<br /><em>room around it.</em></h2>
            <ol><li><b>Stop.</b> Pause for a moment.</li><li><b>Notice.</b> A thought, a feeling, a sensation.</li><li><b>Name it.</b> “I am aware of…”</li></ol>
            <div className="witness-feelings" aria-label="Example feelings">{(Object.keys(feelings) as (keyof typeof feelings)[]).map(item => <button type="button" key={item} aria-pressed={feeling === item} onClick={() => { setFeeling(item); setNoticed(false); }}>{item}</button>)}</div>
            <button type="button" className="witness-seat-button" onClick={() => setNoticed(!noticed)}>{noticed ? "Try again ↺" : "Notice the feeling ↗"}</button><p className="witness-practice-note">Use an example, or silently name what is here for you.</p>
            <div className={`witness-feeling-frame${noticed ? " is-noticed" : ""}`} aria-live="polite"><span>{noticed ? "A feeling, being noticed" : "Caught in the feeling"}</span><p>“{noticed ? `I am aware of a feeling of ${feeling}` : feelings[feeling]}.”</p><small>{noticed ? "It can stay. There is room around it." : "Tap ‘Notice the feeling’ to change the frame."}</small></div>
          </section>}
          {phase === "inquiry" && <>
            <Copy eyebrow="08 / Turn toward the watcher" title={<>What is this feeling<br /><em>of ‘me, watching’?</em></>}><p>Look gently for the one doing the observing.<br />What do you actually notice?</p><div className="witness-watcher-choices">{watcherDetails.map((item, i) => <button key={item.label} type="button" aria-pressed={watcher === i} onClick={() => examine(i)}><span>{item.label}</span><small>{examined.includes(i) ? "Explored" : "Explore ↗"}</small></button>)}</div><p className="witness-instruction">You might notice something else, or nothing clear. Stay curious.</p></Copy>
            <div className={`witness-watcher-lens is-${watcherDetails[watcher].className}${examined.includes(watcher) ? " is-examined" : ""}`}><div className="witness-lens-art" aria-hidden="true"><i /><i /><i /><b /></div><span className="witness-kicker">{examined.includes(watcher) ? `${watcherDetails[watcher].kind} / also noticed` : "The felt observer"}</span><p>{watcherDetails[watcher].title}</p><small>{watcherDetails[watcher].note}</small></div>
          </>}
          {(phase === "unframe" || phase === "rest") && <div className="witness-open-field" aria-hidden="true"><div className="witness-open-boundary" /><div className="witness-fragment fragment-thought"><span>Thought</span><p>“They might be upset.”</p></div><div className="witness-fragment fragment-light"><span>Seeing</span><i /></div><div className="witness-fragment fragment-watcher"><span>Sense of self</span><p>“Me, watching.”</p></div><div className="witness-fragment fragment-warmth"><span>Sensation</span><i /></div></div>}
          {phase === "unframe" && <Copy eyebrow="09 / No next person behind the person" title={<>Even the watcher<br /><em>can be noticed.</em></>} className="witness-copy-center"><p>A sentence. An image. A feeling of being somewhere.<br />These can appear alongside light, warmth, and worry.</p><p>Explore this: does experience need another watcher behind it?</p></Copy>}
          {phase === "rest" && <Copy eyebrow="10 / Life continues" title={<>Nothing to hold.<br /><em>Still, life.</em></>} className="witness-copy-center"><p>Seeing happens. Thoughts arrive. Feelings move.<br />Try letting go of repeating “I am watching.”<br />What continues on its own?</p><p>You can still care, choose, and participate.</p><button type="button" className="witness-seat-button" onClick={() => document.querySelector('.witness-after')?.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth" })}>Take this into your day ↓</button></Copy>}

          <footer className="witness-scene-footer"><div className="witness-chapter-status"><span>{String(index + 1).padStart(2, "0")} <i>/ 10</i></span><p>{chapter.hint}</p></div><div className="witness-footer-actions"><button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "Resume motion" : "Pause motion"}</button>{index > 0 && <button type="button" aria-label="Previous chapter" onClick={() => visit(chapters[index - 1].start + .002)}>←</button>}<button type="button" onClick={() => index < chapters.length - 1 ? visit(chapters[index + 1].start + .002) : visit(0)}>{index < chapters.length - 1 ? "Next chapter ↗" : "Begin again ↗"}</button></div></footer>
          <div className="witness-progress" aria-hidden="true"><i style={{ transform: `scaleX(${position})` }} /></div>
        </div>
      </section>
      <section className="witness-after">
        <span className="witness-kicker">Back in your own afternoon</span><h2>The message might<br />still need a reply.</h2><p className="witness-after-intro">Awareness makes room to participate. You can feel the tension, question the story, and decide what to do next.</p>
        <div className="witness-takeaways"><article><span>01 / Absorbed</span><h3>“This is my reality.”</h3><p>A thought fills the frame. An interpretation feels like a fact.</p></article><article><span>02 / Noticing</span><h3>“A thought is here.”</h3><p>The same experience has a little room around it. You can respond with more perspective.</p></article><article><span>03 / Looking closer</span><h3>“Watching is noticed, too.”</h3><p>The felt observer can be explored as part of the experience. There is no need to picture another person behind it.</p></article></div>
        <div className="witness-reflection"><span className="witness-kicker">A small check-in</span><h3>If worry returns, what could you try?</h3><div>{["Make the mind go blank", "Notice the feeling and the story", "Find a perfectly calm watcher"].map((answer, i) => <button type="button" key={answer} aria-pressed={reflection === i} onClick={() => setReflection(i)}>{answer}<span>↗</span></button>)}</div><p aria-live="polite">{reflection === null ? "There is no special state you have to achieve." : reflection === 1 ? "Yes. The worry can be present without every interpretation becoming a verdict. Even the sense of ‘me noticing’ is open to investigation." : reflection === 0 ? "Thoughts can keep arriving. Try noticing one without needing to remove it." : "Calm may come or go. The felt watcher is something to investigate, rather than a position you have to keep holding."}</p></div>
        <p className="witness-after-note">This is an invitation to explore your own experience. The TV, chair, and open space are metaphors. You don’t have to feel blank, calm, or separate from life for the inquiry to be useful.</p>
        <button type="button" onClick={() => visit(.562)}>Practice noticing ↗</button><button type="button" onClick={() => visit(.662)}>Explore the watcher ↗</button><button type="button" onClick={() => visit(0)}>Begin again ↺</button>
      </section>
    </main>
  );
}
