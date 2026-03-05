import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  HiCheckCircle,
  HiExclamationCircle,
  HiInformationCircle,
  HiOutlineBriefcase,
  HiOutlineCalendar,
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiOutlineHome,
  HiOutlineLocationMarker,
  HiOutlineOfficeBuilding,
  HiOutlineUserGroup,
} from "react-icons/hi";
import AiSuggestions from "./aiSuggestions";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:9000";

const FALLBACK_COMPANY_OPTIONS = [
  "Accenture India Pvt Ltd",
  "Amazon Development Centre India Pvt Ltd",
  "Amazon India",
  "Apollo Hospitals",
  "Apple India",
  "Axis Bank",
  "Bajaj Auto",
  "Bharti Airtel",
  "Capgemini India",
  "Cipla",
  "Cognizant India",
  "Coforge",
  "Deloitte India",
  "EY India",
  "Facebook India",
  "Flipkart Internet Pvt Ltd",
  "Fortis Healthcare",
  "Google India",
  "HCL Technologies",
  "HDFC Bank",
  "IBM India",
  "ICICI Bank",
  "Infosys",
  "Jio Platforms",
  "Larsen & Toubro",
  "LTIMindtree",
  "Mahindra & Mahindra",
  "Meesho",
  "Meta India",
  "Microsoft India",
  "Mphasis",
  "Myntra",
  "Netflix India",
  "Oracle Financial Services Software Ltd.",
  "Paytm",
  "Persistent Systems",
  "PwC India",
  "Razorpay",
  "Sun Pharma",
  "Tata Consultancy Services (TCS)",
  "Tata Motors",
  "Tech Mahindra Ltd.",
  "Vodafone Idea",
  "Wipro Limited",
];

const FALLBACK_LOCATION_OPTIONS = [
  "Ahmedabad",
  "Bengaluru",
  "Chennai",
  "Coimbatore",
  "Delhi",
  "Gurugram",
  "Hyderabad",
  "Kochi",
  "Kolkata",
  "Mumbai",
  "Noida",
  "Pune",
];

const FALLBACK_QUARTER_OPTIONS = [
  "Q1 2024",
  "Q2 2024",
  "Q3 2024",
  "Q4 2024",
  "Q1 2025",
  "Q2 2025",
  "Q3 2025",
  "Q4 2025",
];

const FALLBACK_JOB_OPTIONS = [
  "Software Engineer",
  "Senior Software Engineer",
  "Data Scientist",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "Site Reliability Engineer",
  "Product Manager",
  "Project Manager",
  "Engineering Manager",
  "Business Analyst",
];

const FALLBACK_DEPARTMENT_OPTIONS = [
  "Engineering",
  "Analytics",
  "Product",
  "IT",
  "Operations",
  "Finance",
  "HR",
  "Sales",
  "Management",
];

const RISK_TONE = {
  low: {
    badge: "bg-emerald-100/70 text-emerald-800",
    card: "border-slate-200 bg-white",
    icon: HiCheckCircle,
  },
  medium: {
    badge: "bg-amber-100/70 text-amber-800",
    card: "border-slate-200 bg-white",
    icon: HiInformationCircle,
  },
  high: {
    badge: "bg-rose-100/70 text-rose-800",
    card: "border-slate-200 bg-white",
    icon: HiExclamationCircle,
  },
  unknown: {
    badge: "bg-slate-100 text-slate-700",
    card: "border-slate-200 bg-white",
    icon: HiInformationCircle,
  },
};

const RELIABILITY_TONE = {
  high: {
    wrap: "border-slate-200 bg-white",
    text: "text-emerald-800",
    icon: HiCheckCircle,
    title: "High Reliability",
  },
  medium: {
    wrap: "border-slate-200 bg-white",
    text: "text-amber-800",
    icon: HiInformationCircle,
    title: "Moderate Reliability",
  },
  warning: {
    wrap: "border-slate-200 bg-white",
    text: "text-rose-800",
    icon: HiExclamationCircle,
    title: "Reduced Reliability",
  },
};

const INPUT_QUALITY_TONE = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-rose-200 bg-rose-50 text-rose-800",
};

const RELIABILITY_SOURCE_LABEL = {
  nse_live_api: "NSE Live Feed",
  stooq_daily_api: "Global Market Feed",
  yahoo_chart_api: "Global Chart Feed",
  fallback: "Unavailable",
  unavailable: "Unavailable",
};

const RELIABILITY_STATUS_LABEL = {
  live_market: "Live Market Connected",
  fallback_defaults: "Fallback Defaults",
};

const MAPPING_MODE_LABEL = {
  direct_listing: "Direct Listed Company",
  market_equivalent: "Market-Equivalent Company",
  user_ticker: "User Symbol",
};

const DISPLAY_MARKET_SIGNAL_KEYS = [
  "marketRegime",
  "marketStressScore",
  "company_return_90d",
  "market_return_90d",
  "relative_return_90d",
  "company_volatility_90d",
  "market_volatility_90d",
  "india_vix",
  "benchmark_symbol",
  "nse_index_price",
  "us_index_price",
  "global_index_price",
  "company_last_price",
  "company_previous_close",
];

const ACTION_STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "blocked", label: "Blocked" },
];

const REVIEW_DECISIONS = [
  "manual_review_required",
  "monitor_with_manager",
  "coach_and_reassess",
  "advisory_acknowledged",
];

const RESULT_VIEW_TABS = [
  { id: "story", label: "Story" },
  { id: "signals", label: "Signals" },
  { id: "drivers", label: "Drivers" },
  { id: "inputs", label: "Inputs" },
];

const WORKSPACE_TABS = [
  { id: "simulator", label: "What-If" },
  { id: "actions", label: "Actions" },
  { id: "review", label: "Review" },
  { id: "history", label: "History" },
  { id: "quality", label: "Quality" },
  { id: "guidance", label: "AI Guidance" },
];

const toAnnualInr = (value, unit) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }
  if (unit === "LPA") {
    return numeric * 100000;
  }
  return numeric;
};

