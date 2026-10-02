// One-time, non-destructive export/import. Run with the old .env.local loaded.
// Raw notes and SQL stay in a git-ignored directory restricted to this user.
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const dir = '.migration.local';
mkdirSync(dir, { recursive: true, mode: 0o700 });
const data = {};
for (const table of ['guest_notes', 'guest_note_receipts', 'note_submissions']) {
  const rows = [];
  for (let offset = 0;; offset += 1000) {
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${table}?select=*&order=id&offset=${offset}&limit=1000`, {
      headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Cannot export ${table}: ${response.status}`);
    const page = await response.json(); rows.push(...page);
    if (page.length < 1000) break;
  }
  data[table] = rows;
}
const backup = `${dir}/supabase-${Date.now()}.json`;
writeFileSync(backup, JSON.stringify(data), { mode: 0o600 });
const q = value => value === null ? 'NULL' : typeof value === 'boolean' ? Number(value).toString() : `'${String(value).replaceAll("'", "''")}'`;
const columns = ['id','message','name','color','stamp','created_at','read_at','favorite','archived'];
const sql = [];
for (const row of data.guest_notes) {
  const normalized = { ...row, created_at: new Date(row.created_at).toISOString(), read_at: row.read_at ? new Date(row.read_at).toISOString() : null };
  sql.push(`INSERT OR IGNORE INTO guest_notes(${columns.join(',')}) SELECT ${columns.map(k=>q(normalized[k])).join(',')} WHERE NOT EXISTS(SELECT 1 FROM guest_note_receipts WHERE id=${q(row.id)});`);
}
for (const row of data.guest_note_receipts) sql.push(`INSERT OR IGNORE INTO guest_note_receipts(id) VALUES(${q(row.id)});`);
// Old rate-limit rows are retained in the export. Only unexpired limits matter
// after cutover; do not replay them through the insertion trigger.
writeFileSync(`${dir}/import.sql`, sql.join('\n'), { mode: 0o600 });
if (sql.length) execFileSync('pnpm', ['exec','wrangler','d1','execute','sarena-playground-notes','--remote',`--file=${dir}/import.sql`,'--yes'], { stdio: ['ignore','pipe','pipe'] });
console.log(`Copied ${data.guest_notes.length} notes and ${data.guest_note_receipts.length} receipts. Source unchanged. Backup: ${backup}`);
