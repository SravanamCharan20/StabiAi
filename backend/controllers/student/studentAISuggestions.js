import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Generate career readiness suggestions for students based on input profile
 * @param {Object} studentData - student profile details
 * @returns {Promise<Object>} - Structured suggestions { skills, actions, opportunities }
 */
async function getStudentSuggestions(studentData) {
  const {
    cgpa = 0.0,
    degree = "Unknown",
    college_tier = "Unknown",
    years_of_coding_experience = 0,
    hackathon_participation = 0,
    primary_tech_stack = "Unknown",
    skills = "",
    certifications = "",
    project_tech_stacks = "",
    internship_tech_stacks = "",
    preferred_job_title = "Software Engineer",
  } = studentData;

  const prompt = `
You are a career advisor focused on student employability. Here's a student's profile:
- CGPA: ${cgpa}
- Degree: ${degree}
- College Tier: ${college_tier}
- Years of Coding Experience: ${years_of_coding_experience}
- Hackathon Participation: ${hackathon_participation}
- Primary Tech Stack: ${primary_tech_stack}
- Skills: ${skills}
- Certifications: ${certifications}
- Project Tech Stacks: ${project_tech_stacks}
- Internship Tech Stacks: ${internship_tech_stacks}
- Preferred Job Title: ${preferred_job_title}

Based on this, generate structured and tailored suggestions to enhance this student’s job readiness. Provide:
1. Skills to improve their profile and match their preferred job title.
2. Actions they can take in the next 1-3 months to increase employability.
3. Opportunities they can explore in the next 3-6 months (roles, internships, certifications, etc.).

Return the response as JSON in the format:
{
  "skills": [
    {
      "name": "string",
      "why": "string",
      "how": "string",
      "impact": "string"
    }
  ],
  "actions": [
    {
      "title": "string",
      "timeline": "string",
      "steps": ["string"],
      "indicators": "string"
    }
  ],
  "opportunities": [
    {
      "title": "string",
      "timeline": "string",
      "requirements": "string",
      "impact": "string"
    }
  ]
}
`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json"
      },
    });

    const text = result.response.text();
    const suggestions = JSON.parse(text);

    if (
      !suggestions.skills ||
      !suggestions.actions ||
      !suggestions.opportunities
    ) {
      throw new Error("Invalid Gemini response format");
    }

    return suggestions;
  } catch (error) {
    console.error("Gemini API Student Error:", error.message);
    throw new Error(`Failed to generate student suggestions: ${error.message}`);
  }
}

export default getStudentSuggestions;