import { useRef, useState, type CSSProperties } from 'react';
import './feeling-finder.css';

const trails = [
  { word: 'Heavy', mark: '☁', color: '#72b4ff', clue: 'Low, slow, or weighed down', feelings: [['Sad', 'Something hurts or feels missing.'], ['Lonely', 'I want a little more connection.'], ['Tired', 'I feel worn out.'], ['Disappointed', 'I hoped it would go another way.']] },
  { word: 'Buzzy', mark: '✳', color: '#ba8dff', clue: 'Busy inside, hard to settle', feelings: [['Worried', 'My mind keeps asking “what if?”'], ['Excited', 'I’m looking forward to something.'], ['Overwhelmed', 'It feels like too much at once.'], ['Restless', 'I want to move, but don’t know where.']] },
  { word: 'Hot', mark: '☀', color: '#ff9278', clue: 'Tight, sharp, or ready to burst', feelings: [['Angry', 'Something feels wrong or unfair.'], ['Frustrated', 'Something is getting in my way.'], ['Hurt', 'Something touched a tender spot.'], ['Embarrassed', 'I feel exposed or awkward.']] },
  { word: 'Light', mark: '✧', color: '#f4df54', clue: 'Open, warm, or a little brighter', feelings: [['Happy', 'There is something good in this moment.'], ['Relieved', 'Something I was carrying has eased.'], ['Grateful', 'I appreciate something or someone.'], ['Hopeful', 'Something good feels possible.']] },
  { word: 'Quiet', mark: '≈', color: '#82dbb3', clue: 'Still, soft, or far away', feelings: [['Calm', 'There is some ease here.'], ['Content', 'This moment feels enough.'], ['Numb', 'It is hard to feel much right now.'], ['Bored', 'I want something to engage with.']] },
  { word: 'Not sure', mark: '〰', color: '#f6a9d1', clue: 'A mix, a blur, or no word yet', feelings: [['Mixed', 'More than one feeling is here.'], ['Unsure', 'I don’t have a clear word yet.'], ['Tender', 'Things are touching me easily.'], ['Curious', 'I want to see what is here.']] },
];

export function FeelingFinder() {
  const [trail, setTrail] = useState<number | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [floating, setFloating] = useState(true);
  const heading = useRef<HTMLHeadingElement>(null);
  const step = done ? 2 : trail === null ? 0 : 1;
  const current = trail === null ? null : trails[trail];
  const moveFocus = () => requestAnimationFrame(() => {
    const target = heading.current;
    if (!target) return;
    target.focus({ preventScroll: true });
    const { top } = target.getBoundingClientRect();
    if (top < 90 || top > window.innerHeight / 2) target.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  const reset = () => { setTrail(null); setChosen([]); setDone(false); moveFocus(); };
  return (
    <section className={`feeling-finder${floating ? "" : " is-still"}`} id="feelings" aria-label="Find your feeling" style={{ '--feeling-color': current?.color ?? '#ba8dff' } as CSSProperties}>
      <div className="feeling-orbits" aria-hidden="true"><i /><i /><i /><span>✧</span><b>✳</b></div>
      <div className="feeling-intro"><p className="feeling-eyebrow">A small trip into you</p><h2>Find your<br /><em>feeling<span aria-hidden="true">✳</span>.</em></h2><p>No perfect words needed.<br />Follow a small clue. See what fits.</p>
        <div className="feeling-mascot"><div className="feeling-creature" aria-hidden="true"><span>· ·</span><i /></div><span className="feeling-whisper">a little messy is okay</span></div>
        <ol className="feeling-route" aria-label="Your path">{['A clue', 'A word', 'A moment'].map((label, i) => <li key={label} aria-current={step === i ? 'step' : undefined} className={step >= i ? 'is-reached' : ''}><span>{i + 1}</span>{label}</li>)}</ol>
        <button className="feeling-motion" aria-pressed={!floating} onClick={() => setFloating(value => !value)}>{floating ? "Ⅱ Pause the float" : "▷ Let it float"}</button>
      </div>
      <div className="feeling-panel">
        <p className="feeling-eyebrow">{`0${step + 1} / 03`} · {['Start anywhere', 'Try a word on', 'Stay a little'][step]}</p>
        <h3 ref={heading} tabIndex={-1}>{done ? 'Hello, feeling.' : current ? 'What feels close?' : 'How does it feel inside?'}</h3>
        <p className="feeling-hint">{done ? 'A word can be a beginning. It doesn’t have to explain all of you.' : current ? 'Pick one, or a few. These are possibilities, not answers.' : 'Follow a color. Tap a feeling. There’s no wrong door.'}</p>
        {step === 0 && <div className="feeling-clues">{trails.map((item, index) => <button key={item.word} onClick={() => { setTrail(index); moveFocus(); }} style={{ '--clue-color': item.color, '--bubble-index': index } as CSSProperties}><span aria-hidden="true">{item.mark}</span><strong>{item.word}</strong><small>{item.clue}</small><b aria-hidden="true">↗</b></button>)}</div>}
        {step === 1 && current && <><div className="feeling-words">{current.feelings.map(([word, hint], index) => <button style={{ '--clue-color': current.color, '--bubble-index': index } as CSSProperties} key={word} aria-pressed={chosen.includes(word)} onClick={() => setChosen(values => values.includes(word) ? values.filter(value => value !== word) : [...values, word])}><strong>{word}<span aria-hidden="true">{chosen.includes(word) ? '✓' : '+'}</span></strong><small>{hint}</small></button>)}</div><div className="feeling-actions"><button className="feeling-back" onClick={reset}>← Another clue</button><button className="feeling-next" disabled={!chosen.length} onClick={() => { setDone(true); moveFocus(); }}>That feels close →</button></div><button className="feeling-back" onClick={() => { setChosen(['Unsure']); setDone(true); moveFocus(); }}>None fit. Leave it unnamed.</button></>}
        {done && <div className="feeling-result"><p className="feeling-sentence">{chosen.includes('Unsure') && chosen.length === 1 ? '“I don’t have a word yet. That’s okay.”' : `“Right now, I notice feeling ${chosen.map(word => word.toLowerCase()).join(' and ')}.”`}</p><div className="feeling-pause"><span aria-hidden="true">✺</span><p>Take one easy breath.<br />Where do you notice this, if anywhere?<br /><small>No need to change it.</small></p></div><div className="feeling-actions"><button className="feeling-back" onClick={() => { setDone(false); moveFocus(); }}>← Change my words</button><button className="feeling-next" onClick={reset}>Wander again ↺</button></div><a className="feeling-link" href="/breathe">Stay for a breath ↗</a></div>}
      </div>
    </section>
  );
}
