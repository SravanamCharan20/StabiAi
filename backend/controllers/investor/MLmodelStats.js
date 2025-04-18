import yahooFinance from 'yahoo-finance2'

yahooFinance.suppressNotices(['ripHistorical'])

const getDefaultFCFByTier = (tier) => {
  switch (tier) {
    case 'Tier 1':
      return 3000000000; // ₹3B
    case 'Tier 2':
      return 1000000000; // ₹1B
    case 'Tier 3':
      return 300000000;  // ₹300M
    default:
      return 500000000;  // Conservative fallback
  }
}
export const getModelStats = async (symbol, tier) => {
    try {
      const now = Math.floor(Date.now() / 1000)
      const oneYearAgo = now - 365 * 24 * 60 * 60
  
      const [quoteSummary, chartData, quote] = await Promise.all([
        yahooFinance.quoteSummary(symbol, {
          modules: [
            'financialData',
            'defaultKeyStatistics',
            'cashflowStatementHistory'
          ]
        }),
        yahooFinance.chart(symbol, {
          period1: oneYearAgo,
          period2: now,
          interval: '1d'
        }),
        yahooFinance.quote(symbol)
      ])
  
      const fin = quoteSummary.financialData || {}
      const stats = quoteSummary.defaultKeyStatistics || {}
      const cashFlowHistory = quoteSummary.cashflowStatementHistory?.cashflowStatements?.[0] || {}
  
      // 1. Try actual FCF from Yahoo
      let freeCashFlow = fin.freeCashflow
  
      // 2. Calculate if missing
      if (!freeCashFlow && cashFlowHistory.totalCashFromOperatingActivities && cashFlowHistory.capitalExpenditures) {
        freeCashFlow = cashFlowHistory.totalCashFromOperatingActivities - cashFlowHistory.capitalExpenditures
      }
  
      // 3. Estimate using Tier fallback
      if (!freeCashFlow) {
        freeCashFlow = getDefaultFCFByTier(tier)
      }
  
      const data = {
        symbol,
        revenue_growth: fin.revenueGrowth ?? 0,
        profit_margin: fin.profitMargins ?? 0,
        debt_to_equity: fin.debtToEquity ?? 0,
        free_cash_flow: freeCashFlow,
        pe_ratio: fin.trailingPE ?? null,
        beta: stats.beta ?? 1,
      }
  
      if (!data.pe_ratio && quote.regularMarketPrice && quote.epsTrailingTwelveMonths) {
        data.pe_ratio = quote.regularMarketPrice / quote.epsTrailingTwelveMonths
      }
  
      return data
    } catch (err) {
      console.error('Yahoo Finance Error:', err.message)
      throw new Error('Failed to fetch data from Yahoo Finance')
    }
  }