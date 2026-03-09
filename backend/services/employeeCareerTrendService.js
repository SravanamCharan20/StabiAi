const ROLE_FAMILY_RULES = [
  {
    id: 'engineering',
    match: ['software', 'engineer', 'devops', 'site reliability', 'qa', 'technical lead', 'cloud', 'it'],
  },
  {
    id: 'data_ai',
    match: ['data', 'machine learning', 'ml', 'analytics', 'scientist'],
  },
  {
    id: 'product_management',
    match: ['product', 'project manager', 'program', 'business analyst', 'management'],
  },
  {
    id: 'security_reliability',
    match: ['security', 'cyber', 'soc', 'sre', 'incident'],
  },
  {
    id: 'finance_hr_ops',
    match: ['finance', 'account', 'hr', 'recruit', 'operations', 'customer success', 'sales'],
  },
];

const TREND_LIBRARY = {
  engineering: {
    trending_tech_stacks: [
      { name: 'AI-assisted SDLC (GitHub Copilot, Codeium, Cursor)', why: 'Teams now expect faster delivery with AI-augmented development workflows.' },
      { name: 'Cloud-native platform stack (Kubernetes, Terraform, observability)', why: 'Infra automation and reliability ownership reduce layoff exposure.' },
      { name: 'Backend modernization (FastAPI/Node microservices + event streaming)', why: 'Scalable service ownership is retained in cost-constrained cycles.' },
    ],
    trending_certifications: [
      { name: 'AWS Certified Developer / Solutions Architect', provider: 'AWS', level: 'Associate', why: 'Cloud cost/performance ownership is strongly valued.' },
      { name: 'CKA / CKAD', provider: 'CNCF', level: 'Intermediate', why: 'Kubernetes depth supports platform and reliability tracks.' },
      { name: 'HashiCorp Terraform Associate', provider: 'HashiCorp', level: 'Foundational', why: 'IaC is now baseline in modern engineering teams.' },
    ],
    trending_skills: [
      { name: 'Prompt engineering for developer workflows', why: 'Improves coding velocity and review quality.' },
      { name: 'System design for scale and resilience', why: 'Architecture capability improves role criticality.' },
      { name: 'Cost optimization and production telemetry', why: 'Direct business impact in optimization cycles.' },
    ],
  },
  data_ai: {
    trending_tech_stacks: [
      { name: 'LLM Ops (vector DB + retrieval + evaluation)', why: 'GenAI productization is a top hiring priority.' },
      { name: 'MLOps platform stack (MLflow, feature stores, CI/CD)', why: 'Reliable deployment skills are retained and rewarded.' },
      { name: 'Modern analytics stack (dbt + orchestration + BI)', why: 'Decision pipelines with measurable impact are business-critical.' },
    ],
    trending_certifications: [
      { name: 'Google Professional ML Engineer', provider: 'Google Cloud', level: 'Professional', why: 'Signals production ML depth and governance.' },
      { name: 'Azure AI Engineer Associate', provider: 'Microsoft', level: 'Associate', why: 'Enterprise AI adoption heavily uses Azure.' },
      { name: 'Databricks Data Engineer Associate', provider: 'Databricks', level: 'Associate', why: 'Data platform execution remains a strong demand area.' },
    ],
    trending_skills: [
      { name: 'Model evaluation and guardrails', why: 'Reliability and risk controls are required for GenAI workloads.' },
      { name: 'Experimentation design and causal reasoning', why: 'Business-facing model decisions need stronger validity.' },
      { name: 'Data storytelling for leadership', why: 'Clear outcome narratives improve retention and advancement.' },
    ],
  },
  product_management: {
    trending_tech_stacks: [
      { name: 'Product analytics + experimentation stack', why: 'Outcome-led product decisions are now expected by default.' },
      { name: 'AI feature strategy and roadmap tooling', why: 'AI-first feature planning is expanding across domains.' },
      { name: 'Workflow automation integrations (Zapier/Make/API)', why: 'Operational automation improves team productivity quickly.' },
    ],
    trending_certifications: [
      { name: 'PSPO / CSM', provider: 'Scrum.org / Scrum Alliance', level: 'Foundational', why: 'Execution cadence and ownership remain key.' },
      { name: 'AIPMM AI Product Management', provider: 'AIPMM', level: 'Intermediate', why: 'AI capability framing improves product relevance.' },
      { name: 'Google Data Analytics', provider: 'Google', level: 'Foundational', why: 'Data fluency is required for roadmap prioritization.' },
    ],
    trending_skills: [
      { name: 'KPI-led roadmap prioritization', why: 'Keeps role tied to visible business outcomes.' },
      { name: 'Cross-functional AI delivery', why: 'Improves role defensibility in transformation cycles.' },
      { name: 'Stakeholder influence and narrative', why: 'Higher influence correlates with stronger continuity.' },
    ],
  },
  security_reliability: {
    trending_tech_stacks: [
      { name: 'Cloud security posture management', why: 'Security automation is a durable hiring trend.' },
      { name: 'Detection engineering + SIEM modernization', why: 'Threat detection quality drives retention in security teams.' },
      { name: 'SRE reliability stack (SLO/SLI, incident automation)', why: 'Reliability ownership remains critical in all market regimes.' },
    ],
    trending_certifications: [
      { name: 'CompTIA Security+', provider: 'CompTIA', level: 'Foundational', why: 'Strong baseline for cyber track mobility.' },
      { name: 'Certified Kubernetes Security Specialist (CKS)', provider: 'CNCF', level: 'Intermediate', why: 'Cloud-native security depth is highly demanded.' },
      { name: 'AWS Security Specialty', provider: 'AWS', level: 'Advanced', why: 'Enterprise security hiring strongly values this signal.' },
    ],
    trending_skills: [
      { name: 'Incident response automation', why: 'Reduces mean-time-to-recover and operational risk.' },
      { name: 'Threat hunting and detection tuning', why: 'High impact skill in modern SOC teams.' },
      { name: 'Security architecture communication', why: 'Bridges technical controls with business decisions.' },
    ],
  },
  finance_hr_ops: {
    trending_tech_stacks: [
      { name: 'People/finance analytics stack (SQL + BI + automation)', why: 'Decision support roles are safer than purely manual workflows.' },
      { name: 'Workflow automation (RPA, scripting, low-code)', why: 'Automation capability raises strategic contribution.' },
      { name: 'AI copilots for operations and reporting', why: 'Ops teams are moving to AI-assisted execution.' },
    ],
    trending_certifications: [
      { name: 'Power BI Data Analyst Associate', provider: 'Microsoft', level: 'Associate', why: 'Data-backed operational reporting is in high demand.' },
      { name: 'SHRM-CP / HRCI', provider: 'SHRM / HRCI', level: 'Intermediate', why: 'Signals stronger strategic HR capability.' },
      { name: 'Lean Six Sigma Green Belt', provider: 'ASQ / IASSC', level: 'Intermediate', why: 'Process optimization skills improve retention odds.' },
    ],
    trending_skills: [
      { name: 'Process automation and controls', why: 'Reduces repetitive load and adds measurable value.' },
      { name: 'Data-driven decision reporting', why: 'Improves role defensibility in optimization cycles.' },
      { name: 'Cross-functional business communication', why: 'Strategic visibility supports continuity.' },
    ],
  },
};

