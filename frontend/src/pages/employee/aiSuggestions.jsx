/* eslint-disable no-case-declarations */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
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
  HiExclamationCircle,
} from "react-icons/hi";

const EmptyState = ({ message = "No Valid Suggestions" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="text-center py-12"
  >
    <HiExclamationCircle className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-sm font-semibold text-gray-900">{message}</h3>
    <p className="mt-1 text-sm text-gray-500">
      We’re working on generating better recommendations.
    </p>
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
            <h4 className="text-sm font-medium text-indigo-900 mb-2">
              Why It Matters
            </h4>
            <p className="text-indigo-700">{skill.why}</p>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
              How to Acquire
            </h4>
            <ul className="space-y-2">
              {skill.how
                .split(".")
                .filter((step) => step.trim())
                .map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-600 font-medium">
                      {idx + 1}.
                    </span>
                    <span className="text-gray-600">{step.trim()}</span>
                  </li>
                ))}
            </ul>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
              Expected Impact
            </h4>
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
            <h3 className="text-lg font-semibold text-gray-900">
              {action.title}
            </h3>
            <p className="text-sm text-green-600">{action.timeline}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-900 mb-2">
              Implementation Steps
            </h4>
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
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
              Success Indicators
            </h4>
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
            <h3 className="text-lg font-semibold text-gray-900">
              {opportunity.title}
            </h3>
            <p className="text-sm text-purple-600">{opportunity.timeline}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-purple-900 mb-2">
              Requirements
            </h4>
            <p className="text-purple-700">{opportunity.requirements}</p>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
              Potential Impact
            </h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-700">{opportunity.impact}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AiSuggestions = ({ employeeData, predictionData, loading }) => {
  const [suggestions, setSuggestions] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("skills");

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!employeeData || !predictionData) return;
      setIsLoading(true);
      setError(null);
      try {
        const formattedEmployeeData = {
          job_title: employeeData.job_title || "",
          performance_rating: Number(employeeData.performance_rating) || 0,
          years_at_company: Number(employeeData.years_at_company) || 0,
          company_name: employeeData.company_name || "",
          company_location: employeeData.company_location || "",
          reporting_quarter: employeeData.reporting_quarter || "",
          department: employeeData.department || "",
          remote_work: employeeData.remote_work || "",
          salary_range: employeeData.salary_range || "",
        };

        const formattedPredictionData = {
          prediction: {
            layoff_risk: predictionData.prediction?.layoff_risk || "moderate",
          },
          data: {
            revenue_growth: Number(predictionData.data?.revenue_growth) || 0,
          },
        };

        console.log("Sending:", {
          employeeData: formattedEmployeeData,
          predictionData: formattedPredictionData,
        });
        const response = await axios.post(
          "https://stabiai-production.up.railway.app/api/suggestions",
          {
            employeeData: formattedEmployeeData,
            predictionData: formattedPredictionData,
          }
        );
        console.log("Response:", response.data);
        if (response.data.success) {
          setSuggestions(response.data.suggestions);
        } else {
          throw new Error(
            response.data.message || "Failed to generate suggestions"
          );
        }
      } catch (err) {
        console.error("Axios Error:", err.response?.data, err.message);
        setError(
          `Failed to fetch suggestions: ${err.message}${
            err.response ? ` (Status: ${err.response.status})` : ""
          }`
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [employeeData, predictionData]);

  const tabs = [
    { id: "skills", label: "Skills", icon: HiCode },
    { id: "immediateActions", label: "Immediate Actions", icon: HiShieldCheck },
    { id: "strategicActions", label: "Strategic Actions", icon: HiPuzzle },
    { id: "opportunities", label: "Opportunities", icon: HiStar },
  ];

  const renderContent = () => {
    if (!suggestions) return null;

    switch (activeTab) {
      case "skills":
        return suggestions.skills.length ? (
          suggestions.skills.map((skill, index) => (
            <SkillCard key={index} skill={skill} index={index} />
          ))
        ) : (
          <EmptyState message="No Skills Suggested" />
        );
      case "immediateActions":
        // Filter actions with shorter timelines (e.g., <= 3 months)
        const immediateActions = suggestions.actions.filter(
          (action) =>
            action.timeline.includes("1") ||
            action.timeline.includes("2") ||
            action.timeline.includes("3")
        );
        return immediateActions.length ? (
          immediateActions.map((action, index) => (
            <ActionCard key={index} action={action} index={index} />
          ))
        ) : (
          <EmptyState message="No Immediate Actions Suggested" />
        );
      case "strategicActions":
        // Filter actions with longer timelines (e.g., > 3 months) or all actions
        const strategicActions = suggestions.actions.filter(
          (action) =>
            !action.timeline.includes("1") &&
            !action.timeline.includes("2") &&
            !action.timeline.includes("3")
        ).length
          ? suggestions.actions.filter(
              (action) =>
                !action.timeline.includes("1") &&
                !action.timeline.includes("2") &&
                !action.timeline.includes("3")
            )
          : suggestions.actions;
        return strategicActions.length ? (
          strategicActions.map((action, index) => (
            <ActionCard key={index} action={action} index={index} />
          ))
        ) : (
          <EmptyState message="No Strategic Actions Suggested" />
        );
      case "opportunities":
        return suggestions.opportunities.length ? (
          suggestions.opportunities.map((opportunity, index) => (
            <OpportunityCard
              key={index}
              opportunity={opportunity}
              index={index}
            />
          ))
        ) : (
          <EmptyState message="No Opportunities Suggested" />
        );
      default:
        return null;
    }
  };

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
          <p className="text-gray-600 animate-pulse">
            Creating your personalized action plan...
          </p>
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
          <h3 className="text-red-800 font-semibold text-lg mb-2">
            Unable to Generate Action Plan
          </h3>
          <p className="text-red-600">
            {error.includes("Invalid predictionData")
              ? "Missing required data. Please check your input."
              : error.includes("Gemini API")
              ? "Issue with suggestion service. Please try again later."
              : error}
          </p>
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

  return (
    <div className="mt-8">
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Your Career Action Plan
        </h1>
        <p className="mt-2 text-gray-600">
          Focused strategies to strengthen your position and accelerate growth
        </p>
        <div className="mt-4 inline-flex items-center px-4 py-2 cursor-pointer rounded-lg bg-blue-100 text-blue-700 text-sm">
          Risk Level: {predictionData?.prediction?.layoff_risk || "Unknown"}
        </div>
      </div>

      {suggestions && (
        <>
          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-full bg-gray-100 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-4 px-5 py-3 rounded-full cursor-pointer text-sm font-medium transition-colors duration-200 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-slate-700 to-purple-600 text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default AiSuggestions;