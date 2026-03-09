import { generateRagSuggestions } from '../../services/employeeRagService.js';
import {
  generateGeminiCustomizedSuggestions,
  getGeminiFailureInfo,
} from '../../services/employeeGeminiService.js';

function sanitizeResumeInsights(value) {
  const source = value && typeof value === 'object' ? value : {};
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
    declared_stack_profile: source.declared_stack_profile || null,
  };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function toShortText(value, limit = 180) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) {
    return '';
  }
  return text.length > limit ? `${text.slice(0, limit - 1).trim()}...` : text;
}

function uniqueTextList(items, limit = 6) {
  const output = [];
  const seen = new Set();
  for (const item of items) {
    const value = String(item || '').trim();
    const key = value.toLowerCase();
    if (!value || seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push(value);
    if (output.length >= limit) {
      break;
    }
  }
  return output;
}

function buildGuidanceMix(suggestions = {}, employeeData = {}, predictionData = {}) {
  const prediction = predictionData?.prediction || {};
  const trends = suggestions?.trends && typeof suggestions.trends === 'object' ? suggestions.trends : {};
  const risk = String(prediction?.layoff_risk || 'Medium');
  const confidence = Math.round(Number(prediction?.confidence || 0) * 100);
  const marketRegime = String(predictionData?.market_signals?.marketRegime || 'Stable');
  const topFactors = asArray(prediction?.top_factors);
  const actions = asArray(suggestions?.actions);
  const skills = asArray(suggestions?.skills);
  const opportunities = asArray(suggestions?.opportunities);
  const resumeCerts = asArray(employeeData?.resume_insights?.certifications).map((item) => String(item).toLowerCase());

  const briefHeadline = risk.toLowerCase() === 'high'
    ? 'Current profile shows elevated role-survival risk in this market context.'
    : risk.toLowerCase() === 'medium'
      ? 'Current profile is directionally stable but sensitive to role-skill gaps.'
      : 'Current profile has stronger stability signals, with room to harden resilience.';

  const attentionFromFactors = topFactors
    .filter((factor) => String(factor?.direction || '').toLowerCase() === 'increases_risk')
    .slice(0, 3)
    .map((factor) => {
      const title = String(factor?.label || factor?.feature || 'Risk factor').replace(/_/g, ' ');
      const reason = toShortText(factor?.reason || 'This signal is currently pushing risk upward.', 120);
      return `${title}: ${reason}`;
    });

  const gapItems = uniqueTextList([
    ...asArray(trends?.skill_gaps || []),
    ...asArray(trends?.certification_gaps || []),
  ], 3);
  const attentionPoints = uniqueTextList([
    ...attentionFromFactors,
    ...gapItems.map((item) => `Gap to address: ${item}`),
  ], 5);

  const nextSteps = uniqueTextList([
    ...actions.slice(0, 3).map((action) => String(action?.title || '').trim()),
    ...asArray(prediction?.improvement_tips || []).slice(0, 3).map((tip) => String(tip || '').trim()),
  ], 4);

  const timelinePlan = [
    { window: '30 days', focus: nextSteps[0] || 'Stabilize current role output and measurable delivery.' },
    { window: '60 days', focus: nextSteps[1] || 'Close one high-demand skill or certification gap.' },
    { window: '90 days', focus: nextSteps[2] || 'Demonstrate business impact and internal mobility readiness.' },
  ];

  const skillFocus = skills.slice(0, 4).map((item) => ({
    name: String(item?.name || '').trim(),
    why: toShortText(item?.why || '', 120),
    how: toShortText(item?.how || '', 120),
    impact: toShortText(item?.impact || '', 120),
  })).filter((item) => item.name);

  const certificationCandidates = uniqueTextList([
    ...asArray(trends?.certification_gaps || []),
    ...asArray(trends?.trending_certifications || []).map((item) => item?.name),
  ], 4).filter((cert) => !resumeCerts.includes(cert.toLowerCase()));

  const certificationFocus = certificationCandidates.slice(0, 3);
  const shiftPath = uniqueTextList(asArray(trends?.shift_path || []), 4);

  const marketOutlook = toShortText(
    trends?.summary
    || `Market regime is ${marketRegime}. Role-skill alignment remains the strongest controllable signal.`,
    220
  );

  return {
    security_brief: {
      headline: briefHeadline,
      confidence_pct: confidence,
      risk_label: risk,
      market_regime: marketRegime,
      reliability_gate: String(predictionData?.reliability?.gate || 'medium'),
    },
    attention_points: attentionPoints,
    next_steps: nextSteps,
    timeline_plan: timelinePlan,
    skill_focus: skillFocus,
    certification_focus: certificationFocus,
    shift_path: shiftPath,
    market_outlook: marketOutlook,
    opportunity_paths: opportunities.slice(0, 3).map((item) => ({
      title: String(item?.title || '').trim(),
      timeline: String(item?.timeline || '').trim(),
      impact: toShortText(item?.impact || '', 120),
    })).filter((item) => item.title),
  };
}

function attachGuidanceMix(suggestions, employeeData, predictionData) {
  const safe = suggestions && typeof suggestions === 'object' ? suggestions : {};
  return {
    ...safe,
    guidance_mix: buildGuidanceMix(safe, employeeData, predictionData),
  };
}

/**
 * Generate career suggestions using retrieval-augmented grounding.
 * @param {Object} employeeData
 * @param {Object} predictionData
 * @returns {Promise<Object>}
 */
async function getSuggestions(employeeData, predictionData) {
  const sanitizedResume = sanitizeResumeInsights(
    employeeData?.resume_insights || predictionData?.resume_insights || null
  );
  const merged = {
    ...employeeData,
    layoff_risk: predictionData?.prediction?.layoff_risk || employeeData?.layoff_risk || 'Medium',
    resume_insights: sanitizedResume,
  };

  const predictionContext = {
    ...predictionData,
    resume_insights: sanitizedResume,
  };

  const ragSuggestions = generateRagSuggestions(merged, predictionContext);

  try {
    const geminiSuggestions = await generateGeminiCustomizedSuggestions(
      merged,
      predictionContext,
      ragSuggestions
    );
    if (geminiSuggestions) {
      return attachGuidanceMix(geminiSuggestions, merged, predictionContext);
    }
  } catch (error) {
    console.warn('Gemini suggestions unavailable, using RAG fallback:', error?.message || 'unknown error');
  }

  const geminiFailure = getGeminiFailureInfo();
  return attachGuidanceMix({
    ...ragSuggestions,
    generator: 'rag',
    generator_model: null,
    generator_status: {
      gemini_available: false,
      reason: geminiFailure?.reason || 'unavailable',
      message: geminiFailure?.message || 'Gemini was unavailable for this run. Showing grounded RAG guidance.',
      retry_after_ms: Number.isFinite(Number(geminiFailure?.retry_after_ms))
        ? Number(geminiFailure.retry_after_ms)
        : 0,
      at_utc: geminiFailure?.at_utc || null,
    },
  }, merged, predictionContext);
}

export default getSuggestions;
