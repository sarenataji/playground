import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { notesClient, stampGlyph, type GuestNote } from '@/lib/notes';
import './notes.css';

type Filter = 'all' | 'new' | 'favorites' | 'archive';
const filters: { id: Filter; label: string }[] = [{ id: 'all', label: 'All notes' }, { id: 'new', label: 'Unread' }, { id: 'favorites', label: 'Favorites' }, { id: 'archive', label: 'Archive' }];
export function NoteWall() {
  const [access, setAccess] = useState<'loading' | 'out' | 'owner' | 'denied'>('loading');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState<GuestNote[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(false);
  const [more, setMore] = useState(false);
  const [syncNotice, setSyncNotice] = useState('');
  const [selected, setSelected] = useState<GuestNote | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const generation = useRef(0);
  const accessGeneration = useRef(0);
  useEffect(() => {
    document.title = 'Your little collection · Sarena';
    const client = notesClient;
    if (!client) { setAccess('out'); return; }
    let alive = true;
    async function check() {
      const version = ++accessGeneration.current;
      try {
        const { data: { session }, error: sessionError } = await client!.auth.getSession();
        if (sessionError) throw sessionError;
        let next: typeof access = 'out';
        if (session) {
          const { data, error: ownerError } = await client!.rpc('is_note_owner');
          if (ownerError) throw ownerError;
          next = data === true ? 'owner' : 'denied';
        }
        if (alive && version === accessGeneration.current) setAccess(next);
      } catch {
        if (alive && version === accessGeneration.current) { setAccess('out'); setError('Unable to check your session. Please try signing in again.'); }
      }
    }
    void check();
    const { data: { subscription } } = client.auth.onAuthStateChange(() => {
      // Leave the auth callback before calling another Supabase operation.
      setTimeout(() => { if (alive) void check(); }, 0);
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  const load = useCallback(async (offset = 0) => {
    if (!notesClient) return;
    const version = ++generation.current;
    setLoading(true); setError('');
    try {
      if (offset === 0) {
        setSyncNotice('');
        try {
          const { data: { session } } = await notesClient.auth.getSession();
          if (!session) throw new Error('No session');
          const response = await fetch('/api/notes-sync', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, signal: AbortSignal.timeout(18000) });
          const result = await response.json();
          if (!response.ok || result.pending) {
            if (version === generation.current) setSyncNotice('Some notes are safely waiting to join your wall. Refresh again in a moment.');
          }
        } catch {
          if (version === generation.current) setSyncNotice('Backup notes couldn’t be checked right now. You can still read the notes below.');
        }
      }
      let query = notesClient.from('guest_notes').select('*').eq('archived', filter === 'archive');
      if (filter === 'new') query = query.is('read_at', null);
      if (filter === 'favorites') query = query.eq('favorite', true);
      const { data, error: failure } = await query.order('created_at', { ascending: false }).order('id').range(offset, offset + 39);
      if (failure) throw failure;
      if (version !== generation.current) return;
      setNotes(previous => offset ? [...previous, ...(data as GuestNote[])] : data as GuestNote[]);
      setMore(data.length === 40);
    } catch {
      if (version === generation.current) setError('Your notes couldn’t be loaded. Please try refreshing.');
    } finally { if (version === generation.current) setLoading(false); }
  }, [filter]);
  useEffect(() => {
    setNotes([]); setMore(false);
    if (access === 'owner') void load();
    return () => { generation.current++; };
  }, [access, load]);
  useEffect(() => {
    if (selected) dialog.current?.showModal();
    else dialog.current?.close();
  }, [selected]);
  useEffect(() => { if (access !== 'owner') setSelected(null); }, [access]);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    if (!notesClient || busy) return;
    setBusy(true); setError('');
    try {
      const { error: failure } = await notesClient.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/my-notes` } });
      if (failure) throw failure;
      setSent(true);
    } catch { setError('The sign-in link couldn’t be sent. Check your owner email and try again shortly.'); }
    finally { setBusy(false); }
  }
  async function signOut() {
    if (!notesClient) return;
    setBusy(true); setError('');
    try {
      const { error: failure } = await notesClient.auth.signOut();
      if (failure) throw failure;
      setAccess('out'); setNotes([]); setSelected(null); setSent(false);
    } catch { setError('Unable to sign out. Please try again.'); }
    finally { setBusy(false); }
  }
  async function update(note: GuestNote, changes: Partial<Pick<GuestNote, 'favorite' | 'archived' | 'read_at'>>) {
    if (!notesClient || busy) return;
    setBusy(true); setError('');
    try {
      const { data, error: failure } = await notesClient.from('guest_notes').update(changes).eq('id', note.id).select().single();
      if (failure) throw failure;
      setSelected(current => current?.id === note.id ? data as GuestNote : current);
      await load();
    } catch { setError('That change couldn’t be saved. Please try again.'); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!notesClient || !selected || busy) return;
    setBusy(true); setError('');
    try {
      const { error: failure } = await notesClient.from('guest_notes').delete().eq('id', selected.id);
      if (failure) throw failure;
      setSelected(null); setConfirmDelete(false); await load();
    } catch { setError('The note couldn’t be deleted. Please try again.'); }
    finally { setBusy(false); }
  }
  const date = (value: string) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return <main className="notes-page note-wall">
    <div className="wall-top"><a className="notes-back" href="/">← Back to the playground</a>{access === 'owner' && <button className="notes-text-button" onClick={() => void signOut()} disabled={busy}>Sign out ↗</button>}</div>
    {access === 'loading' ? <p className="notes-loading" role="status">Opening your collection…</p> : access !== 'owner' ? <section className="wall-login">
      <span className="login-flower" aria-hidden="true">✿</span>
      <p className="notes-eyebrow">For your eyes only</p>
      <h1>Your little<br /><em>collection.</em></h1>
      {!notesClient ? <p>The private wall is being connected.<br />Please come back soon.</p> : access === 'denied' ? <><p>This account doesn’t have access to Sarena’s notes.</p><button className="notes-primary" onClick={() => void signOut()} disabled={busy}>Use another account</button></> : sent ? <div role="status"><p>Check your inbox for a sign-in link.<br />Open it to visit your wall.</p><button className="notes-text-button" onClick={() => setSent(false)}>Use another email or try again</button></div> : <form onSubmit={signIn}>
        <p>All the little hellos, kept in one place.</p>
        <label htmlFor="owner-email">Your email</label><input id="owner-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" disabled={busy} />
        <button className="notes-primary" disabled={busy}>{busy ? 'Sending your link…' : 'Send me a sign-in link'} <span>↗</span></button>
      </form>}
      {error && <p className="notes-error" role="alert">{error}</p>}
    </section> : <>
      <header className="wall-heading"><div><p className="notes-eyebrow">The lovely people who stopped by</p><h1>Your little <em>collection.</em></h1><p>A wall of thoughts, tiny hellos, and pieces of people.</p></div><a className="wall-write-link" href="/leave-a-note">Visit the writing desk ↗</a></header>
      <div className="wall-toolbar"><div className="wall-filters" role="group" aria-label="Filter notes">{filters.map(f => <button key={f.id} aria-pressed={filter === f.id} disabled={busy} onClick={() => setFilter(f.id)}>{f.label}</button>)}</div><button className="notes-text-button" onClick={() => void load()} disabled={loading || busy}>Refresh ↻</button></div>
      {error && !selected && <p className="notes-error" role="alert">{error}</p>}
      {syncNotice && <p className="wall-status" role="status">{syncNotice}</p>}
      {loading && <p role="status" className="wall-status">Gathering your notes…</p>}
      {!loading && !error && notes.length === 0 && <div className="wall-empty"><span aria-hidden="true">✧</span><h2>{filter === 'all' ? 'A little space for lovely things.' : 'Nothing here just yet.'}</h2><p>{filter === 'all' ? 'Share the writing desk. The first hello will find its way here.' : 'Your collection will be here when you need it.'}</p><a href="/leave-a-note" className="notes-text-button">Open the writing desk ↗</a></div>}
      <div className="wall-grid">{notes.map(note => <button className={`wall-card paper-${note.color}`} key={note.id} onClick={() => { setSelected(note); setConfirmDelete(false); setError(''); if (!note.read_at) void update(note, { read_at: new Date().toISOString() }); }}>
        <div className="wall-card-top"><span>{!note.read_at ? '● New little hello' : date(note.created_at)}</span><span className="wall-card-stamp" aria-hidden="true">{stampGlyph(note.stamp)}</span></div>
        <p>{note.message}</p><div className="wall-card-bottom"><span>— {note.name || 'A lovely stranger'}</span>{note.favorite && <span aria-label="Favorite">♥</span>}</div>
      </button>)}</div>
      {more && <button className="notes-primary wall-load" disabled={loading || busy} onClick={() => void load(notes.length)}>A few more little hellos ↓</button>}
    </>}
    <dialog ref={dialog} className={`note-dialog paper-${selected?.color || 'butter'}`} onCancel={() => { setSelected(null); setConfirmDelete(false); }} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) setSelected(null); } }} aria-labelledby="opened-note-heading">
      {selected && <><button className="note-dialog-close" aria-label="Close note" onClick={() => setSelected(null)}>×</button><span className="note-dialog-stamp" aria-hidden="true">{stampGlyph(selected.stamp)}</span><h2 id="opened-note-heading">A little something from<br /><em>{selected.name || 'a lovely stranger'}</em></h2><time dateTime={selected.created_at}>{date(selected.created_at)}</time><p className="note-dialog-message">{selected.message}</p>
        {error && <p className="notes-error" role="alert">{error}</p>}
        <div className="note-dialog-actions"><button disabled={busy} aria-pressed={selected.favorite} onClick={() => void update(selected, { favorite: !selected.favorite })}>{selected.favorite ? '♥ Favorited' : '♡ Favorite'}</button><button disabled={busy} onClick={() => void update(selected, { archived: !selected.archived })}>{selected.archived ? 'Unarchive' : 'Archive'}</button><button disabled={busy} onClick={() => setConfirmDelete(true)}>Delete</button></div>
        {confirmDelete && <div className="note-delete-confirm"><p>Delete this note forever?</p><button disabled={busy} onClick={() => void remove()}>Yes, delete</button><button disabled={busy} onClick={() => setConfirmDelete(false)}>Keep it</button></div>}
      </>}
    </dialog>
  </main>;
}
