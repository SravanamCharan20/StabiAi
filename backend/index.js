import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import { resolveCompanySymbol } from './controllers/employee/SymbolConvertor.js';
import { getCompanyStats } from './controllers/employee/compantStats.js';
import getSuggestions from './controllers/employee/suggestionController.js';
import { buildAndPredict, getEmployeeInputSpec, getRiskModelMetadata } from './services/employeeRiskEngine.js';
import { evaluateEmployeeModel } from './services/employeeEvaluationService.js';
import {
  createPredictionHistoryEntry,
  listPredictionHistory,
  summarizeHistoryTrend,
  updatePredictionActions,
  updatePredictionReview,
} from './services/employeeHistoryService.js';

dotenv.config();

const PORT = process.env.PORT || 9000;
const rawCorsOrigins = process.env.CORS_ORIGINS || '';
const DEFAULT_CORS_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  'https://stabi-ai.vercel.app',
  'https://*.vercel.app',
];
const allowedCorsOrigins = [...new Set([
  ...DEFAULT_CORS_ORIGINS,
  ...rawCorsOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean),
])];

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wildcardToRegExp = (rule) => new RegExp(`^${escapeRegExp(rule).replace(/\\\*/g, '.*')}$`);
const corsMatchers = allowedCorsOrigins.map((origin) => ({
  raw: origin,
  matcher: origin.includes('*') ? wildcardToRegExp(origin) : origin,
}));

const isOriginAllowed = (origin) => {
  if (!origin) {
    return true;
  }
  if (!corsMatchers.length) {
    return true;
  }
  return corsMatchers.some(({ matcher }) => (
    typeof matcher === 'string' ? matcher === origin : matcher.test(origin)
  ));
};

const app = express();
app.use(express.json());
app.use(cors({
  origin: (origin, callback) => {
    return callback(null, isOriginAllowed(origin));
  },
}));

const getSpecOptions = (fieldName) => {
  const spec = getEmployeeInputSpec();
  const options = spec?.fields?.[fieldName]?.options;
  return Array.isArray(options) ? options : [];
};

const isAllowedValue = (fieldName, value) => {
  const options = getSpecOptions(fieldName);
  if (!options.length) {
    return true;
  }
  return options.includes(value);
};

app.get('/', (req, res) => {
  res.send('StabiAI Employee API is running');
});

app.get('/api/employee/model-meta', (req, res) => {
  try {
    const metadata = getRiskModelMetadata();
    return res.status(200).json({ success: true, metadata });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to load employee model metadata',
      error: error.message,
    });
  }
});

app.get('/api/employee/input-spec', (req, res) => {
  try {
    const spec = getEmployeeInputSpec();
    const companyOptions = Array.isArray(spec?.fields?.company_name?.options)
      ? [...new Set(spec.fields.company_name.options)].sort((a, b) => a.localeCompare(b))
      : [];

    const resolvedCompanies = companyOptions.map((name) => ({
      name,
      ...resolveCompanySymbol(name),
    }));

    const directCompanies = resolvedCompanies
      .filter((item) => item.mappingType !== 'market_equivalent')
      .map((item) => item.name);
    const equivalentCompanies = resolvedCompanies
      .filter((item) => item.mappingType === 'market_equivalent')
      .map((item) => item.name);

    spec.fields.company_name.options = companyOptions;
    spec.fields.company_name.direct_companies = directCompanies;
    spec.fields.company_name.market_equivalent_companies = equivalentCompanies;
    spec.fields.company_name.allow_custom_symbol_input = false;

    return res.status(200).json({ success: true, spec });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to load employee input specification',
      error: error.message,
    });
  }
});

app.get('/api/employee/eval', (req, res) => {
  try {
    const force = req.query.force === '1' || req.query.force === 'true';
    const sampleSize = Number(req.query.sample_size);
    const report = evaluateEmployeeModel({
      force,
      sampleSize: Number.isFinite(sampleSize) && sampleSize > 0 ? sampleSize : null,
    });

    return res.status(200).json({ success: true, report });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to compute employee model evaluation',
      error: error.message,
    });
  }
});

const normalizePercentMetric = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return Math.abs(parsed) <= 1 ? parsed * 100 : parsed;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const round = (value, digits = 4) => {
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
};

