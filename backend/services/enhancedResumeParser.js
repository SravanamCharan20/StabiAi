import path from 'path';
import { createRequire } from 'module';
import mammoth from 'mammoth';
import { resolveTechStackForModel } from './employeeSignalFusionService.js';
const require = createRequire(import.meta.url);

// Import pdf-parse
let pdfParseModule = null;
try {
  pdfParseModule = require('pdf-parse');
} catch (err) {
  console.warn('pdf-parse not available:', err.message);
}

// Enhanced skill taxonomy with market relevance
const SKILL_TAXONOMY = {
  'python': { category: 'programming', demand: 95, trending: true, alternatives: [] },
  'java': { category: 'programming', demand: 75, trending: false, alternatives: ['kotlin', 'go'] },
  'javascript': { category: 'programming', demand: 90, trending: true, alternatives: [] },
  'typescript': { category: 'programming', demand: 92, trending: true, alternatives: [] },
  'react': { category: 'frontend', demand: 93, trending: true, alternatives: [] },
  'angular': { category: 'frontend', demand: 60, trending: false, alternatives: ['react', 'vue'] },
  'vue': { category: 'frontend', demand: 70, trending: true, alternatives: [] },
  'node': { category: 'backend', demand: 88, trending: true, alternatives: [] },
  'spring boot': { category: 'backend', demand: 72, trending: false, alternatives: ['fastapi', 'express'] },
  'kubernetes': { category: 'devops', demand: 96, trending: true, alternatives: [] },
  'docker': { category: 'devops', demand: 94, trending: true, alternatives: [] },
  'terraform': { category: 'devops', demand: 91, trending: true, alternatives: [] },
  'aws': { category: 'cloud', demand: 97, trending: true, alternatives: [] },
  'azure': { category: 'cloud', demand: 85, trending: true, alternatives: [] },
  'gcp': { category: 'cloud', demand: 80, trending: true, alternatives: [] },
  'llm': { category: 'ai', demand: 98, trending: true, alternatives: [] },
  'mlops': { category: 'ai', demand: 94, trending: true, alternatives: [] },
  'pytorch': { category: 'ai', demand: 90, trending: true, alternatives: [] },
  'tensorflow': { category: 'ai', demand: 85, trending: true, alternatives: [] },
  'sql': { category: 'database', demand: 88, trending: true, alternatives: [] },
  'mongodb': { category: 'database', demand: 75, trending: true, alternatives: [] },
  'postgresql': { category: 'database', demand: 82, trending: true, alternatives: [] },
  'selenium': { category: 'testing', demand: 65, trending: false, alternatives: ['playwright', 'cypress'] },
  'playwright': { category: 'testing', demand: 88, trending: true, alternatives: [] },
  'cypress': { category: 'testing', demand: 82, trending: true, alternatives: [] },
  'jenkins': { category: 'ci/cd', demand: 70, trending: false, alternatives: ['github actions', 'gitlab ci'] },
  'github actions': { category: 'ci/cd', demand: 90, trending: true, alternatives: [] },
  'power bi': { category: 'analytics', demand: 78, trending: true, alternatives: [] },
  'tableau': { category: 'analytics', demand: 75, trending: true, alternatives: [] },
};

// Certification value scoring
const CERTIFICATION_VALUE = {
  'aws certified solutions architect': 95,
  'aws certified developer': 90,
  'azure administrator': 85,
  'gcp professional': 88,
  'cka': 92,
  'ckad': 90,
  'cks': 93,
  'terraform associate': 87,
  'pmp': 75,
  'scrum master': 70,
  'databricks': 89,
  'cissp': 88,
  'ceh': 82,
};

const MONTH_LOOKUP = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s+#.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function optionCandidates(options = []) {
  return options
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .map((value) => ({
      value,
      norm: normalizeText(value),
      tokens: normalizeText(value).split(' ').filter(Boolean),
    }));
}

