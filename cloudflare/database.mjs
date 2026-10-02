export const asNote = row => ({ ...row, favorite: !!row.favorite, archived: !!row.archived });

export async function submitNote(db, note, visitor, createdAt = new Date().toISOString()) {
  // D1 batches are transactional. The trigger, receipt, and note commit together;
  // concurrent submissions cannot slip between a rate-limit check and its write.
  await db.batch([
    db.prepare(`INSERT INTO note_submissions(id,visitor,created_at)
      SELECT ?,?,? WHERE NOT EXISTS(SELECT 1 FROM guest_note_receipts WHERE id=?)`)
      .bind(note.requestId, visitor, createdAt, note.requestId),
    db.prepare(`INSERT INTO guest_notes(id,message,name,color,stamp,created_at)
      SELECT ?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM guest_note_receipts WHERE id=?)`)
      .bind(note.requestId, note.message, note.name, note.color, note.stamp, createdAt, note.requestId),
    db.prepare('INSERT OR IGNORE INTO guest_note_receipts(id) VALUES(?)').bind(note.requestId),
    db.prepare("DELETE FROM note_submissions WHERE created_at < strftime('%Y-%m-%dT%H:%M:%fZ', ?, '-1 day')").bind(createdAt),
  ]);
}

export async function importNote(db, note, createdAt) {
  await db.batch([
    db.prepare(`INSERT INTO guest_notes(id,message,name,color,stamp,created_at)
      SELECT ?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM guest_note_receipts WHERE id=?)`)
      .bind(note.requestId, note.message, note.name, note.color, note.stamp, createdAt, note.requestId),
    db.prepare('INSERT OR IGNORE INTO guest_note_receipts(id) VALUES(?)').bind(note.requestId),
  ]);
}
