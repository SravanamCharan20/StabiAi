import React, { useMemo } from "react";
import {
  HiCheckCircle,
  HiExclamationCircle,
  HiLightBulb,
  HiShieldCheck,
  HiTrendingUp,
} from "react-icons/hi";
import { buildRiskStory } from "../pages/employee/predictor/utils";

const calculateJobSecurityScore = (predictionData) => {
  const risk = String(predictionData?.prediction?.layoff_risk || "").toLowerCase();
  const confidence = Number(predictionData?.prediction?.confidence || 0);

  let baseScore = 50;
  if (risk === "low") baseScore = 85;
  else if (risk === "medium") baseScore = 60;
  else if (risk === "high") baseScore = 30;

  const adjusted = baseScore + ((confidence - 0.7) * 20);
  return Math.max(0, Math.min(100, Math.round(adjusted)));
};

const getRiskMeta = (score) => {
  if (score >= 80) {
    return {
      label: "Strong",
      icon: HiShieldCheck,
      badge: "bg-emerald-100 text-emerald-800",
      panel: "border-emerald-200 bg-emerald-50/35",
      iconWrap: "bg-emerald-100 text-emerald-700",
      message: "Your current profile has strong protection signals.",
    };
  }
  if (score >= 60) {
    return {
      label: "Stable",
      icon: HiCheckCircle,
      badge: "bg-sky-100 text-sky-800",
      panel: "border-sky-200 bg-sky-50/35",
      iconWrap: "bg-sky-100 text-sky-700",
      message: "Your current profile is stable with targeted improvement scope.",
    };
  }
  if (score >= 40) {
    return {
      label: "Watch",
      icon: HiExclamationCircle,
      badge: "bg-amber-100 text-amber-900",
      panel: "border-amber-200 bg-amber-50/35",
      iconWrap: "bg-amber-100 text-amber-700",
      message: "Your profile is directionally vulnerable and needs active correction.",
    };
  }
  return {
    label: "At Risk",
    icon: HiExclamationCircle,
    badge: "bg-rose-100 text-rose-800",
    panel: "border-rose-200 bg-rose-50/35",
    iconWrap: "bg-rose-100 text-rose-700",
    message: "Your profile shows elevated risk and requires immediate action.",
  };
};

const simplifyFactor = (factor) => {
  const feature = String(factor?.feature || "");
  const direction = String(factor?.direction || "");
  const isGood = direction === "reduces_risk";
  const isBad = direction === "increases_risk";
  const simpleNames = {
    performance_rating: "Performance",
    years_at_company: "Tenure",
    tech_stack: "Technical Stack",
    department: "Department Stability",
    salary_range: "Salary Positioning",
    role_demand_index: "Role Demand",
    tech_stack_trend_score: "Stack Relevance",
    department_resilience_index: "Department Resilience",
    revenue_growth: "Company Growth",
    stock_price_change: "Market Signal",
    economic_pressure: "Economic Pressure",
    industry_layoff_rate: "Industry Layoff Trend",
  };
  const name = simpleNames[feature] || feature.replace(/_/g, " ");
  const reason = String(factor?.reason || "")
    .replace(/This profile tends to push risk upward/gi, "This currently increases risk")
    .replace(/This profile acts as a protective signal/gi, "This currently reduces risk")
    .replace(/baseline/gi, "average benchmark")
    .trim();
  return { name, reason, isGood, isBad };
};

const toShortText = (value, limit = 185) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > limit ? `${text.slice(0, limit - 1).trim()}...` : text;
};

const buildNextSteps = (predictionData, resumeIntelligence) => {
  const next = [];
  const seen = new Set();

  const add = (line) => {
    const item = toShortText(line, 165);
    const key = item.toLowerCase();
    if (!item || seen.has(key)) return;
    seen.add(key);
    next.push(item);
  };

  (predictionData?.prediction?.improvement_tips || []).slice(0, 3).forEach(add);

  (resumeIntelligence?.skillGaps || []).slice(0, 2).forEach((gap) => {
    const name = typeof gap === "string" ? gap : gap?.name || gap?.skill;
    if (name) {
      add(`Close ${name} gap with one measurable project outcome in the next 4-6 weeks.`);
    }
  });

  if (next.length < 3) {
    add("Align one weekly deliverable with business-critical metrics and document impact.");
    add("Review skill-market fit with your manager and pick one upskilling target for this quarter.");
  }

  return next.slice(0, 4);
};

