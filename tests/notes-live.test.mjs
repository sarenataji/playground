// Explicit opt-in: NOTES_LIVE_TEST=1 node --env-file=.env.local --test tests/notes-live.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {d1,quote,cleanup} from './d1-live-helper.mjs';
test('Cloudflare live submission, persistent retry protection, and anonymous privacy', {skip:process.env.NOTES_LIVE_TEST!=='1'},async()=>{
 const base=process.env.NOTES_WORKER_URL,key=process.env.NOTES_PROXY_SECRET,id=randomUUID();
 assert.equal(base,'https://sarena-notes.llabs.workers.dev');assert.ok(key);
 const note={requestId:id,message:'Cloudflare migration verification',name:'Temporary test',color:'sage',stamp:'flower',visitor:randomBytes(32).toString('hex')};
 const send=()=>fetch(`${base}/api/notes`,{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(note)});
 try {
  assert.equal((await send()).status,200);assert.equal((await send()).status,200);
  assert.equal(d1(`SELECT count(*) n FROM guest_notes WHERE id=${quote(id)}`)[0].n,1);
  for(const path of ['/my-notes','/api/private/session','/api/private/notes']) {
   const response=await fetch(`${base}${path}`,{redirect:'manual'});assert.equal(response.status,302);assert.ok(response.headers.get('location').startsWith('https://laurentlo.cloudflareaccess.com/'));
  }
  d1(`DELETE FROM guest_notes WHERE id=${quote(id)}`);
  assert.equal((await send()).status,200);
  assert.equal(d1(`SELECT count(*) n FROM guest_notes WHERE id=${quote(id)}`)[0].n,0);
 } finally {cleanup(id);}
});
