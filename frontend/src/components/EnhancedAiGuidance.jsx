import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  HiAcademicCap, 
  HiCheckCircle, 
  HiClock, 
  HiLightBulb, 
  HiTrendingUp,
  HiExclamationCircle,
} from "react-icons/hi";
import { API_BASE_URL } from "../config/api";

const EnhancedAiGuidance = ({ employeeData, predictionData, resumeIntelligence }) => {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!employeeData || !predictionData?.prediction) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const payload = {
          employeeData: {
            job_title: employeeData.job_title || "",
            tech_stack: employeeData.tech_stack || "",
            performance_rating: Number(employeeData.performance_rating) || 0,
            years_at_company: Number(employeeData.years_at_company) || 0,
            company_name: employeeData.company_name || "",
            department: employeeData.department || "",
            resume_insights: employeeData.resume_insights || {},
          },
          predictionData: {
            prediction: predictionData.prediction,
            data: predictionData.data || {},
            stack_survival: predictionData.stack_survival || null,
            market_signals: predictionData.market_signals || {},
            resume_insights: predictionData.resume_insights || {},
            trend_guidance: predictionData.trend_guidance || null,
            reliability: predictionData.reliability || {},
          },
        };

        const response = await axios.post(`${API_BASE_URL}/api/suggestions`, payload);
        if (!response.data?.success) {
          throw new Error(response.data?.message || "Unable to generate suggestions");
        }
        setSuggestions(response.data.suggestions);
      } catch (requestError) {
        setError(requestError.response?.data?.message || requestError.message || "Failed to generate suggestions.");
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [employeeData, predictionData]);

  // Build enhanced learning roadmap from AI suggestions
  const buildLearningRoadmap = () => {
    if (!suggestions) return [];
    
    const roadmap = [];
    
    // Get AI data - Gemini returns: skills, actions, opportunities, trends
    const aiSkills = suggestions.skills || [];
    const aiActions = suggestions.actions || [];
    const trends = suggestions.trends || {};
    const trendingStacks = trends.trending_tech_stacks || [];
    
    // Phase 1: AI-recommended skills (0-3 months)
    const criticalSkills = aiSkills.slice(0, 2);
    
    if (criticalSkills.length > 0) {
      roadmap.push({
        phase: "Phase 1: Critical Skills (AI Recommended)",
        timeline: "0-3 months",
        priority: "critical",
        skills: criticalSkills.map(skill => ({
          name: skill.name || 'Skill Development',
          reason: skill.why || 'Recommended by AI based on your profile',
          marketDemand: 90,
          steps: getLearningSteps(skill.name, 'beginner'),
          resources: getLearningResources(skill.name),
          milestones: getMilestones(skill.name),
        })),
      });
    }

    // Phase 2: AI-recommended actions (3-6 months)
    const importantActions = aiActions.slice(0, 2);
    
    if (importantActions.length > 0) {
      roadmap.push({
        phase: "Phase 2: Important Actions (AI Recommended)",
        timeline: "3-6 months",
        priority: "important",
        skills: importantActions.map(action => ({
          name: action.title || 'Career Development',
          reason: action.indicators || 'Recommended by AI for career growth',
          marketDemand: 85,
          steps: action.steps || getLearningSteps(action.title, 'intermediate'),
          resources: getLearningResources(action.title),
          milestones: getMilestones(action.title),
        })),
      });
    }

    // Phase 3: Trending skills from AI (6-12 months)
    const futureSkills = trendingStacks.slice(0, 2);
    if (futureSkills.length > 0) {
      roadmap.push({
        phase: "Phase 3: Future-Proof Skills (AI Trends)",
        timeline: "6-12 months",
        priority: "trending",
        skills: futureSkills.map(trend => ({
          name: trend.name || trend,
          reason: trend.why || 'Emerging trend identified by AI',
          marketDemand: 90,
          steps: getLearningSteps(trend.name || trend, 'advanced'),
          resources: getLearningResources(trend.name || trend),
          milestones: getMilestones(trend.name || trend),
        })),
      });
    }
    
    // If no AI recommendations, show message
    if (roadmap.length === 0) {
      return [{
        phase: "No Specific Recommendations",
        timeline: "Current",
        priority: "info",
        skills: [{
          name: "Your Skills Are Well-Aligned",
          reason: "AI analysis shows your current skills match market demands well. Focus on deepening expertise in your current stack.",
          marketDemand: 85,
          steps: ["Continue building projects with current skills", "Stay updated with latest versions and best practices", "Consider contributing to open source"],
          resources: { courses: [], docs: "", practice: "", certification: "" },
          milestones: [],
        }],
      }];
    }

    return roadmap;
  };

  // Get specific learning steps for each skill
  const getLearningSteps = (skill, level) => {
    const skillLower = skill.toLowerCase();
    
    const stepsBySkill = {
      'kubernetes': {
        beginner: [
          "Week 1-2: Complete 'Kubernetes for Beginners' course on Udemy",
          "Week 3-4: Set up local Kubernetes cluster with Minikube",
          "Week 5-6: Deploy your first application (simple web app)",
          "Week 7-8: Learn kubectl commands and pod management",
          "Week 9-10: Practice with 5 hands-on labs",
          "Week 11-12: Build a portfolio project with 3-tier app deployment",
        ],
        intermediate: [
          "Month 1: Master Services, Ingress, and ConfigMaps",
          "Month 2: Learn Helm charts and package management",
          "Month 3: Implement monitoring with Prometheus",
        ],
        advanced: [
          "Month 1-2: Study Kubernetes architecture deeply",
          "Month 3-4: Prepare for CKA certification",
          "Month 5-6: Build production-grade cluster",
        ],
      },
      'terraform': {
        beginner: [
          "Week 1-2: Complete 'Terraform Basics' on HashiCorp Learn",
          "Week 3-4: Write your first infrastructure code (AWS EC2)",
          "Week 5-6: Learn state management and modules",
          "Week 7-8: Build a complete VPC setup with Terraform",
          "Week 9-10: Practice with 3 real-world scenarios",
          "Week 11-12: Create portfolio project (multi-tier infrastructure)",
        ],
      },
      'docker': {
        beginner: [
          "Week 1-2: Complete 'Docker Essentials' course",
          "Week 3-4: Containerize your first application",
          "Week 5-6: Learn Docker Compose for multi-container apps",
          "Week 7-8: Build and push images to Docker Hub",
          "Week 9-10: Practice with 5 different applications",
          "Week 11-12: Create a microservices project with Docker",
        ],
      },
      'aws': {
        beginner: [
          "Week 1-2: Complete AWS Cloud Practitioner course",
          "Week 3-4: Set up AWS account and explore console",
          "Week 5-6: Deploy application on EC2 and S3",
          "Week 7-8: Learn IAM, VPC, and security basics",
          "Week 9-10: Practice with 5 AWS services",
          "Week 11-12: Build a serverless application with Lambda",
        ],
      },
      'react': {
        beginner: [
          "Week 1-2: Complete 'React Fundamentals' course",
          "Week 3-4: Build 3 simple components",
          "Week 5-6: Learn hooks (useState, useEffect)",
          "Week 7-8: Create a todo app with React",
          "Week 9-10: Learn React Router and state management",
          "Week 11-12: Build a complete portfolio website",
        ],
      },
      'python': {
        beginner: [
          "Week 1-2: Complete 'Python for Beginners' course",
          "Week 3-4: Learn data structures and functions",
          "Week 5-6: Build 5 small projects (calculator, file manager, etc.)",
          "Week 7-8: Learn OOP concepts in Python",
          "Week 9-10: Work with APIs and web scraping",
          "Week 11-12: Create a data analysis project with pandas",
        ],
      },
    };

    return stepsBySkill[skillLower]?.[level] || [
      `Week 1-4: Complete beginner course for ${skill}`,
      `Week 5-8: Build 3 practice projects`,
      `Week 9-12: Create 1 portfolio project`,
    ];
  };

  // Get learning resources for each skill
  const getLearningResources = (skill) => {
    const skillLower = skill.toLowerCase();
    
    const resourcesBySkill = {
      'kubernetes': {
        courses: [
          { name: "Kubernetes for Beginners", platform: "Udemy", duration: "8 hours", price: "₹500" },
          { name: "Kubernetes Certified Administrator", platform: "Linux Academy", duration: "40 hours", price: "₹2000/month" },
        ],
        docs: "https://kubernetes.io/docs/",
        practice: "https://labs.play-with-k8s.com/",
        certification: "CKA (Certified Kubernetes Administrator) - ₹25,000",
      },
      'terraform': {
        courses: [
          { name: "Terraform Basics", platform: "HashiCorp Learn", duration: "6 hours", price: "Free" },
          { name: "Terraform Associate", platform: "Udemy", duration: "12 hours", price: "₹500" },
        ],
        docs: "https://developer.hashicorp.com/terraform/docs",
        practice: "https://learn.hashicorp.com/terraform",
        certification: "Terraform Associate - ₹15,000",
      },
      'docker': {
        courses: [
          { name: "Docker Essentials", platform: "Udemy", duration: "6 hours", price: "₹500" },
          { name: "Docker Deep Dive", platform: "Pluralsight", duration: "10 hours", price: "₹1500/month" },
        ],
        docs: "https://docs.docker.com/",
        practice: "https://labs.play-with-docker.com/",
        certification: "Docker Certified Associate - ₹20,000",
      },
      'aws': {
        courses: [
          { name: "AWS Cloud Practitioner", platform: "AWS Training", duration: "8 hours", price: "Free" },
          { name: "AWS Solutions Architect", platform: "Udemy", duration: "30 hours", price: "₹500" },
        ],
        docs: "https://docs.aws.amazon.com/",
        practice: "https://aws.amazon.com/free/",
        certification: "AWS Solutions Architect Associate - ₹12,000",
      },
      'react': {
        courses: [
          { name: "React Fundamentals", platform: "freeCodeCamp", duration: "10 hours", price: "Free" },
          { name: "React Complete Guide", platform: "Udemy", duration: "40 hours", price: "₹500" },
        ],
        docs: "https://react.dev/",
        practice: "https://react.dev/learn",
        certification: "Meta React Developer - ₹3,000",
      },
      'python': {
        courses: [
          { name: "Python for Beginners", platform: "Coursera", duration: "20 hours", price: "Free" },
          { name: "Python Complete Bootcamp", platform: "Udemy", duration: "40 hours", price: "₹500" },
        ],
        docs: "https://docs.python.org/3/",
        practice: "https://www.hackerrank.com/domains/python",
        certification: "PCAP (Python Certified Associate) - ₹8,000",
      },
    };

    return resourcesBySkill[skillLower] || {
      courses: [
        { name: `${skill} Fundamentals`, platform: "Udemy", duration: "10 hours", price: "₹500" },
      ],
      docs: `Search: ${skill} official documentation`,
      practice: `Search: ${skill} practice labs`,
      certification: `Search: ${skill} certification`,
    };
  };

  // Get milestones for tracking progress
  const getMilestones = (skill) => {
    return [
      { week: 4, milestone: "Complete beginner course", status: "pending" },
      { week: 8, milestone: "Build first practice project", status: "pending" },
      { week: 12, milestone: "Complete portfolio project", status: "pending" },
      { week: 16, milestone: "Ready for certification (optional)", status: "pending" },
    ];
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3 text-slate-600">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
          <p className="text-sm">Building your personalized learning roadmap...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
        <div className="flex items-start gap-3">
          <HiExclamationCircle className="mt-0.5 h-5 w-5 text-rose-700" />
          <div>
            <p className="text-sm font-semibold text-rose-800">Could not generate learning roadmap</p>
            <p className="mt-1 text-sm text-rose-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!suggestions) {
    return null;
  }

  const roadmap = buildLearningRoadmap();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-5">
        <div className="flex items-start gap-3">
          <HiAcademicCap className="mt-0.5 h-6 w-6 text-blue-700" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Your Personalized Learning Roadmap</h2>
            <p className="mt-1 text-sm text-slate-600">
              Clear, step-by-step plan to improve your job security. Each skill includes specific courses, 
              practice projects, and timelines.
            </p>
          </div>
        </div>
      </div>

      {/* Roadmap Phases */}
      {roadmap.map((phase, phaseIdx) => (
        <div key={phaseIdx} className="rounded-2xl border border-slate-200 bg-white p-6">
          {/* Phase Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  phase.priority === 'critical' ? 'bg-rose-100 text-rose-700' :
                  phase.priority === 'important' ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {phaseIdx + 1}
                </span>
                <h3 className="text-lg font-semibold text-slate-900">{phase.phase}</h3>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                <HiClock className="h-4 w-4" />
                <span>{phase.timeline}</span>
                {phase.priority === 'critical' && (
                  <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                    High Priority
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Skills in this phase */}
          <div className="mt-6 space-y-6">
            {phase.skills.map((skill, skillIdx) => (
              <div key={skillIdx} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                {/* Skill Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">{skill.name}</h4>
                    <p className="mt-1 text-sm text-slate-600">{skill.reason}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-2 w-32 rounded-full bg-slate-200">
                        <div 
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${skill.marketDemand}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{skill.marketDemand}% market demand</span>
                    </div>
                  </div>
                  <HiTrendingUp className="h-5 w-5 text-blue-600" />
                </div>

                {/* Learning Steps */}
                <div className="mt-4">
                  <p className="text-sm font-semibold text-slate-900">📚 Learning Path:</p>
                  <ul className="mt-2 space-y-2">
                    {skill.steps.map((step, stepIdx) => (
                      <li key={stepIdx} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {stepIdx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Resources */}
                <div className="mt-4 rounded-lg bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">🎓 Recommended Resources:</p>
                  <div className="mt-3 space-y-2">
                    {skill.resources.courses.map((course, courseIdx) => (
                      <div key={courseIdx} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium text-slate-900">{course.name}</span>
                          <span className="ml-2 text-slate-500">({course.platform})</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                          <span>{course.duration}</span>
                          <span className="font-semibold text-blue-600">{course.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    <p>📖 Documentation: <a href={skill.resources.docs} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{skill.resources.docs}</a></p>
                    <p>🧪 Practice Labs: {skill.resources.practice}</p>
                    <p>🏆 Certification: {skill.resources.certification}</p>
                  </div>
                </div>

                {/* Milestones */}
                <div className="mt-4">
                  <p className="text-sm font-semibold text-slate-900">🎯 Milestones:</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {skill.milestones.map((milestone, milestoneIdx) => (
                      <div key={milestoneIdx} className="flex items-center gap-2 rounded-lg bg-white p-3 text-sm">
                        <HiCheckCircle className="h-4 w-4 text-slate-400" />
                        <div>
                          <span className="font-medium text-slate-900">Week {milestone.week}:</span>
                          <span className="ml-1 text-slate-600">{milestone.milestone}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Summary */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5">
        <div className="flex items-start gap-3">
          <HiLightBulb className="mt-0.5 h-5 w-5 text-emerald-700" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">Pro Tips for Success:</p>
            <ul className="mt-2 space-y-1 text-sm text-emerald-800">
              <li>• Dedicate 1-2 hours daily for consistent learning</li>
              <li>• Build projects while learning (don't just watch videos)</li>
              <li>• Join online communities for each technology</li>
              <li>• Update your resume after completing each milestone</li>
              <li>• Share your projects on GitHub and LinkedIn</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAiGuidance;
