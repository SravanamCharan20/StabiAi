// Test script to verify resume parser accuracy
import { parseResumeEnhanced } from './services/enhancedResumeParser.js';

// Test case 1: Resume with CKA mention but not certified
const testResume1 = `
JOHN DOE
Email: john@example.com

SKILLS
- Kubernetes (CKA level knowledge)
- Docker
- Python

WORK EXPERIENCE
Software Engineer at Google
Bangalore, India
Jan 2020 - Present
- Worked on cloud infrastructure
`;

// Test case 2: Resume with actual certification
const testResume2 = `
JOHN DOE
Email: john@example.com

SKILLS
- Kubernetes
- Docker

CERTIFICATIONS
- CKA (Certified Kubernetes Administrator)
- AWS Certified Developer

WORK EXPERIENCE
DevOps Engineer at Microsoft
Hyderabad, India
2019 - 2023
`;

// Test case 3: Resume mentioning company but not working there
const testResume3 = `
JOHN DOE
Email: john@example.com

SKILLS
- Python
- Experience with Google Cloud Platform
- AWS

PROJECTS
- Built app using Google Cloud
`;

async function runTests() {
  console.log('🧪 Testing Resume Parser Accuracy\n');
  console.log('=' .repeat(60));
  
  const inputSpec = {
    fields: {
      company_name: { options: ['Google', 'Microsoft', 'Amazon', 'Meta'] },
      company_location: { options: ['Bangalore', 'Hyderabad', 'Mumbai', 'Delhi'] },
      job_title: { options: ['Software Engineer', 'DevOps Engineer', 'Data Scientist'] },
    }
  };
  
  // Test 1
  console.log('\n📄 TEST 1: CKA Mention (Not Certified)');
  console.log('-'.repeat(60));
  try {
    const result1 = await parseResumeEnhanced({
      file: {
        originalname: 'test.txt',
        buffer: Buffer.from(testResume1, 'utf-8')
      },
      inputSpec,
      defaultQuarter: '2024-Q4'
    });
    
    console.log('✓ Skills:', result1.resumeIntelligence.skills.map(s => s.name).join(', '));
    console.log('✓ Certifications:', result1.resumeIntelligence.certifications.length > 0 
      ? result1.resumeIntelligence.certifications.map(c => c.name).join(', ')
      : '(none)');
    console.log('✓ Company:', result1.profile.company_name || '(none)');
    console.log('✓ Location:', result1.profile.company_location || '(none)');
    console.log('✓ Years:', result1.profile.years_at_company || '(none)');
    
    if (result1.resumeIntelligence.certifications.length === 0) {
      console.log('✅ PASS: No false positive certifications');
    } else {
      console.log('❌ FAIL: Should not have certifications');
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
  
  // Test 2
  console.log('\n📄 TEST 2: Actual Certifications');
  console.log('-'.repeat(60));
  try {
    const result2 = await parseResumeEnhanced({
      file: {
        originalname: 'test.txt',
        buffer: Buffer.from(testResume2, 'utf-8')
      },
      inputSpec,
      defaultQuarter: '2024-Q4'
    });
    
    console.log('✓ Skills:', result2.resumeIntelligence.skills.map(s => s.name).join(', '));
    console.log('✓ Certifications:', result2.resumeIntelligence.certifications.length > 0 
      ? result2.resumeIntelligence.certifications.map(c => c.name).join(', ')
      : '(none)');
    console.log('✓ Company:', result2.profile.company_name || '(none)');
    console.log('✓ Location:', result2.profile.company_location || '(none)');
    console.log('✓ Years:', result2.profile.years_at_company || '(none)');
    
    if (result2.resumeIntelligence.certifications.length > 0 && result2.profile.company_name === 'Microsoft') {
      console.log('✅ PASS: Correctly detected certifications and company');
    } else {
      console.log('❌ FAIL: Should have certifications and company');
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
  
  // Test 3
  console.log('\n📄 TEST 3: Company Mention (Not Working There)');
  console.log('-'.repeat(60));
  try {
    const result3 = await parseResumeEnhanced({
      file: {
        originalname: 'test.txt',
        buffer: Buffer.from(testResume3, 'utf-8')
      },
      inputSpec,
      defaultQuarter: '2024-Q4'
    });
    
    console.log('✓ Skills:', result3.resumeIntelligence.skills.map(s => s.name).join(', '));
    console.log('✓ Company:', result3.profile.company_name || '(none)');
    console.log('✓ Location:', result3.profile.company_location || '(none)');
    
    if (!result3.profile.company_name) {
      console.log('✅ PASS: No false positive company');
    } else {
      console.log('❌ FAIL: Should not have company (not in work experience)');
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 Tests Complete\n');
}

runTests().catch(console.error);
