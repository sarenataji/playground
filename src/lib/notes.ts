import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const notesClient = url && key ? createClient(url, key) : null;
export const papers = [
  { id: 'butter', name: 'Butter', color: '#f5e7aa' },
  { id: 'rose', name: 'Rose', color: '#f0d5ce' },
  { id: 'sage', name: 'Sage', color: '#dce4cd' },
  { id: 'sky', name: 'Sky', color: '#d8e6ed' },
] as const;
export const stamps = [
  { id: 'flower', name: 'Flower', glyph: '✿' },
  { id: 'star', name: 'Star', glyph: '✧' },
  { id: 'heart', name: 'Heart', glyph: '♡' },
  { id: 'smile', name: 'Smile', glyph: '☺' },
] as const;
export type Paper = typeof papers[number]['id'];
export type Stamp = typeof stamps[number]['id'];
export type GuestNote = {
  id: string; message: string; name: string; color: Paper; stamp: Stamp;
  created_at: string; read_at: string | null; favorite: boolean; archived: boolean;
};
export function stampGlyph(stamp: string) { return stamps.find(s => s.id === stamp)?.glyph || '✿'; }
