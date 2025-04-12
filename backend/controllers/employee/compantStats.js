import yahooFinance from 'yahoo-finance2';

// Suppress the survey notice
yahooFinance.suppressNotices(['yahooSurvey']);

export const getCompanyStats = async (symbol) => {
    try {
        // Add .NS suffix for NSE stocks
        const nseSymbol = `${symbol}.NS`;
        
        // Get quote and company info
        const quote = await yahooFinance.quote(nseSymbol);
        const quoteSummary = await yahooFinance.quoteSummary(nseSymbol, {
            modules: ['price', 'summaryProfile', 'financialData']
        });

        if (!quote || !quoteSummary) {
            throw new Error('Unable to fetch company data');
        }

        const profile = quoteSummary.summaryProfile || {};
        const price = quoteSummary.price || {};
        const financials = quoteSummary.financialData || {};
        return {
            // companyName: price.longName || price.shortName || `${symbol} Limited`,
            // symbol: symbol,
            // exchange: 'NSE',
            // currency: quote.currency || 'INR',
            // currentPrice: quote.regularMarketPrice,
            stockPriceChange: quote.regularMarketChangePercent,
            // dayHigh: quote.regularMarketDayHigh,
            // dayLow: quote.regularMarketDayLow,
            // volume: quote.regularMarketVolume,
            // marketCap: quote.marketCap,
            // sector: profile.sector || 'Technology',
            employees: profile.fullTimeEmployees,
            // website: profile.website,
            financials: {
                // recommendationKey: financials.recommendationKey,
                // currentRatio: financials.currentRatio,
                // debtToEquity: financials.debtToEquity,
                // returnOnEquity: financials.returnOnEquity,
                revenueGrowth: financials.revenueGrowth,
                profitMargin: financials.profitMargins,
                // grossMargins: financials.grossMargins,
                // operatingMargins: financials.operatingMargins
            }
        };

    } catch (error) {
        console.error('Yahoo Finance fetch error:', error);
        return {
            companyName: `${symbol} Limited`,
            symbol: symbol,
            exchange: 'NSE',
            currency: 'INR',
            error: 'Detailed company data temporarily unavailable'
        };
    }
};