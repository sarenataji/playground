import { createRemoteJWKSet, jwtVerify } from 'jose';
import { validateNote } from '../server/note-validation.mjs';
import { asNote, submitNote, importNote } from './database.mjs';

const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const keys = new Map();
async function isOwner(request, env) {
  // No header-only trust: verify Access's signature, issuer, audience, expiry,
  // and the exact owner email even when a route is accidentally unprotected.
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return false;
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return false;
  try {
    const issuer = `https://${env.ACCESS_TEAM_DOMAIN}`;
    if (!keys.has(issuer)) keys.set(issuer, createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`)));
    const { payload } = await jwtVerify(token, keys.get(issuer), { issuer, audience: env.ACCESS_AUD, algorithms: ['RS256'] });
    return typeof payload.email === 'string' && payload.email.toLowerCase() === env.OWNER_EMAIL;
  } catch { return false; }
}
async function hmac(secret, value) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)))].map(x => x.toString(16).padStart(2, '0')).join('');
}
async function sameSecret(given, expected) {
  if (!given || !expected) return false;
  // Constant-time digest comparison without exposing the shared secret.
  const a = await hmac(expected, given), b = await hmac(expected, expected);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}
async function readBody(request) {
  if (!(request.headers.get('Content-Type') || '').startsWith('application/json')) throw new Error('invalid_body');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid_body');
  const chunks = []; let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 8192) { await reader.cancel(); throw new Error('invalid_body'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new Error('invalid_body'); }
}

export function createWorker({ authorizeOwner = isOwner } = {}) {
  return { async fetch(request, env) {
    const url = new URL(request.url), path = url.pathname;
    try {
      if (path === '/api/notes' || path === '/api/import') {
        if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
        const trusted = await sameSecret(request.headers.get('Authorization')?.replace(/^Bearer /, ''), env.NOTES_PROXY_SECRET);
        if (path === '/api/import' && !trusted) return json({ error: 'Unauthorized.' }, 401);
        const body = await readBody(request), note = validateNote(body);
        if (!note) return json({ error: 'Please check your note and try again.' }, 400);
        if (path === '/api/import') {
          if (typeof body.receivedAt !== 'string' || !Number.isFinite(Date.parse(body.receivedAt)) || Date.parse(body.receivedAt) > Date.now() + 300000) return json({ error: 'Invalid date.' }, 400);
          await importNote(env.DB, note, new Date(body.receivedAt).toISOString());
        } else {
          const ip = request.headers.get('CF-Connecting-IP');
          if (!env.NOTES_RATE_LIMIT_SECRET || (!trusted && !ip)) return json({ error: 'The mailbox is temporarily unavailable.' }, 503);
          const visitor = trusted ? body.visitor : await hmac(env.NOTES_RATE_LIMIT_SECRET, ip);
          if (typeof visitor !== 'string' || !/^[a-f0-9]{64}$/.test(visitor)) return json({ error: 'Invalid submission.' }, 400);
          await submitNote(env.DB, note, visitor);
        }
        return json({ ok: true });
      }
      if (path.startsWith('/api/private/') || path === '/my-notes' || path === '/my-notes/') {
        if (!await authorizeOwner(request, env)) return json({ error: 'Sign in with the owner email to open your collection.' }, 401);
        if (path === '/my-notes' || path === '/my-notes/') return env.ASSETS.fetch(request);
        if (path === '/api/private/session' && request.method === 'GET') return json({ email: env.OWNER_EMAIL });
        if (request.method !== 'GET' && request.headers.get('Origin') !== url.origin) return json({ error: 'Invalid origin.' }, 403);
        if (path === '/api/private/notes' && request.method === 'GET') {
          const filter = url.searchParams.get('filter') || 'all';
          const offset = Number(url.searchParams.get('offset') || 0);
          if (!['all','new','favorites','archive'].includes(filter) || !Number.isSafeInteger(offset) || offset < 0 || offset > 100000) return json({ error: 'Invalid filter.' }, 400);
          const extra = filter === 'new' ? ' AND read_at IS NULL' : filter === 'favorites' ? ' AND favorite=1' : '';
          const { results } = await env.DB.prepare(`SELECT * FROM guest_notes WHERE archived=?${extra} ORDER BY created_at DESC,id LIMIT 40 OFFSET ?`).bind(filter === 'archive' ? 1 : 0, offset).all();
          return json({ notes: results.map(asNote) });
        }
        const id = path.slice('/api/private/notes/'.length);
        if (!path.startsWith('/api/private/notes/') || !uuid.test(id)) return json({ error: 'Not found.' }, 404);
        if (request.method === 'DELETE') {
          await env.DB.prepare('DELETE FROM guest_notes WHERE id=?').bind(id).run();
          return json({ ok: true });
        }
        if (request.method === 'PATCH') {
          const changes = await readBody(request);
          if (!changes || Array.isArray(changes) || typeof changes !== 'object') return json({ error: 'Invalid change.' }, 400);
          const fields = Object.keys(changes);
          if (!fields.length || fields.some(k => !['favorite','archived','read_at'].includes(k)) ||
              fields.some(k => k === 'read_at' ? changes[k] !== null && (typeof changes[k] !== 'string' || !Number.isFinite(Date.parse(changes[k]))) : typeof changes[k] !== 'boolean')) return json({ error: 'Invalid change.' }, 400);
          const values = fields.map(k => k === 'read_at' ? changes[k] === null ? null : new Date(changes[k]).toISOString() : Number(changes[k]));
          const row = await env.DB.prepare(`UPDATE guest_notes SET ${fields.map(k => `${k}=?`).join(',')} WHERE id=? RETURNING *`).bind(...values, id).first();
          return row ? json({ note: asNote(row) }) : json({ error: 'Not found.' }, 404);
        }
        return json({ error: 'Method not allowed.' }, 405);
      }
      if (path.startsWith('/api/')) return json({ error: 'Not found.' }, 404);
      if (path === '/health') { await env.DB.prepare('SELECT 1').first(); return json({ ok: true }); }
      if (path === '/' || path === '/leave-a-note') return Response.redirect(`${env.PUBLIC_SITE_URL}${path}`, 302);
      return env.ASSETS.fetch(request);
    } catch (error) {
      if (String(error.message).includes('note_rate_limit')) return json({ error: 'A little pause—please try again in a minute, or later if you’ve sent a few notes.' }, 429);
      if (error.message === 'invalid_body') return json({ error: 'Please check your note and try again.' }, 400);
      // Never return private contents, SQL, or upstream error details.
      return json({ error: 'The mailbox is temporarily unavailable. Please try again.' }, 503);
    }
  }};
}
export default createWorker();
