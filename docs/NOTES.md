# The little guestbook

Visitors write a private note at `/leave-a-note`. The writing desk has four paper colors, four stamps, an optional name, a 1,000-character message, and a delivery confirmation that appears only after a successful database or private-backup write. The homepage closing section and room navigation link to it.

The owner signs in at `/my-notes` with an emailed magic link. The wall supports unread, favorites, archive, paginated loading, reading a full note, and confirmed permanent deletion. All notes are private. There is no public list endpoint or visitor signup.

## Connected services

Supabase project: **Sarena Playground**, project reference `ossdpvluwqgudbmifxmg`, region `us-west-1`, in the existing `s.llabs` organization. Owner account: `sarenataji@gmail.com`.

The project is linked locally through the Supabase CLI. `.env.local` contains the app connection settings; `.env.notes-admin.local` contains the generated database password. Both are git-ignored and restricted to the local user. Vercel preview and production environments have app configuration. The GitHub `main` branch is connected to automatic production deployments.

Public browser variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (publishable/anon key, never the service key)

Server-only variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NOTES_RATE_LIMIT_SECRET` (random HMAC secret)
- `BLOB_READ_WRITE_TOKEN` (private backup store credential)
- `CRON_SECRET` (authenticates the daily sync job)

Never use a `VITE_` prefix for a secret. `.env.example` is a placeholder template, not usable credentials.

## Implementation

- `src/pages/LeaveNote.tsx` and `src/pages/notes.css`: writing desk and confirmation.
- `src/pages/NoteWall.tsx`: authenticated private wall.
- `src/lib/notes.ts`: browser Supabase client, colors, stamps, note types.
- `api/notes.js`: Vercel submission function. The Vite dev middleware uses the same handler.
- `server/note-validation.mjs`: server-side validation.
- `server/note-backup.mjs`: independent private backup queue, outage rate reservations, safe replay.
- `api/notes-sync.js`: owner-authorized or cron-authorized synchronization.
- `src/lib/noteDraft.ts`: local draft recovery and expiration.
- `supabase/migrations/202609250001_guest_notes.sql`: tables, row permissions, rate-limited submission function.
- `supabase/config.toml`: owner login settings and allowed redirects. Top-level `auth.enable_signup` is false. Keep `auth.email.enable_signup` true: the CLI maps it to whether the email provider is enabled, including login for existing users.

## Access and spam protection

Only authenticated IDs listed in `note_owners` may read, favorite, archive, mark read, or delete notes. Even the owner cannot rewrite a visitor's message through the browser API. No browser role may insert a note directly or call the submission function. The server uses its service key to call it.

Submission validates input and a honeypot. A durable database limit permits one note per minute and five per hour per HMAC of the visitor's IP. Vercel supplies the trusted IP header; local development uses the socket IP. Raw IP addresses are not stored by the note feature. Rate-limit records older than a day are deleted during subsequent submissions. Shared networks share a limit. This is basic spam protection, not a CAPTCHA or comprehensive abuse prevention.

A client-generated UUID and permanent, content-free `guest_note_receipts` make retries idempotent. Receipts remain after note deletion, so delayed queue retries cannot resurrect a deleted note. New receipts are inserted atomically with the corresponding note; failed writes roll back both.

## When Supabase is paused or unavailable

Submissions first attempt Supabase with a short timeout. If it is unavailable, the endpoint saves the validated note in **private Vercel Blob storage**, store `store_h48Cny0h1skJg3sD` (`sarena-note-backup`). Backup reads require a server credential; the browser receives no object URL or credential. A success response means one of these server-side stores confirmed the write. A database rate-limit rejection never falls through to backup.

The backup queue uses immutable, per-note files and create-only rate reservations. During outages, a shared network may submit one distinct note per 12-minute clock window; retries of that same note remain allowed. This conservative fallback limit does not require Supabase. Old outage rate reservations are cleaned after two days by the sync job. Queued notes have no automatic expiry.

After Supabase resumes, opening/refreshing the owner wall synchronizes up to 20 queued notes. A Vercel cron job also attempts up to 100 daily around 09:00 UTC (Hobby cron timing is approximate). It calls `GET /api/notes-sync` with `Authorization: Bearer <CRON_SECRET>`. Manual wall sync uses `POST /api/notes-sync` with the owner's Supabase JWT, verified against `is_note_owner`. Both routes return only progress counts, never note contents. Supabase receives the original submission time. Queue entries are deleted only after a committed, idempotent import; failures retain them.

The owner wall and login still need Supabase. Resume the project in the Supabase dashboard before reading queued notes there. The queue is independent of Supabase, but still depends on Vercel availability, valid storage credentials, and storage/usage limits. This is outage protection for new submissions, not a permanent second copy of every note already stored in Supabase.

If both server stores are unavailable, the form shows an error and does not claim delivery. Unsent drafts are saved in browser local storage with a seven-day expiry checked on restore, including their retry UUID. The form shows a device-storage notice and a Clear draft control. Sending successfully clears the local draft. Local drafts are not a server backup; browser storage can be blocked, cleared, or unavailable and drafts are never submitted automatically.

## Owner access

Open `/my-notes`, enter the owner email, and request a sign-in link. Check spam if needed. The default Supabase mail service has sending limits and recipient restrictions; for broader delivery, configure an SMTP provider in Supabase. No external mail service was purchased or configured.

To grant another owner, first create their user in Supabase Authentication, then insert their UUID into `public.note_owners` using the SQL editor. A user cannot grant themselves access. Remove their row to revoke access.

## Validation

```sh
pnpm build
node --test tests/notes.test.mjs tests/notes-backup.test.mjs tests/note-draft.test.mjs tests/loop.test.mjs tests/witness.test.mjs
node --env-file=.env.local --test tests/notes-live.test.mjs tests/notes-backup-live.test.mjs
```

The live test creates temporary notes and a temporary auth user, verifies anonymous/non-owner denial and owner actions, exercises retry deduplication/rate limiting, and cleans up its records. It needs server credentials and is skipped when those are absent. Run it only against an intended test project or with awareness that it briefly writes test records to the configured database.

Use `pnpm dev` for the full local submission flow at port 5177. `pnpm preview` only serves the static build and does not run the API. Hosted verification should cover a real successful submission, private-wall sign-in, owner controls, direct-link refresh, mobile overflow, and failure preservation.

The backup integration test simulates an unreachable Supabase submission endpoint while using the real private Blob store. It verifies unreadability without credentials, 1,000-character storage, retry deduplication, original timestamps on recovery, and no resurrection after deletion. It uses an isolated `test/` prefix and deletes its own records.
