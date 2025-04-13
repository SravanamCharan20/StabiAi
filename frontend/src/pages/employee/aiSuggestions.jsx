/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiLightBulb,
  HiShieldCheck,
  HiChartBar,
  HiStar,
  HiClock,
  HiCode,
  HiCube,
  HiDatabase,
  HiSparkles,
  HiChip,
  HiTemplate,
  HiPuzzle,
  HiExclamationCircle
} from 'react-icons/hi';

// Validation functions
const isValidSkill = (skill) => {
  return (
    skill.name?.trim() &&
    skill.why?.trim() &&
    skill.how?.trim() &&
    skill.impact?.trim()
  );
};

const isValidAction = (action) => {
  return (
    action.title?.trim() &&
    Array.isArray(action.steps) &&
    action.steps.length > 0 &&
    action.steps.every(step => step.trim()) &&
    action.timeline?.trim() &&
    action.indicators?.trim()
  );
};

const isValidOpportunity = (opportunity) => {
  return (
    opportunity.title?.trim() &&
    opportunity.requirements?.trim() &&
    opportunity.impact?.trim() &&
    opportunity.timeline?.trim()
  );
};

const generateSuggestionPrompt = (employeeData, predictionData) => {
  const riskLevel = predictionData.prediction.layoff_risk.toLowerCase();
  
  return `As an expert career advisor, provide specific recommendations for this employee profile.
Current risk level: ${riskLevel}

EMPLOYEE PROFILE:
- Role: ${employeeData.job_title}
- Company: ${employeeData.company_name}
- Experience: ${employeeData.years_at_company} years
- Performance: ${employeeData.performance_rating}/5
- Industry Growth: ${predictionData.data.revenue_growth}%

Please provide recommendations in the following format:

CRITICAL_SKILLS
1. Skill: [Skill Name]
   Why: [Clear business impact]
   How: [Specific learning path]
   Impact: [Measurable outcomes]

2. Skill: [Skill Name]
   Why: [Clear business impact]
   How: [Specific learning path]
   Impact: [Measurable outcomes]

PRIORITY_ACTIONS
1. Action: [Action title]
   Steps: [Step 1], [Step 2], [Step 3]
   Timeline: [Specific timeframe]
   Success: [Measurable indicators]

2. Action: [Action title]
   Steps: [Step 1], [Step 2], [Step 3]
   Timeline: [Specific timeframe]
   Success: [Measurable indicators]

GROWTH_OPPORTUNITIES
1. Title: [Opportunity name]
   Requirements: [Specific prerequisites]
   Impact: [Expected benefits]
   Timeline: [Expected timeframe]

2. Title: [Opportunity name]
   Requirements: [Specific prerequisites]
   Impact: [Expected benefits]
   Timeline: [Expected timeframe]

Ensure each recommendation is:
- Specific to the ${employeeData.job_title} role
- Actionable with clear steps
- Measurable with concrete outcomes
- Realistic to implement
- Focused on risk mitigation`;
};

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="text-center py-12"
  >
    <HiExclamationCircle className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-sm font-semibold text-gray-900">No Valid Suggestions</h3>
    <p className="mt-1 text-sm text-gray-500">We're working on generating better recommendations.</p>
  </motion.div>
);

