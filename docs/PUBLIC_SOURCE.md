# Public source boundary

Prepared on 28 October 2026 from a current source snapshot for interview review. This repository starts with a new history and is independent of the private production repository and its deployment integration.

## Included

Frontend, backend handlers, pixel renderer, schema migrations, tests with synthetic data, build scripts, fonts with their license notices, and guide screenshots reviewed as fictional examples.

## Excluded or replaced

- All original Git history and author metadata
- Real `.env` files, provider login state, Cloudflare/Vercel local state, build outputs and `node_modules`
- Production account/project identifiers and payment configuration IDs
- Private operational runbooks and payment QA records
- Gift payload exports, private management links, real checkout links, transaction records and database dumps
- Personal contact email in the sample policy pages (replaced with `contact@example.invalid`)
- Original background MP3 and unused historical story/recipient sample images

Provider configuration uses placeholders and live payments are disabled. A soundtrack-disabled flag exists only in this public snapshot; playback logic remains available for study and tests. The private production application is not modified by this export.

## Verification and limits

A local scan checked tracked source and historical text blobs for common credential formats before the export. The publication uses no original history regardless of those results. The public snapshot is checked again for credential patterns, private file types and unexpected contact addresses. Guide images were inspected visually; only fictional guide examples are included. Source tests, Pages build and runtime checks are run on this copy.

Pattern scans are a practical check, not proof that all secrets or application vulnerabilities are absent. Synthetic values such as `sk_test_local_not_real` in test doubles are intentionally nonfunctional fixtures. The schema files contain table/function definitions, not live rows. Keep any later local configuration outside Git and review future commits before publishing.

## Verification result for the initial public snapshot

- `npm ci --ignore-scripts`: installed from the lockfile; npm reported zero known vulnerabilities at preparation time.
- `npm test`: 21 smoke checks and 115 Node tests passed.
- `npm run build:pages`: static assets and Pages API bundle built successfully.
- `npm run test:pages`: actual local workerd startup, safe configuration, UTF-8 webhook verification and tampered payload rejection passed.
- `npm run audit:public`: no matched credential/private-export/unexpected-contact findings after sanitization.
- Browser check: Home and maker load from the public copy without provider keys; omitted soundtrack is disabled and no audio element is created.

No live payment, production database write, or production deployment is performed by these checks.
