# Application backend setup

## Operator handoff — preparation only

Do not run these steps until a dedicated development project is approved.
Source publication does not authorize live intake or deployment.

1. Open <https://supabase.com/dashboard> and create a new **development** project
   in the Astra organization and approved region. Store the database password in
   a password manager; the website does not need that password.
2. In the project's **Connect** dialog, find the project URL and publishable key.
   **Settings → API Keys** lists publishable/secret and legacy keys. Populate
   `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in ignored `.env.local`.
3. Put a server secret key (or the legacy `service_role` key) in this application's
   `SUPABASE_SERVICE_ROLE_KEY` variable. Despite the legacy variable name, both
   privileged key types belong **only on the server**. Never use `NEXT_PUBLIC_*`
   for them. Keep the database password, SMTP credential, Turnstile secret and
   application salts server/provider-only too. Never paste them into chat.
4. Review and apply the two migration files below, in order, in that project's
   SQL Editor. Confirm the project reference before each operation. No migration
   has been run by this handoff.
5. The pathway migration creates the **private** `astra-cvs` bucket: verify
   `public=false`, 5 MiB file limit, PDF-only MIME type, and the restrictive
   Storage policy. Do not add applicant read/list policies or make it public.
6. Follow **Supabase Auth and branded email** below: configure email OTP, approved
   expiry/rate limits, Turnstile, custom SMTP and both supplied token templates.
   Real codes must be delivered by Supabase to a controlled applicant inbox;
   the website must never invent a code or claim unconfirmed verification.
7. Invite the first trusted operator through Supabase Auth. Copy their verified
   Auth UUID and use the trusted SQL console to insert it into
   `public.astra_admin_roles` with role `admin`. Never grant this through public
   signup metadata. Resolve the documented MFA gate before production.
8. Keep all intake flags closed initially. Use fictional profiles, generated
   non-personal PDF files and reserved `example.org` fixtures for local tests.
   Use controlled inboxes only for delivery acceptance tests. Enable a development
   round solely for approved synthetic tests, then close it again.

Official key reference:
<https://supabase.com/docs/guides/api/api-keys>

## Status and launch gates

The implementation is local source, not an activated intake. No migration has
been applied to a hosted Supabase project, no real email has been sent, and no
Cloudflare deployment has been performed. Do not reuse an unrelated project.

Provision a separate Astra **development** Supabase project first. Confirm
privacy/safeguarding wording, processor region, retention policy, authorized
reviewers, sender/domain ownership and asset/data publication permissions before
opening production. Use synthetic applicants and reserved example.org addresses
in automated tests; actual email-delivery acceptance tests require controlled
test inboxes. Never use real student records for destructive testing.

## Environment

Copy `.env.example` to an ignored `.env.local`. It deliberately contains no
working credentials or pre-enabled launch flags.

| Variable | Purpose |
| --- | --- |
| `SITE_URL` | Exact canonical origin; HTTPS in production, localhost for development |
| `SUPABASE_URL` | Designated project's HTTPS API origin |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only privileged key; never `NEXT_PUBLIC_*` |
| `SUPABASE_PUBLISHABLE_KEY` | Auth client key used on the server; not an admin credential |
| `APPLICATION_IP_SALT` | Cryptographically random secret, at least 32 characters, for abuse fingerprints |
| `APPLICATION_DUPLICATE_SALT` | Separate stable random secret, at least 32 characters, for round-scoped email HMACs |
| `APPLICATION_RETENTION_DAYS` | Approved duration, integer 1–365; default 90 |
| `APPLICATION_AUTH_RETENTION_DAYS` | Inactive intake-created Auth account retention, integer 7–365; default 30 |
| `APPLICATION_TRUSTED_PROXY` | `cloudflare` on Workers, `vercel` on Vercel; no generic forwarded-header fallback |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public widget key, restricted to the correct hostnames |
| `TURNSTILE_SECRET_KEY` | Existing school-intake server verification key; also configure the corresponding key in Supabase Auth |
| `APPLICATION_AUTH_CAPTCHA_ENABLED` | Set to `true` only after testing Supabase Auth CAPTCHA protection |
| `APPLICATIONS_OPEN`, `PRIVACY_REVIEWED` | Set to `true` only after actual approvals and integration checks |
| `APPLICATION_MAINTENANCE_SECRET` | Optional high-entropy job credential, at least 32 characters |
| `APPLICATION_MAINTENANCE_ACTOR_ID` | UUID of a provisioned admin authorized for maintenance |
| `CONTACT_EMAIL`, `SITE_LIVE` | Existing public contact and indexing controls |

Keep all secrets in your local environment or hosting secret store. Do not put
them in browser bundles, build logs, shell arguments, committed `.env` files or
email templates. Resend credentials are configured in Supabase SMTP settings,
not embedded in the website. Do not rotate the duplicate HMAC key during an
active round without a reviewed marker migration: doing so changes fingerprints.

## Database and storage

Apply migrations in filename order through a reviewed Supabase migration process:

1. `202610180001_membership.sql` — existing school intake.
2. `202611150001_pathways.sql` — additive Core/Fellow backend.

The new schema includes rounds, administrator roles, question rules, applications,
profiles (school/grade/eligibility), typed answers/selections/weekly time,
projects, links, CV metadata, review notes, audit records, submission requests,
upload-attempt tracking, rate limits and duplicate markers.

Every application table has RLS enabled and no anonymous/ordinary-authenticated
table grants or record policies. Service credentials are server-only. The private
`astra-cvs` bucket enforces a 5 MiB per-file limit and PDF MIME type. A restrictive
Storage policy excludes this bucket even if another permissive policy exists.
Review existing project policies and bucket configuration before applying.

The service-only submission RPCs enforce counts, required answers, current
question limits, profile constraints, registered CV paths and duplicate
protection. The ordinal keys cap projects and links at five. Database writes are
transactional; Storage and Postgres are not a single transaction.

Create rounds deliberately with a unique name, approved opening/closing times,
and `is_active=false`. After testing, activate the intended round; only one may
be active. Never reopen an old round ID after its duplicate markers have expired.
Create a fresh round for a new intake. No migration opens intake automatically.

## Supabase Auth and branded email

1. Configure the Auth Site URL to match `SITE_URL`. Keep callback URLs narrowly
   allowlisted; this implementation uses codes rather than redirecting magic links.
2. Enable email OTP/signup for applicants. Disable unused providers and unused
   public password-registration paths where the platform permits. Applicant Auth
   accounts have **no application-table privileges and no admin role**.
3. Enable Supabase Auth CAPTCHA using the Turnstile provider. Restrict the widget
   to your real development/staging/production hostnames as appropriate.
4. The website forwards the raw token through `signInWithOtp`'s `captchaToken`.
   Supabase validates it server-side. Do not consume the same token with a second
   Siteverify request: Turnstile tokens are single-use.
5. Set an approved short OTP expiry (recommended starting point: 10 minutes),
   resend interval and email quotas. Test expiry, reuse, invalid codes, resend
   throttling and rejection of missing/invalid CAPTCHA before setting
   `APPLICATION_AUTH_CAPTCHA_ENABLED=true`.
6. Configure **custom SMTP**. Supabase's built-in sender is for testing and has
   restricted recipients/very low quotas; it is not a public intake mail service.

### Resend

Create a Resend account and verify an organizational sending domain/subdomain.
Copy **the exact DNS records Resend supplies** (DKIM and return-path/SPF records);
do not invent selector names or overwrite an existing SPF record blindly.
Configure an appropriate DMARC policy after checking existing mail use.

Use Resend's documented SMTP host, port, username and scoped delivery credential
in Supabase **Authentication → Email → SMTP**. Choose a verified From address
and the sender name **Astra Youth Innovation Network**. Keep SMTP credentials in
the provider settings, never source control. Sending limits and costs are
provider/account-dependent; do not assume public intake is free or unlimited.

Paste `supabase/templates/verification.html` into **both** the new-user
confirmation and passwordless/magic-link email templates used by the project.
They must include `{{ .Token }}` rather than requiring applicants to click a link.
The logo URL uses `{{ .SiteURL }}/branding/astra-logo-light.png`. Ensure that
public HTTPS asset is reachable before sending. The message remains readable
with remote images blocked. The companion `.txt` is a plain-text alternative
for providers/hooks that support one; standard Supabase template settings are HTML.

Preview the actual delivered message in major mail clients and on mobile, with
images disabled and dark mode. Confirm sender authentication and code verification
with a controlled test inbox. This repository does not send email directly via a
Resend API key and does not pretend SMTP configuration is already complete.

## Application flow

The public five-step frontend currently runs locally without OTP controls,
configuration notices or submission requests. Done Now retains the review;
it never claims receipt. The flow below describes the prepared backend contract,
not an activated frontend integration. Supabase setup and frontend connection
are deferred until source publication is resolved and separately approved.

- Once integrated, profile-stage email verification is followed by an authenticated eligibility
  check. Unverified callers cannot query application existence.
- A verified mailbox may submit **one Core and one Fellow application per round**.
  Editing the email invalidates the local gate. The server checks identity,
  active round and uniqueness again; client-side state is not authorization.
- `POST /api/pathway-applications` accepts multipart `application` JSON and
  one to three `cv` files. Each PDF is limited to 5 MiB and 50 pages; encrypted,
  malformed, embedded/interactive documents are rejected. Compressed object and
  cross-reference streams are conservatively rejected **before** parsing; use
  Print to PDF/export a flattened PDF if needed.
- The actual streamed request is capped at 15 MiB plus 64 KiB. Body reads,
  upstream operations and browser requests have bounded waits. PDF parsing also
  runs in a separate terminable Node worker with a three-second budget and V8
  heap/stack limits. At most two submissions run per Node process at once.
  Preflight rejection prevents the parser's object/xref decompression path; the
  worker's V8 limit alone would not bound external ArrayBuffers. This is resource
  containment, not malware certification or an operating-system sandbox.
  Validate parser CPU/memory behavior and upload limits in the deployment runtime
  before launch. Consider isolated malware/content scanning for the approved risk
  profile; do not display applicant PDFs inline.
- Integrated clients must retain an `Idempotency-Key` UUID for unchanged retry data.
  The server binds it to the verified owner and a canonical content hash.
- Each upload attempt has a distinct random prefix and a two-minute lease.
  Finalization writes all application rows and acceptance state in one transaction.
  A lost commit response is reconciled before any success is reported.
- Failed/uncertain uploads are durably tracked. An ambiguous database commit
  never triggers deletion of possibly accepted CVs. Retry with the same answers;
  keep the page open. A browser refresh does not restore this in-memory draft.

Initial IP quotas allow shared-school networks more room than per-mailbox quotas.
Apply provider CAPTCHA/rate limits and host-level abuse protection too.

## Administrator provisioning and review

Invite designated reviewers through Supabase Auth. Require unique accounts and
appropriate account security. Assign their verified Auth UUIDs to
`astra_admin_roles` through a trusted operator migration/SQL console:
`reviewer` for review operations, `admin` for exports/deletion/maintenance.
There is no public role-assignment or signup-to-admin endpoint.

Use `/admin/login`, then `/admin`. The server verifies the provider identity and
database role on each protected operation. Login uses an invited account password;
sessions last no more than one hour, use HttpOnly/SameSite cookies and are Secure
in production. There is no browser refresh-token persistence. Removing a database
role immediately removes authorization at the next operation. MFA challenge
enforcement is not implemented by this password-only UI: if your admin policy
requires MFA, add and test that flow or put the interface behind an independently
enforced organization identity/MFA boundary **before launch**.

The dashboard supports name search, pathway/status filters, date/status/pathway
sorting, 25-row pages, detail/answers/projects/links, notes and status changes.
CV access requires a separate authorized request and returns a 60-second
download URL. URLs may remain usable until expiry after access revocation; do
not paste them into tickets or messages.

CSV export requires `admin`, escapes formulas and quotes cells, and refuses
more than 1000 matching records rather than silently truncating. Filter first.
Exports contain personal data: store/dispose of downloaded copies according to
the organization's policy. Review, access, exports and deletion are audited
without copying applicant answers, CV URLs or note contents into audit records.

## Retention and deletion

An admin can delete an application and its CVs from the dashboard. Deletion first
marks the application unavailable for new CV links, removes Storage objects,
then deletes relational content. Interrupted deletion is retryable.

Schedule `POST /api/admin/maintenance` from an approved scheduler, using its
server-only bearer credential and configured authorized actor UUID, or invoke it
from the admin UI. It cleans abandoned uploads older than one hour, expires up to
25 applications per invocation, purges old abuse counters and reconciles old
submission coordination rows. It processes up to 50 orphan attempts at a time;
run often enough for volume and alert on failures/backlogs. No scheduler was
provisioned by this implementation.

Round-scoped HMAC markers preserve duplicate rejection after content deletion
without retaining the raw email. They expire a day after the round's closing
time. Review the lawful retention basis for these restricted pseudonymous
markers. Audit records retain minimal operational identifiers; define and
implement the organization's approved audit retention schedule.

Supabase Auth mailboxes have a separate explicit inactivity policy. A
creation-only trigger marks new signup requests from this intake as managed;
editing user metadata later cannot enroll an existing account. Maintenance
scans up to 50 Auth accounts and deletes at most three old managed accounts per
invocation. It protects admin/reviewer roles, `astra_shared_account=true` in
trusted app metadata, retained applications (by owner or email), recent sign-ins
and recent pending submissions. It rechecks provider activity and role before
deletion. This includes abandoned/unverified signups and is retryable.

Use a **dedicated** Astra project; never repurpose this cleanup for another
product. Mark any intentionally shared account through trusted app metadata
before sharing it, and pause cleanup during concurrent privileged account
provisioning. Pre-existing untagged accounts are never automatically deleted.
Test both managed-account cleanup and all protection cases against the designated
development provider before launch. Nullable applicant ownership references
permit approved Auth erasure without cascading retained application content.

Provider email logs, backups and exported CSVs still need their own approved
retention/deletion controls. Verify restore procedures so erased data is not
unintentionally reintroduced.

## Verification

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Embedded Postgres tests execute real migration SQL and check grants, Storage
restrictions, both pathways, limits, atomic rollback, idempotency and leases using
synthetic provider schemas. Orchestration tests use explicit provider doubles.
Neither substitutes for acceptance tests against a dedicated hosted development
Supabase project. Real Auth/SMTP, RLS through PostgREST, Storage upload/download,
simultaneous independent connections, scheduled cleanup and provider outages must
be tested there before opening intake. No destructive production test is authorized.

## Task 64: connecting a designated development project

These are pending operator steps, not operations performed by Task 64:

1. Create a **new dedicated development** Supabase project in the approved region.
   Confirm its project reference and that it contains no production/student data.
   Keep production projects and production credentials out of this checkout.
2. Review both SQL files and apply them in filename order to that development
   project's SQL editor or a pinned, reviewed Supabase CLI migration workflow:
   `202610180001_membership.sql`, then `202611150001_pathways.sql`. For the CLI,
   initialize local configuration only if absent, link the confirmed development
   project, inspect migration history, run a dry run, then apply only the two
   reviewed migrations. Current CLI documentation uses explicit `--remote` to
   target a linked project; inspect your pinned CLI's `--help` and printed target
   before any remote mutation. Never use database reset or migration repair to
   force an uncertain history.
3. Create ignored `.env.local` from the example and enter development credentials
   locally. Supply the development URL, server-only service/publishable keys and
   independent random IP/duplicate salts. Use `SITE_URL=http://localhost:3000`
   with `pnpm dev`. Keep intake/privacy/CAPTCHA flags false until their checks and
   approvals are satisfied. Do not send credentials in chat or command arguments.
