export interface CountryProfile {
  code: 'CN' | 'VN' | 'IN';
  name: string;
  flag: string;
  /** Standard Most Favored Nation duty rate, % of customs (FOB) value */
  mfnRate: number;
  /** Section 301 (China) or reciprocal/IEEPA trade-action tariff, % of FOB value */
  additionalTariffRate: number;
  additionalTariffLabel: string;
  /** Risk-adjusted cost of forced-labor compliance (UFLPA-style detention/rerouting exposure), % of FOB value */
  forcedLaborRiskRate: number;
  /** Freight, insurance & inbound logistics, % of FOB value */
  freightRate: number;
  leadTimeDaysMin: number;
  leadTimeDaysMax: number;
  moqUnits: number;
  risks: string[];
  notes: string;
}

export interface CalculatedResult extends CountryProfile {
  fobCost: number;
  mfnAmount: number;
  additionalTariffAmount: number;
  forcedLaborAmount: number;
  totalDutyAmount: number;
  totalDutyRate: number;
  freightAmount: number;
  landedCost: number;
  grossProfit: number;
  marginPct: number;
  meetsTarget: boolean;
  rank: number;
}
