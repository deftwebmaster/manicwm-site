# ManicWebmaster — Site Rescue

A conversion-focused website audit tool for [manicwebmaster.com](https://manicwebmaster.com/).

Live target: `https://manicwebmaster.com/tools/website-audit/`

---

## Overview

The visitor enters a URL. The static frontend calls a Cloudflare Worker. The Worker fetches the public page, extracts structural/trust/SEO/conversion signals, sends those signals to OpenAI, stores an optional saved report link, and returns a plain-English audit with a CTA and lead form.

**Stack:**
- Frontend: Static HTML/CSS/JS, no framework or build step
- Hosting: GitHub Pages or Cloudflare Pages
- Backend: Cloudflare Worker
- AI: OpenAI Responses API with Structured Outputs
- Bot protection: Cloudflare Turnstile, validated server-side
- Abuse control: Cloudflare Workers Rate Limiting binding plus optional KV cooldowns
- Storage: Optional Cloudflare KV for saved reports and leads

---

## File Structure

```
/
├── index.html      — Static page, report UI, CTA, lead form
├── style.css       — Responsive dark UI
├── script.js       — Browser logic, Worker calls, Turnstile, report rendering
├── worker.js       — Cloudflare Worker routes and AI/report logic
├── wrangler.toml   — Worker config, rate limit binding, optional KV comments
└── README.md
```

---

## What Changed For Launch

- Dynamic report CTA based on score and top fix
- Post-report lead capture form
- Copyable report summary
- Optional saved/shareable reports via KV
- `?report=...` shared-report loading
- Privacy/expectation note before submit
- Optional Turnstile client widget plus Worker-side verification
- Worker rate limiting and optional KV daily/domain cooldowns
- Stronger request validation and target fetch limits
- Richer audit signals: redirects, content type, response time, robots, schema, social links, forms, CTAs, analytics, local business signals
- OpenAI Structured Outputs via `text.format.json_schema`
- Fallback report normalization so the UI always receives 6 sections and 5 fixes

---

## Local Testing

By default, `script.js` uses mock mode because `WORKER_URL` contains `YOUR_WORKER`.

```js
const WORKER_URL = 'https://YOUR_WORKER.YOUR_SUBDOMAIN.workers.dev';
```

Serve locally:

```bash
python3 -m http.server 8080
```

Then visit:

```text
http://localhost:8080
```

Mock mode includes a fake saved report link and fake lead-submit success.

---

## Frontend Deployment

For GitHub Pages:

1. Push the repo to GitHub.
2. Go to **Settings → Pages**.
3. Set source to your branch and root folder.
4. Configure the custom domain if needed.

Before launch, update [script.js](script.js):

```js
const WORKER_URL = 'https://manicwebmaster-site-rescue.YOUR_SUBDOMAIN.workers.dev';
const TURNSTILE_SITE_KEY = 'YOUR_PUBLIC_TURNSTILE_SITE_KEY';
```

Leave `TURNSTILE_SITE_KEY` blank only for local testing.

---

## Worker Deployment

Install/login:

```bash
npm install -g wrangler
wrangler login
```

Deploy:

```bash
wrangler deploy
```

Set required OpenAI secret:

```bash
wrangler secret put OPENAI_API_KEY
```

Set Turnstile secret for production:

```bash
wrangler secret put TURNSTILE_SECRET_KEY
```

Optional lead webhook for notifications, such as a Zapier/Make/Formspree/custom endpoint:

```bash
wrangler secret put LEAD_WEBHOOK_URL
```

If neither `LEAD_WEBHOOK_URL` nor KV is configured, the lead form returns a setup error so leads are not silently lost.

---

## Saved Reports And Lead Storage

Saved report links and KV-backed lead storage require a KV namespace.

Create namespaces:

```bash
wrangler kv namespace create SITE_RESCUE_KV
wrangler kv namespace create SITE_RESCUE_KV --preview
```

Then uncomment and fill in the `[[kv_namespaces]]` block in [wrangler.toml](wrangler.toml):

```toml
[[kv_namespaces]]
binding = "SITE_RESCUE_KV"
id = "REPLACE_WITH_PRODUCTION_KV_ID"
preview_id = "REPLACE_WITH_PREVIEW_KV_ID"
```

Saved reports expire after 30 days. Leads expire after 180 days.

---

## Rate Limiting

The Worker includes a Cloudflare Workers Rate Limiting binding:

```toml
[[ratelimits]]
name = "SITE_RESCUE_RATE_LIMITER"
namespace_id = "1001"

  [ratelimits.simple]
  limit = 8
  period = 60
```

The Worker also uses KV, when configured, for:

- 20 audits per IP per day
- 15-minute cooldown per IP/domain pair

The rate limiter protects the expensive path even if someone calls the Worker directly.

---

## Turnstile

1. Create a Turnstile widget in Cloudflare.
2. Add the public site key to `TURNSTILE_SITE_KEY` in [script.js](script.js).
3. Add the secret key to the Worker:

```bash
wrangler secret put TURNSTILE_SECRET_KEY
```

The frontend widget alone is not enough. The Worker validates every token with Cloudflare before it fetches the target site or calls OpenAI.

---

## OpenAI Structured Outputs

The Worker uses the Responses API with:

```js
text: {
  format: {
    type: 'json_schema',
    name: 'site_rescue_report',
    strict: true,
    schema: reportJsonSchema(),
  },
}
```

The Worker still normalizes the report afterward so the UI always gets:

- 1 score
- 1 summary
- 6 audit sections
- 5 top fixes
- 1 final recommendation

---

## Worker Routes

| Route | Method | Purpose |
|---|---:|---|
| `/audit` | POST | Run audit and return report |
| `/lead` | POST | Store/forward lead form submission |
| `/report/:id` | GET | Load a saved report from KV |

---

## Production Checklist

- Update `WORKER_URL` in [script.js](script.js)
- Add Turnstile site key in [script.js](script.js)
- Set `OPENAI_API_KEY`
- Set `TURNSTILE_SECRET_KEY`
- Set `LEAD_WEBHOOK_URL` or configure KV
- Configure KV if you want saved report links
- Set `PUBLIC_REPORT_BASE_URL` in [wrangler.toml](wrangler.toml)
- Add production/staging origins to `ALLOWED_ORIGINS` if needed
- Deploy Worker
- Deploy static page
- Run a test audit, copy the share link, and submit a test lead

---

## Privacy Notes

Site Rescue fetches public pages only. The Worker sends extracted page signals and a body text sample to OpenAI, not raw credentials or private-site content. The UI tells visitors not to submit private dashboards, client portals, or password-protected pages.
