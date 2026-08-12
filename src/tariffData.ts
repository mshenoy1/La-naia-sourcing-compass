import type { AdCvdRule, CategoryProfile, CountryProfile } from './types';

/**
 * Reference data as of August 2026, focused on the US import market.
 *
 * Legal backdrop: the Supreme Court struck down the IEEPA "reciprocal"
 * tariffs on February 20, 2026. The administration's stopgap Section 122
 * global tariff was itself invalidated by the Court of International Trade
 * and expired July 24, 2026. The permanent structure now in place is a
 * two-tier Section 301 "forced-labor prevention" tariff — 10% for economies
 * USTR recognizes as having a forced-labor import prohibition, 12.5% for the
 * rest — layered under duties that were never IEEPA-based and are
 * unaffected: standard MFN duty, the original 2018 Section 301 China List
 * 1-4 action, Section 232 (steel/aluminum/copper — 50% on primary metal, 25%
 * on derivative/finished articles), and AD/CVD orders. Goods already subject
 * to Section 232 are exempt from the new forced-labor tariff to avoid
 * double-stacking. HTS codes, duty rates, AD/CVD flags and freight figures
 * below are representative, blended estimates for teaching and screening
 * purposes — NOT an official customs ruling. Actual duty depends on the
 * exact 10-digit HTS classification, country-of-origin rules, and any active
 * trade-remedy orders. Always confirm with a licensed customs broker, a
 * formal HTS binding ruling (CBP CROSS), and the current AD/CVD order list
 * (access.trade.gov) before making sourcing decisions.
 */
