import type { CountryProfile } from './types';

/**
 * Illustrative reference rates as of August 2026. These are representative
 * blended estimates for general consumer/apparel goods — not official HTS
 * duty rates. Actual duty depends on HS code, country-of-origin rules, and
 * any active trade-remedy actions. Verify with a licensed customs broker or
 * the U.S. Harmonized Tariff Schedule before making sourcing decisions.
 */
export const COUNTRY_PROFILES: CountryProfile[] = [
  {
    code: 'CN',
    name: 'China',
    flag: '🇨🇳',
    mfnRate: 3.0,
    additionalTariffRate: 30.0,
    additionalTariffLabel: 'Section 301 & Reciprocal Tariff',
    forcedLaborRiskRate: 4.0,
    freightRate: 6.0,
    leadTimeDaysMin: 30,
    leadTimeDaysMax: 45,
    moqUnits: 500,
    risks: [
      'UFLPA detention risk for cotton, polysilicon & Xinjiang-linked inputs',
      'Ongoing Section 301 / IEEPA tariff volatility',
      'IP protection & factory-audit concerns',
    ],
    notes: 'Deepest manufacturing base and fastest sampling, offset by the highest combined duty stack.',
  },
  {
    code: 'VN',
    name: 'Vietnam',
    flag: '🇻🇳',
    mfnRate: 3.0,
    additionalTariffRate: 20.0,
    additionalTariffLabel: 'Reciprocal / Trade-Deal Tariff',
    forcedLaborRiskRate: 2.0,
    freightRate: 7.0,
    leadTimeDaysMin: 35,
    leadTimeDaysMax: 50,
    moqUnits: 1000,
    risks: [
      'Transshipment scrutiny on goods with Chinese-origin inputs',
      'Factory capacity strain as buyers shift volume from China',
      'Higher MOQs at established tier-1 factories',
    ],
    notes: 'Balanced middle ground — moderate tariffs, growing capacity, but MOQs run higher.',
  },
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    mfnRate: 3.5,
    additionalTariffRate: 15.0,
    additionalTariffLabel: 'Reciprocal / Trade-Deal Tariff',
    forcedLaborRiskRate: 0.5,
    freightRate: 9.0,
    leadTimeDaysMin: 45,
    leadTimeDaysMax: 60,
    moqUnits: 300,
    risks: [
      'Port congestion & inland logistics variability',
      'Quality consistency across smaller/mid-tier factories',
      'Longer lead times versus China or Vietnam',
    ],
    notes: 'Lowest tariff stack and low MOQs, traded off against longer, less predictable lead times.',
  },
];

export const DEFAULT_FOB_COST_RATIO = 28; // FOB unit cost as % of retail price
export const DEFAULT_MARGIN_TARGET = 60; // %
