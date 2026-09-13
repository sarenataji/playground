import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { go } from '@/lib/path';
import './practice.css';
import './windows.css';

const rooms = [
  { name: 'Layers', word: 'Untangle', note: 'An event. A feeling. A story. See what each one adds.', habits: 'Name the layer · What is here · No conclusion', shape: 'layers', live: true },
  { name: 'The Gap', word: 'Pause', note: 'Find a little room between the urge and the response.', habits: 'Three seconds · Emotional urgency', shape: 'gap', live: true },
  { name: 'Inner Weather', word: 'Allow', note: 'A feeling can fill the sky without becoming who you are.', habits: 'A state, not a self', shape: 'weather' },
  { name: 'Mind Patterns', word: 'Recognize', note: 'Watch a familiar loop without following it to the end.', habits: 'Unfinished thoughts · Protective patterns', shape: 'patterns' },
  { name: 'Soften', word: 'Feel', note: 'Return to the body. Let the grip loosen a little.', habits: 'Body · Opening · Micro-surrender', shape: 'soften' },
  { name: 'Direction', word: 'Participate', note: 'Let what matters guide a small step, with the feeling here.', habits: 'Fear and action · Values', shape: 'direction' },
  { name: 'Just Be', word: 'Rest', note: 'Spend a moment without making yourself a project.', habits: 'Stillness without a score', shape: 'be' },
];

const glimpses = [
  'Notice a thought. Then notice the feeling beneath it. Does one have to become the other?',
  'Before the next thing you do, let one breath finish. Notice the space that was already here.',
  'If this feeling were weather, what would it be? Notice how its edges keep changing.',
  'Let a familiar thought appear. Can you see the loop without taking another turn?',
  'Notice your jaw, your shoulders, your hands. Let one small place soften.',
  'With everything you feel still here, what is one small step toward something you care about?',
  'For this breath, nothing needs improving. What is here when you stop reaching?',
];
const colors = ['#9ddcc9', '#e8bc88', '#99b8ef', '#c4a0eb', '#dab3a2', '#d9cc8d', '#b5c9d5'];

function MindWindow({ shape }: { shape: string }) {
  return <span className={`mind-window window-${shape}`} aria-hidden="true">
    <span className="window-aura" />
    <span className="window-frame">
      <span className="window-world">
        <svg viewBox="0 0 240 300" fill="none">
          {Array.from({ length: 11 }, (_, i) => {
            const scale = 1 - i * .071;
            return <g key={i} className="window-contour" style={{ '--depth': i, transform: `translate(120px, 155px) scale(${scale})` } as CSSProperties}>
              {shape === 'layers' ? <path d="M-90 130 V-50 A90 90 0 0 1 90 -50 V130 Z" />
                : shape === 'patterns' ? <ellipse rx="91" ry="119" transform={`rotate(${i * 19})`} />
                : shape === 'soften' ? <path d="M-88 10 C-115-85-20-143 49-100 C132-47 87 19 76 83 C53 155-67 124-88 10Z" transform={`rotate(${i * 9})`} />
                : shape === 'direction' ? <path d="M0-126 102 110 H-102 Z" />
                : shape === 'weather' ? <path d="M-130 20 Q-65-65 0 0 T130-25" transform={`translate(0,${(i - 5) * 24})`} />
                : <ellipse rx="93" ry={shape === 'be' ? '37' : '111'} />}
            </g>;
          })}
        </svg>
        <span className="window-light" />
        <span className="window-horizon" />
      </span>
      <span className="window-shutter shutter-left" /><span className="window-shutter shutter-right" />
    </span>
    <span className="window-reflection" />
  </span>;
}

