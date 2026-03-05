import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildAndPredict, getRiskModelMetadata } from './employeeRiskEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DATASET_PATH = path.resolve(__dirname, '../data/enhanced_synthetic_employee_data.csv');

let cachedSignature = null;
let cachedReport = null;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 4) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((value) => value.trim());
}

function readCsvRows(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return [];
  }

  const header = parseCsvLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    const row = {};
    for (let col = 0; col < header.length; col += 1) {
      row[header[col]] = values[col] ?? '';
    }
    rows.push(row);
  }

  return rows;
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'string' && value.trim() === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapTrueClass(rate, thresholds) {
  const numeric = toNumber(rate, 0);
  if (numeric <= thresholds.low_max) {
    return 'Low';
  }
  if (numeric <= thresholds.medium_max) {
    return 'Medium';
  }
  return 'High';
}

function createConfusion(labels) {
  const matrix = {};
  for (const actual of labels) {
    matrix[actual] = {};
    for (const predicted of labels) {
      matrix[actual][predicted] = 0;
    }
  }
  return matrix;
}

function aggregateConfusionStats(confusion, labels) {
  const perClass = {};
  let total = 0;
  let correct = 0;

  for (const actual of labels) {
    const support = labels.reduce((acc, predicted) => acc + confusion[actual][predicted], 0);
    total += support;
    correct += confusion[actual][actual];

    const tp = confusion[actual][actual];
    const fn = support - tp;
    const fp = labels.reduce((acc, otherActual) => {
      if (otherActual === actual) {
        return acc;
      }
      return acc + confusion[otherActual][actual];
    }, 0);

    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

    perClass[actual] = {
      precision: round(precision, 4),
      recall: round(recall, 4),
      f1: round(f1, 4),
      support,
    };
  }

  const accuracy = total === 0 ? 0 : correct / total;

  const macroPrecision = labels.reduce((acc, label) => acc + perClass[label].precision, 0) / labels.length;
  const macroRecall = labels.reduce((acc, label) => acc + perClass[label].recall, 0) / labels.length;
  const macroF1 = labels.reduce((acc, label) => acc + perClass[label].f1, 0) / labels.length;

  const weightedF1 = labels.reduce((acc, label) => {
    const weight = total === 0 ? 0 : perClass[label].support / total;
    return acc + perClass[label].f1 * weight;
  }, 0);

  return {
    accuracy: round(accuracy, 4),
    balanced_accuracy: round(macroRecall, 4),
    macro_precision: round(macroPrecision, 4),
    macro_recall: round(macroRecall, 4),
    macro_f1: round(macroF1, 4),
    weighted_f1: round(weightedF1, 4),
    per_class: perClass,
  };
}

function buildCalibrationReport(calibrationRows, bins = 10) {
  const binStats = [];
  const total = calibrationRows.length;

  if (total === 0) {
    return {
      bins,
      expected_calibration_error: 0,
      max_calibration_error: 0,
      reliability_bins: [],
    };
  }

  let ece = 0;
  let mce = 0;

  for (let idx = 0; idx < bins; idx += 1) {
    const lower = idx / bins;
    const upper = (idx + 1) / bins;

    const rows = calibrationRows.filter((entry) => {
      const inRange = entry.confidence >= lower && entry.confidence < upper;
      if (idx === bins - 1) {
        return entry.confidence >= lower && entry.confidence <= upper;
      }
      return inRange;
    });

    if (rows.length === 0) {
      continue;
    }

    const avgConfidence = rows.reduce((acc, row) => acc + row.confidence, 0) / rows.length;
    const accuracy = rows.reduce((acc, row) => acc + (row.correct ? 1 : 0), 0) / rows.length;
    const gap = Math.abs(avgConfidence - accuracy);

    ece += (rows.length / total) * gap;
    mce = Math.max(mce, gap);

    binStats.push({
      bin: `${round(lower, 2)}-${round(upper, 2)}`,
      count: rows.length,
      avg_confidence: round(avgConfidence, 4),
      accuracy: round(accuracy, 4),
      gap: round(gap, 4),
    });
  }

  return {
    bins,
    expected_calibration_error: round(ece, 4),
    max_calibration_error: round(mce, 4),
    reliability_bins: binStats,
  };
}

