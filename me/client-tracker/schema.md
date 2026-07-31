# Client Tracker — Data Schema v0.1

## Top-level structure

```json
{
  "version": "0.1",
  "exportedAt": "2026-05-06T14:30:00Z",
  "clients": [...],
  "projects": [...],
  "quotes": [...],
  "touches": [...],
  "settings": { ... }
}
```

Flat collections (not nested) — easier to query, filter, and migrate.
Each entity references parents by ID.

---

## Client

```json
{
  "id": "cli_2026_001",
  "createdAt": "2026-05-06T14:30:00Z",
  "updatedAt": "2026-05-06T14:30:00Z",

  "name": "Sarah Chen",
  "businessName": "Chen Bakery",
  "phone": "+15551234567",
  "email": "sarah@chenbakery.com",
  "preferredContact": "text",

  "referralSource": "Google",
  "status": "active",

  "address": "123 Main St, Plano, TX 75024",
  "notes": "Prefers texts over calls. Husband Mike sometimes handles invoicing.",

  "firstContactDate": "2026-04-15",
  "lastTouchDate": "2026-05-06",

  "brandKit": {
    "primaryColor": "#8B4513",
    "secondaryColor": "#F5E6D3",
    "displayFont": "Playfair Display",
    "bodyFont": "Inter",
    "logoLocation": "Drive/ChenBakery/Logo/",
    "voiceNotes": "Warm, neighborhood-focused, slightly nostalgic",
    "tagline": "Bread the way grandma made it"
  },

  "webInfo": {
    "domain": "chenbakery.com",
    "registrar": "Namecheap",
    "domainExpiration": "2027-03-15",
    "hostingProvider": "GitHub Pages",
    "dnsManagedAt": "Cloudflare",
    "stack": "11ty static",
    "adminLoginLocation": "1Password vault: Chen Bakery",
    "sslExpiration": null,
    "retainerMonthly": 75,
    "lastRetainerInvoice": "2026-05-01"
  }
}
```

**Notes on design choices:**
- `brandKit` and `webInfo` are nested objects, not separate entities. Why: every client has at most one of each, and you'll always want them when viewing the client. Keeps the model flat enough to be readable but avoids junk null fields scattered at the top level.
- `referralSource` is a free-text string, not an enum. You'll discover sources organically. The dashboard can group/count them.
- `status` enum: `lead`, `quoted`, `active`, `completed`, `dormant`
- `preferredContact` enum: `text`, `call`, `email`

---

## Project

```json
{
  "id": "prj_2026_001",
  "clientId": "cli_2026_001",
  "createdAt": "2026-05-06T14:30:00Z",
  "updatedAt": "2026-05-06T14:30:00Z",

  "type": "website",
  "title": "Chen Bakery main site",
  "description": "5-page static site with online order form",
  "status": "in_progress",

  "quotedPrice": 2400,
  "invoicedAmount": 2400,
  "paidAmount": 1200,

  "startDate": "2026-04-20",
  "dueDate": "2026-06-01",
  "deliveredDate": null,

  "liveUrl": "https://chenbakery.com",
  "assetLinks": [
    { "label": "Design files", "url": "https://drive.google.com/..." },
    { "label": "Repo", "url": "https://github.com/..." }
  ],

  "deliverables": [
    { "label": "Homepage design", "done": true },
    { "label": "Menu page", "done": true },
    { "label": "Order form integration", "done": false },
    { "label": "Mobile QA", "done": false }
  ]
}
```

**Notes:**
- `type` enum: `website`, `logo`, `brand_identity`, `print`, `flyer`, `business_card`, `other`
- `status` enum: `quoted`, `accepted`, `in_progress`, `review`, `delivered`, `paid`, `archived`
- Computed field (not stored): `balance = invoicedAmount - paidAmount`
- `deliverables` is per-project freeform. No global template — different project types need different checklists.

---

## Quote

```json
{
  "id": "quo_2026_001",
  "clientId": "cli_2026_001",
  "projectId": "prj_2026_001",
  "createdAt": "2026-04-18T10:00:00Z",
  "updatedAt": "2026-04-19T15:00:00Z",

  "sentDate": "2026-04-18",
  "expirationDate": "2026-05-18",
  "status": "accepted",

  "lineItems": [
    { "label": "Site design (5 pages)", "amount": 1500 },
    { "label": "Order form integration", "amount": 600 },
    { "label": "Content migration", "amount": 300 }
  ],
  "total": 2400,

  "notes": "Verbal acceptance 4/19, kickoff 4/20"
}
```

**Notes:**
- `projectId` is nullable — you can quote before a project formally exists.
- Once accepted, the quote stays as a record. The project carries forward.
- `status` enum: `draft`, `sent`, `accepted`, `declined`, `expired`

---

## Touch (activity log)

```json
{
  "id": "tch_2026_001",
  "clientId": "cli_2026_001",
  "projectId": "prj_2026_001",
  "createdAt": "2026-05-06T14:30:00Z",

  "date": "2026-05-06",
  "type": "text",
  "note": "Texted Sarah re: logo revisions, she'll review tonight"
}
```

**Notes:**
- `projectId` nullable — touches can be client-level (general check-in) or project-specific.
- `type` enum: `call`, `email`, `text`, `meeting`, `message`, `other`
- This is the high-frequency capture target. Add-touch should be 2 taps from anywhere.

---

## Settings

```json
{
  "businessName": "Deftwebmaster",
  "currency": "USD",
  "defaultQuoteExpirationDays": 30,
  "referralSources": ["Google", "Referral", "Facebook", "Walk-in", "Past client"]
}
```

`referralSources` is a remembered list — you type it once, it autocompletes after.

---

## ID strategy

Format: `{prefix}_{year}_{sequence}`
- `cli_` clients
- `prj_` projects
- `quo_` quotes
- `tch_` touches

Sequence is per-prefix, per-year, zero-padded to 3 digits. Resets each Jan 1.
Human-readable, sortable, no collision risk for solo use.
Future-portable if you ever do want a server.

---

## What this enables (derived views, no extra data)

- Outstanding balance: sum of `(invoicedAmount - paidAmount)` across non-archived projects
- Quoted-but-not-accepted: sum of `total` where status = "sent"
- This month invoiced/paid: filter projects by date, sum amounts
- Quote close rate by source: join quotes → clients, group by `referralSource`
- 90-day revenue: filter touches/projects by `paidAmount` changes in window
- Domain expirations in next 60 days: filter clients by `webInfo.domainExpiration`

---

## Open questions before I build

1. **Domain expiration alerts** — worth a dashboard widget? I'd say yes, this is high-leverage.
2. **Tax / fees on quotes** — do you want a tax line, or is "total" always all-in?
3. **Multiple emails/phones per client** — needed, or is one enough?
4. **Project archival** — auto-archive after X days post-paid, or manual only?
