import React from "react";
import { ACTION_STATUS_OPTIONS, REVIEW_DECISIONS } from "../constants";
import { formatCheckedAt, getRiskBadgeClass } from "../utils";
import { SelectControl } from "./core";

export const WhatIfSimulator = ({
  whatIfForm,
  setWhatIfForm,
  onRun,
  onApplyToInput,
  loading,
  result,
  baselineRisk,
}) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">What-If Simulator</h3>
        <p className="mt-1 text-xs text-slate-500">
          Test how controllable changes could shift your risk signal before making real updates.
        </p>
      </div>
      <button
        type="button"
        onClick={onApplyToInput}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        Apply Scenario To Form
      </button>
    </div>

    <div className="mt-4 grid gap-3 md:grid-cols-3">
      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Years At Company</span>
        <input
          type="number"
          min="0"
          max="18"
          step="0.5"
          value={whatIfForm.years_at_company}
          onChange={(event) =>
            setWhatIfForm((prev) => ({ ...prev, years_at_company: event.target.value }))
          }
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Performance Rating</span>
        <input
          type="number"
          min="1"
          max="5"
          step="1"
          value={whatIfForm.performance_rating}
          onChange={(event) =>
            setWhatIfForm((prev) => ({ ...prev, performance_rating: event.target.value }))
          }
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Salary (LPA)</span>
        <input
          type="number"
          min="1"
          max="120"
          step="0.5"
          value={whatIfForm.salary_lpa}
          onChange={(event) =>
            setWhatIfForm((prev) => ({ ...prev, salary_lpa: event.target.value }))
          }
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
        />
      </label>
    </div>

    <button
      type="button"
      onClick={onRun}
      disabled={loading}
      className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
    >
      {loading ? "Running Scenario..." : "Run Scenario"}
    </button>

    {result?.scenario?.prediction ? (
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scenario Output</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getRiskBadgeClass(baselineRisk)}`}>
            Baseline: {baselineRisk || "Unknown"}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getRiskBadgeClass(result.delta?.risk_to)}`}>
            Scenario: {result.delta?.risk_to || "Unknown"}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-700">{result.delta?.narrative}</p>
        <p className="mt-1 text-xs text-slate-600">
          Risk Score Delta: {result.delta?.risk_score_delta != null ? result.delta.risk_score_delta.toFixed(3) : "N/A"}
          {" "} | Confidence Delta: {result.delta?.confidence_delta != null ? (result.delta.confidence_delta * 100).toFixed(2) : "N/A"}%
        </p>
      </div>
    ) : null}
  </section>
);


