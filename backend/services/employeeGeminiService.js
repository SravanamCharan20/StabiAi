import axios from 'axios';
import { jsonrepair } from 'jsonrepair';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODELS_LIST_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_TIMEOUT_MS = 18000;
const MAX_MODEL_ATTEMPTS = 5;
const MODEL_DISCOVERY_TTL_MS = 6 * 60 * 60 * 1000;
const DEFAULT_RATE_LIMIT_COOLDOWN_MS = 15000;
const MODEL_DAILY_QUOTA_COOLDOWN_MS = 12 * 60 * 60 * 1000;
const MODEL_TIMEOUT_COOLDOWN_MS = 5 * 60 * 1000;
const SUGGESTIONS_MAX_OUTPUT_TOKENS = 1800;
const MODEL_FALLBACKS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-1.5-flash',
  'gemini-flash-latest',
  'gemini-3-flash-preview',
];
const modelCatalogCache = {
  fetchedAt: 0,
  names: null,
};
let geminiRateLimitedUntil = 0;
let lastGeminiFailure = null;
const modelCooldownCache = new Map();

const SUGGESTIONS_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    skills: {
      type: 'ARRAY',
      maxItems: 4,
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          why: { type: 'STRING' },
          how: { type: 'STRING' },
          impact: { type: 'STRING' },
        },
      },
    },
    actions: {
      type: 'ARRAY',
      maxItems: 4,
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          timeline: { type: 'STRING' },
          steps: {
            type: 'ARRAY',
            items: { type: 'STRING' },
          },
          indicators: { type: 'STRING' },
        },
      },
    },
    opportunities: {
      type: 'ARRAY',
      maxItems: 3,
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          timeline: { type: 'STRING' },
          requirements: { type: 'STRING' },
          impact: { type: 'STRING' },
        },
      },
    },
    trends: {
      type: 'OBJECT',
      properties: {
        role_family: { type: 'STRING' },
        summary: { type: 'STRING' },
        trending_tech_stacks: {
          type: 'ARRAY',
          maxItems: 4,
          items: {
            type: 'OBJECT',
            properties: {
              name: { type: 'STRING' },
              why: { type: 'STRING' },
            },
          },
        },
        trending_certifications: {
          type: 'ARRAY',
          maxItems: 4,
          items: {
            type: 'OBJECT',
            properties: {
              name: { type: 'STRING' },
              provider: { type: 'STRING' },
              level: { type: 'STRING' },
              why: { type: 'STRING' },
            },
          },
        },
        trending_skills: {
          type: 'ARRAY',
          maxItems: 5,
          items: {
            type: 'OBJECT',
            properties: {
              name: { type: 'STRING' },
              why: { type: 'STRING' },
            },
          },
        },
        skill_gaps: {
          type: 'ARRAY',
          maxItems: 5,
          items: { type: 'STRING' },
        },
        certification_gaps: {
          type: 'ARRAY',
          maxItems: 5,
          items: { type: 'STRING' },
        },
        shift_path: {
          type: 'ARRAY',
          maxItems: 5,
          items: { type: 'STRING' },
        },
      },
    },
    insights: {
      type: 'OBJECT',
      properties: {
        why_this_prediction: {
          type: 'ARRAY',
          maxItems: 5,
          items: { type: 'STRING' },
        },
        model_improvement_tips: {
          type: 'ARRAY',
          maxItems: 5,
          items: { type: 'STRING' },
        },
        market_context: { type: 'OBJECT' },
        retrieved_contexts: {
          type: 'ARRAY',
          maxItems: 5,
          items: { type: 'STRING' },
        },
      },
    },
  },
};

function stripCodeFence(text) {
  return String(text || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
}

function extractObjectEnvelope(text) {
  const cleaned = stripCodeFence(text);
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('Gemini response does not contain a JSON object');
  }
  return cleaned.slice(firstBrace, lastBrace + 1);
}

