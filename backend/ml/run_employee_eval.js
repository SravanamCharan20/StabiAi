import { evaluateEmployeeModel } from '../services/employeeEvaluationService.js';

const sampleArgIndex = process.argv.indexOf('--sample');
let sampleSize = null;
if (sampleArgIndex >= 0 && process.argv[sampleArgIndex + 1]) {
  const parsed = Number(process.argv[sampleArgIndex + 1]);
  if (Number.isFinite(parsed) && parsed > 0) {
    sampleSize = parsed;
  }
}

const report = evaluateEmployeeModel({ force: true, sampleSize });

const summary = {
  generated_at_utc: report.metadata.generated_at_utc,
  row_count: report.metadata.row_count,
  accuracy: report.overall.accuracy,
  balanced_accuracy: report.overall.balanced_accuracy,
  macro_f1: report.overall.macro_f1,
  weighted_f1: report.overall.weighted_f1,
  brier_score: report.overall.brier_score,
  log_loss: report.overall.log_loss,
  ece: report.calibration.expected_calibration_error,
  mce: report.calibration.max_calibration_error,
  class_distribution: report.metadata.actual_class_distribution,
};

console.log(JSON.stringify(summary, null, 2));