const mapSectorToTrainingIndustry = (sectorOrIndustry) => {
  const value = String(sectorOrIndustry || '').toLowerCase();

  if (value.includes('bank') || value.includes('financial') || value.includes('fintech')) {
    return 'Financial Services';
  }
  if (value.includes('telecom')) {
    return 'Telecommunications';
  }
  if (value.includes('retail') || value.includes('e-commerce') || value.includes('internet')) {
    return 'E-commerce';
  }
  if (value.includes('health') || value.includes('pharma') || value.includes('biotech')) {
    return 'Healthcare';
  }
  if (value.includes('manufactur') || value.includes('auto') || value.includes('industrial')) {
    return 'Manufacturing';
  }
  if (value.includes('consult') || value.includes('professional services')) {
    return 'Consulting';
  }
  return 'Information Technology';
};

const deriveMarketContext = (companyStats) => {
  const marketSignals = companyStats?.marketSignals || {};
  const stressRaw = Number(marketSignals.marketStressScore);
  const stress = Number.isFinite(stressRaw) ? clamp(stressRaw, 0, 1) : 0.42;

  const marketRegime =
    marketSignals.marketRegime
    || (stress >= 0.72 ? 'Recession' : stress >= 0.52 ? 'Recovery' : stress >= 0.32 ? 'Stable' : 'Growth');

  const relativeReturn90d = Number(marketSignals.relative_return_90d || 0);
  const marketReturn90d = Number(marketSignals.market_return_90d || 0);
  const indiaVix = Number(marketSignals.india_vix || 0);
  const industry = mapSectorToTrainingIndustry(companyStats?.industry || companyStats?.sector);
  const pastLayoffs = stress >= 0.62 || relativeReturn90d < -10 ? 'Yes' : 'No';

  const unemploymentRate = clamp(
    5.4 + (stress * 2.4) + (marketReturn90d < -5 ? 0.2 : 0),
    4.0,
    9.8
  );
  const inflationRate = clamp(
    4.3 + (stress * 1.6) + (indiaVix > 20 ? 0.2 : 0),
    3.1,
    8.2
  );
  const industryLayoffRate = clamp(
    1.0 + (stress * 2.9) + (relativeReturn90d < -8 ? 0.35 : 0),
    0.35,
    5.8
  );

  return {
    marketRegime,
    stress,
    industry,
    pastLayoffs,
    unemploymentRate,
    inflationRate,
    industryLayoffRate,
  };
};

const assessPredictionReliability = (prediction = {}, marketSignals = null) => {
  const confidenceRaw = Number(prediction?.confidence);
  const confidence = Number.isFinite(confidenceRaw) ? clamp(confidenceRaw, 0, 1) : 0.5;
  const source = String(marketSignals?.dataSource || 'unavailable');
  const mappingType = String(marketSignals?.market_mapping_type || 'direct_listing');
  const usingFallbackDefaults = source === 'fallback' || source === 'unavailable';

  let marketDataStatus = 'fallback_defaults';
  let marketDataScore = 0.35;
  if (!usingFallbackDefaults && (source === 'yahoo_chart_api' || source === 'stooq_daily_api')) {
    marketDataStatus = 'live_market';
    marketDataScore = 0.9;
  } else if (!usingFallbackDefaults && source === 'nse_live_api') {
    marketDataStatus = 'live_market';
    marketDataScore = 0.84;
  } else if (!usingFallbackDefaults) {
    marketDataStatus = 'live_market';
    marketDataScore = 0.78;
  }

  const mappingScore = mappingType === 'market_equivalent' ? 0.9 : mappingType === 'user_ticker' ? 0.93 : 1.0;
  const score = clamp((confidence * 0.58) + (marketDataScore * 0.32) + (mappingScore * 0.1), 0, 1);

  let gate = 'medium';
  let message = 'Prediction quality is acceptable for trend-level decisions.';
  if (usingFallbackDefaults) {
    gate = 'warning';
    message = 'Live market feed is temporarily unavailable. Core role, tech-stack, and department signals are active; market context is estimated.';
  } else if (score >= 0.72 && confidence >= 0.6) {
    gate = 'high';
    message = mappingType === 'market_equivalent'
      ? 'Prediction reliability is high with live market data and calibrated market-equivalent mapping.'
      : 'Prediction reliability is high with live market data and strong model confidence.';
  } else if (score < 0.62 || confidence < 0.55) {
    gate = 'medium';
    message = 'Model confidence is moderate. Use this result as a directional signal and validate with role-specific context.';
  } else if (mappingType === 'market_equivalent') {
    gate = 'medium';
    message = 'Live market feed is connected. This company is evaluated using a calibrated market-equivalent benchmark.';
  } else if (source === 'nse_live_api') {
    gate = 'medium';
    message = 'Live NSE market data is active; reliability can increase further with stronger model confidence.';
  }

  return {
    gate,
    score: round(score, 4),
    model_confidence: round(confidence, 4),
    market_data_score: round(marketDataScore, 4),
    market_data_status: marketDataStatus,
    source,
    market_mapping_type: mappingType,
    data_mode: usingFallbackDefaults ? 'fallback' : 'live',
    used_fallback_defaults: usingFallbackDefaults,
    message,
    checked_at_utc: new Date().toISOString(),
  };
};