const SkillCard = ({ skill, index }) => {
  const icons = [HiCode, HiDatabase, HiTemplate, HiChip];
  const Icon = icons[index % icons.length];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200"
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{skill.name}</h3>
        </div>
        <div className="space-y-4">
          <div className="bg-indigo-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-indigo-900 mb-2">Why It Matters</h4>
            <p className="text-indigo-700">{skill.why}</p>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">How to Acquire</h4>
            <ul className="space-y-2">
              {skill.how.split('.').filter(step => step.trim()).map((step, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-600 font-medium">{idx + 1}.</span>
                  <span className="text-gray-600">{step.trim()}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Expected Impact</h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-700">{skill.impact}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ActionCard = ({ action, index }) => {
  const icons = [HiShieldCheck, HiSparkles, HiPuzzle, HiCube];
  const Icon = icons[index % icons.length];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200"
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{action.title}</h3>
            <p className="text-sm text-green-600">{action.timeline}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-900 mb-2">Implementation Steps</h4>
            <ul className="space-y-3">
              {action.steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-medium">
                    {idx + 1}
                  </span>
                  <span className="text-green-700">{step}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Success Indicators</h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-700">{action.indicators}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const OpportunityCard = ({ opportunity, index }) => {
  const icons = [HiStar, HiLightBulb, HiChartBar, HiClock];
  const Icon = icons[index % icons.length];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200"
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{opportunity.title}</h3>
            <p className="text-sm text-purple-600">{opportunity.timeline}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-purple-900 mb-2">Requirements</h4>
            <p className="text-purple-700">{opportunity.requirements}</p>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Potential Impact</h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-700">{opportunity.impact}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Section = ({ title, description, children, isEmpty }) => (
  <div className="mb-12">
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 text-gray-600">{description}</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {isEmpty ? <EmptyState /> : children}
    </div>
  </div>
);

const AiSuggestions = ({ employeeData, predictionData, loading }) => {
  const [suggestions, setSuggestions] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    const fetchSuggestions = async () => {
      if (!employeeData || !predictionData) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Format the data before sending
        const formattedEmployeeData = {
          job_title: employeeData.job_title || '',
          performance_rating: Number(employeeData.performance_rating) || 0,
          years_at_company: Number(employeeData.years_at_company) || 0
        };

        const formattedPredictionData = {
          prediction: {
            layoff_risk: predictionData.prediction?.layoff_risk || 'moderate'
          },
          data: {
            revenue_growth: Number(predictionData.data?.revenue_growth) || 0
          }
        };

        // Call our local suggestion API
        const response = await axios.post('http://localhost:9000/api/suggestions', {
          employeeData: formattedEmployeeData,
          predictionData: formattedPredictionData
        });

        if (response.data.success) {
          setSuggestions(response.data.suggestions);
        } else {
          throw new Error(response.data.message || 'Failed to generate suggestions');
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [employeeData, predictionData]);

  if (loading || isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-8 flex items-center justify-center p-12"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-100 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 animate-pulse">Creating your personalized action plan...</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 relative"
      >
        <div className="bg-red-50 border border-red-100 rounded-xl p-6">
          <h3 className="text-red-800 font-semibold text-lg mb-2">Unable to Generate Action Plan</h3>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  if (!suggestions) return null;

  return (
    <div className="mt-8">
      <div className="mb-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Career Action Plan</h1>
        <p className="mt-2 text-gray-600">Focused strategies to strengthen your position and accelerate growth</p>
        <div className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-blue-100 text-blue-700 text-sm">
          Risk Level: {predictionData.prediction.layoff_risk}
        </div>
      </div>

      <Section 
        title="Critical Skills to Develop" 
        description="High-impact skills that align with market demands"
        isEmpty={!suggestions.skills.length}
      >
        {suggestions.skills.map((skill, index) => (
          <SkillCard key={index} skill={skill} index={index} />
        ))}
      </Section>

      <Section 
        title="Priority Actions" 
        description="Immediate steps to strengthen your position"
        isEmpty={!suggestions.actions.length}
      >
        {suggestions.actions.map((action, index) => (
          <ActionCard key={index} action={action} index={index} />
        ))}
      </Section>

      <Section 
        title="Growth Opportunities" 
        description="Strategic moves to advance your career"
        isEmpty={!suggestions.opportunities.length}
      >
        {suggestions.opportunities.map((opportunity, index) => (
          <OpportunityCard key={index} opportunity={opportunity} index={index} />
        ))}
      </Section>
    </div>
  );
};

export default AiSuggestions;