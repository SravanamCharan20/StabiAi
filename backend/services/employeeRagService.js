import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildCareerTrendGuidance } from './employeeCareerTrendService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KNOWLEDGE_PATH = path.resolve(__dirname, '../data/employee_rag_knowledge.json');

let knowledgeBase = null;

const RAG_STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'your', 'you', 'are', 'into', 'over',
  'using', 'use', 'build', 'improve', 'team', 'role', 'market', 'risk', 'high', 'medium', 'low',
  'weeks', 'months', 'quarter', 'project', 'delivery', 'impact', 'current', 'future',
  'first', 'during', 'all', 'across',
  'engineering', 'software', 'developer', 'analyst', 'management', 'manager', 'business',
  'operations', 'technology', 'technical',
]);

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
    .filter((token) => token.length > 2 && !RAG_STOP_WORDS.has(token));
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

function buildGapDrivenBoosters(trendGuidance = {}, resumeInsights = {}) {
  const certGaps = Array.isArray(trendGuidance?.certification_gaps)
    ? trendGuidance.certification_gaps.slice(0, 2)
    : [];
  const skillGaps = Array.isArray(trendGuidance?.skill_gaps)
    ? trendGuidance.skill_gaps.slice(0, 2)
    : [];
  const trendingSkills = Array.isArray(trendGuidance?.trending_skills)
    ? trendGuidance.trending_skills.slice(0, 2)
    : [];
  const shiftPath = Array.isArray(trendGuidance?.shift_path)
    ? trendGuidance.shift_path.filter(Boolean).slice(0, 2)
    : [];
  const trendingStacks = Array.isArray(trendGuidance?.trending_tech_stacks)
    ? trendGuidance.trending_tech_stacks.slice(0, 2)
    : [];
  const certifications = Array.isArray(resumeInsights?.certifications) ? resumeInsights.certifications : [];

  const skills = [];
  const actions = [];
  const opportunities = [];

  if (certGaps.length > 0) {
    const target = certGaps[0];
    skills.push({
      name: `Certification alignment: ${target}`,
      why: 'Certification signals improve credibility in screenings and internal role transitions.',
      how: `Plan exam prep and project evidence for ${target} in a 6-10 week sprint.`,
      impact: 'Stronger market-fit signal for role continuity and mobility.',
    });
    actions.push({
      title: `Earn ${target}`,
      timeline: '6-10 weeks',
      steps: [
        'Map exam blueprint to current role tasks',
        'Complete one practical project aligned to certification topics',
        'Schedule exam and document outcomes in your impact log',
      ],
      indicators: 'Certification completed plus one production-relevant project artifact.',
    });
  }

  if (skillGaps.length > 0) {
    const target = skillGaps[0];
    skills.push({
      name: `Gap-closure skill: ${target}`,
      why: 'Closing high-demand skill gaps reduces restructuring exposure.',
      how: 'Build one measurable deliverable using this skill in your current team context.',
      impact: 'Improves role defensibility and adjacent-role readiness.',
    });
    actions.push({
      title: `Ship one artifact using ${target}`,
      timeline: '4-8 weeks',
      steps: [
        'Define one role-relevant problem where this skill improves outcomes',
        'Deliver a measurable artifact and document before/after metrics',
        'Share outcome summary with manager and team stakeholders',
      ],
      indicators: `One production-relevant result delivered using ${target} with measurable impact.`,
    });
  }
  if (skillGaps.length === 0 && trendingSkills.length > 0) {
    const aligned = String(trendingSkills[0]?.name || '').trim();
    const alignedWhy = String(trendingSkills[0]?.why || '').trim();
    if (aligned) {
      skills.push({
        name: `Role-aligned skill: ${aligned}`,
        why: alignedWhy || 'Strengthens resilience in your current role track.',
        how: `Apply ${aligned} in one role-relevant deliverable this month.`,
        impact: 'Improves role continuity through visible capability depth.',
      });
      actions.push({
        title: `Apply ${aligned} in current workflow`,
        timeline: '3-6 weeks',
        steps: [
          `Select one current task where ${aligned} improves speed, quality, or reliability`,
          'Implement and share before/after evidence with stakeholders',
        ],
        indicators: `${aligned} demonstrated in a measurable role-relevant outcome.`,
      });
    }
  }

  if (certifications.length > 0) {
    opportunities.push({
      title: 'Leverage existing certifications for internal mobility',
      timeline: '1-2 months',
      requirements: 'Update profile with certified outcomes tied to business metrics.',
      impact: 'Increases visibility for higher-demand internal opportunities.',
    });
  }

  if (shiftPath.length > 0) {
    actions.push({
      title: 'Execute stack shift milestone',
      timeline: '6-12 weeks',
      steps: [
        shiftPath[0],
        shiftPath[1] || 'Deliver one measurable business outcome using the upgraded stack path.',
      ],
      indicators: 'Documented capability shift with manager-validated business value.',
    });
  }

  if (trendingStacks.length > 0) {
    const targetStack = String(trendingStacks[0]?.name || '').trim();
    if (targetStack) {
      opportunities.push({
        title: `Transition toward ${targetStack}`,
        timeline: '2-5 months',
        requirements: 'One role-aligned project and measurable output quality/cost improvements',
        impact: 'Improves survivability by aligning profile to higher-demand capability clusters.',
      });
    }
  }

  if (skills.length < 2 && trendingSkills.length > 0) {
    for (const item of trendingSkills) {
      const candidate = String(item?.name || '').trim();
      const why = String(item?.why || '').trim();
      if (!candidate) {
        continue;
      }
      const exists = skills.some((skill) => String(skill?.name || '').toLowerCase().includes(candidate.toLowerCase()));
      if (exists) {
        continue;
      }
      skills.push({
        name: `Role-aligned skill: ${candidate}`,
        why: why || 'Strengthens resilience in the current role track.',
        how: `Practice ${candidate} through one measurable deliverable in the next sprint.`,
        impact: 'Improves role defensibility through current-market capability alignment.',
      });
      actions.push({
        title: `Demonstrate ${candidate} impact`,
        timeline: '4-8 weeks',
        steps: [
          `Identify one task where ${candidate} can improve outcomes`,
          'Implement and report measurable before/after evidence',
        ],
        indicators: `${candidate} applied with measurable business or delivery impact.`,
      });
      if (skills.length >= 2) {
        break;
      }
    }
  }

  return { skills, actions, opportunities };
}

