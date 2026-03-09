import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACT_PATH = path.resolve(__dirname, '../data/employee_risk_artifacts.json');

const PERCENT_FEATURES = new Set(['revenue_growth', 'profit_margin', 'stock_price_change']);

const FEATURE_LABELS = {
  company_name: 'Company',
  company_location: 'Location',
  reporting_quarter: 'Reporting Quarter',
  economic_condition_tag: 'Economic Condition',
  past_layoffs: 'Past Layoffs',
  job_title: 'Job Title',
  tech_stack: 'Tech Stack',
  department: 'Department',
  remote_work: 'Remote Work',
  industry: 'Industry',
  revenue_growth: 'Revenue Growth',
  profit_margin: 'Profit Margin',
  stock_price_change: 'Stock Price Change',
  total_employees: 'Total Employees',
  role_demand_index: 'Role Demand Index',
  department_resilience_index: 'Department Resilience Index',
  tech_stack_trend_score: 'Tech Stack Trend Score',
  years_at_company: 'Years at Company',
  salary_range: 'Salary',
  performance_rating: 'Performance Rating',
  industry_layoff_rate: 'Industry Layoff Rate',
  unemployment_rate: 'Unemployment Rate',
  inflation_rate: 'Inflation Rate',
  employee_stability: 'Employee Stability',
  economic_pressure: 'Economic Pressure',
};

const CONTROLLABLE_TIPS = {
  performance_rating: 'Improve your performance score by setting measurable quarterly targets with your manager.',
  years_at_company: 'Increase internal visibility with one high-impact project and weekly progress updates.',
  salary_range: 'Document measurable value delivered so compensation is clearly tied to outcomes.',
  remote_work: 'Use a structured weekly update cadence to improve visibility in distributed teams.',
  job_title: 'Add one adjacent in-demand skill to improve mobility across teams.',
  tech_stack: 'Keep your stack current: add one market-in-demand tool or framework this quarter.',
  department: 'Build cross-functional projects so your role is linked to broader business outcomes.',
  role_demand_index: 'Prioritize projects tied to current hiring demand in your role track.',
  department_resilience_index: 'Contribute to initiatives that make your department revenue-critical and hard to downsize.',
  tech_stack_trend_score: 'Shift from legacy tooling to AI/cloud automation stack over the next quarter.',
  economic_pressure: 'Focus on cost-saving or efficiency improvements that protect your role during pressure periods.',
  past_layoffs: 'Prepare an internal mobility plan and build relationships with adjacent teams.',
};

let artifacts = null;
let initialized = false;

const companyDefaultsByName = new Map();
const industryDefaultsByName = new Map();
const quarterDefaultsByQuarter = new Map();
const roleDefaultsByTitle = new Map();
const departmentDefaultsByName = new Map();
const stackDefaultsByName = new Map();

const averageCategoricalRisk = {};

const SEMANTIC_NUMERIC_DIRECTION = {
  revenue_growth: -1,
  profit_margin: -1,
  stock_price_change: -1,
  role_demand_index: -1,
  department_resilience_index: -1,
  tech_stack_trend_score: -1,
  years_at_company: -1,
  performance_rating: -1,
  employee_stability: -1,
  industry_layoff_rate: 1,
  unemployment_rate: 1,
  inflation_rate: 1,
  economic_pressure: 1,
};