function matchBestOption(text, options = [], threshold = 0.42) {
  const normalized = normalizeText(text);
  if (!normalized || !options.length) {
    return '';
  }

  const sourceTokens = new Set(normalized.split(' ').filter(Boolean));
  let best = { value: '', score: 0 };

  for (const candidate of optionCandidates(options)) {
    if (normalized.includes(candidate.norm)) {
      return candidate.value;
    }

    const overlap = candidate.tokens.filter((token) => sourceTokens.has(token)).length;
    const score = overlap / Math.max(candidate.tokens.length, 1);
    if (score > best.score) {
      best = { value: candidate.value, score };
    }
  }

  return best.score >= threshold ? best.value : '';
}

function findExactOption(value, options = []) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return '';
  }
  return options.find((item) => normalizeText(item) === normalized) || '';
}

function findExistingOption(preferred, options = []) {
  const exact = findExactOption(preferred, options);
  return exact || '';
}

function extractCandidateName(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 10);

  for (const line of lines) {
    if (line.length < 3 || line.length > 45) {
      continue;
    }
    if (/@|\d/.test(line)) {
      continue;
    }
    if (/(resume|curriculum|vitae|profile|summary)/i.test(line)) {
      continue;
    }
    if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/.test(line)) {
      return line;
    }
  }
  return null;
}

function extractWorkExperienceSection(text) {
  const source = String(text || '');
  const match = source.match(
    /(?:^|\n)(?:work experience|experience|employment|professional experience)[\s:]*\n([^]*?)(?:\n(?:projects?|education|skills|certifications|achievements|summary)\b|$)/i
  );
  return (match?.[1] || source).trim();
}

function extractTechnologySignals(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const signals = [];
  for (const line of lines) {
    if (/^(technologies?|tech stack|stack|skills?)\s*[:\-]/i.test(line)) {
      signals.push(line.replace(/^(technologies?|tech stack|stack|skills?)\s*[:\-]\s*/i, '').trim());
      continue;
    }

    if (line.length <= 180
      && /[,|+]/.test(line)
      && /(react|node|next|express|python|java|docker|kubernetes|aws|azure|gcp|sql|mongodb|llm|mlops|terraform|pytorch|tensorflow)/i.test(line)) {
      signals.push(line);
    }
  }

  return signals.join(', ');
}

function pickJobTitleByRules(signalText, jobTitleOptions = []) {
  const signal = normalizeText(signalText);
  const pick = (name) => findExistingOption(name, jobTitleOptions);

  const rules = [
    { option: pick('Machine Learning Engineer'), pattern: /\b(machine learning|ml engineer|ai engineer|deep learning|model training|pytorch|tensorflow)\b/ },
    { option: pick('Data Scientist'), pattern: /\b(data scientist|predictive model|statistical modeling)\b/ },
    { option: pick('Data Analyst'), pattern: /\b(data analyst|analytics dashboard|power bi|tableau|sql reporting)\b/ },
    { option: pick('DevOps Engineer'), pattern: /\b(devops|dev ops|infrastructure as code|platform engineer|ci cd)\b/ },
    { option: pick('Site Reliability Engineer'), pattern: /\b(site reliability|sre|reliability engineer)\b/ },
    { option: pick('Cloud Engineer'), pattern: /\b(cloud engineer|cloud platform|cloud operations)\b/ },
    { option: pick('Solution Architect'), pattern: /\b(solution architect|enterprise architecture|architecture reviews)\b/ },
    { option: pick('Cybersecurity Analyst'), pattern: /\b(cybersecurity|security analyst|siem|soc|threat)\b/ },
    { option: pick('QA Engineer'), pattern: /\b(qa engineer|quality assurance|test automation|selenium|playwright|cypress)\b/ },
    { option: pick('UI/UX Designer'), pattern: /\b(ui ux|user experience|figma|design system)\b/ },
    { option: pick('Product Manager'), pattern: /\b(product manager|roadmap|product strategy|stakeholder)\b/ },
    { option: pick('Project Manager'), pattern: /\b(project manager|program manager|delivery manager)\b/ },
    { option: pick('Business Analyst'), pattern: /\b(business analyst|requirements gathering|brd|functional specs)\b/ },
    { option: pick('Engineering Manager'), pattern: /\b(engineering manager|team lead manager|people manager)\b/ },
    { option: pick('Technical Lead'), pattern: /\b(technical lead|tech lead|lead engineer)\b/ },
    { option: pick('Senior Software Engineer'), pattern: /\b(senior software engineer|sde ?2|sde ?3|staff engineer)\b/ },
    { option: pick('Software Engineer'), pattern: /\b(software development|software engineer|developer|full stack|frontend|backend|react|node|express|next js|next\.js|intern)\b/ },
  ];

  for (const rule of rules) {
    if (rule.option && rule.pattern.test(signal)) {
      return rule.option;
    }
  }

  return '';
}

