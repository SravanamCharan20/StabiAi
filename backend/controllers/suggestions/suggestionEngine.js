const generateSkillSuggestions = (jobTitle, performance, experience) => {
  // Pre-defined skill suggestions based on job roles
  const skillTemplates = {
    'software engineer': [
      {
        name: 'Cloud Architecture',
        why: 'Essential for modern software development and scalable applications',
        how: 'Complete AWS/Azure certification. Build serverless applications. Implement cloud-native patterns',
        impact: 'Increase deployment efficiency by 40% and reduce infrastructure costs'
      },
      {
        name: 'AI/ML Integration',
        why: 'Growing demand for AI-powered features in applications',
        how: 'Take online ML courses. Implement practical ML projects. Master key ML frameworks',
        impact: 'Enable smart features and automate 30% of routine tasks'
      }
    ],
    'data scientist': [
      {
        name: 'Advanced Deep Learning',
        why: 'Critical for complex data analysis and prediction models',
        how: 'Complete deep learning specialization. Implement neural networks. Master PyTorch/TensorFlow',
        impact: 'Improve model accuracy by 25% and handle more complex datasets'
      },
      {
        name: 'MLOps',
        why: 'Essential for deploying and maintaining ML models in production',
        how: 'Learn CI/CD for ML. Master model monitoring tools. Implement automated testing',
        impact: 'Reduce model deployment time by 50% and improve reliability'
      }
    ],
    'default': [
      {
        name: 'Data Analysis',
        why: 'Essential for data-driven decision making',
        how: 'Learn SQL and data visualization. Master Excel/Python for analysis. Practice with real datasets',
        impact: 'Enable data-driven decisions and improve efficiency by 20%'
      },
      {
        name: 'Project Management',
        why: 'Critical for career growth and team leadership',
        how: 'Get PM certification. Lead small projects. Learn agile methodologies',
        impact: 'Successfully manage projects and improve team productivity'
      }
    ]
  };

  // Get relevant skills based on job title or default
  const skills = skillTemplates[jobTitle.toLowerCase()] || skillTemplates.default;
  
  // Adjust recommendations based on performance and experience
  return skills.map(skill => ({
    ...skill,
    impact: performance > 4 ? `${skill.impact} with leadership opportunities` : skill.impact,
    how: experience < 2 ? `Start with basics: ${skill.how}` : skill.how
  }));
};

const generateActionSuggestions = (riskLevel, performance) => {
  const actionTemplates = {
    high: [
      {
        title: 'Immediate Value Demonstration',
        steps: [
          'Document all achievements and contributions',
          'Quantify impact of recent projects',
          'Present results to leadership'
        ],
        timeline: '2-4 weeks',
        indicators: 'Increased visibility and recognition from management'
      },
      {
        title: 'Critical Skill Enhancement',
        steps: [
          'Identify skill gaps in high-demand areas',
          'Complete relevant certifications',
          'Apply new skills in current projects'
        ],
        timeline: '1-3 months',
        indicators: 'New certifications and improved project contributions'
      }
    ],
    moderate: [
      {
        title: 'Project Impact Optimization',
        steps: [
          'Take ownership of key projects',
          'Implement efficiency improvements',
          'Document and share best practices'
        ],
        timeline: '1-2 months',
        indicators: 'Measurable project improvements and team recognition'
      },
      {
        title: 'Cross-functional Collaboration',
        steps: [
          'Identify collaboration opportunities',
          'Lead cross-team initiatives',
          'Build relationships with key stakeholders'
        ],
        timeline: '2-3 months',
        indicators: 'Increased cross-team projects and visibility'
      }
    ],
    low: [
      {
        title: 'Growth Path Development',
        steps: [
          'Create 6-month development plan',
          'Seek mentorship opportunities',
          'Take on stretch assignments'
        ],
        timeline: '6 months',
        indicators: 'Clear career progression and new responsibilities'
      },
      {
        title: 'Innovation Leadership',
        steps: [
          'Propose improvement initiatives',
          'Lead innovation projects',
          'Share knowledge with team'
        ],
        timeline: '3-4 months',
        indicators: 'Successfully implemented innovations and team impact'
      }
    ]
  };

  // Get actions based on risk level
  const actions = actionTemplates[riskLevel.toLowerCase()] || actionTemplates.moderate;
  
  // Adjust based on performance
  return actions.map(action => ({
    ...action,
    timeline: performance > 4 ? 'Fast-track: ' + action.timeline : action.timeline
  }));
};

const generateOpportunitySuggestions = (jobTitle, experience, industryGrowth) => {
  const opportunityTemplates = {
    'software engineer': [
      {
        title: 'Technical Lead Transition',
        requirements: 'Strong technical skills and team leadership experience',
        impact: 'Career growth and 30% increased compensation potential',
        timeline: '6-12 months'
      },
      {
        title: 'Architecture Specialization',
        requirements: 'Deep system design knowledge and scalability experience',
        impact: 'Position as technical authority and job security',
        timeline: '8-12 months'
      }
    ],
    'data scientist': [
      {
        title: 'ML Infrastructure Lead',
        requirements: 'MLOps expertise and production ML experience',
        impact: 'Lead ML infrastructure and increase project success rate',
        timeline: '6-9 months'
      },
      {
        title: 'AI Research Specialist',
        requirements: 'Published research and deep ML expertise',
        impact: 'Drive innovation and increase company IP value',
        timeline: '12-18 months'
      }
    ],
    'default': [
      {
        title: 'Team Lead',
        requirements: 'Leadership skills and domain expertise',
        impact: 'Career advancement and increased influence',
        timeline: '6-12 months'
      },
      {
        title: 'Domain Expert',
        requirements: 'Deep industry knowledge and proven track record',
        impact: 'Become recognized authority in field',
        timeline: '12-18 months'
      }
    ]
  };

  // Get opportunities based on job title
  const opportunities = opportunityTemplates[jobTitle.toLowerCase()] || opportunityTemplates.default;
  
  // Adjust based on experience and industry growth
  return opportunities.map(opp => ({
    ...opp,
    timeline: experience > 5 ? 'Accelerated: ' + opp.timeline : opp.timeline,
    impact: industryGrowth > 10 ? `High growth potential: ${opp.impact}` : opp.impact
  }));
};

const generateSuggestions = (employeeData, predictionData) => {
  const {
    job_title,
    performance_rating,
    years_at_company
  } = employeeData;

  const {
    layoff_risk,
    data: { revenue_growth }
  } = predictionData;

  return {
    skills: generateSkillSuggestions(job_title, performance_rating, years_at_company),
    actions: generateActionSuggestions(layoff_risk, performance_rating),
    opportunities: generateOpportunitySuggestions(job_title, years_at_company, revenue_growth)
  };
};

export {
  generateSuggestions
}; 