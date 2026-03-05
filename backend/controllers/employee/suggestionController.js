import { generateRagSuggestions } from '../../services/employeeRagService.js';
import { generateGeminiCustomizedSuggestions } from '../../services/employeeGeminiService.js';

/**
 * Generate career suggestions using retrieval-augmented grounding.
 * @param {Object} employeeData
 * @param {Object} predictionData
 * @returns {Promise<Object>}
 */
async function getSuggestions(employeeData, predictionData) {
  const merged = {
    ...employeeData,
    layoff_risk: predictionData?.prediction?.layoff_risk || employeeData?.layoff_risk || 'Medium',
  };

  const ragSuggestions = generateRagSuggestions(merged, predictionData);

  try {
    const geminiSuggestions = await generateGeminiCustomizedSuggestions(
      merged,
      predictionData,
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