export function Practice() {
  const [glimpse, setGlimpse] = useState<number | null>(null);
  const [entering, setEntering] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  function enter(event: MouseEvent<HTMLAnchorElement>, index: number, path: string) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    event.stopPropagation();
    if (entering !== null) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { go(path); return; }
    setEntering(index);
    timer.current = setTimeout(() => go(path), 720);
  }

  const journey = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!journey.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('has-arrived');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08 });
    journey.current.querySelectorAll('.practice-room').forEach(room => {
      room.classList.add('will-arrive');
      observer.observe(room);
    });
    return () => observer.disconnect();
  }, []);

  return <main className="practice-page practice-journey" ref={journey}>
    <section className="practice-intro">
      <p className="practice-eyebrow">Sarena / A practice of noticing</p>
      <h1>A little space.<br /><em>A different relationship.</em></h1>
      <p>Small experiments in meeting thoughts, feelings, and stories as they appear. Nothing to master. Start with one moment.</p>
      <div className="practice-actions"><a className="practice-button" href="/practice/layers">Explore Layers <span>↗</span></a><a className="practice-link" href="/witness">New to observing? Enter Witness ↗</a></div>
      <div className="practice-intro-art" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <div className="practice-intro-foot"><span>02 rooms open · 05 taking shape</span><span>Scroll to explore ↓</span></div>
    </section>
    <section className="practice-atlas" aria-labelledby="practice-rooms-heading">
      <div className="windows-arrival"><div className="windows-heading">
        <div><p className="practice-eyebrow"><span className="windows-spark">✧</span> From noticing to living</p><h2 id="practice-rooms-heading">Seven windows.<br /><em>One infinite within.</em></h2></div>
        <div className="windows-introduction"><p>Each window opens onto a different movement of the mind. Come closer. See what reveals itself.</p><span>02 rooms open <i /> 05 taking shape</span></div>
      </div>
      </div>
      <div className="windows-threshold" aria-hidden="true"><span /><i /></div>
      <div className="windows-guide"><span>A little curiosity is the only way in.</span><span>Explore a window <span aria-hidden="true">↘</span></span></div>
      <div className="practice-grid">{rooms.map((room, index) => <article className={`practice-room ${room.live ? 'is-live' : ''} ${glimpse === index ? 'is-revealed' : ''} ${entering === index ? 'is-entering' : ''}`} style={{ '--window-color': colors[index] } as CSSProperties} key={room.name}>
        <div className="practice-room-top"><span>0{index + 1} / {room.word}</span><span>{room.live ? '● Open now' : 'Taking shape'}</span></div>
        {room.live ? <a className="window-trigger" href={`/practice/${room.shape}`} aria-label={`Enter ${room.name}`} onClick={event => enter(event, index, `/practice/${room.shape}`)}><MindWindow shape={room.shape} /><span className="window-invitation">Step inside ↗</span></a>
          : <button className="window-trigger" aria-label={`Glimpse into ${room.name}`} aria-expanded={glimpse === index} aria-controls={`glimpse-${room.shape}`} onClick={() => setGlimpse(glimpse === index ? null : index)}><MindWindow shape={room.shape} /><span className="window-invitation">{glimpse === index ? 'Close glimpse −' : 'A small glimpse +'}</span></button>}
        <div className="window-copy"><h3>{room.name}</h3><p>{room.note}</p><small>{room.habits}</small></div>
        {!room.live && <p className="window-glimpse" id={`glimpse-${room.shape}`} hidden={glimpse !== index}>{glimpses[index]}<small>The full room is still taking shape.</small></p>}
        {room.live && <a href={`/practice/${room.shape}`} onClick={event => enter(event, index, `/practice/${room.shape}`)} className="practice-room-enter">Enter the room <span>↗</span></a>}
      </article>)}</div>
      <div className="windows-end"><span aria-hidden="true">✧</span><p>Different openings. The same invitation.<br /><em>Notice what is here. Then return to living.</em></p></div>
      {entering !== null && <div className="window-dive" style={{ '--window-color': colors[entering] } as CSSProperties} aria-live="polite"><span /><p>Opening {rooms[entering].name}…</p></div>}

    </section>
    <footer className="practice-footer"><p>Observing is a beginning.<br /><em>Life is still yours to join.</em></p><a className="practice-link" href="/rooms">Visit the existing rooms ↗</a></footer>
  </main>;
}
