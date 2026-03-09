import React from 'react';
import { 
  HiCheckCircle, 
  HiExclamationCircle, 
  HiShieldCheck,
  HiTrendingUp,
  HiTrendingDown,
  HiLightBulb,
} from 'react-icons/hi';

// Convert technical risk to simple job security score
const calculateJobSecurityScore = (predictionData) => {
  const risk = predictionData?.prediction?.layoff_risk?.toLowerCase();
  const confidence = predictionData?.prediction?.confidence || 0;
  
  let baseScore = 50;
  if (risk === 'low') baseScore = 85;
  else if (risk === 'medium') baseScore = 60;
  else if (risk === 'high') baseScore = 30;
  
  // Adjust by confidence
  const adjustedScore = baseScore + ((confidence - 0.7) * 20);
  return Math.max(0, Math.min(100, Math.round(adjustedScore)));
};

// Convert risk level to simple language
const getRiskMessage = (score) => {
  if (score >= 80) return {
    level: 'Strong',
    color: 'emerald',
    icon: HiShieldCheck,
    message: 'Your position looks very secure. Keep up the great work!',
    detail: 'You have strong protective factors working in your favor.',
  };
  
  if (score >= 60) return {
    level: 'Stable',
    color: 'blue',
    icon: HiCheckCircle,
    message: 'Your position is stable with room to strengthen.',
    detail: 'You\'re in a good spot, but there are opportunities to improve your security.',
  };
  
  if (score >= 40) return {
    level: 'Moderate',
    color: 'amber',
    icon: HiExclamationCircle,
    message: 'Your position needs attention. Take action to improve.',
    detail: 'Some risk factors are present. Focus on the recommendations below.',
  };
  
  return {
    level: 'At Risk',
    color: 'rose',
    icon: HiExclamationCircle,
    message: 'Your position has significant risk. Immediate action recommended.',
    detail: 'Multiple risk factors detected. Prioritize the action items urgently.',
  };
};

// Simplify technical factors into plain language
const simplifyFactor = (factor) => {
  const feature = factor.feature || '';
  const direction = factor.direction || '';
  
  const isGood = direction === 'reduces_risk';
  const isBad = direction === 'increases_risk';
  
  // Map technical features to simple language
  const simpleNames = {
    'performance_rating': 'Your Performance Score',
    'years_at_company': 'Your Tenure',
    'tech_stack': 'Your Technical Skills',
    'department': 'Your Department',
    'salary_range': 'Your Salary Level',
    'role_demand_index': 'Job Market Demand',
    'tech_stack_trend_score': 'Skill Relevance',
    'department_resilience_index': 'Department Stability',
    'revenue_growth': 'Company Growth',
    'stock_price_change': 'Company Performance',
    'economic_pressure': 'Economic Conditions',
    'industry_layoff_rate': 'Industry Trends',
  };
  
  const simpleName = simpleNames[feature] || feature.replace(/_/g, ' ');
  
  return {
    name: simpleName,
    isGood,
    isBad,
    impact: factor.impact || 0,
    explanation: simplifyExplanation(factor.reason || ''),
  };
};

const simplifyExplanation = (technicalReason) => {
  // Remove technical jargon
  return technicalReason
    .replace(/This profile tends to push risk upward/gi, 'This increases your risk')
    .replace(/This profile acts as a protective signal/gi, 'This protects your position')
    .replace(/baseline/gi, 'average')
    .replace(/risk-increasing direction/gi, 'higher risk zone')
    .replace(/risk-reducing range/gi, 'safer zone');
};

