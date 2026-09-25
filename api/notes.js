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
    if (!String(req.headers['content-type'] || '').startsWith('application/json')) {
      return res.status(415).json({ error: 'Please send your note as JSON.' });
    }
    let body = req.body;
    try { if (typeof body === 'string') body = JSON.parse(body); }
    catch { return res.status(400).json({ error: 'Please check your note and try again.' }); }
    const note = validateNote(body);
    if (!note) return res.status(400).json({ error: 'Please write 1–1,000 characters and a name of up to 50 characters.' });
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const salt = process.env.NOTES_RATE_LIMIT_SECRET;
    if (!salt || ((!url || !key) && !process.env.BLOB_READ_WRITE_TOKEN)) {
      return res.status(503).json({ error: 'The mailbox isn’t open yet. Please come back soon.' });
    }
    // Vercel overwrites this header; do not trust a client-provided forwarded-for chain.
    const ip = process.env.VERCEL ? req.headers['x-vercel-forwarded-for'] : req.socket?.remoteAddress;
    if (!ip || typeof ip !== 'string') return res.status(503).json({ error: 'The mailbox is temporarily unavailable. Please try again later.' });
    const visitor = createHmac('sha256', salt).update(ip.split(',')[0].trim()).digest('hex');
    if (url && key) {
      try {
        const upstream = await fetchImpl(`${url.replace(/\/$/, '')}/rest/v1/rpc/submit_guest_note`, {
          method: 'POST',
          headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ p_id: note.requestId, p_message: note.message, p_name: note.name,
            p_color: note.color, p_stamp: note.stamp, p_visitor: visitor }),
          signal: AbortSignal.timeout(3500),
        });
        if (upstream.ok) return res.status(201).json({ saved: true });
        const failure = await upstream.json().catch(() => ({}));
        if (failure.message === 'note_rate_limit') {
          res.setHeader('Retry-After', '60');
          return res.status(429).json({ error: 'A little pause between notes. Please try again later (up to an hour).' });
        }
      } catch { /* Try independent durable storage before reporting a failure. */ }
    }
    try {
      if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('Backup unavailable');
      await enqueue(note, visitor);
      return res.status(201).json({ saved: true });
    } catch (failure) {
      if (failure instanceof NoteRateLimitError) {
        res.setHeader('Retry-After', '720');
        return res.status(429).json({ error: 'A little pause between notes. Please try again in 12 minutes.' });
      }
      if (failure instanceof NoteConflictError) return res.status(409).json({ error: 'Please make a small edit to your note, then try sending again.' });
      return res.status(503).json({ error: 'We couldn’t confirm delivery. Your note is still here; it’s safe to retry.' });
    }
  };
}
export default createNotesHandler();