function round(value, digits = 4) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeLoose(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function gaussianLogPdf(x, mean, std) {
  const variance = std * std;
  return -0.5 * Math.log(2 * Math.PI * variance) - ((x - mean) ** 2) / (2 * variance);
}

function softmax(logits) {
  const maxLogit = Math.max(...logits);
  const exps = logits.map((v) => Math.exp(v - maxLogit));
  const sum = exps.reduce((acc, v) => acc + v, 0);
  return exps.map((v) => v / (sum || 1));
}

function ensureArtifactsLoaded() {
  if (initialized) {
    return;
  }

  if (!fs.existsSync(ARTIFACT_PATH)) {
    throw new Error(
      `Employee risk artifacts not found at ${ARTIFACT_PATH}. Run backend/ml/generate_enhanced_dataset.py and backend/ml/train_risk_engine_artifacts.py first.`
    );
  }

  const raw = fs.readFileSync(ARTIFACT_PATH, 'utf-8');
  artifacts = JSON.parse(raw);

  for (const row of artifacts.profiles.company_defaults || []) {
    companyDefaultsByName.set(row.company_name, row);
  }

  for (const row of artifacts.profiles.industry_defaults || []) {
    industryDefaultsByName.set(row.industry, row);
  }

  for (const row of artifacts.profiles.quarter_defaults || []) {
    quarterDefaultsByQuarter.set(row.reporting_quarter, row);
  }

  for (const row of artifacts.profiles.role_defaults || []) {
    roleDefaultsByTitle.set(row.job_title, row);
  }

  for (const row of artifacts.profiles.department_defaults || []) {
    departmentDefaultsByName.set(row.department, row);
  }

  for (const row of artifacts.profiles.stack_defaults || []) {
    stackDefaultsByName.set(row.tech_stack, row);
  }

  for (const [feature, values] of Object.entries(artifacts.profiles.categorical_risk || {})) {
    const allValues = Object.values(values || {});
    averageCategoricalRisk[feature] =
      allValues.length > 0
        ? allValues.reduce((acc, v) => acc + Number(v || 0), 0) / allValues.length
        : 1.0;
  }

  initialized = true;
}

function normalizeAliasGroup(group, value, fallback) {
  const aliases = artifacts.aliases?.[group] || {};
  const raw = String(value || '').trim();
  if (!raw) {
    return fallback;
  }

  const exact = aliases[raw.toLowerCase()];
  if (exact) {
    return exact;
  }

  const loose = aliases[normalizeLoose(raw)];
  if (loose) {
    return loose;
  }

  return raw;
}

function normalizeCategoryFeature(feature, value) {
  const fallback = artifacts.global_defaults.categorical_modes[feature] || 'unknown';

  if (feature === 'company_name') {
    return normalizeAliasGroup('company', value, fallback);
  }

  if (feature === 'company_location') {
    return normalizeAliasGroup('location', value, fallback);
  }

  if (feature === 'reporting_quarter') {
    return normalizeAliasGroup('reporting_quarter', value, fallback);
  }

  if (feature === 'job_title') {
    return normalizeAliasGroup('job_title', value, fallback);
  }

  if (feature === 'department') {
    return normalizeAliasGroup('department', value, fallback);
  }

  if (feature === 'tech_stack') {
    return normalizeAliasGroup('tech_stack', value, fallback);
  }

  if (feature === 'remote_work') {
    return normalizeAliasGroup('remote_work', value, fallback);
  }

  const text = String(value || '').trim();
  return text || fallback;
}

function parseNumber(value, fallback, featureName) {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'string' && value.trim() === '') {
    return fallback;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  if (PERCENT_FEATURES.has(featureName) && Math.abs(numeric) <= 1.2) {
    return numeric * 100;
  }

  return numeric;
}

function normalizeSalaryRange(value, fallback) {
  const parsed = parseNumber(value, fallback, 'salary_range');

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  // Most UI users enter salary in LPA (e.g., 12, 18). Convert to annual INR.
  if (parsed > 0 && parsed <= 250) {
    return parsed * 100000;
  }

  // If value looks like monthly INR, annualize it.
  if (parsed >= 25000 && parsed < 300000) {
    return parsed * 12;
  }

  return parsed;
}

function normalizeUserInput(employeeInput = {}) {
  ensureArtifactsLoaded();

  return {
    company_name: normalizeCategoryFeature('company_name', employeeInput.company_name),
    company_location: normalizeCategoryFeature('company_location', employeeInput.company_location),
    reporting_quarter: normalizeCategoryFeature('reporting_quarter', employeeInput.reporting_quarter),
    job_title: normalizeCategoryFeature('job_title', employeeInput.job_title),
    tech_stack: normalizeCategoryFeature('tech_stack', employeeInput.tech_stack),
    department: normalizeCategoryFeature('department', employeeInput.department),
    remote_work: normalizeCategoryFeature('remote_work', employeeInput.remote_work),
    years_at_company: parseNumber(
      employeeInput.years_at_company,
      artifacts.global_defaults.numerical_medians.years_at_company,
      'years_at_company'
    ),
    salary_range: parseNumber(
      normalizeSalaryRange(
        employeeInput.salary_range,
        artifacts.global_defaults.numerical_medians.salary_range
      ),
      artifacts.global_defaults.numerical_medians.salary_range,
      'salary_range'
    ),
    performance_rating: clamp(
      parseNumber(
        employeeInput.performance_rating,
        artifacts.global_defaults.numerical_medians.performance_rating,
        'performance_rating'
      ),
      1,
      5
    ),
  };
}

export function canonicalizeEmployeeInput(employeeInput = {}) {
  return normalizeUserInput(employeeInput);
}

function getCategoryValues(feature) {
  ensureArtifactsLoaded();

  const likelihoodByClass = artifacts.categorical_likelihoods?.[feature] || {};
  const values = new Set();

  for (const classLikelihood of Object.values(likelihoodByClass)) {
    for (const key of Object.keys(classLikelihood || {})) {
      if (key === '__default__') {
        continue;
      }
      values.add(key);
    }
  }

  return [...values].sort((a, b) => a.localeCompare(b));
}

export function getEmployeeInputSpec() {
  ensureArtifactsLoaded();

  return {
    fields: {
      company_name: {
        type: 'select',
        required: true,
        options: getCategoryValues('company_name'),
      },
      company_location: {
        type: 'select',
        required: true,
        options: getCategoryValues('company_location'),
      },
      reporting_quarter: {
        type: 'select',
        required: true,
        options: getCategoryValues('reporting_quarter'),
      },
      job_title: {
        type: 'select',
        required: true,
        options: getCategoryValues('job_title'),
      },
      tech_stack: {
        type: 'select',
        required: true,
        options: getCategoryValues('tech_stack'),
      },
      department: {
        type: 'select',
        required: true,
        options: getCategoryValues('department'),
      },
      remote_work: {
        type: 'select',
        required: true,
        options: ['Yes', 'No'],
      },
      years_at_company: {
        type: 'number',
        required: true,
        min: 0,
        max: 18,
        step: 0.5,
      },
      salary_range: {
        type: 'number',
        required: true,
        model_unit: 'annual_inr',
        accepted_input_units: ['LPA', 'Annual INR'],
        recommended_lpa_min: 8,
        recommended_lpa_max: 35,
      },
      performance_rating: {
        type: 'number',
        required: true,
        min: 1,
        max: 5,
        step: 1,
      },
    },
    guidance: [
      'Use values that match HR records (title, department, performance).',
      'Select the primary tech stack you use most in your current role.',
      'If you use a mixed stack, provide additional skill tags/certifications so guidance can map combinations correctly.',
      'Enter current-year CTC correctly; salary scale strongly affects prediction.',
      'Use the latest reporting quarter for better market alignment.',
      'If unsure about performance rating, use your latest appraisal score.',
    ],
  };
}

function pickEconomicCondition(reportingQuarter, quarterDefaults) {
  if (quarterDefaults?.economic_condition_tag) {
    return quarterDefaults.economic_condition_tag;
  }

  const lowered = String(reportingQuarter || '').toLowerCase();
  if (lowered.includes('2023')) {
    return 'Recovery';
  }
  if (lowered.includes('2024')) {
    return 'Stable';
  }
  return 'Growth';
}

function inferPastLayoffs(companyDefaults, industryDefaults, economicConditionTag) {
  const riskRate =
    Number(companyDefaults?.industry_layoff_rate) || Number(industryDefaults?.industry_layoff_rate) || 1.4;
  const pressureBoost = economicConditionTag === 'Recession' ? 0.45 : economicConditionTag === 'Recovery' ? 0.12 : -0.08;
  return riskRate + pressureBoost >= 1.8 ? 'Yes' : 'No';
}

function buildFeatureVector(normalizedInput, marketContext = {}) {
  ensureArtifactsLoaded();

  const companyDefaults = companyDefaultsByName.get(normalizedInput.company_name) || {};
  const inferredIndustry = companyDefaults.industry || artifacts.global_defaults.categorical_modes.industry;
  const industryDefaults = industryDefaultsByName.get(inferredIndustry) || {};
  const quarterDefaults = quarterDefaultsByQuarter.get(normalizedInput.reporting_quarter) || {};
  const roleDefaults = roleDefaultsByTitle.get(normalizedInput.job_title) || {};
  const departmentDefaults = departmentDefaultsByName.get(normalizedInput.department) || {};
  const stackDefaults = stackDefaultsByName.get(normalizedInput.tech_stack) || {};

  const defaults = artifacts.global_defaults.numerical_medians;

  const economicConditionTag = pickEconomicCondition(normalizedInput.reporting_quarter, quarterDefaults);
  const pastLayoffs = inferPastLayoffs(companyDefaults, industryDefaults, economicConditionTag);

  const revenueGrowth = parseNumber(
    marketContext.revenue_growth,
    Number(companyDefaults.revenue_growth) || Number(industryDefaults.revenue_growth) || defaults.revenue_growth,
    'revenue_growth'
  );

  const profitMargin = parseNumber(
    marketContext.profit_margin,
    Number(companyDefaults.profit_margin) || Number(industryDefaults.profit_margin) || defaults.profit_margin,
    'profit_margin'
  );

  const stockPriceChange = parseNumber(
    marketContext.stock_price_change,
    Number(companyDefaults.stock_price_change) || Number(industryDefaults.stock_price_change) || defaults.stock_price_change,
    'stock_price_change'
  );

  const totalEmployees = parseNumber(
    marketContext.total_employees,
    Number(companyDefaults.total_employees) || defaults.total_employees,
    'total_employees'
  );

  const unemploymentRate = parseNumber(
    marketContext.unemployment_rate,
    Number(quarterDefaults.unemployment_rate) || defaults.unemployment_rate,
    'unemployment_rate'
  );

  const inflationRate = parseNumber(
    marketContext.inflation_rate,
    Number(quarterDefaults.inflation_rate) || defaults.inflation_rate,
    'inflation_rate'
  );

  const industryLayoffRate = parseNumber(
    marketContext.industry_layoff_rate,
    Number(companyDefaults.industry_layoff_rate) || Number(industryDefaults.industry_layoff_rate) || defaults.industry_layoff_rate,
    'industry_layoff_rate'
  );

  const roleDemandIndex = parseNumber(
    marketContext.role_demand_index,
    Number(roleDefaults.role_demand_index) || defaults.role_demand_index,
    'role_demand_index'
  );

  const departmentResilienceIndex = parseNumber(
    marketContext.department_resilience_index,
    Number(departmentDefaults.department_resilience_index) || defaults.department_resilience_index,
    'department_resilience_index'
  );

  const techStackTrendScore = parseNumber(
    marketContext.tech_stack_trend_score,
    Number(stackDefaults.tech_stack_trend_score) || defaults.tech_stack_trend_score,
    'tech_stack_trend_score'
  );

  const features = {
    company_name: normalizedInput.company_name,
    company_location: normalizedInput.company_location,
    reporting_quarter: normalizedInput.reporting_quarter,
    economic_condition_tag: normalizeCategoryFeature('economic_condition_tag', marketContext.economic_condition_tag || economicConditionTag),
    past_layoffs: normalizeCategoryFeature('past_layoffs', marketContext.past_layoffs || pastLayoffs),
    job_title: normalizedInput.job_title,
    tech_stack: normalizedInput.tech_stack,
    department: normalizedInput.department,
    remote_work: normalizeCategoryFeature('remote_work', normalizedInput.remote_work),
    industry: normalizeCategoryFeature('industry', marketContext.industry || inferredIndustry),
    revenue_growth: round(revenueGrowth, 3),
    profit_margin: round(profitMargin, 3),
    stock_price_change: round(stockPriceChange, 3),
    total_employees: round(totalEmployees, 0),
    role_demand_index: round(roleDemandIndex, 3),
    department_resilience_index: round(departmentResilienceIndex, 3),
    tech_stack_trend_score: round(techStackTrendScore, 3),
    years_at_company: round(normalizedInput.years_at_company, 2),
    salary_range: round(normalizedInput.salary_range, 0),
    performance_rating: round(normalizedInput.performance_rating, 2),
    industry_layoff_rate: round(industryLayoffRate, 3),
    unemployment_rate: round(unemploymentRate, 3),
    inflation_rate: round(inflationRate, 3),
  };

  features.employee_stability = round(features.years_at_company * features.performance_rating, 3);
  features.economic_pressure = round(features.inflation_rate + features.unemployment_rate - features.revenue_growth, 3);

  return features;
}

function computeFeatureContribution(feature, value, predictedClass, classScores) {
  const classes = artifacts.feature_schema.classes;
  const otherClasses = classes.filter((label) => label !== predictedClass);

  if (artifacts.feature_schema.categorical.includes(feature)) {
    const predMap = artifacts.categorical_likelihoods[feature][predictedClass];
    const predLog = Math.log(predMap[value] || predMap.__default__ || 1e-12);

    const otherLog =
      otherClasses.reduce((acc, label) => {
        const otherMap = artifacts.categorical_likelihoods[feature][label];
        return acc + Math.log(otherMap[value] || otherMap.__default__ || 1e-12);
      }, 0) / Math.max(otherClasses.length, 1);

    return predLog - otherLog;
  }

  if (artifacts.feature_schema.numerical.includes(feature)) {
    const predStats = artifacts.numerical_stats[feature][predictedClass];
    const predLog = gaussianLogPdf(value, predStats.mean, predStats.std);

    const otherLog =
      otherClasses.reduce((acc, label) => {
        const stats = artifacts.numerical_stats[feature][label];
        return acc + gaussianLogPdf(value, stats.mean, stats.std);
      }, 0) / Math.max(otherClasses.length, 1);

    return predLog - otherLog;
  }

  return 0;
}

function describeFactor(feature, value, direction, impactScore) {
  if (artifacts.feature_schema.categorical.includes(feature)) {
    const prefix = direction === 'increases_risk' ? 'This profile tends to push risk upward' : 'This profile acts as a protective signal';
    return `${prefix} for ${FEATURE_LABELS[feature] || feature.toString().replace(/_/g, ' ')}: ${value}.`;
  }

  const baselines = artifacts.profiles.numeric_baselines[feature] || {};
  const globalMean = Number(baselines.mean) || 0;
  const delta = Number(value) - globalMean;
  const absoluteDelta = Math.abs(delta);
  const formattedDelta = round(absoluteDelta, 2);

  if (direction === 'increases_risk') {
    return `${FEATURE_LABELS[feature] || feature} is ${formattedDelta} away from baseline in a risk-increasing direction.`;
  }

  return `${FEATURE_LABELS[feature] || feature} is currently in a risk-reducing range.`;
}

function deriveDirection(feature, value) {
  if (artifacts.feature_schema.categorical.includes(feature)) {
    const featureRiskMap = artifacts.profiles.categorical_risk[feature] || {};
    const riskLevel = Number(featureRiskMap[value]);
    const baseline = Number(averageCategoricalRisk[feature] ?? 1);
    if (!Number.isFinite(riskLevel)) {
      return 'neutral';
    }
    return riskLevel >= baseline ? 'increases_risk' : 'reduces_risk';
  }

  const semanticDirection = Number(SEMANTIC_NUMERIC_DIRECTION[feature]);
  const direction = Number.isFinite(semanticDirection)
    ? semanticDirection
    : Number(artifacts.profiles.numeric_direction[feature] || 0);
  if (direction === 0) {
    return 'neutral';
  }

  const baseline = artifacts.profiles.numeric_baselines[feature] || {};
  const mean = Number(baseline.mean || 0);
  const std = Number(baseline.std || 1);
  const z = (Number(value) - mean) / (std || 1);
  const signal = z * direction;

  return signal >= 0 ? 'increases_risk' : 'reduces_risk';
}

function createImprovementTips(topFactors) {
  const tips = [];
  const seen = new Set();

  for (const factor of topFactors) {
    if (factor.direction !== 'increases_risk') {
      continue;
    }

    const tip = CONTROLLABLE_TIPS[factor.feature];
    if (!tip || seen.has(tip)) {
      continue;
    }

    tips.push(tip);
    seen.add(tip);

    if (tips.length >= 3) {
      break;
    }
  }

  if (tips.length === 0) {
    tips.push('Keep documenting measurable impact each month to maintain low layoff risk.');
  }

  return tips;
}

function buildStackSurvivalSnapshot(features) {
  ensureArtifactsLoaded();

  const quarter = String(features?.reporting_quarter || '').trim();
  const role = String(features?.job_title || '').trim();
  const selectedStackRaw = String(features?.tech_stack || '').trim();
  const selectedStack = normalizeCategoryFeature('tech_stack', selectedStackRaw);
  if (!role) {
    return null;
  }

  const quarterProfiles = Array.isArray(artifacts?.profiles?.stack_survival_profiles)
    ? artifacts.profiles.stack_survival_profiles
    : [];
  const roleProfiles = Array.isArray(artifacts?.profiles?.role_stack_profiles)
    ? artifacts.profiles.role_stack_profiles
    : [];

  let rows = quarterProfiles.filter((item) => (
    String(item?.job_title || '') === role
    && String(item?.reporting_quarter || '') === quarter
  ));
  let scopeLabel = `For ${role} in ${quarter}`;

  if (rows.length < 3) {
    rows = roleProfiles.filter((item) => String(item?.job_title || '') === role);
    scopeLabel = `For ${role} across recent quarters`;
  }

  if (!rows.length) {
    return null;
  }

  const ranked = rows
    .map((item) => ({
      tech_stack: String(item?.tech_stack || ''),
      sample_size: Number(item?.sample_size || 0),
      low_risk_share: round(Number(item?.low_risk_share || 0), 4),
      high_risk_share: round(Number(item?.high_risk_share || 0), 4),
      avg_role_layoff_rate: round(Number(item?.avg_role_layoff_rate || 0), 3),
    }))
    .filter((item) => item.tech_stack)
    .sort((a, b) => {
      if (b.low_risk_share !== a.low_risk_share) {
        return b.low_risk_share - a.low_risk_share;
      }
      if (a.avg_role_layoff_rate !== b.avg_role_layoff_rate) {
        return a.avg_role_layoff_rate - b.avg_role_layoff_rate;
      }
      return b.sample_size - a.sample_size;
    });

  const topStacks = ranked.slice(0, 3);
  const watchlistStacks = ranked.slice(-2).reverse();
  const totalStacks = ranked.length;
  const selectedIndex = ranked.findIndex((item) => item.tech_stack === selectedStack);
  const selectedProfile = selectedIndex >= 0 ? ranked[selectedIndex] : null;
  const rank = selectedIndex >= 0 ? selectedIndex + 1 : null;

  let currentStackSignal = 'unknown';
  let narrative = 'Stack survival signal is unavailable for this profile.';
  if (selectedProfile) {
    let topCutoff = 1;
    let midCutoff = 1;

    if (totalStacks <= 2) {
      topCutoff = 1;
      midCutoff = 1;
    } else if (totalStacks <= 4) {
      topCutoff = 1;
      midCutoff = 2;
    } else {
      topCutoff = Math.max(1, Math.floor(totalStacks * 0.35));
      midCutoff = Math.max(topCutoff + 1, Math.floor(totalStacks * 0.7));
    }

    if (rank <= topCutoff) {
      currentStackSignal = 'strong';
      narrative = `${selectedStack} is currently in the stronger resilience tier for ${role}.`;
    } else if (rank <= midCutoff) {
      currentStackSignal = 'moderate';
      narrative = `${selectedStack} is in the middle resilience tier; upskilling can improve survivability.`;
    } else {
      currentStackSignal = 'weak';
      narrative = `${selectedStack} is in a weaker resilience tier for current role demand.`;
    }
  }

  return {
    scope: scopeLabel,
    compared_stacks: totalStacks,
    current_stack: selectedStack || null,
    current_stack_rank: rank,
    current_stack_signal: currentStackSignal,
    current_stack_low_risk_share: selectedProfile ? selectedProfile.low_risk_share : null,
    current_stack_avg_layoff_rate: selectedProfile ? selectedProfile.avg_role_layoff_rate : null,
    top_resilient_stacks: topStacks,
    watchlist_stacks: watchlistStacks,
    narrative,
  };
}

function predictFromFeatures(features) {
  ensureArtifactsLoaded();

  const classes = artifacts.feature_schema.classes;
  const logScores = [];

  for (const label of classes) {
    let score = Math.log(artifacts.priors[label] || 1e-12);

    for (const feature of artifacts.feature_schema.categorical) {
      const value = normalizeCategoryFeature(feature, features[feature]);
      const likelihood = artifacts.categorical_likelihoods[feature][label];
      const prob = likelihood[value] || likelihood.__default__ || 1e-12;
      score += Math.log(prob);
    }

    for (const feature of artifacts.feature_schema.numerical) {
      const fallback = artifacts.global_defaults.numerical_medians[feature];
      const value = parseNumber(features[feature], fallback, feature);
      const stats = artifacts.numerical_stats[feature][label];
      score += gaussianLogPdf(value, Number(stats.mean), Number(stats.std));
    }

    logScores.push(score);
  }

  const probabilities = softmax(logScores);
  const indexed = probabilities.map((probability, index) => ({
    className: classes[index],
    probability,
    score: logScores[index],
  }));
  indexed.sort((a, b) => b.probability - a.probability);

  const predicted = indexed[0];
  const entropy = -probabilities.reduce((acc, prob) => acc + prob * Math.log(prob || 1), 0) / Math.log(classes.length);
  const confidence = clamp(predicted.probability * (1 - 0.35 * entropy), 0.45, 0.98);

  const probabilitiesMap = {};
  classes.forEach((label, idx) => {
    probabilitiesMap[label] = round(probabilities[idx], 4);
  });

  const classWeights = classes.reduce((acc, label, idx) => {
    acc[label] = idx;
    return acc;
  }, {});
  const expectedRisk =
    classes.reduce((acc, label, idx) => acc + probabilities[idx] * classWeights[label], 0) /
    Math.max(classes.length - 1, 1);

  const contributions = [];
  for (const feature of [...artifacts.feature_schema.categorical, ...artifacts.feature_schema.numerical]) {
    const value = features[feature];
    const contribution = computeFeatureContribution(feature, value, predicted.className, indexed);
    const direction = deriveDirection(feature, value);

    contributions.push({
      feature,
      label: FEATURE_LABELS[feature] || feature,
      value,
      impact: round(Math.abs(contribution), 4),
      direction,
      reason: describeFactor(feature, value, direction, Math.abs(contribution)),
    });
  }

  const topFactors = contributions
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 6);

  const improvementTips = createImprovementTips(topFactors);

  return {
    layoff_risk: predicted.className,
    confidence: round(confidence, 4),
    risk_score: round(expectedRisk * 100, 2),
    probabilities: probabilitiesMap,
    top_factors: topFactors,
    improvement_tips: improvementTips,
    model_version: artifacts.metadata.created_at_utc,
  };
}

export function getRiskModelMetadata() {
  ensureArtifactsLoaded();
  return {
    ...artifacts.metadata,
    artifact_path: ARTIFACT_PATH,
  };
}

export function buildAndPredict(employeeInput, marketContext = {}) {
  ensureArtifactsLoaded();

  const normalizedInput = normalizeUserInput(employeeInput);
  const featureVector = buildFeatureVector(normalizedInput, marketContext);
  const prediction = predictFromFeatures(featureVector);
  const stackSurvival = buildStackSurvivalSnapshot(featureVector);

  return {
    normalized_input: normalizedInput,
    features: featureVector,
    prediction,
    stack_survival: stackSurvival,
  };
}
