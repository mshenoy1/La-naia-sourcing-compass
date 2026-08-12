import { CENSUS_COUNTRY_CODES } from './tariffData';

/**
 * Real declared US import cost, sourced from the Census Bureau International
 * Trade API (api.census.gov/data/timeseries/intltrade/imports/hs) — actual
 * US Customs import statistics, not a heuristic. This is an AGGREGATE
 * average (total declared customs value / total quantity) across all US
 * imports under a given HTS code from a given country over a trailing
 * multi-month window — the government does not publish per-shipment
 * declared values, so this is the real, population-wide average rather than
 * a sample of individual shipments.
 */
export interface TradeDataSuccess {
  ok: true;
  avgUnitValueUsd: number;
  htsCodeUsed: string;
  precision: 'HS10' | 'HS6';
  monthsUsed: string[];
  totalPieces: number;
  totalValueUsd: number;
  unit: string;
  commodityDescription?: string;
}

export interface TradeDataFailure {
  ok: false;
  reason: string;
  /** True when the failure is specifically an invalid/missing API key, so the UI can prompt for a new one. */
  keyInvalid?: boolean;
}

export type TradeDataResult = TradeDataSuccess | TradeDataFailure;

const STORAGE_KEY = 'sourcingCompass.censusApiKey';

export function getStoredCensusApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setStoredCensusApiKey(key: string): void {
  try {
    if (key.trim()) localStorage.setItem(STORAGE_KEY, key.trim());
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable (private browsing, etc.) — silently no-op
  }
}

/** Pieces represented by one reported unit of quantity. Weight/volume units are deliberately omitted. */
const COUNTABLE_UNITS: Record<string, number> = {
  NO: 1, // number of units
  DOZ: 12, // dozen
  PRS: 1, // pair (the pair is the sellable unit)
  GRO: 144, // gross
};

const FETCH_TIMEOUT_MS = 12000;
const MAX_LOOKBACK_MONTHS = 12;
const BATCH_MONTHS = 6; // fetched in parallel per attempt
const START_OFFSET_MONTHS = 2; // Census import data typically lags ~2 months

const cache = new Map<string, Promise<TradeDataResult>>();

