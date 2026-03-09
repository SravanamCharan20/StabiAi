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

const GROUNDING_STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'your', 'you', 'are', 'into', 'over',
  'using', 'use', 'build', 'improve', 'team', 'role', 'market', 'risk', 'high', 'medium', 'low',
  'weeks', 'months', 'quarter', 'project', 'delivery', 'impact', 'current', 'future',
  'engineering', 'software', 'developer', 'analyst', 'management', 'manager', 'business',
  'operations', 'technology', 'technical', 'internal', 'mobility', 'preparation', 'plan',
  'visibility', 'growth', 'stability',
]);

function normalizeLoose(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeGrounding(value) {
  return normalizeLoose(value)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !GROUNDING_STOP_WORDS.has(token));
}

function buildGroundingTokens(employeeData = {}, predictionData = {}, suggestions = {}) {
  const tokens = new Set();
  const addText = (value) => {
    for (const token of tokenizeGrounding(value)) {
      tokens.add(token);
    }
  };
  const addList = (values = []) => {
    for (const value of values) {
      addText(value);
    }
  };

  addText(employeeData?.job_title);
  addText(employeeData?.department);
  addText(employeeData?.tech_stack);
  addText(employeeData?.stack_profile);
  addText(employeeData?.skill_tags);
  addText(employeeData?.certifications);
  addList(employeeData?.resume_insights?.skills || []);
  addList(employeeData?.resume_insights?.certifications || []);

  const topFactors = Array.isArray(predictionData?.prediction?.top_factors)
    ? predictionData.prediction.top_factors
    : [];
  for (const factor of topFactors.slice(0, 6)) {
    addText(factor?.feature);
    addText(factor?.label);
    addText(factor?.reason);
  }

  const trendGuidance = predictionData?.trend_guidance || {};
  addList(trendGuidance?.skill_gaps || []);
  addList(trendGuidance?.certification_gaps || []);
  addList((trendGuidance?.trending_skills || []).map((item) => item?.name || item));
  addList((trendGuidance?.trending_certifications || []).map((item) => item?.name || item));

  const trends = suggestions?.trends || {};
  addList(trends?.skill_gaps || []);
  addList(trends?.certification_gaps || []);
  addList((trends?.trending_skills || []).map((item) => item?.name || item));
  addList((trends?.trending_certifications || []).map((item) => item?.name || item));

  return tokens;
}

function overlapScore(value, groundingTokens) {
  if (!(groundingTokens instanceof Set) || groundingTokens.size === 0) {
    return 0;
  }
  const tokens = tokenizeGrounding(value);
  if (!tokens.length) {
    return 0;
  }
  return tokens.filter((token) => groundingTokens.has(token)).length;
}

function dedupeByField(items = [], fieldName, limit = 4) {
  const output = [];
  const seen = new Set();
  for (const item of items) {
    const key = normalizeLoose(item?.[fieldName]);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push(item);
    if (output.length >= limit) {
      break;
    }
  }
  return output;
}

function selectGroundedObjects(items = [], fallbackItems = [], textSelector, limit, groundingTokens, minScore = 1) {
  const rankedPrimary = asArray(items)
    .map((item) => ({ item, score: overlapScore(textSelector(item), groundingTokens) }))
    .sort((a, b) => b.score - a.score);
  const rankedFallback = asArray(fallbackItems)
    .map((item) => ({ item, score: overlapScore(textSelector(item), groundingTokens) }))
    .sort((a, b) => b.score - a.score);

  const selected = [];
  const seen = new Set();
  const push = (entry) => {
    const key = normalizeLoose(textSelector(entry.item));
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    selected.push(entry.item);
  };

  for (const entry of rankedPrimary) {
    if (entry.score < minScore || selected.length >= limit) {
      continue;
    }
    push(entry);
  }

  for (const entry of rankedFallback) {
    if (entry.score < minScore || selected.length >= limit) {
      continue;
    }
    push(entry);
  }

  if (selected.length === 0) {
    for (const entry of [...rankedPrimary, ...rankedFallback].slice(0, limit)) {
      if (selected.length >= limit) {
        break;
      }
      push(entry);
    }
  }

  return selected.slice(0, limit);
}

function gatherOwnedCertifications(employeeData = {}) {
  const direct = uniqueTextList(String(employeeData?.certifications || '').split(',').map((item) => item.trim()), 16);
  const resume = uniqueTextList(asArray(employeeData?.resume_insights?.certifications), 16);
  return new Set(
    [...direct, ...resume]
      .map((value) => normalizeLoose(value))
      .filter(Boolean)
  );
}

function isOwnedCertification(name, owned = new Set()) {
  const normalizedName = normalizeLoose(name);
  if (!normalizedName) {
    return false;
  }
  for (const cert of owned) {
    if (!cert) {
      continue;
    }
    if (normalizedName === cert || normalizedName.includes(cert) || cert.includes(normalizedName)) {
      return true;
    }
  }
  return false;
}