function inferJobTitle({ workExperienceSection, fullText, skills, jobTitleOptions }) {
  const directFromWork = matchBestOption(workExperienceSection, jobTitleOptions, 0.52);
  if (directFromWork) {
    return directFromWork;
  }

  const directFromResume = matchBestOption(fullText, jobTitleOptions, 0.64);
  if (directFromResume) {
    return directFromResume;
  }

  const skillText = (skills || []).map((item) => item.name).join(' ');
  const combined = `${workExperienceSection}\n${fullText}\n${skillText}`;

  const fromRules = pickJobTitleByRules(combined, jobTitleOptions);
  if (fromRules) {
    return fromRules;
  }

  return matchBestOption(combined, jobTitleOptions, 0.33);
}

function inferDepartmentFromSignals(jobTitle, skills, departmentOptions = []) {
  const role = normalizeText(jobTitle);
  const skillText = normalizeText((skills || []).map((item) => item.name || item).join(' '));
  const pick = (name) => findExistingOption(name, departmentOptions);

  if (!role && !skillText) {
    return pick('Engineering') || '';
  }

  if (/\b(finance|account)\b/.test(role)) {
    return pick('Finance') || pick('Operations') || '';
  }
  if (/\b(hr|recruit)\b/.test(role)) {
    return pick('HR') || '';
  }
  if (/\b(sales|customer success)\b/.test(role)) {
    return pick('Sales') || '';
  }
  if (/\b(product)\b/.test(role)) {
    return pick('Product') || pick('Management') || '';
  }
  if (/\b(project manager|engineering manager|manager)\b/.test(role)) {
    return pick('Management') || pick('Engineering') || '';
  }
  if (/\b(cyber|security|support|it)\b/.test(role)) {
    return pick('IT') || pick('Engineering') || '';
  }
  if (/\b(data analyst|data scientist|analytics|business analyst)\b/.test(role)) {
    return pick('Analytics') || pick('Engineering') || '';
  }
  if (/\b(software|developer|frontend|backend|technical lead|qa)\b/.test(role)) {
    return pick('Engineering') || '';
  }
  if (/\b(ml|machine learning|ai)\b/.test(role) || /\b(llm|mlops|pytorch|tensorflow)\b/.test(skillText)) {
    return pick('Engineering') || pick('Analytics') || '';
  }

  return pick('Engineering') || departmentOptions[0] || '';
}

function formatYearsValue(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return '';
  }
  const rounded = Math.round(parsed * 2) / 2;
  const bounded = Math.max(0.5, Math.min(18, rounded));
  return String(bounded);
}

function monthTokenToIndex(token) {
  const key = String(token || '').trim().toLowerCase().slice(0, 3);
  return Number.isInteger(MONTH_LOOKUP[key]) ? MONTH_LOOKUP[key] : null;
}

