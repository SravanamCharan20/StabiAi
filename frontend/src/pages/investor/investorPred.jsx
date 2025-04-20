/* eslint-disable no-unused-vars */
import React, { useState } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'

const InvestorPred = () => {
  const [search, setSearch] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('alerts')

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

  const toggleTab = (tab) => setActiveTab(tab)

  return (
    <div className="bg-gradient-to-br from-gray-100 to-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl mt-11 text-center text-slate-800 mb-8"
      >
        <span className="text-5xl mb-2 sm:text-5xl font-medium p-2 mt-2 bg-gradient-to-r from-slate-800 to-purple-600 text-transparent bg-clip-text">
          Company Risk Prediction
        </span>
      </motion.h1>

        <div className="backdrop-blur-md border border-purple-200 shadow-lg rounded-3xl p-8">
          {/* Apple-Inspired Search Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder= "Search company..."
                className="w-full py-3 pl-5 pr-14 text-base bg-gray-100 rounded-full border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:outline-none placeholder-gray-400 text-gray-700 transition"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-slate-800 cursor-pointer text-white rounded-full font-medium shadow hover:shadow-md transition disabled:opacity-60
              hover:bg-gradient-to-r from-slate-800 to-purple-700 focus:ring-2 cursor-pointer focus:ring-slate-500 focus:ring-offset-2
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Result Display */}
              <div className="text-center p-6 bg-gradient-to-br from-indigo-100 to-purple-50 border border-indigo-200 rounded-2xl shadow">
                <h2 className="text-xl font-semibold text-slate-800">
                  Risk Level: <span className="font-bold text-indigo-600">{result.predictedData?.risk_label}</span>
                </h2>
                <p className="text-5xl font-bold text-indigo-700 mt-2">
                  {(result.predictedData?.probability * 100).toFixed(2)}%
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Confidence based on financial & historical trends
                </p>
              </div>

              {/* Tabs */}
              <div className="flex justify-center gap-2 rounded-full bg-gray-100 p-1">
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

              {/* Active Tab Content */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                {activeTab === 'alerts' && (
                  <>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">⚠️ Alerts</h3>
                    <ul className="space-y-4">
                      {result.aiSuggestions?.alerts?.map((alert, index) => (
                        <li key={index} className="text-gray-700">
                          <p><strong>Alert:</strong> {alert.alert}</p>
                          <p><strong>Urgency:</strong> {alert.urgency}</p>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {activeTab === 'opportunities' && (
                  <>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">🌱 Opportunities</h3>
                    <ul className="space-y-4">
                      {result.aiSuggestions?.opportunities?.map((op, index) => (
                        <li key={index} className="text-gray-700">
                          <p><strong>Opportunity:</strong> {op.opportunity}</p>
                          <p><strong>Impact:</strong> {op.impact}</p>
                          <p><strong>Requirements:</strong> {op.requirements}</p>
                          <p><strong>Timeline:</strong> {op.timeline}</p>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {activeTab === 'recommendations' && (
                  <>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">💡 Recommendations</h3>
                    <ul className="space-y-6">
                      {result.aiSuggestions?.recommendations?.map((rec, index) => (
                        <li key={index} className="text-gray-700">
                          <p><strong>Action:</strong> {rec.action}</p>
                          <p><strong>Timeline:</strong> {rec.timeline}</p>
                          <p><strong>Steps:</strong></p>
                          <ul className="ml-5 list-disc text-sm">
                            {rec.steps?.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ul>
                          <p className="mt-2"><strong>Indicators:</strong> {rec.indicators}</p>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InvestorPred