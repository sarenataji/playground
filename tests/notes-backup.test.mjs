import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createNoteBackup, NoteRateLimitError, NoteConflictError } from '../server/note-backup.mjs';
import { createNotesHandler } from '../api/notes.js';
import { createSyncHandler } from '../api/notes-sync.js';
const note = () => ({ requestId: randomUUID(), message:'A little hello', name:'', color:'sage', stamp:'flower' });
const visitor = 'a'.repeat(64);
function memory() {
  const files = new Map();
  return { files,
    async read(path) { return files.get(path) ?? null; },
    async write(path,value) { if(files.has(path)) throw new Error('Exists'); files.set(path,structuredClone(value)); },
    async list(prefix,limit) { const paths=[...files.keys()].filter(k=>k.startsWith(prefix));return {blobs:paths.slice(0,limit).map(pathname=>({pathname,uploadedAt:new Date()})),hasMore:paths.length>limit}; },
    async remove(paths) { for(const path of [paths].flat()) files.delete(path); },
  };
}
function response() { return { statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},json(v){this.body=v;return this;} }; }
test('outage queue saves once, retries safely and refuses changed content under the same ID', async () => {
  const storage=memory(), backup=createNoteBackup({storage}), n=note();
  await backup.enqueue(n,visitor); await backup.enqueue(n,visitor);
  assert.equal([...storage.files.keys()].filter(k=>k.includes('/pending/')).length,1);
  await assert.rejects(backup.enqueue({...n,message:'different'},visitor),NoteConflictError);
});
test('concurrent submissions from one network cannot bypass the outage limit', async () => {
  const storage=memory(),backup=createNoteBackup({storage,now:()=>1000000});
  const outcomes=await Promise.allSettled([backup.enqueue(note(),visitor),backup.enqueue(note(),visitor)]);
  assert.equal(outcomes.filter(o=>o.status==='fulfilled').length,1);
  assert.ok(outcomes.find(o=>o.status==='rejected').reason instanceof NoteRateLimitError);
});
test('failed sync keeps durable notes; successful sync imports before removing', async () => {
  const storage=memory(), backup=createNoteBackup({storage}), n=note();
  await backup.enqueue(n,visitor);
  const failed=await backup.sync({importNote:async()=>{throw new Error('Paused');}});
  assert.deepEqual(failed,{synced:0,pending:true});
  let imported;
  const synced=await backup.sync({importNote:async record=>{assert.ok(storage.files.has(`notes-v1/pending/${n.requestId}.json`));imported=record;}});
  assert.deepEqual(synced,{synced:1,pending:false}); assert.equal(imported.note.message,n.message);
  assert.equal(storage.files.has(`notes-v1/pending/${n.requestId}.json`),false);
});
test('a crash after import can retry without dropping the queued note', async () => {
  const storage=memory(), remove=storage.remove, backup=createNoteBackup({storage}), n=note();
  await backup.enqueue(n,visitor); storage.remove=async()=>{throw new Error('Delete unavailable');};
  assert.equal((await backup.sync({importNote:async()=>{}})).pending,true);
  storage.remove=remove;
  assert.equal((await backup.sync({importNote:async()=>{}})).synced,1);
});
test('submission confirms only a successful database or backup save', async () => {
  const previous={...process.env};
  Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test',NOTES_RATE_LIMIT_SECRET:'test',BLOB_READ_WRITE_TOKEN:'test'}); delete process.env.VERCEL;
  const request={method:'POST',headers:{'content-type':'application/json'},body:note(),socket:{remoteAddress:'127.0.0.1'}};
  try {
    let queued=0;
    const offline=createNotesHandler({fetchImpl:async()=>{throw new Error('Paused');},enqueue:async()=>{queued++;}});
    let res=response();await offline(request,res);assert.equal(res.statusCode,201);assert.equal(res.body.saved,true);assert.equal(queued,1);
    const bothDown=createNotesHandler({fetchImpl:async()=>{throw new Error('Paused');},enqueue:async()=>{throw new Error('Storage down');}});
    res=response();await bothDown(request,res);assert.equal(res.statusCode,503);assert.equal(res.body.saved,undefined);
    const limited=createNotesHandler({fetchImpl:async()=>({ok:false,json:async()=>({message:'note_rate_limit'})}),enqueue:async()=>{throw new Error('Must not bypass limit');}});
    res=response();await limited(request,res);assert.equal(res.statusCode,429);
  } finally {process.env=previous;}
});
test('sync rejects anonymous, wrong cron secret and non-owner callers before reading backups', async () => {
  const previous={...process.env};Object.assign(process.env,{CRON_SECRET:'private',SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test',BLOB_READ_WRITE_TOKEN:'test'});
  try {
    const handler=createSyncHandler({backup:{sync:async()=>{throw new Error('Must not run');}},fetchImpl:async()=>({ok:true,json:async()=>false})});
    for(const [method,authorization,status] of [['GET',undefined,401],['GET','Bearer wrong',401],['POST','Bearer nonowner',403]]) {
      const res=response();await handler({method,headers:{authorization}},res);assert.equal(res.statusCode,status);
    }
  } finally {process.env=previous;}
});