const getRiskRank = (riskLabel) => {
  const risk = String(riskLabel || '').toLowerCase().trim();
  if (risk === 'high') {
    return 3;
  }
  if (risk === 'medium') {
    return 2;
  }
  if (risk === 'low') {
    return 1;
  }
  return 0;
};

const buildDefaultActionTracker = (prediction = {}) => {
  const tips = Array.isArray(prediction?.improvement_tips) ? prediction.improvement_tips : [];
  return tips
    .slice(0, 3)
    .map((tip, idx) => ({
      id: `tip-${idx + 1}`,
      title: String(tip || '').trim(),
      detail: 'Model-generated action item',
      status: 'not_started',
    }))
    .filter((item) => item.title);
};

const extractMarketContextFromReference = (referencePrediction = {}) => {
  const source = referencePrediction?.data || {};
  return {
    economic_condition_tag: source.economic_condition_tag,
    past_layoffs: source.past_layoffs,
    industry: source.industry,
    revenue_growth: normalizePercentMetric(source.revenue_growth),
    profit_margin: normalizePercentMetric(source.profit_margin),
    stock_price_change: normalizePercentMetric(source.stock_price_change),
    total_employees: source.total_employees,
    industry_layoff_rate: source.industry_layoff_rate,
    unemployment_rate: source.unemployment_rate,
    inflation_rate: source.inflation_rate,
    market_signals: referencePrediction?.market_signals || null,
  };
};

const toHistoryResponseEntry = (entry = {}) => ({
  run_id: entry.run_id || null,
  created_at_utc: entry.created_at_utc || null,
  updated_at_utc: entry.updated_at_utc || null,
  employee_profile: entry.employee_profile || {},
  normalized_input: entry.normalized_input || {},
  feature_vector: entry.feature_vector || {},
  prediction: entry.prediction || {},
  stack_survival: entry.stack_survival || null,
  market_signals: entry.market_signals || null,
  reliability: entry.reliability || {},
  review: entry.review || null,
  action_tracker: Array.isArray(entry.action_tracker) ? entry.action_tracker : [],
});

