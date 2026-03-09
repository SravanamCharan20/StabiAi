export const toAnnualInr = (value, unit) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }
  if (unit === "LPA") {
    return numeric * 100000;
  }
  return numeric;
};

export const formatFeatureLabel = (key) =>
  String(key || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const formatFeatureValue = (key, value) => {
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
    if (["role_demand_index", "department_resilience_index", "tech_stack_trend_score"].includes(key)) {
      return `${Number(value).toFixed(2)} / 10`;
    }
    return Number(value).toLocaleString("en-IN");
  }
  return String(value);
};

export const toFiniteNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

export const sanitizeResumeInsights = (value) => {
  const source = value && typeof value === "object" ? value : {};
  return {
    candidate_name: source.candidate_name || null,
    years_of_experience: Number.isFinite(Number(source.years_of_experience))
      ? Number(source.years_of_experience)
      : null,
    certifications: Array.isArray(source.certifications) ? source.certifications.slice(0, 8) : [],
    skills: Array.isArray(source.skills) ? source.skills.slice(0, 12) : [],
    ai_readiness_score: Number.isFinite(Number(source.ai_readiness_score))
      ? Number(source.ai_readiness_score)
      : null,
    parse_confidence: Number.isFinite(Number(source.parse_confidence))
      ? Number(source.parse_confidence)
      : null,
  };
};

export const getRiskBadgeClass = (label) => {
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

export const getSignalStrengthLabel = (impact) => {
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

export const getContextualFactorReason = (factor, predictionData) => {
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
    case "role_demand_index":
      return isRiskUp
        ? "Current hiring demand for this job title is weaker than safer ranges, which increases exposure."
        : "Current hiring demand for this job title is healthy, which improves survivability.";
      break;
    case "department_resilience_index":
      return isRiskUp
        ? "This department is currently under stronger cost or restructuring pressure."
        : "This department is relatively resilient in the current operating cycle.";
      break;
    case "tech_stack_trend_score":
      return isRiskUp
        ? "Your stack appears less aligned with current AI/cloud demand, which can increase role risk."
        : "Your stack aligns with current AI/cloud demand, which lowers role risk.";
      break;
    case "revenue_growth":
      return isRiskUp
        ? `Business momentum is softer, which adds organizational pressure.${relativeContext}`
        : `Business momentum is supportive and helps overall stability.${relativeContext}`;
      break;
    case "profit_margin":
      return isRiskUp
        ? `Profit cushion is constrained, which can tighten team budgets.${volatilityContext}`
        : `Profit cushion is healthier, giving more room to protect roles.${volatilityContext}`;
      break;
    case "stock_price_change":
      return isRiskUp
        ? `Market signal is weak, which is a secondary pressure indicator.${volatilityContext}`
        : `Market signal is supportive, but role-skill fit remains the primary driver.${volatilityContext}`;
      break;
    case "performance_rating":
      return isRiskUp
        ? "Current performance signal is below the safer range for this role context."
        : "Current performance signal is a strong protective factor.";
      break;
    case "job_title":
      return isRiskUp
        ? "This job title is currently in a tighter demand band compared with safer role clusters."
        : "This job title sits in a stronger demand band, supporting role continuity.";
      break;
    case "tech_stack":
      return isRiskUp
        ? "Current stack appears less aligned with the strongest hiring demand for this role segment."
        : "Current stack aligns well with resilient and in-demand capability clusters.";
      break;
    case "department":
      return isRiskUp
        ? "Department-level pressure is elevated, so this role faces more review sensitivity."
        : "Department context is relatively stable, which helps reduce disruption risk.";
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

export const buildRiskStory = (predictionData) => {
  const prediction = predictionData?.prediction || {};
  const topFactors = Array.isArray(prediction.top_factors) ? prediction.top_factors : [];
  const marketSignals = predictionData?.market_signals || {};
  const stackSurvival = predictionData?.stack_survival || {};

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
    high: "Your profile is currently in a high-risk zone due to weaker role-demand and skill-alignment signals.",
    medium: "Your profile is in a balanced zone: skill/role strengths are present, but pressure signals still matter.",
    low: "Your profile is currently in a lower-risk zone with stronger role-demand and stack-alignment signals.",
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
    marketLine: `Market context is ${marketRegime}. ${stressText} This is a contextual signal, not the primary decision basis.`,
    stackLine: String(stackSurvival?.narrative || "").trim(),
    pressureSignals,
    protectionSignals,
    overall,
  };
};

export const buildStabilizationPlan = (predictionData) => {
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
    role_demand_index: {
      title: "Align output to high-demand role expectations",
      detail: "Prioritize responsibilities tied to currently expanding workstreams in your role family.",
    },
    department_resilience_index: {
      title: "Increase department-critical contribution",
      detail: "Own one initiative linked to business continuity or efficiency in your department.",
    },
    tech_stack_trend_score: {
      title: "Upgrade toward AI/cloud-relevant stack",
      detail: "Replace one legacy tool with an in-demand AI/cloud workflow over the next 30 days.",
    },
    tech_stack: {
      title: "Modernize stack exposure with practical projects",
      detail: "Ship one project artifact using a higher-demand stack to prove readiness and mobility.",
    },
    job_title: {
      title: "Build adjacent-role readiness",
      detail: "Prepare skills and outcomes that make transition to a higher-demand title feasible.",
    },
    department: {
      title: "Expand cross-department visibility",
      detail: "Partner with one more resilient function to reduce concentration risk in current department.",
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
      title: "Use market pressure as a secondary caution signal",
      detail: "Treat market movement as context, but prioritize stack and role-demand actions first.",
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

export const buildActionTrackerSeed = (predictionData) =>
  buildStabilizationPlan(predictionData).map((item, index) => ({
    id: `plan-${index + 1}`,
    title: item.title,
    detail: item.detail,
    status: "not_started",
  }));

export const formatCheckedAt = (value) => {
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

export const getVolatilityPosture = (companyVol, marketVol) => {
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

export const getResponsibleAssessment = (predictionData, inputQuality) => {
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
