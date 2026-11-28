# Astra Youth Innovation Network

Next.js application for Astra's public website and application forms.

## Local development

Requires Node.js 22 or newer and pnpm 11.5.2.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3000. The build scripts prepare the locally served
MapLibre worker from the installed package; keep `scripts/prepare-maplibre.mjs`.

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:cloudflare
pnpm build:next
pnpm start
pnpm exec playwright install chromium
pnpm test:e2e
```

Do not commit dependencies, build output, screenshots, recordings, environment
credentials, real application records or CVs.

## Current application status

Core has six application stages and requires a PDF CV and six membership
acknowledgments. Fellow has five stages and an optional CV. Projects and links
are optional on both. The local confirmation is labeled Development preview and
does not send data, verify email or claim receipt. Prepared backend code
includes verified-email duplicate checks, private PDF CV handling and
an authorized review dashboard at `/admin`. Intake fails closed without complete
configuration, an active round, and explicit CAPTCHA/privacy/intake approval.

The source includes additive Supabase migrations and an Astra-branded email
template for Supabase Auth with Resend custom SMTP. External services are **not
configured or certified live**. Follow [backend setup](docs/backend-setup.md) and
test a separate development project before enabling applications.

The integrated frontend retains its single Motion runtime, shared root
scroll-reveal ownership, native shimmer timeline and rendering/lifecycle fixes
with this backend. The approved logo, fixed navigation, Gravity Stars, Lenis,
application design and licensed program-image alternatives are retained.
Styled question cards keep their native keyboard controls and full-card
pointer/touch target. OTP controls and configuration notices are not mounted in
the local forms. Draft answers remain in page memory only. Connecting the prepared
backend to the frontend requires a separate, approved Supabase integration.

For the future intake integration: verify and normalize email addresses before
server-side duplicate checks, and enforce one application per pathway and cycle.
Disable Done Now while a submission is processing, make repeat clicks safe at
the server, and apply rate limiting and anti-spam protection. A verified
duplicate must create no new record and display: **Application already
submitted.** We have already received an application for this membership pathway
using your email address. Applying to both pathways in the same cycle remains
an open policy decision. Show the receipt confirmation only after successful
storage; on failure, retain the applicant’s answers and do not start the timer.

A separate school-interest endpoint and its existing migration are retained.
Its production host check remains Vercel-specific; do not enable that legacy
intake on a different host without a reviewed trusted-proxy adaptation.

## Service configuration

`.env.example` lists variable names only. Supply real values in a local
`.env.local` file or your hosting provider's server-side secret configuration.
Never put service-role or other secret keys in `NEXT_PUBLIC_*` variables.

Use a separate development Supabase project and synthetic applicants for testing.
Review migrations under `supabase/migrations` before applying them. The initial
membership migration enables RLS and removes anonymous/authenticated table access;
it is followed by the new pathway migration for Core/Fellow and private storage.

The existing school intake requires a canonical `SITE_URL`, a verified
`CONTACT_EMAIL`, server-only Supabase credentials, Turnstile configuration and a
cryptographically random `APPLICATION_IP_SALT` of at least 32 characters.
`APPLICATIONS_OPEN` and `PRIVACY_REVIEWED` must remain disabled until the
organization approves intake and its privacy/safeguarding procedures. Configure
an approved retention period; verify cleanup and backups before accepting data.

## Public assets and permissions

The school directory describes public school locations, not confirmed Astra
affiliations. Conceptual stock imagery does not depict Astra members or events.
Asset source notes and licenses are retained beside the relevant assets; the
Gravity Stars attribution is in `docs/licenses/gravity-stars-MIT.txt`.

Legacy reference images with unconfirmed redistribution rights are excluded.
The live page already uses the licensed photographs in `public/images/program-stock`;
its displayed imagery and animations are unchanged.

No repository-wide license is asserted for third-party assets.

## Deployment

`pnpm build` produces the website-only Cloudflare Worker using vinext;
`pnpm deploy` deploys its generated configuration, not `.next`. No paid bindings
are configured. Native Node builds remain available through `pnpm build:next`.
See [Cloudflare settings and verification](docs/cloudflare.md).

The Cloudflare entry point blocks all API requests and server writes independently
of intake flags. The original local forms and appearance are unchanged. The
prepared backend remains in source, including isolated PDF validation, but is not
activated on Workers. Supabase and a Cloudflare-compatible submission backend are
separate future work. Local verification is not proof of a hosted deployment.

## Public repository release

This is an independent source snapshot, not a copy of the private development
history. Private instructions, build artifacts, credentials, browser recordings,
real applicant records and CVs are excluded. Automated secret scans do not prove
absolute absence of secrets.

Public push is blocked by unconfirmed redistribution permissions for
`public/media/astra-reel{,-loop,-poster,-still}.*` and
`public/videos/video.mp4`, and unconfirmed reuse terms for
`src/data/qatar-schools.json` (see `qatar-schools-manifest.json`, `rights`).
These files are already present in the independent repository's initial commit;
deleting them from the latest tree would not exclude them from a public push.
Under the default policy, publication requires confirmed rights or an explicitly
approved history-clean export excluding those files. See the
[Lenis 0.065 release exception and licensing status](docs/release-licensing.md)
for the authorized update to the existing public deployment.
