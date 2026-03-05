import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const CACHE_TTL_MS = 15 * 60 * 1000;
const chartCache = new Map();
const NSE_COOKIE_TTL_MS = 10 * 60 * 1000;
let nseCookieHeader = '';
let nseCookieTs = 0;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NSE_PY_SCRIPT = path.resolve(__dirname, '../../ml/fetch_live_nse_market.py');
const ENABLE_NSE_PY_FALLBACK = String(process.env.ENABLE_NSE_PYTHON_FALLBACK || '1') !== '0';

const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/json,text/plain,*/*',
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function toNumber(value, fallback = null) {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const normalized = String(value).replace(/,/g, '').trim();
  if (!normalized) {
    return fallback;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getFreshCache(key) {
  const entry = chartCache.get(key);
  if (!entry) {
    return null;
  }
  if ((Date.now() - entry.ts) > CACHE_TTL_MS) {
    return null;
  }
  return entry.value;
}

function getStaleCache(key) {
  const entry = chartCache.get(key);
  return entry ? entry.value : null;
}

function setCache(key, value) {
  chartCache.set(key, { ts: Date.now(), value });
}

function computeReturnPct(prices) {
  if (!Array.isArray(prices) || prices.length < 2) {
    return null;
  }
  const first = prices[0];
  const last = prices[prices.length - 1];
  if (!Number.isFinite(first) || !Number.isFinite(last) || first === 0) {
    return null;
  }
  return ((last - first) / first) * 100;
}

function computeDailyVolatility(prices) {
  if (!Array.isArray(prices) || prices.length < 3) {
    return null;
  }

  const returns = [];
  for (let i = 1; i < prices.length; i += 1) {
    const prev = prices[i - 1];
    const curr = prices[i];
    if (!Number.isFinite(prev) || !Number.isFinite(curr) || prev === 0) {
      continue;
    }
    returns.push((curr - prev) / prev);
  }

  if (returns.length < 2) {
    return null;
  }

  const mean = returns.reduce((acc, r) => acc + r, 0) / returns.length;
  const variance = returns.reduce((acc, r) => acc + ((r - mean) ** 2), 0) / returns.length;
  return Math.sqrt(variance) * 100;
}

function computeMarketStress({
  companyReturn90d,
  marketReturn90d,
  relativeReturn90d,
  companyVolatility90d,
  marketVolatility90d,
  indiaVix,
}) {
  const marketDrop = clamp((-Number(marketReturn90d || 0)) / 12, 0, 1);
  const relativeUnderperf = clamp((-Number(relativeReturn90d || 0)) / 15, 0, 1);
  const stockDrop = clamp((-Number(companyReturn90d || 0)) / 20, 0, 1);
  const marketVol = clamp(Number(marketVolatility90d || 0) / 3.2, 0, 1);
  const companyVol = clamp(Number(companyVolatility90d || 0) / 4.5, 0, 1);
  const vixRisk = clamp((Number(indiaVix || 18) - 14) / 16, 0, 1);

  const score =
    marketDrop * 0.24 +
    relativeUnderperf * 0.22 +
    stockDrop * 0.20 +
    marketVol * 0.14 +
    companyVol * 0.10 +
    vixRisk * 0.10;

  return round(clamp(score, 0, 1), 4);
}

function classifyMarketRegime(stressScore) {
  if (stressScore >= 0.72) {
    return 'Recession';
  }
  if (stressScore >= 0.52) {
    return 'Recovery';
  }
  if (stressScore >= 0.32) {
    return 'Stable';
  }
  return 'Growth';
}

function marketSignalsFallback() {
  return {
    marketRegime: 'Stable',
    marketStressScore: 0.42,
    company_return_90d: null,
    market_return_90d: null,
    relative_return_90d: null,
    company_volatility_90d: null,
    market_volatility_90d: null,
    india_vix: null,
    dataSource: 'fallback',
  };
}

const NSE_HEADERS = {
  'User-Agent': 'Mozilla/5.0',
  Accept: 'application/json,text/plain,*/*',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function warmNseCookie() {
  const response = await axios.get('https://www.nseindia.com', {
    timeout: 12000,
    headers: NSE_HEADERS,
  });
  const cookies = response?.headers?.['set-cookie'];
  if (!Array.isArray(cookies) || !cookies.length) {
    throw new Error('Unable to initialize NSE cookies');
  }
  nseCookieHeader = cookies.map((cookie) => String(cookie).split(';')[0]).join('; ');
  nseCookieTs = Date.now();
  return nseCookieHeader;
}

