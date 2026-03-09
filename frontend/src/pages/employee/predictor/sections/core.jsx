import React from "react";
import { HiChevronDown } from "react-icons/hi";
import {
  FORM_INPUT_CLASS,
  FORM_SELECT_CLASS,
  MAPPING_MODE_LABEL,
  RELIABILITY_SOURCE_LABEL,
  RELIABILITY_STATUS_LABEL,
  RELIABILITY_TONE,
  WORKSPACE_FRAME_THEME,
} from "../constants";
import { formatCheckedAt, getResponsibleAssessment } from "../utils";

export const ResponsibleBrief = ({ predictionData, inputQuality }) => {
  const assessment = getResponsibleAssessment(predictionData, inputQuality);

  return (
    <details className={`rounded-2xl border ${assessment.statusMeta.container}`}>
      <summary className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Responsible Prediction Brief</p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">{assessment.statusMeta.title}</h3>
          <p className="mt-1 text-sm text-slate-700">{assessment.statusMeta.text}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${assessment.statusMeta.badgeClass}`}>
          {assessment.statusMeta.badge}
        </span>
      </summary>

      <div className="px-4 pb-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-white/70 bg-white/70 p-3">
            <p className="text-xs text-slate-500">Predicted Risk</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{assessment.risk}</p>
          </div>
          <div className="rounded-xl border border-white/70 bg-white/70 p-3">
            <p className="text-xs text-slate-500">Model Confidence</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{(assessment.confidence * 100).toFixed(1)}%</p>
          </div>
          <div className="rounded-xl border border-white/70 bg-white/70 p-3">
            <p className="text-xs text-slate-500">Reliability Score</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{(assessment.reliabilityScore * 100).toFixed(1)}%</p>
          </div>
          <div className="rounded-xl border border-white/70 bg-white/70 p-3">
            <p className="text-xs text-slate-500">Market Volatility</p>
            <p className={`mt-1 text-sm font-semibold ${assessment.volatility.tone}`}>{assessment.volatility.label}</p>
            <p className="mt-1 text-[11px] text-slate-600">{assessment.volatility.detail}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-white/70 bg-white/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Required Checks</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {assessment.checks.map((item, idx) => (
                <li key={`check-${idx}`}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-white/70 bg-white/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Known Limitations</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {assessment.limitations.map((item, idx) => (
                <li key={`limitation-${idx}`}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-3 text-[11px] text-slate-600">
          Input Quality: {assessment.inputScore != null ? `${assessment.inputScore.toFixed(0)}/100` : "N/A"} | Market Regime: {assessment.marketRegime} | Checked: {formatCheckedAt(assessment.checkedAt)}
        </p>
      </div>
    </details>
  );
};


export const Field = ({
  icon,
  label,
  name,
  value,
  onChange,
  options,
  type = "text",
  min,
  max,
  step,
  required = true,
  error = "",
}) => (
  <label className="space-y-2">
    <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
      {React.createElement(icon, { className: "h-4 w-4 text-slate-500" })}
      {label}
    </span>
    {options ? (
      <SelectControl
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        aria-invalid={Boolean(error)}
        className={`${
          error
            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
            : "border-slate-200 focus:border-slate-400 focus:ring-slate-200"
        }`}
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </SelectControl>
    ) : (
      <input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        min={min}
        max={max}
        step={step}
        required={required}
        aria-invalid={Boolean(error)}
        className={`${FORM_INPUT_CLASS} ${
          error
            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
            : "border-slate-200 focus:border-slate-400 focus:ring-slate-200"
        }`}
      />
    )}
    {error ? <p className="text-xs text-rose-700">{error}</p> : null}
  </label>
);


export const SelectControl = ({
  children,
  className = "",
  ...props
}) => (
  <div className="relative">
    <select
      {...props}
      className={`${FORM_SELECT_CLASS} ${className}`}
    >
      {children}
    </select>
    <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
  </div>
);


export const ReliabilityBanner = ({ reliability }) => {
  if (!reliability) {
    return null;
  }

  const gate = String(reliability.gate || "medium").toLowerCase();
  const tone = RELIABILITY_TONE[gate] || RELIABILITY_TONE.medium;
  const Icon = tone.icon;
  const score = Number.isFinite(Number(reliability.score))
    ? `${(Number(reliability.score) * 100).toFixed(1)}%`
    : "N/A";
  const source = RELIABILITY_SOURCE_LABEL[reliability.source] || reliability.source || "N/A";
  const status = RELIABILITY_STATUS_LABEL[reliability.market_data_status]
    || reliability.market_data_status
    || "Unknown";
  const mapping = MAPPING_MODE_LABEL[reliability.market_mapping_type] || "Standard Mapping";

  return (
    <div className={`rounded-2xl border p-4 ${tone.wrap}`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 ${tone.text}`} />
        <div className="space-y-1">
          <p className={`text-sm font-semibold ${tone.text}`}>
            {tone.title} • {score}
          </p>
          <p className={`text-sm ${tone.text}`}>{reliability.message}</p>
          <p className="text-xs text-slate-600">
            Feed: {source} | Mode: {status} | Mapping: {mapping}
          </p>
        </div>
      </div>
    </div>
  );
};


export const SegmentTabs = ({ tabs, active, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        onClick={() => onChange(tab.id)}
        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
          active === tab.id
            ? "border-slate-900 bg-slate-900 text-white"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);


export const WorkspacePanelFrame = ({ tabId, children }) => {
  const tone = WORKSPACE_FRAME_THEME[tabId] || WORKSPACE_FRAME_THEME.simulator;
  return (
    <section className={`rounded-3xl border p-4 shadow-sm ${tone.border} ${tone.bg}`}>
      <div className="mb-3">
        <span className={`rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${tone.text}`}>
          {tone.label}
        </span>
      </div>
      <div className="rounded-2xl border border-white/85 bg-white/90 p-1">
        {children}
      </div>
    </section>
  );
};
