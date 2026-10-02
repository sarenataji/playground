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
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed.' }); }
    if (!process.env.CRON_SECRET || !same(req.headers.authorization, `Bearer ${process.env.CRON_SECRET}`)) return res.status(401).json({ error: 'Unauthorized.' });
    const url = process.env.NOTES_WORKER_URL, key = process.env.NOTES_PROXY_SECRET;
    if (!url || !key || !process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: 'Backup sync is temporarily unavailable.' });
    try {
      const result = await backup.sync({ limit: 100, timeout: 40000,
        async importNote(record, signal) {
          const response = await fetchImpl(`${url}/api/import`, {
            method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...record.note, receivedAt: record.receivedAt }),
            signal: AbortSignal.any([signal, AbortSignal.timeout(3500)]),
          });
          if (!response.ok) throw new Error('Import unavailable');
        },
      });
      await backup.cleanupRateLimits().catch(() => {});
      return res.status(200).json(result);
    } catch { return res.status(503).json({ error: 'Backup sync is temporarily unavailable.' }); }
  };
}
export default createSyncHandler();
