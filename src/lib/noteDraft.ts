import type { Paper, Stamp } from './notes';
export const NOTE_DRAFT_KEY = 'sarena-note-draft-v1';
export type NoteDraft = { message: string; name: string; color: Paper; stamp: Stamp; requestId: string };
export function readNoteDraft(storage?: Pick<Storage, 'getItem' | 'removeItem'>): NoteDraft | null {
  try {
    const target = storage ?? window.localStorage;
    const raw = target.getItem(NOTE_DRAFT_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (!Number.isFinite(value.expiresAt) || value.expiresAt < Date.now() ||
        typeof value.message !== 'string' || value.message.length > 1000 ||
        typeof value.name !== 'string' || value.name.length > 50 ||
        !['butter', 'rose', 'sage', 'sky'].includes(value.color) ||
        !['flower', 'star', 'heart', 'smile'].includes(value.stamp) ||
        typeof value.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.requestId)) {
      target.removeItem(NOTE_DRAFT_KEY); return null;
    }
    return value as NoteDraft;
  } catch { return null; }
}
export function saveNoteDraft(draft: NoteDraft, storage?: Pick<Storage, 'setItem'>): boolean {
  try {
    (storage ?? window.localStorage).setItem(NOTE_DRAFT_KEY, JSON.stringify({ ...draft, expiresAt: Date.now() + 7 * 86400000 }));
    return true;
  } catch { return false; }
}
export function clearNoteDraft(storage?: Pick<Storage, 'removeItem'>) {
  try { (storage ?? window.localStorage).removeItem(NOTE_DRAFT_KEY); } catch { /* Storage may be blocked. */ }
}
