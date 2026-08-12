import { AD_CVD_RULES, COUNTRY_PROFILES, DEFAULT_ADCVD_NOTE, WEIGHT_CLASS_FREIGHT_MULTIPLIER } from './tariffData';
import type { CalculatedResult, CategoryProfile, CountryProfile, TariffLineItem } from './types';

function getAdCvd(category: CategoryProfile, country: CountryProfile): { rate: number; note: string } {
  const rule = AD_CVD_RULES.find((r) => r.category === category.id && r.countryCode === country.code);
  return rule ? { rate: rule.rate, note: rule.note } : { rate: 0, note: DEFAULT_ADCVD_NOTE };
}

/** Extra forced-labor compliance risk for cotton/Xinjiang-linked inputs on apparel sourced from China. */
function getForcedLaborRiskRate(category: CategoryProfile, country: CountryProfile): number {
  if (country.code === 'CN' && category.id === 'apparel') return country.forcedLaborRiskRate + 2;
  return country.forcedLaborRiskRate;
}

export function calculateLandedCosts(
  firstCost: number,
  category: CategoryProfile,
  marginTarget: number,
  retailPrice?: number,
): CalculatedResult[] {
  const results = COUNTRY_PROFILES.map((country) => {
    const mfnAmount = firstCost * (category.mfnRate / 100);

    const section301Amount = firstCost * (country.section301Rate / 100);

    const section232Applicable = category.section232 && !country.section232Exempt;
    const section232Amount = section232Applicable ? firstCost * (category.section232Rate / 100) : 0;

    const { rate: adCvdRate, note: adCvdNote } = getAdCvd(category, country);
    const adCvdAmount = firstCost * (adCvdRate / 100);

    const reciprocalTariffAmount = firstCost * (country.reciprocalTariffRate / 100);

    const forcedLaborRiskRate = getForcedLaborRiskRate(category, country);
    const forcedLaborAmount = firstCost * (forcedLaborRiskRate / 100);

    const freightRate = country.freightBaseRate * WEIGHT_CLASS_FREIGHT_MULTIPLIER[category.weightClass];
    const freightAmount = firstCost * (freightRate / 100);

    const totalTariffAmount =
      mfnAmount + section301Amount + section232Amount + adCvdAmount + reciprocalTariffAmount + forcedLaborAmount;
    const totalTariffRate =
      category.mfnRate +
      country.section301Rate +
      (section232Applicable ? category.section232Rate : 0) +
      adCvdRate +
      country.reciprocalTariffRate +
      forcedLaborRiskRate;

    const landedCost = firstCost + totalTariffAmount + freightAmount;
    const grossProfit = retailPrice ? retailPrice - landedCost : 0;
    const marginPct = retailPrice && retailPrice > 0 ? (grossProfit / retailPrice) * 100 : 0;

    const tariffLines: TariffLineItem[] = [
      { label: 'MFN duty', rate: category.mfnRate, amount: mfnAmount },
      {
        label: country.section301Label,
        rate: country.section301Rate,
        amount: section301Amount,
        note: country.section301Rate === 0 ? 'Not applicable (China-origin only)' : undefined,
      },
      {
        label: 'Section 232 (steel/aluminum)',
        rate: section232Applicable ? category.section232Rate : 0,
        amount: section232Amount,
        note: !category.section232
          ? 'Not applicable to this product category'
          : country.section232Exempt
            ? country.section232ExemptNote
            : undefined,
      },
      { label: 'Antidumping / Countervailing (AD/CVD)', rate: adCvdRate, amount: adCvdAmount, note: adCvdNote },
      { label: country.reciprocalTariffLabel, rate: country.reciprocalTariffRate, amount: reciprocalTariffAmount },
      {
        label: 'Forced-labor compliance risk',
        rate: forcedLaborRiskRate,
        amount: forcedLaborAmount,
        note: 'Risk-adjusted expected cost of UFLPA-style detention/rerouting, not a filed duty',
      },
    ];

    return {
      ...country,
      fobCost: firstCost,
      mfnAmount,
      section301Amount,
      section232Amount,
      adCvdAmount,
      adCvdRate,
      adCvdNote,
      reciprocalTariffAmount,
      forcedLaborAmount,
      totalTariffAmount,
      totalTariffRate,
      freightRate,
      freightAmount,
      landedCost,
      grossProfit,
      marginPct,
      meetsTarget: retailPrice ? marginPct >= marginTarget : false,
      rank: 0,
      tariffLines,
    };
  });

  return results
    .sort((a, b) => a.landedCost - b.landedCost)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}