async function getNseCookieHeader(forceRefresh = false) {
  if (!forceRefresh && nseCookieHeader && (Date.now() - nseCookieTs) < NSE_COOKIE_TTL_MS) {
    return nseCookieHeader;
  }
  return warmNseCookie();
}

async function fetchNseJson(url, forceRefresh = false) {
  const cookieHeader = await getNseCookieHeader(forceRefresh);
  try {
    const response = await axios.get(url, {
      timeout: 12000,
      headers: {
        ...NSE_HEADERS,
        Referer: 'https://www.nseindia.com/',
        Cookie: cookieHeader,
      },
    });
    return response?.data;
  } catch (error) {
    const status = Number(error?.response?.status || 0);
    if ((status === 401 || status === 403) && !forceRefresh) {
      return fetchNseJson(url, true);
    }
    throw error;
  }
}

async function fetchFromNseApi(symbol) {
  const upperSymbol = String(symbol || '').trim().toUpperCase();
  if (!upperSymbol) {
    throw new Error('Missing symbol for NSE lookup');
  }

  const quote = await fetchNseJson(
    `https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(upperSymbol)}`
  );
  const allIndices = await fetchNseJson('https://www.nseindia.com/api/allIndices');

  const indices = Array.isArray(allIndices?.data) ? allIndices.data : [];
  const nifty = indices.find((item) => String(item?.indexSymbol || '').toUpperCase() === 'NIFTY 50') || {};
  const indiaVixRow = indices.find((item) => String(item?.indexSymbol || '').toUpperCase() === 'INDIA VIX') || {};

  const priceInfo = quote?.priceInfo || {};
  const industryInfo = quote?.industryInfo || {};

  const lastPrice = toNumber(priceInfo?.lastPrice);
  const dayChangePct = toNumber(priceInfo?.pChange, 0) || 0;
  const prevClose = toNumber(priceInfo?.previousClose);

  const weekHigh = toNumber(priceInfo?.weekHighLow?.max);
  const drawdownPct = weekHigh && lastPrice && weekHigh > 0
    ? ((weekHigh - lastPrice) / weekHigh) * 100
    : 0;

  const niftyDailyChange = toNumber(nifty?.percentChange, 0) || 0;
  const nifty30d = toNumber(nifty?.perChange30d, 0) || 0;
  const advances = toNumber(nifty?.advances, 0) || 0;
  const declines = toNumber(nifty?.declines, 0) || 0;
  const breadthRatio = (advances + declines) > 0 ? declines / (advances + declines) : 0.5;

  const companyReturn90d = dayChangePct * 6;
  const marketReturn90d = nifty30d * 3;
  const relativeReturn90d = companyReturn90d - marketReturn90d;

  const companyVolatility90d = Math.abs(dayChangePct) * 1.25 + Math.max(0, drawdownPct / 20);
  const marketVolatility90d = Math.abs(niftyDailyChange) * 1.8 + Math.max(0, (breadthRatio - 0.5) * 4);
  const indiaVix = toNumber(indiaVixRow?.last);

  const marketStressScore = computeMarketStress({
    companyReturn90d,
    marketReturn90d,
    relativeReturn90d,
    companyVolatility90d,
    marketVolatility90d,
    indiaVix,
  });

  const revenueGrowthPct = clamp(5 + (0.35 * companyReturn90d) + (0.15 * marketReturn90d), -12, 24);
  const profitMarginPct = clamp(10 + (0.25 * relativeReturn90d) + (0.05 * companyReturn90d), -8, 30);

  return {
    stockPriceChange: round(dayChangePct, 3),
    employees: null,
    sector: industryInfo?.sector || 'Technology',
    industry: industryInfo?.industry || industryInfo?.sector || 'Information Technology',
    financials: {
      revenueGrowth: round(revenueGrowthPct / 100, 4),
      profitMargin: round(profitMarginPct / 100, 4),
    },
    marketSignals: {
      marketRegime: classifyMarketRegime(marketStressScore),
      marketStressScore: round(marketStressScore, 4),
      company_return_90d: round(companyReturn90d, 3),
      market_return_90d: round(marketReturn90d, 3),
      relative_return_90d: round(relativeReturn90d, 3),
      company_volatility_90d: round(companyVolatility90d, 4),
      market_volatility_90d: round(marketVolatility90d, 4),
      india_vix: indiaVix === null ? null : round(indiaVix, 3),
      nse_index_price: toNumber(nifty?.last),
      company_last_price: lastPrice,
      company_previous_close: prevClose,
      market_breadth_ratio: round(breadthRatio, 4),
      benchmark_symbol: '^NSEI',
      company_symbol: `${upperSymbol}.NS`,
      market_universe: 'india',
      dataSource: 'nse_live_api',
      proxyMode: false,
      derived_window_estimate: true,
    },
  };
}