function enforceGroundedSuggestions(suggestions = {}, employeeData = {}, predictionData = {}) {
  const safe = suggestions && typeof suggestions === 'object' ? suggestions : {};
  const trends = safe?.trends && typeof safe.trends === 'object' ? safe.trends : {};
  const groundingTokens = buildGroundingTokens(employeeData, predictionData, safe);
  const ownedCerts = gatherOwnedCertifications(employeeData);

  const skills = dedupeByField(
    selectGroundedObjects(
      safe.skills,
      [],
      (item) => `${item?.name || ''} ${item?.why || ''} ${item?.how || ''} ${item?.impact || ''}`,
      4,
      groundingTokens,
      2
    ),
    'name',
    4
  );

  const actions = dedupeByField(
    selectGroundedObjects(
      safe.actions,
      [],
      (item) => `${item?.title || ''} ${(item?.steps || []).join(' ')} ${item?.indicators || ''}`,
      4,
      groundingTokens,
      2
    ),
    'title',
    4
  );

  const opportunities = dedupeByField(
    selectGroundedObjects(
      safe.opportunities,
      [],
      (item) => `${item?.title || ''} ${item?.requirements || ''} ${item?.impact || ''}`,
      3,
      groundingTokens,
      2
    ),
    'title',
    3
  );

  const trendingTechStacks = selectGroundedObjects(
    trends?.trending_tech_stacks,
    [],
    (item) => `${item?.name || ''} ${item?.why || ''}`,
    4,
    groundingTokens
  );

  const trendingSkills = selectGroundedObjects(
    trends?.trending_skills,
    [],
    (item) => `${item?.name || ''} ${item?.why || ''}`,
    5,
    groundingTokens
  );

  const trendingCertifications = selectGroundedObjects(
    asArray(trends?.trending_certifications).filter((item) => !isOwnedCertification(item?.name, ownedCerts)),
    [],
    (item) => `${item?.name || ''} ${item?.why || ''} ${item?.provider || ''}`,
    4,
    groundingTokens
  );

  const skillGaps = selectGroundedObjects(
    trends?.skill_gaps,
    [],
    (item) => String(item || ''),
    5,
    groundingTokens
  );

  const certificationGaps = selectGroundedObjects(
    asArray(trends?.certification_gaps).filter((item) => !isOwnedCertification(item, ownedCerts)),
    [],
    (item) => String(item || ''),
    4,
    groundingTokens
  );

  const shiftPath = selectGroundedObjects(
    trends?.shift_path,
    [],
    (item) => String(item || ''),
    5,
    groundingTokens
  );

  return {
    ...safe,
    skills,
    actions,
    opportunities,
    trends: {
      ...trends,
      trending_tech_stacks: trendingTechStacks,
      trending_skills: trendingSkills,
      trending_certifications: trendingCertifications,
      skill_gaps: skillGaps,
      certification_gaps: certificationGaps,
      shift_path: shiftPath,
    },
  };
}

function normalizeCertificationCandidate(value) {
  const text = String(value || '').trim();
  if (!text) {
    return '';
  }
  return text
    .replace(/^(certification alignment|certification track|certification sprint for)\s*[:\-]?\s*/i, '')
    .replace(/^(complete|earn|prepare for|pursue)\s+/i, '')
    .replace(/\s+certification sprint$/i, '')
    .trim();
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

  const certificationMentions = uniqueTextList([
    ...skills
      .map((item) => normalizeCertificationCandidate(item?.name))
      .filter((value) => /certif|associate|professional|foundation|istqb|kubernetes|aws|azure|google|databricks|terraform/i.test(value)),
    ...actions
      .map((item) => normalizeCertificationCandidate(item?.title))
      .filter((value) => /certif|exam|associate|professional|foundation|istqb|aws|azure|google|terraform/i.test(value)),
  ], 4);

  let certificationCandidates = uniqueTextList([
    ...asArray(trends?.certification_gaps || []),
    ...certificationMentions,
  ], 4).filter((cert) => !resumeCerts.includes(cert.toLowerCase()));

  if (!certificationCandidates.length) {
    certificationCandidates = uniqueTextList(
      asArray(trends?.trending_certifications || [])
        .map((item) => item?.name)
        .filter((cert) => cert && !resumeCerts.includes(String(cert).toLowerCase())),
      2
    );
  }

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
      const groundedGemini = enforceGroundedSuggestions(geminiSuggestions, merged, predictionContext);
      return attachGuidanceMix(groundedGemini, merged, predictionContext);
    }
  } catch (error) {
    console.warn('Gemini suggestions unavailable, using RAG fallback:', error?.message || 'unknown error');
  }

  const geminiFailure = getGeminiFailureInfo();
  const ragPayload = {
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
  };

  const groundedRag = enforceGroundedSuggestions(ragPayload, merged, predictionContext);
  return attachGuidanceMix(groundedRag, merged, predictionContext);
}

export default getSuggestions;
