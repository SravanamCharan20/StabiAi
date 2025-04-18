import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Generate investment suggestions based on company data and ML risk prediction
 * @param {Object} companyData - Financial and operational details of the company
 * @param {string} riskLabel - The predicted risk label (Low, Moderate, High)
 * @param {number} probability - The predicted probability of the risk
 * @returns {Promise<Object>} - Structured suggestions for investors
 */
export async function getAISuggestions(companyData, riskLabel, probability) {
  const {
    tier,
    revenue_growth,
    profit_margin,
    debt_to_equity,
    free_cash_flow,
    layoff_frequency,
    employee_attrition,
    client_concentration,
    geographic_diversification,
    rnd_spending,
    stock_volatility,
    pe_ratio,
    beta,
    currency_risk,
    global_it_spending,
    digital_exposure
  } = companyData;

  const prompt = `
You are an investment advisor. Based on the following company data and risk prediction, 
provide actionable suggestions for investors on how to approach investments in this company.

Company Data:
- Tier: ${tier}
- Revenue Growth: ${revenue_growth}%
- Profit Margin: ${profit_margin}%
- Debt to Equity: ${debt_to_equity}
- Free Cash Flow: ${free_cash_flow} USD
- Layoff Frequency: ${layoff_frequency} (scale 0–10)
- Employee Attrition: ${employee_attrition}% (scale 0–100)
- Client Concentration: ${client_concentration}% (scale 0–100)
- Geographic Diversification: ${geographic_diversification}% (scale 0–100)
- R&D Spending: ${rnd_spending} USD
- Stock Volatility: ${stock_volatility} (scale 0–100)
- PE Ratio: ${pe_ratio}
- Beta: ${beta}
- Currency Risk: ${currency_risk} (scale 0–10)
- Global IT Spending: ${global_it_spending}%
- Digital Exposure: ${digital_exposure}% (scale 0–100)

Investment Risk Prediction:
- Risk Label: ${riskLabel} (low, moderate, or high)
- Probability: ${probability}

Generate actionable investment suggestions based on these data points, with a focus on managing risks and optimizing returns for investors.
Return a structured response in JSON format as follows:

{
  "recommendations": [
    {
      "action": "string (action title)",
      "timeline": "string (e.g., 1-3 months)",
      "steps": ["string (step 1)", "string (step 2)", ...],
      "indicators": "string (success metrics)"
    },
    // Add 1-3 actionable investment recommendations
  ],
  "alerts": [
    {
      "alert": "string (alert description)",
      "urgency": "string (e.g., high, medium, low)"
    },
    // Add 1-2 investment alerts based on the company data and risk prediction
  ],
  "opportunities": [
    {
      "opportunity": "string (investment opportunity)",
      "timeline": "string (e.g., 6-12 months)",
      "requirements": "string (criteria for investment)",
      "impact": "string (expected outcome)"
    },
    // Add 1-2 investment opportunities based on the company data
  ]
}
`;

  // Define response schema for structured output
  const responseSchema = {
    type: "object",
    properties: {
      recommendations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            action: { type: "string" },
            timeline: { type: "string" },
            steps: { type: "array", items: { type: "string" } },
            indicators: { type: "string" },
          },
          required: ["action", "timeline", "steps", "indicators"],
        },
      },
      alerts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            alert: { type: "string" },
            urgency: { type: "string" },
          },
          required: ["alert", "urgency"],
        },
      },
      opportunities: {
        type: "array",
        items: {
          type: "object",
          properties: {
            opportunity: { type: "string" },
            timeline: { type: "string" },
            requirements: { type: "string" },
            impact: { type: "string" },
          },
          required: ["opportunity", "timeline", "requirements", "impact"],
        },
      },
    },
    required: ["recommendations", "alerts", "opportunities"],
  };

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const text = result.response.text();
    const suggestions = JSON.parse(text);

    // Validate response
    if (
      !suggestions.recommendations ||
      !suggestions.alerts ||
      !suggestions.opportunities ||
      !Array.isArray(suggestions.recommendations) ||
      !Array.isArray(suggestions.alerts) ||
      !Array.isArray(suggestions.opportunities)
    ) {
      throw new Error("Invalid response format from Gemini API");
    }

    return suggestions;
  } catch (error) {
    console.error("Gemini API Error:", error.message, error.stack);
    throw new Error(`Failed to generate investment suggestions: ${error.message}`);
  }
}

export default getAISuggestions;