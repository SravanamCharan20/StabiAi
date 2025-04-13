import { generateSuggestions } from './suggestionEngine.js';

const validateEmployeeData = (data) => {
  if (!data) return false;
  
  // Check for required fields
  const requiredFields = ['job_title', 'performance_rating', 'years_at_company'];
  return requiredFields.every(field => field in data);
};

const validatePredictionData = (data) => {
  if (!data) return false;
  
  // Check for required nested structure
  return (
    data.prediction &&
    typeof data.prediction.layoff_risk !== 'undefined' &&
    data.data &&
    typeof data.data.revenue_growth !== 'undefined'
  );
};

const getSuggestions = async (req, res) => {
  try {
    const { employeeData, predictionData } = req.body;

    // Validate input data
    if (!validateEmployeeData(employeeData)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing employee data. Required fields: job_title, performance_rating, years_at_company'
      });
    }

    if (!validatePredictionData(predictionData)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing prediction data. Required fields: prediction.layoff_risk, data.revenue_growth'
      });
    }

    // Normalize the data
    const normalizedEmployeeData = {
      job_title: employeeData.job_title || '',
      performance_rating: Number(employeeData.performance_rating) || 0,
      years_at_company: Number(employeeData.years_at_company) || 0
    };

    const normalizedPredictionData = {
      prediction: {
        layoff_risk: predictionData.prediction.layoff_risk || 'moderate'
      },
      data: {
        revenue_growth: Number(predictionData.data.revenue_growth) || 0
      }
    };

    // Generate suggestions using normalized data
    const suggestions = generateSuggestions(normalizedEmployeeData, normalizedPredictionData);

    return res.status(200).json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating suggestions',
      error: error.message
    });
  }
};

export {
  getSuggestions
}; 