function fetchFromNsePython(symbol) {
  if (!ENABLE_NSE_PY_FALLBACK) {
    throw new Error('Python fallback disabled by ENABLE_NSE_PYTHON_FALLBACK=0');
  }
  if (!fs.existsSync(NSE_PY_SCRIPT)) {
    throw new Error(`Python fallback script not found: ${NSE_PY_SCRIPT}`);
  }

  const upperSymbol = String(symbol || '').trim().toUpperCase();
  const output = spawnSync('python3', [NSE_PY_SCRIPT, upperSymbol], {
    encoding: 'utf-8',
    timeout: 16000,
  });

  if (output.error) {
    throw output.error;
  }
  if (output.status !== 0) {
    const stderr = String(output.stderr || '').trim();
    throw new Error(stderr || 'python NSE fetch failed');
  }

  const text = String(output.stdout || '').trim();
  if (!text) {
    throw new Error('empty output from python NSE fetch');
  }

  const parsed = JSON.parse(text);
  if (!parsed?.marketSignals) {
    throw new Error('python NSE payload missing marketSignals');
  }
  return parsed;
}

async function fetchChart(symbol, range = '6mo', interval = '1d') {
  const cacheKey = `${symbol}:${range}:${interval}`;
  const cached = getFreshCache(cacheKey);
  if (cached) {
    return cached;
  }

  const urls = [
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`,
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`,
  ];
  let lastError = null;

  for (const url of urls) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await axios.get(url, {
          timeout: 10000,
          headers: YAHOO_HEADERS,
        });

        const result = response?.data?.chart?.result?.[0];
        if (!result) {
          throw new Error(`No chart result for ${symbol}`);
        }

        const closes = (result?.indicators?.quote?.[0]?.close || [])
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value));

        const meta = result.meta || {};
        const regularMarketPrice = Number(meta.regularMarketPrice);
        const previousClose = Number(meta.previousClose);
        const changePct =
          Number.isFinite(regularMarketPrice) && Number.isFinite(previousClose) && previousClose !== 0
            ? ((regularMarketPrice - previousClose) / previousClose) * 100
            : null;

        const output = {
          closes,
          regularMarketPrice: Number.isFinite(regularMarketPrice) ? regularMarketPrice : null,
          previousClose: Number.isFinite(previousClose) ? previousClose : null,
          changePct,
        };
        setCache(cacheKey, output);
        return output;
      } catch (error) {
        lastError = error;
        const status = Number(error?.response?.status || 0);
        if (status === 429 && attempt < 1) {
          await sleep(250 * (attempt + 1));
          continue;
        }
        break;
      }
    }
  }

  const stale = getStaleCache(cacheKey);
  if (stale) {
    return stale;
  }

  throw lastError || new Error(`Unable to fetch chart for ${symbol}`);
}

function buildStooqSymbol(symbol) {
  const raw = String(symbol || '').trim();
  const upper = raw.toUpperCase();

  const aliases = {
    '^IXIC': 'qqq.us',
    '^GSPC': 'spy.us',
    '^VIX': 'vxx.us',
  };

  if (aliases[upper]) {
    return aliases[upper];
  }

  if (raw.includes('.')) {
    return raw.toLowerCase();
  }

  if (upper.startsWith('^')) {
    return `${upper.replace('^', '').toLowerCase()}.us`;
  }

  return `${upper.toLowerCase()}.us`;
}