export const CATEGORY_PROFILES: CategoryProfile[] = [
  {
    id: 'apparel',
    label: 'Apparel & Textiles',
    htsChapter: 'Ch. 61–62',
    representativeHtsCode: '6109.10.0012',
    htsDescription: "Cotton knit T-shirts (representative — chapter covers knit & woven apparel)",
    mfnRate: 16.5,
    section232: false,
    section232Rate: 0,
    weightClass: 'light',
    defaultFobCostRatio: 22,
    keywords: [
      'shirt', 't-shirt', 'tee', 'apparel', 'clothing', 'dress', 'jacket', 'hoodie',
      'sweater', 'pants', 'jeans', 'legging', 'sock', 'underwear', 'activewear',
      'sportswear', 'garment', 'knit', 'woven', 'fabric', 'cotton', 'polo', 'skirt',
    ],
  },
  {
    id: 'footwear',
    label: 'Footwear',
    htsChapter: 'Ch. 64',
    representativeHtsCode: '6404.11.9050',
    htsDescription: 'Athletic/sports footwear with textile upper (representative)',
    mfnRate: 15.0,
    section232: false,
    section232Rate: 0,
    weightClass: 'light',
    defaultFobCostRatio: 20,
    keywords: [
      'shoe', 'shoes', 'sneaker', 'boot', 'sandal', 'footwear', 'slipper', 'cleat',
      'heel', 'loafer', 'flip flop', 'flip-flop',
    ],
  },
  {
    id: 'electronics',
    label: 'Consumer Electronics',
    htsChapter: 'Ch. 85 / 84',
    representativeHtsCode: '8517.13.0000',
    htsDescription: 'Smartphones / smart devices & consumer electronics (representative)',
    mfnRate: 0.5,
    section232: false,
    section232Rate: 0,
    weightClass: 'light',
    defaultFobCostRatio: 35,
    keywords: [
      'electronic', 'earbud', 'headphone', 'speaker', 'charger', 'cable', 'usb',
      'bluetooth', 'wireless', 'smartwatch', 'watch', 'camera', 'drone', 'laptop',
      'tablet', 'phone', 'monitor', 'tv', 'television', 'router', 'battery',
      'power bank', 'led', 'light strip', 'smart home', 'gadget', 'circuit',
    ],
  },
  {
    id: 'furniture',
    label: 'Furniture',
    htsChapter: 'Ch. 94',
    representativeHtsCode: '9403.60.8093',
    htsDescription: 'Wooden household furniture, n.e.s.o.i. (representative)',
    mfnRate: 0,
    section232: false,
    section232Rate: 0,
    weightClass: 'heavy',
    defaultFobCostRatio: 30,
    keywords: [
      'furniture', 'chair', 'sofa', 'couch', 'table', 'desk', 'shelf', 'shelving',
      'cabinet', 'dresser', 'bed frame', 'mattress', 'nightstand', 'bookcase',
      'ottoman', 'recliner', 'bench',
    ],
  },
  {
    id: 'toys_games',
    label: 'Toys & Games',
    htsChapter: 'Ch. 95',
    representativeHtsCode: '9503.00.0090',
    htsDescription: 'Toys & games, n.e.s.o.i. (representative)',
    mfnRate: 0,
    section232: false,
    section232Rate: 0,
    weightClass: 'medium',
    defaultFobCostRatio: 25,
    keywords: [
      'toy', 'game', 'puzzle', 'plush', 'doll', 'action figure', 'lego', 'building block',
      'board game', 'playset', 'rc car', 'remote control',
    ],
  },
  {
    id: 'housewares_metal',
    label: 'Metal Housewares & Kitchenware',
    htsChapter: 'Ch. 73',
    representativeHtsCode: '7323.93.0080',
    htsDescription: 'Stainless steel kitchen/household articles (representative)',
    mfnRate: 2.0,
    section232: true,
    section232Rate: 25,
    weightClass: 'medium',
    defaultFobCostRatio: 28,
    keywords: [
      'kitchenware', 'cookware', 'water bottle', 'tumbler', 'flask', 'pan', 'pot',
      'utensil', 'cutlery', 'knife set', 'bakeware', 'rack', 'wire shelf',
      'stainless steel', 'thermos',
    ],
  },
  {
    id: 'steel_aluminum_industrial',
    label: 'Steel / Aluminum & Industrial Metal Products',
    htsChapter: 'Ch. 73 / 76',
    representativeHtsCode: '7326.90.8688',
    htsDescription: 'Other articles of iron or steel (representative)',
    mfnRate: 2.9,
    section232: true,
    section232Rate: 25,
    weightClass: 'heavy',
    defaultFobCostRatio: 45,
    keywords: [
      'steel', 'aluminum', 'aluminium', 'bracket', 'fastener', 'bolt', 'sheet metal',
      'extrusion', 'pipe fitting', 'wire', 'rebar', 'metal frame', 'hardware',
      'industrial', 'machinery part',
    ],
  },
  {
    id: 'bags_luggage_leather',
    label: 'Bags, Luggage & Leather Goods',
    htsChapter: 'Ch. 42',
    representativeHtsCode: '4202.92.3120',
    htsDescription: 'Travel, sports & similar bags, textile outer (representative)',
    mfnRate: 17.6,
    section232: false,
    section232Rate: 0,
    weightClass: 'light',
    defaultFobCostRatio: 18,
    keywords: [
      'bag', 'backpack', 'handbag', 'purse', 'wallet', 'luggage', 'suitcase', 'tote',
      'duffel', 'briefcase', 'leather', 'pouch',
    ],
  },
  {
    id: 'plastics_general',
    label: 'Plastics & General Merchandise',
    htsChapter: 'Ch. 39',
    representativeHtsCode: '3924.10.4000',
    htsDescription: 'Plastic tableware, kitchenware & household articles (representative)',
    mfnRate: 3.4,
    section232: false,
    section232Rate: 0,
    weightClass: 'medium',
    defaultFobCostRatio: 25,
    keywords: [
      'plastic', 'silicone', 'organizer', 'container', 'storage bin', 'mold',
      'household item', 'gadget holder', 'phone case', 'case',
    ],
  },
  {
    id: 'general_other',
    label: 'General / Unclassified Merchandise',
    htsChapter: 'n/a',
    representativeHtsCode: 'n/a',
    htsDescription: 'No confident keyword match — treated as general merchandise (manual HTS review required)',
    mfnRate: 5.0,
    section232: false,
    section232Rate: 0,
    weightClass: 'medium',
    defaultFobCostRatio: 28,
    keywords: [],
  },
];