export const ActionTrackerPanel = ({
  actions,
  onUpdateStatus,
  onSave,
  onRescore,
  saving,
  rescoreLoading,
  message,
  rescoreSummary,
}) => {
  const doneCount = actions.filter((item) => item.status === "done").length;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">30-Day Action Tracker</h3>
          <p className="mt-1 text-xs text-slate-500">
            Track completion and re-score once progress is visible in your profile updates.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
          {doneCount}/{actions.length} Done
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {actions.map((action, index) => (
          <div key={action.id || `${action.title}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-900">{action.title}</p>
            {action.detail ? <p className="mt-1 text-xs text-slate-600">{action.detail}</p> : null}
            <div className="mt-2">
              <SelectControl
                value={action.status}
                onChange={(event) => onUpdateStatus(index, event.target.value)}
                className="border-slate-200 py-2 focus:border-slate-400 focus:ring-slate-200"
              >
                {ACTION_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectControl>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {saving ? "Saving..." : "Save Action Status"}
        </button>
        <button
          type="button"
          onClick={onRescore}
          disabled={rescoreLoading}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          {rescoreLoading ? "Re-scoring..." : "Re-score With Current Inputs"}
        </button>
      </div>

      {message ? <p className="mt-2 text-xs text-slate-600">{message}</p> : null}
      {rescoreSummary ? (
        <p className="mt-2 text-xs text-slate-600">
          Re-score result: {rescoreSummary.from} to {rescoreSummary.to} (Risk Score delta {rescoreSummary.delta.toFixed(3)})
        </p>
      ) : null}
    </section>
  );
};


export const HumanReviewPanel = ({
  runId,
  reviewForm,
  setReviewForm,
  onSubmit,
  saving,
  savedReview,
  message,
}) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <h3 className="text-sm font-semibold text-slate-900">Human Review Workflow</h3>
    <p className="mt-1 text-xs text-slate-500">
      Capture accountable reviewer notes before this output is used operationally.
    </p>
    <p className="mt-1 text-[11px] text-slate-500">Run ID: {runId || "Unavailable"}</p>

    {savedReview ? (
      <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
        Last review by {savedReview.reviewed_by} on {formatCheckedAt(savedReview.reviewed_at_utc)} ({savedReview.decision}).
      </div>
    ) : null}

    <div className="mt-4 grid gap-3 md:grid-cols-2">
      <input
        type="text"
        placeholder="Reviewer Name"
        value={reviewForm.reviewed_by}
        onChange={(event) => setReviewForm((prev) => ({ ...prev, reviewed_by: event.target.value }))}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
      />
      <SelectControl
        value={reviewForm.decision}
        onChange={(event) => setReviewForm((prev) => ({ ...prev, decision: event.target.value }))}
        className="border-slate-200 py-2 focus:border-slate-400 focus:ring-slate-200"
      >
        {REVIEW_DECISIONS.map((decision) => (
          <option key={decision} value={decision}>
            {decision}
          </option>
        ))}
      </SelectControl>
      <textarea
        rows={3}
        placeholder="Review reason and human evidence"
        value={reviewForm.review_reason}
        onChange={(event) => setReviewForm((prev) => ({ ...prev, review_reason: event.target.value }))}
        className="md:col-span-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
      />
    </div>

    <button
      type="button"
      onClick={onSubmit}
      disabled={saving || !runId}
      className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
    >
      {saving ? "Saving Review..." : "Save Review Note"}
    </button>
    {message ? <p className="mt-2 text-xs text-slate-600">{message}</p> : null}
  </section>
);


export const HistoryPanel = ({ historyEntries, trend, loading, onRefresh, onLoadRun }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <div className="flex items-center justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Prediction History & Trend</h3>
        <p className="mt-1 text-xs text-slate-500">Track risk movement and stability over time for this company profile.</p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
      >
        {loading ? "Refreshing..." : "Refresh"}
      </button>
    </div>

    {trend ? (
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
          <p className="text-xs text-slate-500">Entries</p>
          <p className="text-sm font-semibold text-slate-900">{trend.entry_count}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
          <p className="text-xs text-slate-500">Latest Risk</p>
          <p className="text-sm font-semibold text-slate-900">{trend.latest_risk || "N/A"}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
          <p className="text-xs text-slate-500">Risk Direction</p>
          <p className="text-sm font-semibold text-slate-900">{trend.risk_direction || "flat"}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
          <p className="text-xs text-slate-500">Avg Confidence</p>
          <p className="text-sm font-semibold text-slate-900">
            {trend.avg_confidence != null ? `${(trend.avg_confidence * 100).toFixed(1)}%` : "N/A"}
          </p>
        </div>
      </div>
    ) : null}

    <div className="mt-4 space-y-2">
      {historyEntries.length ? historyEntries.map((entry) => (
        <div key={entry.run_id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500">{formatCheckedAt(entry.created_at_utc)}</p>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getRiskBadgeClass(entry?.prediction?.layoff_risk)}`}>
              {entry?.prediction?.layoff_risk || "Unknown"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Confidence {(Number(entry?.prediction?.confidence || 0) * 100).toFixed(1)}% | Market {entry?.market_signals?.marketRegime || "N/A"}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Reviewed: {entry?.review?.reviewed_by ? `${entry.review.reviewed_by} (${entry.review.decision})` : "No"}
          </p>
          <button
            type="button"
            onClick={() => onLoadRun(entry)}
            className="mt-2 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-white"
          >
            Load Snapshot
          </button>
        </div>
      )) : (
        <p className="text-sm text-slate-500">No history available yet.</p>
      )}
    </div>
  </section>
);


export const ModelQualityPanel = ({ report, loading, error, onLoad }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Model Quality Dashboard</h3>
        <p className="mt-1 text-xs text-slate-500">
          Production checks for accuracy, calibration, confusion matrix, and high-confidence failures.
        </p>
      </div>
      <button
        type="button"
        onClick={onLoad}
        disabled={loading}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
      >
        {loading ? "Loading..." : "Load Metrics"}
      </button>
    </div>

    {error ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

    {report ? (
      <div className="mt-4 space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
            <p className="text-xs text-slate-500">Accuracy</p>
            <p className="text-sm font-semibold text-slate-900">{(Number(report?.overall?.accuracy || 0) * 100).toFixed(2)}%</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
            <p className="text-xs text-slate-500">Macro F1</p>
            <p className="text-sm font-semibold text-slate-900">{Number(report?.overall?.macro_f1 || 0).toFixed(4)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
            <p className="text-xs text-slate-500">High Recall</p>
            <p className="text-sm font-semibold text-slate-900">{Number(report?.per_class?.High?.recall || 0).toFixed(4)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
            <p className="text-xs text-slate-500">ECE</p>
            <p className="text-sm font-semibold text-slate-900">{Number(report?.calibration?.expected_calibration_error || 0).toFixed(4)}</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-3 py-2 text-left">Actual \ Pred</th>
                {(report?.confusion_matrix?.labels || []).map((label) => (
                  <th key={label} className="px-3 py-2 text-left">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(report?.confusion_matrix?.matrix || []).map((row, rowIdx) => (
                <tr key={`row-${rowIdx}`} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-semibold text-slate-700">{report?.confusion_matrix?.labels?.[rowIdx] || rowIdx}</td>
                  {row.map((value, colIdx) => (
                    <td key={`cell-${rowIdx}-${colIdx}`} className="px-3 py-2 text-slate-700">{value}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">High-Confidence Errors</p>
          <div className="mt-2 space-y-2">
            {(report?.error_analysis?.high_confidence_errors || []).slice(0, 5).map((item, idx) => (
              <div key={`${item.company_name}-${idx}`} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                <p className="text-xs text-slate-700">
                  {item.company_name} | {item.job_title} | {item.department}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Actual {item.actual}, Predicted {item.predicted}, Confidence {(Number(item.confidence || 0) * 100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    ) : null}
  </section>
);