function parseStooqCsv(text) {
  const rows = String(text || '')
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (rows.length < 3 || rows[0].toLowerCase().includes('no data')) {
    throw new Error('No usable Stooq rows');
  }

  const closes = rows
    .slice(1)
    .map((line) => line.split(',')[4])
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (closes.length < 2) {
    throw new Error('Insufficient Stooq close history');
  }

  const recentCloses = closes.slice(-130);
  const regularMarketPrice = recentCloses[recentCloses.length - 1];
  const previousClose = recentCloses[recentCloses.length - 2];
  const changePct =
    Number.isFinite(regularMarketPrice) && Number.isFinite(previousClose) && previousClose !== 0
      ? ((regularMarketPrice - previousClose) / previousClose) * 100
      : null;

  return {
    closes: recentCloses,
    regularMarketPrice,
    previousClose,
    changePct,
  };
}

async function fetchStooqChart(symbol) {
  const stooqSymbol = buildStooqSymbol(symbol);
  const cacheKey = `stooq:${stooqSymbol}`;
  const cached = getFreshCache(cacheKey);
  if (cached) {
    return cached;
  }

  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(stooqSymbol)}&i=d`;
  const response = await axios.get(url, {
    timeout: 12000,
    headers: {
      ...YAHOO_HEADERS,
      Accept: 'text/csv,text/plain,*/*',
    },
    responseType: 'text',
  });

  const parsed = parseStooqCsv(response?.data || '');
  setCache(cacheKey, parsed);
  return parsed;
}

async function fetchFirstAvailableStooqChart(symbols = []) {
  let lastError = null;

  for (const candidate of symbols) {
    try {
      const chart = await fetchStooqChart(candidate);
      if (chart) {
        return { chart, symbol: candidate };
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  return { chart: null, symbol: null };
}

function proxyFinancialGrowth(companyReturn90d, marketReturn90d) {
  const growthPct = clamp(5 + (0.35 * Number(companyReturn90d || 0)) + (0.15 * Number(marketReturn90d || 0)), -12, 24);
  return round(growthPct / 100, 4);
}

function proxyProfitMargin(relativeReturn90d, companyReturn90d) {
  const marginPct = clamp(10 + (0.25 * Number(relativeReturn90d || 0)) + (0.05 * Number(companyReturn90d || 0)), -8, 30);
  return round(marginPct / 100, 4);
}

function resolveMarketPlan(symbol, options = {}) {
  const market = String(options.market || '').toUpperCase();

  if (market === 'US') {
    return {
      marketUniverse: 'us',
      companyChartSymbol: symbol,
      benchmarkSymbols: ['QQQ', 'SPY'],
      vixSymbol: 'VXX',
      indexPriceKey: 'us_index_price',
      useNsePythonFallback: false,
    };
  }

  if (market === 'GLOBAL') {
    return {
      marketUniverse: 'global',
      companyChartSymbol: symbol,
      benchmarkSymbols: ['SPY', 'QQQ'],
      vixSymbol: 'VXX',
      indexPriceKey: 'global_index_price',
      useNsePythonFallback: false,
    };
  }

  return {
    marketUniverse: 'india',
    companyChartSymbol: `${symbol}.NS`,
    benchmarkSymbols: ['^NSEI'],
    vixSymbol: '^INDIAVIX',
    indexPriceKey: 'nse_index_price',
    useNsePythonFallback: true,
  };
}

async function fetchFirstAvailableChart(symbols = []) {
  let lastError = null;

  for (const candidate of symbols) {
    try {
      const chart = await fetchChart(candidate);
      if (chart) {
        return { chart, symbol: candidate };
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  return { chart: null, symbol: null };
}

export const getCompanyStats = async (symbol, options = {}) => {
  const marketPlan = resolveMarketPlan(symbol, options);

  try {
    let companyChart = await fetchChart(marketPlan.companyChartSymbol).catch(() => null);
    await sleep(120);
    let { chart: marketChart, symbol: benchmarkSymbol } = await fetchFirstAvailableChart(marketPlan.benchmarkSymbols)
      .catch(() => ({ chart: null, symbol: null }));
    await sleep(120);
    let vixChart = marketPlan.vixSymbol ? await fetchChart(marketPlan.vixSymbol).catch(() => null) : null;
    let dataSource = 'yahoo_chart_api';

    if (marketPlan.marketUniverse !== 'india' && (!companyChart || !marketChart)) {
      if (!companyChart) {
        companyChart = await fetchStooqChart(marketPlan.companyChartSymbol).catch(() => null);
      }
      if (!marketChart) {
        const stooqMarket = await fetchFirstAvailableStooqChart(marketPlan.benchmarkSymbols)
          .catch(() => ({ chart: null, symbol: null }));
        marketChart = stooqMarket.chart;
        benchmarkSymbol = stooqMarket.symbol || benchmarkSymbol;
      }
      if (!vixChart && marketPlan.vixSymbol) {
        const stooqVix = await fetchFirstAvailableStooqChart([marketPlan.vixSymbol])
          .catch(() => ({ chart: null, symbol: null }));
        vixChart = stooqVix.chart;
      }
      if (companyChart || marketChart) {
        dataSource = 'stooq_daily_api';
      }
    }

    if (!companyChart && !marketChart) {
      throw new Error('Unable to fetch required market charts');
    }

    const companyClose = companyChart?.closes || [];
    const marketClose = marketChart?.closes || [];

    const companyReturn90d = computeReturnPct(companyClose);
    const marketReturn90d = computeReturnPct(marketClose);
    const relativeReturn90d =
      Number.isFinite(companyReturn90d) && Number.isFinite(marketReturn90d)
        ? companyReturn90d - marketReturn90d
        : null;

    const companyVol90d = computeDailyVolatility(companyClose);
    const marketVol90d = computeDailyVolatility(marketClose);

    const indiaVix = Number(vixChart?.regularMarketPrice);

    const marketStressScore = computeMarketStress({
      companyReturn90d,
      marketReturn90d,
      relativeReturn90d,
      companyVolatility90d: companyVol90d,
      marketVolatility90d: marketVol90d,
      indiaVix,
    });

    return {
      stockPriceChange: companyChart?.changePct ?? companyReturn90d,
      employees: null,
      sector: 'Technology',
      industry: 'Information Technology',
      financials: {
        revenueGrowth: proxyFinancialGrowth(companyReturn90d, marketReturn90d),
        profitMargin: proxyProfitMargin(relativeReturn90d, companyReturn90d),
      },
      marketSignals: {
        marketRegime: classifyMarketRegime(marketStressScore),
        marketStressScore,
        company_return_90d: Number.isFinite(companyReturn90d) ? round(companyReturn90d, 3) : null,
        market_return_90d: Number.isFinite(marketReturn90d) ? round(marketReturn90d, 3) : null,
        relative_return_90d: Number.isFinite(relativeReturn90d) ? round(relativeReturn90d, 3) : null,
        company_volatility_90d: Number.isFinite(companyVol90d) ? round(companyVol90d, 4) : null,
        market_volatility_90d: Number.isFinite(marketVol90d) ? round(marketVol90d, 4) : null,
        india_vix: Number.isFinite(indiaVix) ? round(indiaVix, 3) : null,
        company_last_price: Number(companyChart?.regularMarketPrice) || null,
        company_previous_close: Number(companyChart?.previousClose) || null,
        benchmark_symbol: benchmarkSymbol || marketPlan.benchmarkSymbols[0] || null,
        company_symbol: marketPlan.companyChartSymbol,
        market_universe: marketPlan.marketUniverse,
        [marketPlan.indexPriceKey]: Number(marketChart?.regularMarketPrice) || null,
        proxyMode: false,
        dataSource,
      },
    };
  } catch (error) {
    if (marketPlan.useNsePythonFallback) {
      try {
        return await fetchFromNseApi(symbol);
      } catch (nseApiError) {
        try {
          return fetchFromNsePython(symbol);
        } catch (nsePyError) {
        console.error('Live market data fetch error:', error.message);
          console.error('NSE API fallback error:', nseApiError.message);
          console.error('NSE Python fallback error:', nsePyError.message);
        return {
          stockPriceChange: null,
          employees: null,
          sector: 'Technology',
          industry: 'Information Technology',
          financials: {
            revenueGrowth: null,
            profitMargin: null,
          },
          marketSignals: {
            ...marketSignalsFallback(),
            market_universe: marketPlan.marketUniverse,
          },
          error: 'Detailed market data temporarily unavailable',
        };
        }
      }
    }

    console.error('Live market data fetch error:', error.message);
    return {
      stockPriceChange: null,
      employees: null,
      sector: 'Technology',
      industry: 'Information Technology',
      financials: {
        revenueGrowth: null,
        profitMargin: null,
      },
      marketSignals: {
        ...marketSignalsFallback(),
        market_universe: marketPlan.marketUniverse,
      },
      error: 'Detailed market data temporarily unavailable',
    };
  }
};
