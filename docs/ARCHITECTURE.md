# Architecture and interview notes

## Request path

1. Static HTML/CSS/JavaScript render the editor and Canvas artwork in the browser.
2. Same-origin `/api/*` requests enter the Cloudflare adapter and shared handler.
3. Shared schema validation normalizes names, letter length, custom pixel art and asset IDs.
4. Guest creation independently prices selected assets, creates token hashes and records a reservation through PostgreSQL RPC. No account is required for new gifts.
5. A free gift is readable immediately for one hour. A paid reservation becomes readable for 30 days after verified payment.
6. Stripe webhook signatures, amount, currency, environment and metadata are checked. An idempotent database transition handles duplicate callbacks without extending expiry.
7. The share link permits reading; the separate management link permits status checks, letter/name/music edits and revocation. Raw link credentials are not stored in gift database rows.

## Privacy and payment boundaries

- Supabase server credentials and Stripe secrets exist only in server environment variables.
- The browser never decides whether a payment succeeded.
- RLS and grants prevent anonymous direct reads of guest gift tables.
- Full refunds prevent subsequent reads; expiry and revocation are checked on server reads.
- A paid story export requires a matching active canonical gift, with a fresh server read before download. Basic free gifts remain downloadable.
- Story privacy controls affect exported image text. They do not lock the original letter against someone who has its share link.
- Expired guest content is pruned in batches on creation after the configured grace period; payment reference metadata is retained separately.
- Quotas use device/IP-derived hashes and do not claim to identify unique humans.

## Tradeoffs worth discussing

- No-login creation reduces friction, but loss of the private management link limits recovery.
- Link bearer access is simple for recipients, but anyone receiving a forwarded share link can read it while valid.
- Vanilla JavaScript and Canvas keep the pixel renderer direct; shared validation and tests reduce drift between browser and server.
- Per-gift pricing replaces permanent unlocks for new gifts and allows a single final checkout.
- Mocked payment integration is safe for demonstrations, but it does not prove a real bank payment.
- A count of HTTP requests is not a count of users or gifts. Visitor analytics must be measured separately.

## Demo sequence

Home → choose a doll → dress or draw → choose flowers and meanings → letter/music → quote → free gift creation → envelope → read letter → open box → export image.

Use only fictional names and messages during demonstrations. For payments, show tests or the quote; do not ask interviewers to make a real purchase.