function extractSkillWithContext(text, skillKeyword) {
  const normalized = normalizeText(text);
  const skillNorm = normalizeText(skillKeyword);
  
  if (!normalized.includes(skillNorm)) {
    return null;
  }

  // Find skill mentions with context
  const lines = text.split(/\r?\n/).filter(line => 
    normalizeText(line).includes(skillNorm)
  );

  let years = 0;
  let proficiency = 'intermediate';
  let projectCount = 0;

  // Extract years of experience
  for (const line of lines) {
    const yearMatch = line.match(/(\d+)\+?\s*(?:years?|yrs?)/i);
    if (yearMatch) {
      years = Math.max(years, parseInt(yearMatch[1]));
    }

    // Detect proficiency level
    if (/expert|advanced|senior|lead|architect/i.test(line)) {
      proficiency = 'expert';
    } else if (/proficient|experienced|skilled/i.test(line)) {
      proficiency = 'advanced';
    } else if (/basic|beginner|learning|familiar/i.test(line)) {
      proficiency = 'beginner';
    }

    // Count project mentions
    if (/project|built|developed|implemented|created/i.test(line)) {
      projectCount++;
    }
  }

  return {
    skill: skillKeyword,
    years: years || null,
    proficiency,
    projectCount,
    mentions: lines.length,
  };
}

function extractEnhancedSkills(text) {
  const skills = [];
  
  for (const [skillKey, metadata] of Object.entries(SKILL_TAXONOMY)) {
    const context = extractSkillWithContext(text, skillKey);
    if (context) {
      skills.push({
        name: skillKey,
        ...context,
        category: metadata.category,
        marketDemand: metadata.demand,
        trending: metadata.trending,
        alternatives: metadata.alternatives,
      });
    }
  }

  return skills;
}

function extractWorkExperience(text) {
  let totalYears = 0;
  let currentCompanyYears = 0;
  
  // Look for work experience patterns
  const lines = text.split(/\r?\n/);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Pattern 1: "5 years of experience"
    const expMatch = line.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)/i);
    if (expMatch) {
      totalYears = Math.max(totalYears, parseInt(expMatch[1]));
    }
    
    // Pattern 2: Month ranges like "May 2024 - Jun 2025"
    const monthRangeMatch = line.match(
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{4})\s*[-–—]\s*(present|current|(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{4}))/i
    );
    if (monthRangeMatch) {
      const startMonth = monthTokenToIndex(monthRangeMatch[1]);
      const startYear = Number(monthRangeMatch[2]);
      const isPresent = /present|current/i.test(monthRangeMatch[3] || '');
      const endMonth = isPresent ? new Date().getMonth() : monthTokenToIndex(monthRangeMatch[4]);
      const endYear = isPresent ? new Date().getFullYear() : Number(monthRangeMatch[5]);

      if (Number.isFinite(startYear)
        && Number.isFinite(endYear)
        && Number.isInteger(startMonth)
        && Number.isInteger(endMonth)) {
        const monthSpan = (endYear - startYear) * 12 + (endMonth - startMonth);
        if (monthSpan >= 0 && monthSpan < 600) {
          const years = monthSpan / 12;
          totalYears = Math.max(totalYears, years);
          currentCompanyYears = Math.max(currentCompanyYears, years);
        }
      }
      continue;
    }

    // Pattern 3: Year ranges like "2021 - 2024" or "2022 - Present"
    const yearRangeMatch = line.match(/(?:[A-Za-z]{3,9}\s+)?(\d{4})\s*[-–—]\s*(?:present|current|(?:[A-Za-z]{3,9}\s+)?(\d{4}))/i);
    if (yearRangeMatch) {
      const startYear = Number(yearRangeMatch[1]);
      const endYear = yearRangeMatch[2] ? Number(yearRangeMatch[2]) : new Date().getFullYear();
      const years = endYear - startYear;
      if (years > 0 && years < 50) {
        totalYears = Math.max(totalYears, years);
      }
      continue;
    }
    
    // Pattern 4: "X years at Company"
    const atCompanyMatch = line.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:at|with|in)/i);
    if (atCompanyMatch) {
      currentCompanyYears = Math.max(currentCompanyYears, parseInt(atCompanyMatch[1]));
    }
  }
  
  return {
    totalExperience: totalYears,
    currentCompanyYears: currentCompanyYears || Math.min(totalYears, 5), // Default to total or max 5
  };
}

