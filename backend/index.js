import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors'
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { SymbolConvertor } from './controllers/employee/SymbolConvertor.js';
import {getCompanyStats} from './controllers/employee/compantStats.js';

dotenv.config();
const PORT = process.env.PORT || 9000;
const app = express();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.json());

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));

app.get('/', (req, res) => {
    res.send('Hello World');
});

// AI Suggestions endpoint
app.post('/api/ai/suggestions', async (req, res) => {
    try {
        const { prompt } = req.body;

        // Get the generative model
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Generate suggestions
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const suggestions = response.text()
            .split('\n')
            .filter(line => line.trim())
            .map(line => line.replace(/^\d+\.\s*/, ''));

        res.json({ suggestions });
    } catch (error) {
        console.error('AI Suggestion Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate AI suggestions',
            error: error.message
        });
    }
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
        
        if (!company_name) {
            return res.status(400).json({
                success: false,
                message: 'Company name is required'
            });
        }

        try {
            const symbol = SymbolConvertor(company_name);
            console.log("Converted symbol:", symbol);

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

            console.log("Sending data to ML model:", finalData);

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
