import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HISTORY_FILE_PATH = path.resolve(__dirname, '../data/employee_prediction_history.json');
const MAX_HISTORY_ITEMS = 1200;

function ensureHistoryFile() {
  const dir = path.dirname(HISTORY_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(HISTORY_FILE_PATH)) {
    fs.writeFileSync(HISTORY_FILE_PATH, '[]', 'utf-8');
  }
}

function loadHistoryEntries() {
  ensureHistoryFile();
  try {
    const raw = fs.readFileSync(HISTORY_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveHistoryEntries(entries) {
  ensureHistoryFile();
  const safeEntries = Array.isArray(entries) ? entries.slice(-MAX_HISTORY_ITEMS) : [];
  fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify(safeEntries, null, 2), 'utf-8');
}

function toFiniteNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeActionItems(actions) {
  if (!Array.isArray(actions)) {
    return [];
  }
  const allowedStatus = new Set(['not_started', 'in_progress', 'done', 'blocked']);
  return actions
    .map((item, index) => {
      const title = String(item?.title || '').trim();
      const detail = String(item?.detail || '').trim();
      const statusRaw = String(item?.status || 'not_started').toLowerCase().trim();
      return {
        id: String(item?.id || `action-${index + 1}`).trim() || `action-${index + 1}`,
        title,
        detail,
        status: allowedStatus.has(statusRaw) ? statusRaw : 'not_started',
        updated_at_utc: new Date().toISOString(),
      };
    })
    .filter((item) => item.title)
    .slice(0, 12);
}

export function createPredictionHistoryEntry(payload = {}) {
  const now = new Date().toISOString();
  const entry = {
    run_id: randomUUID(),
    created_at_utc: now,
    updated_at_utc: now,
    employee_profile: payload.employee_profile || {},
    normalized_input: payload.normalized_input || {},
    feature_vector: payload.feature_vector || {},
    prediction: payload.prediction || {},
    stack_survival: payload.stack_survival || null,
    market_signals: payload.market_signals || null,
    resume_insights: payload.resume_insights || null,
    trend_guidance: payload.trend_guidance || null,
    reliability: payload.reliability || {},
    review: null,
    action_tracker: normalizeActionItems(payload.action_tracker || []),
  };

  const entries = loadHistoryEntries();
  entries.push(entry);
  saveHistoryEntries(entries);
  return entry;
}

export function listPredictionHistory(options = {}) {
  const companyName = String(options.company_name || '').toLowerCase().trim();
  const limitRaw = Number(options.limit);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.floor(limitRaw), 1), 100) : 20;

  const entries = loadHistoryEntries();
  const filtered = entries
    .filter((entry) => {
      if (!companyName) {
        return true;
      }
      const entryCompany = String(entry?.employee_profile?.company_name || '').toLowerCase().trim();
      return entryCompany === companyName;
    })
    .sort((a, b) => new Date(b.created_at_utc).getTime() - new Date(a.created_at_utc).getTime())
    .slice(0, limit);

  return filtered;
}

export function updatePredictionReview(runId, reviewInput = {}) {
  const entries = loadHistoryEntries();
  const idx = entries.findIndex((entry) => entry.run_id === runId);
  if (idx === -1) {
    return null;
  }

  const reviewedBy = String(reviewInput.reviewed_by || '').trim();
  const reviewReason = String(reviewInput.review_reason || '').trim();
  const decision = String(reviewInput.decision || '').trim() || 'review_completed';

  entries[idx].review = {
    reviewed_by: reviewedBy,
    review_reason: reviewReason,
    decision,
    reviewed_at_utc: new Date().toISOString(),
  };
  entries[idx].updated_at_utc = new Date().toISOString();
  saveHistoryEntries(entries);
  return entries[idx];
}

export function updatePredictionActions(runId, actions = []) {
  const entries = loadHistoryEntries();
  const idx = entries.findIndex((entry) => entry.run_id === runId);
  if (idx === -1) {
    return null;
  }

  entries[idx].action_tracker = normalizeActionItems(actions);
  entries[idx].updated_at_utc = new Date().toISOString();
  saveHistoryEntries(entries);
  return entries[idx];
}

function getRiskRank(value) {
  const normalized = String(value || '').toLowerCase().trim();
  if (normalized === 'high') {
    return 3;
  }
  if (normalized === 'medium') {
    return 2;
  }
  if (normalized === 'low') {
    return 1;
  }
  return 0;
}

function round(value, digits = 4) {
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
}

export function summarizeHistoryTrend(entries = []) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return {
      entry_count: 0,
      risk_distribution: { Low: 0, Medium: 0, High: 0, Unknown: 0 },
      latest_risk: null,
      previous_risk: null,
      risk_direction: 'flat',
      avg_confidence: null,
      avg_risk_score: null,
      done_actions_rate: null,
    };
  }

  const sortedAsc = [...entries].sort(
    (a, b) => new Date(a.created_at_utc).getTime() - new Date(b.created_at_utc).getTime()
  );

  const riskDistribution = { Low: 0, Medium: 0, High: 0, Unknown: 0 };
  let confidenceSum = 0;
  let confidenceCount = 0;
  let riskScoreSum = 0;
  let riskScoreCount = 0;
  let doneActions = 0;
  let totalActions = 0;

  for (const entry of sortedAsc) {
    const riskLabel = String(entry?.prediction?.layoff_risk || 'Unknown');
    if (riskLabel === 'Low' || riskLabel === 'Medium' || riskLabel === 'High') {
      riskDistribution[riskLabel] += 1;
    } else {
      riskDistribution.Unknown += 1;
    }

    const confidence = toFiniteNumber(entry?.prediction?.confidence);
    if (confidence != null) {
      confidenceSum += confidence;
      confidenceCount += 1;
    }

    const riskScore = toFiniteNumber(entry?.prediction?.risk_score);
    if (riskScore != null) {
      riskScoreSum += riskScore;
      riskScoreCount += 1;
    }

    const actions = Array.isArray(entry?.action_tracker) ? entry.action_tracker : [];
    totalActions += actions.length;
    doneActions += actions.filter((action) => String(action?.status) === 'done').length;
  }

  const latest = sortedAsc[sortedAsc.length - 1];
  const previous = sortedAsc.length > 1 ? sortedAsc[sortedAsc.length - 2] : null;
  const latestRisk = String(latest?.prediction?.layoff_risk || 'Unknown');
  const previousRisk = previous ? String(previous?.prediction?.layoff_risk || 'Unknown') : null;

  const latestRank = getRiskRank(latestRisk);
  const previousRank = getRiskRank(previousRisk);
  const riskDirection = previousRisk == null
    ? 'flat'
    : latestRank > previousRank
      ? 'up'
      : latestRank < previousRank
        ? 'down'
        : 'flat';

  return {
    entry_count: sortedAsc.length,
    risk_distribution: riskDistribution,
    latest_risk: latestRisk,
    previous_risk: previousRisk,
    risk_direction: riskDirection,
    avg_confidence: confidenceCount > 0 ? round(confidenceSum / confidenceCount, 4) : null,
    avg_risk_score: riskScoreCount > 0 ? round(riskScoreSum / riskScoreCount, 3) : null,
    done_actions_rate: totalActions > 0 ? round(doneActions / totalActions, 4) : null,
  };
}
