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

/**
 * Section 301 Forced-Labor Prevention Tariff (2026), with its documented
 * exemptions/interactions applied in order:
 * 1. FTA-qualifying goods (assumed compliant) are exempt.
 * 2. Goods already subject to Section 232 are exempt (avoids double-stacking).
 * 3. Taiwan: combined MFN + this tariff is capped rather than additive.
 * 4. Otherwise, the country's standard tier rate (10% or 12.5%) applies.
 */
function getForcedLaborTariffRate(
  country: CountryProfile,
  section232Applicable: boolean,
  effectiveMfnRate: number,
): { rate: number; note?: string } {
  if (country.ftaDutyFree) {
    return { rate: 0, note: 'FTA-qualifying goods assumed exempt' };
  }
  if (section232Applicable) {
    return { rate: 0, note: 'Exempt — already subject to Section 232 national-security tariff' };
  }
  if (country.combinedMfnCapRate != null) {
    const capped = Math.max(0, country.combinedMfnCapRate - effectiveMfnRate);
    return { rate: capped, note: `Combined MFN + forced-labor tariff capped at ${country.combinedMfnCapRate}%` };
  }
  return { rate: country.forcedLaborTariffRate };
}

export function calculateLandedCosts(
  firstCost: number,
  category: CategoryProfile,
  marginTarget: number,
  retailPrice?: number,
): CalculatedResult[] {
  const results = COUNTRY_PROFILES.map((country) => {
    const effectiveMfnRate = country.ftaDutyFree ? 0 : category.mfnRate;
    const mfnAmount = firstCost * (effectiveMfnRate / 100);

    const section301Amount = firstCost * (country.section301Rate / 100);

    const section232Applicable = category.section232 && !country.section232Exempt;
    const section232Amount = section232Applicable ? firstCost * (category.section232Rate / 100) : 0;

    const { rate: adCvdRate, note: adCvdNote } = getAdCvd(category, country);
    const adCvdAmount = firstCost * (adCvdRate / 100);

    const { rate: forcedLaborTariffRate, note: forcedLaborTariffNote } = getForcedLaborTariffRate(
      country,
      section232Applicable,
      effectiveMfnRate,
    );
    const forcedLaborTariffAmount = firstCost * (forcedLaborTariffRate / 100);

    const forcedLaborRiskRate = getForcedLaborRiskRate(category, country);
    const forcedLaborRiskAmount = firstCost * (forcedLaborRiskRate / 100);

    const freightRate = country.freightBaseRate * WEIGHT_CLASS_FREIGHT_MULTIPLIER[category.weightClass];
    const freightAmount = firstCost * (freightRate / 100);

    const totalTariffAmount =
      mfnAmount + section301Amount + section232Amount + adCvdAmount + forcedLaborTariffAmount + forcedLaborRiskAmount;
    const totalTariffRate =
      effectiveMfnRate +
      country.section301Rate +
      (section232Applicable ? category.section232Rate : 0) +
      adCvdRate +
      forcedLaborTariffRate +
      forcedLaborRiskRate;

    const landedCost = firstCost + totalTariffAmount + freightAmount;
    const grossProfit = retailPrice ? retailPrice - landedCost : 0;
    const marginPct = retailPrice && retailPrice > 0 ? (grossProfit / retailPrice) * 100 : 0;

    const tariffLines: TariffLineItem[] = [
      {
        label: 'MFN duty',
        rate: effectiveMfnRate,
        amount: mfnAmount,
        note: country.ftaDutyFree ? `Duty-free assumed under FTA (${country.name} rules-of-origin compliance assumed)` : undefined,
      },
      {
        label: country.section301Label,
        rate: country.section301Rate,
        amount: section301Amount,
        note: country.section301Rate === 0 ? 'Not applicable (China-origin only)' : undefined,
      },
      {
        label: 'Section 232 (steel/aluminum/copper)',
        rate: section232Applicable ? category.section232Rate : 0,
        amount: section232Amount,
        note: !category.section232
          ? 'Not applicable to this product category'
          : country.section232Exempt
            ? country.section232ExemptNote
            : undefined,
      },
      { label: 'Antidumping / Countervailing (AD/CVD)', rate: adCvdRate, amount: adCvdAmount, note: adCvdNote },
      {
        label: country.forcedLaborTariffLabel,
        rate: forcedLaborTariffRate,
        amount: forcedLaborTariffAmount,
        note: forcedLaborTariffNote,
      },
      {
        label: 'UFLPA compliance risk (detention/rerouting)',
        rate: forcedLaborRiskRate,
        amount: forcedLaborRiskAmount,
        note: 'Risk-adjusted expected cost of shipment detention/rerouting exposure, not a filed duty',
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
      forcedLaborTariffAmount,
      forcedLaborRiskAmount,
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
