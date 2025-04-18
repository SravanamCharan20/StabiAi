/* eslint-disable no-unused-vars */
import React, { useState } from 'react'
import axios from 'axios'

const InvestorPred = () => {
  const [search, setSearch] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('alerts') // Tracks which AI suggestion to show

  // Handle the API call to get predictions
  const handleSearch = async () => {
    if (!search.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await axios.post('http://localhost:9000/api/investor/predict', {
        company: search,
      })
      setResult(response.data)
    } catch (error) {
      setError('Failed to fetch data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Toggle active AI suggestion tab
  const toggleTab = (tab) => {
    setActiveTab(tab)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl p-8">
        <h1 className="text-4xl font-semibold text-center text-gray-900 mb-8">Company Risk Prediction</h1>

        <div className="flex items-center gap-4 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Enter company name..."
            className="flex-1 py-3 px-6 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 text-white py-3 px-8 rounded-lg text-lg transition duration-300 ease-in-out hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {error && <p className="text-red-600 text-center mb-6">{error}</p>}

        {result && (
          <div className="mt-8 space-y-6">
            {/* Risk Label and Probability */}
            <div className="bg-blue-600 text-white p-6 rounded-lg shadow-md text-center">
              <h2 className="text-xl font-semibold">Risk Label: {result.predictedData?.risk_label}</h2>
              <p className="text-4xl font-bold mt-4">{(result.predictedData?.probability * 100).toFixed(2)}%</p>
            </div>

            {/* AI Suggestions Toggle */}
            <div className="mt-6 flex justify-around gap-4">
              <button
                onClick={() => toggleTab('alerts')}
                className={`px-6 py-2 rounded-lg text-lg ${activeTab === 'alerts' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                Alerts
              </button>
              <button
                onClick={() => toggleTab('opportunities')}
                className={`px-6 py-2 rounded-lg text-lg ${activeTab === 'opportunities' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                Opportunities
              </button>
              <button
                onClick={() => toggleTab('recommendations')}
                className={`px-6 py-2 rounded-lg text-lg ${activeTab === 'recommendations' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                Recommendations
              </button>
            </div>

            {/* Display Corresponding AI Suggestions */}
            {activeTab === 'alerts' && (
              <div className="bg-gray-50 p-6 rounded-lg shadow-md mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Alerts</h2>
                <ul className="space-y-4">
                  {result.aiSuggestions?.alerts?.map((alert, index) => (
                    <li key={index} className="text-gray-700">
                      <p><strong>Alert:</strong> {alert.alert}</p>
                      <p><strong>Urgency:</strong> {alert.urgency}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === 'opportunities' && (
              <div className="bg-gray-50 p-6 rounded-lg shadow-md mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Opportunities</h2>
                <ul className="space-y-4">
                  {result.aiSuggestions?.opportunities?.map((opportunity, index) => (
                    <li key={index} className="text-gray-700">
                      <p><strong>Opportunity:</strong> {opportunity.opportunity}</p>
                      <p><strong>Impact:</strong> {opportunity.impact}</p>
                      <p><strong>Requirements:</strong> {opportunity.requirements}</p>
                      <p><strong>Timeline:</strong> {opportunity.timeline}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === 'recommendations' && (
              <div className="bg-gray-50 p-6 rounded-lg shadow-md mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommendations</h2>
                <ul className="space-y-4">
                  {result.aiSuggestions?.recommendations?.map((recommendation, index) => (
                    <li key={index} className="text-gray-700">
                      <p><strong>Action:</strong> {recommendation.action}</p>
                      <p><strong>Timeline:</strong> {recommendation.timeline}</p>
                      <p><strong>Steps:</strong></p>
                      <ul className="ml-4 list-disc">
                        {recommendation.steps?.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ul>
                      <p><strong>Indicators:</strong> {recommendation.indicators}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default InvestorPred