function recentMonths(count: number, startOffsetMonths: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - startOffsetMonths - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

function buildUrl(params: Record<string, string>, apiKey: string): string {
  const usp = new URLSearchParams({ ...params, key: apiKey });
  return `https://api.census.gov/data/timeseries/intltrade/imports/hs?${usp.toString()}`;
}

/**
 * api.census.gov does not send CORS headers, so a direct browser fetch is
 * blocked. Route through the same public CORS proxy used for product-page
 * fetching (see productFetch.ts).
 */
async function fetchViaProxyOnce(url: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxied, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The free public CORS proxy is noticeably flaky in practice (observed
 * intermittent 500s, 502s, 520/522s, 408s and timeouts unrelated to Census
 * itself — often clearing up within a few seconds). Retry several times
 * with a short backoff before treating a request as failed.
 */
async function fetchViaProxy(url: string, timeoutMs: number, attempts = 3): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) await sleep(600 * attempt);
    try {
      return await fetchViaProxyOnce(url, timeoutMs);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

/**
 * A missing/invalid API key makes api.census.gov redirect to an HTML error
 * page (invalid_key.html / missing_key.html) rather than return JSON.
 * Successful responses always start with `[` (a JSON array).
 */
function isErrorPage(text: string): boolean {
  return text.trimStart().startsWith('<');
}

/**
 * One lightweight probe call against a broad, virtually-guaranteed-nonempty
 * commodity chapter, used to fail fast on a bad key instead of burning
 * through dozens of per-HTS-code, per-country, per-month requests first.
 */
export async function validateCensusApiKey(
  apiKey: string,
): Promise<{ valid: boolean; reason?: string; keyInvalid?: boolean }> {
  if (!apiKey.trim()) return { valid: false, reason: 'No API key provided.', keyInvalid: true };
  const [month] = recentMonths(1, START_OFFSET_MONTHS);
  const url = buildUrl({ get: 'GEN_VAL_MO', COMM_LVL: 'HS2', I_COMMODITY: '61', time: month }, apiKey);
  try {
    const text = await fetchViaProxy(url, FETCH_TIMEOUT_MS);
    if (isErrorPage(text)) {
      return { valid: false, reason: 'Census rejected this API key as invalid.', keyInvalid: true };
    }
    JSON.parse(text);
    return { valid: true };
  } catch {
    return {
      valid: false,
      keyInvalid: false,
      reason:
        'The free CORS proxy this app relies on is having trouble reaching Census right now (it\'s often intermittent — retried 3 times already). Your key is likely fine — try "Look up" again in a moment.',
    };
  }
}

interface MonthAccumulation {
  totalValue: number;
  totalQty: number;
  unit: string | null;
  description: string | undefined;
  monthsUsed: string[];
}

/**
 * Parses a Census API response body (JSON array-of-arrays, header row
 * first) and folds it into a running accumulation. Malformed/empty
 * responses are treated as "no data this month" rather than an error, since
 * that's the normal case for months with zero recorded imports.
 */
function accumulateMonth(text: string, month: string, acc: MonthAccumulation): void {
  if (isErrorPage(text)) return;
  let rows: unknown;
  try {
    rows = JSON.parse(text);
  } catch {
    return;
  }
  if (!Array.isArray(rows) || rows.length < 2) return;

  const header = rows[0] as string[];
  const idxVal = header.indexOf('GEN_VAL_MO');
  const idxQty = header.indexOf('GEN_QY1_MO');
  const idxUnit = header.indexOf('UNIT_QY1');
  const idxDesc = header.indexOf('I_COMMODITY_SDESC');
  if (idxVal === -1 || idxQty === -1 || idxUnit === -1) return;

  let addedThisMonth = false;
  for (const row of rows.slice(1) as string[][]) {
    const val = parseFloat(row[idxVal]);
    const qty = parseFloat(row[idxQty]);
    const unit = row[idxUnit];
    if (!isFinite(val) || !isFinite(qty) || qty <= 0) continue;
    acc.totalValue += val;
    acc.totalQty += qty;
    acc.unit = acc.unit ?? unit;
    acc.description = acc.description ?? (idxDesc !== -1 ? row[idxDesc] : undefined);
    addedThisMonth = true;
  }
  if (addedThisMonth) acc.monthsUsed.push(month);
}

async function fetchMonthsBatch(
  code: string,
  level: 'HS10' | 'HS6',
  ctyCode: string,
  apiKey: string,
  months: string[],
  acc: MonthAccumulation,
): Promise<void> {
  await Promise.all(
    months.map(async (month) => {
      const url = buildUrl(
        {
          get: 'I_COMMODITY_SDESC,GEN_VAL_MO,GEN_QY1_MO,UNIT_QY1',
          COMM_LVL: level,
          I_COMMODITY: code,
          CTY_CODE: ctyCode,
          time: month,
        },
        apiKey,
      );
      try {
        const text = await fetchViaProxy(url, FETCH_TIMEOUT_MS);
        accumulateMonth(text, month, acc);
      } catch {
        // network error for this month — skip, other months in the batch still count
      }
    }),
  );
}

async function lookupAtPrecision(
  code: string,
  level: 'HS10' | 'HS6',
  ctyCode: string,
  apiKey: string,
): Promise<TradeDataSuccess | null> {
  const acc: MonthAccumulation = { totalValue: 0, totalQty: 0, unit: null, description: undefined, monthsUsed: [] };
  const allMonths = recentMonths(MAX_LOOKBACK_MONTHS, START_OFFSET_MONTHS);

  // Fetch months in parallel batches (not one sequential walk) so wall-clock
  // latency stays close to a single round-trip rather than scaling with the
  // number of months checked.
  await fetchMonthsBatch(code, level, ctyCode, apiKey, allMonths.slice(0, BATCH_MONTHS), acc);
  if (acc.totalQty <= 0) {
    const remaining = allMonths.slice(BATCH_MONTHS, MAX_LOOKBACK_MONTHS);
    if (remaining.length > 0) await fetchMonthsBatch(code, level, ctyCode, apiKey, remaining, acc);
  }

  if (acc.totalQty <= 0 || !acc.unit) return null;

  const piecesPerUnit = COUNTABLE_UNITS[acc.unit];
  if (!piecesPerUnit) {
    // Reported by weight/volume (e.g. KG) — can't derive a per-piece cost from this.
    return null;
  }

  const totalPieces = acc.totalQty * piecesPerUnit;
  return {
    ok: true,
    avgUnitValueUsd: acc.totalValue / totalPieces,
    htsCodeUsed: code,
    precision: level,
    monthsUsed: acc.monthsUsed,
    totalPieces,
    totalValueUsd: acc.totalValue,
    unit: acc.unit,
    commodityDescription: acc.description,
  };
}

async function fetchAverageDeclaredUnitValueUncached(
  htsCode: string,
  countryCode: string,
  apiKey: string,
): Promise<TradeDataResult> {
  if (!apiKey.trim()) {
    return { ok: false, reason: 'No Census API key configured.', keyInvalid: true };
  }
  const ctyCode = CENSUS_COUNTRY_CODES[countryCode];
  if (!ctyCode) {
    return { ok: false, reason: `No Census country code mapping for ${countryCode}.` };
  }
  const digitsOnly = htsCode.replace(/\D/g, '');
  if (digitsOnly.length < 6) {
    return { ok: false, reason: 'HTS code is too short to look up (need at least 6 digits).' };
  }
  const hs10 = digitsOnly.padEnd(10, '0').slice(0, 10);
  const hs6 = digitsOnly.slice(0, 6);

  const hs10Result = await lookupAtPrecision(hs10, 'HS10', ctyCode, apiKey);
  if (hs10Result) return hs10Result;

  const hs6Result = await lookupAtPrecision(hs6, 'HS6', ctyCode, apiKey);
  if (hs6Result) return hs6Result;

  return {
    ok: false,
    reason:
      'No usable US import statistics found for this HTS classification and country in the past 12 months (either no recorded imports, or this HTS code is reported by weight/volume rather than piece count).',
  };
}

/** Cached by (HTS code, country, key) so repeated calculations in one session don't re-fetch. */
function fetchAverageDeclaredUnitValue(
  htsCode: string,
  countryCode: string,
  apiKey: string,
): Promise<TradeDataResult> {
  const cacheKey = `${htsCode}|${countryCode}|${apiKey}`;
  let pending = cache.get(cacheKey);
  if (!pending) {
    pending = fetchAverageDeclaredUnitValueUncached(htsCode, countryCode, apiKey);
    cache.set(cacheKey, pending);
  }
  return pending;
}

/**
 * Validates the key once (fast probe) before fanning out to all countries —
 * a bad key would otherwise silently fail dozens of times over, one per
 * country/month/precision combination, instead of surfacing one clear error.
 */
export async function fetchAverageDeclaredUnitValuesForCountries(
  htsCode: string,
  countryCodes: string[],
  apiKey: string,
): Promise<Record<string, TradeDataResult>> {
  const validation = await validateCensusApiKey(apiKey);
  if (!validation.valid) {
    const failure: TradeDataFailure = {
      ok: false,
      reason: validation.reason ?? 'Invalid Census API key.',
      keyInvalid: validation.keyInvalid ?? true,
    };
    return Object.fromEntries(countryCodes.map((cc) => [cc, failure]));
  }

  const entries = await Promise.all(
    countryCodes.map(async (cc) => [cc, await fetchAverageDeclaredUnitValue(htsCode, cc, apiKey)] as const),
  );
  return Object.fromEntries(entries);
}
