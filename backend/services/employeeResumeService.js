import path from 'path';
import { createRequire } from 'module';
import mammoth from 'mammoth';
const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse');

const SUPPORTED_EXTENSIONS = new Set(['.pdf', '.docx', '.txt']);

const CERTIFICATION_KEYWORDS = [
  'aws certified',
  'azure',
  'gcp',
  'cka',
  'ckad',
  'cks',
  'terraform associate',
  'security+',
  'ceh',
  'cissp',
  'pmp',
  'scrum',
  'pspo',
  'shrm',
  'lean six sigma',
  'databricks',
  'power bi',
  'google data analytics',
];

const SKILL_KEYWORDS = [
  'python',
  'java',
  'node',
  'react',
  'spring boot',
  'kubernetes',
  'docker',
  'terraform',
  'aws',
  'azure',
  'gcp',
  'sql',
  'tableau',
  'power bi',
  'llm',
  'mlops',
  'pytorch',
  'tensorflow',
  'selenium',
  'playwright',
  'cypress',
  'siem',
  'incident response',
  'jira',
  'figma',
];

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function unique(items, limit = 8) {
  return [...new Set((items || []).filter(Boolean))].slice(0, limit);
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
    return null;
  }

  const sourceTokens = new Set(normalized.split(' ').filter(Boolean));
  let best = { value: null, score: 0 };

  for (const candidate of optionCandidates(options)) {
    const overlap = candidate.tokens.filter((token) => sourceTokens.has(token)).length;
    const score = overlap / Math.max(candidate.tokens.length, 1);

    if (normalized.includes(candidate.norm)) {
      return candidate.value;
    }

    if (score > best.score) {
      best = { value: candidate.value, score };
    }
  }

  return best.score >= threshold ? best.value : null;
}

function extractYearsOfExperience(text) {
  const normalized = String(text || '');
  const patterns = [
    /([0-9]+(?:\.[0-9]+)?)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/gi,
    /experience\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\+?\s*(?:years?|yrs?)/gi,
  ];

  const values = [];
  for (const pattern of patterns) {
    let match = pattern.exec(normalized);
    while (match) {
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 45) {
        values.push(parsed);
      }
      match = pattern.exec(normalized);
    }
  }

  if (!values.length) {
    return null;
  }

  return Math.max(...values);
}

function extractEmail(text) {
  const match = String(text || '').match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
}

function extractPhone(text) {
  const match = String(text || '').match(/(?:\+91[-\s]?)?[6-9]\d{9}/);
  return match ? match[0] : null;
}

function extractName(text) {
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

function extractCertifications(text) {
  const normalized = normalizeText(text);
  const hits = [];
  for (const keyword of CERTIFICATION_KEYWORDS) {
    if (normalized.includes(normalizeText(keyword))) {
      hits.push(keyword.toUpperCase());
    }
  }
  return unique(hits, 8);
}

function extractSkills(text) {
  const normalized = normalizeText(text);
  const hits = [];
  for (const keyword of SKILL_KEYWORDS) {
    if (normalized.includes(normalizeText(keyword))) {
      hits.push(keyword);
    }
  }
  return unique(hits, 12);
}

function aiReadinessScore(skills = [], certifications = []) {
  const skillText = normalizeText(skills.join(' '));
  const certText = normalizeText(certifications.join(' '));

  let score = 45;
  if (/llm|mlops|tensorflow|pytorch|python|kubernetes|terraform|aws|azure|gcp/.test(skillText)) {
    score += 28;
  }
  if (/aws certified|azure|gcp|cka|ckad|terraform/.test(certText)) {
    score += 15;
  }
  if (/manual qa/.test(skillText)) {
    score -= 12;
  }

  return Math.max(0, Math.min(100, score));
}

async function extractTextFromFile(file) {
  const originalName = String(file?.originalname || '').trim();
  const extension = path.extname(originalName).toLowerCase();
  const mimeType = String(file?.mimetype || '').toLowerCase();
  const buffer = file?.buffer;

  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Resume upload is empty');
  }

  if (!SUPPORTED_EXTENSIONS.has(extension)
    && !mimeType.includes('pdf')
    && !mimeType.includes('word')
    && !mimeType.includes('text')) {
    throw new Error('Unsupported resume format. Please upload PDF, DOCX, or TXT.');
  }

  if (extension === '.txt' || mimeType.includes('text/plain')) {
    return buffer.toString('utf-8');
  }

  if (extension === '.docx' || mimeType.includes('wordprocessingml')) {
    const result = await mammoth.extractRawText({ buffer });
    return result?.value || '';
  }

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
}

