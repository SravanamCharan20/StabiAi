/* eslint-disable no-undef */
import React, { useState } from 'react';
import axios from 'axios';

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
      // Get prediction from backend
      const response = await axios.post('http://localhost:9000/api/employee/predict', formData);
      console.log('Prediction response:', response.data); // Debug log
      setPredictionData(response.data);

      // Get AI suggestions based on the layoff risk
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
      console.error('Error submitting form:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderPredictionResult = () => {
    if (loading) {
      return (
        <div className="mt-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="mt-8 bg-red-50 p-4 rounded-lg">
          <h3 className="text-red-800 font-semibold">Error</h3>
          <p className="text-red-600">{error}</p>
        </div>
      );
    }

    if (!predictionData || !predictionData.prediction) return null;

    const { data, prediction } = predictionData;
    const riskLevel = prediction.layoff_risk;
    const riskColor = 
      riskLevel === 'High' ? 'red-600' : 
      riskLevel === 'Moderate' ? 'yellow-600' : 
      'green-600';

    // Calculate risk factors
    const hasHighLayoffRate = data.industry_layoff_rate > 30;
    const hasNegativeGrowth = data.revenue_growth < 0;
    const hasHighUnemployment = data.unemployment_rate > 40;

    const riskFactors = [];
    if (hasHighLayoffRate) riskFactors.push('High industry layoff rate');
    if (hasNegativeGrowth) riskFactors.push('Negative revenue growth');
    if (hasHighUnemployment) riskFactors.push('High unemployment rate');

    return (
      <div className="mt-8">
        {/* Prediction Result Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Layoff Risk Assessment</h2>
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <div className={`text-${riskColor} text-xl font-semibold`}>
              Risk Level: {riskLevel}
            </div>
          </div>

          {riskFactors.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Risk Factors:</h3>
              <ul className="list-disc list-inside space-y-1">
                {riskFactors.map((factor, index) => (
                  <li key={index} className="text-gray-700">{factor}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Company Metrics</h3>
              <ul className="space-y-2">
                <li>Revenue Growth: {data.revenue_growth?.toFixed(2)}%</li>
                <li>Profit Margin: {data.profit_margin?.toFixed(2)}%</li>
                <li>Stock Price Change: {data.stock_price_change?.toFixed(2)}%</li>
                <li>Total Employees: {data.total_employees?.toLocaleString()}</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Economic Indicators</h3>
              <ul className="space-y-2">
                <li>Industry Layoff Rate: {data.industry_layoff_rate?.toFixed(2)}%</li>
                <li>Unemployment Rate: {data.unemployment_rate?.toFixed(2)}%</li>
                <li>Inflation Rate: {data.inflation_rate?.toFixed(2)}%</li>
              </ul>
            </div>
          </div>
        </div>

        {/* AI Suggestions Card */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">AI-Powered Suggestions</h2>
          <div className="space-y-4">
            {aiSuggestions?.map((suggestion, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-semibold">{index + 1}</span>
                </div>
                <p className="text-gray-700">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Steps */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-2xl font-bold mb-4">Recommended Actions</h2>
          <div className="space-y-3">
            {riskLevel === 'High' ? (
              <>
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Update your resume and LinkedIn profile immediately</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Start actively job searching and networking</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Consider exploring opportunities in companies with better financial indicators</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Keep your skills updated and relevant to industry demands</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Build a strong professional network</span>
                </div>
              </>
            )}
            <div className="flex items-center text-gray-700">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Maintain documentation of your achievements and contributions</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Employee Prediction Form</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Company Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <select
              id="company_name"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              <option value="">Select Company</option>
              <option value="TCS">TCS</option>
              <option value="Infosys">Infosys</option>
              <option value="Wipro">Wipro</option>
              <option value="HCL">HCL</option>
              <option value="Tech Mahindra">Tech Mahindra</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="company_location" className="block text-sm font-medium text-gray-700 mb-1">
              Company Location
            </label>
            <select
              id="company_location"
              name="company_location"
              value={formData.company_location}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              <option value="">Select Location</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Chennai">Chennai</option>
              <option value="Pune">Pune</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="reporting_quarter" className="block text-sm font-medium text-gray-700 mb-1">
            Reporting Quarter
          </label>
          <select
            id="reporting_quarter"
            name="reporting_quarter"
            value={formData.reporting_quarter}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          >
            <option value="">Select Quarter</option>
            <option value="Q1-2023">Q1-2023</option>
            <option value="Q2-2023">Q2-2023</option>
            <option value="Q3-2023">Q3-2023</option>
            <option value="Q4-2023">Q4-2023</option>
          </select>
        </div>

        {/* Job Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label htmlFor="job_title" className="block text-sm font-medium text-gray-700 mb-1">
              Job Title
            </label>
            <select
              id="job_title"
              name="job_title"
              value={formData.job_title}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              <option value="">Select Job Title</option>
              <option value="Software Engineer">Software Engineer</option>
              <option value="Senior Software Engineer">Senior Software Engineer</option>
              <option value="Technical Lead">Technical Lead</option>
              <option value="Project Manager">Project Manager</option>
              <option value="Data Scientist">Data Scientist</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              <option value="">Select Department</option>
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="Data Science">Data Science</option>
              <option value="DevOps">DevOps</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="remote_work" className="block text-sm font-medium text-gray-700 mb-1">
            Remote Work
          </label>
          <select
            id="remote_work"
            name="remote_work"
            value={formData.remote_work}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          >
            <option value="">Select Remote Work Status</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {/* Employee Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="form-group">
            <label htmlFor="years_at_company" className="block text-sm font-medium text-gray-700 mb-1">
              Years at Company
            </label>
            <input
              type="number"
              id="years_at_company"
              name="years_at_company"
              value={formData.years_at_company}
              onChange={handleChange}
              min="0"
              step="0.5"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="salary_range" className="block text-sm font-medium text-gray-700 mb-1">
              Salary Range (LPA)
            </label>
            <input
              type="number"
              id="salary_range"
              name="salary_range"
              value={formData.salary_range}
              onChange={handleChange}
              min="0"
              step="0.5"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="performance_rating" className="block text-sm font-medium text-gray-700 mb-1">
              Performance Rating
            </label>
            <input
              type="number"
              id="performance_rating"
              name="performance_rating"
              value={formData.performance_rating}
              onChange={handleChange}
              min="1"
              max="5"
              step="0.1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
        >
          {loading ? 'Processing...' : 'Submit'}
        </button>
      </form>

      {renderPredictionResult()}
    </div>
  );
};

export default EmployeePred;