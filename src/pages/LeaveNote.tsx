import { useEffect, useRef, useState, type FormEvent } from 'react';
import { papers, stamps, stampGlyph, type Paper, type Stamp } from '@/lib/notes';
import './notes.css';

export function LeaveNote() {
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState<Paper>('butter');
  const [stamp, setStamp] = useState<Stamp>('flower');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<'writing' | 'sending' | 'sent'>('writing');
  const [error, setError] = useState('');
  const pending = useRef(false);
  const requestId = useRef<string | null>(null);
  const confirmation = useRef<HTMLHeadingElement>(null);
  useEffect(() => { document.title = 'Leave a little something · Sarena'; }, []);
  useEffect(() => { if (status === 'sent') confirmation.current?.focus(); }, [status]);
  const changed = () => { requestId.current = null; setError(''); };
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending.current || !message.trim()) return;
    pending.current = true;
    setStatus('sending'); setError('');
    requestId.current ??= crypto.randomUUID();
    try {
      const response = await fetch('/api/notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, name, color, stamp, website, requestId: requestId.current }),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.saved !== true) {
        throw new Error(result?.error || 'The mailbox isn’t available just yet. Your note is still here; please try again later.');
      }
      setStatus('sent');
    } catch (failure) {
      setStatus('writing');
      setError(failure instanceof Error && failure.name !== 'TimeoutError' ? failure.message : 'We couldn’t confirm delivery. Your note is still here; it’s safe to retry.');
    } finally { pending.current = false; }
  }
  return <main className="notes-page note-compose">
    <a className="notes-back" href="/">← Back to the playground</a>
    <div className="notes-orbit orbit-one" aria-hidden="true">✳</div>
    <div className="notes-orbit orbit-two" aria-hidden="true">✧</div>
    {status === 'sent' ? <section className="note-thanks" aria-live="polite">
      <div className={`note-envelope paper-${color}`} aria-hidden="true"><span>{stampGlyph(stamp)}</span></div>
      <p className="notes-eyebrow">A special delivery</p>
      <h1 ref={confirmation} tabIndex={-1}>A little piece of you,<br /><em>now here.</em></h1>
      <p>Your note is safely in Sarena’s mailbox.<br />Thank you for stopping by.</p>
      <a className="notes-primary" href="/rooms">Wander a little longer <span>↗</span></a>
      <button className="notes-text-button" onClick={() => { setMessage(''); setName(''); requestId.current = null; setStatus('writing'); }}>Leave another little something</button>
    </section> : <>
      <header className="notes-heading">
        <p className="notes-eyebrow"><span aria-hidden="true">✳</span> A small hello goes a long way</p>
        <h1>Leave a little<br /><em>something.</em></h1>
        <p>A thought, a tiny hello, something this place made you feel.<br className="notes-desktop-break" /> I’d love to know you were here.</p>
      </header>
      <form className="note-form" onSubmit={submit} aria-busy={status === 'sending'}>
        <fieldset disabled={status === 'sending'} className="note-fields">
          <legend className="notes-sr-only">Your note to Sarena</legend>
          <div className={`note-paper paper-${color}`}>
            <div className="note-paper-top"><span>Dear Sarena,</span><span className="note-stamp" aria-label={`${stamp} stamp`}>{stampGlyph(stamp)}</span></div>
            <label className="notes-sr-only" htmlFor="note-message">Your note</label>
            <textarea id="note-message" value={message} onChange={e => { setMessage(e.target.value); changed(); }} placeholder="Just a little something…" required maxLength={1000} aria-describedby="note-limit" />
            <div className="note-signoff"><label htmlFor="note-name">With love,</label><input id="note-name" value={name} onChange={e => { setName(e.target.value); changed(); }} placeholder="your name (if you like)" maxLength={50} autoComplete="given-name" /></div>
            <span id="note-limit" className="note-count">{message.length} / 1000</span>
          </div>
          <div className="note-customize">
            <fieldset><legend>A little color</legend><div className="note-options">{papers.map(p => <label className="paper-choice" key={p.id} style={{ '--swatch': p.color } as React.CSSProperties}><input type="radio" name="color" value={p.id} checked={color === p.id} onChange={() => { setColor(p.id); changed(); }} /><span aria-hidden="true">{color === p.id ? '✓' : ''}</span><span className="notes-sr-only">{p.name}</span></label>)}</div></fieldset>
            <span className="note-customize-divider" aria-hidden="true" />
            <fieldset><legend>A tiny stamp</legend><div className="note-options">{stamps.map(s => <label className="stamp-choice" key={s.id}><input type="radio" name="stamp" value={s.id} checked={stamp === s.id} onChange={() => { setStamp(s.id); changed(); }} /><span aria-hidden="true">{s.glyph}</span><span className="notes-sr-only">{s.name}</span></label>)}</div></fieldset>
          </div>
          <div className="notes-honey" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} /></label></div>
          {error && <p className="notes-error" role="alert">{error}</p>}
          <button className="notes-primary note-send" type="submit" disabled={!message.trim() || status === 'sending'}>{status === 'sending' ? 'Delivering your note…' : 'Send to Sarena'}<span aria-hidden="true">↗</span></button>
        </fieldset>
        <p className="notes-privacy"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="7" width="9" height="7" rx="1.5" /><path d="M5.5 7V4a2.5 2.5 0 0 1 5 0v3" /></svg> Just between you and Sarena.</p>
      </form>
      <p className="notes-footnote">Little notes. Big feelings. All welcome.</p>
    </>}
  </main>;
}