function inferDepartmentFromRole(jobTitle, options = []) {
  const role = normalizeText(jobTitle);
  const map = [
    { key: ['data', 'analytics', 'ml'], value: 'Analytics' },
    { key: ['finance', 'account'], value: 'Finance' },
    { key: ['hr', 'recruit'], value: 'HR' },
    { key: ['product'], value: 'Product' },
    { key: ['sales', 'customer success'], value: 'Sales' },
    { key: ['project manager', 'management'], value: 'Management' },
    { key: ['support', 'it', 'security'], value: 'IT' },
  ];

  for (const row of map) {
    if (row.key.some((token) => role.includes(token)) && options.includes(row.value)) {
      return row.value;
    }
  }
  return options.includes('Engineering') ? 'Engineering' : null;
}

export async function parseResumeAndBuildProfile({ file, inputSpec, defaultQuarter }) {
  if (!file) {
    throw new Error('Resume file is required');
  }

  const rawText = await extractTextFromFile(file);
  const cleanText = String(rawText || '').replace(/\u0000/g, ' ').trim();

  if (!cleanText) {
    throw new Error('Unable to extract text from resume');
  }

  const fields = inputSpec?.fields || {};
  const companies = fields.company_name?.options || [];
  const locations = fields.company_location?.options || [];
  const jobTitles = fields.job_title?.options || [];
  const techStacks = fields.tech_stack?.options || [];
  const departments = fields.department?.options || [];

  const email = extractEmail(cleanText);
  const phone = extractPhone(cleanText);
  const name = extractName(cleanText);
  const years = extractYearsOfExperience(cleanText);
  const certifications = extractCertifications(cleanText);
  const skills = extractSkills(cleanText);

  const jobTitle = matchBestOption(cleanText, jobTitles, 0.4);
  const techStack = matchBestOption(cleanText, techStacks, 0.36);
  const companyName = matchBestOption(cleanText, companies, 0.45);
  const companyLocation = matchBestOption(cleanText, locations, 0.42);
  const department = matchBestOption(cleanText, departments, 0.45)
    || inferDepartmentFromRole(jobTitle, departments);

  const profile = {
    company_name: companyName || '',
    company_location: companyLocation || '',
    reporting_quarter: defaultQuarter || '',
    job_title: jobTitle || '',
    tech_stack: techStack || '',
    department: department || '',
    remote_work: /remote|work from home|hybrid/i.test(cleanText) ? 'Yes' : '',
    years_at_company: Number.isFinite(years) ? String(Math.max(0, Math.min(30, Math.round(years * 2) / 2))) : '',
    salary_range: '',
    performance_rating: '',
  };

  const aiReadiness = aiReadinessScore(skills, certifications);

  const missingRequiredFields = Object.entries(fields)
    .filter(([, meta]) => Boolean(meta?.required))
    .map(([key]) => key)
    .filter((key) => !String(profile[key] || '').trim());

  const resumeInsights = {
    candidate_name: name,
    email,
    phone,
    years_of_experience: Number.isFinite(years) ? years : null,
    certifications,
    skills,
    ai_readiness_score: aiReadiness,
    parse_confidence: Math.max(0.25, Math.min(0.95, (10 - missingRequiredFields.length) / 10)),
    text_preview: cleanText.slice(0, 1400),
  };

  return {
    profile,
    resume_insights: resumeInsights,
    missing_required_fields: missingRequiredFields,
  };
}
