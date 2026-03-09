import { generateRagSuggestions } from '../../services/employeeRagService.js';
import { generateGeminiCustomizedSuggestions } from '../../services/employeeGeminiService.js';

function sanitizeResumeInsights(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    candidate_name: source.candidate_name || null,
    years_of_experience: Number.isFinite(Number(source.years_of_experience))
      ? Number(source.years_of_experience)
      : null,
    certifications: Array.isArray(source.certifications) ? source.certifications.slice(0, 8) : [],
    skills: Array.isArray(source.skills) ? source.skills.slice(0, 12) : [],
    ai_readiness_score: Number.isFinite(Number(source.ai_readiness_score))
      ? Number(source.ai_readiness_score)
      : null,
    parse_confidence: Number.isFinite(Number(source.parse_confidence))
      ? Number(source.parse_confidence)
      : null,
  };
}

/**
 * Generate career suggestions using retrieval-augmented grounding.
 * @param {Object} employeeData
 * @param {Object} predictionData
 * @returns {Promise<Object>}
 */
async function getSuggestions(employeeData, predictionData) {
  const sanitizedResume = sanitizeResumeInsights(
    employeeData?.resume_insights || predictionData?.resume_insights || null
  );
  const merged = {
    ...employeeData,
    layoff_risk: predictionData?.prediction?.layoff_risk || employeeData?.layoff_risk || 'Medium',
    resume_insights: sanitizedResume,
  };

  const predictionContext = {
    ...predictionData,
    resume_insights: sanitizedResume,
  };

  const ragSuggestions = generateRagSuggestions(merged, predictionContext);

  try {
    const geminiSuggestions = await generateGeminiCustomizedSuggestions(
      merged,
      predictionContext,
      ragSuggestions
    );
    if (geminiSuggestions) {
      return geminiSuggestions;
    }
  } catch (error) {
    console.warn('Gemini suggestions unavailable, using RAG fallback.');
  }

  return {
    ...ragSuggestions,
    generator: 'rag',
    generator_model: null,
  };
}

export default getSuggestions;