/**
 * Illustrative antidumping/countervailing duty exposure. AD/CVD orders are
 * extremely product- and exporter-specific; these entries flag *general*
 * category-level exposure only. Always check the live order list before
 * committing volume.
 */
export const AD_CVD_RULES: AdCvdRule[] = [
  {
    category: 'steel_aluminum_industrial',
    countryCode: 'CN',
    rate: 58,
    note: 'Many Chinese steel & aluminum extrusion products carry standing AD/CVD orders — illustrative blended exposure.',
  },
  {
    category: 'steel_aluminum_industrial',
    countryCode: 'TR',
    rate: 12,
    note: 'Select Turkish steel products (e.g. rebar, pipe) carry AD orders.',
  },
  {
    category: 'steel_aluminum_industrial',
    countryCode: 'VN',
    rate: 8,
    note: 'Circumvention/AD exposure where Vietnamese steel uses Chinese-origin substrate.',
  },
  {
    category: 'housewares_metal',
    countryCode: 'CN',
    rate: 33,
    note: 'Illustrative AD/CVD exposure for select steel/aluminum housewares (e.g. wire racks, certain cookware).',
  },
  {
    category: 'furniture',
    countryCode: 'CN',
    rate: 25,
    note: 'Historical wooden bedroom furniture AD/CVD order — verify current scope for your specific item.',
  },
];

export const DEFAULT_ADCVD_NOTE =
  'No standing AD/CVD order modeled for this category/country pairing — always verify against the current AD/CVD order list (access.trade.gov) before sourcing.';