4. Configure development Auth email OTP, exact Site URL, Turnstile CAPTCHA,
   controlled test inbox delivery via custom SMTP, and the two branded templates.
   Use actual controlled inboxes for delivery checks; reserved example.org fixtures
   in automated tests do not demonstrate email delivery.
5. Create an inactive synthetic intake round with explicit opening/closing times.
   Invite controlled reviewer/admin accounts and assign their verified Auth UUIDs
   through the trusted operator console, never applicant metadata or browser code.
6. Verify RLS/grants through anonymous and ordinary authenticated **PostgREST**
   clients; confirm the `astra-cvs` bucket is private and cannot be listed or read
   with their tokens. Verify reviewer-only links, exact application/file binding,
   60-second expiry, revocation, and audit failure behavior against real Storage.
7. In the development project only, activate the test round and enable the required
   intake flags only after privacy/CAPTCHA configuration is approved and verified.
   Exercise both pathways, all validation, missing/invalid PDFs, duplicate/racing
   requests, unchanged retry identity, failed upload/commit recovery, review/search/
   filtering, revocation, deletion and retention using synthetic applicants.
   Restore intake flags to false after acceptance testing.
8. Test OTP expiry/reuse/throttling, SMTP delivery, independent concurrent database
   connections and cleanup recovery. Local PGlite/provider doubles cannot certify
   those boundaries. Resolve admin MFA and audit/backup retention policy before
   launch. Schedule maintenance only after approving its deletion behavior.

Do not select a hosting architecture as a side effect of connecting development
Supabase. The Workers PDF-isolation and Next adapter gates in `cloudflare.md`
remain independent blockers.

### Repeatable local production-mode browser verification

For local synthetic verification in PowerShell (no real provider configuration):

```powershell
$env:NEXT_BUILD_DIR = ".next-verification"
$env:NEXT_PUBLIC_TURNSTILE_SITE_KEY = "1x00000000000000000000AA"
$env:APPLICATIONS_OPEN = "false"
$env:PRIVACY_REVIEWED = "false"
pnpm build
$env:PLAYWRIGHT_PRODUCTION = "true"
pnpm test:e2e
```

The widget key is Cloudflare's public test key, not a credential. The test server
overrides service credentials to empty values and keeps all intake flags false.
Browser tests exercise both complete local forms and verify completion makes no
POST requests. This verifies local UI and authorization boundaries, not live
Supabase. Default browser runs still use
`.next-e2e`; production mode uses `.next-verification`. Both store evidence under
`.test-output/playwright/results`. Avoid source edits or simultaneous builds while
testing in-memory drafts against `next dev`: Fast Refresh can reload them.
