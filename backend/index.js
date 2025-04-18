import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors'
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import yahooFinance from 'yahoo-finance2';
import { SymbolConvertor } from './controllers/employee/SymbolConvertor.js';
import {getCompanyStats} from './controllers/employee/compantStats.js';
import getSuggestions from './controllers/employee/suggestionController.js';
import {getModelStats} from './controllers/investor/MLmodelStats.js'
import { getMLModelAIStats } from './controllers/investor/MLmodelaiStats.js';
import { getAISuggestions } from './controllers/investor/aiSuggestionController.js';

dotenv.config();
const PORT = process.env.PORT || 9000;
const app = express();
app.use(express.json());

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));

app.get('/', (req, res) => {
    res.send('Hello World');
});


app.post('/api/employee/predict', async (req, res) => {
    try {
        const {
            company_name,
            company_location,
            reporting_quarter,
            job_title,
            department,
            remote_work,
            years_at_company,
            salary_range,
            performance_rating
        } = req.body;

        const userData = {
            company_name,
            company_location,
            reporting_quarter,
            job_title,
            department,
            remote_work,
            years_at_company,
            salary_range,
            performance_rating
        }

        
        if (!company_name) {
            return res.status(400).json({
                success: false,
                message: 'Company name is required'
            });
        }

        try {
            const symbol = SymbolConvertor(company_name);
            // console.log("Converted symbol:", symbol);

            const companyStats = await getCompanyStats(symbol);

            // Convert financial metrics from decimals to percentages
            const revenueGrowth = (companyStats.financials.revenueGrowth || 0) * 100;
            const profitMargin = (companyStats.financials.profitMargin || 0) * 100;
            const stockPriceChange = (companyStats.stockPriceChange || 0) * 100;

            const finalData = {
                company_name: symbol,
                company_location,
                reporting_quarter,
                economic_condition_tag: "Moderate",
                past_layoffs: "No",
                job_title,
                department,
                remote_work,
                industry: "IT Services",
                revenue_growth: parseFloat(revenueGrowth.toFixed(2)),
                profit_margin: parseFloat(profitMargin.toFixed(2)),
                stock_price_change: stockPriceChange,
                total_employees: companyStats.employees || 25000,
                years_at_company: parseFloat(years_at_company),
                salary_range: parseFloat(salary_range),
                performance_rating: parseFloat(performance_rating),
                industry_layoff_rate: 2.9,
                unemployment_rate: 6.5,
                inflation_rate: 5.5
            };

            // console.log("Sending data to ML model:", finalData);

            const predictionResponse = await axios.post('https://layoff-prediction-api.onrender.com/predict', finalData);
            
            const predictionResult = predictionResponse.data;

            res.status(200).json({
                success: true,
                message: 'Data processed successfully',
                data: finalData,
                prediction: predictionResult
            });

        } catch (error) {
            console.error('Error:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Error processing company data',
                error: 'Failed to process company information'
            });
        }
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});


