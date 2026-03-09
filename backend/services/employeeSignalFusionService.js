function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9+\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value) {
  return normalizeText(value)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

function unique(items, limit = 18) {
  const seen = new Set();
  const output = [];

  for (const item of items || []) {
    const value = String(item || '').trim();
    if (!value) {
      continue;
    }
    const key = normalizeText(value);
    if (!key || seen.has(key)) {
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

export function parseFreeformList(value, limit = 20) {
  if (Array.isArray(value)) {
    return unique(value, limit);
  }

  const raw = String(value || '').trim();
  if (!raw) {
    return [];
  }

  return unique(
    raw
      .split(/[\n,;|/]+/g)
      .map((item) => item.trim())
      .filter(Boolean),
    limit
  );
}

function fallbackStackByRole(options, jobTitle) {
  const role = normalizeText(jobTitle);
  if (!Array.isArray(options) || !options.length) {
    return '';
  }

  const includes = (needle) => options.find((item) => normalizeText(item).includes(needle)) || '';

  if (/data|ml|ai|scientist|analytics/.test(role)) {
    return (
      includes('python ml')
      || includes('llm ops')
      || includes('pytorch')
      || options[0]
    );
  }
  if (/devops|sre|site reliability|platform|cloud/.test(role)) {
    return (
      includes('kubernetes')
      || includes('terraform')
      || includes('aws')
      || options[0]
    );
  }
  if (/qa|test|quality/.test(role)) {
    return includes('playwright') || includes('selenium') || options[0];
  }
  if (/product|business analyst|manager/.test(role)) {
    return includes('product analytics') || includes('roadmapping') || options[0];
  }
  if (/security|soc|cyber/.test(role)) {
    return includes('siem') || includes('incident response') || options[0];
  }

  return options[0];
}

function scoreOption(option, signalTokens, normalizedSignals, primaryText, roleText) {
  const normalizedOption = normalizeText(option);
  if (!normalizedOption) {
    return 0;
  }

  let score = 0;

  if (primaryText && normalizeText(primaryText) === normalizedOption) {
    return 999;
  }

  if (normalizedSignals.includes(normalizedOption)) {
    score += 7;
  }

  const optionTokens = tokenize(option);
  const overlap = optionTokens.filter((token) => signalTokens.has(token)).length;
  score += overlap * 1.2;
  score += overlap / Math.max(optionTokens.length, 1);

  if (/data|ml|ai/.test(roleText) && /(python|ml|llm|pytorch|tensorflow|mlflow)/.test(normalizedOption)) {
    score += 1.4;
  }
  if (/devops|sre|cloud/.test(roleText) && /(kubernetes|terraform|aws|gcp|azure|observability)/.test(normalizedOption)) {
    score += 1.4;
  }
  if (/qa|test|quality/.test(roleText) && /(selenium|playwright|cypress|test)/.test(normalizedOption)) {
    score += 1.2;
  }

  return score;
}

export function resolveTechStackForModel({
  primaryTechStack,
  stackProfile,
  skillTagsText,
  resumeInsights,
  techStackOptions,
  jobTitle,
}) {
  const options = Array.isArray(techStackOptions) ? techStackOptions.filter(Boolean) : [];
  const primary = String(primaryTechStack || '').trim();
  const profile = String(stackProfile || '').trim();
  const skillText = String(skillTagsText || '').trim();
  const resumeSkills = Array.isArray(resumeInsights?.skills) ? resumeInsights.skills : [];

  if (!options.length) {
    return {
      resolved_tech_stack: primary || profile || '',
      mapping_type: 'passthrough',
      confidence: 0.5,
      reason: 'No stack catalog available for mapping.',
    };
  }

  const normalizedPrimary = normalizeText(primary);
  const direct = options.find((item) => normalizeText(item) === normalizedPrimary);
  if (direct) {
    return {
      resolved_tech_stack: direct,
      mapping_type: 'direct',
      confidence: 1,
      reason: 'Exact stack selected from model catalog.',
    };
  }

  const combinedSignals = unique([
    primary,
    profile,
    skillText,
    ...resumeSkills,
  ], 30);
  const normalizedSignals = normalizeText(combinedSignals.join(' '));
  const signalTokens = new Set(tokenize(normalizedSignals));
  const roleText = normalizeText(jobTitle);

  const ranked = options
    .map((option) => ({
      option,
      score: scoreOption(option, signalTokens, normalizedSignals, primary, roleText),
    }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (best && best.score >= 2.1) {
    return {
      resolved_tech_stack: best.option,
      mapping_type: 'fuzzy',
      confidence: Number(Math.min(0.95, Math.max(0.55, best.score / 8)).toFixed(3)),
      reason: 'Mapped mixed/free-form stack to closest model-supported stack.',
    };
  }

  const fallback = fallbackStackByRole(options, jobTitle);
  return {
    resolved_tech_stack: fallback,
    mapping_type: 'role_fallback',
    confidence: 0.52,
    reason: 'Could not confidently map free-form stack; used role-based fallback.',
  };
}

export function mergeResumeInsightsSignals(baseInsights = {}, extras = {}) {
  const source = baseInsights && typeof baseInsights === 'object' ? baseInsights : {};
  const extraSkills = parseFreeformList(extras.skill_tags, 18);
  const extraCertifications = parseFreeformList(extras.certifications, 12);
  const stackProfileTokens = parseFreeformList(
    String(extras.stack_profile || '').replace(/\s*\+\s*/g, ','),
    12
  );

  const skills = unique([
    ...(Array.isArray(source.skills) ? source.skills : []),
    ...extraSkills,
    ...stackProfileTokens,
  ], 18);

  const certifications = unique([
    ...(Array.isArray(source.certifications) ? source.certifications : []),
    ...extraCertifications,
  ], 12);

  return {
    candidate_name: source.candidate_name || null,
    years_of_experience: Number.isFinite(Number(source.years_of_experience))
      ? Number(source.years_of_experience)
      : null,
    certifications,
    skills,
    ai_readiness_score: Number.isFinite(Number(source.ai_readiness_score))
      ? Number(source.ai_readiness_score)
      : null,
    parse_confidence: Number.isFinite(Number(source.parse_confidence))
      ? Number(source.parse_confidence)
      : null,
    declared_stack_profile: String(extras.stack_profile || '').trim() || null,
  };
}
