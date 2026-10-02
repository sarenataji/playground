// Explicit: node --env-file=.env.local --test tests/notes-backup-live.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { d1, quote, cleanup } from './d1-live-helper.mjs';
import { list, get, del } from '@vercel/blob';
import { createNoteBackup } from '../server/note-backup.mjs';
import { createNotesHandler } from '../api/notes.js';
import { createSyncHandler } from '../api/notes-sync.js';
function response(){return {statusCode:200,setHeader(){},status(n){this.statusCode=n;return this;},json(v){this.body=v;return this;}};}
test('real private backup receives notes with Cloudflare unavailable, then syncs without duplication or resurrection', {skip:process.env.NOTES_LIVE_TEST!=='1'||!process.env.BLOB_READ_WRITE_TOKEN||!process.env.NOTES_PROXY_SECRET||!process.env.CRON_SECRET},async()=>{
 const prefix=`test/${randomUUID()}/`, backup=createNoteBackup({prefix});

 const id=randomUUID(),note={requestId:id,message:'x'.repeat(1000),name:'Backup verification',color:'rose',stamp:'flower'};
 const token=process.env.BLOB_READ_WRITE_TOKEN;
 const visitor=randomBytes(32).toString('hex');
 const offline=createNotesHandler({fetchImpl:async()=>{throw new Error('Simulated Cloudflare outage');},enqueue:(n)=>backup.enqueue(n,visitor)});
 const req={method:'POST',headers:{'content-type':'application/json','x-vercel-forwarded-for':'127.0.0.1'},socket:{remoteAddress:'127.0.0.1'},body:note};
 try {
  let res=response();await offline(req,res);assert.equal(res.statusCode,201);assert.equal(res.body.saved,true);
  res=response();await offline(req,res);assert.equal(res.statusCode,201);
  const pending=await list({prefix:`${prefix}pending/`,token});assert.equal(pending.blobs.length,1);
  const privateRead=await fetch(pending.blobs[0].url);assert.ok([401,403,404].includes(privateRead.status));
  const blob=await get(pending.blobs[0].pathname,{access:'private',token,useCache:false});
  const record=await new Response(blob.stream).json();assert.equal(record.note.message.length,1000);
  assert.deepEqual(d1(`SELECT id FROM guest_notes WHERE id=${quote(id)}`),[]);
  const sync=createSyncHandler({backup});
  const syncReq={method:'GET',headers:{authorization:`Bearer ${process.env.CRON_SECRET}`}};
  res=response();await sync(syncReq,res);assert.equal(res.statusCode,200);assert.equal(res.body.synced,1);
  const saved=d1(`SELECT * FROM guest_notes WHERE id=${quote(id)}`)[0];assert.equal(saved.message.length,1000);
  assert.equal(Date.parse(saved.created_at),Date.parse(record.receivedAt));
  assert.equal((await list({prefix:`${prefix}pending/`,token})).blobs.length,0);
  d1(`DELETE FROM guest_notes WHERE id=${quote(id)}`);
  await backup.enqueue(note,visitor);res=response();await sync(syncReq,res);assert.equal(res.body.synced,1);
  assert.deepEqual(d1(`SELECT id FROM guest_notes WHERE id=${quote(id)}`),[]);
 } finally {
  d1(`DELETE FROM guest_notes WHERE id=${quote(id)}`);
  cleanup(id);
  const files=await list({prefix,token});if(files.blobs.length)await del(files.blobs.map(b=>b.pathname),{token});
 }
});