app.post("/api/suggestions", async (req, res) => {
  console.log("Received:", req.body);
  try {
    const { employeeData, predictionData } = req.body;
    if (!employeeData || !predictionData) {
      throw new Error("Missing employeeData or predictionData");
    }
    if (!predictionData.prediction || !predictionData.prediction.layoff_risk) {
      throw new Error("Invalid predictionData: missing prediction.layoff_risk");
    }
    const userData = {
      ...employeeData,
      layoff_risk: predictionData.prediction.layoff_risk,
    };
    const suggestions = await getSuggestions(userData);
    res.json({ success: true, suggestions });
  } catch (err) {
    console.error("Error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
});

const tiers = {
    'Tier 1': [
      "Tata Consultancy Services", "Infosys", "HCL Technologies", "Wipro",
      "Accenture", "IBM", "Cognizant", "Capgemini", "Microsoft India",
      "Google India", "Amazon Web Services", "SAP Labs India", "Deloitte",
      "EY (Ernst & Young)"
    ],
    'Tier 2': [
      "Tech Mahindra", "LTIMindtree", "Mphasis", "Coforge", "Persistent Systems",
      "Hexaware Technologies", "Mindtree", "L&T Technology Services",
      "Oracle Financial Services Software", "Genpact", "Cyient", "KPIT Technologies",
      "Tata Elxsi", "Happiest Minds Technologies", "Zoho Corporation"
    ],
    'Tier 3': [
      "Birlasoft", "Cigniti Technologies", "Brillio", "Amdocs", "Atlassian",
      "BMC Software", "CGI", "Cisco Systems", "Citrix Systems", "Dell Technologies",
      "DXC Technology", "EPAM Systems", "Ericsson", "Fiserv", "Fractal Analytics",
      "Fujitsu", "GlobalLogic", "HP Enterprise", "Intuit", "Salesforce India"
    ]
  }
  
  const getCompanyTier = (companyName) => {
    const companyNameLower = companyName.toLowerCase();
  
    for (let tier in tiers) {
      if (tiers[tier].some(company => company.toLowerCase() === companyNameLower)) {
        return tier;
      }
    }
    return 'Unknown'; // Return 'Unknown' if no tier is found
  }
  
  function getGeminiDefaultsByTier(tier) {
    const defaults = {
      "Tier 1": {
        layoff_frequency: 2,
        employee_attrition: 5,
        client_concentration: 20,
        geographic_diversification: 85,
        rnd_spending: 500000000,
        currency_risk: 4,
        global_it_spending: 3,
        digital_exposure: 90
      },
      "Tier 2": {
        layoff_frequency: 3,
        employee_attrition: 10,
        client_concentration: 30,
        geographic_diversification: 70,
        rnd_spending: 300000000,
        currency_risk: 6,
        global_it_spending: 2,
        digital_exposure: 75
      },
      "Tier 3": {
        layoff_frequency: 4,
        employee_attrition: 15,
        client_concentration: 40,
        geographic_diversification: 60,
        rnd_spending: 150000000,
        currency_risk: 7,
        global_it_spending: 1,
        digital_exposure: 60
      }
    };
  
    return defaults[tier] || defaults["Tier 1"];
  }

app.post('/api/investor/predict', async (req, res) => {
  const { company } = req.body;

  if (!company) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  try {
    const suggestions = await yahooFinance.search(company);
    const symbol = suggestions.quotes?.[0]?.symbol;

    if (!symbol) {
      return res.status(404).json({ error: 'Company symbol not found' });
    }

    const aimodelStats = await getMLModelAIStats(company, symbol);
    const companyTier = getCompanyTier(company);
    const modelStats = await getModelStats(symbol,companyTier);
    const geminiDefaults = getGeminiDefaultsByTier(companyTier);


    const finalData = {
        tier: companyTier,
        revenue_growth: modelStats.revenue_growth,
        profit_margin: modelStats.profit_margin,
        debt_to_equity: modelStats.debt_to_equity,
        free_cash_flow: modelStats.free_cash_flow,
        layoff_frequency: aimodelStats.layoff_frequency ?? geminiDefaults.layoff_frequency,
        employee_attrition: aimodelStats.employee_attrition ?? geminiDefaults.employee_attrition,
        client_concentration: aimodelStats.client_concentration ?? geminiDefaults.client_concentration,
        geographic_diversification: aimodelStats.geographic_diversification ?? geminiDefaults.geographic_diversification,
        rnd_spending: aimodelStats.rnd_spending ?? geminiDefaults.rnd_spending,
        stock_volatility: aimodelStats.stock_volatility,
        pe_ratio: modelStats.pe_ratio,
        beta: modelStats.beta,
        currency_risk: aimodelStats.currency_risk ?? geminiDefaults.currency_risk,
        global_it_spending: aimodelStats.global_it_spending ?? geminiDefaults.global_it_spending,
        digital_exposure: aimodelStats.digital_exposure ?? geminiDefaults.digital_exposure
      };
    // console.log(finalData)
    const predictionData = await axios.post('https://investor-risk-predictor-api.onrender.com/predict', finalData);
    // console.log(predictionData.data)
    const aiSuggestions = await getAISuggestions(finalData, predictionData.data.risk_label, predictionData.data.probability);

    const result = {
        ...finalData,
        predictedData: {
          risk_label: predictionData.data.risk_label,
          probability: predictionData.data.probability
        },
        aiSuggestions: aiSuggestions 
      };
  
      return res.json(result);

  } catch (error) {
    console.error('Error in prediction route:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
  
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.log(err);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
