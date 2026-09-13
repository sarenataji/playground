import { useEffect, useRef, useState, type CSSProperties } from 'react';
import './practice.css';

const layers = [
  { name: 'Sensation', phrase: 'Pressure in my chest.', note: 'A bodily sensation. Notice its location, texture, or movement without needing to explain it.', color: '#aac9ba' },
  { name: 'Emotion', phrase: 'Fear is here.', note: 'A name for the emotional tone of this moment. It can be present without defining you.', color: '#e2bf84' },
  { name: 'Thought', phrase: '“They’re upset with me.”', note: 'An interpretation of the silence. A thought can feel convincing before you know whether it is true.', color: '#acb9db' },
  { name: 'Story', phrase: '“I always ruin things.”', note: 'The mind connects this moment to a larger narrative. Notice the reach of the word “always.”', color: '#d3a6b6' },
  { name: 'Identity', phrase: '“I’m unlovable.”', note: 'A temporary experience becomes a verdict about who you are. That verdict can also be noticed as a thought.', color: '#c3b4db' },
];
const chapters = ['All at once', 'Name the layer', 'Directly here', 'Pain + commentary', 'No conclusion'];
const details = [
  { text: 'No reply yet', kind: 'Observable detail', note: 'There is no new reply on the phone. The reason is still unknown.' },
  { text: 'Pressure in my chest', kind: 'Direct sensation', note: 'If you notice pressure, that sensation is present. Its meaning is a separate question.' },
  { text: 'They must be disappointed', kind: 'Interpretation', note: 'The thought is here. Whether they are disappointed is not yet known.' },
  { text: 'This always happens to me', kind: 'Story', note: 'One moment is being connected to a whole history. You can notice that connection without settling it now.' },
];