function extractCompanyName(text, companyOptions = []) {
  const lines = text.split(/\r?\n/);
  
  // Look for work experience section first
  let inWorkSection = false;
  let currentCompany = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const normalized = normalizeText(line);
    
    // Detect work experience section
    if (/^(work experience|experience|employment|professional experience)/i.test(line)) {
      inWorkSection = true;
      continue;
    }
    
    // Stop at next major section
    if (inWorkSection && /^(education|skills|certifications|projects)/i.test(line)) {
      break;
    }
    
    if (inWorkSection) {
      // Pattern 1: "Software Engineer at Google"
      const atMatch = line.match(/(?:at|@)\s+([A-Z][A-Za-z\s&.]+(?:Inc|Ltd|Corp|LLC|Limited|Technologies|Systems|Solutions)?)/);
      if (atMatch) {
        const company = atMatch[1].trim();
        // Check if it's in the known list
        for (const knownCompany of companyOptions) {
          if (normalizeText(company).includes(normalizeText(knownCompany))) {
            return knownCompany;
          }
        }
        currentCompany = company;
      }
      
      // Pattern 2: Company name on its own line (usually bold/larger in resume)
      for (const knownCompany of companyOptions) {
        if (normalized === normalizeText(knownCompany)) {
          return knownCompany;
        }
      }
    }
  }
  
  // Only return if we found something in work experience section
  return currentCompany;
}

function extractLocation(text, locationOptions = []) {
  const lines = text.split(/\r?\n/);
  
  // Look for location in work experience or contact section
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const normalized = normalizeText(line);
    
    // Check against known locations
    for (const location of locationOptions) {
      const locNorm = normalizeText(location);
      
      // Pattern 1: "Location: Bangalore"
      if (normalized.includes('location') && normalized.includes(locNorm)) {
        return location;
      }
      
      // Pattern 2: "Bangalore, India" or "Bangalore, Karnataka"
      if (normalized.includes(locNorm) && (normalized.includes('india') || normalized.includes(','))) {
        return location;
      }
      
      // Pattern 3: In work experience with date range (likely work location)
      if (normalized.includes(locNorm) && /\d{4}/.test(line)) {
        return location;
      }
    }
  }
  
  return '';
}

function extractCertificationsWithValue(text) {
  const certifications = [];
  
  // Find certification section explicitly
  const certSectionMatch = text.match(/(?:^|\n)(certifications?|licenses?|credentials?|professional certifications?)[\s:]*\n([^]*?)(?:\n\n|\n(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*:)|\n(?:EDUCATION|SKILLS|PROJECTS|EXPERIENCE)|$)/im);
  
  if (!certSectionMatch) {
    // No certification section found
    return certifications;
  }
  
  const certSection = certSectionMatch[2];
  const certSectionNorm = normalizeText(certSection);
  
  // Only check in the certification section
  for (const [certName, value] of Object.entries(CERTIFICATION_VALUE)) {
    const certNorm = normalizeText(certName);
    
    // Must be on its own line or with a bullet point
    const certLines = certSection.split('\n');
    for (const line of certLines) {
      const lineNorm = normalizeText(line);
      
      // Check if this line contains the certification
      if (lineNorm.includes(certNorm)) {
        // Make sure it's not just a mention (should be at start of line or after bullet)
        if (/^[\s\-•*]*(aws|azure|gcp|cka|ckad|cks|terraform|pmp|scrum|databricks|cissp|ceh)/i.test(line)) {
          certifications.push({
            name: certName,
            marketValue: value,
            category: certName.includes('aws') ? 'cloud' : 
                      certName.includes('azure') ? 'cloud' :
                      certName.includes('gcp') ? 'cloud' :
                      certName.includes('ck') ? 'kubernetes' :
                      certName.includes('security') ? 'security' : 'general',
          });
          break; // Found this cert, move to next
        }
      }
    }
  }

  return certifications;
}

