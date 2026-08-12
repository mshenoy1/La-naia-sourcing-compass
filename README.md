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
4. **Full tariff stack per country.** For each of 9 sourcing countries the app computes:
   - **MFN duty** — baseline Column 1 rate for the HTS category
   - **Section 301** — China-specific trade-action tariff
   - **Section 232** — steel/aluminum/derivative-product tariff, applied when the
     category is metals-based and the country isn't flagged exempt (e.g. Mexico's
     USMCA quota arrangement)
   - **Antidumping / Countervailing (AD/CVD)** — illustrative category+country
     exposure flags for known trade-remedy-heavy pairings
   - **Reciprocal / IEEPA tariff** — country-level trade tariff
   - **Forced-labor compliance risk** — risk-adjusted expected cost of UFLPA-style
     detention/rerouting
   - **Freight & logistics** — country base rate scaled by the category's weight class
     (light/medium/heavy)
5. **Rank & recommend.** Countries are sorted by landed cost per unit. The top 3 are
   shown as full detail cards (cost breakdown, margin analysis, MOQ, lead time, key
   risks); the remaining countries are available in a collapsible ranking table.

Everything runs client-side — no backend, no stored data. The only network calls are
the optional product-page fetch (direct, with a public CORS-proxy fallback).

## Getting started

```bash
npm install
npm run dev
```

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
