import './practice.css';

const rooms = [
  { name: 'Layers', word: 'Untangle', note: 'An event. A feeling. A story. See what each one adds.', habits: 'Name the layer · What is here · No conclusion', shape: 'layers', live: true },
  { name: 'The Gap', word: 'Pause', note: 'Find a little room between the urge and the response.', habits: 'Three seconds · Emotional urgency', shape: 'gap', live: true },
  { name: 'Inner Weather', word: 'Allow', note: 'A feeling can fill the sky without becoming who you are.', habits: 'A state, not a self', shape: 'weather' },
  { name: 'Mind Patterns', word: 'Recognize', note: 'Watch a familiar loop without following it to the end.', habits: 'Unfinished thoughts · Protective patterns', shape: 'patterns' },
  { name: 'Soften', word: 'Feel', note: 'Return to the body. Let the grip loosen a little.', habits: 'Body · Opening · Micro-surrender', shape: 'soften' },
  { name: 'Direction', word: 'Participate', note: 'Let what matters guide a small step, with the feeling here.', habits: 'Fear and action · Values', shape: 'direction' },
  { name: 'Just Be', word: 'Rest', note: 'Spend a moment without making yourself a project.', habits: 'Stillness without a score', shape: 'be' },
];

export function Practice() {
  return <main className="practice-page">
    <section className="practice-intro">
      <p className="practice-eyebrow">Sarena / A practice of noticing</p>
      <h1>A little space.<br /><em>A different relationship.</em></h1>
      <p>Small experiments in meeting thoughts, feelings, and stories as they appear. Nothing to master. Start with one moment.</p>
      <div className="practice-actions"><a className="practice-button" href="/practice/layers">Explore Layers <span>↗</span></a><a className="practice-link" href="/witness">New to observing? Enter Witness ↗</a></div>
      <div className="practice-intro-art" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <div className="practice-intro-foot"><span>02 rooms open · 05 taking shape</span><span>Scroll to explore ↓</span></div>
    </section>
    <section className="practice-atlas" aria-labelledby="practice-rooms-heading">
      <div className="practice-section-heading"><p className="practice-eyebrow">From noticing to living</p><h2 id="practice-rooms-heading">Seven ways back to here.</h2><p>Follow the path, or return to the practice you need. Layers and The Gap are ready to explore; the remaining rooms are planned.</p></div>
      <div className="practice-grid">{rooms.map((room, index) => <article className={`practice-room ${room.live ? 'is-live' : ''}`} key={room.name}>
        <div className="practice-room-top"><span>0{index + 1} / {room.word}</span><span>{room.live ? 'Open now' : 'Coming later'}</span></div>
        <div className={`practice-room-art art-${room.shape}`} aria-hidden="true"><i /><i /><i /><i /><i /></div>
        <h3>{room.name}</h3><p>{room.note}</p><small>{room.habits}</small>
        {room.live && <a href={room.shape === 'gap' ? '/practice/gap' : '/practice/layers'} className="practice-room-enter">Enter the room <span>↗</span></a>}
      </article>)}</div>
    </section>
    <footer className="practice-footer"><p>Observing is a beginning.<br /><em>Life is still yours to join.</em></p><a className="practice-link" href="/rooms">Visit the existing rooms ↗</a></footer>
  </main>;
}
