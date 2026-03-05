import axios from 'axios';
import { jsonrepair } from 'jsonrepair';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODELS_LIST_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_TIMEOUT_MS = 24000;
const MODEL_DISCOVERY_TTL_MS = 6 * 60 * 60 * 1000;
const DEFAULT_RATE_LIMIT_COOLDOWN_MS = 15000;
const MODEL_FALLBACKS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];
const modelCatalogCache = {
  fetchedAt: 0,
  names: null,
};
let geminiRateLimitedUntil = 0;

const SUGGESTIONS_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    skills: {
      type: 'ARRAY',
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
    insights: {
      type: 'OBJECT',
      properties: {
        why_this_prediction: {
          type: 'ARRAY',
          items: { type: 'STRING' },
        },
        model_improvement_tips: {
          type: 'ARRAY',
          items: { type: 'STRING' },
        },
        market_context: { type: 'OBJECT' },
        retrieved_contexts: {
          type: 'ARRAY',
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
    .replace(/"\s*\n\s*"/g, '",\n"')
    .replace(/"\s*\n\s*{/g, '",\n{')
    .replace(/}\s*\n\s*"/g, '},\n"')
    // trailing commas in arrays/objects
    .replace(/,\s*([}\]])/g, '$1')
    .trim();
}

function safeParseJsonObject(text) {
  const envelope = extractObjectEnvelope(text);
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

  if (resolved.length > 0) {
    return [...new Set(resolved)];
  }

  const flashFirst = catalog
    .filter((name) => /gemini-[\w.-]*flash/i.test(name))
    .slice(0, 4);

  return flashFirst.length > 0 ? flashFirst : desiredCandidates;
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

  for (const model of candidateModels) {
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

      const text = response?.data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n') || '';
      if (!text.trim()) {
        errors.push(`${model}: empty content`);
        continue;
      }

      return { text, model };
    } catch (error) {
      const status = Number(error?.response?.status || 0) || 'NA';
      const message = error?.response?.data?.error?.message || error.message;
      if (status === 429) {
        retryDelayMs = Math.max(retryDelayMs, parseRetryDelayMs(message));
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
      maxOutputTokens: 3000,
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

function normalizeSuggestionsShape(payload, fallback) {
  const safe = payload && typeof payload === 'object' ? payload : {};
  const skills = Array.isArray(safe.skills) ? safe.skills : fallback.skills;
  const actions = Array.isArray(safe.actions) ? safe.actions : fallback.actions;
  const opportunities = Array.isArray(safe.opportunities) ? safe.opportunities : fallback.opportunities;
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

  return {
    skills: normalizedSkills.length > 0 ? normalizedSkills : fallbackSkills,
    actions: normalizedActions.length > 0 ? normalizedActions : fallbackActions,
    opportunities: normalizedOpportunities.length > 0 ? normalizedOpportunities : fallbackOpportunities,
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
  };
}

function buildPrompt(userData, predictionData, ragSuggestions) {
  const compactRag = compactSuggestionContext(ragSuggestions);
  const compactPrediction = {
    layoff_risk: predictionData?.prediction?.layoff_risk,
    confidence: predictionData?.prediction?.confidence,
    probabilities: predictionData?.prediction?.probabilities,
    top_factors: predictionData?.prediction?.top_factors,
    improvement_tips: predictionData?.prediction?.improvement_tips,
    reliability: predictionData?.reliability,
    market_signals: predictionData?.market_signals,
  };

  return [
    'You are a senior career-risk advisor for Indian tech and services employees.',
    'Goal: produce highly personalized and practical guidance from model outputs and market signals.',
    '',
    'Return ONLY a valid JSON object with this exact shape:',
    '{',
    '  "skills": [{"name":"", "why":"", "how":"", "impact":""}],',
    '  "actions": [{"title":"", "timeline":"", "steps":[""], "indicators":""}],',
    '  "opportunities": [{"title":"", "timeline":"", "requirements":"", "impact":""}],',
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
    '- Keep 3 to 4 items per section when possible.',
    '- Keep each text field short and direct (1-2 sentences).',
    '- Keep each string under 180 characters.',
    '- Keep each steps array to 2-4 short bullets.',
    '- Return compact JSON (no pretty-print indentation).',
    '- Use strict JSON only (double quotes, no comments, no trailing commas).',
    '',
    `employee_data: ${JSON.stringify(userData)}`,
    `prediction_context: ${JSON.stringify(compactPrediction)}`,
    `baseline_rag_suggestions: ${JSON.stringify(compactRag)}`,
  ].join('\n');
}

export async function generateGeminiCustomizedSuggestions(userData, predictionData, ragSuggestions) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (Date.now() < geminiRateLimitedUntil) {
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
          temperature: 0.35,
          topP: 0.9,
          maxOutputTokens: 3000,
          responseMimeType: 'application/json',
          responseSchema: SUGGESTIONS_RESPONSE_SCHEMA,
        },
      });
      text = response.text;
      modelUsed = response.model;
    } catch (schemaError) {
      const response = await callGeminiText({
        apiKey,
        models,
        prompt,
        generationConfig: {
          temperature: 0.35,
          topP: 0.9,
          maxOutputTokens: 3000,
          responseMimeType: 'application/json',
        },
      });
      text = response.text;
      modelUsed = response.model;
    }

    if (!text.trim()) {
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
            'Keep each section to at most 4 items.',
            'No markdown, no prose, no explanation.',
          ].join('\n'),
          generationConfig: {
            temperature: 0,
            topP: 0.8,
            maxOutputTokens: 3000,
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

    return {
      ...normalized,
      generator: 'gemini',
      generator_model: modelUsed,
    };
  } catch (error) {
    const retryDelayMs = Number(error?.rateLimitDelayMs || 0);
    if (retryDelayMs > 0) {
      geminiRateLimitedUntil = Date.now() + retryDelayMs;
    }
    return null;
  }
}
