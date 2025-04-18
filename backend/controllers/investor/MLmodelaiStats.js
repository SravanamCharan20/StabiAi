import axios from 'axios'

export const getMLModelAIStats = async (companyName, symbol) => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

  const prompt = `
Based on publicly available data, reports, news, and typical industry trends, estimate the following attributes for the company "${companyName}" (symbol: ${symbol}):

Return the result in JSON format with the following fields:
- layoff_frequency (scale 0–10)
- employee_attrition (percentage)
- client_concentration (0–100 scale)
- geographic_diversification (0–100 scale)
- rnd_spending (approximate in USD if known)
- currency_risk (scale 0–10)
- global_it_spending (growth % or trend)
- digital_exposure (scale 0–100)
- stock_volatility (percentage or scale 0–100)

Respond with JSON only.
`

  try {
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }]
    })

    let rawText = response.data.candidates[0]?.content?.parts[0]?.text || '{}'
    rawText = rawText.replace(/```json|```/g, '').trim()

    let parsed = JSON.parse(rawText)

    // 🔧 Normalize Gemini-generated values
    const normalizeNumber = (val) => {
      if (typeof val === 'number') return val
      if (typeof val === 'string') {
        // Extract first number found
        const match = val.replace(/,/g, '').match(/[\d.]+/g)
        if (match) return parseFloat(match[0])
      }
      return null
    }

    parsed.rnd_spending = normalizeNumber(parsed.rnd_spending)
    parsed.global_it_spending = normalizeNumber(parsed.global_it_spending)
    parsed.layoff_frequency = normalizeNumber(parsed.layoff_frequency)
    parsed.employee_attrition = normalizeNumber(parsed.employee_attrition)
    parsed.client_concentration = normalizeNumber(parsed.client_concentration)
    parsed.geographic_diversification = normalizeNumber(parsed.geographic_diversification)
    parsed.currency_risk = normalizeNumber(parsed.currency_risk)
    parsed.digital_exposure = normalizeNumber(parsed.digital_exposure)
    parsed.stock_volatility = normalizeNumber(parsed.stock_volatility)

    return parsed
  } catch (err) {
    console.error('Gemini API error:', err.message)
    return {}
  }
}