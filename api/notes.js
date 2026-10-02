import { createHmac } from 'node:crypto';
import { validateNote } from '../server/note-validation.mjs';
import { noteBackup, NoteRateLimitError, NoteConflictError } from '../server/note-backup.mjs';

export function createNotesHandler({ enqueue = (...args) => noteBackup.enqueue(...args), fetchImpl = (...args) => fetch(...args) } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed.' });
    }
    if (!String(req.headers['content-type'] || '').startsWith('application/json')) return res.status(415).json({ error: 'Please send your note as JSON.' });
    let body = req.body;
    try { if (typeof body === 'string') body = JSON.parse(body); }
    catch { return res.status(400).json({ error: 'Please check your note and try again.' }); }
    const note = validateNote(body);
    if (!note) return res.status(400).json({ error: 'Please write 1–1,000 characters and a name of up to 50 characters.' });
    const url = process.env.NOTES_WORKER_URL;
    const key = process.env.NOTES_PROXY_SECRET;
    const salt = process.env.NOTES_RATE_LIMIT_SECRET;
    if (!salt || ((!url || !key) && !process.env.BLOB_READ_WRITE_TOKEN)) return res.status(503).json({ error: 'The mailbox isn’t open yet. Please come back soon.' });
    const ip = process.env.VERCEL ? req.headers['x-vercel-forwarded-for'] : req.socket?.remoteAddress;
    if (!ip || typeof ip !== 'string') return res.status(503).json({ error: 'The mailbox is temporarily unavailable. Please try again later.' });
    const visitor = createHmac('sha256', salt).update(ip.split(',')[0].trim()).digest('hex');
    if (url && key) {
      try {
        const upstream = await fetchImpl(`${url.replace(/\/$/, '')}/api/notes`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...note, visitor }), signal: AbortSignal.timeout(4000),
        });
        if (upstream.ok) return res.status(201).json({ saved: true });
        if (upstream.status === 429) return res.status(429).json({ error: 'A little pause—please try again in a minute, or later if you’ve sent a few notes.' });
      } catch { /* Preserve the note in the private backup queue below. */ }
    }
    try { await enqueue(note, visitor); return res.status(201).json({ saved: true }); }
    catch (error) {
      if (error instanceof NoteRateLimitError) return res.status(429).json({ error: 'Please pause a little before sending another note.' });
      if (error instanceof NoteConflictError) return res.status(409).json({ error: 'This note has already been sent. Please start a new note.' });
      return res.status(503).json({ error: 'Your note couldn’t be delivered right now. Please try again.' });
    }
  };
}
export default createNotesHandler();
