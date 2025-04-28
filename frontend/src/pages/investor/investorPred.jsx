/* eslint-disable no-unused-vars */
import React, { useState } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import {
  HiOutlineOfficeBuilding,
  HiOutlineChartBar,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiCheckCircle,
  HiExclamationCircle,
  HiInformationCircle,
  HiOutlineSearch,
} from 'react-icons/hi'

const FloatingInput = ({ icon: Icon, label, type, name, value, onChange, options, min, max, step }) => (
  <div className="relative group">
    <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-white rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity" />
    <div className="relative bg-white shadow-sm rounded-2xl p-4 hover:shadow-md transition-all border border-gray-200">
      <div className="flex items-center gap-3 text-gray-600">
        <Icon className="text-xl" />
        <label className="text-sm font-medium">{label}</label>
      </div>
      {options ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full mt-2 bg-transparent border-none text-gray-900 text-base focus:ring-0 focus:outline-none"
        >
          <option value="">Select {label}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          className="w-full mt-2 bg-transparent border-none text-gray-900 text-base focus:ring-0 focus:outline-none"
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      )}
    </div>
  </div>
);

const CompanyRiskSnapshot = ({ predictionData }) => {
  const riskLevel = predictionData?.predictedData?.risk_label?.toLowerCase() || "unknown";
  const probability = predictionData?.predictedData?.probability || 0;
  
  const riskConfig = {
    low: { color: "green-500", icon: HiCheckCircle, tip: "Company shows strong stability indicators." },
    medium: {
      color: "yellow-500",
      icon: HiInformationCircle,
      tip: "Monitor company performance closely.",
    },
    high: { color: "red-500", icon: HiExclamationCircle, tip: "Exercise caution and review investment strategy." },
    unknown: { color: "gray-500", icon: HiInformationCircle, tip: "Insufficient data for risk assessment." },
  };

  const { color, icon: Icon, tip } = riskConfig[riskLevel] || riskConfig.unknown;

  // Calculate risk factors
  const riskFactors = [
    {
      label: "Financial Health",
      score: Math.min((1 - probability) * 100, 100),
      description: "Based on financial metrics and market position.",
    },
    {
      label: "Market Position",
      score: riskLevel === "low" ? 80 : riskLevel === "medium" ? 50 : 30,
      description: "Company's competitive position in the market.",
    },
    {
      label: "Growth Potential",
      score: riskLevel === "low" ? 75 : riskLevel === "medium" ? 45 : 25,
      description: "Future growth opportunities and market trends.",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative mb-8"
    >
      <div className="relative bg-white shadow-lg rounded-3xl p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Company Risk Assessment
          </h2>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full bg-${color}/10 text-${color} font-semibold text-sm`}
          >
            <Icon className="w-5 h-5" />
            {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Risk Overview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Risk Overview</h3>
            <div className="relative flex items-center justify-center">
              <svg className="w-32 h-32">
                <circle
                  className="text-gray-200"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="56"
                  cx="64"
                  cy="64"
                />
                <circle
                  className={`text-${color}`}
                  strokeWidth="8"
                  strokeDasharray="351.86"
                  strokeDashoffset={351.86 * (1 - probability)}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="56"
                  cx="64"
                  cy="64"
                  transform="rotate(-90 64 64)"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-bold text-gray-900">
                  {(probability * 100).toFixed(1)}%
                </span>
                <p className="text-sm text-gray-500">Risk Probability</p>
              </div>
            </div>
            <p className="text-gray-600">
              Risk level is <span className={`text-${color} font-semibold`}>{riskLevel}</span>. {tip}
            </p>
          </div>

          {/* Risk Factors */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Risk Factors</h3>
            <div className="space-y-4">
              {riskFactors.map((factor, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="bg-gray-50 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{factor.label}</span>
                    <span className="text-sm text-gray-600">{Math.round(factor.score)}%</span>
                  </div>
                  <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${factor.score}%` }}
                      transition={{ duration: 0.6, delay: index * 0.2 }}
                      className="absolute h-full bg-blue-900 rounded-full"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{factor.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AiSuggestions = ({ suggestions }) => {
  const [activeTab, setActiveTab] = useState('alerts');

  const toggleTab = (tab) => setActiveTab(tab);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative bg-white shadow-lg rounded-3xl p-6 md:p-8"
    >
      <div className="flex justify-center gap-2 rounded-full bg-gray-100 p-1 mb-6">
        {['alerts', 'opportunities', 'recommendations'].map((tab) => (
          <button
            key={tab}
            onClick={() => toggleTab(tab)}
            className={`px-5 py-2 rounded-full text-sm sm:text-base transition font-medium ${
              activeTab === tab
                ? 'bg-gradient-to-r from-slate-700 to-purple-600 text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {activeTab === 'alerts' && (
          <>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">⚠️ Alerts</h3>
            <ul className="space-y-4">
              {suggestions?.alerts?.map((alert, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-gray-700 bg-gray-50 p-4 rounded-xl"
                >
                  <p className="font-medium text-gray-900">Alert: {alert.alert}</p>
                  <p className="text-sm mt-1">
                    <span className="font-medium">Urgency:</span> {alert.urgency}
                  </p>
                </motion.li>
              ))}
            </ul>
          </>
        )}

        {activeTab === 'opportunities' && (
          <>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">🌱 Opportunities</h3>
            <ul className="space-y-4">
              {suggestions?.opportunities?.map((op, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-gray-700 bg-gray-50 p-4 rounded-xl"
                >
                  <p className="font-medium text-gray-900">Opportunity: {op.opportunity}</p>
                  <p className="text-sm mt-1">
                    <span className="font-medium">Impact:</span> {op.impact}
                  </p>
                  <p className="text-sm mt-1">
                    <span className="font-medium">Requirements:</span> {op.requirements}
                  </p>
                  <p className="text-sm mt-1">
                    <span className="font-medium">Timeline:</span> {op.timeline}
                  </p>
                </motion.li>
              ))}
            </ul>
          </>
        )}

        {activeTab === 'recommendations' && (
          <>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">💡 Recommendations</h3>
            <ul className="space-y-6">
              {suggestions?.recommendations?.map((rec, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-gray-700 bg-gray-50 p-4 rounded-xl"
                >
                  <p className="font-medium text-gray-900">Action: {rec.action}</p>
                  <p className="text-sm mt-1">
                    <span className="font-medium">Timeline:</span> {rec.timeline}
                  </p>
                  <p className="text-sm mt-2 font-medium">Steps:</p>
                  <ul className="ml-5 list-disc text-sm mt-1">
                    {rec.steps?.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                  <p className="text-sm mt-2">
                    <span className="font-medium">Indicators:</span> {rec.indicators}
                  </p>
                </motion.li>
              ))}
            </ul>
          </>
        )}
      </div>
    </motion.div>
  );
};

const InvestorPred = () => {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('http://localhost:9000/api/investor/predict', {
        company: search,
      });
      setResult(response.data);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to analyze company risk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl sm:text-5xl font-medium p-2 mt-5 bg-gradient-to-r from-slate-800 to-purple-600 text-transparent bg-clip-text">
          Company Risk Predictor
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Analyze company performance and uncover hidden risks using AI-driven insights
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <form onSubmit={handleSearch} className="space-y-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-white rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative bg-white shadow-sm rounded-2xl p-4 hover:shadow-md transition-all border border-gray-200">
              <div className="flex items-center gap-3 text-gray-600">
                <HiOutlineSearch className="text-xl" />
                <label className="text-sm font-medium">Company Name</label>
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full mt-2 bg-transparent border-none text-gray-900 text-base focus:ring-0 focus:outline-none"
                placeholder="Enter company name (e.g., Apple, Microsoft, Google)"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="
                relative text-md px-8 py-3 rounded-full bg-slate-800 text-white
                hover:bg-gradient-to-r from-slate-800 to-purple-700 focus:ring-2 cursor-pointer focus:ring-slate-500 focus:ring-offset-2
                transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <span className="text-md font-medium tracking-wide">
                {loading ? "Analyzing..." : "Analyze Risk"}
              </span>
            </button>
          </div>
        </form>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 relative"
          >
            <div className="bg-red-50 border border-red-100 rounded-xl p-6">
              <h3 className="text-red-800 font-semibold text-lg mb-2">Error</h3>
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-8 space-y-8"
          >
            <CompanyRiskSnapshot predictionData={result} />
            <AiSuggestions suggestions={result.aiSuggestions} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default InvestorPred;