function extractProjects(text) {
  const projects = [];
  const lines = text.split(/\r?\n/);
  
  let currentProject = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect project headers
    if (/^(project|built|developed|created|implemented)[:|\s]/i.test(line)) {
      if (currentProject) {
        projects.push(currentProject);
      }
      
      currentProject = {
        title: line.replace(/^(project|built|developed|created|implemented)[:|\s]/i, '').trim(),
        description: '',
        skills: [],
        impact: null,
      };
    } else if (currentProject && line) {
      currentProject.description += ' ' + line;
      
      // Extract skills mentioned in project
      for (const skillKey of Object.keys(SKILL_TAXONOMY)) {
        if (normalizeText(line).includes(normalizeText(skillKey))) {
          if (!currentProject.skills.includes(skillKey)) {
            currentProject.skills.push(skillKey);
          }
        }
      }
      
      // Extract impact metrics
      const impactMatch = line.match(/(\d+)%\s*(increase|decrease|improvement|reduction)/i);
      if (impactMatch) {
        currentProject.impact = `${impactMatch[1]}% ${impactMatch[2]}`;
      }
    }
  }
  
  if (currentProject) {
    projects.push(currentProject);
  }
  
  return projects.slice(0, 5);
}

function calculateSkillDepthScore(skills) {
  if (!skills.length) return 0;
  
  let totalScore = 0;
  
  for (const skill of skills) {
    let score = 30; // Base score for having the skill
    
    // Years bonus
    if (skill.years >= 5) score += 30;
    else if (skill.years >= 3) score += 20;
    else if (skill.years >= 1) score += 10;
    
    // Proficiency bonus
    if (skill.proficiency === 'expert') score += 25;
    else if (skill.proficiency === 'advanced') score += 15;
    else if (skill.proficiency === 'intermediate') score += 8;
    
    // Project validation bonus
    if (skill.projectCount >= 3) score += 15;
    else if (skill.projectCount >= 1) score += 8;
    
    totalScore += score;
  }
  
  return Math.min(100, Math.round(totalScore / skills.length));
}

function calculateMarketAlignment(skills) {
  if (!skills.length) return 0;
  
  const totalDemand = skills.reduce((sum, skill) => sum + skill.marketDemand, 0);
  return Math.round(totalDemand / skills.length);
}

function identifySkillGaps(skills, jobTitle) {
  const roleNorm = normalizeText(jobTitle);
  const currentSkills = new Set(skills.map(s => normalizeText(s.name)));
  const gaps = [];
  
  // Role-specific must-have skills
  const roleRequirements = {
    'data': ['python', 'sql', 'pytorch', 'mlops'],
    'devops': ['kubernetes', 'terraform', 'docker', 'aws'],
    'frontend': ['react', 'typescript', 'javascript'],
    'backend': ['node', 'python', 'sql', 'docker'],
    'qa': ['playwright', 'cypress', 'selenium'],
    'ml': ['python', 'pytorch', 'tensorflow', 'mlops'],
    'ai': ['python', 'pytorch', 'llm', 'mlops'],
  };
  
  for (const [roleKey, requiredSkills] of Object.entries(roleRequirements)) {
    if (roleNorm.includes(roleKey)) {
      for (const required of requiredSkills) {
        // Only add if person doesn't have this skill
        if (!currentSkills.has(normalizeText(required))) {
          const metadata = SKILL_TAXONOMY[required];
          if (metadata) {
            gaps.push({
              skill: required,
              priority: metadata.demand >= 90 ? 'critical' : 'important',
              marketDemand: metadata.demand,
              reason: `Essential for ${jobTitle} roles in current market`,
            });
          }
        }
      }
    }
  }
  
  return gaps.slice(0, 5);
}