const SkillMatchBar = ({ skill, matchPercentage, trending }) => {
  const getColor = (pct) => {
    if (pct >= 80) return 'bg-emerald-500';
    if (pct >= 60) return 'bg-blue-500';
    if (pct >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-900">
          {skill}
          {trending && <span className="ml-2 text-xs text-emerald-600">🔥 Trending</span>}
        </span>
        <span className="text-slate-600">{matchPercentage}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100">
        <div 
          className={`h-full rounded-full ${getColor(matchPercentage)}`}
          style={{ width: `${matchPercentage}%` }}
        />
      </div>
    </div>
  );
};

const SimplifiedResults = ({ predictionData, resumeIntelligence }) => {
  const jobSecurityScore = calculateJobSecurityScore(predictionData);
  const riskInfo = getRiskMessage(jobSecurityScore);
  const RiskIcon = riskInfo.icon;
  
  // Extract and simplify factors
  const factors = (predictionData?.prediction?.top_factors || [])
    .slice(0, 6)
    .map(simplifyFactor);
  
  const goodFactors = factors.filter(f => f.isGood);
  const badFactors = factors.filter(f => f.isBad);
  
  // Resume intelligence
  const skills = resumeIntelligence?.skills || [];
  const skillGaps = resumeIntelligence?.skillGaps || [];
  const scores = resumeIntelligence?.scores || {};
  
  // Color mapping for dynamic classes
  const colorClasses = {
    emerald: {
      border: 'border-emerald-200',
      bg: 'bg-emerald-50',
      bgGradient: 'from-emerald-50',
      text: 'text-emerald-600',
      bgIcon: 'bg-emerald-100',
    },
    blue: {
      border: 'border-blue-200',
      bg: 'bg-blue-50',
      bgGradient: 'from-blue-50',
      text: 'text-blue-600',
      bgIcon: 'bg-blue-100',
    },
    amber: {
      border: 'border-amber-200',
      bg: 'bg-amber-50',
      bgGradient: 'from-amber-50',
      text: 'text-amber-600',
      bgIcon: 'bg-amber-100',
    },
    rose: {
      border: 'border-rose-200',
      bg: 'bg-rose-50',
      bgGradient: 'from-rose-50',
      text: 'text-rose-600',
      bgIcon: 'bg-rose-100',
    },
  };
  
  const colors = colorClasses[riskInfo.color] || colorClasses.blue;
  
  return (
    <div className="space-y-6">
      {/* Main Score Card */}
      <div className={`rounded-3xl border-2 ${colors.border} bg-gradient-to-br ${colors.bgGradient} to-white p-8`}>
        <div className="flex items-start gap-4">
          <div className={`rounded-2xl ${colors.bgIcon} p-4`}>
            <RiskIcon className={`h-10 w-10 ${colors.text}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-3">
              <h2 className="text-5xl font-bold text-slate-900">{jobSecurityScore}</h2>
              <span className="text-lg text-slate-600">/ 100</span>
            </div>
            <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Job Security Score
            </p>
            <p className="mt-3 text-lg font-semibold text-slate-900">{riskInfo.message}</p>
            <p className="mt-1 text-sm text-slate-600">{riskInfo.detail}</p>
          </div>
        </div>
      </div>

      {/* What This Means */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">What This Means</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          We analyzed your role, skills, company performance, and market conditions. 
          Your score of <strong>{jobSecurityScore}</strong> means you're in the <strong>{riskInfo.level}</strong> category.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confidence</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {Math.round((predictionData?.prediction?.confidence || 0) * 100)}%
            </p>
            <p className="mt-1 text-xs text-slate-600">How sure we are</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Data Quality</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {predictionData?.reliability?.gate === 'high' ? 'High' : 
               predictionData?.reliability?.gate === 'medium' ? 'Good' : 'Fair'}
            </p>
            <p className="mt-1 text-xs text-slate-600">Analysis reliability</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Market</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {predictionData?.market_signals?.marketRegime || 'Stable'}
            </p>
            <p className="mt-1 text-xs text-slate-600">Current conditions</p>
          </div>
        </div>
      </div>

      {/* Your Skills vs Market */}
      {skills.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <HiTrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Your Skills vs Market Demand</h3>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            How well your skills match what companies are looking for right now
          </p>
          
          <div className="mt-4 space-y-3">
            {skills.slice(0, 6).map((skill, idx) => (
              <SkillMatchBar 
                key={idx}
                skill={skill.name}
                matchPercentage={skill.marketDemand}
                trending={skill.trending}
              />
            ))}
          </div>
          
          <div className="mt-4 rounded-xl bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-900">
              Overall Skill Match: {scores.marketAlignment || 0}%
            </p>
            <p className="mt-1 text-xs text-blue-700">
              {scores.marketAlignment >= 80 ? 'Excellent! Your skills are highly relevant.' :
               scores.marketAlignment >= 60 ? 'Good match. Consider adding trending skills.' :
               'Your skills need updating to match current market demand.'}
            </p>
          </div>
        </div>
      )}

      {/* What's Helping You */}
      {goodFactors.length > 0 && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
          <div className="flex items-center gap-2">
            <HiShieldCheck className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-900">What's Protecting Your Position</h3>
          </div>
          <div className="mt-4 space-y-3">
            {goodFactors.map((factor, idx) => (
              <div key={idx} className="flex gap-3 rounded-xl bg-white p-4">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                    <span className="text-sm font-bold text-emerald-700">✓</span>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{factor.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{factor.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What Needs Attention */}
      {badFactors.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
          <div className="flex items-center gap-2">
            <HiExclamationCircle className="h-5 w-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-slate-900">What Needs Your Attention</h3>
          </div>
          <div className="mt-4 space-y-3">
            {badFactors.map((factor, idx) => (
              <div key={idx} className="flex gap-3 rounded-xl bg-white p-4">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                    <span className="text-sm font-bold text-amber-700">!</span>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{factor.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{factor.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills You Should Add */}
      {skillGaps.length > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6">
          <div className="flex items-center gap-2">
            <HiLightBulb className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Skills to Add for Better Security</h3>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            These skills are in high demand for your role and will strengthen your position
          </p>
          <div className="mt-4 space-y-3">
            {skillGaps.map((gap, idx) => (
              <div key={idx} className="flex items-start gap-3 rounded-xl bg-white p-4">
                <div className={`flex-shrink-0 rounded-lg px-2 py-1 text-xs font-bold ${
                  gap.priority === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {gap.priority === 'critical' ? 'Must Have' : 'Important'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{gap.skill}</p>
                  <p className="mt-1 text-sm text-slate-600">{gap.reason}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 w-24 rounded-full bg-slate-200">
                      <div 
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${gap.marketDemand}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{gap.marketDemand}% market demand</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simple Action Steps */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">Your Next Steps</h3>
        <div className="mt-4 space-y-3">
          {(predictionData?.prediction?.improvement_tips || []).slice(0, 3).map((tip, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  {idx + 1}
                </div>
              </div>
              <p className="text-sm text-slate-700">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimplifiedResults;