function repairLikelyJsonIssues(text) {
  return String(text || '')
    // smart quotes -> standard quotes
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    // remove BOM and non-breaking spaces
    .replace(/\uFEFF/g, '')
    .replace(/\u00A0/g, ' ')
    // strip comments if model added them
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // likely missing commas between adjacent array/object elements
    .replace(/}\s*\n\s*{/g, '},\n{')
    .replace(/]\s*\n\s*\[/g, '],\n[')
    .replace(/([}\]0-9"])\s*\n\s*("[A-Za-z0-9_ ]+"\s*:)/g, '$1,\n$2')
    .replace(/"\s*\n\s*"/g, '",\n"')
    .replace(/"\s*\n\s*{/g, '",\n{')
    .replace(/}\s*\n\s*"/g, '},\n"')
    // trailing commas in arrays/objects
    .replace(/,\s*([}\]])/g, '$1')
    .trim();
}

function safeParseJsonObject(text) {
  let envelope;
  try {
    envelope = extractObjectEnvelope(text);
  } catch (envelopeError) {
    try {
      const repairedWhole = jsonrepair(stripCodeFence(text));
      const parsedWhole = JSON.parse(repairedWhole);
      if (parsedWhole && typeof parsedWhole === 'object') {
        return parsedWhole;
      }
    } catch (repairError) {
      // continue to structured parse error below
    }
    throw envelopeError;
  }

  const variants = [envelope, repairLikelyJsonIssues(envelope)];
  let repairedByLibrary = null;

  try {
    repairedByLibrary = jsonrepair(envelope);
    if (repairedByLibrary) {
      variants.push(repairedByLibrary);
      variants.push(repairLikelyJsonIssues(repairedByLibrary));
    }
  } catch (error) {
    // Ignore and continue with native repair variants.
  }

  const seen = new Set();
  let lastError = null;

  for (const candidate of variants) {
    const key = candidate.trim();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);

    try {
      return JSON.parse(candidate);
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`Unable to parse Gemini JSON: ${lastError?.message || 'unknown parse error'}`);
}

function normalizeModelName(value) {
  return String(value || '')
    .replace(/^models\//i, '')
    .trim();
}

function parseRetryDelayMs(message) {
  const text = String(message || '');
  const match = text.match(/retry in ([0-9.]+)s/i);
  if (!match) {
    return DEFAULT_RATE_LIMIT_COOLDOWN_MS;
  }
  const seconds = Number(match[1]);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return DEFAULT_RATE_LIMIT_COOLDOWN_MS;
  }
  return Math.max(DEFAULT_RATE_LIMIT_COOLDOWN_MS, Math.ceil(seconds * 1000));
}

function isDailyQuotaMessage(message) {
  const text = String(message || '').toLowerCase();
  return text.includes('requestsperday')
    || text.includes('perday')
    || text.includes('limit: 0')
    || text.includes('quota exceeded for metric');
}

function getModelCooldownRemainingMs(model) {
  const until = Number(modelCooldownCache.get(model) || 0);
  if (!Number.isFinite(until) || until <= 0) {
    return 0;
  }
  return Math.max(0, until - Date.now());
}

function setModelCooldown(model, msFromNow) {
  if (!model) {
    return;
  }
  const duration = Number(msFromNow);
  if (!Number.isFinite(duration) || duration <= 0) {
    return;
  }
  modelCooldownCache.set(model, Date.now() + duration);
}

function setGeminiFailure(reason, message, retryAfterMs = 0) {
  lastGeminiFailure = {
    reason: String(reason || 'unavailable'),
    message: String(message || 'Gemini is unavailable for this run.'),
    retry_after_ms: Number.isFinite(Number(retryAfterMs)) ? Math.max(0, Number(retryAfterMs)) : 0,
    at_utc: new Date().toISOString(),
  };
}

export function getGeminiFailureInfo() {
  return lastGeminiFailure;
}

function classifyGeminiFailure(error) {
  const text = String(error?.message || '').toLowerCase();
  if (text.includes('quota') || text.includes('rate limit') || text.includes('resource_exhausted')) {
    return {
      reason: 'quota_exceeded',
      message: 'Gemini quota is exhausted for this API key. Showing grounded RAG guidance for now.',
    };
  }
  if (text.includes('timeout') || text.includes('timed out')) {
    return {
      reason: 'timeout',
      message: 'Gemini response timed out. Showing grounded RAG guidance for this run.',
    };
  }
  if (text.includes('json') || text.includes('parse')) {
    return {
      reason: 'invalid_json',
      message: 'Gemini returned malformed JSON. Showing grounded RAG guidance for this run.',
    };
  }
  return {
    reason: 'unavailable',
    message: 'Gemini is temporarily unavailable. Showing grounded RAG guidance for this run.',
  };
}

async function fetchAvailableModelNames(apiKey) {
  const now = Date.now();
  if (Array.isArray(modelCatalogCache.names) && (now - modelCatalogCache.fetchedAt) < MODEL_DISCOVERY_TTL_MS) {
    return modelCatalogCache.names;
  }

  try {
    const response = await axios.get(
      `${GEMINI_MODELS_LIST_URL}?key=${encodeURIComponent(apiKey)}`,
      { timeout: 8000 }
    );
    const names = (response?.data?.models || [])
      .map((model) => normalizeModelName(model?.name))
      .filter(Boolean);

    const unique = [...new Set(names)];
    if (unique.length > 0) {
      modelCatalogCache.names = unique;
      modelCatalogCache.fetchedAt = now;
      return unique;
    }
  } catch (error) {
    // Keep fallback candidates when model catalog endpoint is unavailable.
  }

  return null;
}

function resolveCandidateFromCatalog(candidate, catalog) {
  const normalized = normalizeModelName(candidate);
  if (!normalized || !Array.isArray(catalog) || catalog.length === 0) {
    return null;
  }

  if (catalog.includes(normalized)) {
    return normalized;
  }

  const prefixMatch = catalog.find((name) => name.startsWith(`${normalized}-`) || name.startsWith(normalized));
  if (prefixMatch) {
    return prefixMatch;
  }

  const containsMatch = catalog.find((name) => name.includes(normalized));
  return containsMatch || null;
}

function sortModelPreference(models = []) {
  const score = (name) => {
    const normalized = normalizeModelName(name).toLowerCase();
    let weight = 0;

    if (normalized === 'gemini-2.0-flash') {
      weight += 120;
    }
    if (normalized.startsWith('gemini-2.0-flash')) {
      weight += 90;
    } else if (normalized.startsWith('gemini-2.5-flash')) {
      weight += 80;
    } else if (normalized.startsWith('gemini-3-flash')) {
      weight += 88;
    } else if (normalized.startsWith('gemini-flash-latest')) {
      weight += 84;
    } else if (normalized.startsWith('gemini-1.5-flash')) {
      weight += 50;
    }

    if (normalized.includes('lite')) {
      weight -= 6;
    }
    if (normalized.includes('thinking') || normalized.includes('exp') || normalized.includes('experimental')) {
      weight -= 14;
    }
    if (normalized.includes('preview')) {
      weight -= 8;
    }

    return weight;
  };

  return [...models]
    .filter(Boolean)
    .sort((a, b) => score(b) - score(a));
}

function selectCatalogFlashCandidates(catalog = []) {
  return sortModelPreference(
    catalog
      .filter((name) => /gemini-[\w.-]*flash/i.test(name) || /^gemini-flash/i.test(name))
      .filter((name) => !/embedding|imagen|aqa|tts|veo|learnlm/i.test(name))
      .filter((name) => !/thinking|experimental|image-generation/i.test(name))
  ).slice(0, 6);
}

async function getModelCandidates(apiKey) {
  const preferred = normalizeModelName(process.env.GEMINI_MODEL);
  const desiredCandidates = [...new Set([
    preferred,
    DEFAULT_GEMINI_MODEL,
    ...MODEL_FALLBACKS,
  ].filter(Boolean))];

  const catalog = await fetchAvailableModelNames(apiKey);
  if (!Array.isArray(catalog) || catalog.length === 0) {
    return desiredCandidates;
  }

  const resolved = desiredCandidates
    .map((candidate) => resolveCandidateFromCatalog(candidate, catalog))
    .filter(Boolean);

  const catalogFallbacks = selectCatalogFlashCandidates(catalog);
  const combined = sortModelPreference([
    ...new Set([
      ...resolved,
      ...catalogFallbacks,
    ]),
  ]).slice(0, 6);

  if (combined.length > 0) {
    return combined;
  }

  const flashFirst = selectCatalogFlashCandidates(catalog).slice(0, 4);

  if (flashFirst.length > 0) {
    return sortModelPreference(flashFirst);
  }

  return sortModelPreference(desiredCandidates);
}

function buildGeminiUrl(apiKey, model) {
  return `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

async function callGeminiText({ apiKey, prompt, generationConfig, models = [] }) {
  const errors = [];
  const candidateModels = Array.isArray(models) && models.length > 0
    ? models
    : await getModelCandidates(apiKey);
  let retryDelayMs = 0;
  let attempts = 0;

  for (const model of candidateModels) {
    if (attempts >= MAX_MODEL_ATTEMPTS) {
      break;
    }

    const cooldownRemaining = getModelCooldownRemainingMs(model);
    if (cooldownRemaining > 0) {
      errors.push(`${model}: skipped (cooldown ${Math.ceil(cooldownRemaining / 1000)}s)`);
      continue;
    }

    attempts += 1;
    const url = buildGeminiUrl(apiKey, model);

    try {
      const response = await axios.post(
        url,
        {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig,
        },
        { timeout: GEMINI_TIMEOUT_MS }
      );

      const candidate = response?.data?.candidates?.[0] || {};
      const finishReason = String(candidate?.finishReason || '').toUpperCase();
      const text = candidate?.content?.parts?.map((part) => part.text || '').join('\n') || '';
      if (!text.trim()) {
        errors.push(`${model}: empty content${finishReason ? ` (${finishReason})` : ''}`);
        continue;
      }

      return { text, model, finishReason };
    } catch (error) {
      const status = Number(error?.response?.status || 0) || 'NA';
      const message = error?.response?.data?.error?.message || error.message;
      if (status === 429) {
        if (isDailyQuotaMessage(message)) {
          setModelCooldown(model, MODEL_DAILY_QUOTA_COOLDOWN_MS);
          retryDelayMs = Math.max(retryDelayMs, DEFAULT_RATE_LIMIT_COOLDOWN_MS);
        } else {
          const parsedRetry = parseRetryDelayMs(message);
          setModelCooldown(model, parsedRetry);
          retryDelayMs = Math.max(retryDelayMs, parsedRetry);
        }
      } else if (String(message || '').toLowerCase().includes('timeout')) {
        setModelCooldown(model, MODEL_TIMEOUT_COOLDOWN_MS);
      }
      errors.push(`${model}: [${status}] ${message}`);
    }
  }

  const aggregatedError = new Error(`Gemini call failed across models. ${errors.join(' | ')}`);
  if (retryDelayMs > 0) {
    aggregatedError.rateLimitDelayMs = retryDelayMs;
  }
  throw aggregatedError;
}

async function repairJsonWithGemini(rawText, apiKey, models) {
  const repairPrompt = [
    'Repair the malformed JSON below.',
    'Return ONLY valid JSON and preserve original meaning and keys.',
    'Return compact JSON in a single line.',
    'Do not add markdown, comments, or extra fields.',
    '',
    'malformed_json:',
    stripCodeFence(rawText),
  ].join('\n');

  const repaired = await callGeminiText({
    apiKey,
    models,
    prompt: repairPrompt,
    generationConfig: {
      temperature: 0,
      topP: 0.8,
      maxOutputTokens: SUGGESTIONS_MAX_OUTPUT_TOKENS,
      responseMimeType: 'application/json',
    },
  });

  if (!repaired.text.trim()) {
    throw new Error('Gemini repair returned empty content');
  }

  return safeParseJsonObject(repaired.text);
}

function normalizeSteps(steps) {
  if (!Array.isArray(steps)) {
    return [];
  }
  return steps
    .map((step) => String(step || '').trim())
    .filter(Boolean)
    .slice(0, 6);
}

function normalizeTrendNameWhy(items, limit = 5) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .map((item) => ({
      name: String(item?.name || '').trim(),
      why: String(item?.why || '').trim(),
    }))
    .filter((item) => item.name && item.why)
    .slice(0, limit);
}

function normalizeTrendCerts(items, limit = 5) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .map((item) => ({
      name: String(item?.name || '').trim(),
      provider: String(item?.provider || '').trim(),
      level: String(item?.level || '').trim(),
      why: String(item?.why || '').trim(),
    }))
    .filter((item) => item.name && item.why)
    .slice(0, limit);
}

function normalizeStringList(items, limit = 5) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, limit);
}

function normalizeLoose(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function ensureCertificationCoverage(skills, actions, trends) {
  const certGaps = Array.isArray(trends?.certification_gaps) ? trends.certification_gaps : [];
  if (!certGaps.length) {
    return { skills, actions };
  }

  const firstGap = String(certGaps[0] || '').trim();
  if (!firstGap) {
    return { skills, actions };
  }
  const firstGapNorm = normalizeLoose(firstGap);

  const skillHasCert = skills.some((item) => {
    const text = normalizeLoose(`${item?.name || ''} ${item?.why || ''} ${item?.how || ''}`);
    return text.includes('certif') || text.includes(firstGapNorm);
  });

  const actionHasCert = actions.some((item) => {
    const text = normalizeLoose(`${item?.title || ''} ${item?.indicators || ''} ${(item?.steps || []).join(' ')}`);
    return text.includes('certif') || text.includes(firstGapNorm);
  });

  const nextSkills = [...skills];
  const nextActions = [...actions];

  if (!skillHasCert) {
    nextSkills.push({
      name: `Certification track: ${firstGap}`,
      why: 'Certification proof strengthens screening and internal mobility confidence.',
      how: `Prepare for ${firstGap} with one practical project and weekly milestones.`,
      impact: 'Improves credibility for role continuity in competitive markets.',
    });
  }

  if (!actionHasCert) {
    nextActions.push({
      title: `Complete ${firstGap} certification sprint`,
      timeline: '6-10 weeks',
      steps: [
        'Map certification domains to current role tasks',
        'Build one applied project aligned to exam outcomes',
        'Schedule exam and document outcomes in your impact log',
      ],
      indicators: 'Certification completed with role-relevant project evidence.',
    });
  }

  return {
    skills: nextSkills.slice(0, 6),
    actions: nextActions.slice(0, 6),
  };
}

function normalizeSuggestionsShape(payload, fallback) {
  const safe = payload && typeof payload === 'object' ? payload : {};
  const skills = Array.isArray(safe.skills) ? safe.skills : fallback.skills;
  const actions = Array.isArray(safe.actions) ? safe.actions : fallback.actions;
  const opportunities = Array.isArray(safe.opportunities) ? safe.opportunities : fallback.opportunities;
  const trends = safe.trends && typeof safe.trends === 'object' ? safe.trends : (fallback.trends || {});
  const insights = safe.insights && typeof safe.insights === 'object' ? safe.insights : fallback.insights;

  const normalizedSkills = skills
    .map((item) => ({
      name: String(item?.name || '').trim(),
      why: String(item?.why || '').trim(),
      how: String(item?.how || '').trim(),
      impact: String(item?.impact || '').trim(),
    }))
    .filter((item) => item.name && item.why && item.how && item.impact)
    .slice(0, 6);

  const fallbackSkills = (fallback.skills || [])
    .map((item) => ({
      name: String(item?.name || '').trim(),
      why: String(item?.why || '').trim(),
      how: String(item?.how || '').trim(),
      impact: String(item?.impact || '').trim(),
    }))
    .filter((item) => item.name && item.why && item.how && item.impact)
    .slice(0, 6);

  const normalizedActions = actions
    .map((item) => ({
      title: String(item?.title || '').trim(),
      timeline: String(item?.timeline || '').trim(),
      steps: normalizeSteps(item?.steps),
      indicators: String(item?.indicators || '').trim(),
    }))
    .filter((item) => item.title && item.timeline && item.steps.length > 0 && item.indicators)
    .slice(0, 6);

  const fallbackActions = (fallback.actions || [])
    .map((item) => ({
      title: String(item?.title || '').trim(),
      timeline: String(item?.timeline || '').trim(),
      steps: normalizeSteps(item?.steps),
      indicators: String(item?.indicators || '').trim(),
    }))
    .filter((item) => item.title && item.timeline && item.steps.length > 0 && item.indicators)
    .slice(0, 6);

  const normalizedOpportunities = opportunities
    .map((item) => ({
      title: String(item?.title || '').trim(),
      timeline: String(item?.timeline || '').trim(),
      requirements: String(item?.requirements || '').trim(),
      impact: String(item?.impact || '').trim(),
    }))
    .filter((item) => item.title && item.timeline && item.requirements && item.impact)
    .slice(0, 5);

  const fallbackOpportunities = (fallback.opportunities || [])
    .map((item) => ({
      title: String(item?.title || '').trim(),
      timeline: String(item?.timeline || '').trim(),
      requirements: String(item?.requirements || '').trim(),
      impact: String(item?.impact || '').trim(),
    }))
    .filter((item) => item.title && item.timeline && item.requirements && item.impact)
    .slice(0, 5);

  const fallbackTrends = fallback?.trends && typeof fallback.trends === 'object' ? fallback.trends : {};
  const normalizedTrends = {
    role_family: String(trends?.role_family || fallbackTrends?.role_family || '').trim(),
    summary: String(trends?.summary || fallbackTrends?.summary || '').trim(),
    trending_tech_stacks: (() => {
      const value = normalizeTrendNameWhy(trends?.trending_tech_stacks, 5);
      return value.length ? value : normalizeTrendNameWhy(fallbackTrends?.trending_tech_stacks, 5);
    })(),
    trending_certifications: (() => {
      const value = normalizeTrendCerts(trends?.trending_certifications, 5);
      return value.length ? value : normalizeTrendCerts(fallbackTrends?.trending_certifications, 5);
    })(),
    trending_skills: (() => {
      const value = normalizeTrendNameWhy(trends?.trending_skills, 6);
      return value.length ? value : normalizeTrendNameWhy(fallbackTrends?.trending_skills, 6);
    })(),
    skill_gaps: (() => {
      const value = normalizeStringList(trends?.skill_gaps, 6);
      return value.length ? value : normalizeStringList(fallbackTrends?.skill_gaps, 6);
    })(),
    certification_gaps: (() => {
      const value = normalizeStringList(trends?.certification_gaps, 6);
      return value.length ? value : normalizeStringList(fallbackTrends?.certification_gaps, 6);
    })(),
    shift_path: (() => {
      const value = normalizeStringList(trends?.shift_path, 6);
      return value.length ? value : normalizeStringList(fallbackTrends?.shift_path, 6);
    })(),
    global_priority_skills: (() => {
      const value = normalizeStringList(trends?.global_priority_skills, 6);
      return value.length ? value : normalizeStringList(fallbackTrends?.global_priority_skills, 6);
    })(),
  };

  const selectedSkills = normalizedSkills.length > 0 ? normalizedSkills : fallbackSkills;
  const selectedActions = normalizedActions.length > 0 ? normalizedActions : fallbackActions;
  const certificationAdjusted = ensureCertificationCoverage(selectedSkills, selectedActions, normalizedTrends);

  return {
    skills: certificationAdjusted.skills,
    actions: certificationAdjusted.actions,
    opportunities: normalizedOpportunities.length > 0 ? normalizedOpportunities : fallbackOpportunities,
    trends: normalizedTrends,
    insights,
  };
}

function compactSuggestionContext(ragSuggestions) {
  const safe = ragSuggestions && typeof ragSuggestions === 'object' ? ragSuggestions : {};
  return {
    skills: Array.isArray(safe.skills)
      ? safe.skills.slice(0, 3).map((item) => ({
        name: String(item?.name || '').trim(),
        why: String(item?.why || '').trim(),
      }))
      : [],
    actions: Array.isArray(safe.actions)
      ? safe.actions.slice(0, 3).map((item) => ({
        title: String(item?.title || '').trim(),
        timeline: String(item?.timeline || '').trim(),
      }))
      : [],
    opportunities: Array.isArray(safe.opportunities)
      ? safe.opportunities.slice(0, 3).map((item) => ({
        title: String(item?.title || '').trim(),
        timeline: String(item?.timeline || '').trim(),
      }))
      : [],
    trends: {
      role_family: String(safe?.trends?.role_family || '').trim(),
      summary: String(safe?.trends?.summary || '').trim(),
      trending_tech_stacks: normalizeTrendNameWhy(safe?.trends?.trending_tech_stacks || [], 3),
      trending_certifications: normalizeTrendCerts(safe?.trends?.trending_certifications || [], 3),
      trending_skills: normalizeTrendNameWhy(safe?.trends?.trending_skills || [], 4),
      skill_gaps: normalizeStringList(safe?.trends?.skill_gaps || [], 4),
      certification_gaps: normalizeStringList(safe?.trends?.certification_gaps || [], 4),
    },
  };
}

function buildPrompt(userData, predictionData, ragSuggestions) {
  const compactRag = compactSuggestionContext(ragSuggestions);
  const compactUserData = {
    company_name: userData?.company_name || null,
    job_title: userData?.job_title || null,
    department: userData?.department || null,
    tech_stack: userData?.tech_stack || null,
    stack_profile: userData?.stack_profile || null,
    skill_tags: normalizeStringList(String(userData?.skill_tags || '').split(','), 8),
    certifications: normalizeStringList(String(userData?.certifications || '').split(','), 8),
    years_at_company: Number.isFinite(Number(userData?.years_at_company)) ? Number(userData.years_at_company) : null,
    performance_rating: Number.isFinite(Number(userData?.performance_rating)) ? Number(userData.performance_rating) : null,
    resume_insights: {
      skills: normalizeStringList((userData?.resume_insights?.skills || []).map((item) => item?.name || item), 10),
      certifications: normalizeStringList((userData?.resume_insights?.certifications || []).map((item) => item?.name || item), 8),
      years_of_experience: Number.isFinite(Number(userData?.resume_insights?.years_of_experience))
        ? Number(userData.resume_insights.years_of_experience)
        : null,
      ai_readiness_score: Number.isFinite(Number(userData?.resume_insights?.ai_readiness_score))
        ? Number(userData.resume_insights.ai_readiness_score)
        : null,
    },
  };

  const compactPrediction = {
    layoff_risk: predictionData?.prediction?.layoff_risk,
    confidence: predictionData?.prediction?.confidence,
    top_factors: (predictionData?.prediction?.top_factors || []).slice(0, 4),
    improvement_tips: (predictionData?.prediction?.improvement_tips || []).slice(0, 4),
    stack_survival: predictionData?.stack_survival,
    reliability: predictionData?.reliability || {},
    market_signals: {
      marketRegime: predictionData?.market_signals?.marketRegime || null,
      marketStressScore: Number.isFinite(Number(predictionData?.market_signals?.marketStressScore))
        ? Number(predictionData.market_signals.marketStressScore)
        : null,
      relative_return_90d: Number.isFinite(Number(predictionData?.market_signals?.relative_return_90d))
        ? Number(predictionData.market_signals.relative_return_90d)
        : null,
      source: predictionData?.market_signals?.dataSource || null,
    },
  };

  return [
    'You are a senior career-risk advisor for Indian tech and services employees.',
    'Goal: produce compact, practical guidance from prediction and market signals.',
    '',
    'Return ONLY a valid JSON object with this exact shape:',
    '{',
    '  "skills": [{"name":"", "why":"", "how":"", "impact":""}],',
    '  "actions": [{"title":"", "timeline":"", "steps":[""], "indicators":""}],',
    '  "opportunities": [{"title":"", "timeline":"", "requirements":"", "impact":""}],',
    '  "trends": {',
    '    "role_family": "",',
    '    "summary": "",',
    '    "trending_tech_stacks": [{"name":"", "why":""}],',
    '    "trending_certifications": [{"name":"", "provider":"", "level":"", "why":""}],',
    '    "trending_skills": [{"name":"", "why":""}],',
    '    "skill_gaps": [],',
    '    "certification_gaps": [],',
    '    "shift_path": []',
    '  },',
    '  "insights": {',
    '    "why_this_prediction": [],',
    '    "model_improvement_tips": [],',
    '    "market_context": {},',
    '    "retrieved_contexts": []',
    '  }',
    '}',
    '',
    'Constraints:',
    '- Keep each item concrete and measurable.',
    '- Use timelines in weeks/months.',
    '- Do not hallucinate unavailable data; use provided context only.',
    '- Keep each array to 2 items unless strongly justified (max 3).',
    '- Keep each text field short and direct (one sentence).',
    '- Keep each string under 110 characters.',
    '- Keep each steps array to 2 short bullets.',
    '- Avoid repeating the same idea across multiple sections.',
    '- Prioritize market-relevant trends for 2026 role demand in India.',
    '- Include one realistic shift path from current stack to stronger stack.',
    '- If certification gaps exist, include one skill and one action to close them.',
    '- Return compact JSON (no pretty-print indentation).',
    '- Use strict JSON only (double quotes, no comments, no trailing commas).',
    '',
    `employee_data: ${JSON.stringify(compactUserData)}`,
    `prediction_context: ${JSON.stringify(compactPrediction)}`,
    `baseline_rag_suggestions: ${JSON.stringify(compactRag)}`,
  ].join('\n');
}

export async function generateGeminiCustomizedSuggestions(userData, predictionData, ragSuggestions) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    setGeminiFailure('missing_key', 'GEMINI_API_KEY is missing. Showing grounded RAG guidance.');
    return null;
  }

  if (Date.now() < geminiRateLimitedUntil) {
    const waitMs = Math.max(0, geminiRateLimitedUntil - Date.now());
    setGeminiFailure(
      'rate_limited',
      'Gemini is cooling down after rate limits. Showing grounded RAG guidance for now.',
      waitMs
    );
    return null;
  }

  try {
    const models = await getModelCandidates(apiKey);
    const prompt = buildPrompt(userData, predictionData, ragSuggestions);
    let text = '';
    let modelUsed = models[0] || DEFAULT_GEMINI_MODEL;
    try {
      const response = await callGeminiText({
        apiKey,
        models,
        prompt,
        generationConfig: {
          temperature: 0.15,
          topP: 0.8,
          maxOutputTokens: SUGGESTIONS_MAX_OUTPUT_TOKENS,
          responseMimeType: 'application/json',
          responseSchema: SUGGESTIONS_RESPONSE_SCHEMA,
        },
      });
      text = response.text;
      modelUsed = response.model;

      if (response.finishReason === 'MAX_TOKENS') {
        const compactRetry = await callGeminiText({
          apiKey,
          models,
          prompt: [
            prompt,
            '',
            'COMPRESS FURTHER:',
            '- keep exactly 2 skills, 2 actions, 2 opportunities',
            '- keep exactly 2 trend stacks, 2 trend certs, 2 trend skills',
            '- keep all strings under 100 chars',
            '- return strict compact JSON only',
          ].join('\n'),
          generationConfig: {
            temperature: 0,
            topP: 0.8,
            maxOutputTokens: SUGGESTIONS_MAX_OUTPUT_TOKENS + 900,
            responseMimeType: 'application/json',
            responseSchema: SUGGESTIONS_RESPONSE_SCHEMA,
          },
        });
        text = compactRetry.text;
        modelUsed = compactRetry.model;
      }
    } catch (schemaError) {
      if (String(schemaError?.message || '').includes('Gemini call failed across models')) {
        throw schemaError;
      }
      const response = await callGeminiText({
        apiKey,
        models,
        prompt,
        generationConfig: {
          temperature: 0.15,
          topP: 0.8,
          maxOutputTokens: SUGGESTIONS_MAX_OUTPUT_TOKENS,
          responseMimeType: 'application/json',
        },
      });
      text = response.text;
      modelUsed = response.model;

      if (response.finishReason === 'MAX_TOKENS') {
        const compactRetry = await callGeminiText({
          apiKey,
          models,
          prompt: [
            prompt,
            '',
            'COMPRESS FURTHER:',
            '- keep exactly 2 skills, 2 actions, 2 opportunities',
            '- keep strings short and strict JSON only',
          ].join('\n'),
          generationConfig: {
            temperature: 0,
            topP: 0.8,
            maxOutputTokens: SUGGESTIONS_MAX_OUTPUT_TOKENS + 900,
            responseMimeType: 'application/json',
          },
        });
        text = compactRetry.text;
        modelUsed = compactRetry.model;
      }
    }

    if (!text.trim()) {
      setGeminiFailure('empty_response', 'Gemini returned empty content. Showing grounded RAG guidance.');
      return null;
    }

    let parsed;
    try {
      parsed = safeParseJsonObject(text);
    } catch (parseError) {
      try {
        const strictJsonResponse = await callGeminiText({
          apiKey,
          models,
          prompt: [
            prompt,
            '',
            'FINAL INSTRUCTION:',
            'Respond with only one valid JSON object.',
            'Return compact JSON in a single line.',
            'Keep each array to at most 2 items.',
            'Keep each string under 100 characters.',
            'No markdown, no prose, no explanation.',
          ].join('\n'),
          generationConfig: {
            temperature: 0,
            topP: 0.8,
            maxOutputTokens: SUGGESTIONS_MAX_OUTPUT_TOKENS,
            responseMimeType: 'application/json',
          },
        });
        text = strictJsonResponse.text;
        modelUsed = strictJsonResponse.model;
        parsed = safeParseJsonObject(text);
      } catch (strictJsonError) {
        parsed = await repairJsonWithGemini(text, apiKey, models);
        if (!parsed || typeof parsed !== 'object') {
          return null;
        }
      }
    }

    const normalized = normalizeSuggestionsShape(parsed, ragSuggestions);
    lastGeminiFailure = null;

    return {
      ...normalized,
      generator: 'gemini',
      generator_model: modelUsed,
      generator_status: {
        gemini_available: true,
        reason: null,
        message: 'Gemini is active for this guidance run.',
        retry_after_ms: 0,
      },
    };
  } catch (error) {
    const retryDelayMs = Number(error?.rateLimitDelayMs || 0);
    if (retryDelayMs > 0) {
      geminiRateLimitedUntil = Date.now() + retryDelayMs;
    }
    const failure = classifyGeminiFailure(error);
    setGeminiFailure(failure.reason, failure.message, retryDelayMs);
    return null;
  }
}