app.post('/api/employee/predict', async (req, res) => {
  try {
    const {
      company_name,
      company_location,
      reporting_quarter,
      job_title,
      tech_stack,
      department,
      remote_work,
      years_at_company,
      salary_range,
      performance_rating,
    } = req.body;

    if (!company_name) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }
    if (!job_title) {
      return res.status(400).json({ success: false, message: 'Job title is required' });
    }
    if (!tech_stack) {
      return res.status(400).json({ success: false, message: 'Tech stack is required' });
    }
    if (!department) {
      return res.status(400).json({ success: false, message: 'Department is required' });
    }

    if (!isAllowedValue('company_name', company_name)) {
      return res.status(400).json({ success: false, message: 'Select a valid company name from the list' });
    }
    if (!isAllowedValue('company_location', company_location)) {
      return res.status(400).json({ success: false, message: 'Select a valid location from the list' });
    }
    if (!isAllowedValue('reporting_quarter', reporting_quarter)) {
      return res.status(400).json({ success: false, message: 'Select a valid reporting quarter from the list' });
    }
    if (!isAllowedValue('job_title', job_title)) {
      return res.status(400).json({ success: false, message: 'Select a valid job title from the list' });
    }
    if (!isAllowedValue('tech_stack', tech_stack)) {
      return res.status(400).json({ success: false, message: 'Select a valid tech stack from the list' });
    }
    if (!isAllowedValue('department', department)) {
      return res.status(400).json({ success: false, message: 'Select a valid department from the list' });
    }
    if (!isAllowedValue('remote_work', remote_work)) {
      return res.status(400).json({ success: false, message: 'Select valid remote work status (Yes/No)' });
    }

    const userData = {
      company_name,
      company_location,
      reporting_quarter,
      job_title,
      tech_stack,
      department,
      remote_work,
      years_at_company,
      salary_range,
      performance_rating,
    };

    let marketContext = {};
    try {
      const resolution = resolveCompanySymbol(company_name);
      const companyStats = await getCompanyStats(resolution.symbol, resolution);
      const derived = deriveMarketContext(companyStats);

      const revenueGrowth = normalizePercentMetric(companyStats?.financials?.revenueGrowth);
      const profitMargin = normalizePercentMetric(companyStats?.financials?.profitMargin);
      const stockPriceChange = normalizePercentMetric(
        companyStats?.stockPriceChange ?? companyStats?.marketSignals?.company_return_90d
      );

      marketContext = {
        economic_condition_tag: derived.marketRegime,
        past_layoffs: derived.pastLayoffs,
        industry: derived.industry,
        revenue_growth: revenueGrowth,
        profit_margin: profitMargin,
        stock_price_change: stockPriceChange,
        total_employees: companyStats?.employees,
        industry_layoff_rate: derived.industryLayoffRate,
        unemployment_rate: derived.unemploymentRate,
        inflation_rate: derived.inflationRate,
        market_signals: companyStats?.marketSignals
          ? {
              ...companyStats.marketSignals,
              symbol_used: resolution.symbol,
              symbol_resolution: resolution.reason,
              market_mapping_type: resolution.mappingType || (resolution.isProxy ? 'market_equivalent' : 'direct_listing'),
              market_mapping_reason: resolution.reason,
            }
          : null,
      };
    } catch (error) {
      console.warn('Unable to enrich employee prediction with market stats:', error.message);
    }

    const modelResult = buildAndPredict(userData, marketContext);
    const reliability = assessPredictionReliability(modelResult?.prediction, marketContext.market_signals || null);
    let historyEntry = null;
    try {
      historyEntry = createPredictionHistoryEntry({
        employee_profile: userData,
        normalized_input: modelResult.normalized_input,
        feature_vector: modelResult.features,
        prediction: modelResult.prediction,
        stack_survival: modelResult.stack_survival || null,
        market_signals: marketContext.market_signals || null,
        reliability,
        action_tracker: buildDefaultActionTracker(modelResult.prediction),
      });
    } catch (historyError) {
      console.warn('Unable to persist employee prediction history:', historyError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Employee layoff risk predicted successfully',
      run_id: historyEntry?.run_id || null,
      normalized_input: modelResult.normalized_input,
      data: modelResult.features,
      prediction: modelResult.prediction,
      stack_survival: modelResult.stack_survival || null,
      market_signals: marketContext.market_signals || null,
      reliability,
      history_entry: historyEntry ? toHistoryResponseEntry(historyEntry) : null,
    });
  } catch (error) {
    console.error('Error processing employee prediction request:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

app.post('/api/employee/what-if', (req, res) => {
  try {
    const { employeeData, referencePrediction } = req.body || {};
    if (!employeeData || typeof employeeData !== 'object') {
      return res.status(400).json({ success: false, message: 'employeeData is required' });
    }
    if (!employeeData.company_name) {
      return res.status(400).json({ success: false, message: 'employeeData.company_name is required' });
    }

    const marketContext = extractMarketContextFromReference(referencePrediction || {});
    const scenarioResult = buildAndPredict(employeeData, marketContext);

    const baselinePrediction = referencePrediction?.prediction || {};
    const baselineRiskScore = Number(baselinePrediction.risk_score);
    const scenarioRiskScore = Number(scenarioResult?.prediction?.risk_score);
    const baselineConfidence = Number(baselinePrediction.confidence);
    const scenarioConfidence = Number(scenarioResult?.prediction?.confidence);
    const riskScoreDelta = Number.isFinite(baselineRiskScore) && Number.isFinite(scenarioRiskScore)
      ? round(scenarioRiskScore - baselineRiskScore, 3)
      : null;
    const confidenceDelta = Number.isFinite(baselineConfidence) && Number.isFinite(scenarioConfidence)
      ? round(scenarioConfidence - baselineConfidence, 4)
      : null;

    const riskFrom = baselinePrediction.layoff_risk || null;
    const riskTo = scenarioResult?.prediction?.layoff_risk || null;
    const fromRank = getRiskRank(riskFrom);
    const toRank = getRiskRank(riskTo);
    const riskDirection = fromRank === toRank ? 'flat' : toRank > fromRank ? 'up' : 'down';
    const narrative = riskDirection === 'flat'
      ? 'Scenario keeps risk in the same band. Focus on confidence and top factors.'
      : riskDirection === 'down'
        ? 'Scenario moves risk toward a safer band. This is a positive directional shift.'
        : 'Scenario moves risk toward a higher-risk band. Additional controls are recommended.';

    return res.status(200).json({
      success: true,
      scenario: {
        normalized_input: scenarioResult.normalized_input,
        data: scenarioResult.features,
        prediction: scenarioResult.prediction,
        stack_survival: scenarioResult.stack_survival || null,
        market_signals: referencePrediction?.market_signals || marketContext.market_signals || null,
      },
      delta: {
        risk_from: riskFrom,
        risk_to: riskTo,
        risk_direction: riskDirection,
        risk_score_delta: riskScoreDelta,
        confidence_delta: confidenceDelta,
        narrative,
      },
    });
  } catch (error) {
    console.error('Error running employee what-if simulation:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'What-if simulation failed' });
  }
});

app.get('/api/employee/history', (req, res) => {
  try {
    const companyName = String(req.query.company_name || '').trim();
    const limit = Number(req.query.limit || 20);
    const entries = listPredictionHistory({
      company_name: companyName,
      limit,
    });
    const trend = summarizeHistoryTrend(entries);

    return res.status(200).json({
      success: true,
      company_name: companyName || null,
      entries: entries.map((entry) => toHistoryResponseEntry(entry)),
      trend,
    });
  } catch (error) {
    console.error('Error fetching prediction history:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch prediction history',
      error: error.message,
    });
  }
});

app.post('/api/employee/history/:runId/review', (req, res) => {
  try {
    const runId = String(req.params.runId || '').trim();
    const reviewedBy = String(req.body?.reviewed_by || '').trim();
    const reviewReason = String(req.body?.review_reason || '').trim();
    const decision = String(req.body?.decision || '').trim() || 'review_completed';

    if (!runId) {
      return res.status(400).json({ success: false, message: 'runId is required' });
    }
    if (!reviewedBy) {
      return res.status(400).json({ success: false, message: 'reviewed_by is required' });
    }
    if (!reviewReason) {
      return res.status(400).json({ success: false, message: 'review_reason is required' });
    }

    const updated = updatePredictionReview(runId, {
      reviewed_by: reviewedBy,
      review_reason: reviewReason,
      decision,
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'History entry not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Review note saved',
      entry: toHistoryResponseEntry(updated),
    });
  } catch (error) {
    console.error('Error saving prediction review:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Unable to save review note' });
  }
});

app.post('/api/employee/history/:runId/actions', (req, res) => {
  try {
    const runId = String(req.params.runId || '').trim();
    const actions = Array.isArray(req.body?.actions) ? req.body.actions : [];

    if (!runId) {
      return res.status(400).json({ success: false, message: 'runId is required' });
    }
    if (!actions.length) {
      return res.status(400).json({ success: false, message: 'actions array is required' });
    }

    const updated = updatePredictionActions(runId, actions);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'History entry not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Action tracker saved',
      entry: toHistoryResponseEntry(updated),
    });
  } catch (error) {
    console.error('Error saving action tracker:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Unable to save action tracker' });
  }
});

app.post('/api/suggestions', async (req, res) => {
  try {
    const { employeeData, predictionData } = req.body;
    if (!employeeData || !predictionData) {
      throw new Error('Missing employeeData or predictionData');
    }
    if (!predictionData.prediction || !predictionData.prediction.layoff_risk) {
      throw new Error('Invalid predictionData: missing prediction.layoff_risk');
    }

    const userData = {
      ...employeeData,
      layoff_risk: predictionData.prediction.layoff_risk,
    };
    const suggestions = await getSuggestions(userData, predictionData);
    return res.json({ success: true, suggestions });
  } catch (error) {
    console.error('Error generating employee suggestions:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
});

if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error.message);
    });
} else {
  console.warn('MONGO_URI is not set. Running without MongoDB connection.');
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
