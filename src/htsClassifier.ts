import { CATEGORY_PROFILES } from './tariffData';
import type { HtsClassification } from './types';

/**
 * Lightweight keyword-scoring classifier. Matches product title/description
 * text against each category's keyword list and picks the best match. This
 * is a heuristic screening tool, not a formal HTS ruling — always confirm
 * the exact 10-digit classification with a customs broker or CBP binding
 * ruling before filing.
 */
export function classifyProduct(title: string, description: string): HtsClassification {
  const text = `${title} ${description}`.toLowerCase();

  let best: HtsClassification | null = null;

  for (const category of CATEGORY_PROFILES) {
    if (category.keywords.length === 0) continue;

    const matched = category.keywords.filter((kw) => text.includes(kw.toLowerCase()));
    if (matched.length === 0) continue;

    const confidence = Math.min(100, Math.round((matched.length / Math.min(category.keywords.length, 4)) * 100));

    if (!best || matched.length > best.matchedKeywords.length) {
      best = { category, confidence, matchedKeywords: matched };
    }
  }

  if (best) return best;

  const fallback = CATEGORY_PROFILES.find((c) => c.id === 'general_other')!;
  return { category: fallback, confidence: 0, matchedKeywords: [] };
}