export function Layers() {
  const [chapter, setChapter] = useState(0);
  const [selected, setSelected] = useState(0);
  const [detail, setDetail] = useState<number | null>(null);
  const [commentary, setCommentary] = useState(true);
  const [deeper, setDeeper] = useState(false);
  const [paused, setPaused] = useState(false);
  const sections = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const nodes = sections.current.filter((node): node is HTMLElement => !!node);
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setChapter(Number((entry.target as HTMLElement).dataset.chapter));
    }, { rootMargin: '-38% 0px -38% 0px', threshold: 0 });
    nodes.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  function moveTo(index: number) {
    // Native scrolling works with reduced motion and without the smooth-scroll runtime.
    sections.current[index]?.scrollIntoView({ behavior: 'instant', block: 'start' });
    sections.current[index]?.focus({ preventScroll: true });
    setChapter(index);
  }

  return <main className={`practice-page layers-page${paused ? ' motion-paused' : ''}`}>
    <header className="layers-intro">
      <a className="practice-link" href="/practice">← All practices</a>
      <p className="practice-eyebrow">Practice 01 / Layers</p>
      <h1>One moment.<br /><em>So much added.</em></h1>
      <p>A message goes unanswered. A feeling appears. Then a story about you.<br />Explore what happens when they stop looking like the same thing.</p>
      <div className="practice-actions"><button className="practice-button" onClick={() => moveTo(0)}>Guide me ↓</button><button className="practice-link" onClick={() => moveTo(1)}>Let me try it ↗</button></div>
      <span className="layers-intro-note">Five short chapters · Move at your own pace</span>
    </header>
    <div className="layers-toolbar"><span>Layers <b>0{chapter + 1} / 05</b></span><nav aria-label="Layers chapters">{chapters.map((name, index) => <button key={name} aria-label={`${index + 1}. ${name}`} aria-current={chapter === index ? 'step' : undefined} onClick={() => moveTo(index)}><span>{index + 1}</span><span className="chapter-name">{name}</span></button>)}</nav><button className="practice-link pause-motion" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? 'Resume motion' : 'Pause motion'}</button></div>
    <div className="layers-journey">
      <div className={`layers-stage stage-${chapter}`} aria-hidden="true">
        <div className="layers-stage-halo" />
        <div className="layers-stage-caption">{chapter === 0 ? 'WHEN IT ALL FEELS LIKE ONE THING' : chapter === 4 ? 'THE MOMENT CAN REMAIN OPEN' : 'THE SAME MOMENT. DIFFERENT LAYERS.'}</div>
        <div className="layers-object">
          <div className="layers-phone"><span>Today · 4:18</span><div>Hey, are we okay?</div><small>Delivered</small><p>No reply yet.</p><i /></div>
          {layers.map((layer, index) => <div key={layer.name} className={`layer-plane plane-${index}${selected === index ? ' is-selected' : ''}`} style={{ '--layer-color': layer.color, '--layer-index': index } as CSSProperties}><small>0{index + 1} / {layer.name}</small><span>{layer.phrase}</span></div>)}
        </div>
        <div className="layers-stage-bottom"><span>{chapter === 4 ? 'No new reply. No final verdict.' : 'An illustration of one possible experience.'}</span><span>↓</span></div>
      </div>
      <div className="layers-chapters">
        {chapters.map((name, index) => <section className="layers-chapter" key={name} data-chapter={index} tabIndex={-1} ref={node => { sections.current[index] = node; }} aria-labelledby={`chapter-${index}`}>
          <p className="practice-eyebrow">0{index + 1} / {name}</p>
          {index === 0 && <><h2 id={`chapter-${index}`}>The silence gets<br /><em>a meaning.</em></h2><p>There is no reply. You notice a tight chest. “They’re upset with me” arrives, followed by “I always ruin things.”</p><p>For a moment, the whole bundle can feel like a fact about you.</p><div className="layers-aside">Start with a small question.<br /><strong>What is this moment made of?</strong></div></>}
          {index === 1 && <><h2 id={`chapter-${index}`}>Give each part<br /><em>a little room.</em></h2><p>Select a layer. Notice how a sensation differs from an explanation of it.</p><div className="layer-selectors" role="group" aria-label="Explore the layers">{layers.map((layer, i) => <button key={layer.name} aria-pressed={selected === i} onClick={() => setSelected(i)} style={{ '--layer-color': layer.color } as CSSProperties}><i />{layer.name}<span>0{i + 1}</span></button>)}</div><div className="layer-description" aria-live="polite"><h3>{layers[selected].phrase}</h3><p>{layers[selected].note}</p></div><small className="practice-muted">A useful way to explore, not a fixed order or a test. Layers can overlap.</small></>}
          {index === 2 && <><h2 id={`chapter-${index}`}>Before the meaning,<br /><em>what is here?</em></h2><p>Touch a detail to explore what is observed and what is being inferred.</p><div className="detail-choices">{details.map((item, i) => <button key={item.text} aria-pressed={detail === i} onClick={() => setDetail(i)}>{item.text}<span>↗</span></button>)}</div><div className="detail-answer" aria-live="polite">{detail === null ? <p>Choose any detail. There is nothing to get right.</p> : <><span className="practice-eyebrow">{details[detail].kind}</span><p>{details[detail].note}</p></>}</div><p className="practice-muted">A thought is part of the experience. Its presence does not establish that its content is true.</p></>}
          {index === 3 && <><h2 id={`chapter-${index}`}>The ache.<br /><em>And the added words.</em></h2><p>You do not have to dismiss the hurt to notice the commentary around it.</p><div className={`commentary-experiment${commentary ? ' with-commentary' : ''}`}><div className="pain-orb" aria-hidden="true" /><strong>“This hurts.”</strong><div className="commentary-words" aria-hidden={!commentary}><span>It always will.</span><span>I’m not enough.</span><span>Nobody stays.</span></div></div><button className="practice-button" aria-pressed={!commentary} onClick={() => setCommentary(!commentary)}>{commentary ? 'Set the commentary aside' : 'Bring the commentary back'} <span>↗</span></button><p className="practice-muted" aria-live="polite">{commentary ? 'Notice the extra conclusions surrounding the hurt.' : 'The hurt remains in the illustration. The extra verdicts have been set aside. In life, they may return; you can notice them again.'}</p></>}
          {index === 4 && <><h2 id={`chapter-${index}`}>An unanswered message.<br /><em>Not a finished story.</em></h2><p>The phone has not changed. A feeling may still be here. You can care about the relationship without deciding what this says about your whole life.</p><blockquote>No conclusion needed.</blockquote><div className="layers-aside"><span className="practice-eyebrow">Take it into your day</span><p>When a small moment becomes a verdict, try naming one part: “a sensation,” “a thought,” or “a story.” Then choose what needs your care.</p></div><button className="practice-link" aria-expanded={deeper} aria-controls="layers-deeper" onClick={() => setDeeper(!deeper)}>{deeper ? '−' : '+'} Go deeper</button>{deeper && <div id="layers-deeper" className="layer-description"><p>Can the feeling of “me, naming the layers” also be noticed? Perhaps as words, an image, or a sensation?</p><a className="practice-link" href="/witness">Explore the watcher in Witness ↗</a></div>}</>}
          <div className="layers-step-actions">{index > 0 && <button className="practice-link" onClick={() => moveTo(index - 1)}>← Previous</button>}{index < 4 ? <button className="practice-link" onClick={() => moveTo(index + 1)}>Next chapter →</button> : <a className="practice-link" href="/practice">Back to practices ↗</a>}</div>
        </section>)}
      </div>
    </div>
    <footer className="practice-footer"><p>The experience can stay.<br /><em>Your relationship to it can change.</em></p><div className="practice-actions"><button className="practice-button" onClick={() => moveTo(1)}>Try the layers again ↗</button><a className="practice-link" href="/practice/gap">Next practice: The Gap ↗</a></div></footer>
  </main>;
}
