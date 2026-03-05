import React, { useEffect, useMemo, useState } from "react";
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
    badge: "bg-emerald-100 text-emerald-800",
    card: "border-emerald-200 bg-emerald-50",
    icon: HiCheckCircle,
  },
  medium: {
    badge: "bg-amber-100 text-amber-800",
    card: "border-amber-200 bg-amber-50",
    icon: HiInformationCircle,
  },
  high: {
    badge: "bg-rose-100 text-rose-800",
    card: "border-rose-200 bg-rose-50",
    icon: HiExclamationCircle,
  },
  unknown: {
    badge: "bg-slate-100 text-slate-700",
    card: "border-slate-200 bg-slate-50",
    icon: HiInformationCircle,
  },
};

const RELIABILITY_TONE = {
  high: {
    wrap: "border-emerald-200 bg-emerald-50",
    text: "text-emerald-800",
    icon: HiCheckCircle,
    title: "High Reliability",
  },
  medium: {
    wrap: "border-amber-200 bg-amber-50",
    text: "text-amber-800",
    icon: HiInformationCircle,
    title: "Moderate Reliability",
  },
  warning: {
    wrap: "border-rose-200 bg-rose-50",
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

const ResultPanel = ({ predictionData, inputQuality }) => {
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
    <div className="space-y-5">
      <ReliabilityBanner reliability={predictionData?.reliability} />

      <div className={`rounded-2xl border p-5 ${tone.card}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <RiskIcon className="h-5 w-5 text-slate-800" />
            <h2 className="text-lg font-semibold text-slate-900">Layoff Risk Prediction</h2>
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

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">Why This Risk Score?</h3>
        <p className="mt-1 text-xs text-slate-500">Plain-language explanation of why the model reached this result.</p>
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">In Simple Terms</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{riskStory.summary}</p>
          <p className="mt-2 text-sm text-slate-700">{riskStory.marketLine}</p>
          <p className="mt-1 text-sm text-slate-700">{riskStory.overall}</p>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">What Is Pushing Risk Up</p>
            <div className="mt-2 space-y-2">
              {riskStory.pressureSignals.length ? (
                riskStory.pressureSignals.map((item, index) => (
                  <div key={`pressure-${index}`} className="rounded-lg border border-rose-100 bg-white/70 p-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                      {item.effect} • {item.strength} Signal
                    </p>
                    <p className="mt-1 text-sm font-semibold text-rose-900">{item.title}</p>
                    <p className="mt-1 text-sm text-rose-900">{item.reason}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-rose-800">No major pressure signals were detected in this run.</p>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">What Is Protecting You</p>
            <div className="mt-2 space-y-2">
              {riskStory.protectionSignals.length ? (
                riskStory.protectionSignals.map((item, index) => (
                  <div key={`protection-${index}`} className="rounded-lg border border-emerald-100 bg-white/70 p-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      {item.effect} • {item.strength} Signal
                    </p>
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
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">Your Next 30-Day Stabilization Plan</h3>
        <p className="mt-1 text-xs text-slate-500">
          Practical actions connected directly to your current risk drivers.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {stabilizationPlan.map((item, index) => (
            <div key={`${item.title}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step {index + 1}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="mt-1 text-sm text-slate-700">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Class Probabilities</h3>
          <div className="mt-4 space-y-3">
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

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Market Signals Used</h3>
          <div className="mt-4 space-y-2">
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

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Top Risk Drivers</h3>
          <div className="mt-4 space-y-3">
            {topFactors.length ? (
              topFactors.map((factor, index) => (
                <div key={`${factor.feature}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
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

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Priority Actions</h3>
          <div className="mt-4 space-y-2">
            {improvementTips.length ? (
              improvementTips.map((tip, index) => (
                <div key={`${tip}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
                  {index + 1}. {tip}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No immediate tips generated.</p>
            )}
          </div>
        </section>
      </div>

      <details className="rounded-2xl border border-slate-200 bg-white p-5">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">Model Input Details</summary>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Model Input Values</p>
            {normalizedInput.map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{formatFeatureLabel(key)}</span>
                <span className="font-medium text-slate-900">{formatFeatureValue(key, value)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Full Feature Vector</p>
            {fullFeatures.map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{formatFeatureLabel(key)}</span>
                <span className="font-medium text-slate-900">{formatFeatureValue(key, value)}</span>
              </div>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
};

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        years_at_company: Number(formData.years_at_company),
        salary_range: annualSalaryInr,
        performance_rating: Number(formData.performance_rating),
      };
      const response = await axios.post(`${API_BASE_URL}/api/employee/predict`, payload);
      setPredictionData(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to fetch employee prediction.");
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Employee Intelligence</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">Layoff Risk Predictor</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            Guided flow using model-aligned fields for higher prediction quality.
          </p>
          <p className="mx-auto mt-2 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Responsible use notice: this prediction is advisory and probabilistic. It must be reviewed with manager and HR context, and must not be used as a sole basis for employment decisions.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_1.35fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900">Prediction Input Flow</h2>
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
                <AiSuggestions
                  employeeData={employeeDataForSuggestions}
                  predictionData={predictionData}
                  loading={loading}
                />
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default EmployeePred;
