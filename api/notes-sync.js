import { timingSafeEqual } from 'node:crypto';
import { noteBackup } from '../server/note-backup.mjs';
export const config = { maxDuration: 60 };
const same = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

export function createSyncHandler({ backup = noteBackup, fetchImpl = (...args) => fetch(...args) } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'GET' && req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'Method not allowed.' });
    }
    const auth = req.headers.authorization;
    const cron = req.method === 'GET' && !!process.env.CRON_SECRET && same(auth, `Bearer ${process.env.CRON_SECRET}`);
    if (!cron && (req.method !== 'POST' || typeof auth !== 'string' || !auth.startsWith('Bearer '))) {
      return res.status(401).json({ error: 'Sign in to your wall first.' });
    }
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return res.status(503).json({ error: 'Your collection is temporarily unavailable.' });
    if (!cron) {
      try {
        // The caller's JWT controls auth.uid(); the service key is only the API gateway key.
        const permission = await fetchImpl(`${url}/rest/v1/rpc/is_note_owner`, {
          method: 'POST', headers: { apikey: key, Authorization: auth, 'Content-Type': 'application/json' },
          body: '{}', signal: AbortSignal.timeout(4000),
        });
        if (!permission.ok || await permission.json() !== true) return res.status(403).json({ error: 'This account cannot access the wall.' });
      } catch { return res.status(503).json({ error: 'Your collection is temporarily unavailable.' }); }
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: 'Backup sync is temporarily unavailable.' });
    try {
      const result = await backup.sync({ limit: cron ? 100 : 20, timeout: cron ? 40000 : 12000,
        async importNote(record, signal) {
          const { note } = record;
          const imported = await fetchImpl(`${url}/rest/v1/rpc/import_guest_note`, {
            method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ p_id: note.requestId, p_message: note.message, p_name: note.name,
              p_color: note.color, p_stamp: note.stamp, p_received_at: record.receivedAt }),
            signal: AbortSignal.any([signal, AbortSignal.timeout(3500)]),
          });
          if (!imported.ok) throw new Error('Import unavailable');
        },
      });
      if (cron) await backup.cleanupRateLimits().catch(() => {});
      return res.status(200).json(result);
    } catch { return res.status(503).json({ error: 'Some notes are safely waiting for sync. Please try refreshing later.' }); }
  };
}
export default createSyncHandler();
