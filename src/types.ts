export type ProductCategoryId =
  | 'apparel'
  | 'footwear'
  | 'electronics'
  | 'furniture'
  | 'toys_games'
  | 'housewares_metal'
  | 'steel_aluminum_industrial'
  | 'bags_luggage_leather'
  | 'plastics_general'
  | 'general_other';

export interface CategoryProfile {
  id: ProductCategoryId;
  label: string;
  htsChapter: string;
  representativeHtsCode: string;
  htsDescription: string;
  /** Baseline MFN (Column 1 general) duty rate, % of customs (FOB) value */
  mfnRate: number;
  /** Whether Section 232 (steel/aluminum/copper derivative) tariffs can apply */
  section232: boolean;
  section232Rate: number;
  weightClass: 'light' | 'medium' | 'heavy';
  /** Typical first-cost (FOB factory cost) as % of retail price for this category */
  defaultFobCostRatio: number;
  keywords: string[];
}

export interface HtsClassification {
  category: CategoryProfile;
  confidence: number;
  matchedKeywords: string[];
}

export interface AdCvdRule {
  category: ProductCategoryId;
  countryCode: string;
  rate: number;
  note: string;
}

export interface CountryProfile {
  code: string;
  name: string;
  flag: string;
  /** Section 301 (China-only trade action), % of FOB value */
  section301Rate: number;
  section301Label: string;
  /** Reciprocal / IEEPA country-level trade tariff, % of FOB value */
  reciprocalTariffRate: number;
  reciprocalTariffLabel: string;
  /** Whether this country is exempt from Section 232 steel/aluminum tariffs (e.g. negotiated quota) */
  section232Exempt: boolean;
  section232ExemptNote?: string;
  /** Risk-adjusted cost of forced-labor compliance (UFLPA-style detention/rerouting exposure), % of FOB value */
  forcedLaborRiskRate: number;
  /** Base ocean/air freight & inbound logistics, % of FOB value, before weight-class multiplier */
  freightBaseRate: number;
  leadTimeDaysMin: number;
  leadTimeDaysMax: number;
  moqUnits: number;
  ftaNote?: string;
  risks: string[];
  notes: string;
}

export interface FetchedProduct {
  title?: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  siteName?: string;
}

export type FetchStatus = 'idle' | 'loading' | 'success' | 'manual';

export interface TariffLineItem {
  label: string;
  rate: number;
  amount: number;
  note?: string;
}

export interface CalculatedResult extends CountryProfile {
  fobCost: number;
  mfnAmount: number;
  section301Amount: number;
  section232Amount: number;
  adCvdAmount: number;
  adCvdRate: number;
  adCvdNote: string;
  reciprocalTariffAmount: number;
  forcedLaborAmount: number;
  totalTariffAmount: number;
  totalTariffRate: number;
  freightRate: number;
  freightAmount: number;
  landedCost: number;
  grossProfit: number;
  marginPct: number;
  meetsTarget: boolean;
  rank: number;
  tariffLines: TariffLineItem[];
}
