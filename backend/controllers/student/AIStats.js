import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const advancedPromptEngineer = (studentData) => {
  return `
You are an AI analyst trained to assess how well a student's profile aligns with the tech industry's current job trends. Analyze the following student's data and provide scores (0–100) or probabilities (0.0–1.0) for each of the required metrics.

Respond ONLY in this strict JSON format:

{
  "degree_relevance_score": number,
  "skill_relevance_score": number,
  "certification_relevance_score": number,
  "project_stack_relevance_score": number,
  "internship_stack_relevance_score": number,
  "stack_versatility_score": number,
  "stack_alignment_score": number,
  "job_demand_for_role": number,
  "role_specific_layoff_rate": number
}

Input Data:
- CGPA: ${studentData.cgpa}
- Degree: ${studentData.degree}
- College Tier: ${studentData.college_tier}
- Years of Coding Experience: ${studentData.years_of_coding_experience}
- Hackathon Participation Count: ${studentData.hackathon_participation}
- Primary Tech Stack: ${studentData.primary_tech_stack}
- Skills: ${studentData.skills}
- Certifications: ${studentData.certifications}
- Project Tech Stacks: ${studentData.project_tech_stacks}
- Internship Tech Stacks: ${studentData.internship_tech_stacks}
- Preferred Job Title: ${studentData.preferred_job_title}

Scoring Guidelines:
- Degree Relevance: Based on how aligned the degree is with software roles.
- Skill Relevance: Match between skills and modern hiring demands.
- Certification Relevance: Weight of certifications like AWS, GCP, etc.
- Project Stack Relevance: Usage of modern, industry-relevant stacks.
- Internship Stack Relevance: Practical work in relevant tech environments.
- Stack Versatility: Breadth across frontend, backend, DevOps, ML, etc.
- Stack Alignment: Overlap between project, internship, and job title.
- Job Demand: Estimate probability (0.0 to 1.0) of job openings for the preferred role.
- Role-specific Layoff Rate: Estimate layoff probability (0.0 to 1.0) based on role risk in the current market.
Only return JSON. No extra commentary.
`;
};

const fetchStudentStats = async (studentData) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = advancedPromptEngineer(studentData);
  const result = await model.generateContent(prompt);
  const response = await result.response.text();

  try {
    const cleanedJson = response.match(/{[\s\S]+}/)?.[0];
    const parsed = JSON.parse(cleanedJson);
    return parsed;
  } catch (error) {
    console.error("Failed to parse Gemini JSON:", error.message);
    throw new Error("Gemini response format error");
  }
};

export default  fetchStudentStats ;