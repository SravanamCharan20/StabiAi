import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildCareerTrendGuidance } from './employeeCareerTrendService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KNOWLEDGE_PATH = path.resolve(__dirname, '../data/employee_rag_knowledge.json');

let knowledgeBase = null;

function loadKnowledgeBase() {
  if (knowledgeBase) {
    return knowledgeBase;
  }

  if (!fs.existsSync(KNOWLEDGE_PATH)) {
    throw new Error(`Employee RAG knowledge file missing at ${KNOWLEDGE_PATH}`);
  }

  knowledgeBase = JSON.parse(fs.readFileSync(KNOWLEDGE_PATH, 'utf-8'));
  return knowledgeBase;
}

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function addTag(tags, value) {
  const normalized = String(value || '').toLowerCase().trim();
  if (!normalized) {
    return;
  }
  tags.push(normalized);
}

function buildQueryContext(userData, predictionData) {
  const prediction = predictionData?.prediction || {};
  const marketSignals = predictionData?.market_signals || {};
  const stackSurvival = predictionData?.stack_survival || {};
  const resumeInsights = userData?.resume_insights || predictionData?.resume_insights || {};
  const trendGuidance = predictionData?.trend_guidance || {};
  const factors = Array.isArray(prediction.top_factors) ? prediction.top_factors : [];

  const tags = [];
  const tokens = [];

  addTag(tags, prediction.layoff_risk);
  addTag(tags, userData.department);
  addTag(tags, userData.job_title);
  addTag(tags, userData.tech_stack);
  addTag(tags, stackSurvival.current_stack_signal);
  addTag(tags, stackSurvival.scope);
  addTag(tags, trendGuidance.role_family);

  if (String(userData.remote_work || '').toLowerCase() === 'yes') {
    tags.push('remote');
  }

  const years = Number(userData.years_at_company || 0);
  const salary = Number(userData.salary_range || 0);
  const performance = Number(userData.performance_rating || 0);

  if (years < 2) {
    tags.push('years_at_company_low', 'new_joiner');
  }

  if (salary >= 2500000 && performance <= 3) {
    tags.push('salary_pressure');
  }

  if (String(userData.reporting_quarter || '').toLowerCase().includes('q4')) {
    tags.push('q4');
  }

  const stress = Number(marketSignals.marketStressScore || 0);
  const marketRegime = String(marketSignals.marketRegime || '').toLowerCase();
  if (stress >= 0.62) {
    tags.push('market_stress', 'recession', 'high');
  } else if (stress >= 0.45) {
    tags.push('recovery', 'medium');
  }
  if (marketRegime) {
    tags.push(marketRegime);
  }

  for (const factor of factors) {
    addTag(tags, factor.feature);
    addTag(tags, factor.label);
    addTag(tags, factor.direction);
    tokens.push(...tokenize(factor.reason));
  }

  tokens.push(...tokenize(userData.job_title));
  tokens.push(...tokenize(userData.tech_stack));
  tokens.push(...tokenize(userData.department));
  tokens.push(...tokenize(stackSurvival.narrative));
  tokens.push(...tokenize(userData.company_name));
  tokens.push(...tokenize(userData.company_location));
  tokens.push(...tokenize((resumeInsights.skills || []).join(' ')));
  tokens.push(...tokenize((resumeInsights.certifications || []).join(' ')));
  tokens.push(...tokenize((trendGuidance.skill_gaps || []).join(' ')));
  tokens.push(...tokenize((trendGuidance.certification_gaps || []).join(' ')));

  return {
    tags: unique(tags),
    tokens: unique(tokens),
    topFactors: factors,
    layoffRisk: String(prediction.layoff_risk || 'Medium'),
    marketSignals,
  };
}

function scoreDocument(doc, query) {
  const docTags = new Set((doc.tags || []).map((tag) => String(tag).toLowerCase()));
  const docTokens = new Set([
    ...tokenize(doc.title),
    ...tokenize(doc.summary),
    ...tokenize((doc.tags || []).join(' ')),
  ]);

  let score = 0;

  for (const tag of query.tags) {
    if (docTags.has(tag)) {
      score += 3.25;
    }
  }

  for (const token of query.tokens) {
    if (docTokens.has(token)) {
      score += 0.65;
    }
  }

  if (docTags.has(String(query.layoffRisk).toLowerCase())) {
    score += 2.2;
  }

  return score;
}

