import type { FetchedProduct } from './types';

export type ProductFetchResult =
  | { ok: true; data: FetchedProduct }
  | { ok: false; error: string };

const FETCH_TIMEOUT_MS = 12000;

/**
 * Browsers block cross-origin reads of most retail sites by default (no
 * permissive CORS headers), so a direct fetch() often fails for arbitrary
 * product URLs. We try direct first, then fall back to a public read-only
 * CORS proxy that mirrors the raw HTML with an open CORS header. If both
 * fail, the caller should offer a manual-entry fallback.
 */
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal, redirect: 'follow' });
  } finally {
    clearTimeout(timer);
  }
}

function getMeta(doc: Document, attr: 'property' | 'name', key: string): string | undefined {
  const el = doc.querySelector(`meta[${attr}="${key}"]`);
  return el?.getAttribute('content')?.trim() || undefined;
}

function parsePrice(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const cleaned = raw.replace(/[^0-9.]/g, '');
  const value = parseFloat(cleaned);
  return isNaN(value) ? undefined : value;
}

function extractJsonLdProduct(doc: Document): Partial<FetchedProduct> {
  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script.textContent || '');
      const candidates = Array.isArray(parsed) ? parsed : [parsed, ...(parsed['@graph'] || [])];
      for (const node of candidates) {
        if (!node || typeof node !== 'object') continue;
        const type = node['@type'];
        const isProduct = type === 'Product' || (Array.isArray(type) && type.includes('Product'));
        if (!isProduct) continue;

        const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
        return {
          title: typeof node.name === 'string' ? node.name : undefined,
          description: typeof node.description === 'string' ? node.description : undefined,
          imageUrl: typeof node.image === 'string' ? node.image : Array.isArray(node.image) ? node.image[0] : undefined,
          price: parsePrice(offers?.price?.toString()),
          currency: offers?.priceCurrency,
        };
      }
    } catch {
      // ignore malformed JSON-LD blocks
    }
  }
  return {};
}

function parseHtml(html: string): FetchedProduct {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const jsonLd = extractJsonLdProduct(doc);

  const title =
    jsonLd.title ||
    getMeta(doc, 'property', 'og:title') ||
    getMeta(doc, 'name', 'twitter:title') ||
    doc.querySelector('title')?.textContent?.trim();

  const description =
    jsonLd.description ||
    getMeta(doc, 'property', 'og:description') ||
    getMeta(doc, 'name', 'description') ||
    getMeta(doc, 'name', 'twitter:description');

  const imageUrl = jsonLd.imageUrl || getMeta(doc, 'property', 'og:image') || getMeta(doc, 'name', 'twitter:image');

  const price =
    jsonLd.price ??
    parsePrice(getMeta(doc, 'property', 'og:price:amount')) ??
    parsePrice(getMeta(doc, 'property', 'product:price:amount')) ??
    parsePrice(getMeta(doc, 'name', 'twitter:data1'));

  const currency =
    jsonLd.currency ||
    getMeta(doc, 'property', 'og:price:currency') ||
    getMeta(doc, 'property', 'product:price:currency') ||
    'USD';

  const siteName = getMeta(doc, 'property', 'og:site_name');

  return { title, description, imageUrl, price, currency, siteName };
}

function isUsableResult(data: FetchedProduct): boolean {
  return Boolean(data.title && data.title.length > 1);
}

export async function fetchProductDetails(rawUrl: string): Promise<ProductFetchResult> {
  let url: URL;
  try {
    url = new URL(rawUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('bad protocol');
  } catch {
    return { ok: false, error: 'Enter a valid product URL, starting with http:// or https://.' };
  }

  const attempts: Array<() => Promise<Response>> = [
    () => fetchWithTimeout(url.toString(), FETCH_TIMEOUT_MS),
    () => fetchWithTimeout(`https://api.allorigins.win/raw?url=${encodeURIComponent(url.toString())}`, FETCH_TIMEOUT_MS),
  ];

  let lastError = 'This site blocks automated fetching from the browser.';

  for (const attempt of attempts) {
    try {
      const res = await attempt();
      if (!res.ok) {
        lastError = `Site responded with HTTP ${res.status}.`;
        continue;
      }
      const html = await res.text();
      const data = parseHtml(html);
      if (isUsableResult(data)) {
        return { ok: true, data };
      }
      lastError = 'Fetched the page but could not find product details in its metadata.';
    } catch (err) {
      lastError = err instanceof Error && err.name === 'AbortError' ? 'Request timed out.' : 'Network/CORS error fetching this URL.';
    }
  }

  return { ok: false, error: `${lastError} Enter the product details manually below to continue.` };
}
