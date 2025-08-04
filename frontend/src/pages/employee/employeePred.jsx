/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  HiOutlineOfficeBuilding,
  HiOutlineLocationMarker,
  HiOutlineCalendar,
  HiOutlineBriefcase,
  HiOutlineUserGroup,
  HiOutlineHome,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiOutlineChartBar,
  HiCheckCircle,
  HiExclamationCircle,
  HiInformationCircle,
} from "react-icons/hi";
import AiSuggestions from "./aiSuggestions";

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

const CareerStabilitySnapshot = ({ predictionData, employeeData }) => {
  const riskLevel = predictionData?.prediction?.layoff_risk || "Unknown";
  const riskConfig = {
    low: { color: "green-500", icon: HiCheckCircle, tip: "Keep enhancing your skills to stay competitive." },
    moderate: {
      color: "yellow-500",
      icon: HiInformationCircle,
      tip: "Consider immediate actions to strengthen your position.",
    },
    high: { color: "red-500", icon: HiExclamationCircle, tip: "Prioritize upskilling and networking now." },
    unknown: { color: "gray-500", icon: HiInformationCircle, tip: "Complete your profile for better insights." },
  };
  const { color, icon: Icon, tip } = riskConfig[riskLevel.toLowerCase()] || riskConfig.unknown;

  // Calculate stability factors
  const stabilityFactors = [
    {
      label: "Tenure",
      score: Math.min((Number(employeeData.years_at_company || 0) / 5) * 100, 100),
      description:
        Number(employeeData.years_at_company || 0) >= 3
          ? "Long tenure strengthens your position."
          : "Recent hires may need to prove impact.",
    },
    {
      label: "Performance",
      score: Math.min((Number(employeeData.performance_rating || 0) / 5) * 100, 100),
      description:
        Number(employeeData.performance_rating || 0) >= 4
          ? "Strong performance boosts stability."
          : "Improving ratings can reduce risk.",
    },
    {
      label: "Role Demand",
      score:
        employeeData.job_title?.toLowerCase().includes("engineer") ||
        employeeData.job_title?.toLowerCase().includes("data")
          ? 80
          : 50,
      description: "High-demand roles offer more security.",
    },
  ];

  // Calculate confidence
  const calculateConfidence = () => {
    const fields = [
      "company_name",
      "company_location",
      "reporting_quarter",
      "job_title",
      "department",
      "remote_work",
      "years_at_company",
      "salary_range",
      "performance_rating",
    ];
    const nonEmptyFields = fields.filter((field) => employeeData[field] !== "" && employeeData[field] != null).length;
    const completenessScore = (nonEmptyFields / fields.length) * 100;

    let validFields = 0;
    if (Number(employeeData.years_at_company || 0) >= 0) validFields++;
    if (
      Number(employeeData.performance_rating || 0) >= 1 &&
      Number(employeeData.performance_rating || 0) <= 5
    ) validFields++;
    if (employeeData.job_title) validFields++;
    const qualityScore = (validFields / 3) * 100;

    const stabilityScore =
      stabilityFactors.reduce((sum, factor) => sum + factor.score, 0) / stabilityFactors.length;

    let confidence = (0.4 * completenessScore + 0.3 * qualityScore + 0.3 * stabilityScore) / 100;

    if (riskLevel.toLowerCase() === "high" && nonEmptyFields < 6) {
      confidence *= 0.8;
    } else if (riskLevel.toLowerCase() === "low" && nonEmptyFields < 6) {
      confidence *= 0.9;
    }

    return Math.min(Math.max(confidence, 0.5), 0.95);
  };

  const confidence = calculateConfidence();

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
            Your Career Stability
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
                  strokeDashoffset={351.86 * (1 - confidence)}
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
                  {(confidence * 100).toFixed(0)}%
                </span>
                <p className="text-sm text-gray-500">Confidence</p>
              </div>
            </div>
            <p className="text-gray-600">
              Your predicted layoff risk is <span className={`text-${color} font-semibold`}>{riskLevel}</span>. {tip}
            </p>
            <p className="text-sm text-gray-500">
              Explore the tabs below for personalized actions to improve your stability.
            </p>
          </div>

          {/* Stability Factors */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Stability Factors</h3>
            <div className="space-y-4">
              {stabilityFactors.map((factor, index) => (
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
                      style={{ width: `${factor.score}%` }} // Fallback inline style
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

const EmployeePred = () => {
  const [formData, setFormData] = useState({
    company_name: "",
    company_location: "",
    reporting_quarter: "",
    job_title: "",
    department: "",
    remote_work: "",
    years_at_company: "",
    salary_range: "",
    performance_rating: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [predictionData, setPredictionData] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post("https://stabiai-production.up.railway.app/api/employee/predict", formData);
      console.log("Prediction Response:", response.data);
      setPredictionData(response.data);
    } catch (error) {
      console.error("Prediction Error:", error.response?.data, error.message);
      setError(error.response?.data?.message || error.message || "Failed to predict risk");
    } finally {
      setLoading(false);
    }
  };

  const renderPredictionResult = () => {
    if (loading) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 flex items-center justify-center"
        >
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
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
      );
    }

    if (!predictionData || !predictionData.prediction) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-8 space-y-8"
      >
        <CareerStabilitySnapshot predictionData={predictionData} employeeData={formData} />
        <AiSuggestions
          employeeData={formData}
          predictionData={predictionData}
          loading={loading}
        />
      </motion.div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl sm:text-5xl font-medium p-2 mt-5 bg-gradient-to-r from-slate-800 to-purple-600 text-transparent bg-clip-text">
          Employee Risk Assessment
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Discover your career stability and get personalized recommendations
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <FloatingInput
            icon={HiOutlineOfficeBuilding}
            label="Company"
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            options={["TCS", "Infosys", "Wipro", "HCL", "Tech Mahindra"]}
          />
          <FloatingInput
            icon={HiOutlineLocationMarker}
            label="Location"
            name="company_location"
            value={formData.company_location}
            onChange={handleChange}
            options={["Bangalore", "Mumbai", "Hyderabad", "Chennai", "Pune"]}
          />
          <FloatingInput
            icon={HiOutlineCalendar}
            label="Quarter"
            name="reporting_quarter"
            value={formData.reporting_quarter}
            onChange={handleChange}
            options={["Q1-2023", "Q2-2025", "Q3-2025", "Q4-2025"]}
          />
          <FloatingInput
            icon={HiOutlineBriefcase}
            label="Job Title"
            name="job_title"
            value={formData.job_title}
            onChange={handleChange}
            options={[
              "Software Engineer",
              "Senior Software Engineer",
              "Technical Lead",
              "Project Manager",
              "Data Scientist",
            ]}
          />
          <FloatingInput
            icon={HiOutlineUserGroup}
            label="Department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            options={["Engineering", "Product", "Data Science", "DevOps"]}
          />
          <FloatingInput
            icon={HiOutlineHome}
            label="Remote Work"
            name="remote_work"
            value={formData.remote_work}
            onChange={handleChange}
            options={["Yes", "No"]}
          />
          <FloatingInput
            icon={HiOutlineClock}
            label="Years at Company"
            type="number"
            name="years_at_company"
            value={formData.years_at_company}
            onChange={handleChange}
            min="0"
            step="0.5"
          />
          <FloatingInput
            icon={HiOutlineCurrencyDollar}
            label="Salary (LPA)"
            type="number"
            name="salary_range"
            value={formData.salary_range}
            onChange={handleChange}
            min="0"
            step="0.5"
          />
          <FloatingInput
            icon={HiOutlineChartBar}
            label="Performance Rating"
            type="number"
            name="performance_rating"
            value={formData.performance_rating}
            onChange={handleChange}
            min="1"
            max="5"
            step="0.1"
          />
        </div>

        <div className="flex justify-center mt-8">
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
              {loading ? "Processing..." : "Analyze Risk"}
            </span>
          </button>
        </div>
      </form>

      {renderPredictionResult()}
    </div>
  );
};

export default EmployeePred;