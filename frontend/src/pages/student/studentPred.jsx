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
} from "react-icons/hi";
import StudentAiSuggestions from "./StudentAiSuggestions"; // Ensure this path is correct

const FloatingInput = ({
  icon: Icon,
  label,
  type,
  name,
  value,
  onChange,
  options,
  min,
  max,
  step,
}) => (
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
    <div className="max-w-5xl mx-auto px-4 py-12">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl mt-11 text-center text-slate-800 mb-8"
      >
        <span className="text-5xl mb-2 sm:text-5xl font-medium p-2 mt-5 bg-gradient-to-r from-slate-800 to-purple-600 text-transparent bg-clip-text">
          Student Job Readiness Predictor
        </span>
      </motion.h1>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 sm:grid-cols-2 gap-6"
      >
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

        <div className="col-span-full flex justify-center mt-4">
          <button
            type="submit"
            className="px-6 py-3 bg-slate-800 text-white cursor-pointer rounded-full font-medium shadow hover:shadow-md transition disabled:opacity-60
            hover:bg-gradient-to-r from-slate-800 to-purple-700 focus:ring-2 cursor-pointer focus:ring-slate-500 focus:ring-offset-2
            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Get Prediction"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-6 text-red-500 text-center">
          <p>{error}</p>
        </div>
      )}

      {result && (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-10 bg-white border border-indigo-100 rounded-3xl shadow-lg p-6 md:p-8 text-center"
                >
                <h2 className="text-2xl font-semibold text-indigo-700 mb-3">
                    🎯 Your Job Readiness Score
                </h2>

                <div className="relative w-full max-w-md mx-auto mt-4">
                    <div className="w-full h-4 bg-gray-100 rounded-full">
                    <motion.div
                        className="h-4 bg-gradient-to-r from-green-400 via-yellow-300 to-red-400 rounded-full shadow-inner"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(Math.round(result.job_stability_score), 100)}%` }}
                        transition={{ duration: 1 }}
                    />
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                    Based on your profile, your estimated score is:
                    </div>
                    <div className="mt-2 text-4xl font-bold text-green-600">
                    {Math.round(result.job_stability_score)}%
                    </div>
                </div>

                <p className="text-sm text-gray-500 mt-4">
                    A higher score indicates stronger readiness for your preferred job role.
                    Improve it with the AI-powered suggestions below! 🚀
                </p>
            </motion.div>
          <StudentAiSuggestions
            studentData={formData}
            predictionData={result}
            loading={loading}
          />
        </>
      )}
    </div>
  );
};

export default StudentPred;