const GLOBAL_TRENDS = {
  skills: [
    'AI productivity workflows',
    'Business impact quantification',
    'Automation-first mindset',
  ],
};

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function unique(items, limit = 6) {
  return [...new Set((items || []).filter(Boolean))].slice(0, limit);
}

function guessRoleFamily(jobTitle, department) {
  const context = `${jobTitle || ''} ${department || ''}`.toLowerCase();
  for (const rule of ROLE_FAMILY_RULES) {
    if (rule.match.some((token) => context.includes(token))) {
      return rule.id;
    }
  }
  return 'engineering';
}

function flattenResumeSignals(resumeInsights = {}) {
  const skills = Array.isArray(resumeInsights?.skills) ? resumeInsights.skills : [];
  const certifications = Array.isArray(resumeInsights?.certifications) ? resumeInsights.certifications : [];
  const stackProfile = String(resumeInsights?.declared_stack_profile || '').trim();
  return {
    skillText: normalizeText(`${skills.join(' ')} ${stackProfile}`),
    certText: normalizeText(certifications.join(' ')),
  };
}

const STOP_WORDS = new Set(['and', 'or', 'for', 'the', 'with', 'associate', 'professional', 'certified']);

function buildTokenSet(text = '') {
  return new Set(
    normalizeText(text)
      .split(' ')
      .map((token) => token.trim())
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
  );
}

function hasMeaningfulOverlap(targetName, sourceText) {
  const sourceTokens = buildTokenSet(sourceText);
  if (!sourceTokens.size) {
    return false;
  }

  const targetTokens = [...buildTokenSet(targetName)];
  if (!targetTokens.length) {
    return false;
  }

  const overlap = targetTokens.filter((token) => sourceTokens.has(token)).length;
  if (overlap <= 0) {
    return false;
  }

  const coverage = overlap / targetTokens.length;
  return coverage >= 0.5 || overlap >= 2;
}

function computeGaps(trendingItems = [], sourceText = '') {
  const missing = [];
  for (const item of trendingItems) {
    const name = String(item?.name || '').trim();
    if (!name) {
      continue;
    }
    const hit = hasMeaningfulOverlap(name, sourceText);
    if (!hit) {
      missing.push(name);
    }
  }
  return unique(missing, 4);
}

export function buildCareerTrendGuidance(userData = {}, predictionData = {}) {
  const roleFamily = guessRoleFamily(userData.job_title, userData.department);
  const profile = TREND_LIBRARY[roleFamily] || TREND_LIBRARY.engineering;
  const resumeSignals = flattenResumeSignals(userData?.resume_insights || predictionData?.resume_insights || {});

  const stackText = normalizeText(userData.tech_stack);
  const missingSkills = computeGaps(profile.trending_skills, `${resumeSignals.skillText} ${stackText}`);
  const missingCertifications = computeGaps(profile.trending_certifications, resumeSignals.certText);

  const shiftPath = unique([
    `Move toward ${profile.trending_tech_stacks?.[0]?.name || 'AI/cloud stack'} with one production project in 30-45 days.`,
    missingSkills[0] ? `Add ${missingSkills[0]} with measurable project evidence.` : null,
    missingCertifications[0] ? `Pursue ${missingCertifications[0]} for market credibility.` : null,
    'Publish a monthly impact log showing cost, speed, or quality outcomes tied to new skills.',
  ], 4);

  return {
    role_family: roleFamily,
    trending_tech_stacks: profile.trending_tech_stacks || [],
    trending_certifications: profile.trending_certifications || [],
    trending_skills: profile.trending_skills || [],
    global_priority_skills: GLOBAL_TRENDS.skills,
    skill_gaps: missingSkills,
    certification_gaps: missingCertifications,
    shift_path: shiftPath,
    summary: `For ${String(userData.job_title || 'this role')}, market momentum favors AI-enabled, automation-oriented profiles with measurable business impact.`,
  };
}
