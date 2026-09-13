import { useEffect, useRef, useState, type CSSProperties } from 'react';
import './practice.css';

type Phase = 'ready' | 'pausing' | 'open';
const responses = [
  { name: 'Ask for clarity', words: '“I’m not sure how to read that. Can you tell me more?”', note: 'Curiosity can be a next step, even with tension here.' },
  { name: 'Take some time', words: '“I want to think about this. I’ll come back to you.”', note: 'You can make room without needing a final answer.' },
  { name: 'Respond with care', words: '“That was difficult to hear. I’d like us to talk about it.”', note: 'You can name the impact without deciding the whole story.' },
];

export function Gap() {
  const [phase, setPhase] = useState<Phase>('ready');
  const [elapsed, setElapsed] = useState(0);
  const [response, setResponse] = useState<number | null>(null);
  const [deeper, setDeeper] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const experiment = useRef<HTMLElement>(null);
  const started = useRef(0);

  useEffect(() => {
    if (phase !== 'pausing' || motionPaused) return;
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      // Time away from the page does not rush someone through the experiment.
      if (!document.hidden) started.current += Math.min(now - previous, 100);
      previous = now;
      setElapsed(Math.min(started.current, 3000));
      if (started.current >= 3000) setPhase('open');
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase, motionPaused]);

  function reset() {
    started.current = 0;
    setElapsed(0);
    setResponse(null);
    setPhase('ready');
  }

  function tryIt() {
    experiment.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
    experiment.current?.focus({ preventScroll: true });
  }

  const progress = phase === 'open' ? 1 : elapsed / 3000;
  const seconds = Math.max(1, 3 - Math.floor(elapsed / 1000));

  return <main className={`practice-page gap-page${motionPaused ? ' motion-paused' : ''}`}>
    <header className="layers-intro gap-intro">
      <a className="practice-link" href="/practice">← All practices</a>
      <p className="practice-eyebrow">Practice 02 / The Gap</p>
      <h1>Before the reply.<br /><em>A little room.</em></h1>
      <p>An urge can arrive before you choose what to do.<br />Explore the small space between feeling it and following it.</p>
      <div className="practice-actions"><a className="practice-button" href="#gap-arrival">Guide me ↓</a><button className="practice-link" onClick={tryIt}>Try the three-second gap ↗</button></div>
      <span className="layers-intro-note">An imagined conversation · Nothing here is sent</span>
    </header>
    <section id="gap-arrival" className="gap-arrival">
      <div><p className="practice-eyebrow">01 / The pull</p><h2>A few words.<br /><em>A whole reaction.</em></h2><p>Imagine receiving this after a difficult conversation. Heat rises. A reply starts writing itself.</p><p>Perhaps the urge says: defend yourself, explain everything, send something now.</p><div className="layers-aside">A strong feeling is here.<br /><strong>What does it ask you to do?</strong></div></div>
      <div className="gap-message-scene"><span className="practice-eyebrow">An imagined message</span><div className="gap-incoming">“Whatever. Do what you want.”<small>Just now</small></div><div className="gap-draft">“Why do you always do this? I was only…”<span>Unsent draft</span></div><div className="gap-urgency" aria-hidden="true"><span>EXPLAIN</span><span>DEFEND</span><span>RIGHT NOW</span></div></div>
    </section>
    <section ref={experiment} tabIndex={-1} className="gap-experiment" aria-labelledby="gap-experiment-title" style={{ '--gap-progress': progress } as CSSProperties}>
      <div className="gap-experiment-top"><span className="practice-eyebrow">02 / Interrupt the momentum</span><button className="practice-link" aria-pressed={motionPaused} onClick={() => setMotionPaused(!motionPaused)}>{motionPaused ? 'Resume' : 'Pause'} motion & timer</button></div>
      <h2 id="gap-experiment-title">Something in me<br /><em>wants to react.</em></h2>
      <p>The urge can stay. For three seconds, simply notice it.</p>
      <div className={`gap-ring-scene gap-phase-${phase}`}>
        <div className="gap-rings" aria-hidden="true"><i /><i /><i /></div>
        <div className="gap-ring-center" aria-hidden="true">{phase === 'ready' ? '3' : phase === 'pausing' ? seconds : 'and…'}</div>
        <span className="gap-ring-label">{phase === 'ready' ? 'A moment before the next move' : phase === 'pausing' ? motionPaused ? 'Take your time. The timer is paused.' : 'Notice the urge. Let it be here.' : 'The feeling is here. Choice is here, too.'}</span>
      </div>
      <div className="gap-controls">
        {phase === 'ready' && <button className="practice-button" onClick={() => { setMotionPaused(false); setPhase('pausing'); }}>Begin the pause <span>↗</span></button>}
        {phase === 'pausing' && <button className="practice-button" onClick={() => setMotionPaused(!motionPaused)}>{motionPaused ? 'Continue the pause' : 'Pause the timer'}</button>}
        {phase === 'open' && <button className="practice-link" onClick={reset}>Try the pause again ↻</button>}
        {phase !== 'open' && <button className="practice-link" onClick={() => { setElapsed(3000); setPhase('open'); }}>Explore without a timer →</button>}
      </div>
      <p className="gap-status" role="status">{phase === 'ready' ? 'Start whenever you are ready. There is no response to get right.' : phase === 'pausing' ? motionPaused ? 'Timer paused.' : `${seconds} ${seconds === 1 ? 'second' : 'seconds'}. Something in me wants to react.` : 'The pause is complete. Explore a possible next response below.'}</p>
      {phase === 'open' && <div className="gap-choices"><p className="practice-eyebrow">03 / More than one next move</p><h3>What might you choose?</h3><p>You do not have to become calm before considering your options.</p><div className="gap-response-buttons" role="group" aria-label="Possible responses">{responses.map((item, index) => <button key={item.name} aria-pressed={response === index} onClick={() => setResponse(index)}>{item.name}<span>↗</span></button>)}</div><div className="gap-response-detail" aria-live="polite">{response === null ? <p>Choose an option to see one possible response. None is automatically the right one.</p> : <><blockquote>{responses[response].words}</blockquote><p>{responses[response].note}</p><small>An example to explore, not a message being sent.</small></>}</div></div>}
    </section>
    <section className="gap-integration"><p className="practice-eyebrow">04 / Take it with you</p><h2>Loud is a volume.<br /><em>Not a verdict.</em></h2><p>“This feels urgent” describes an experience. It does not, by itself, tell you which response will help.</p><p>When there is room to pause, try: <strong>“Something in me wants to react.”</strong> Notice one sensation. Then ask what the situation needs.</p><div className="layers-aside">The practice is noticing a choice.<br />The feeling does not have to disappear.</div><button className="practice-link" aria-expanded={deeper} aria-controls="gap-deeper" onClick={() => setDeeper(!deeper)}>{deeper ? '−' : '+'} Go deeper</button>{deeper && <div className="layer-description" id="gap-deeper"><p>Does the effort to “be a good observer” bring another urge—to get this right? That can be noticed, too. The pause is an invitation, not a test of control.</p></div>}</section>
    <footer className="practice-footer"><p>A feeling can be present.<br /><em>A response can be chosen.</em></p><div className="practice-actions"><a className="practice-button" href="/practice">Back to practices ↗</a><a className="practice-link" href="/practice/layers">Revisit Layers ↗</a></div></footer>
  </main>;
}
