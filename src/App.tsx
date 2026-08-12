import { useEffect, useMemo, useState } from 'react';
import { calculateLandedCosts } from './calculations';
import {
  fetchAverageDeclaredUnitValuesForCountries,
  getStoredCensusApiKey,
  setStoredCensusApiKey,
  validateCensusApiKey,
  type TradeDataResult,
} from './censusTradeData';
import { classifyProduct } from './htsClassifier';
import { fetchProductDetails } from './productFetch';
import { CATEGORY_PROFILES, COUNTRY_PROFILES, DEFAULT_MARGIN_TARGET } from './tariffData';
import type { FetchStatus, FirstCostSource, ProductCategoryId } from './types';
import './App.css';

const currency = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

function App() {
  const [url, setUrl] = useState('');
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>('idle');
  const [fetchError, setFetchError] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [siteName, setSiteName] = useState<string | undefined>(undefined);
  const [fetchedCurrency, setFetchedCurrency] = useState<string | undefined>(undefined);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceInput, setPriceInput] = useState('');

  const [categoryOverride, setCategoryOverride] = useState<ProductCategoryId | 'auto'>('auto');
  const [fobRatioOverride, setFobRatioOverride] = useState<number | null>(null);
  const [marginTarget, setMarginTarget] = useState(DEFAULT_MARGIN_TARGET);
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [censusApiKeyInput, setCensusApiKeyInput] = useState('');
  const [censusApiKeyStored, setCensusApiKeyStored] = useState('');
  const [useTradeData, setUseTradeData] = useState(true);
  const [tradeDataStatus, setTradeDataStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [tradeDataError, setTradeDataError] = useState('');
  const [tradeDataResults, setTradeDataResults] = useState<Record<string, TradeDataResult> | null>(null);
  const [tradeDataHtsCode, setTradeDataHtsCode] = useState<string | null>(null);
  const [keyValidation, setKeyValidation] = useState<{
    status: 'idle' | 'checking' | 'valid' | 'invalid' | 'unreachable';
    reason?: string;
  }>({
    status: 'idle',
  });

  useEffect(() => {
    setCensusApiKeyStored(getStoredCensusApiKey());
  }, []);

  const detailsVisible = fetchStatus === 'success' || fetchStatus === 'manual';

  const classification = useMemo(() => classifyProduct(title, description), [title, description]);
  const category = useMemo(() => {
    if (categoryOverride === 'auto') return classification.category;
    return CATEGORY_PROFILES.find((c) => c.id === categoryOverride) ?? classification.category;
  }, [categoryOverride, classification]);

  // Reset any manual FOB-ratio override, and any looked-up trade data (now
  // stale for a different HTS code), whenever the effective category changes.
  useEffect(() => {
    setFobRatioOverride(null);
    setTradeDataResults(null);
    setTradeDataStatus('idle');
    setTradeDataHtsCode(null);
  }, [category.id]);

  const fobRatio = fobRatioOverride ?? category.defaultFobCostRatio;
  const retailPrice = parseFloat(priceInput);
  const hasRetailPrice = !isNaN(retailPrice) && retailPrice > 0;
  const firstCost = hasRetailPrice ? retailPrice * (fobRatio / 100) : 0;

  const isValid = detailsVisible && title.trim().length > 0 && hasRetailPrice;

  const firstCostByCountry = useMemo(() => {
    if (!useTradeData || !tradeDataResults || tradeDataHtsCode !== category.representativeHtsCode) return undefined;
    const map: Partial<Record<string, FirstCostSource>> = {};
    for (const [code, result] of Object.entries(tradeDataResults)) {
      if (result.ok) {
        map[code] = {
          amount: result.avgUnitValueUsd,
          source: 'trade_data',
          detail: `Real avg. declared US import cost — HTS ${result.htsCodeUsed} (${result.precision}), ${result.monthsUsed.length} mo. of US Customs data, ${Math.round(result.totalPieces).toLocaleString()} units`,
        };
      }
    }
    return map;
  }, [useTradeData, tradeDataResults, tradeDataHtsCode, category.representativeHtsCode]);

  const results = useMemo(() => {
    if (!isValid) return [];
    return calculateLandedCosts(
      firstCost,
      category,
      marginTarget,
      hasRetailPrice ? retailPrice : undefined,
      firstCostByCountry,
    );
  }, [isValid, firstCost, category, marginTarget, hasRetailPrice, retailPrice, firstCostByCountry]);

  const topThree = results.slice(0, 3);
  const rest = results.slice(3);
  const showResults = submitted && isValid;

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setFetchStatus('loading');
    setFetchError('');
    setSubmitted(false);

    const result = await fetchProductDetails(url.trim());
    if (result.ok) {
      setTitle(result.data.title ?? '');
      setDescription(result.data.description ?? '');
      setImageUrl(result.data.imageUrl);
      setSiteName(result.data.siteName);
      setFetchedCurrency(result.data.currency);
      setPriceInput(result.data.price ? String(result.data.price) : '');
      setCategoryOverride('auto');
      setFetchStatus('success');
    } else {
      setFetchError(result.error);
      setImageUrl(undefined);
      setSiteName(undefined);
      setFetchStatus('manual');
    }
  };

  const handleManualEntry = () => {
    setFetchError('');
    setFetchStatus('manual');
  };

  const handleSaveKey = async () => {
    const trimmed = censusApiKeyInput.trim();
    if (!trimmed) return;
    setStoredCensusApiKey(trimmed);
    setCensusApiKeyStored(trimmed);
    setCensusApiKeyInput('');
    setKeyValidation({ status: 'checking' });
    const result = await validateCensusApiKey(trimmed);
    if (result.valid) {
      setKeyValidation({ status: 'valid' });
    } else {
      setKeyValidation({ status: result.keyInvalid ? 'invalid' : 'unreachable', reason: result.reason });
    }
  };

  const handleClearKey = () => {
    setStoredCensusApiKey('');
    setCensusApiKeyStored('');
    setTradeDataResults(null);
    setTradeDataStatus('idle');
    setTradeDataHtsCode(null);
    setKeyValidation({ status: 'idle' });
  };

  const handleLookupTradeData = async () => {
    setTradeDataStatus('loading');
    setTradeDataError('');
    try {
      const countryCodes = COUNTRY_PROFILES.map((c) => c.code);
      const resultsMap = await fetchAverageDeclaredUnitValuesForCountries(
        category.representativeHtsCode,
        countryCodes,
        censusApiKeyStored,
      );
      setTradeDataResults(resultsMap);
      setTradeDataHtsCode(category.representativeHtsCode);
      setTradeDataStatus('success');
    } catch {
      setTradeDataError('Failed to reach the Census trade data API. Try again.');
      setTradeDataStatus('error');
    }
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="page">
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-mark">🧭</span>
            <div>
              <h1>La Naia Sourcing Compass</h1>
              <p>Paste a product URL → HTS classification → lowest landed-cost sourcing locations</p>
            </div>
          </div>
          <span className="badge">Tariff reference: August 2026</span>
        </div>
      </header>

      <main className="main">
        <section className="panel form-panel">
          <h2>1. Product URL</h2>
          <form onSubmit={handleFetch} className="form">
            <div className="field">
              <label htmlFor="productUrl">Product page URL</label>
              <input
                id="productUrl"
                type="url"
                placeholder="https://www.example.com/products/insulated-water-bottle"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="url-actions">
              <button type="submit" className="submit-btn" disabled={!url.trim() || fetchStatus === 'loading'}>
                {fetchStatus === 'loading' ? 'Fetching…' : 'Fetch Product Details'}
              </button>
              <button type="button" className="link-toggle" onClick={handleManualEntry}>
                Enter details manually instead
              </button>
            </div>
            {fetchStatus === 'manual' && fetchError && <p className="form-error">{fetchError}</p>}
            <p className="hint">
              Many retail sites block automated fetching from a browser (CORS). When that happens, edit the
              fields below by hand — the rest of the analysis works the same way.
            </p>
          </form>
        </section>

        {detailsVisible && (
          <section className="panel form-panel">
            <h2>2. Product Details {fetchStatus === 'success' && <span className="fetched-tag">✓ fetched</span>}</h2>
            <form onSubmit={handleCalculate} className="form">
              <div className="details-layout">
                {imageUrl && (
                  <div className="product-image-wrap">
                    <img src={imageUrl} alt="" className="product-image" onError={() => setImageUrl(undefined)} />
                    {siteName && <span className="site-name">{siteName}</span>}
                  </div>
                )}
                <div className="details-fields">
                  <div className="field">
                    <label htmlFor="productTitle">Product Title</label>
                    <input
                      id="productTitle"
                      type="text"
                      placeholder="e.g. Insulated Steel Water Bottle"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        setSubmitted(false);
                      }}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="productDescription">Description (optional, improves HTS matching)</label>
                    <textarea
                      id="productDescription"
                      rows={2}
                      placeholder="Short product description or key materials"
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        setSubmitted(false);
                      }}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="retailPrice">
                      Retail / listing price {fetchedCurrency && fetchedCurrency !== 'USD' ? `(captured as ${fetchedCurrency}, treated as USD)` : '(USD)'}
                    </label>
                    <div className="input-prefix">
                      <span>$</span>
                      <input
                        id="retailPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="29.99"
                        value={priceInput}
                        onChange={(e) => {
                          setPriceInput(e.target.value);
                          setSubmitted(false);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="classification-card">
                <div className="classification-head">
                  <span className="classification-label">Detected HTS Category</span>
                  {categoryOverride === 'auto' && (
                    <span className={`confidence-pill ${classification.confidence >= 50 ? 'pill-pass' : 'pill-fail'}`}>
                      {classification.confidence}% match confidence
                    </span>
                  )}
                </div>
                <div className="classification-body">
                  <strong>{category.label}</strong>
                  <span className="hts-code">HTS {category.representativeHtsCode} · {category.htsChapter}</span>
                  <span className="hts-desc">{category.htsDescription}</span>
                  {categoryOverride === 'auto' && classification.matchedKeywords.length > 0 && (
                    <span className="matched-kw">Matched: {classification.matchedKeywords.join(', ')}</span>
                  )}
                </div>
                <div className="field category-override">
                  <label htmlFor="categorySelect">Override category (if misclassified)</label>
                  <select
                    id="categorySelect"
                    value={categoryOverride}
                    onChange={(e) => setCategoryOverride(e.target.value as ProductCategoryId | 'auto')}
                  >
                    <option value="auto">Auto-detect from title/description</option>
                    {CATEGORY_PROFILES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="trade-data-card">
                <div className="classification-head">
                  <span className="classification-label">Real Import Cost Data (optional)</span>
                </div>
                {!censusApiKeyStored ? (
                  <div className="trade-data-body">
                    <p className="hint">
                      Look up the real average declared US Customs import cost for HTS {category.representativeHtsCode},
                      per sourcing country, instead of the {category.defaultFobCostRatio}% category estimate above.
                      Requires a free Census Bureau API key.
                    </p>
                    <div className="url-actions">
                      <input
                        type="text"
                        placeholder="Paste your free Census API key"
                        value={censusApiKeyInput}
                        onChange={(e) => setCensusApiKeyInput(e.target.value)}
                      />
                      <button type="button" className="link-toggle" onClick={handleSaveKey} disabled={!censusApiKeyInput.trim()}>
                        Save key
                      </button>
                    </div>
                    <a
                      className="hint-link"
                      href="https://api.census.gov/data/key_signup.html"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Get a free key at api.census.gov →
                    </a>
                  </div>
                ) : (
                  <div className="trade-data-body">
                    {keyValidation.status === 'checking' && <p className="hint">Checking key…</p>}
                    {keyValidation.status === 'valid' && <p className="hint key-valid">✓ Key looks valid.</p>}
                    {keyValidation.status === 'invalid' && (
                      <p className="form-error">
                        {keyValidation.reason ?? 'This key looks invalid.'} Remove it below and try pasting it again.
                      </p>
                    )}
                    {keyValidation.status === 'unreachable' && <p className="form-error">{keyValidation.reason}</p>}
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={useTradeData}
                        onChange={(e) => setUseTradeData(e.target.checked)}
                      />
                      Use real import data for first cost when available
                    </label>
                    <div className="url-actions">
                      <button
                        type="button"
                        className="link-toggle"
                        onClick={handleLookupTradeData}
                        disabled={tradeDataStatus === 'loading'}
                      >
                        {tradeDataStatus === 'loading'
                          ? 'Looking up US Customs import data… (the free proxy can be slow — up to ~40s)'
                          : `🔍 Look up HTS ${category.representativeHtsCode} across 9 countries`}
                      </button>
                      <button type="button" className="hint-link" onClick={handleClearKey}>
                        Remove key
                      </button>
                    </div>
                    {tradeDataStatus === 'success' &&
                      tradeDataResults &&
                      (Object.values(tradeDataResults).some((r) => !r.ok && r.keyInvalid) ? (
                        <p className="form-error">
                          Census rejected this API key. Click "Remove key" above and paste a fresh one.
                        </p>
                      ) : Object.values(tradeDataResults).some((r) => !r.ok && r.keyInvalid === false) ? (
                        <p className="form-error">
                          The free CORS proxy is having trouble reaching Census right now. Your key is likely fine —
                          click "Look up" again in a moment.
                        </p>
                      ) : (
                        <p className="hint">
                          {Object.values(tradeDataResults).filter((r) => r.ok).length} of{' '}
                          {Object.keys(tradeDataResults).length} countries matched real US import records for this
                          HTS code (trailing months of Census import statistics). The rest fall back to the category
                          estimate.
                        </p>
                      ))}
                    {tradeDataStatus === 'error' && <p className="form-error">{tradeDataError}</p>}
                    <p className="hint">
                      This is a population-wide average (total declared value ÷ total quantity) across all US
                      imports under this HTS code from each country — public customs statistics don't publish
                      individual shipment records or let you filter by price tier.
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="link-toggle"
                onClick={() => setShowAssumptions((s) => !s)}
              >
                {showAssumptions ? '▾' : '▸'} Advanced assumptions
              </button>

              {showAssumptions && (
                <div className="assumptions">
                  <div className="field">
                    <label htmlFor="fobRatio">Estimated first cost / FOB (% of retail price)</label>
                    <input
                      id="fobRatio"
                      type="number"
                      min="1"
                      max="90"
                      step="1"
                      value={fobRatio}
                      onChange={(e) => setFobRatioOverride(Number(e.target.value))}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="marginTarget">Margin target (%)</label>
                    <input
                      id="marginTarget"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={marginTarget}
                      onChange={(e) => setMarginTarget(Number(e.target.value))}
                    />
                  </div>
                  <p className="hint">
                    First cost defaults to a category-typical share of retail price ({category.defaultFobCostRatio}%
                    {' '}for {category.label.toLowerCase()}). Adjust to match your actual factory quotes for a more
                    precise estimate.
                  </p>
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={!isValid}>
                Calculate Top Sourcing Locations
              </button>
              {!isValid && (title || priceInput) && (
                <p className="form-error">Enter a product title and a retail price greater than $0.</p>
              )}
            </form>
          </section>
        )}

        {showResults && (
          <section className="results">
            <div className="results-header">
              <h2>
                Top 3 lowest landed cost — <span className="product-echo">{title}</span>
              </h2>
              <p>
                HTS {category.representativeHtsCode} ({category.label}) · Retail price {currency(retailPrice)} ·
                Default first cost {fobRatio}% ({currency(firstCost)}
                {firstCostByCountry && Object.keys(firstCostByCountry).length > 0
                  ? ` — ${Object.keys(firstCostByCountry).length} of ${results.length} countries use real US import data instead, see below`
                  : ''}
                ) · Margin target {marginTarget}% · Ranked out of {results.length} sourcing countries
              </p>
            </div>

            <div className="cards">
              {topThree.map((r) => (
                <article key={r.code} className={`card ${r.rank === 1 ? 'card-best' : ''}`}>
                  <div className="card-top">
                    <div className="card-title">
                      <span className="flag">{r.flag}</span>
                      <div>
                        <h3>{r.name}</h3>
                        <span className="rank-tag">
                          {r.rank === 1 ? '🏆 Lowest Landed Cost' : `Rank #${r.rank}`}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`margin-pill ${r.meetsTarget ? 'pill-pass' : 'pill-fail'}`}
                      title={`Margin ${r.marginPct.toFixed(2)}% vs ${marginTarget}% target`}
                    >
                      {r.meetsTarget ? '✓ Meets' : '✗ Below'} {marginTarget}% margin
                    </div>
                  </div>

                  <div className="landed-cost">
                    <span className="landed-cost-label">Landed Cost / Unit</span>
                    <span className="landed-cost-value">{currency(r.landedCost)}</span>
                  </div>

                  <div className="breakdown">
                    <h4>Cost Breakdown</h4>
                    <ul>
                      <li title={r.fobCostDetail}>
                        <span>
                          First cost (FOB)
                          {r.fobCostSource === 'trade_data' ? (
                            <span className="source-tag source-tag-real">real US import data</span>
                          ) : (
                            <span className="source-tag source-tag-estimate">estimated</span>
                          )}
                        </span>
                        <span>{currency(r.fobCost)}</span>
                      </li>
                      {r.tariffLines.map((line) => (
                        <li key={line.label} title={line.note}>
                          <span>
                            {line.label} ({line.rate.toFixed(1)}%)
                            {line.note && <span className="info-dot">ⓘ</span>}
                          </span>
                          <span>{currency(line.amount)}</span>
                        </li>
                      ))}
                      <li>
                        <span>Freight &amp; logistics ({r.freightRate.toFixed(1)}%)</span>
                        <span>{currency(r.freightAmount)}</span>
                      </li>
                      <li className="total-row">
                        <span>Total tariff rate</span>
                        <span>{r.totalTariffRate.toFixed(1)}%</span>
                      </li>
                    </ul>
                  </div>

                  <div className="margin-analysis">
                    <h4>Margin Analysis</h4>
                    <div className="margin-bar-track">
                      <div
                        className={`margin-bar-fill ${r.meetsTarget ? 'fill-pass' : 'fill-fail'}`}
                        style={{ width: `${Math.max(0, Math.min(100, r.marginPct))}%` }}
                      />
                      <div className="margin-target-marker" style={{ left: `${marginTarget}%` }} />
                    </div>
                    <div className="margin-numbers">
                      <span>Gross profit: {currency(r.grossProfit)}</span>
                      <span className={r.meetsTarget ? 'text-pass' : 'text-fail'}>
                        Margin: {r.marginPct.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <div className="meta-grid">
                    <div>
                      <span className="meta-label">MOQ</span>
                      <span className="meta-value">{r.moqUnits.toLocaleString()} units</span>
                    </div>
                    <div>
                      <span className="meta-label">Lead Time</span>
                      <span className="meta-value">
                        {r.leadTimeDaysMin}–{r.leadTimeDaysMax} days
                      </span>
                    </div>
                  </div>

                  {r.ftaNote && <p className="fta-note">🤝 {r.ftaNote}</p>}

                  <div className="risks">
                    <h4>Key Risks</h4>
                    <ul>
                      {r.risks.map((risk) => (
                        <li key={risk}>{risk}</li>
                      ))}
                    </ul>
                  </div>

                  <p className="notes">{r.notes}</p>
                </article>
              ))}
            </div>

            {rest.length > 0 && (
              <div className="all-countries">
                <button type="button" className="link-toggle" onClick={() => setShowAllCountries((s) => !s)}>
                  {showAllCountries ? '▾' : '▸'} View all {results.length} sourcing countries ranked
                </button>
                {showAllCountries && (
                  <div className="table-wrap">
                    <table className="rank-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Country</th>
                          <th>Landed Cost</th>
                          <th>Total Tariff Rate</th>
                          <th>Freight</th>
                          <th>Lead Time</th>
                          <th>MOQ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r) => (
                          <tr key={r.code} className={r.rank <= 3 ? 'in-top-3' : ''}>
                            <td>#{r.rank}</td>
                            <td>
                              {r.flag} {r.name}
                            </td>
                            <td>{currency(r.landedCost)}</td>
                            <td>{r.totalTariffRate.toFixed(1)}%</td>
                            <td>{r.freightRate.toFixed(1)}%</td>
                            <td>
                              {r.leadTimeDaysMin}–{r.leadTimeDaysMax}d
                            </td>
                            <td>{r.moqUnits.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        <footer className="disclaimer">
          <strong>Disclaimer:</strong> HTS classification is a keyword-based heuristic, and tariff, freight, MOQ
          and AD/CVD figures are illustrative, blended reference estimates as of August 2026 — not an official
          customs ruling. Actual duty depends on the exact 10-digit HTS classification, country-of-origin rules,
          and active trade-remedy orders. Verify with a licensed customs broker, a CBP binding ruling, and the
          current AD/CVD order list before making sourcing decisions.
        </footer>
      </main>
    </div>
  );
}

export default App;
