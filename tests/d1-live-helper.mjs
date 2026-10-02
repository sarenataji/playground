import { execFileSync } from 'node:child_process';
export function d1(sql) {
  const output=execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','sarena-playground-notes','--remote','--json','--command',sql],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
  return JSON.parse(output)[0].results;
}
export const quote = value => `'${String(value).replaceAll("'","''")}'`;
export function cleanup(id) {
  d1(`DELETE FROM guest_notes WHERE id=${quote(id)}; DELETE FROM note_submissions WHERE id=${quote(id)}; DELETE FROM guest_note_receipts WHERE id=${quote(id)};`);
}