const formatFeatureLabel = (key) =>
  String(key || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatFeatureValue = (key, value) => {
  if (value == null || value === "") {
    return "N/A";
  }
  if (typeof value === "number") {
    if (key === "salary_range") {
      const lpa = Number(value) / 100000;
      return `₹${Math.round(value).toLocaleString("en-IN")} (${lpa.toFixed(1)} LPA)`;
    }
    if (key === "marketStressScore") {
      return Number(value).toFixed(3);
    }
    if (
      [
        "revenue_growth",
        "profit_margin",
        "stock_price_change",
        "inflation_rate",
        "unemployment_rate",
        "industry_layoff_rate",
        "company_return_90d",
        "market_return_90d",
        "relative_return_90d",
        "company_volatility_90d",
        "market_volatility_90d",
        "india_vix",
      ].includes(key)
    ) {
      return `${Number(value).toFixed(2)}%`;
    }
    return Number(value).toLocaleString("en-IN");
  }
  return String(value);
};

const toFiniteNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const getRiskBadgeClass = (label) => {
  const risk = String(label || "").toLowerCase();
  if (risk === "high") {
    return "bg-rose-100 text-rose-800";
  }
  if (risk === "medium") {
    return "bg-amber-100 text-amber-800";
  }
  if (risk === "low") {
    return "bg-emerald-100 text-emerald-800";
  }
  return "bg-slate-100 text-slate-700";
};

const getSignalStrengthLabel = (impact) => {
  const value = Math.abs(Number(impact));
  if (!Number.isFinite(value)) {
    return "Relevant";
  }
  if (value >= 0.2) {
    return "Strong";
  }
  if (value >= 0.1) {
    return "Moderate";
  }
  return "Mild";
};

const getContextualFactorReason = (factor, predictionData) => {
  if (!factor) {
    return "No additional context available.";
  }

  const feature = String(factor.feature || "");
  const direction = String(factor.direction || "");
  const isRiskUp = direction === "increases_risk";
  const value = toFiniteNumber(factor.value);

  const marketSignals = predictionData?.market_signals || {};
  const modelFeatures = predictionData?.data || {};
  const normalizedInput = predictionData?.normalized_input || {};

  const companyVol = toFiniteNumber(marketSignals.company_volatility_90d);
  const marketVol = toFiniteNumber(marketSignals.market_volatility_90d);
  const relativeReturn = toFiniteNumber(marketSignals.relative_return_90d);
  const marketRegime = String(marketSignals.marketRegime || "").trim();
  const perf = toFiniteNumber(modelFeatures.performance_rating ?? normalizedInput.performance_rating);

  const volatilityContext = companyVol != null && marketVol != null
    ? companyVol > marketVol * 1.2
      ? " Market volatility around this company is higher than the broader market."
      : companyVol < marketVol * 0.85
        ? " Market volatility around this company is relatively controlled."
        : " Market volatility is broadly in line with the broader market."
    : companyVol != null
      ? " Company volatility is available and considered in this score."
      : "";

  const relativeContext = relativeReturn == null
    ? ""
    : relativeReturn <= -8
      ? " Relative market performance is lagging."
      : relativeReturn >= 5
        ? " Relative market performance is supportive."
        : " Relative market performance is mixed.";

  switch (feature) {
    case "industry_layoff_rate":
      return isRiskUp
        ? `Your sector is in a tighter layoff cycle, so baseline risk is higher.${volatilityContext}`
        : `Your sector is currently more stable, which helps contain baseline risk.${volatilityContext}`;
      break;
    case "revenue_growth":
      return isRiskUp
        ? `Business growth momentum appears softer, which can increase cost and headcount pressure.${relativeContext}`
        : `Business growth momentum is supportive, which improves role stability.${relativeContext}`;
      break;
    case "profit_margin":
      return isRiskUp
        ? `Profit cushion looks constrained, so teams may face tighter efficiency expectations.${volatilityContext}`
        : `Profit cushion looks healthy, which gives more room to protect roles.${volatilityContext}`;
      break;
    case "stock_price_change":
      return isRiskUp
        ? `Market performance is weaker than ideal, which often leads to stricter cost control.${volatilityContext}`
        : `Market performance is relatively supportive, which helps reduce near-term pressure.${volatilityContext}`;
      break;
    case "performance_rating":
      return isRiskUp
        ? "Current performance signal is below the safer range for this role context."
        : "Current performance signal is a strong protective factor.";
      break;
    case "years_at_company":
      return isRiskUp
        ? "Tenure is relatively short, which usually means higher exposure during restructuring."
        : "Tenure is relatively strong, which usually improves role resilience.";
      break;
    case "salary_range":
      if (perf != null) {
        return isRiskUp
          ? "Compensation-to-impact balance appears stretched, increasing review pressure."
          : "Compensation-to-impact balance appears aligned, which supports retention.";
      }
      return isRiskUp
        ? "Compensation level may create higher cost scrutiny in this market."
        : "Compensation level appears manageable for this profile.";
      break;
    case "economic_condition_tag":
      {
        const regimeText = marketRegime || String(factor.value || "current");
        return isRiskUp
          ? `Current market regime (${regimeText}) is defensive and adds broad pressure.${volatilityContext}`
          : `Current market regime (${regimeText}) is relatively supportive.${volatilityContext}`;
      }
      break;
    case "past_layoffs":
      return isRiskUp
        ? "Recent layoff history indicates recurring restructuring pressure."
        : "Recent layoff history does not indicate immediate restructuring pressure.";
      break;
    default:
      break;
  }

  return factor.reason || "No additional context available.";
};

const buildRiskStory = (predictionData) => {
  const prediction = predictionData?.prediction || {};
  const topFactors = Array.isArray(prediction.top_factors) ? prediction.top_factors : [];
  const marketSignals = predictionData?.market_signals || {};

  const risk = String(prediction.layoff_risk || "Unknown").toLowerCase();
  const riskUp = topFactors.filter((factor) => factor.direction === "increases_risk").slice(0, 3);
  const riskDown = topFactors.filter((factor) => factor.direction === "reduces_risk").slice(0, 3);

  const marketRegime = String(marketSignals.marketRegime || "current").trim();
  const stress = toFiniteNumber(marketSignals.marketStressScore);
  const stressText = stress == null
    ? "Market stress signal is unavailable."
    : stress >= 0.62
      ? "Market stress is elevated."
      : stress >= 0.45
        ? "Market stress is moderate."
        : "Market stress is relatively contained.";

  const summaryByRisk = {
    high: "Your profile is currently in a high-risk zone because pressure factors are stronger than protective factors.",
    medium: "Your profile is in a balanced risk zone, with both pressure factors and protective factors active.",
    low: "Your profile is currently in a lower-risk zone because protective factors are stronger than pressure factors.",
    unknown: "The model could not determine a clear risk posture from current inputs.",
  };

  const overall = riskUp.length === 0
    ? "There are no dominant pressure signals in this run."
    : riskDown.length === 0
      ? "Most strong signals are pressure-oriented, so the model leans toward higher risk."
      : "Pressure and protective signals are both present; final risk depends on which side is stronger.";

  const pressureSignals = riskUp.map((factor) => ({
    title: factor.label || formatFeatureLabel(factor.feature),
    reason: getContextualFactorReason(factor, predictionData),
    strength: getSignalStrengthLabel(factor.impact),
    effect: "Raises risk",
  }));

  const protectionSignals = riskDown.map((factor) => ({
    title: factor.label || formatFeatureLabel(factor.feature),
    reason: getContextualFactorReason(factor, predictionData),
    strength: getSignalStrengthLabel(factor.impact),
    effect: "Lowers risk",
  }));

  return {
    summary: summaryByRisk[risk] || summaryByRisk.unknown,
    marketLine: `Market context is ${marketRegime}. ${stressText}`,
    pressureSignals,
    protectionSignals,
    overall,
  };
};

const buildStabilizationPlan = (predictionData) => {
  const prediction = predictionData?.prediction || {};
  const topFactors = Array.isArray(prediction.top_factors) ? prediction.top_factors : [];
  const improvementTips = Array.isArray(prediction.improvement_tips) ? prediction.improvement_tips : [];

  const factorActionMap = {
    performance_rating: {
      title: "Lock a 30-day performance plan with your manager",
      detail: "Set weekly deliverables and track outcomes in writing so your impact signal improves quickly.",
    },
    years_at_company: {
      title: "Increase visibility in cross-team work",
      detail: "Join at least one cross-functional initiative to improve role resilience during restructures.",
    },
    salary_range: {
      title: "Strengthen value-to-cost narrative",
      detail: "Document business outcomes and efficiency wins tied directly to your compensation level.",
    },
    industry_layoff_rate: {
      title: "Prepare internal mobility options",
      detail: "Identify 2 adjacent roles inside the company and start conversations with those teams this month.",
    },
    revenue_growth: {
      title: "Anchor your work to revenue outcomes",
      detail: "Prioritize tasks that improve customer retention, delivery speed, or conversion metrics.",
    },
    profit_margin: {
      title: "Focus on efficiency projects",
      detail: "Take ownership of one cost-saving or automation improvement with measurable business impact.",
    },
    stock_price_change: {
      title: "Build resilience to market pressure",
      detail: "Reduce single-team dependency by building reusable skills across current and adjacent responsibilities.",
    },
  };

  const prioritizedFactors = topFactors
    .filter((factor) => factor.direction === "increases_risk")
    .slice(0, 3);

  const actions = [];
  const seen = new Set();

  for (const factor of prioritizedFactors) {
    const mapped = factorActionMap[factor.feature];
    if (!mapped || seen.has(mapped.title)) {
      continue;
    }
    actions.push(mapped);
    seen.add(mapped.title);
  }

  for (const tip of improvementTips) {
    const title = "Execute one model-recommended improvement";
    if (seen.has(title)) {
      continue;
    }
    actions.push({
      title,
      detail: String(tip || "").trim(),
    });
    seen.add(title);
    if (actions.length >= 3) {
      break;
    }
  }

  if (!actions.length) {
    actions.push(
      {
        title: "Schedule a manager calibration conversation",
        detail: "Review current goals, delivery quality, and role priorities for the next quarter.",
      },
      {
        title: "Update skill roadmap for your current domain",
        detail: "Pick one high-demand skill and define weekly checkpoints for the next 30 days.",
      },
      {
        title: "Track measurable outcomes weekly",
        detail: "Maintain a simple impact log with outcomes, blockers removed, and efficiency gains.",
      }
    );
  }

  return actions.slice(0, 3);
};

const buildActionTrackerSeed = (predictionData) =>
  buildStabilizationPlan(predictionData).map((item, index) => ({
    id: `plan-${index + 1}`,
    title: item.title,
    detail: item.detail,
    status: "not_started",
  }));

const formatCheckedAt = (value) => {
  if (!value) {
    return "N/A";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }
  return parsed.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getVolatilityPosture = (companyVol, marketVol) => {
  const company = toFiniteNumber(companyVol);
  const market = toFiniteNumber(marketVol);
  if (company == null || market == null || market === 0) {
    return { label: "Unavailable", tone: "text-slate-700", detail: "Volatility feed not available." };
  }
  if (company > market * 1.25) {
    return {
      label: "Elevated",
      tone: "text-rose-700",
      detail: `Company volatility ${company.toFixed(2)}% vs market ${market.toFixed(2)}%.`,
    };
  }
  if (company < market * 0.85) {
    return {
      label: "Below Market",
      tone: "text-emerald-700",
      detail: `Company volatility ${company.toFixed(2)}% vs market ${market.toFixed(2)}%.`,
    };
  }
  return {
    label: "In-Line",
    tone: "text-amber-700",
    detail: `Company volatility ${company.toFixed(2)}% vs market ${market.toFixed(2)}%.`,
  };
};

const getResponsibleAssessment = (predictionData, inputQuality) => {
  const prediction = predictionData?.prediction || {};
  const reliability = predictionData?.reliability || {};
  const marketSignals = predictionData?.market_signals || {};

  const risk = String(prediction.layoff_risk || "Unknown");
  const confidence = toFiniteNumber(prediction.confidence) || 0;
  const reliabilityScore = toFiniteNumber(reliability.score) || 0;
  const inputScore = toFiniteNumber(inputQuality?.score);
  const gate = String(reliability.gate || "medium").toLowerCase();

  const requiresManualReview =
    gate === "warning"
    || confidence < 0.55
    || (inputScore != null && inputScore < 70);

  const needsCaution =
    !requiresManualReview
    && (gate !== "high" || confidence < 0.65 || (inputScore != null && inputScore < 85));

  const status = requiresManualReview ? "manual_review" : needsCaution ? "caution" : "advisory_ready";

  const statusMeta = {
    manual_review: {
      title: "Manual Review Required",
      badge: "Not Decision-Ready",
      container: "border-rose-200 bg-rose-50",
      badgeClass: "bg-rose-600 text-white",
      text: "Current output should be treated as directional only and must be manually reviewed before any decision.",
    },
    caution: {
      title: "Use With Review Controls",
      badge: "Review Before Use",
      container: "border-amber-200 bg-amber-50",
      badgeClass: "bg-amber-600 text-white",
      text: "Use this prediction as one supporting signal, together with HR and manager evidence.",
    },
    advisory_ready: {
      title: "Advisory Signal Available",
      badge: "Advisory Use",
      container: "border-emerald-200 bg-emerald-50",
      badgeClass: "bg-emerald-600 text-white",
      text: "Signal quality is relatively strong, but human review is still mandatory.",
    },
  }[status];

  const volatility = getVolatilityPosture(
    marketSignals.company_volatility_90d,
    marketSignals.market_volatility_90d
  );

  const limitations = [];
  if (reliability.used_fallback_defaults) {
    limitations.push("Live market data was unavailable; fallback defaults were used.");
  }
  if (String(reliability.market_mapping_type || "").toLowerCase() === "market_equivalent") {
    limitations.push("Company was evaluated using market-equivalent mapping rather than direct listing.");
  }
  if (confidence < 0.6) {
    limitations.push(`Model confidence is ${(confidence * 100).toFixed(1)}%, which is below strong-confidence range.`);
  }
  if (inputScore != null && inputScore < 80) {
    limitations.push(`Input quality score is ${inputScore.toFixed(0)}/100; verify all user-entered fields.`);
  }
  limitations.push("This model is probabilistic and must not be the sole basis for employment decisions.");

  const checks = [
    "Validate latest performance and manager feedback from the last 90 days.",
    "Confirm recent org/team restructuring context not captured in model inputs.",
    "Cross-check decision with business-unit demand and replacement feasibility.",
    "Document human reviewer notes before any action is taken.",
  ];
  if (reliability.used_fallback_defaults) {
    checks.push("Re-run prediction when live market feed is available.");
  }

  return {
    risk,
    confidence,
    reliabilityScore,
    inputScore,
    checkedAt: reliability.checked_at_utc,
    marketRegime: marketSignals.marketRegime || "N/A",
    statusMeta,
    volatility,
    limitations,
    checks,
  };
};

const ResponsibleBrief = ({ predictionData, inputQuality }) => {
  const assessment = getResponsibleAssessment(predictionData, inputQuality);

  return (
    <section className={`rounded-2xl border p-5 ${assessment.statusMeta.container}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Responsible Prediction Brief</p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">{assessment.statusMeta.title}</h3>
          <p className="mt-1 text-sm text-slate-700">{assessment.statusMeta.text}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${assessment.statusMeta.badgeClass}`}>
          {assessment.statusMeta.badge}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
    </section>
  );
};

const Field = ({
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
}) => (
  <label className="space-y-2">
    <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
      {React.createElement(icon, { className: "h-4 w-4 text-slate-500" })}
      {label}
    </span>
    {options ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
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
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
      />
    )}
  </label>
);

const ReliabilityBanner = ({ reliability }) => {
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

const SegmentTabs = ({ tabs, active, onChange }) => (
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

const ResultPanel = ({ predictionData, inputQuality }) => {
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
  const reasonForFactor = (factor) => getContextualFactorReason(factor, predictionData);
  const riskStory = buildRiskStory(predictionData);
  const stabilizationPlan = buildStabilizationPlan(predictionData);

  return (
    <div className="space-y-4">
      <ReliabilityBanner reliability={predictionData?.reliability} />

      <div className={`rounded-2xl border p-5 shadow-sm ${tone.card}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <RiskIcon className="h-5 w-5 text-slate-800" />
            <h2 className="font-display text-lg font-semibold text-slate-900">Layoff Risk Prediction</h2>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${tone.badge}`}>
            {prediction.layoff_risk || "Unknown"}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/80 bg-white/80 p-3">
            <p className="text-xs text-slate-500">Model Confidence</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{(confidence * 100).toFixed(1)}%</p>
          </div>
          <div className="rounded-xl border border-white/80 bg-white/80 p-3">
            <p className="text-xs text-slate-500">Risk Score</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{riskScore.toFixed(1)} / 100</p>
          </div>
          <div className="rounded-xl border border-white/80 bg-white/80 p-3">
            <p className="text-xs text-slate-500">Model Version</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{prediction.model_version || "N/A"}</p>
          </div>
        </div>
      </div>

      <ResponsibleBrief predictionData={predictionData} inputQuality={inputQuality} />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
              <p className="mt-1 text-sm text-slate-700">{riskStory.overall}</p>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pressures</p>
                <div className="mt-2 space-y-2">
                  {riskStory.pressureSignals.length ? (
                    riskStory.pressureSignals.map((item, index) => (
                      <div key={`pressure-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{item.strength} Signal</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-700">{item.reason}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-600">No major pressure signals were detected in this run.</p>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Protection</p>
                <div className="mt-2 space-y-2">
                  {riskStory.protectionSignals.length ? (
                    riskStory.protectionSignals.map((item, index) => (
                      <div key={`protection-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{item.strength} Signal</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-700">{item.reason}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-600">No strong protective signals were detected in this run.</p>
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

const WhatIfSimulator = ({
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

const ActionTrackerPanel = ({
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
              <select
                value={action.status}
                onChange={(event) => onUpdateStatus(index, event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                {ACTION_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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

const HumanReviewPanel = ({
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
      <select
        value={reviewForm.decision}
        onChange={(event) => setReviewForm((prev) => ({ ...prev, decision: event.target.value }))}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
      >
        {REVIEW_DECISIONS.map((decision) => (
          <option key={decision} value={decision}>
            {decision}
          </option>
        ))}
      </select>
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

const HistoryPanel = ({ historyEntries, trend, loading, onRefresh, onLoadRun }) => (
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

const ModelQualityPanel = ({ report, loading, error, onLoad }) => (
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

const EmployeePred = () => {
  const [formData, setFormData] = useState({
    company_name: "",
    company_location: "",
    reporting_quarter: "",
    job_title: "",
    department: "",
    remote_work: "",
    years_at_company: "",
    salary_range: "",
    performance_rating: "",
  });
  const [salaryUnit, setSalaryUnit] = useState("LPA");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [predictionData, setPredictionData] = useState(null);
  const [inputSpec, setInputSpec] = useState(null);
  const [historyEntries, setHistoryEntries] = useState([]);
  const [historyTrend, setHistoryTrend] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [whatIfForm, setWhatIfForm] = useState({
    years_at_company: "",
    performance_rating: "",
    salary_lpa: "",
  });
  const [whatIfResult, setWhatIfResult] = useState(null);
  const [whatIfLoading, setWhatIfLoading] = useState(false);
  const [actionTracker, setActionTracker] = useState([]);
  const [actionSaving, setActionSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [rescoreLoading, setRescoreLoading] = useState(false);
  const [rescoreSummary, setRescoreSummary] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    reviewed_by: "",
    decision: REVIEW_DECISIONS[0],
    review_reason: "",
  });
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [evalReport, setEvalReport] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState("");
  const [workspaceTab, setWorkspaceTab] = useState("simulator");

  useEffect(() => {
    const fetchInputSpec = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/employee/input-spec`);
        if (response.data?.success && response.data?.spec) {
          setInputSpec(response.data.spec);
        }
      } catch (specError) {
        console.warn("Unable to fetch input spec:", specError.message);
      }
    };

    fetchInputSpec();
  }, []);

  const options = useMemo(() => {
    const fields = inputSpec?.fields || {};
    return {
      companies: fields.company_name?.options || FALLBACK_COMPANY_OPTIONS,
      locations: fields.company_location?.options || FALLBACK_LOCATION_OPTIONS,
      quarters: fields.reporting_quarter?.options || FALLBACK_QUARTER_OPTIONS,
      jobs: fields.job_title?.options || FALLBACK_JOB_OPTIONS,
      departments: fields.department?.options || FALLBACK_DEPARTMENT_OPTIONS,
      remote: fields.remote_work?.options || ["Yes", "No"],
      yearsMax: Number(fields.years_at_company?.max || 18),
      perfMin: Number(fields.performance_rating?.min || 1),
      perfMax: Number(fields.performance_rating?.max || 5),
      perfStep: Number(fields.performance_rating?.step || 1),
      guidance: Array.isArray(inputSpec?.guidance) ? inputSpec.guidance : [],
    };
  }, [inputSpec]);

  useEffect(() => {
    setFormData((prev) => {
      if (!prev.company_name || options.companies.includes(prev.company_name)) {
        return prev;
      }
      return { ...prev, company_name: "" };
    });
  }, [options.companies]);

  const annualSalaryInr = useMemo(
    () => toAnnualInr(formData.salary_range, salaryUnit),
    [formData.salary_range, salaryUnit]
  );

  const inputQuality = useMemo(() => {
    let score = 100;
    const warnings = [];

    if (!formData.company_name || !options.companies.includes(formData.company_name)) {
      score -= 20;
      warnings.push("Choose a company from the known list to improve model match.");
    }

    if (!formData.job_title || !options.jobs.includes(formData.job_title)) {
      score -= 15;
      warnings.push("Use the exact job title from available options.");
    }

    const years = Number(formData.years_at_company);
    if (!Number.isFinite(years) || years < 0 || years > options.yearsMax) {
      score -= 20;
      warnings.push(`Years at company should be between 0 and ${options.yearsMax}.`);
    }

    const performance = Number(formData.performance_rating);
    if (!Number.isFinite(performance) || performance < options.perfMin || performance > options.perfMax) {
      score -= 20;
      warnings.push(`Performance rating should be between ${options.perfMin} and ${options.perfMax}.`);
    }

    if (!Number.isFinite(annualSalaryInr) || annualSalaryInr < 300000 || annualSalaryInr > 10000000) {
      score -= 25;
      warnings.push("Salary looks out of range. Check unit and entered amount.");
    }

    const clampedScore = Math.max(0, score);
    const level = clampedScore >= 85 ? "high" : clampedScore >= 65 ? "medium" : "low";
    return { score: clampedScore, level, warnings };
  }, [annualSalaryInr, formData, options]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const activeRunId = predictionData?.run_id || predictionData?.history_entry?.run_id || null;

  const fetchHistory = useCallback(async (companyName) => {
    const selectedCompany = String(companyName || "").trim();
    if (!selectedCompany) {
      setHistoryEntries([]);
      setHistoryTrend(null);
      return;
    }

    setHistoryLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/employee/history`, {
        params: { company_name: selectedCompany, limit: 14 },
      });
      if (response.data?.success) {
        setHistoryEntries(Array.isArray(response.data.entries) ? response.data.entries : []);
        setHistoryTrend(response.data.trend || null);
      }
    } catch (historyError) {
      console.warn("Unable to load prediction history:", historyError.message);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const validate = () => {
    const requiredFields = Object.entries(formData).filter(([, value]) => String(value).trim() === "");
    if (requiredFields.length) {
      return "Please complete all required fields before prediction.";
    }

    const years = Number(formData.years_at_company);
    if (!Number.isFinite(years) || years < 0 || years > options.yearsMax) {
      return `Years at company must be between 0 and ${options.yearsMax}.`;
    }

    const performance = Number(formData.performance_rating);
    if (!Number.isFinite(performance) || performance < options.perfMin || performance > options.perfMax) {
      return `Performance rating must be between ${options.perfMin} and ${options.perfMax}.`;
    }

    if (!Number.isFinite(annualSalaryInr) || annualSalaryInr <= 0) {
      return "Enter a valid salary value.";
    }

    return "";
  };

  const buildPayloadFromForm = () => ({
    ...formData,
    years_at_company: Number(formData.years_at_company),
    salary_range: annualSalaryInr,
    performance_rating: Number(formData.performance_rating),
  });

  const runPrediction = async (payload, mode = "predict") => {
    const isRescore = mode === "rescore";
    if (isRescore) {
      setRescoreLoading(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const previousRisk = predictionData?.prediction?.layoff_risk || null;
      const previousScore = Number(predictionData?.prediction?.risk_score);

      const response = await axios.post(`${API_BASE_URL}/api/employee/predict`, payload);
      setPredictionData(response.data);

      const runId = response.data?.run_id || response.data?.history_entry?.run_id || null;
      const persistedActions = response.data?.history_entry?.action_tracker;
      if (Array.isArray(persistedActions) && persistedActions.length > 0) {
        setActionTracker(persistedActions);
      } else {
        setActionTracker(buildActionTrackerSeed(response.data));
      }

      setWhatIfResult(null);
      await fetchHistory(payload.company_name);

      if (isRescore) {
        const nextRisk = response.data?.prediction?.layoff_risk || "Unknown";
        const nextScore = Number(response.data?.prediction?.risk_score);
        const delta = Number.isFinite(previousScore) && Number.isFinite(nextScore) ? nextScore - previousScore : 0;
        setRescoreSummary({
          runId,
          from: previousRisk || "Unknown",
          to: nextRisk,
          delta,
        });
      }

      return response.data;
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Failed to fetch employee prediction.";
      setError(message);
      throw requestError;
    } finally {
      if (isRescore) {
        setRescoreLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    const payload = buildPayloadFromForm();
    try {
      await runPrediction(payload, "predict");
    } catch (errorResponse) {
      // error state already handled in runPrediction
    }
  };

  const handleRescore = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    const payload = buildPayloadFromForm();
    try {
      await runPrediction(payload, "rescore");
    } catch (errorResponse) {
      // error state already handled in runPrediction
    }
  };

  const employeeDataForSuggestions = useMemo(
    () => ({
      ...formData,
      years_at_company: Number(formData.years_at_company) || 0,
      performance_rating: Number(formData.performance_rating) || 0,
      salary_range: annualSalaryInr || 0,
    }),
    [annualSalaryInr, formData]
  );

  useEffect(() => {
    if (!predictionData) {
      return;
    }

    const normalized = predictionData.normalized_input || predictionData.data || {};
    const salaryInr = Number(normalized.salary_range || annualSalaryInr || 0);
    const salaryLpa = salaryInr > 0 ? (salaryInr / 100000).toFixed(1) : "";

    setWhatIfForm({
      years_at_company: normalized.years_at_company != null ? String(normalized.years_at_company) : String(formData.years_at_company || ""),
      performance_rating: normalized.performance_rating != null ? String(normalized.performance_rating) : String(formData.performance_rating || ""),
      salary_lpa: salaryLpa || String(formData.salary_range || ""),
    });

    const persistedActions = predictionData?.history_entry?.action_tracker;
    if (Array.isArray(persistedActions) && persistedActions.length > 0) {
      setActionTracker(persistedActions);
    } else {
      setActionTracker(buildActionTrackerSeed(predictionData));
    }

    const savedReview = predictionData?.history_entry?.review;
    if (savedReview) {
      setReviewForm((prev) => ({
        reviewed_by: savedReview.reviewed_by || prev.reviewed_by,
        decision: savedReview.decision || prev.decision || REVIEW_DECISIONS[0],
        review_reason: savedReview.review_reason || prev.review_reason,
      }));
    }
  }, [predictionData, annualSalaryInr, formData.performance_rating, formData.salary_range, formData.years_at_company]);

  useEffect(() => {
    if (!formData.company_name) {
      return;
    }
    fetchHistory(formData.company_name);
  }, [fetchHistory, formData.company_name]);

  const handleRunWhatIf = async () => {
    if (!predictionData?.prediction) {
      return;
    }

    const years = Number(whatIfForm.years_at_company);
    const performance = Number(whatIfForm.performance_rating);
    const salaryLpa = Number(whatIfForm.salary_lpa);
    if (!Number.isFinite(years) || years < 0 || years > options.yearsMax) {
      setError(`What-if years must be between 0 and ${options.yearsMax}.`);
      return;
    }
    if (!Number.isFinite(performance) || performance < options.perfMin || performance > options.perfMax) {
      setError(`What-if performance must be between ${options.perfMin} and ${options.perfMax}.`);
      return;
    }
    if (!Number.isFinite(salaryLpa) || salaryLpa <= 0) {
      setError("What-if salary must be a valid LPA value.");
      return;
    }

    setWhatIfLoading(true);
    setError("");
    try {
      const scenarioPayload = {
        ...employeeDataForSuggestions,
        years_at_company: years,
        performance_rating: performance,
        salary_range: Math.round(salaryLpa * 100000),
      };
      const response = await axios.post(`${API_BASE_URL}/api/employee/what-if`, {
        employeeData: scenarioPayload,
        referencePrediction: predictionData,
      });
      setWhatIfResult(response.data);
    } catch (whatIfError) {
      setError(whatIfError.response?.data?.message || "Unable to run what-if simulation.");
    } finally {
      setWhatIfLoading(false);
    }
  };

  const handleApplyScenarioToForm = () => {
    const scenarioSalaryLpa = String(whatIfForm.salary_lpa || "").trim();
    setFormData((prev) => ({
      ...prev,
      years_at_company: String(whatIfForm.years_at_company || prev.years_at_company),
      performance_rating: String(whatIfForm.performance_rating || prev.performance_rating),
      salary_range: salaryUnit === "LPA"
        ? scenarioSalaryLpa
        : String(Math.round(Number(whatIfForm.salary_lpa || 0) * 100000)),
    }));
  };

  const handleActionStatusUpdate = (index, status) => {
    setActionTracker((prev) => prev.map((item, idx) => (
      idx === index ? { ...item, status } : item
    )));
  };

  const handleSaveActionTracker = async () => {
    if (!activeRunId) {
      setActionMessage("Run ID unavailable. Re-run prediction to enable action tracking.");
      return;
    }
    if (!actionTracker.length) {
      setActionMessage("No actions available to save.");
      return;
    }

    setActionSaving(true);
    setActionMessage("");
    try {
      const response = await axios.post(`${API_BASE_URL}/api/employee/history/${activeRunId}/actions`, {
        actions: actionTracker,
      });
      if (response.data?.success && response.data?.entry) {
        const updatedEntry = response.data.entry;
        setActionTracker(Array.isArray(updatedEntry.action_tracker) ? updatedEntry.action_tracker : actionTracker);
        setPredictionData((prev) => prev ? ({
          ...prev,
          run_id: updatedEntry.run_id,
          history_entry: {
            ...(prev.history_entry || {}),
            run_id: updatedEntry.run_id,
            action_tracker: updatedEntry.action_tracker || [],
            review: updatedEntry.review || prev.history_entry?.review || null,
          },
        }) : prev);
      }
      setActionMessage("Action tracker updated.");
      await fetchHistory(formData.company_name);
    } catch (actionError) {
      setActionMessage(actionError.response?.data?.message || "Unable to save action tracker.");
    } finally {
      setActionSaving(false);
    }
  };

  const handleSaveReview = async () => {
    if (!activeRunId) {
      setReviewMessage("Run ID unavailable. Re-run prediction to enable review logging.");
      return;
    }
    if (!reviewForm.reviewed_by.trim() || !reviewForm.review_reason.trim()) {
      setReviewMessage("Reviewer name and review reason are required.");
      return;
    }

    setReviewSaving(true);
    setReviewMessage("");
    try {
      const response = await axios.post(`${API_BASE_URL}/api/employee/history/${activeRunId}/review`, {
        reviewed_by: reviewForm.reviewed_by.trim(),
        decision: reviewForm.decision,
        review_reason: reviewForm.review_reason.trim(),
      });
      if (response.data?.success && response.data?.entry) {
        const updatedEntry = response.data.entry;
        setPredictionData((prev) => prev ? ({
          ...prev,
          run_id: updatedEntry.run_id,
          history_entry: {
            ...(prev.history_entry || {}),
            run_id: updatedEntry.run_id,
            review: updatedEntry.review || null,
            action_tracker: updatedEntry.action_tracker || prev.history_entry?.action_tracker || [],
          },
        }) : prev);
      }
      setReviewMessage("Review note saved.");
      await fetchHistory(formData.company_name);
    } catch (reviewError) {
      setReviewMessage(reviewError.response?.data?.message || "Unable to save review note.");
    } finally {
      setReviewSaving(false);
    }
  };

  const handleRefreshHistory = async () => {
    await fetchHistory(formData.company_name || predictionData?.normalized_input?.company_name);
  };

  const handleLoadHistorySnapshot = (entry) => {
    if (!entry) {
      return;
    }
    const profile = entry.employee_profile || {};
    const salaryInr = Number(profile.salary_range || 0);
    const salaryLpa = salaryInr > 0 ? (salaryInr / 100000).toFixed(1) : "";

    setSalaryUnit("LPA");
    setFormData({
      company_name: profile.company_name || "",
      company_location: profile.company_location || "",
      reporting_quarter: profile.reporting_quarter || "",
      job_title: profile.job_title || "",
      department: profile.department || "",
      remote_work: profile.remote_work || "",
      years_at_company: profile.years_at_company != null ? String(profile.years_at_company) : "",
      salary_range: salaryLpa,
      performance_rating: profile.performance_rating != null ? String(profile.performance_rating) : "",
    });

    setPredictionData({
      success: true,
      run_id: entry.run_id,
      history_entry: {
        run_id: entry.run_id,
        created_at_utc: entry.created_at_utc,
        review: entry.review || null,
        action_tracker: entry.action_tracker || [],
      },
      normalized_input: entry.normalized_input || {},
      data: entry.feature_vector || {},
      prediction: entry.prediction || {},
      market_signals: entry.market_signals || null,
      reliability: entry.reliability || {},
    });
    setWhatIfResult(null);
    setActionTracker(Array.isArray(entry.action_tracker) ? entry.action_tracker : []);
  };

  const handleLoadModelEval = async () => {
    setEvalLoading(true);
    setEvalError("");
    try {
      const response = await axios.get(`${API_BASE_URL}/api/employee/eval`, {
        params: { sample_size: 4000 },
      });
      if (response.data?.success && response.data?.report) {
        setEvalReport(response.data.report);
      } else {
        setEvalError("Evaluation report is unavailable.");
      }
    } catch (evalRequestError) {
      setEvalError(evalRequestError.response?.data?.message || "Failed to load model evaluation.");
    } finally {
      setEvalLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!predictionData?.prediction) {
      setError("Run prediction first to export a report.");
      return;
    }
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const riskStory = buildRiskStory(predictionData);
      const assessment = getResponsibleAssessment(predictionData, inputQuality);
      const review = predictionData?.history_entry?.review || null;
      const pageWidth = doc.internal.pageSize.getWidth();
      const maxWidth = pageWidth - 80;
      let y = 44;

      const addTextBlock = (text, size = 11, style = "normal", gap = 14) => {
        if (!text) {
          return;
        }
        doc.setFont("helvetica", style);
        doc.setFontSize(size);
        const lines = doc.splitTextToSize(String(text), maxWidth);
        doc.text(lines, 40, y);
        y += (lines.length * gap);
      };

      addTextBlock("StabiAI Employee Risk Report", 16, "bold", 18);
      addTextBlock(`Generated: ${new Date().toLocaleString("en-IN")}`, 10, "normal", 13);
      addTextBlock(`Run ID: ${activeRunId || "N/A"}`, 10, "normal", 13);
      y += 6;
      addTextBlock(`Predicted Risk: ${predictionData?.prediction?.layoff_risk || "Unknown"}`, 12, "bold", 14);
      addTextBlock(`Confidence: ${((Number(predictionData?.prediction?.confidence || 0)) * 100).toFixed(2)}%`, 11, "normal", 14);
      addTextBlock(`Risk Score: ${Number(predictionData?.prediction?.risk_score || 0).toFixed(2)} / 100`, 11, "normal", 14);
      addTextBlock(`Market Regime: ${predictionData?.market_signals?.marketRegime || "N/A"}`, 11, "normal", 14);
      y += 4;
      addTextBlock("Why This Risk Score", 12, "bold", 14);
      addTextBlock(riskStory.summary, 11, "normal", 14);
      addTextBlock(riskStory.marketLine, 11, "normal", 14);
      addTextBlock(riskStory.overall, 11, "normal", 14);
      y += 4;
      addTextBlock("Top Pressure Signals", 12, "bold", 14);
      (riskStory.pressureSignals || []).slice(0, 3).forEach((item, idx) => {
        addTextBlock(`${idx + 1}. ${item.title}: ${item.reason}`, 10, "normal", 13);
      });
      y += 2;
      addTextBlock("Action Tracker", 12, "bold", 14);
      (actionTracker || []).slice(0, 6).forEach((item, idx) => {
        const statusLabel = ACTION_STATUS_OPTIONS.find((opt) => opt.value === item.status)?.label || item.status;
        addTextBlock(`${idx + 1}. ${item.title} [${statusLabel}]`, 10, "normal", 13);
      });
      y += 2;
      addTextBlock("Responsible Use", 12, "bold", 14);
      addTextBlock(assessment?.statusMeta?.text || "", 10, "normal", 13);
      (assessment?.limitations || []).slice(0, 4).forEach((item, idx) => {
        addTextBlock(`- ${item}`, 10, "normal", 13);
      });
      if (review) {
        y += 2;
        addTextBlock("Human Review Note", 12, "bold", 14);
        addTextBlock(`Reviewer: ${review.reviewed_by} (${review.decision})`, 10, "normal", 13);
        addTextBlock(`Reason: ${review.review_reason}`, 10, "normal", 13);
      }

      const fileDate = new Date().toISOString().slice(0, 10);
      doc.save(`stabiai_employee_report_${fileDate}.pdf`);
    } catch (exportError) {
      setError(exportError.message || "Unable to export PDF report.");
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5f8fa_0%,#ffffff_42%,#f4f7f9_100%)] px-4 pb-16 pt-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Employee Intelligence</p>
          <h1 className="font-display mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">Layoff Risk Predictor</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            Guided flow using model-aligned fields for higher prediction quality.
          </p>
          <p className="mx-auto mt-2 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Responsible use notice: this prediction is advisory and probabilistic. It must be reviewed with manager and HR context, and must not be used as a sole basis for employment decisions.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_1.35fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-display text-lg font-semibold text-slate-900">Prediction Input Flow</h2>
            <p className="mt-1 text-sm text-slate-500">
              Step-by-step profile capture designed for cleaner and more accurate model input.
            </p>

            <div className={`mt-4 rounded-xl border p-3 text-sm ${INPUT_QUALITY_TONE[inputQuality.level]}`}>
              <p className="font-semibold">
                Input Quality: {inputQuality.score}/100 ({inputQuality.level.toUpperCase()})
              </p>
              {inputQuality.warnings.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                  {inputQuality.warnings.map((warning, index) => (
                    <li key={`${warning}-${index}`}>{warning}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs">Inputs look consistent with model expectations.</p>
              )}
            </div>

            {options.guidance.length ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Data Tips</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                  {options.guidance.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 1: Company Context</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    icon={HiOutlineOfficeBuilding}
                    label="Company"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    options={options.companies}
                  />
                  <Field
                    icon={HiOutlineLocationMarker}
                    label="Location"
                    name="company_location"
                    value={formData.company_location}
                    onChange={handleChange}
                    options={options.locations}
                  />
                  <div className="sm:col-span-2">
                    <Field
                      icon={HiOutlineCalendar}
                      label="Reporting Quarter"
                      name="reporting_quarter"
                      value={formData.reporting_quarter}
                      onChange={handleChange}
                      options={options.quarters}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 2: Role Context</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    icon={HiOutlineBriefcase}
                    label="Job Title"
                    name="job_title"
                    value={formData.job_title}
                    onChange={handleChange}
                    options={options.jobs}
                  />
                  <Field
                    icon={HiOutlineUserGroup}
                    label="Department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    options={options.departments}
                  />
                  <div className="sm:col-span-2">
                    <Field
                      icon={HiOutlineHome}
                      label="Remote Work"
                      name="remote_work"
                      value={formData.remote_work}
                      onChange={handleChange}
                      options={options.remote}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 3: Employee Profile</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    icon={HiOutlineClock}
                    label="Years At Company"
                    name="years_at_company"
                    value={formData.years_at_company}
                    onChange={handleChange}
                    type="number"
                    min="0"
                    max={String(options.yearsMax)}
                    step="0.5"
                  />

                  <label className="space-y-2">
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <HiOutlineCurrencyDollar className="h-4 w-4 text-slate-500" />
                      Salary
                    </span>
                    <div className="flex gap-2">
                      <select
                        value={salaryUnit}
                        onChange={(event) => setSalaryUnit(event.target.value)}
                        className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      >
                        <option value="LPA">LPA</option>
                        <option value="INR">Annual INR</option>
                      </select>
                      <input
                        name="salary_range"
                        type="number"
                        value={formData.salary_range}
                        onChange={handleChange}
                        min={salaryUnit === "LPA" ? "1" : "300000"}
                        max={salaryUnit === "LPA" ? "120" : "10000000"}
                        step={salaryUnit === "LPA" ? "0.5" : "10000"}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Model receives salary as annual INR. Current converted value:
                      {" "}
                      {annualSalaryInr > 0 ? `₹${Math.round(annualSalaryInr).toLocaleString("en-IN")}` : "N/A"}
                    </p>
                  </label>

                  <Field
                    icon={HiOutlineChartBar}
                    label="Performance Rating"
                    name="performance_rating"
                    value={formData.performance_rating}
                    onChange={handleChange}
                    type="number"
                    min={String(options.perfMin)}
                    max={String(options.perfMax)}
                    step={String(options.perfStep)}
                  />
                </div>
              </div>

              {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {loading ? "Running Prediction..." : "Analyze Layoff Risk"}
              </button>
            </form>
          </section>

          <section className="space-y-6">
            {!predictionData ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
                <p className="text-sm text-slate-500">
                  Complete the three-step flow to get calibrated risk, reliability diagnostics, and targeted actions.
                </p>
              </div>
            ) : (
              <>
                <ResultPanel predictionData={predictionData} inputQuality={inputQuality} />
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-sm font-semibold text-slate-900">Decision Workspace</p>
                      <p className="mt-1 text-xs text-slate-500">
                        One compact control center for simulation, actions, governance, and quality.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportPdf}
                      className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      Export PDF
                    </button>
                  </div>
                  <div className="mt-3">
                    <SegmentTabs tabs={WORKSPACE_TABS} active={workspaceTab} onChange={setWorkspaceTab} />
                  </div>
                </section>

                {workspaceTab === "simulator" ? (
                  <WhatIfSimulator
                    whatIfForm={whatIfForm}
                    setWhatIfForm={setWhatIfForm}
                    onRun={handleRunWhatIf}
                    onApplyToInput={handleApplyScenarioToForm}
                    loading={whatIfLoading}
                    result={whatIfResult}
                    baselineRisk={predictionData?.prediction?.layoff_risk}
                  />
                ) : null}

                {workspaceTab === "actions" ? (
                  <ActionTrackerPanel
                    actions={actionTracker}
                    onUpdateStatus={handleActionStatusUpdate}
                    onSave={handleSaveActionTracker}
                    onRescore={handleRescore}
                    saving={actionSaving}
                    rescoreLoading={rescoreLoading}
                    message={actionMessage}
                    rescoreSummary={rescoreSummary}
                  />
                ) : null}

                {workspaceTab === "review" ? (
                  <HumanReviewPanel
                    runId={activeRunId}
                    reviewForm={reviewForm}
                    setReviewForm={setReviewForm}
                    onSubmit={handleSaveReview}
                    saving={reviewSaving}
                    savedReview={predictionData?.history_entry?.review || null}
                    message={reviewMessage}
                  />
                ) : null}

                {workspaceTab === "guidance" ? (
                  <AiSuggestions
                    employeeData={employeeDataForSuggestions}
                    predictionData={predictionData}
                    loading={loading}
                  />
                ) : null}

                {workspaceTab === "history" ? (
                  <HistoryPanel
                    historyEntries={historyEntries}
                    trend={historyTrend}
                    loading={historyLoading}
                    onRefresh={handleRefreshHistory}
                    onLoadRun={handleLoadHistorySnapshot}
                  />
                ) : null}

                {workspaceTab === "quality" ? (
                  <ModelQualityPanel
                    report={evalReport}
                    loading={evalLoading}
                    error={evalError}
                    onLoad={handleLoadModelEval}
                  />
                ) : null}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default EmployeePred;
