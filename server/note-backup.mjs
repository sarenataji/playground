import { createHash } from 'node:crypto';
import { get, put, list, del } from '@vercel/blob';
import { validateNote } from './note-validation.mjs';

export class NoteRateLimitError extends Error {}
export class NoteConflictError extends Error {}
const options = signal => ({ token: process.env.BLOB_READ_WRITE_TOKEN, abortSignal: signal });
const blobStorage = {
  async read(path, signal) {
    const result = await get(path, { ...options(signal), access: 'private', useCache: false });
    if (!result) return null;
    if (result.statusCode !== 200) throw new Error('Backup read failed');
    return new Response(result.stream).json();
  },
  async write(path, value, signal) {
    return put(path, JSON.stringify(value), { ...options(signal), access: 'private',
      addRandomSuffix: false, allowOverwrite: false, contentType: 'application/json', cacheControlMaxAge: 60 });
  },
  async list(prefix, limit, signal) { return list({ ...options(signal), prefix, limit }); },
  async remove(path, signal) { return del(path, options(signal)); },
};
const digest = note => createHash('sha256').update(JSON.stringify([
  note.requestId, note.message, note.name, note.color, note.stamp,
])).digest('hex');

export function createNoteBackup({ storage = blobStorage, prefix = 'notes-v1/', now = Date.now } = {}) {
  const pathFor = id => `${prefix}pending/${id}.json`;
  async function enqueue(note, visitor) {
    const signal = AbortSignal.timeout(8500);
    const path = pathFor(note.requestId);
    const fingerprint = digest(note);
    const previous = await storage.read(path, signal);
    if (previous) {
      if (previous.fingerprint !== fingerprint) throw new NoteConflictError();
      return;
    }
    const time = now();
    // Conservative outage limit: one distinct note per network per 12-minute window.
    // A create-only object is the atomic reservation, including across function instances.
    const day = new Date(time).toISOString().slice(0, 10);
    const slot = `${prefix}rate/${day}/${visitor}/${Math.floor(time / 720000)}.json`;
    try { await storage.write(slot, { id: note.requestId }, signal); }
    catch (failure) {
      const reserved = await storage.read(slot, signal);
      if (!reserved) throw failure;
      if (reserved.id !== note.requestId) throw new NoteRateLimitError();
    }
    const record = { version: 1, note, visitor, fingerprint, receivedAt: new Date(time).toISOString() };
    try { await storage.write(path, record, signal); }
    catch (failure) {
      // The first request may have succeeded before its response was lost.
      const saved = await storage.read(path, signal);
      if (!saved) throw failure;
      if (saved.fingerprint !== fingerprint) throw new NoteConflictError();
    }
  }
  async function sync({ importNote, limit = 20, timeout = 12000 }) {
    const signal = AbortSignal.timeout(timeout);
    const page = await storage.list(`${prefix}pending/`, limit, signal);
    let synced = 0, deferred = 0;
    for (const entry of page.blobs) {
      if (signal.aborted) { deferred++; continue; }
      try {
        const record = await storage.read(entry.pathname, signal);
        if (!record) continue; // Another worker already imported it.
        const note = validateNote(record.note);
        if (!note || record.version !== 1 || !/^[a-f0-9]{64}$/.test(record.visitor) ||
            !Number.isFinite(Date.parse(record.receivedAt)) || pathFor(note.requestId) !== entry.pathname ||
            digest(note) !== record.fingerprint) throw new Error('Invalid backup record');
        await importNote(record, signal);
        // Delete only after the database transaction has committed. Re-imports are idempotent.
        await storage.remove(entry.pathname, signal);
        synced++;
      } catch { deferred++; }
    }
    return { synced, pending: page.hasMore || deferred > 0 };
  }
  async function cleanupRateLimits() {
    const signal = AbortSignal.timeout(5000);
    const page = await storage.list(`${prefix}rate/`, 1000, signal);
    const stale = page.blobs.filter(entry => new Date(entry.uploadedAt).getTime() < now() - 2 * 86400000);
    if (stale.length) await storage.remove(stale.map(entry => entry.pathname), signal);
  }
  return { enqueue, sync, cleanupRateLimits };
}
export const noteBackup = createNoteBackup();
