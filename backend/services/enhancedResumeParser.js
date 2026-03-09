import path from 'path';
import { createRequire } from 'module';
import mammoth from 'mammoth';
const require = createRequire(import.meta.url);

// Import pdf-parse
let pdfParse = null;
try {
  pdfParse = require('pdf-parse');
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

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s+#.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
  const normalized = normalizeText(text);
  let totalYears = 0;
  let currentCompanyYears = 0;
  
  // Look for work experience patterns
  const lines = text.split(/\r?\n/);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
    
    // Pattern 1: "5 years of experience"
    const expMatch = line.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)/i);
    if (expMatch) {
      totalYears = Math.max(totalYears, parseInt(expMatch[1]));
    }
    
    // Pattern 2: Date ranges like "Jan 2020 - Present" or "2020 - 2024"
    const dateRangeMatch = line.match(/(\d{4})\s*[-–—]\s*(?:present|current|(\d{4}))/i);
    if (dateRangeMatch) {
      const startYear = parseInt(dateRangeMatch[1]);
      const endYear = dateRangeMatch[2] ? parseInt(dateRangeMatch[2]) : new Date().getFullYear();
      const years = endYear - startYear;
      if (years > 0 && years < 50) { // Sanity check
        totalYears = Math.max(totalYears, years);
      }
    }
    
    // Pattern 3: "X years at Company"
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
  const buffer = file?.buffer;

  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Resume upload is empty');
  }

  if (extension === '.txt') {
    return buffer.toString('utf-8');
  }

  if (extension === '.docx') {
    const result = await mammoth.extractRawText({ buffer });
    return result?.value || '';
  }

  // PDF parsing
  if (extension === '.pdf') {
    if (!pdfParse) {
      throw new Error('PDF parsing not available. Please upload TXT or DOCX file.');
    }
    
    try {
      const parsed = await pdfParse(buffer);
      return parsed?.text || '';
    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError.message);
      throw new Error('Unable to parse PDF file. Please try TXT or DOCX format.');
    }
  }

  throw new Error(`Unsupported file format: ${extension}. Please upload PDF, DOCX, or TXT file.`);
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
  const workExp = extractWorkExperience(cleanText);
  
  // Basic info extraction
  const fields = inputSpec?.fields || {};
  const jobTitles = fields.job_title?.options || [];
  const companyOptions = fields.company_name?.options || [];
  const locationOptions = fields.company_location?.options || [];
  
  // Job title matching - only in work experience section
  let jobTitle = '';
  const workExpMatch = cleanText.match(/(?:work experience|experience|employment)[\s:]*\n([^]*?)(?:\n\n|education|skills|certifications|$)/i);
  const workExpSection = workExpMatch ? workExpMatch[1] : cleanText;
  
  for (const title of jobTitles) {
    if (normalizeText(workExpSection).includes(normalizeText(title))) {
      jobTitle = title;
      break;
    }
  }
  
  // Company name extraction - only from work experience
  const companyName = extractCompanyName(cleanText, companyOptions);
  
  // Location extraction - only from work experience or contact
  const location = extractLocation(cleanText, locationOptions);

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
      company_name: '',  // Don't auto-fill company name
      company_location: '',  // Don't auto-fill location
      tech_stack: skills.length > 0 ? skills[0].name : '',
      years_at_company: workExp.currentCompanyYears || '',
      performance_rating: '',  // Don't auto-fill performance rating
      reporting_quarter: defaultQuarter || '',
    },
    resumeIntelligence: {
      ...resumeIntelligence,
      certifications: [],  // Don't auto-fill certifications
    },
    rawText: cleanText.slice(0, 2000),
  };
}
