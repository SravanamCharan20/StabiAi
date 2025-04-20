/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineLightBulb,
  HiOutlineLightningBolt,
  HiOutlineBriefcase,
} from "react-icons/hi";

const TabButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full font-medium transition ${
      active
        ? "bg-indigo-600 text-white shadow-md"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`}
  >
    {label}
  </button>
);

const SuggestionCard = ({ data, type, index }) => {
  const icons = {
    skills: HiOutlineLightBulb,
    actions: HiOutlineLightningBolt,
    opportunities: HiOutlineBriefcase,
  };
  const Icon = icons[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white border border-gray-200 rounded-xl p-6 shadow hover:shadow-md transition"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">
          {data.name || data.title}
        </h3>
      </div>

      {data.why && <p className="text-gray-600 mb-2"><strong>Why:</strong> {data.why}</p>}
      {data.how && <p className="text-gray-600 mb-2"><strong>How:</strong> {data.how}</p>}
      {data.impact && <p className="text-gray-600 mb-2"><strong>Impact:</strong> {data.impact}</p>}
      {data.requirements && <p className="text-gray-600 mb-2"><strong>Requirements:</strong> {data.requirements}</p>}
      {data.timeline && <p className="text-gray-500 text-sm mb-2"><strong>Timeline:</strong> {data.timeline}</p>}
      {data.steps && (
        <ul className="list-disc list-inside text-sm text-gray-600 mb-2">
          {data.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ul>
      )}
      {data.indicators && (
        <p className="text-gray-500 text-sm"><strong>Indicators:</strong> {data.indicators}</p>
      )}
    </motion.div>
  );
};

const StudentAiSuggestions = ({ studentData, predictionData, loading }) => {
  const [activeTab, setActiveTab] = useState("skills");
  const suggestions = predictionData?.suggestions || {};

  if (!suggestions.skills?.length && !suggestions.actions?.length && !suggestions.opportunities?.length) {
    return null;
  }

  const tabs = [
    { id: "skills", label: "Skills to Learn" },
    { id: "actions", label: "Immediate Actions" },
    { id: "opportunities", label: "Opportunities" },
  ];

  const currentList = suggestions[activeTab] || [];

  return (
    <div className="mt-12">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800">🎯 AI-Powered Career Suggestions</h2>
        <p className="text-sm text-gray-500">Tailored for your career growth based on your profile</p>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            label={tab.label}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <AnimatePresence mode="wait">
          {currentList.length > 0 ? (
            currentList.map((item, index) => (
              <SuggestionCard key={index} data={item} type={activeTab} index={index} />
            ))
          ) : (
            <p className="text-center col-span-full text-gray-500">No suggestions available.</p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default StudentAiSuggestions;