function identifyOutdatedSkills(skills) {
  return skills
    .filter(skill => !skill.trending && skill.alternatives.length > 0)
    .map(skill => ({
      skill: skill.name,
      alternatives: skill.alternatives,
      reason: `${skill.name} demand declining, consider ${skill.alternatives.join(' or ')}`,
    }));
}

async function extractTextFromFile(file) {
  const originalName = String(file?.originalname || '').trim();
  const extension = path.extname(originalName).toLowerCase();
  const mimeType = String(file?.mimetype || '').toLowerCase();
  const buffer = file?.buffer;

  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Resume upload is empty');
  }

  if (extension === '.txt' || mimeType.includes('text/plain')) {
    return buffer.toString('utf-8');
  }

  if (extension === '.docx' || mimeType.includes('wordprocessingml')) {
    const result = await mammoth.extractRawText({ buffer });
    return result?.value || '';
  }

  if (extension !== '.pdf' && !mimeType.includes('pdf')) {
    throw new Error(`Unsupported file format: ${extension}. Please upload PDF, DOCX, or TXT file.`);
  }

  if (!pdfParseModule) {
    throw new Error('PDF parsing not available. Please upload TXT or DOCX file.');
  }

  try {
    const legacyParserFn = typeof pdfParseModule === 'function' ? pdfParseModule : null;
    if (legacyParserFn) {
      const parsed = await legacyParserFn(buffer);
      return parsed?.text || '';
    }

    const PdfParseConstructor =
      pdfParseModule?.PDFParse
      || pdfParseModule?.default?.PDFParse
      || pdfParseModule?.default;

    if (typeof PdfParseConstructor === 'function') {
      const parser = new PdfParseConstructor({ data: buffer });
      try {
        const parsed = await parser.getText();
        return parsed?.text || '';
      } finally {
        if (typeof parser.destroy === 'function') {
          await parser.destroy().catch(() => {});
        }
      }
    }

    throw new Error('Unable to initialize PDF parser for this environment.');
  } catch (pdfError) {
    console.error('PDF parsing error:', pdfError.message);
    if (pdfError.message.includes('initialize PDF parser')) {
      throw pdfError;
    }
    throw new Error('Unable to parse PDF file. Please try TXT or DOCX format.');
  }
}