function resolveDatasetPath(metadata) {
  const envPath = process.env.EMPLOYEE_EVAL_DATASET_PATH;
  const candidates = [];

  if (envPath) {
    candidates.push(path.resolve(envPath));
  }

  if (metadata?.input_path) {
    if (path.isAbsolute(metadata.input_path)) {
      candidates.push(metadata.input_path);
    } else {
      candidates.push(path.resolve(process.cwd(), metadata.input_path));
      candidates.push(path.resolve(__dirname, '..', metadata.input_path));
      candidates.push(path.resolve(__dirname, '..', metadata.input_path.replace(/^backend\//, '')));
    }
  }

  candidates.push(DEFAULT_DATASET_PATH);

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    'Unable to locate evaluation dataset. Set EMPLOYEE_EVAL_DATASET_PATH or regenerate data at backend/data/enhanced_synthetic_employee_data.csv.'
  );
}

function fileSignature(paths) {
  return paths
    .map((filePath) => {
      const stat = fs.statSync(filePath);
      return `${filePath}:${stat.size}:${Math.floor(stat.mtimeMs)}`;
    })
    .join('|');
}

function maybeSampleRows(rows, sampleSize) {
  const size = Number(sampleSize);
  if (!Number.isFinite(size) || size <= 0 || size >= rows.length) {
    return rows;
  }

  const stride = Math.max(1, Math.floor(rows.length / size));
  const sampled = [];
  for (let i = 0; i < rows.length && sampled.length < size; i += stride) {
    sampled.push(rows[i]);
  }
  return sampled;
}

export function evaluateEmployeeModel(options = {}) {
  const { force = false, sampleSize = null } = options;

  const metadata = getRiskModelMetadata();
  const datasetPath = resolveDatasetPath(metadata);

  const signature = fileSignature([datasetPath, metadata.artifact_path]);
  const useCache = !force && !sampleSize;
  if (useCache && cachedReport && cachedSignature === signature) {
    return cachedReport;
  }

  const classLabels = ['Low', 'Medium', 'High'];
  const confusion = createConfusion(classLabels);

  const rows = maybeSampleRows(readCsvRows(datasetPath), sampleSize);
  if (rows.length === 0) {
    throw new Error(`No rows found in dataset: ${datasetPath}`);
  }

  const thresholds = metadata.risk_thresholds || { low_max: 1.5, medium_max: 3.0 };

  const calibrationRows = [];
  const errorRows = [];

  let brierScoreSum = 0;
  let logLossSum = 0;

  const actualClassCounts = { Low: 0, Medium: 0, High: 0 };

  for (const row of rows) {
    const employeeInput = {
      company_name: row.company_name,
      company_location: row.company_location,
      reporting_quarter: row.reporting_quarter,
      job_title: row.job_title,
      department: row.department,
      remote_work: row.remote_work,
      years_at_company: toNumber(row.years_at_company, 0),
      salary_range: toNumber(row.salary_range, 0),
      performance_rating: clamp(toNumber(row.performance_rating, 3), 1, 5),
    };

    const marketContext = {
      economic_condition_tag: row.economic_condition_tag,
      past_layoffs: row.past_layoffs,
      industry: row.industry,
      revenue_growth: toNumber(row.revenue_growth, 0),
      profit_margin: toNumber(row.profit_margin, 0),
      stock_price_change: toNumber(row.stock_price_change, 0),
      total_employees: toNumber(row.total_employees, 0),
      industry_layoff_rate: toNumber(row.industry_layoff_rate, 0),
      unemployment_rate: toNumber(row.unemployment_rate, 0),
      inflation_rate: toNumber(row.inflation_rate, 0),
    };

    const predictionOutput = buildAndPredict(employeeInput, marketContext).prediction;
    const predictedClass = predictionOutput.layoff_risk;
    const actualClass = mapTrueClass(row.role_layoff_rate, thresholds);

    actualClassCounts[actualClass] += 1;
    confusion[actualClass][predictedClass] += 1;

    const probabilities = predictionOutput.probabilities || {};
    const confidence = Number(
      classLabels.reduce((max, label) => Math.max(max, toNumber(probabilities[label], 0)), 0)
    );
    const correct = predictedClass === actualClass;

    calibrationRows.push({ confidence, correct });

    if (!correct) {
      errorRows.push({
        actual: actualClass,
        predicted: predictedClass,
        confidence: round(confidence, 4),
        company_name: row.company_name,
        job_title: row.job_title,
        department: row.department,
        years_at_company: toNumber(row.years_at_company, 0),
        performance_rating: toNumber(row.performance_rating, 0),
      });
    }

    let rowBrier = 0;
    for (const label of classLabels) {
      const p = toNumber(probabilities[label], 0);
      const y = label === actualClass ? 1 : 0;
      rowBrier += (p - y) ** 2;
    }
    brierScoreSum += rowBrier;

    const trueProb = Math.max(toNumber(probabilities[actualClass], 0), 1e-12);
    logLossSum += -Math.log(trueProb);
  }

  const totalRows = rows.length;
  const confusionStats = aggregateConfusionStats(confusion, classLabels);
  const calibration = buildCalibrationReport(calibrationRows, 10);

  const matrix = classLabels.map((actual) =>
    classLabels.map((predicted) => confusion[actual][predicted])
  );

  const report = {
    metadata: {
      generated_at_utc: new Date().toISOString(),
      dataset_path: datasetPath,
      artifact_path: metadata.artifact_path,
      row_count: totalRows,
      sample_size: sampleSize ? Number(sampleSize) : null,
      risk_thresholds: thresholds,
      actual_class_distribution: {
        Low: round(actualClassCounts.Low / totalRows, 4),
        Medium: round(actualClassCounts.Medium / totalRows, 4),
        High: round(actualClassCounts.High / totalRows, 4),
      },
      model_version: metadata.created_at_utc,
    },
    overall: {
      ...confusionStats,
      brier_score: round(brierScoreSum / totalRows, 4),
      log_loss: round(logLossSum / totalRows, 4),
    },
    confusion_matrix: {
      labels: classLabels,
      matrix,
    },
    per_class: confusionStats.per_class,
    calibration,
    error_analysis: {
      high_confidence_errors: errorRows
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 12),
    },
  };

  if (useCache) {
    cachedSignature = signature;
    cachedReport = report;
  }

  return report;
}
