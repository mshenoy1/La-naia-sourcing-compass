import { COUNTRY_PROFILES } from './tariffData';
import type { CalculatedResult } from './types';

export function calculateLandedCosts(
  retailPrice: number,
  fobCostRatio: number,
  marginTarget: number,
): CalculatedResult[] {
  const fobCost = retailPrice * (fobCostRatio / 100);

  const results = COUNTRY_PROFILES.map((profile) => {
    const mfnAmount = fobCost * (profile.mfnRate / 100);
    const additionalTariffAmount = fobCost * (profile.additionalTariffRate / 100);
    const forcedLaborAmount = fobCost * (profile.forcedLaborRiskRate / 100);
    const totalDutyRate = profile.mfnRate + profile.additionalTariffRate + profile.forcedLaborRiskRate;
    const totalDutyAmount = mfnAmount + additionalTariffAmount + forcedLaborAmount;
    const freightAmount = fobCost * (profile.freightRate / 100);
    const landedCost = fobCost + totalDutyAmount + freightAmount;
    const grossProfit = retailPrice - landedCost;
    const marginPct = retailPrice > 0 ? (grossProfit / retailPrice) * 100 : 0;

    return {
      ...profile,
      fobCost,
      mfnAmount,
      additionalTariffAmount,
      forcedLaborAmount,
      totalDutyAmount,
      totalDutyRate,
      freightAmount,
      landedCost,
      grossProfit,
      marginPct,
      meetsTarget: marginPct >= marginTarget,
      rank: 0,
    };
  });

  return results
    .sort((a, b) => a.landedCost - b.landedCost)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}
