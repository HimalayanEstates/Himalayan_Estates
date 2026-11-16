# Security audit and remediation

Reviewed 14 November 2026. Scope: repository source, authentication, public data, admin mutations, dependencies, and CI. No evidence of an actual breach was established.

## Findings and attack paths

| Finding | Risk and attacker prerequisites | Fix | Verification |
| --- | --- | --- | --- |
| High: session replay after logout | Someone holding a stolen admin cookie could continue using it after browser sign-out. | Store hashed session-family revocations in the existing SiteSetting table; admin access and refresh check them. Refreshed tokens retain the family ID. Database errors deny access. | Regression tests with synthetic revocation storage verify original/refreshed tokens are rejected while a separate session remains valid. |
| Medium: credential changes did not invalidate cookies | A previously stolen cookie remained valid after the administrator changed credentials. | Bind signed tokens to the configured email and password hash; reject obsolete credentials, malformed tokens and expired sessions. | Credential-rotation, wrong-subject, tampering and expiry tests pass. |
| High: private property fields in public responses | An anonymous caller could request published listings and receive a precise address despite the location privacy flag, plus internal fields. | Explicit public DTO for both public endpoints; redact address and coordinates when precision is disabled; omit internal metadata and unapproved media. | Synthetic private fields do not appear in serialized public data. |
| Medium: unrestricted public settings | Any sensitive value placed in the generic settings store would be readable anonymously. No actual stored secret exposure was established. | Public endpoint uses an explicit allowlist. Authentication keys are reserved and hidden from general CMS settings. | Allowlist and reserved-key tests pass. |
| Medium: publish workflow bypass | An authenticated administrator could submit PUBLISHED through the general property edit instead of passing the cover-image checks. This is a workflow defect, not a privilege escalation. | General create/edit input rejects status; use dedicated lifecycle actions. | PUBLISHED input rejected; ordinary property input accepted. |
| Medium: spoofable rate-limit identity | With direct exposure, changing x-forwarded-for created new process-local buckets. | Ignore forwarding headers unless TRUST_PROXY_HEADERS=true is explicitly configured. | A second request with a different spoofed address reaches the same limit. |
| Hardening: browser origin enforcement | CORS alone did not reject writes from another origin. Exploitability depended on browser cookie/site behavior. | Reject foreign Origin headers for admin/auth writes, preserving allowed frontend and same-origin requests. | Unit tests and actual HTTP requests return 403 for foreign origins and 401 for unauthenticated allowed-origin requests. |
| Dependency advisories | npm reported Next/PostCSS and Prisma-related dependency advisories. Registry findings do not establish exploitability in this application. | Next 15.5.29, compatible npm audit fixes, and pinned PostCSS 8.5.33 override. | Both npm installations reported zero known vulnerabilities; both production builds passed. |

## Verification performed

- 11 security regression tests pass: `npm run test:security --prefix backend`.
- Backend and frontend production builds pass.
- Four HTTP checks pass on port 4100 with synthetic environment variables and an unreachable dummy database URL. No production database or Cloudinary writes were performed.
- Source inspection found no Stripe payment integration, Sites-hosted remix target, raw SQL execution, eval sink or dangerouslySetInnerHTML sink in the inspected application source. This is not proof that every injection or rendering attack is impossible.

## Strix status

The OSS CLI was launched on a separate source snapshot with credentials, images and archives excluded. Docker 29.9.3 responded and the sandbox image downloaded successfully. The CLI failed during LLM preflight: openai/auto timed out at 30 seconds, then again at 120 seconds. A direct gateway check returned HTTP 200 for /models but timed out on /chat/completions. No pentest agents completed, no exploit report was generated, and no Strix re-scan verified these patches. The local model gateway/upstream must answer chat requests before this stage can proceed. Strix Cloud is not signed in; no cloud source upload or credit purchase occurred.

## Deployment and remaining limits

- Existing admin sessions become invalid after deployment; sign in again. Revocation records use the existing SiteSetting model and require no schema migration. Their persistence behavior was tested with mocks, not live Neon writes. Revocation rows currently remain stored; archive them only after all tokens in that family have expired.
- Settings publicly exposed are limited to site.name, site.tagline, contact.email, contact.phone, contact.address, social.instagram and social.facebook. Review that list before adding another public setting.
- Rate limits are still process-local. Multiple replicas/restarts require a shared limiter or gateway/WAF enforcement. With proxy trust disabled, clients share the unknown-address bucket. Enable TRUST_PROXY_HEADERS only behind a proxy that replaces incoming identity headers. A global botnet/rate-limit bypass assessment remains outside the local checks.
- CI regression/dependency checks run on pull requests. Strix has a separate manual workflow to avoid automatic LLM spending. Configure GitHub repository secrets STRIX_LLM and LLM_API_KEY, plus LLM_API_BASE if using a custom endpoint. localhost:3001 is not reachable from GitHub-hosted runners; supply an endpoint reachable by that runner or use a controlled self-hosted runner.
- The Strix workflow fails if metadata is absent, status is incomplete, cost data is absent, or cost approaches its $1 cap. Even completed scans require review of stated coverage; bounded scans do not prove comprehensive security.
- No production pentest, live authenticated database workflow, cloud scan, or CI run was completed. A clean npm audit is limited to advisories known to that registry at check time.
