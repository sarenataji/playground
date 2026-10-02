import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { submitNote, importNote } from '../cloudflare/database.mjs';
import { createWorker } from '../cloudflare/worker.mjs';
function database() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../cloudflare/migrations/0001_notes.sql', import.meta.url), 'utf8'));
  return { sqlite,
    prepare(sql) { let values = []; const statement = sqlite.prepare(sql); const wrapper = {
      bind(...args) { values = args; return wrapper; },
      run() { return statement.run(...values); },
      first() { return statement.get(...values) || null; },
      all() { return { results: statement.all(...values) }; },
    }; return wrapper; },
    async batch(statements) { sqlite.exec('BEGIN'); try { const result=statements.map(s=>s.run());sqlite.exec('COMMIT');return result; } catch(e) {sqlite.exec('ROLLBACK');throw e;} },
  };
}
const note = () => ({requestId:randomUUID(),message:'hello',name:'',color:'sage',stamp:'flower'});
const count = db => db.sqlite.prepare('SELECT count(*) n FROM guest_notes').get().n;
test('transactional limits reject excess notes and retries never resurrect deletion', async () => {
  const db=database(), n=note();
  await submitNote(db,n,'visitor','2026-10-02T10:00:00.000Z');
  await submitNote(db,n,'visitor','2026-10-02T10:00:01.000Z');assert.equal(count(db),1);
  const rejected=note();await assert.rejects(submitNote(db,rejected,'visitor','2026-10-02T10:00:02.000Z'),/note_rate_limit/);
  assert.equal(db.prepare('SELECT * FROM guest_note_receipts WHERE id=?').bind(rejected.requestId).first(),null);
  for(let i=1;i<5;i++) await submitNote(db,note(),'visitor',`2026-10-02T10:0${i}:01.000Z`);
  await assert.rejects(submitNote(db,note(),'visitor','2026-10-02T10:06:01.000Z'),/note_rate_limit/);
  await submitNote(db,note(),'another visitor','2026-10-02T10:06:01.000Z');
  db.prepare('DELETE FROM guest_notes WHERE id=?').bind(n.requestId).run();
  await submitNote(db,n,'visitor','2026-10-02T12:00:00.000Z');await importNote(db,n,'2026-10-02T09:00:00.000Z');
  assert.equal(db.prepare('SELECT * FROM guest_notes WHERE id=?').bind(n.requestId).first(),null);
});
test('failed note insertion rolls back its rate reservation and receipt', async () => {
 const db=database(), n={...note(),message:''};
 await assert.rejects(submitNote(db,n,'visitor'));
 assert.equal(db.prepare('SELECT count(*) n FROM note_submissions').first().n,0);
 assert.equal(db.prepare('SELECT count(*) n FROM guest_note_receipts').first().n,0);
});
test('imports preserve timestamps and are idempotent',async()=>{
 const db=database(),n=note(),date='2026-09-20T00:00:00.000Z';
 await importNote(db,n,date);await importNote(db,n,date);
 assert.equal(count(db),1);assert.equal(db.prepare('SELECT created_at FROM guest_notes').first().created_at,date);
});
test('anonymous or forged identity cannot access any private data or import notes',async()=>{
 const worker=createWorker(), env={DB:database(),OWNER_EMAIL:'sarenataji@gmail.com',NOTES_PROXY_SECRET:'secret'};
 for(const path of ['/api/private/session','/api/private/notes','/my-notes']) {
  const response=await worker.fetch(new Request(`https://notes.test${path}`,{headers:{'Cf-Access-Authenticated-User-Email':env.OWNER_EMAIL,'Cf-Access-Jwt-Assertion':'forged'}}),env);
  assert.equal(response.status,401);
 }
 assert.equal((await worker.fetch(new Request('https://notes.test/api/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(note())}),env)).status,401);
});
test('owner CRUD filters, rejects cross-origin changes and cannot rewrite messages',async()=>{
 const DB=database(),n=note();await importNote(DB,n,'2026-10-01T00:00:00.000Z');
 const worker=createWorker({authorizeOwner:async()=>true}),env={DB,OWNER_EMAIL:'sarenataji@gmail.com'};
 const send=(path,method='GET',body,origin='https://notes.test')=>worker.fetch(new Request(`https://notes.test${path}`,{method,headers:{Origin:origin,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env);
 const path=`/api/private/notes/${n.requestId}`;
 assert.equal((await send(path,'PATCH',{favorite:true},'https://evil.test')).status,403);
 assert.equal((await send(path,'PATCH',{message:'rewritten'})).status,400);
 assert.equal((await send(path,'PATCH',{favorite:true})).status,200);
 let response=await send('/api/private/notes?filter=favorites');assert.equal((await response.json()).notes.length,1);
 await send(path,'PATCH',{archived:true,read_at:'2026-10-02T00:00:00.000Z'});
 response=await send('/api/private/notes');assert.equal((await response.json()).notes.length,0);
 response=await send('/api/private/notes?filter=archive');assert.equal((await response.json()).notes[0].favorite,true);
 assert.equal((await send(path,'DELETE')).status,200);assert.equal(count(DB),0);
 await importNote(DB,n,'2026-10-01T00:00:00.000Z');assert.equal(count(DB),0);
});
test('public submit validates input, hashes IP and enforces the same durable limit',async()=>{
 const DB=database(),worker=createWorker(),env={DB,NOTES_RATE_LIMIT_SECRET:'test salt'};
 const send=body=>worker.fetch(new Request('https://notes.test/api/notes',{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1'},body:JSON.stringify(body)}),env);
 assert.equal((await send({...note(),website:'spam'})).status,400);
 assert.equal((await send(note())).status,200);
 assert.equal((await send(note())).status,429);
 const visitor=DB.prepare('SELECT visitor FROM note_submissions').first().visitor;
 assert.match(visitor,/^[a-f0-9]{64}$/);assert.notEqual(visitor,'192.0.2.1');
});