export async function parseResumeEnhanced({ file, inputSpec, defaultQuarter }) {
  if (!file) {
    throw new Error('Resume file is required');
  }

  const rawText = await extractTextFromFile(file);
  const cleanText = String(rawText || '').replace(/\u0000/g, ' ').trim();

  if (!cleanText) {
    throw new Error('Unable to extract text from resume');
  }

  // Enhanced extraction
  const skills = extractEnhancedSkills(cleanText);
  const certifications = extractCertificationsWithValue(cleanText);
  const projects = extractProjects(cleanText);
  const workExperienceSection = extractWorkExperienceSection(cleanText);
  const workExp = extractWorkExperience(workExperienceSection);
  const candidateName = extractCandidateName(cleanText);
  
  // Basic info extraction
  const fields = inputSpec?.fields || {};
  const jobTitles = fields.job_title?.options || [];
  const companyOptions = fields.company_name?.options || [];
  const locationOptions = fields.company_location?.options || [];
  const techStackOptions = fields.tech_stack?.options || [];
  const departmentOptions = fields.department?.options || [];
  
  const jobTitle = inferJobTitle({
    workExperienceSection,
    fullText: cleanText,
    skills,
    jobTitleOptions: jobTitles,
  });
  
  // Company name extraction - only from work experience
  const companyNameRaw = extractCompanyName(workExperienceSection, companyOptions);
  const companyName = findExistingOption(companyNameRaw, companyOptions);
  
  // Location extraction - only from work experience or contact
  const locationRaw = extractLocation(cleanText, locationOptions);
  const location = findExistingOption(locationRaw, locationOptions);

  const skillNames = skills.map((item) => item.name);
  const stackSignals = extractTechnologySignals(cleanText);
  const stackResolution = resolveTechStackForModel({
    primaryTechStack: '',
    stackProfile: stackSignals,
    skillTagsText: skillNames.join(', '),
    resumeInsights: { skills: skillNames },
    techStackOptions,
    jobTitle,
  });
  const techStack = findExistingOption(stackResolution.resolved_tech_stack, techStackOptions)
    || matchBestOption(`${stackSignals} ${skillNames.join(' ')}`, techStackOptions, 0.34);

  const department = inferDepartmentFromSignals(jobTitle, skills, departmentOptions);
  const yearsAtCompany = formatYearsValue(workExp.currentCompanyYears);
  const parseConfidence = Math.max(
    0.35,
    Math.min(
      0.95,
      Number((
        (skills.length ? 0.25 : 0)
        + (jobTitle ? 0.2 : 0)
        + (techStack ? 0.2 : 0)
        + (department ? 0.15 : 0)
        + (companyName ? 0.1 : 0)
        + (location ? 0.05 : 0)
        + (certifications.length ? 0.05 : 0)
      ).toFixed(2))
    )
  );
  
  // Calculate scores
  const skillDepthScore = calculateSkillDepthScore(skills);
  const marketAlignment = calculateMarketAlignment(skills);
  const skillGaps = identifySkillGaps(skills, jobTitle);
  const outdatedSkills = identifyOutdatedSkills(skills);
  
  // Certification backing score
  const certificationScore = certifications.length > 0 
    ? Math.min(100, certifications.reduce((sum, c) => sum + c.marketValue, 0) / certifications.length)
    : 0;

  const resumeIntelligence = {
    candidate_name: candidateName,
    years_of_experience: Number.isFinite(workExp.totalExperience) && workExp.totalExperience > 0
      ? Number(workExp.totalExperience.toFixed(1))
      : null,
    parse_confidence: parseConfidence,
    skills: skills.map(s => ({
      name: s.name,
      years: s.years,
      proficiency: s.proficiency,
      projectCount: s.projectCount,
      marketDemand: s.marketDemand,
      trending: s.trending,
    })),
    certifications: certifications.map(c => ({
      name: c.name,
      marketValue: c.marketValue,
      category: c.category,
    })),
    projects: projects,
    skillGaps: skillGaps,
    outdatedSkills: outdatedSkills,
    stack_resolution: stackResolution,
    scores: {
      skillDepth: skillDepthScore,
      marketAlignment: marketAlignment,
      certificationBacking: certificationScore,
      overallStrength: Math.round((skillDepthScore * 0.4) + (marketAlignment * 0.35) + (certificationScore * 0.25)),
    },
    recommendations: [
      ...skillGaps.slice(0, 2).map(gap => `Add ${gap.skill} to match market demand`),
      ...outdatedSkills.slice(0, 1).map(old => `Consider upgrading from ${old.skill} to ${old.alternatives[0]}`),
      certifications.length === 0 ? 'Add relevant certifications to boost credibility' : null,
    ].filter(Boolean),
  };

  return {
    profile: {
      job_title: jobTitle,
      company_name: companyName,
      company_location: location,
      tech_stack: techStack,
      department,
      remote_work: /remote|hybrid|work from home/i.test(cleanText) ? 'Yes' : '',
      years_at_company: yearsAtCompany,
      performance_rating: '',
      reporting_quarter: defaultQuarter || '',
    },
    resumeIntelligence,
    rawText: cleanText.slice(0, 2000),
  };
}