function dedupeByKey(items, keyGetter, limit) {
  const seen = new Set();
  const output = [];

  for (const item of items) {
    const key = keyGetter(item);
    if (seen.has(key)) {
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

function buildFallbackSuggestions(query) {
  const risk = String(query.layoffRisk || 'Medium').toLowerCase();

  if (risk === 'high') {
    return {
      skills: [
        {
          name: 'Business Impact Communication',
          why: 'Visible impact improves retention decisions in high-risk situations.',
          how: 'Track 3 measurable outcomes and share weekly updates with your manager.',
          impact: 'Improves role visibility and retention confidence.',
        },
      ],
      actions: [
        {
          title: '30-Day Risk Reduction Sprint',
          timeline: '1 month',
          steps: [
            'Deliver one high-impact result with measurable value',
            'Build a written impact summary',
            'Review risk-reduction plan with your manager',
          ],
          indicators: 'One measurable win and improved management feedback.',
        },
      ],
      opportunities: [
        {
          title: 'Internal Mobility Track',
          timeline: '2-4 months',
          requirements: 'Adjacent skills and cross-team networking',
          impact: 'Reduces dependence on a single team during restructuring.',
        },
      ],
    };
  }

  if (risk === 'low') {
    return {
      skills: [
        {
          name: 'Leadership Mentoring',
          why: 'Low-risk profiles can convert stability into leadership growth.',
          how: 'Mentor one teammate and document team-level outcomes.',
          impact: 'Builds promotion readiness while preserving stability.',
        },
      ],
      actions: [
        {
          title: 'Quarterly Growth Plan',
          timeline: '2-3 months',
          steps: [
            'Set one stretch goal and one stability goal',
            'Lead one cross-team initiative',
            'Present outcomes in quarterly review',
          ],
          indicators: 'Expanded role scope with sustained performance.',
        },
      ],
      opportunities: [
        {
          title: 'Leadership Pipeline Program',
          timeline: '6-12 months',
          requirements: 'Consistent delivery and mentoring practice',
          impact: 'Accelerates progression to strategic internal roles.',
        },
      ],
    };
  }

  return {
    skills: [
      {
        name: 'Adjacent Skill Stacking',
        why: 'Medium-risk profiles improve resilience with transferable capabilities.',
        how: 'Add one adjacent technical or business skill each quarter.',
        impact: 'Improves internal mobility and reduces role concentration risk.',
      },
    ],
    actions: [
      {
        title: '90-Day Stability Plan',
        timeline: '1-3 months',
        steps: [
          'Prioritize high-visibility deliverables',
          'Track measurable outcomes weekly',
          'Align development goals with manager expectations',
        ],
        indicators: 'Higher visibility and measurable role contribution.',
      },
    ],
    opportunities: [
      {
        title: 'Cross-Functional Rotation',
        timeline: '3-6 months',
        requirements: 'Transferable skills and manager sponsorship',
        impact: 'Improves long-term stability through broader capability coverage.',
      },
    ],
  };
}

export function generateRagSuggestions(userData, predictionData) {
  const knowledge = loadKnowledgeBase();
  const query = buildQueryContext(userData, predictionData);
  const trendGuidance = predictionData?.trend_guidance || buildCareerTrendGuidance(userData, predictionData);

  const ranked = knowledge
    .map((doc) => ({
      doc,
      score: scoreDocument(doc, query),
    }))
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 0)
    .slice(0, 4);

  let skills = [];
  let actions = [];
  let opportunities = [];

  for (const item of ranked) {
    const doc = item.doc;
    skills.push(...(doc.skills || []));
    actions.push(...(doc.actions || []));
    opportunities.push(...(doc.opportunities || []));
  }

  if (skills.length === 0 && actions.length === 0 && opportunities.length === 0) {
    const fallback = buildFallbackSuggestions(query);
    skills = fallback.skills;
    actions = fallback.actions;
    opportunities = fallback.opportunities;
  }

  skills = dedupeByKey(skills, (item) => String(item.name || '').toLowerCase(), 4);
  actions = dedupeByKey(actions, (item) => String(item.title || '').toLowerCase(), 4);
  opportunities = dedupeByKey(opportunities, (item) => String(item.title || '').toLowerCase(), 3);

  const prediction = predictionData?.prediction || {};
  const topFactors = Array.isArray(prediction.top_factors) ? prediction.top_factors.slice(0, 4) : [];

  const insights = {
    why_this_prediction: topFactors.map((factor) => ({
      factor: factor.label || factor.feature,
      direction: factor.direction,
      reason: factor.reason,
    })),
    model_improvement_tips: Array.isArray(prediction.improvement_tips) ? prediction.improvement_tips.slice(0, 3) : [],
    market_context: {
      marketRegime: query.marketSignals?.marketRegime || null,
      marketStressScore: Number.isFinite(Number(query.marketSignals?.marketStressScore))
        ? Number(query.marketSignals.marketStressScore)
        : null,
    },
    retrieved_contexts: ranked.map((item) => ({
      id: item.doc.id,
      title: item.doc.title,
      relevance_score: Number(item.score.toFixed(3)),
    })),
    trend_focus: trendGuidance?.summary || null,
  };

  return {
    skills,
    actions,
    opportunities,
    trends: trendGuidance,
    insights,
  };
}
