import { useMemo, useState } from 'react';
import { calculateLandedCosts } from './calculations';
import { DEFAULT_FOB_COST_RATIO, DEFAULT_MARGIN_TARGET } from './tariffData';
import './App.css';

const currency = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

function App() {
  const [productName, setProductName] = useState('');
  const [retailPriceInput, setRetailPriceInput] = useState('');
  const [fobCostRatio, setFobCostRatio] = useState(DEFAULT_FOB_COST_RATIO);
  const [marginTarget, setMarginTarget] = useState(DEFAULT_MARGIN_TARGET);
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const retailPrice = parseFloat(retailPriceInput);
  const isValid = productName.trim().length > 0 && !isNaN(retailPrice) && retailPrice > 0;

  const results = useMemo(() => {
    if (!isValid) return [];
    return calculateLandedCosts(retailPrice, fobCostRatio, marginTarget);
  }, [isValid, retailPrice, fobCostRatio, marginTarget]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const showResults = submitted && isValid;

  return (
    <div className="page">
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-mark">🧭</span>
            <div>
              <h1>La Naia Sourcing Compass</h1>
              <p>Landed cost &amp; margin calculator — China · Vietnam · India</p>
            </div>
          </div>
          <span className="badge">Tariff reference: August 2026</span>
        </div>
      </header>

      <main className="main">
        <section className="panel form-panel">
          <h2>Product Details</h2>
          <form onSubmit={handleSubmit} className="form">
            <div className="field">
              <label htmlFor="productName">Product Name</label>
              <input
                id="productName"
                type="text"
                placeholder="e.g. Insulated Steel Water Bottle"
                value={productName}
                onChange={(e) => {
                  setProductName(e.target.value);
                  setSubmitted(false);
                }}
              />
            </div>

            <div className="field">
              <label htmlFor="retailPrice">Retail Price (USD)</label>
              <div className="input-prefix">
                <span>$</span>
                <input
                  id="retailPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="29.99"
                  value={retailPriceInput}
                  onChange={(e) => {
                    setRetailPriceInput(e.target.value);
                    setSubmitted(false);
                  }}
                />
              </div>
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
                  <label htmlFor="fobRatio">Estimated FOB cost (% of retail price)</label>
                  <input
                    id="fobRatio"
                    type="number"
                    min="1"
                    max="90"
                    step="1"
                    value={fobCostRatio}
                    onChange={(e) => setFobCostRatio(Number(e.target.value))}
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
                  Landed cost is modeled from an assumed factory (FOB) cost, since only retail price is
                  provided. Adjust these to match your actual quotes for a more precise estimate.
                </p>
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={!isValid}>
              Calculate Landed Cost
            </button>
            {!isValid && (productName || retailPriceInput) && (
              <p className="form-error">Enter a product name and a retail price greater than $0.</p>
            )}
          </form>
        </section>

        {showResults && (
          <section className="results">
            <div className="results-header">
              <h2>
                Results for <span className="product-echo">{productName}</span>
              </h2>
              <p>
                Retail price {currency(retailPrice)} · Assumed FOB cost {fobCostRatio}% (
                {currency(retailPrice * (fobCostRatio / 100))}) · Margin target {marginTarget}%
              </p>
            </div>

            <div className="cards">
              {results.map((r) => (
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
                      <li>
                        <span>FOB unit cost</span>
                        <span>{currency(r.fobCost)}</span>
                      </li>
                      <li>
                        <span>MFN duty ({r.mfnRate.toFixed(1)}%)</span>
                        <span>{currency(r.mfnAmount)}</span>
                      </li>
                      <li>
                        <span>
                          {r.additionalTariffLabel} ({r.additionalTariffRate.toFixed(1)}%)
                        </span>
                        <span>{currency(r.additionalTariffAmount)}</span>
                      </li>
                      <li>
                        <span>Forced-labor compliance risk ({r.forcedLaborRiskRate.toFixed(1)}%)</span>
                        <span>{currency(r.forcedLaborAmount)}</span>
                      </li>
                      <li>
                        <span>Freight &amp; logistics ({r.freightRate.toFixed(1)}%)</span>
                        <span>{currency(r.freightAmount)}</span>
                      </li>
                      <li className="total-row">
                        <span>Total duty rate</span>
                        <span>{r.totalDutyRate.toFixed(1)}%</span>
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
          </section>
        )}

        <footer className="disclaimer">
          <strong>Disclaimer:</strong> Tariff rates shown are illustrative, blended reference estimates for
          general consumer goods as of August 2026 — not official HTS duty rates. Actual duty depends on
          HS classification, country-of-origin rules, and active trade-remedy actions. Verify with a
          licensed customs broker or the U.S. Harmonized Tariff Schedule before making sourcing decisions.
        </footer>
      </main>
    </div>
  );
}

export default App;
