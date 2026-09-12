import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/pages/witnessExperience.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } });
const { chapters, chapterAt, cameraProgressAt, localProgress } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('chapter navigation reaches every chapter in both directions', () => {
  for (const index of [...chapters.keys(), ...[...chapters.keys()].reverse()]) {
    assert.equal(chapterAt(chapters[index].start + .002), index);
    if (index) assert.equal(chapterAt(chapters[index].start - .00001), index - 1);
  }
  assert.equal(chapterAt(1), chapters.length - 1);
});

test('expanding the story keeps the camera path continuous, bounded, and reversible', () => {
  let previous = 0;
  for (let step = 0; step <= 10000; step++) {
    const progress = step / 10000;
    const camera = cameraProgressAt(progress);
    assert.ok(camera >= previous && camera <= 1);
    assert.ok(localProgress(progress) >= 0 && localProgress(progress) <= 1);
    previous = camera;
  }
  for (const { start } of chapters.slice(1)) {
    assert.ok(Math.abs(cameraProgressAt(start - 1e-7) - cameraProgressAt(start + 1e-7)) < 1e-5);
  }
  assert.equal(cameraProgressAt(0), 0);
  assert.equal(cameraProgressAt(1), 1);
});
