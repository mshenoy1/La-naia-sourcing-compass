# La Naia Sourcing Compass

A landed cost calculator for comparing sourcing from **China**, **Vietnam**, and **India**.

Enter a product name and retail price, and the app estimates the landed cost from each
country using illustrative August 2026 reference tariff rates — MFN duty, Section 301 /
reciprocal trade tariffs, and forced-labor compliance risk — along with freight, MOQ, lead
time, and key sourcing risks. Countries are ranked by lowest landed cost, and each is flagged
against a configurable margin target (60% by default).

Everything runs client-side; there are no external API calls.

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

## How the calculation works

Since the form only collects retail price, the factory (FOB) unit cost is estimated as a
percentage of retail price (default 28%, adjustable under "Advanced assumptions"). Country
duty rates are then applied to that FOB cost to get the landed cost:

```
FOB cost      = retail price × FOB cost ratio
Duty          = FOB cost × (MFN rate + additional tariff rate + forced-labor risk rate)
Freight       = FOB cost × freight rate
Landed cost   = FOB cost + Duty + Freight
Margin        = (retail price − landed cost) / retail price
```

Tariff, freight, MOQ, lead time, and risk data per country live in `src/tariffData.ts`.

> **Disclaimer:** Tariff rates are illustrative, blended reference estimates for general
> consumer goods — not official HTS duty rates. Verify with a licensed customs broker or the
> U.S. Harmonized Tariff Schedule before making sourcing decisions.
