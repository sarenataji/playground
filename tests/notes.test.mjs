import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { validateNote } from '../server/note-validation.mjs';
import handler from '../api/notes.js';
const valid = () => ({ message: '  A tiny hello  ', name: '', color: 'sage', stamp: 'flower', requestId: randomUUID(), website: '' });
function response() { return { headers: {}, statusCode: 200, setHeader(k,v) { this.headers[k]=v; }, status(v) { this.statusCode=v; return this; }, json(v) { this.body=v; return this; } }; }
test('accepts and trims a note without a name', () => { assert.equal(validateNote(valid()).message, 'A tiny hello'); });
test('accepts a full 1,000-character note', () => { assert.equal(validateNote({...valid(),message:'x'.repeat(1000)}).message.length,1000); });
test('rejects blank, long, malformed and honeypot submissions', () => {
  for (const patch of [{message:' '},{message:'x'.repeat(1001)},{name:'x'.repeat(51)},{color:'red'},{stamp:'unknown'},{requestId:'bad'},{website:'bot.example'},{message:4}]) assert.equal(validateNote({...valid(),...patch}),null);
  assert.equal(validateNote(null),null);
});
test('endpoint rejects read requests, bad JSON and wrong content types', async () => {
  for (const [method,headers,body,expected] of [['GET',{},null,405],['POST',{},valid(),415],['POST',{'content-type':'application/json'},'{',400]]) {
    const res=response(); await handler({method,headers,body},res); assert.equal(res.statusCode,expected);
    assert.equal(res.headers['Cache-Control'],'no-store');
  }
});
test('unconfigured endpoint fails without claiming a save', async () => {
  const prior=process.env.SUPABASE_URL; delete process.env.SUPABASE_URL;
  try { const res=response(); await handler({method:'POST',headers:{'content-type':'application/json'},body:valid()},res); assert.equal(res.statusCode,503); assert.equal(res.body.saved,undefined); }
  finally { if(prior) process.env.SUPABASE_URL=prior; }
});
test('upstream failure never becomes a successful delivery; retries preserve id', async () => {
  const previous={...process.env}; const originalFetch=globalThis.fetch;
  Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test',NOTES_RATE_LIMIT_SECRET:'test'}); delete process.env.VERCEL;
  try {
    const note=valid(); const requests=[];
    globalThis.fetch=async (_url,options) => { requests.push(JSON.parse(options.body)); return {ok:false,json:async()=>({message:'note_rate_limit'})}; };
    const req={method:'POST',headers:{'content-type':'application/json'},body:note,socket:{remoteAddress:'127.0.0.1'}};
    let res=response(); await handler(req,res); assert.equal(res.statusCode,429); assert.equal(res.body.saved,undefined);
    globalThis.fetch=async (_url,options) => { requests.push(JSON.parse(options.body)); return {ok:true}; };
    res=response(); await handler(req,res); assert.equal(res.statusCode,201); assert.equal(res.body.saved,true);
    assert.equal(requests[0].p_id,requests[1].p_id); assert.notEqual(requests[0].p_visitor,'127.0.0.1');
  } finally { globalThis.fetch=originalFetch; process.env=previous; }
});
