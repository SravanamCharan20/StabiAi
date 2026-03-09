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

const ENGINEERING_SPECIALIZATIONS = [
  {
    id: 'frontend',
    match: ['frontend', 'react', 'angular', 'vue', 'javascript', 'typescript', 'ui', 'ux', 'next.js', 'nextjs'],
    profile: {
      trending_tech_stacks: [
        { name: 'Frontend AI workflows (Copilot + testing + accessibility)', why: 'Teams expect faster release cycles with higher UI quality.' },
        { name: 'Modern web stack (React/Next.js + TypeScript + observability)', why: 'Type-safe and measurable frontend delivery is more resilient.' },
        { name: 'Performance-first frontend (Core Web Vitals + edge caching)', why: 'User experience metrics are increasingly tied to business outcomes.' },
      ],
      trending_certifications: [
        { name: 'Meta Front-End Developer Professional Certificate', provider: 'Meta', level: 'Foundational', why: 'Signals structured frontend depth and project readiness.' },
        { name: 'JavaScript Algorithms and Data Structures', provider: 'freeCodeCamp', level: 'Foundational', why: 'Strengthens core frontend engineering fundamentals.' },
        { name: 'Google UX Design Certificate', provider: 'Google', level: 'Foundational', why: 'Improves UX collaboration and product impact delivery.' },
      ],
      trending_skills: [
        { name: 'Frontend performance optimization', why: 'Directly improves conversion and engagement metrics.' },
        { name: 'Component test automation', why: 'Reliable releases reduce production risk and rework.' },
        { name: 'Accessibility engineering', why: 'Compliance and inclusivity are now baseline expectations.' },
      ],
    },
  },
  {
    id: 'backend',
    match: ['backend', 'node', 'express', 'java', 'spring', 'api', 'microservice', 'server', 'golang', 'go'],
    profile: {
      trending_tech_stacks: [
        { name: 'API platform stack (Node/Java + async jobs + tracing)', why: 'Reliable service ownership remains a strong retention signal.' },
        { name: 'Event-driven backend (queues, streaming, idempotency)', why: 'Scalable backend architecture is harder to replace.' },
        { name: 'Secure backend delivery (authz, rate-limits, observability)', why: 'Security-aware systems work has durable demand.' },
      ],
      trending_certifications: [
        { name: 'AWS Certified Developer - Associate', provider: 'AWS', level: 'Associate', why: 'Cloud-native backend delivery is strongly valued.' },
        { name: 'Microsoft Azure Developer Associate', provider: 'Microsoft', level: 'Associate', why: 'Enterprise backend delivery often relies on Azure services.' },
        { name: 'Oracle Java SE Developer', provider: 'Oracle', level: 'Intermediate', why: 'Validates strong Java backend fundamentals for service teams.' },
      ],
      trending_skills: [
        { name: 'Distributed system design', why: 'Improves backend criticality and ownership scope.' },
        { name: 'Production observability and incident analysis', why: 'Shortens recovery time and improves service reliability.' },
        { name: 'Database performance tuning', why: 'Directly affects latency, cost, and user experience.' },
      ],
    },
  },
  {
    id: 'devops_platform',
    match: ['devops', 'sre', 'kubernetes', 'docker', 'terraform', 'platform', 'infra', 'cloud', 'ci cd', 'prometheus', 'grafana'],
    profile: {
      trending_tech_stacks: [
        { name: 'Cloud platform engineering (Kubernetes + IaC + observability)', why: 'Platform ownership remains resilient in cost-control cycles.' },
        { name: 'Reliability automation (SLO/SLI + incident automation)', why: 'Reliability work directly protects business continuity.' },
        { name: 'FinOps-oriented infrastructure management', why: 'Cloud cost governance is now a critical business requirement.' },
      ],
      trending_certifications: [
        { name: 'Certified Kubernetes Administrator (CKA)', provider: 'CNCF', level: 'Intermediate', why: 'Signals operational depth in cloud-native environments.' },
        { name: 'HashiCorp Terraform Associate', provider: 'HashiCorp', level: 'Foundational', why: 'IaC competency is baseline for modern platform teams.' },
        { name: 'AWS Certified DevOps Engineer - Professional', provider: 'AWS', level: 'Advanced', why: 'Shows strong production cloud operations capability.' },
      ],
      trending_skills: [
        { name: 'SRE incident automation', why: 'Improves uptime and reduces operational fatigue.' },
        { name: 'Infrastructure cost optimization', why: 'Demonstrates measurable financial impact for the business.' },
        { name: 'Release pipeline hardening', why: 'Faster and safer releases improve organizational agility.' },
      ],
    },
  },
  {
    id: 'qa_automation',
    match: ['qa', 'quality', 'test', 'selenium', 'playwright', 'cypress', 'automation testing'],
    profile: {
      trending_tech_stacks: [
        { name: 'Shift-left QA automation (API/UI/perf + CI)', why: 'Automation-led QA teams are favored over manual-only workflows.' },
        { name: 'AI-assisted test generation and maintenance', why: 'AI tooling significantly increases QA throughput.' },
        { name: 'Reliability test engineering (chaos + resilience tests)', why: 'Reliability testing supports critical production quality goals.' },
      ],
      trending_certifications: [
        { name: 'ISTQB Certified Tester Foundation Level', provider: 'ISTQB', level: 'Foundational', why: 'Widely recognized baseline for structured QA competency.' },
        { name: 'ISTQB Test Automation Engineer', provider: 'ISTQB', level: 'Intermediate', why: 'Signals deeper capability in automation strategy and tooling.' },
        { name: 'Certified Agile Tester', provider: 'ICAgile', level: 'Intermediate', why: 'Agile testing capability improves fit in modern product teams.' },
      ],
      trending_skills: [
        { name: 'Test automation architecture', why: 'Scalable automation frameworks improve release confidence.' },
        { name: 'Quality metrics and release analytics', why: 'Data-backed QA insights improve decision-making.' },
        { name: 'API and integration testing', why: 'Catches high-impact failures earlier in delivery cycles.' },
      ],
    },
  },
];

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