export const COUNTRY_PROFILES: CountryProfile[] = [
  {
    code: 'CN',
    name: 'China',
    flag: '🇨🇳',
    section301Rate: 25.0,
    section301Label: 'Section 301 (2018 China Tariff, List 1–4)',
    forcedLaborTariffRate: 12.5,
    forcedLaborTariffLabel: 'Section 301 Forced-Labor Prevention Tariff (2026)',
    section232Exempt: false,
    ftaDutyFree: false,
    forcedLaborRiskRate: 4.0,
    freightBaseRate: 6.0,
    leadTimeDaysMin: 30,
    leadTimeDaysMax: 45,
    moqUnits: 500,
    risks: [
      'UFLPA detention risk for cotton, polysilicon & Xinjiang-linked inputs',
      'Stacked Section 301 exposure: legacy List 1–4 duty plus the 2026 forced-labor tariff',
      'IP protection & factory-audit concerns',
    ],
    notes: 'Deepest manufacturing base and fastest sampling, offset by the highest combined tariff stack.',
  },
  {
    code: 'VN',
    name: 'Vietnam',
    flag: '🇻🇳',
    section301Rate: 0,
    section301Label: 'Section 301 (2018 China Tariff, List 1–4)',
    forcedLaborTariffRate: 12.5,
    forcedLaborTariffLabel: 'Section 301 Forced-Labor Prevention Tariff (2026)',
    section232Exempt: false,
    ftaDutyFree: false,
    forcedLaborRiskRate: 2.0,
    freightBaseRate: 7.0,
    leadTimeDaysMin: 35,
    leadTimeDaysMax: 50,
    moqUnits: 1000,
    ftaNote: 'USTR placed Vietnam in the 12.5% tier — no recognized forced-labor import prohibition yet.',
    risks: [
      'Transshipment scrutiny on goods with Chinese-origin inputs',
      'Factory capacity strain as buyers shift volume from China',
      'Higher MOQs at established tier-1 factories',
    ],
    notes: 'Balanced middle ground — solid capacity and no legacy 301 exposure, but MOQs run higher.',
  },
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    section301Rate: 0,
    section301Label: 'Section 301 (2018 China Tariff, List 1–4)',
    forcedLaborTariffRate: 10.0,
    forcedLaborTariffLabel: 'Section 301 Forced-Labor Prevention Tariff (2026)',
    section232Exempt: false,
    ftaDutyFree: false,
    forcedLaborRiskRate: 0.5,
    freightBaseRate: 9.0,
    leadTimeDaysMin: 45,
    leadTimeDaysMax: 60,
    moqUnits: 300,
    ftaNote: 'USTR recognizes a forced-labor import prohibition — qualifies for the lower 10% tier.',
    risks: [
      'Port congestion & inland logistics variability',
      'Quality consistency across smaller/mid-tier factories',
      'Longer lead times versus China or Vietnam',
    ],
    notes: 'Low tariff stack and low MOQs, traded off against longer, less predictable lead times.',
  },
  {
    code: 'BD',
    name: 'Bangladesh',
    flag: '🇧🇩',
    section301Rate: 0,
    section301Label: 'Section 301 (2018 China Tariff, List 1–4)',
    forcedLaborTariffRate: 10.0,
    forcedLaborTariffLabel: 'Section 301 Forced-Labor Prevention Tariff (2026)',
    section232Exempt: false,
    ftaDutyFree: false,
    forcedLaborRiskRate: 1.5,
    freightBaseRate: 9.5,
    leadTimeDaysMin: 45,
    leadTimeDaysMax: 65,
    moqUnits: 2000,
    ftaNote: 'GSP duty-free program currently lapsed — standard MFN applies. Qualifies for the lower 10% forced-labor tier.',
    risks: [
      'Grid power reliability & port infrastructure gaps',
      'Very high MOQs outside apparel megafactories',
      'Limited factory base outside apparel/textiles',
    ],
    notes: 'Apparel powerhouse with deep capacity, but MOQs and infrastructure risk are high outside textiles.',
  },
  {
    code: 'ID',
    name: 'Indonesia',
    flag: '🇮🇩',
    section301Rate: 0,
    section301Label: 'Section 301 (2018 China Tariff, List 1–4)',
    forcedLaborTariffRate: 10.0,
    forcedLaborTariffLabel: 'Section 301 Forced-Labor Prevention Tariff (2026)',
    section232Exempt: false,
    ftaDutyFree: false,
    forcedLaborRiskRate: 1.0,
    freightBaseRate: 8.0,
    leadTimeDaysMin: 40,
    leadTimeDaysMax: 55,
    moqUnits: 1000,
    ftaNote: 'USTR recognizes a forced-labor import prohibition — qualifies for the lower 10% tier.',
    risks: [
      'Fragmented archipelago logistics between production & port',
      'Smaller footprint in electronics/hard goods',
      'Currency volatility versus USD',
    ],
    notes: 'Growing footwear/furniture base with a favorable forced-labor tariff tier.',
  },
  {
    code: 'KH',
    name: 'Cambodia',
    flag: '🇰🇭',
    section301Rate: 0,
    section301Label: 'Section 301 (2018 China Tariff, List 1–4)',
    forcedLaborTariffRate: 10.0,
    forcedLaborTariffLabel: 'Section 301 Forced-Labor Prevention Tariff (2026)',
    section232Exempt: false,
    ftaDutyFree: false,
    forcedLaborRiskRate: 2.5,
    freightBaseRate: 8.5,
    leadTimeDaysMin: 40,
    leadTimeDaysMax: 55,
    moqUnits: 1500,
    ftaNote: 'USTR recognizes a forced-labor import prohibition — qualifies for the lower 10% tier.',
    risks: [
      'Elevated transshipment/rules-of-origin scrutiny',
      'Shallow supplier base outside apparel & travel goods',
      'Higher UFLPA-style compliance monitoring burden despite the favorable tariff tier',
    ],
    notes: 'Low labor cost apparel/bags hub with a favorable forced-labor tariff tier, offset by transshipment scrutiny.',
  },
  {
    code: 'MX',
    name: 'Mexico',
    flag: '🇲🇽',
    section301Rate: 0,
    section301Label: 'Section 301 (2018 China Tariff, List 1–4)',
    forcedLaborTariffRate: 10.0,
    forcedLaborTariffLabel: 'Section 301 Forced-Labor Prevention Tariff (2026)',
    section232Exempt: true,
    section232ExemptNote: 'USMCA steel/aluminum tariff-rate quota arrangement — verify your volume against the negotiated quota.',
    ftaDutyFree: true,
    forcedLaborRiskRate: 0.3,
    freightBaseRate: 2.5,
    leadTimeDaysMin: 10,
    leadTimeDaysMax: 20,
    moqUnits: 250,
    ftaNote: 'USMCA duty-free assumed: 0% MFN and 0% Section 301 forced-labor tariff, on the assumption that goods meet USMCA rules of origin.',
    risks: [
      'Rules-of-origin documentation burden to actually qualify for USMCA',
      'Narrower manufacturing base for some product categories',
      'Border/customs congestion at peak season',
    ],
    notes: 'Nearshoring standout — short trucking lead times, low freight, and USMCA duty relief assumed.',
  },
  {
    code: 'TW',
    name: 'Taiwan',
    flag: '🇹🇼',
    section301Rate: 0,
    section301Label: 'Section 301 (2018 China Tariff, List 1–4)',
    forcedLaborTariffRate: 10.0,
    forcedLaborTariffLabel: 'Section 301 Forced-Labor Prevention Tariff (2026)',
    section232Exempt: false,
    combinedMfnCapRate: 10,
    ftaDutyFree: false,
    forcedLaborRiskRate: 0.5,
    freightBaseRate: 5.5,
    leadTimeDaysMin: 25,
    leadTimeDaysMax: 40,
    moqUnits: 500,
    ftaNote: 'Taiwan-specific rule: combined MFN duty + forced-labor tariff is capped at 10% rather than stacking.',
    risks: [
      'Higher labor & overhead cost than mainland Southeast Asia',
      'Geopolitical/shipping-lane risk in the Taiwan Strait',
      'Capacity concentrated in electronics & precision components — watch Section 232 semiconductor tariff exposure',
    ],
    notes: 'Strong fit for electronics/precision goods with low compliance risk, at a higher cost base.',
  },
  {
    code: 'TR',
    name: 'Turkey',
    flag: '🇹🇷',
    section301Rate: 0,
    section301Label: 'Section 301 (2018 China Tariff, List 1–4)',
    forcedLaborTariffRate: 12.5,
    forcedLaborTariffLabel: 'Section 301 Forced-Labor Prevention Tariff (2026)',
    section232Exempt: false,
    ftaDutyFree: false,
    forcedLaborRiskRate: 1.0,
    freightBaseRate: 7.0,
    leadTimeDaysMin: 30,
    leadTimeDaysMax: 45,
    moqUnits: 1000,
    ftaNote: 'USTR found no qualifying forced-labor import ban — placed in the 12.5% tier.',
    risks: [
      'AD/CVD exposure on select steel products',
      'Currency volatility versus USD',
      'Longer transit time to US West Coast ports than Asia-Pacific hubs',
    ],
    notes: 'Established textile & steel base geographically closer to Europe than to US demand centers.',
  },
];

export const WEIGHT_CLASS_FREIGHT_MULTIPLIER: Record<CategoryProfile['weightClass'], number> = {
  light: 1.0,
  medium: 1.3,
  heavy: 1.7,
};

export const DEFAULT_FOB_COST_RATIO = 28; // fallback FOB unit cost as % of retail price
export const DEFAULT_MARGIN_TARGET = 60; // %

/**
 * US Census Bureau Schedule C country codes, verified against
 * census.gov/foreign-trade/schedules/c/country.txt. Used to query the
 * Census International Trade API (api.census.gov) for real declared import
 * statistics by HTS code + country + month.
 */
export const CENSUS_COUNTRY_CODES: Record<string, string> = {
  CN: '5700',
  VN: '5520',
  IN: '5330',
  BD: '5380',
  ID: '5600',
  KH: '5550',
  MX: '2010',
  TW: '5830',
  TR: '4890',
};