const SimplifiedResults = ({ predictionData, resumeIntelligence }) => {
  const story = useMemo(() => buildRiskStory(predictionData), [predictionData]);
  const score = calculateJobSecurityScore(predictionData);
  const meta = getRiskMeta(score);
  const RiskIcon = meta.icon;
  const confidence = Math.round((Number(predictionData?.prediction?.confidence || 0)) * 100);
  const reliabilityGate = String(predictionData?.reliability?.gate || "medium").toLowerCase();
  const reliabilityLabel = reliabilityGate === "high" ? "High" : reliabilityGate === "warning" ? "Reduced" : "Moderate";
  const marketRegime = predictionData?.market_signals?.marketRegime || "Stable";

  const factors = (predictionData?.prediction?.top_factors || []).slice(0, 6).map(simplifyFactor);
  const riskSignals = factors.filter((item) => item.isBad).slice(0, 3);
  const protectiveSignals = factors.filter((item) => item.isGood).slice(0, 3);
  const nextSteps = buildNextSteps(predictionData, resumeIntelligence);
  const resumeSkills = Array.isArray(resumeIntelligence?.skills) ? resumeIntelligence.skills : [];

  return (
    <div className="space-y-4">
      <section className={`rounded-3xl border p-5 shadow-sm ${meta.panel}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${meta.iconWrap}`}>
              <RiskIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Simple View</p>
              <h2 className="font-display text-lg font-semibold text-slate-900">Job Security Score</h2>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${meta.badge}`}>
            {meta.label}
          </span>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1.45fr_1fr]">
          <div className="rounded-2xl border border-white/80 bg-white/90 p-4">
            <div className="flex items-end gap-2">
              <p className="text-4xl font-semibold text-slate-900">{score}</p>
              <p className="pb-1 text-sm text-slate-500">/ 100</p>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900">{meta.message}</p>
            <p className="mt-1 text-sm text-slate-700">{toShortText(story.summary, 220)}</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-xl border border-white/80 bg-white/90 p-3">
              <p className="text-xs text-slate-500">Confidence</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{confidence}%</p>
            </div>
            <div className="rounded-xl border border-white/80 bg-white/90 p-3">
              <p className="text-xs text-slate-500">Reliability</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{reliabilityLabel}</p>
            </div>
            <div className="rounded-xl border border-white/80 bg-white/90 p-3">
              <p className="text-xs text-slate-500">Market Regime</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{marketRegime}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-300 bg-slate-50/60 p-4 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">What This Means</h3>
        <p className="mt-2 text-sm text-slate-800">{toShortText(story.summary, 220)}</p>
        <p className="mt-1 text-sm text-slate-700">{toShortText(story.marketLine, 220)}</p>
        {story.stackLine ? <p className="mt-1 text-sm text-slate-700">{toShortText(story.stackLine, 190)}</p> : null}
      </section>

      {resumeSkills.length > 0 ? (
        <section className="rounded-2xl border border-cyan-200 bg-cyan-50/35 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <HiTrendingUp className="h-5 w-5 text-cyan-700" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-900">Current Skill Signals</h3>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {resumeSkills.slice(0, 6).map((skill, idx) => {
              const label = typeof skill === "string" ? skill : skill?.name || "Skill";
              const demand = Number(typeof skill === "object" ? skill?.marketDemand : null);
              return (
                <div key={`${label}-${idx}`} className="rounded-xl border border-cyan-100 bg-white/90 p-3">
                  <p className="text-sm font-semibold text-slate-900">{label}</p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {Number.isFinite(demand) ? `Market match: ${demand}%` : "Mapped from resume/profile signals"}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-amber-200 bg-amber-50/45 p-4 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-900">What Needs Your Attention</h3>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">Risk Signals</p>
            {riskSignals.length ? riskSignals.map((item, idx) => (
              <div key={`${item.name}-${idx}`} className="rounded-xl border border-rose-100 bg-white/90 p-3">
                <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                <p className="mt-1 text-sm text-slate-700">{toShortText(item.reason, 145)}</p>
              </div>
            )) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                No major upward pressure signals in this run.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Protective Signals</p>
            {protectiveSignals.length ? protectiveSignals.map((item, idx) => (
              <div key={`${item.name}-${idx}`} className="rounded-xl border border-emerald-100 bg-white/90 p-3">
                <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                <p className="mt-1 text-sm text-slate-700">{toShortText(item.reason, 145)}</p>
              </div>
            )) : (
              <div className="rounded-xl border border-slate-200 bg-white/90 p-3 text-sm text-slate-700">
                Protective signals are currently limited.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <HiLightBulb className="h-5 w-5 text-slate-700" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Your Next Steps</h3>
        </div>
        <ol className="mt-3 space-y-2">
          {nextSteps.map((step, index) => (
            <li key={`${step}-${index}`} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};

export default SimplifiedResults;
