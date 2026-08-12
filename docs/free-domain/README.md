# Free domain for SendPlate email (sendplate.is-a.dev)

Goal: a free domain Resend can verify, so verification codes can be emailed
to anyone (not just the Resend account owner).

Checked available: `sendplate.is-a.dev` (also `sendplate-hk.is-a.dev`).

## Steps

1. **Get the DNS values from Resend**
   In the [Resend dashboard](https://resend.com/domains) → *Add Domain* →
   enter `sendplate.is-a.dev`. Resend shows three records — keep the tab
   open:
   - MX on `send.sendplate.is-a.dev` (value like
     `feedback-smtp.us-east-1.amazonses.com`, priority 10)
   - TXT on `send.sendplate.is-a.dev` (`v=spf1 include:amazonses.com ~all`)
   - TXT on `resend._domainkey.sendplate.is-a.dev` (`p=MIGf…` — the DKIM key)

2. **Fork and edit the is-a.dev registry**
   - Go to https://github.com/is-a-dev/register and click *Fork*.
   - In your fork, add the three JSON files from this folder into the
     `domains/` directory, replacing the `REPLACE_WITH_…` placeholders with
     the values from step 1.
   - The `owner.username` must match the GitHub account opening the PR.

3. **Open the pull request**
   Title it e.g. `Register sendplate.is-a.dev`. Their bot checks the JSON
   format; maintainers usually merge within a few days. Read their
   [docs](https://docs.is-a.dev/) if the bot flags anything.

4. **Verify in Resend**
   After the PR merges (DNS propagates within ~an hour), click *Verify* on
   the domain in Resend. Then set in `.env`:
   ```
   RESEND_FROM="SendPlate <verify@sendplate.is-a.dev>"
   ```
   Codes can now be sent to any address, not just your own.

## Alternatives

- **eu.org** — a free *real* domain (e.g. `sendplate.eu.org`), no expiry,
  full DNS control; manual approval takes days to weeks. Pair with free DNS
  hosting (e.g. deSEC.io or Hurricane Electric).
- **Paid but nearly free** — a `.xyz`/`.site` domain is ~US$1–3 for the
  first year at Porkbun or Namecheap. Best email deliverability of all
  options (shared free domains carry more spam-filter suspicion) and no PR
  round-trip for every DNS change. Worth it before real users.
