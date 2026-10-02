# The little guestbook

Visitors write private notes at `/leave-a-note`. The owner’s `/my-notes` link redirects to the Cloudflare-hosted private wall. The writing desk and wall retain paper colors, stamps, drafts, favorites, archive, unread status, pagination, and permanent deletion.

## Connected services

The public site remains at `https://sarena-playground.vercel.app`. Its guestbook now uses **Cloudflare Workers + D1**, in Laurent’s account (`laurent.lucian@gmail.com`, account `e10330ae87e731bb6a8dd05cef749390`). The account email does not grant access to the notes wall.

- Worker: `sarena-notes`, `https://sarena-notes.llabs.workers.dev`.
- D1: `sarena-playground-notes`, ID `b6c940c6-5e42-479c-a8e4-bfd950d6cbe9`, binding `DB`.
- Cloudflare Access app: **Sarena private notes**, ID `9a829dd0-f809-4607-801b-45b395dd9623`.
- Access team: `laurentlo.cloudflareaccess.com`.
- Policy: **Sarena only**, ID `8c54a4ee-c767-4aa6-965c-3dd50be91c05`. Allows exactly `sarenataji@gmail.com`.
- Login: Cloudflare One-time PIN, emailed to the owner, with a 24-hour application session.

Access protects `sarena-notes.llabs.workers.dev/my-notes` and `sarena-notes.llabs.workers.dev/api/private/*`. Keep the submission and authenticated backup-import endpoints outside those paths. Never broaden the owner policy to Everyone or a whole email domain.

The Worker independently verifies Access JWT signatures, issuer, audience, expiry, and the exact owner email. Without Access configuration or a valid owner token, private requests fail closed. Database credentials and shared secrets never enter the browser. Owner mutations require a matching Origin and can change only read status, favorite, or archive, or delete a note.

## Configuration and deployment

`wrangler.jsonc` contains the account, database, Access audience, owner email, and public site URL. Worker secrets are `NOTES_PROXY_SECRET` and `NOTES_RATE_LIMIT_SECRET`. Vercel uses the same secrets plus `NOTES_WORKER_URL`, `VITE_NOTES_ORIGIN`, `BLOB_READ_WRITE_TOKEN`, and `CRON_SECRET`. `.env.example` lists the configuration; `.env.local` is ignored by Git.

```sh
pnpm install
pnpm dev
pnpm test:notes
pnpm build
pnpm exec wrangler d1 migrations apply sarena-playground-notes --remote
pnpm deploy:notes
```

`pnpm dev` runs the Vercel submission handler locally. Owner login opens the hosted Cloudflare wall. `pnpm preview` serves static files only. To test the Worker’s database locally, use Wrangler and apply migrations with `--local`; real owner login requires Cloudflare Access.

GitHub `main` deploys the public Vercel site automatically. Deploy the Worker separately with `pnpm deploy:notes` when its code or the shared wall UI changes. The Worker contains a built copy of the wall. Apply new D1 migrations before deploying code that uses them. The Vercel `/my-notes` redirect keeps existing links working.

## Storage and delivery guarantees

Vercel validates a submission and forwards it to the Worker with a server-only shared secret and an HMAC of the trusted visitor IP. Direct Worker submissions derive that HMAC from Cloudflare’s trusted connecting IP. Raw IPs are not stored by this feature.

A transactional D1 batch stores the note, permanent content-free receipt, and rate reservation together. A database trigger limits each visitor HMAC to one note per minute and five per hour. Old rate rows are removed during subsequent submissions. Receipts survive note deletion, so delayed retries and backup imports cannot resurrect deleted notes.

Success is shown only after D1 or private backup storage confirms delivery. During an outage, the Vercel endpoint can still use the existing private Blob queue (`sarena-note-backup`, store `store_h48Cny0h1skJg3sD`). A database rate-limit rejection cannot fall through to this queue. The queue permits one distinct note per visitor HMAC per 12-minute clock window, with retries of the same note allowed.

The Vercel cron `GET /api/notes-sync`, authorized with `CRON_SECRET`, imports up to 100 queued notes daily around 09:00 UTC. Imports preserve original timestamps and delete queue files only after the D1 transaction commits. The owner wall reads D1 directly and no longer depends on an outage sync completing. It does not use Supabase login or data APIs.

Unsent drafts stay in browser local storage for up to seven days and are cleared on success or with Clear draft. If both stores fail, the form retains the draft and shows a delivery error.

## Migration from Supabase

On 2026-10-02, the paused Sarena Supabase project `ossdpvluwqgudbmifxmg` was resumed to export its data. One existing note and two permanent receipts were copied to D1. The source project was retained, and exports live in the ignored, owner-readable `.migration.local/` directory. Source notes were not deleted. The private Blob queue was empty at the initial migration check.

`supabase/` remains historical schema/configuration, not an application dependency. The one-time script `scripts/migrate-notes-to-d1.mjs` needs the old Supabase server environment values and a Wrangler login. It exports all source rows, saves a restricted local backup, and imports notes and receipts without overwriting existing D1 notes or resurrecting a D1-deleted note. Only run it intentionally during migration/recovery; it does not continuously sync edits from the old database. Historical rate reservations are backed up but not imported.

## Validation

```sh
pnpm test:notes
pnpm build
NOTES_LIVE_TEST=1 node --env-file=.env.local --env-file=.env.blob.local --test tests/notes-live.test.mjs tests/notes-backup-live.test.mjs
```

Live tests explicitly opt in, create isolated test notes in the Sarena D1 database, and clean up their own rows and Blob files. They use Wrangler for verification/cleanup and need the local server configuration. The backup test also needs `CRON_SECRET` and the private Blob token. Unit tests cover atomic rate limits, transaction rollback, receipt deduplication, no resurrection, owner-only APIs, cross-origin mutation rejection, immutable messages, filtering, validation, and outage delivery.

Hosted checks should include submission, anonymous redirect to Access, owner email-code sign-in, owner controls, and retrying after deletion. Never print private note contents or credentials into test logs.
