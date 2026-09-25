// Explicit opt-in: node --env-file=.env.local --test tests/notes-live.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createSyncHandler } from '../api/notes-sync.js';
const url=process.env.SUPABASE_URL, service=process.env.SUPABASE_SERVICE_ROLE_KEY, anon=process.env.VITE_SUPABASE_ANON_KEY;
test('live storage, access boundaries, owner actions, idempotency and persistent rate limiting', { skip: !service || !url || !anon }, async () => {
  const options={auth:{persistSession:false,autoRefreshToken:false}};
  const admin=createClient(url,service,options), visitor=createClient(url,anon,options), stranger=createClient(url,anon,options), owner=createClient(url,anon,options);
  const id=randomUUID(), visitorHash=randomBytes(32).toString('hex');
  let userId;
  try {
    const payload={p_id:id,p_message:'x'.repeat(1000),p_name:'Test',p_color:'sage',p_stamp:'star',p_visitor:visitorHash};
    assert.equal((await admin.rpc('submit_guest_note',payload)).error,null);
    assert.equal((await admin.rpc('submit_guest_note',payload)).error,null);
    const limited=await admin.rpc('submit_guest_note',{...payload,p_id:randomUUID()}); assert.equal(limited.error.message,'note_rate_limit');
    const publicRead=await visitor.from('guest_notes').select('*'); assert.ok(publicRead.error); assert.equal(publicRead.data,null);
    assert.ok((await visitor.rpc('submit_guest_note',payload)).error);
    assert.ok((await visitor.from('guest_notes').insert({id:randomUUID(),message:'bypass',name:'',color:'sage',stamp:'star'})).error);
    const password=randomBytes(24).toString('base64url');
    const email=`notes-test-${randomUUID()}@example.com`;
    const created=await admin.auth.admin.createUser({email,password,email_confirm:true}); assert.equal(created.error,null); userId=created.data.user.id;
    assert.equal((await stranger.auth.signInWithPassword({email,password})).error,null);
    assert.equal((await stranger.rpc('is_note_owner')).data,false);
    const sync=createSyncHandler({backup:{sync:async()=>({synced:0,pending:false})}});
    const reply=()=>({setHeader(){},status(n){this.statusCode=n;return this;},json(v){this.body=v;return this;}});
    let syncReply=reply();
    await sync({method:'POST',headers:{authorization:`Bearer ${(await stranger.auth.getSession()).data.session.access_token}`}},syncReply);
    assert.equal(syncReply.statusCode,403);
    const denied=await stranger.from('guest_notes').select('*'); assert.equal(denied.error,null); assert.deepEqual(denied.data,[]);
    assert.ok((await stranger.from('note_owners').insert({user_id:userId})).error);
    const deniedChange=await stranger.from('guest_notes').update({favorite:true}).eq('id',id).select(); assert.deepEqual(deniedChange.data,[]);
    const deniedDelete=await stranger.from('guest_notes').delete().eq('id',id).select(); assert.deepEqual(deniedDelete.data,[]);
    // Grant only this temporary test user owner access, then exercise the same RLS as the real wall.
    assert.equal((await admin.from('note_owners').insert({user_id:userId})).error,null);
    assert.equal((await owner.auth.signInWithPassword({email,password})).error,null);
    assert.equal((await owner.rpc('is_note_owner')).data,true);
    if(process.env.BLOB_READ_WRITE_TOKEN) {
      syncReply=reply();
      await sync({method:'POST',headers:{authorization:`Bearer ${(await owner.auth.getSession()).data.session.access_token}`}},syncReply);
      assert.equal(syncReply.statusCode,200);
    }
    assert.equal((await owner.from('guest_notes').select('*').eq('id',id).single()).data.message,payload.p_message);
    const changed=await owner.from('guest_notes').update({favorite:true,archived:true,read_at:new Date().toISOString()}).eq('id',id).select().single();
    assert.equal(changed.error,null); assert.equal(changed.data.favorite,true); assert.equal(changed.data.archived,true);
    assert.ok((await owner.from('guest_notes').update({message:'alter visitor words'}).eq('id',id)).error);
    assert.equal((await owner.from('guest_notes').delete().eq('id',id)).error,null);
    assert.deepEqual((await admin.from('guest_notes').select('*').eq('id',id)).data,[]);
  } finally {
    await admin.from('guest_notes').delete().eq('id',id);
    await admin.from('note_submissions').delete().eq('visitor',visitorHash);
    await admin.from('guest_note_receipts').delete().eq('id',id);
    if(userId) await admin.auth.admin.deleteUser(userId);
  }
});
