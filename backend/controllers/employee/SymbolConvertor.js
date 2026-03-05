const FALLBACK_SYMBOL = 'NIFTYBEES';

function normalizeCompanyName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[&.,/-]/g, ' ')
    .replace(/\b(private|pvt|limited|ltd|inc|corp|corporation|india)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const companyResolutionList = [
  { aliases: ['tata consultancy services', 'tcs'], symbol: 'TCS', isProxy: false },
  { aliases: ['infosys'], symbol: 'INFY', isProxy: false },
  { aliases: ['wipro'], symbol: 'WIPRO', isProxy: false },
  { aliases: ['hcl technologies', 'hcl'], symbol: 'HCLTECH', isProxy: false },
  { aliases: ['tech mahindra'], symbol: 'TECHM', isProxy: false },
  { aliases: ['ltimindtree', 'lti mindtree'], symbol: 'LTIM', isProxy: false },
  { aliases: ['mphasis'], symbol: 'MPHASIS', isProxy: false },
  { aliases: ['coforge'], symbol: 'COFORGE', isProxy: false },
  { aliases: ['persistent systems', 'persistent'], symbol: 'PERSISTENT', isProxy: false },
  { aliases: ['oracle financial services software', 'oracle financial services', 'ofss'], symbol: 'OFSS', isProxy: false },
  { aliases: ['hdfc bank'], symbol: 'HDFCBANK', isProxy: false },
  { aliases: ['icici bank'], symbol: 'ICICIBANK', isProxy: false },
  { aliases: ['axis bank'], symbol: 'AXISBANK', isProxy: false },
  { aliases: ['bharti airtel', 'airtel'], symbol: 'BHARTIARTL', isProxy: false },
  { aliases: ['vodafone idea', 'idea'], symbol: 'IDEA', isProxy: false },
  { aliases: ['bajaj auto'], symbol: 'BAJAJ-AUTO', isProxy: false },
  { aliases: ['apollo hospitals'], symbol: 'APOLLOHOSP', isProxy: false },
  { aliases: ['fortis healthcare', 'fortis'], symbol: 'FORTIS', isProxy: false },
  { aliases: ['cipla'], symbol: 'CIPLA', isProxy: false },
  { aliases: ['sun pharma', 'sun pharmaceutical'], symbol: 'SUNPHARMA', isProxy: false },
  { aliases: ['tata motors'], symbol: 'TATAMOTORS', isProxy: false },
  { aliases: ['larsen toubro', 'l and t', 'lt'], symbol: 'LT', isProxy: false },
  { aliases: ['mahindra mahindra', 'mahindra and mahindra'], symbol: 'M&M', isProxy: false },
  { aliases: ['paytm'], symbol: 'PAYTM', isProxy: false },

  // Global listed entities: use parent listed symbols directly.
  { aliases: ['accenture', 'accenture india'], symbol: 'ACN', isProxy: false, reason: 'global_parent_listing', market: 'US', mappingType: 'direct_listing' },
  { aliases: ['amazon', 'amazon india', 'amazon development centre'], symbol: 'AMZN', isProxy: false, reason: 'global_parent_listing', market: 'US', mappingType: 'direct_listing' },
  { aliases: ['apple', 'apple india'], symbol: 'AAPL', isProxy: false, reason: 'global_parent_listing', market: 'US', mappingType: 'direct_listing' },
  { aliases: ['capgemini', 'capgemini india'], symbol: 'CAP.PA', isProxy: false, reason: 'global_parent_listing', market: 'GLOBAL', mappingType: 'direct_listing' },
  { aliases: ['cognizant', 'cognizant india', 'cognizant technology solutions'], symbol: 'CTSH', isProxy: false, reason: 'global_parent_listing', market: 'US', mappingType: 'direct_listing' },
  { aliases: ['facebook', 'facebook india'], symbol: 'META', isProxy: false, reason: 'global_parent_listing', market: 'US', mappingType: 'direct_listing' },
  { aliases: ['google', 'google india', 'alphabet', 'alphabet inc'], symbol: 'GOOGL', isProxy: false, reason: 'global_parent_listing', market: 'US', mappingType: 'direct_listing' },
  { aliases: ['ibm', 'ibm india'], symbol: 'IBM', isProxy: false, reason: 'global_parent_listing', market: 'US', mappingType: 'direct_listing' },
  { aliases: ['meta', 'meta india'], symbol: 'META', isProxy: false, reason: 'global_parent_listing', market: 'US', mappingType: 'direct_listing' },
  { aliases: ['microsoft', 'microsoft india'], symbol: 'MSFT', isProxy: false, reason: 'global_parent_listing', market: 'US', mappingType: 'direct_listing' },
  { aliases: ['netflix', 'netflix india'], symbol: 'NFLX', isProxy: false, reason: 'global_parent_listing', market: 'US', mappingType: 'direct_listing' },
];

const resolutionMap = new Map();
for (const entry of companyResolutionList) {
  for (const alias of entry.aliases) {
    resolutionMap.set(normalizeCompanyName(alias), entry);
  }
}

export const resolveCompanySymbol = (company) => {
  const raw = String(company || '').trim();
  const normalized = normalizeCompanyName(raw);

  if (!normalized) {
    return {
      symbol: FALLBACK_SYMBOL,
      isProxy: true,
      mappingType: 'market_equivalent',
      matchedAlias: null,
      reason: 'empty_company_name_fallback',
    };
  }

  const direct = resolutionMap.get(normalized);
  if (direct) {
    return {
      symbol: direct.symbol,
      isProxy: Boolean(direct.isProxy),
      market: direct.market || 'IN',
      mappingType: direct.mappingType || (direct.isProxy ? 'market_equivalent' : 'direct_listing'),
      matchedAlias: normalized,
      reason: direct.reason || 'alias_match',
    };
  }

  for (const [alias, entry] of resolutionMap.entries()) {
    if (normalized.includes(alias) || alias.includes(normalized)) {
      return {
        symbol: entry.symbol,
        isProxy: Boolean(entry.isProxy),
        market: entry.market || 'IN',
        mappingType: entry.mappingType || (entry.isProxy ? 'market_equivalent' : 'direct_listing'),
        matchedAlias: alias,
        reason: entry.reason || 'partial_alias_match',
      };
    }
  }

  // If user typed ticker-like text, trust it.
  const rawUpper = raw.toUpperCase().trim();
  const tickerLike = /^[A-Z0-9&.-]{2,15}$/.test(rawUpper);
  if (tickerLike) {
    return {
      symbol: rawUpper,
      isProxy: false,
      market: 'GLOBAL',
      mappingType: 'user_ticker',
      matchedAlias: null,
      reason: 'ticker_like_input',
    };
  }

  return {
    symbol: FALLBACK_SYMBOL,
    isProxy: true,
    market: 'IN',
    mappingType: 'market_equivalent',
    matchedAlias: null,
    reason: 'generic_market_fallback',
  };
};

export const SymbolConvertor = (company) => resolveCompanySymbol(company).symbol;
