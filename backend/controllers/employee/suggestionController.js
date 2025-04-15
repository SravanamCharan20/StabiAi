import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Generate career suggestions based on user data and ML layoff risk output
 * @param {Object} userData - employee details
 * @returns {Promise<Object>} - Structured suggestions { skills, actions, opportunities }
 */
async function getSuggestions(userData) {
  const {
    job_title = "Unknown",
    years_at_company = 0,
    performance_rating = 0,
    layoff_risk = "moderate",
    company_name = "Unknown",
    company_location = "Unknown",
    reporting_quarter = "Unknown",
    department = "Unknown",
    remote_work = "Unknown",
    salary_range = "Unknown",
  } = userData;

  // Log input for debugging
  console.log("Input userData:", userData);

  const prompt = `
You are a career advisor. An employee has the following profile:
- Job Title: ${job_title}
- Years at Company: ${years_at_company}
- Performance Rating: ${performance_rating}/5
- Layoff Risk (Predicted): ${layoff_risk} (low, moderate, or high)
- Company Name: ${company_name}
- Company Location: ${company_location}
- Reporting Quarter: ${reporting_quarter}
- Department: ${department}
- Remote Work: ${remote_work}
- Salary Range: ${salary_range}

Generate personalized career suggestions tailored to the employee's profile, especially their layoff risk. Provide:
1. Skills to develop to improve employability and reduce layoff risk.
2. Actions to enhance career stability and visibility.
3. Opportunities for career growth or alternative roles/industries.

Return the response as a JSON object in the following format, ensuring suggestions are specific to the layoff risk and profile:
{
  "skills": [
    {
      "name": "string (skill name)",
      "why": "string (why this skill matters)",
      "how": "string (how to acquire it, e.g., courses, practice)",
      "impact": "string (expected benefit)"
    }
    // Add 1-3 skills based on relevance
  ],
  "actions": [
    {
      "title": "string (action name)",
      "timeline": "string (e.g., 1-3 months)",
      "steps": ["string (step 1)", "string (step 2)", ...],
      "indicators": "string (success metrics)"
    }
    // Add 1-3 actions based on urgency
  ],
  "opportunities": [
    {
      "title": "string (opportunity name)",
      "timeline": "string (e.g., 3-6 months)",
      "requirements": "string (skills or experience needed)",
      "impact": "string (potential outcome)"
    }
    // Add 1-2 opportunities based on feasibility
  ]
}
`;

  // Define response schema for structured output
  const responseSchema = {
    type: "object",
    properties: {
      skills: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            why: { type: "string" },
            how: { type: "string" },
            impact: { type: "string" },
          },
          required: ["name", "why", "how", "impact"],
        },
      },
      actions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            timeline: { type: "string" },
            steps: { type: "array", items: { type: "string" } },
            indicators: { type: "string" },
          },
          required: ["title", "timeline", "steps", "indicators"],
        },
      },
      opportunities: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            timeline: { type: "string" },
            requirements: { type: "string" },
            impact: { type: "string" },
          },
          required: ["title", "timeline", "requirements", "impact"],
        },
      },
    },
    required: ["skills", "actions", "opportunities"],
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
      !suggestions.skills ||
      !suggestions.actions ||
      !suggestions.opportunities ||
      !Array.isArray(suggestions.skills) ||
      !Array.isArray(suggestions.actions) ||
      !Array.isArray(suggestions.opportunities)
    ) {
      throw new Error("Invalid response format from Gemini API");
    }

    return suggestions;
  } catch (error) {
    console.error("Gemini API Error:", error.message, error.stack);
    throw new Error(`Failed to generate suggestions: ${error.message}`);
  }
}

export default getSuggestions;