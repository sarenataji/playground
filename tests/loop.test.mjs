import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/lib/loop.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } });
const { isHeart } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const heart = (count = 80) => Array.from({ length: count + 1 }, (_, i) => {
  const t = i / count * Math.PI * 2;
  return { x: 200 + 8 * 16 * Math.sin(t) ** 3, y: 200 - 8 * (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) };
});
const transform = (points, degrees = 0, sx = 1, sy = 1) => points.map(p => {
  const t = degrees * Math.PI / 180, x = (p.x - 200) * sx, y = (p.y - 200) * sy;
  return { x: 300 + x*Math.cos(t) - y*Math.sin(t), y: 400 + x*Math.sin(t) + y*Math.cos(t) };
});
for (const [name, points] of [
  ['standard', heart()], ['dense slow', heart(4000)], ['fast sparse', heart(12)], ['small', transform(heart(), 0, .15, .15)],
  ['wide', transform(heart(), 0, 1.5, .8)], ['narrow', transform(heart(), 0, .65, 1.2)],
  ['leaning left', transform(heart(), -35)], ['leaning right', transform(heart(), 35)],
  ['reverse', heart().reverse()], ['small closure gap', heart().slice(2,-2)],
  ['uneven lobes', heart().map(p=>({...p,y:p.y+(p.x<200?20:0)}))],
  ['jitter', heart().map((p,i)=>({x:p.x+Math.sin(i*3)*3,y:p.y+Math.cos(i*2)*3}))],
  ['pauses', heart().flatMap(p=>Array(6).fill(p))],
  ['different starting point', [...heart().slice(30,-1), ...heart().slice(0,31)]],
  ['deep cleft', [{x:200,y:210},{x:170,y:150},{x:110,y:130},{x:70,y:170},{x:80,y:220},{x:140,y:280},{x:200,y:330},{x:260,y:280},{x:320,y:220},{x:330,y:170},{x:290,y:130},{x:230,y:150},{x:200,y:210}]],
]) test(`accepts ${name} heart`, () => assert.equal(isHeart(points), true));
const circle = Array.from({length:81},(_,i)=>({x:200+100*Math.cos(i/80*Math.PI*2),y:200+100*Math.sin(i/80*Math.PI*2)}));
for (const [name, points] of [
  ['circle', circle], ['oval', transform(circle,0,1,.6)], ['tap', [{x:20,y:20}]],
  ['tiny heart', transform(heart(),0,.04,.04)], ['open half heart', heart().slice(0,40)],
  ['line', Array.from({length:40},(_,i)=>({x:i*5,y:i*5}))],
  ['square', [{x:0,y:0},{x:50,y:0},{x:100,y:0},{x:100,y:50},{x:100,y:100},{x:50,y:100},{x:0,y:100},{x:0,y:50},{x:0,y:0}]],
  ['triangle', [{x:50,y:0},{x:75,y:50},{x:100,y:100},{x:50,y:100},{x:0,y:100},{x:25,y:50},{x:50,y:0},{x:50,y:0}]],
  ['scribble', Array.from({length:100},(_,i)=>({x:200+100*Math.sin(i*1.8),y:200+100*Math.cos(i*2.7)}))],
]) test(`rejects ${name}`, () => assert.equal(isHeart(points), false));
