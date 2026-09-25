import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import ts from 'typescript';
const source=readFileSync(new URL('../src/lib/noteDraft.ts',import.meta.url),'utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}});
const {readNoteDraft,saveNoteDraft,clearNoteDraft,NOTE_DRAFT_KEY}=await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const values=new Map();const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
test('unsent text and retry ID survive reload and clear after delivery',()=>{
 const draft={message:'hello',name:'me',color:'sky',stamp:'heart',requestId:randomUUID()};
 assert.equal(saveNoteDraft(draft,storage),true);assert.equal(readNoteDraft(storage).requestId,draft.requestId);assert.equal(readNoteDraft(storage).message,'hello');
 clearNoteDraft(storage);assert.equal(readNoteDraft(storage),null);
});
test('expired, malformed and oversized drafts are not restored',()=>{
 for(const value of ['{',JSON.stringify({expiresAt:0}),JSON.stringify({expiresAt:Date.now()+10000,message:'x'.repeat(1001)})]) {
  storage.setItem(NOTE_DRAFT_KEY,value);assert.equal(readNoteDraft(storage),null);
 }
});
test('blocked browser storage does not break writing',()=>{
 const blocked={getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');},removeItem(){throw new Error('blocked');}};
 assert.equal(readNoteDraft(blocked),null);assert.equal(saveNoteDraft({},blocked),false);assert.doesNotThrow(()=>clearNoteDraft(blocked));
});