function ensureCertificationMentions(skills, actions, trendGuidance = {}) {
  const certGaps = Array.isArray(trendGuidance?.certification_gaps)
    ? trendGuidance.certification_gaps.filter(Boolean)
    : [];
  if (!certGaps.length) {
    return { skills, actions };
  }

  const target = String(certGaps[0] || '').trim();
  if (!target) {
    return { skills, actions };
  }
  const targetLower = target.toLowerCase();

  const hasCertSkill = skills.some((item) => (
    String(item?.name || '').toLowerCase().includes('certif')
    || String(item?.name || '').toLowerCase().includes(targetLower)
    || String(item?.why || '').toLowerCase().includes(targetLower)
  ));
  const hasCertAction = actions.some((item) => (
    String(item?.title || '').toLowerCase().includes('certif')
    || String(item?.title || '').toLowerCase().includes(targetLower)
    || String(item?.indicators || '').toLowerCase().includes(targetLower)
  ));

  const nextSkills = [...skills];
  const nextActions = [...actions];

  if (!hasCertSkill) {
    nextSkills.unshift({
      name: `Certification alignment: ${target}`,
      why: 'Certification proof improves role defensibility and internal mobility signals.',
      how: `Prepare for ${target} with one applied project and weekly progress checkpoints.`,
      impact: 'Improves screening confidence for resilient roles.',
    });
  }

  if (!hasCertAction) {
    nextActions.unshift({
      title: `Certification sprint for ${target}`,
      timeline: '6-10 weeks',
      steps: [
        'Map certification syllabus to your current project scope',
        'Build one artifact demonstrating applied competency',
        'Attempt exam and log measurable impact outcomes',
      ],
      indicators: 'Certification achieved with project-backed evidence.',
    });
  }

  return {
    skills: nextSkills.slice(0, 4),
    actions: nextActions.slice(0, 4),
  };
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
  const resumeInsights = userData?.resume_insights || predictionData?.resume_insights || {};

  const ranked = knowledge
    .map((doc) => ({
      doc,
      score: scoreDocument(doc, query),
    }))
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 0)
    .slice(0, 4);

  const trendTokens = new Set(tokenize([
    userData?.job_title,
    userData?.department,
    userData?.tech_stack,
    userData?.stack_profile,
    userData?.skill_tags,
    trendGuidance?.role_family,
    trendGuidance?.role_track,
    ...(trendGuidance?.skill_gaps || []),
    ...(trendGuidance?.certification_gaps || []),
    ...((trendGuidance?.trending_skills || []).map((item) => item?.name || item)),
    ...((trendGuidance?.trending_tech_stacks || []).map((item) => item?.name || item)),
  ].filter(Boolean).join(' ')));

  const rankedAligned = ranked.filter(({ doc }) => {
    const docTokens = new Set(tokenize([
      doc?.title,
      doc?.summary,
      ...(doc?.tags || []),
    ].filter(Boolean).join(' ')));
    const overlap = [...trendTokens].filter((token) => docTokens.has(token)).length;
    return overlap >= 2;
  });

  let skills = [];
  let actions = [];
  let opportunities = [];

  for (const item of rankedAligned) {
    const doc = item.doc;
    skills.push(...(doc.skills || []));
    actions.push(...(doc.actions || []));
    opportunities.push(...(doc.opportunities || []));
  }

  const boosters = buildGapDrivenBoosters(trendGuidance, resumeInsights);
  const shouldBlendKnowledge = boosters.skills.length < 2
    || boosters.actions.length < 2
    || boosters.opportunities.length < 1;
  if (shouldBlendKnowledge) {
    skills = [...boosters.skills, ...skills];
    actions = [...boosters.actions, ...actions];
    opportunities = [...boosters.opportunities, ...opportunities];
  } else {
    skills = [...boosters.skills];
    actions = [...boosters.actions];
    opportunities = [...boosters.opportunities];
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
