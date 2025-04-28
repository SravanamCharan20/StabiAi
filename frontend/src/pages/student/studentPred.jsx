/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  HiOutlineAcademicCap,
  HiOutlineChip,
  HiOutlineBriefcase,
  HiOutlineDocumentText,
  HiOutlineUser,
  HiOutlineStar,
  HiCheckCircle,
  HiExclamationCircle,
  HiInformationCircle,
} from "react-icons/hi";
import StudentAiSuggestions from "./StudentAiSuggestions";

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

const JobStabilitySnapshot = ({ predictionData, studentData }) => {
  const stabilityScore = predictionData?.job_stability_score || 0;
  const riskConfig = {
    high: { color: "green-500", icon: HiCheckCircle, tip: "You're well-positioned for job stability." },
    medium: {
      color: "yellow-500",
      icon: HiInformationCircle,
      tip: "Consider enhancing your skills to improve stability.",
    },
    low: { color: "red-500", icon: HiExclamationCircle, tip: "Focus on building relevant skills and experience." },
  };

  const riskLevel = stabilityScore >= 80 ? "high" : stabilityScore >= 50 ? "medium" : "low";
  const { color, icon: Icon, tip } = riskConfig[riskLevel];

  // Calculate stability factors
  const stabilityFactors = [
    {
      label: "Academic Performance",
      score: Math.min((Number(studentData.cgpa || 0) / 10) * 100, 100),
      description: "Strong academic performance enhances job prospects.",
    },
    {
      label: "Experience",
      score: Math.min((Number(studentData.years_of_coding_experience || 0) / 5) * 100, 100),
      description: "Practical experience is highly valued by employers.",
    },
    {
      label: "Skills Match",
      score: studentData.primary_tech_stack ? 80 : 40,
      description: "Relevant tech stack knowledge increases employability.",
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
            Your Job Stability
          </h2>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full bg-${color}/10 text-${color} font-semibold text-sm`}
          >
            <Icon className="w-5 h-5" />
            {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Stability
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Stability Overview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Stability Overview</h3>
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
                  strokeDashoffset={351.86 * (1 - stabilityScore / 100)}
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
                  {Math.round(stabilityScore)}%
                </span>
                <p className="text-sm text-gray-500">Stability Score</p>
              </div>
            </div>
            <p className="text-gray-600">
              Your job stability is <span className={`text-${color} font-semibold`}>{riskLevel}</span>. {tip}
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

const StudentPred = () => {
  const [formData, setFormData] = useState({
    cgpa: "",
    degree: "",
    college_tier: "",
    years_of_coding_experience: "",
    hackathon_participation: "",
    primary_tech_stack: "",
    skills: "",
    certifications: "",
    project_tech_stacks: "",
    internship_tech_stacks: "",
    preferred_job_title: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        "http://localhost:9000/api/student/predict",
        formData
      );
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
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
          Student Job Stability Predictor
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Understand your job stability and get personalized strategies to boost your career
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <FloatingInput
            icon={HiOutlineAcademicCap}
            label="CGPA"
            type="number"
            name="cgpa"
            value={formData.cgpa}
            onChange={handleChange}
            min="0"
            max="10"
            step="0.1"
          />
          <FloatingInput
            icon={HiOutlineAcademicCap}
            label="Degree"
            name="degree"
            value={formData.degree}
            onChange={handleChange}
            options={["B.Tech", "B.Sc", "BCA", "M.Tech"]}
          />
          <FloatingInput
            icon={HiOutlineAcademicCap}
            label="College Tier"
            name="college_tier"
            value={formData.college_tier}
            onChange={handleChange}
            options={["Tier 1", "Tier 2", "Tier 3"]}
          />
          <FloatingInput
            icon={HiOutlineChip}
            label="Coding Experience (Years)"
            type="number"
            name="years_of_coding_experience"
            value={formData.years_of_coding_experience}
            onChange={handleChange}
            step="0.5"
          />
          <FloatingInput
            icon={HiOutlineUser}
            label="Hackathon Participation"
            type="number"
            name="hackathon_participation"
            value={formData.hackathon_participation}
            onChange={handleChange}
          />
          <FloatingInput
            icon={HiOutlineChip}
            label="Primary Tech Stack"
            name="primary_tech_stack"
            value={formData.primary_tech_stack}
            onChange={handleChange}
            options={["Web", "Mobile", "AI/ML", "Cloud"]}
          />
          <FloatingInput
            icon={HiOutlineStar}
            label="Skills (comma separated)"
            type="text"
            name="skills"
            value={formData.skills}
            onChange={handleChange}
          />
          <FloatingInput
            icon={HiOutlineDocumentText}
            label="Certifications (comma separated)"
            type="text"
            name="certifications"
            value={formData.certifications}
            onChange={handleChange}
          />
          <FloatingInput
            icon={HiOutlineDocumentText}
            label="Project Tech Stack"
            type="text"
            name="project_tech_stacks"
            value={formData.project_tech_stacks}
            onChange={handleChange}
          />
          <FloatingInput
            icon={HiOutlineDocumentText}
            label="Internship Tech Stack"
            type="text"
            name="internship_tech_stacks"
            value={formData.internship_tech_stacks}
            onChange={handleChange}
          />
          <FloatingInput
            icon={HiOutlineBriefcase}
            label="Preferred Job Title"
            type="text"
            name="preferred_job_title"
            value={formData.preferred_job_title}
            onChange={handleChange}
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
              {loading ? "Processing..." : "Analyze Stability"}
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
          <JobStabilitySnapshot predictionData={result} studentData={formData} />
          <StudentAiSuggestions
            studentData={formData}
            predictionData={result}
            loading={loading}
          />
        </motion.div>
      )}
    </div>
  );
};

export default StudentPred;