# La Naia Sourcing Compass

Paste a product URL and get back the **3 lowest landed-cost sourcing locations** —
factory first cost, full tariff stack, and freight — ranked out of a 9-country panel.

## How it works

1. **Fetch product details.** Enter a product page URL and the app tries to pull the
   title, description, image and listed price straight from the page (Open Graph tags,
   `product:price` meta, and JSON-LD `Product` schema). Most retail sites block
   cross-origin scraping from a browser (CORS), so if the fetch fails or times out the
   app falls back to a manual-entry form pre-populated with whatever it could parse —
   the rest of the flow works identically either way.
2. **HTS classification.** A keyword classifier matches the product title/description
   against 10 category profiles (apparel, footwear, electronics, furniture, toys,
   metal housewares, steel/aluminum & industrial goods, bags & leather, plastics, and a
   general fallback) and assigns a representative HTS heading, chapter, and duty
   profile. You can override the detected category if it's wrong.
3. **First cost (should-cost).** First (FOB) cost is estimated as a category-typical
   percentage of the retail/listing price (e.g. ~22% for apparel, ~35% for
   electronics, ~45% for steel/industrial goods), adjustable under "Advanced
   assumptions."
4. **Full tariff stack per country**, reflecting the US import regime as of August
   2026 (see "Legal backdrop" below). For each of 9 sourcing countries the app
   computes:
   - **MFN duty** — baseline Column 1 rate for the HTS category (0% for
     USMCA-qualifying goods from Mexico, assumed compliant)
   - **Section 301 (2018 China Tariff, List 1–4)** — the original China-specific
     trade-action tariff, still in effect and unrelated to IEEPA
   - **Section 232** — steel/aluminum/copper tariff (50% on primary metal, 25% on
     derivative/finished articles), applied when the category is metals-based and the
     country isn't flagged exempt (e.g. Mexico's USMCA quota arrangement)
   - **Antidumping / Countervailing (AD/CVD)** — illustrative category+country
     exposure flags for known trade-remedy-heavy pairings
   - **Section 301 Forced-Labor Prevention Tariff (2026)** — the permanent two-tier
     duty (10% / 12.5%) that replaced the invalidated IEEPA "reciprocal" tariffs;
     exempt for goods already covered by Section 232, exempt for FTA-qualifying
     goods, and capped in combination with MFN duty for Taiwan
   - **UFLPA compliance risk** — risk-adjusted expected cost of shipment
     detention/rerouting, not a filed duty
   - **Freight & logistics** — country base rate scaled by the category's weight class
     (light/medium/heavy)
5. **Rank & recommend.** Countries are sorted by landed cost per unit. The top 3 are
   shown as full detail cards (cost breakdown, margin analysis, MOQ, lead time, key
   risks); the remaining countries are available in a collapsible ranking table.

Everything runs client-side — no backend, no stored data. The only network calls are
the optional product-page fetch (direct, with a public CORS-proxy fallback).

## Legal backdrop (as of August 2026)

The Supreme Court struck down the IEEPA "reciprocal" tariffs on February 20, 2026.
The administration's stopgap Section 122 global tariff was itself invalidated by the
Court of International Trade and expired July 24, 2026. The permanent structure now
in place — modeled here — is a two-tier **Section 301 Forced-Labor Prevention
Tariff**: 10% for economies USTR recognizes as having a forced-labor import
prohibition (India, Bangladesh, Indonesia, Cambodia, Mexico, Taiwan), 12.5% for the
rest (China, Vietnam, Turkey in this app's country panel). This sits alongside duties
that were never IEEPA-based and are unaffected by the ruling: standard MFN duty, the
original 2018 Section 301 China List 1–4 action, Section 232
(steel/aluminum/copper), and AD/CVD orders. Goods already subject to Section 232 are
exempt from the new forced-labor tariff to avoid double-stacking, and Taiwan gets a
special rule capping its combined MFN + forced-labor tariff at 10% rather than
stacking. See `src/tariffData.ts` for sourcing and per-country detail.

## Getting started

```bash
npm install
npm run dev
```

To auto-populate the "Real Import Cost Data" panel with your own free
[Census API key](https://api.census.gov/data/key_signup.html) instead of
pasting it in every session, copy `.env.local.example` to `.env.local` and
fill in `VITE_CENSUS_API_KEY`. That file is git-ignored — the key never gets
committed. You can still remove/replace the key from within the app itself
at any time.

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check and build for production
- `npm run lint` — run oxlint
- `npm run preview` — preview the production build

## Sourcing countries covered

China, Vietnam, India, Bangladesh, Indonesia, Cambodia, Mexico, Taiwan, Turkey —
see `src/tariffData.ts` for the full per-country tariff, freight, MOQ, lead-time and
risk profile, and `src/calculations.ts` for how the tariff stack is combined into
landed cost.

## Disclaimer

HTS classification is a keyword-based heuristic, and all duty, freight, MOQ, and
AD/CVD figures are illustrative, blended reference estimates for general merchandise
as of August 2026 — **not** an official customs ruling. Actual duty depends on the
exact 10-digit HTS classification, country-of-origin rules, and any active
trade-remedy orders. Verify with a licensed customs broker, a CBP binding ruling
(CROSS), and the current AD/CVD order list (access.trade.gov) before making sourcing
decisions.
