/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { HiOutlineOfficeBuilding, HiOutlineLocationMarker, HiOutlineCalendar, 
         HiOutlineBriefcase, HiOutlineUserGroup, HiOutlineHome, 
         HiOutlineClock, HiOutlineCurrencyDollar, HiOutlineChartBar } from 'react-icons/hi';

const FloatingInput = ({ icon: Icon, label, type, name, value, onChange, options, min, max, step }) => (
  <div className="relative group">
    <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-white rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity" />
    <div className="relative bg-white/80 backdrop-blur-xl border border-gray-400/50 rounded-2xl p-4 hover:border-gray-300/50 transition-all">
      <div className="flex items-center gap-3 text-gray-600">
        <Icon className="text-xl" />
        <label className="text-sm font-medium">{label}</label>
      </div>
      {options ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full mt-2 bg-transparent border-none text-gray-900 text-lg font-medium focus:ring-0 focus:outline-none"
        >
          <option value="">Select {label}</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
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
          className="w-full mt-2 bg-transparent border-none text-gray-900 text-lg font-medium focus:ring-0 focus:outline-none"
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      )}
    </div>
  </div>
);

const EmployeePred = () => {
  const [formData, setFormData] = useState({
    company_name: '',
    company_location: '',
    reporting_quarter: '',
    job_title: '',
    department: '',
    remote_work: '',
    years_at_company: '',
    salary_range: '',
    performance_rating: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('http://localhost:9000/api/employee/predict', formData);
      setPredictionData(response.data);

      const suggestionPrompt = `Based on the following employee data and layoff prediction, provide 3-4 professional development suggestions:
        - Company: ${formData.company_name}
        - Role: ${formData.job_title}
        - Years of Experience: ${formData.years_at_company || 'N/A'}
        - Performance Rating: ${formData.performance_rating}
        - Layoff Risk: ${response.data.prediction.layoff_risk}
        - Industry: ${response.data.data.industry}
        - Revenue Growth: ${response.data.data.revenue_growth}%
        - Industry Layoff Rate: ${response.data.data.industry_layoff_rate}%`;

      const aiResponse = await axios.post('http://localhost:9000/api/ai/suggestions', {
        prompt: suggestionPrompt
      });
      setAiSuggestions(aiResponse.data.suggestions);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
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
          className="mt-16 flex items-center justify-center"
        >
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-t-2 border-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-t-2 border-blue-400/50 rounded-full animate-spin-slow"></div>
          </div>
        </motion.div>
      );
    }

    if (error) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 relative"
        >
          <div className="absolute inset-0 bg-red-50 rounded-3xl blur-xl opacity-25" />
          <div className="relative bg-white/80 backdrop-blur-xl border border-red-100 rounded-3xl p-8">
            <h3 className="text-red-800 font-semibold text-lg mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </motion.div>
      );
    }

    if (!predictionData || !predictionData.prediction) return null;

    const { data, prediction } = predictionData;
    const riskLevel = prediction.layoff_risk;
    const riskColor = 
      riskLevel === 'High' ? 'red-500' : 
      riskLevel === 'Moderate' ? 'yellow-500' : 
      'green-500';

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-16 space-y-8"
      >
        {/* Risk Score Card */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-white to-blue-50 rounded-3xl blur-xl opacity-25" />
          <div className="relative bg-white/80 backdrop-blur-xl border border-gray-400/50 rounded-3xl p-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/20 to-indigo-100/20 rounded-full blur-3xl -mr-32 -mt-32" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-semibold text-gray-900">Risk Analysis</h2>
                <motion.div 
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full 
                    bg-${riskColor}/10 text-${riskColor} font-medium
                  `}
                >
                  <span className={`w-2 h-2 rounded-full bg-${riskColor}`} />
                  {riskLevel} Risk
                </motion.div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Key Metrics</h3>
                    <div className="space-y-4">
                      {[
                        { 
                          label: 'Revenue Growth',
                          value: data.revenue_growth?.toFixed(2),
                          suffix: '%',
                          trend: data.revenue_growth > 0 ? 'up' : 'down'
                        },
                        { 
                          label: 'Industry Position',
                          value: data.industry_layoff_rate < 30 ? 'Strong' : 'Challenging',
                          color: data.industry_layoff_rate < 30 ? 'green' : 'yellow'
                        }
                      ].map((metric, index) => (
                        <motion.div
                          key={index}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gray-50/50 rounded-2xl p-4"
                        >
                          <div className="text-sm text-gray-500 mb-1">{metric.label}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-semibold text-gray-900">
                              {metric.value}{metric.suffix}
                            </span>
                            {metric.trend && (
                              <span className={`text-${metric.trend === 'up' ? 'green' : 'red'}-500`}>
                                {metric.trend === 'up' ? '↑' : '↓'}
                              </span>
                            )}
                            {metric.color && (
                              <span className={`text-${metric.color}-500 text-sm`}>
                                ●
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Market Context</h3>
                    <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-4">
                      <div className="absolute inset-x-0 bottom-0 top-8 flex items-end justify-around px-4">
                        {[
                          { 
                            label: 'Industry',
                            value: data.industry_layoff_rate || 0,
                            color: 'blue-500'
                          },
                          { 
                            label: 'Market',
                            value: data.unemployment_rate || 0,
                            color: 'indigo-500'
                          },
                          { 
                            label: 'Growth',
                            value: data.revenue_growth || 0,
                            color: 'green-500'
                          }
                        ].map((metric, index) => (
                          <div key={index} className="relative flex flex-col items-center w-1/4">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.min(Math.max(metric.value, 0), 100)}%` }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                              className={`w-full bg-${metric.color} bg-opacity-20 rounded-t-lg`}
                            />
                            <div className="absolute bottom-full left-0 right-0 mb-1 text-center">
                              <span className="text-sm font-medium text-gray-900">
                                {metric.value.toFixed(1)}%
                              </span>
                            </div>
                            <span className="absolute top-full mt-2 text-sm text-gray-500">
                              {metric.label}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="absolute left-4 top-0 bottom-8 w-8 flex flex-col justify-between">
                        {[100, 75, 50, 25, 0].map((tick) => (
                          <div key={tick} className="flex items-center gap-2">
                            <div className="w-2 h-px bg-gray-300" />
                            <span className="text-xs text-gray-400">{tick}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights Card */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-white rounded-3xl blur-xl opacity-25" />
          <div className="relative bg-white/80 backdrop-blur-xl border border-gray-400/50 rounded-3xl p-8">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">AI Insights</h2>
            
            <div className="grid grid-cols-1 gap-6">
              {aiSuggestions?.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl opacity-0 group-hover:opacity-25 transition-opacity" />
                  <div className="relative p-6 rounded-2xl border border-gray-400/50 hover:border-blue-200/50 transition-colors">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100/50 flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-lg">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="h-px bg-gradient-to-r from-blue-100 to-transparent" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      {suggestion.split('\n').map((paragraph, pIndex) => (
                        <p key={pIndex} className="text-gray-600 leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Action Steps */}
            <div className="mt-12 pt-8 border-t border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Strategic Action Plan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: 'Immediate Steps',
                    icon: '🎯',
                    items: ['Update technical skills', 'Network within industry', 'Document achievements']
                  },
                  {
                    title: 'Medium Term',
                    icon: '📈',
                    items: ['Industry certification', 'Build project portfolio', 'Seek mentorship']
                  },
                  {
                    title: 'Long Term',
                    icon: '🌟',
                    items: ['Career advancement', 'Leadership development', 'Market positioning']
                  }
                ].map((section, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative p-6 rounded-2xl border border-gray-400/50 hover:border-blue-200/50 transition-colors">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">{section.icon}</span>
                        <h4 className="text-lg font-medium text-gray-900">{section.title}</h4>
                      </div>
                      <ul className="space-y-3">
                        {section.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-center gap-3 text-gray-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-6 mt-7 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-6xl text-transparent bg-clip-text p-2 tracking-tight bg-gradient-to-r from-gray-800 via-purple-600 to-blue-500">
          Employee Risk Assessment
        </h1>
        <p className="text-xl mt-2 text-gray-600">
          Predict potential outcomes with our advanced AI analysis
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FloatingInput
            icon={HiOutlineOfficeBuilding}
            label="Company"
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            options={['TCS', 'Infosys', 'Wipro', 'HCL', 'Tech Mahindra']}
          />

          <FloatingInput
            icon={HiOutlineLocationMarker}
            label="Location"
            name="company_location"
            value={formData.company_location}
            onChange={handleChange}
            options={['Bangalore', 'Mumbai', 'Hyderabad', 'Chennai', 'Pune']}
          />

          <FloatingInput
            icon={HiOutlineCalendar}
            label="Quarter"
            name="reporting_quarter"
            value={formData.reporting_quarter}
            onChange={handleChange}
            options={['Q1-2023', 'Q2-2023', 'Q3-2023', 'Q4-2023']}
          />

          <FloatingInput
            icon={HiOutlineBriefcase}
            label="Job Title"
            name="job_title"
            value={formData.job_title}
            onChange={handleChange}
            options={['Software Engineer', 'Senior Software Engineer', 'Technical Lead', 'Project Manager', 'Data Scientist']}
          />

          <FloatingInput
            icon={HiOutlineUserGroup}
            label="Department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            options={['Engineering', 'Product', 'Data Science', 'DevOps']}
          />

          <FloatingInput
            icon={HiOutlineHome}
            label="Remote Work"
            name="remote_work"
            value={formData.remote_work}
            onChange={handleChange}
            options={['Yes', 'No']}
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

        <div className="flex justify-center mt-12">
          <button
            type="submit"
            disabled={loading}
            className="
              relative group px-8 py-3 rounded-full
              bg-gray-900 text-white
              hover:bg-gray-800 
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity" />
            <span className="relative text-sm font-medium tracking-wide">
              {loading ? 'Processing...' : 'Analyze Risk'}
            </span>
          </button>
        </div>
      </form>

      {renderPredictionResult()}
    </div>
  );
};

export default EmployeePred;