function pickEngineeringProfile(sourceText) {
  const normalizedSource = normalizeText(sourceText);
  let best = null;

  for (const candidate of ENGINEERING_SPECIALIZATIONS) {
    const score = candidate.match.reduce((acc, token) => (
      normalizedSource.includes(normalizeText(token)) ? acc + 1 : acc
    ), 0);
    if (!best || score > best.score) {
      best = { candidate, score };
    }
  }

  return best && best.score > 0 ? best.candidate : null;
}

function rankTrendItems(items = [], sourceText = '', limit = 3) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) {
    return [];
  }
  const sourceTokens = buildTokenSet(sourceText);

  const ranked = list
    .map((item) => {
      const name = String(item?.name || '').trim();
      const why = String(item?.why || '').trim();
      const label = `${name} ${why}`.trim();
      const isRelevant = hasMeaningfulOverlap(label, sourceText);
      const baseScore = isRelevant ? 2 : 0;
      const tokenOverlap = [...buildTokenSet(label)].filter((token) => sourceTokens.has(token)).length;
      return {
        item,
        score: baseScore + tokenOverlap,
      };
    })
    .sort((a, b) => b.score - a.score);

  const relevant = ranked.filter((entry) => entry.score > 0).map((entry) => entry.item);
  if (relevant.length >= 2) {
    return relevant.slice(0, limit);
  }

  const fallback = ranked.map((entry) => entry.item);
  return fallback.slice(0, limit);
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
  const resumeSignals = flattenResumeSignals(userData?.resume_insights || predictionData?.resume_insights || {});
  const combinedSignalText = normalizeText([
    userData?.job_title,
    userData?.department,
    userData?.tech_stack,
    userData?.stack_profile,
    userData?.skill_tags,
    userData?.certifications,
    resumeSignals.skillText,
    resumeSignals.certText,
  ].filter(Boolean).join(' '));

  let profile = TREND_LIBRARY[roleFamily] || TREND_LIBRARY.engineering;
  const engineeringProfile = roleFamily === 'engineering'
    ? pickEngineeringProfile(combinedSignalText)
    : null;
  if (engineeringProfile?.profile) {
    profile = engineeringProfile.profile;
  }

  const stackText = normalizeText(userData.tech_stack);
  const rankedTechStacks = rankTrendItems(
    profile.trending_tech_stacks,
    `${resumeSignals.skillText} ${stackText} ${combinedSignalText}`,
    3
  );
  const rankedSkills = rankTrendItems(
    profile.trending_skills,
    `${resumeSignals.skillText} ${stackText} ${combinedSignalText}`,
    3
  );
  const rankedCertifications = rankTrendItems(
    profile.trending_certifications,
    `${resumeSignals.certText} ${resumeSignals.skillText} ${combinedSignalText}`,
    3
  );

  const missingSkills = computeGaps(rankedSkills, `${resumeSignals.skillText} ${stackText} ${combinedSignalText}`);
  const missingCertifications = computeGaps(
    rankedCertifications,
    `${resumeSignals.certText} ${resumeSignals.skillText} ${combinedSignalText}`
  );

  const shiftPath = unique([
    `Move toward ${rankedTechStacks?.[0]?.name || 'AI/cloud stack'} with one production project in 30-45 days.`,
    missingSkills[0] ? `Add ${missingSkills[0]} with measurable project evidence.` : null,
    missingCertifications[0] ? `Pursue ${missingCertifications[0]} for market credibility.` : null,
    'Publish a monthly impact log showing cost, speed, or quality outcomes tied to new skills.',
  ], 4);

  return {
    role_family: roleFamily,
    role_track: engineeringProfile?.id || roleFamily,
    trending_tech_stacks: rankedTechStacks,
    trending_certifications: rankedCertifications,
    trending_skills: rankedSkills,
    global_priority_skills: GLOBAL_TRENDS.skills,
    skill_gaps: missingSkills,
    certification_gaps: missingCertifications,
    shift_path: shiftPath,
    summary: `For ${String(userData.job_title || 'this role')}, market momentum favors AI-enabled, automation-oriented profiles with measurable business impact.`,
  };
}
