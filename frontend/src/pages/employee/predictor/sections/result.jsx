import React, { useState } from "react";
import {
  DISPLAY_MARKET_SIGNAL_KEYS,
  INPUT_QUALITY_TONE,
  RESULT_VIEW_TABS,
  RISK_TONE,
} from "../constants";
import {
  buildStabilizationPlan,
  buildRiskStory,
  formatFeatureLabel,
  formatFeatureValue,
  getContextualFactorReason,
  getRiskBadgeClass,
  getSignalStrengthLabel,
} from "../utils";
import { ReliabilityBanner, ResponsibleBrief, SegmentTabs } from "./core";

export const ResultPanel = ({ predictionData, inputQuality }) => {
  const [resultView, setResultView] = useState("story");
  const prediction = predictionData?.prediction || {};
  const probabilities = Object.entries(prediction.probabilities || {});
  const topFactors = Array.isArray(prediction.top_factors) ? prediction.top_factors.slice(0, 5) : [];
  const improvementTips = Array.isArray(prediction.improvement_tips) ? prediction.improvement_tips.slice(0, 4) : [];
  const marketSignalSource = predictionData?.market_signals || {};
  const marketSignals = DISPLAY_MARKET_SIGNAL_KEYS
    .filter((key) => marketSignalSource[key] !== undefined && marketSignalSource[key] !== null && marketSignalSource[key] !== "")
    .map((key) => [key, marketSignalSource[key]]);
  const normalizedInput = Object.entries(predictionData?.normalized_input || {});
  const fullFeatures = Object.entries(predictionData?.data || {});

  const risk = String(prediction.layoff_risk || "unknown").toLowerCase();
  const tone = RISK_TONE[risk] || RISK_TONE.unknown;
  const RiskIcon = tone.icon;
  const confidence = Number(prediction.confidence || 0);
  const riskScore = Number(prediction.risk_score || 0);
  const riskMeter = Math.max(0, Math.min(100, riskScore));
  const riskMeterTone = risk === "high"
    ? "bg-rose-500"
    : risk === "medium"
      ? "bg-amber-500"
      : risk === "low"
        ? "bg-emerald-500"
        : "bg-slate-500";
  const riskHeadline = risk === "high"
    ? "Immediate stabilization actions are recommended."
    : risk === "medium"
      ? "Risk is balanced and sensitive to near-term changes."
      : risk === "low"
        ? "Current profile is relatively stable."
        : "Risk posture is currently unclear.";
  const reasonForFactor = (factor) => getContextualFactorReason(factor, predictionData);
  const riskStory = buildRiskStory(predictionData);
  const stabilizationPlan = buildStabilizationPlan(predictionData);
  const stackSurvival = predictionData?.stack_survival || null;
  const stackResolution = predictionData?.stack_resolution || null;
  const stackSignal = String(stackSurvival?.current_stack_signal || "unknown").toLowerCase();
  const stackSignalTone = stackSignal === "strong"
    ? "border-emerald-200 bg-emerald-50/40 text-emerald-800"
    : stackSignal === "moderate"
      ? "border-amber-200 bg-amber-50/40 text-amber-800"
      : stackSignal === "weak"
        ? "border-rose-200 bg-rose-50/40 text-rose-800"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className="space-y-4">
      <ReliabilityBanner reliability={predictionData?.reliability} />

      <div className={`rounded-3xl border p-5 shadow-sm ${tone.card}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <RiskIcon className="h-5 w-5 text-slate-800" />
            <h2 className="font-display text-lg font-semibold text-slate-900">Layoff Risk Prediction</h2>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${tone.badge}`}>
            {prediction.layoff_risk || "Unknown"}
          </span>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1.45fr_1fr]">
          <div className="rounded-2xl border border-white/80 bg-white/85 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Decision Snapshot</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{riskHeadline}</p>
            <p className="mt-2 text-sm text-slate-700">{riskStory.summary}</p>
            <p className="mt-1 text-sm text-slate-700">{riskStory.marketLine}</p>
            {riskStory.stackLine ? <p className="mt-1 text-sm text-slate-700">{riskStory.stackLine}</p> : null}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>Risk Index</span>
                <span>{riskScore.toFixed(1)} / 100</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-200/90">
                <div
                  className={`h-full rounded-full ${riskMeterTone}`}
                  style={{ width: `${Math.max(4, riskMeter)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-xl border border-white/80 bg-white/85 p-3">
              <p className="text-xs text-slate-500">Model Confidence</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{(confidence * 100).toFixed(1)}%</p>
            </div>
            <div className="rounded-xl border border-white/80 bg-white/85 p-3">
              <p className="text-xs text-slate-500">Input Quality</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{inputQuality?.score ?? "N/A"} / 100</p>
              <p className="mt-1 text-xs text-slate-600">
                Market: {predictionData?.market_signals?.marketRegime || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <ResponsibleBrief predictionData={predictionData} inputQuality={inputQuality} />

      <section className="rounded-2xl border border-slate-200 bg-rose-200/20 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Risk Insight Workspace</p>
            <p className="mt-1 text-xs text-slate-500">Switch views to keep analysis concise and focused.</p>
          </div>
          <SegmentTabs tabs={RESULT_VIEW_TABS} active={resultView} onChange={setResultView} />
        </div>

        {resultView === "story" ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">In Simple Terms</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{riskStory.summary}</p>
              <p className="mt-1 text-sm text-slate-700">{riskStory.marketLine}</p>
              {riskStory.stackLine ? <p className="mt-1 text-sm text-slate-700">{riskStory.stackLine}</p> : null}
              <p className="mt-1 text-sm text-slate-700">{riskStory.overall}</p>
            </div>
            {stackSurvival ? (
              <div className={`rounded-xl border p-3 ${stackSignalTone}`}>
                <p className="text-xs font-semibold uppercase tracking-wide">Current Stack Survival Snapshot</p>
                <p className="mt-1 text-sm font-semibold">
                  {stackSurvival.scope}
                </p>
                <p className="mt-1 text-sm">{stackSurvival.narrative}</p>
                <p className="mt-2 text-xs">
                  Current stack rank: {stackSurvival.current_stack_rank || "N/A"} / {stackSurvival.compared_stacks || "N/A"}
                  {stackSurvival.current_stack_low_risk_share != null
                    ? ` | Low-risk share: ${(Number(stackSurvival.current_stack_low_risk_share) * 100).toFixed(1)}%`
                    : ""}
                </p>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-lg border border-white/70 bg-white/80 p-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Most Resilient Stacks</p>
                    <div className="mt-1.5 space-y-1.5 text-sm text-slate-800">
                      {(stackSurvival.top_resilient_stacks || []).map((item, idx) => (
                        <p key={`top-stack-${item.tech_stack}-${idx}`}>
                          {idx + 1}. {item.tech_stack} ({(Number(item.low_risk_share || 0) * 100).toFixed(1)}% low-risk)
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-white/70 bg-white/80 p-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Stacks Under Pressure</p>
                    <div className="mt-1.5 space-y-1.5 text-sm text-slate-800">
                      {(stackSurvival.watchlist_stacks || []).map((item, idx) => (
                        <p key={`risk-stack-${item.tech_stack}-${idx}`}>
                          {idx + 1}. {item.tech_stack} ({(Number(item.low_risk_share || 0) * 100).toFixed(1)}% low-risk)
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            {stackResolution?.mapping_type && stackResolution.mapping_type !== "direct" ? (
              <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">Stack Mapping Applied</p>
                <p className="mt-1 text-sm text-sky-900">
                  Free-form stack input was mapped to <span className="font-semibold">{stackResolution.resolved_tech_stack}</span> for model compatibility.
                </p>
                {stackResolution.reason ? (
                  <p className="mt-1 text-xs text-sky-800">{stackResolution.reason}</p>
                ) : null}
              </div>
            ) : null}
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Pressures</p>
                <div className="mt-2 space-y-2">
                  {riskStory.pressureSignals.length ? (
                    riskStory.pressureSignals.map((item, index) => (
                      <div key={`pressure-${index}`} className="rounded-lg border border-rose-100 bg-white/80 p-2.5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">{item.strength} Signal</p>
                        <p className="mt-1 text-sm font-semibold text-rose-900">{item.title}</p>
                        <p className="mt-1 text-sm text-rose-900">{item.reason}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-rose-800">No major pressure signals were detected in this run.</p>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Protection</p>
                <div className="mt-2 space-y-2">
                  {riskStory.protectionSignals.length ? (
                    riskStory.protectionSignals.map((item, index) => (
                      <div key={`protection-${index}`} className="rounded-lg border border-emerald-100 bg-white/80 p-2.5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{item.strength} Signal</p>
                        <p className="mt-1 text-sm font-semibold text-emerald-900">{item.title}</p>
                        <p className="mt-1 text-sm text-emerald-900">{item.reason}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-emerald-800">No strong protective signals were detected in this run.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">30-Day Stabilization Plan</p>
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                {stabilizationPlan.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Step {index + 1}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-700">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {resultView === "signals" ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-3">
              <h3 className="text-sm font-semibold text-slate-900">Class Probabilities</h3>
              <div className="mt-3 space-y-3">
                {probabilities.length ? (
                  probabilities.map(([label, value]) => (
                    <div key={label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>{label}</span>
                        <span>{(Number(value) * 100).toFixed(2)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-700"
                          style={{ width: `${Math.max(2, Number(value) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No probability breakdown available.</p>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-3">
              <h3 className="text-sm font-semibold text-slate-900">Market Signals Used</h3>
              <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                {marketSignals.length ? (
                  marketSignals.map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{formatFeatureLabel(key)}</span>
                      <span className="font-medium text-slate-900">{formatFeatureValue(key, value)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Live market stats unavailable for this run.</p>
                )}
              </div>
            </section>
          </div>
        ) : null}

        {resultView === "drivers" ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-3">
              <h3 className="text-sm font-semibold text-slate-900">Top Risk Drivers</h3>
              <div className="mt-3 space-y-3">
                {topFactors.length ? (
                  topFactors.map((factor, index) => (
                    <div key={`${factor.feature}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                      <p className="text-sm font-semibold text-slate-900">{factor.label || formatFeatureLabel(factor.feature)}</p>
                      <p className="mt-1 text-xs text-slate-700">{reasonForFactor(factor)}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>
                          Effect: {factor.direction === "increases_risk" ? "Raises Risk" : factor.direction === "reduces_risk" ? "Lowers Risk" : "Neutral"}
                        </span>
                        <span>Signal: {getSignalStrengthLabel(factor.impact)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Top factors unavailable for this run.</p>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-3">
              <h3 className="text-sm font-semibold text-slate-900">Priority Actions</h3>
              <div className="mt-3 space-y-2">
                {improvementTips.length ? (
                  improvementTips.map((tip, index) => (
                    <div key={`${tip}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-700">
                      {index + 1}. {tip}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No immediate tips generated.</p>
                )}
              </div>
            </section>
          </div>
        ) : null}

        {resultView === "inputs" ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Model Input Values</p>
              <div className="mt-2 max-h-80 space-y-2 overflow-y-auto pr-1">
                {normalizedInput.map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{formatFeatureLabel(key)}</span>
                    <span className="font-medium text-slate-900">{formatFeatureValue(key, value)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Full Feature Vector</p>
              <div className="mt-2 max-h-80 space-y-2 overflow-y-auto pr-1">
                {fullFeatures.map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{formatFeatureLabel(key)}</span>
                    <span className="font-medium text-slate-900">{formatFeatureValue(key, value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
};
