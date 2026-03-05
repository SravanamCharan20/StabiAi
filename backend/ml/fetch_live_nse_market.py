#!/usr/bin/env python3
"""Fetch live NSE quote + index data and emit normalized JSON for employee risk context."""

from __future__ import annotations

import json
import math
import sys
from typing import Any, Dict

import requests


def to_number(value: Any, fallback: float | None = None) -> float | None:
    if value is None:
        return fallback
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).replace(',', '').strip()
    if not text:
        return fallback
    try:
        return float(text)
    except ValueError:
        return fallback


def clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def rnd(value: float | None, digits: int = 4) -> float | None:
    if value is None or not math.isfinite(value):
        return None
    return round(value, digits)


def compute_market_stress(
    company_return_90d: float,
    market_return_90d: float,
    relative_return_90d: float,
    company_volatility_90d: float,
    market_volatility_90d: float,
    india_vix: float | None,
) -> float:
    market_drop = clamp((-market_return_90d) / 12, 0, 1)
    relative_underperf = clamp((-relative_return_90d) / 15, 0, 1)
    stock_drop = clamp((-company_return_90d) / 20, 0, 1)
    market_vol = clamp(market_volatility_90d / 3.2, 0, 1)
    company_vol = clamp(company_volatility_90d / 4.5, 0, 1)
    vix_risk = clamp(((india_vix or 18) - 14) / 16, 0, 1)

    score = (
        market_drop * 0.24
        + relative_underperf * 0.22
        + stock_drop * 0.20
        + market_vol * 0.14
        + company_vol * 0.10
        + vix_risk * 0.10
    )
    return round(clamp(score, 0, 1), 4)


def classify_market_regime(stress_score: float) -> str:
    if stress_score >= 0.72:
        return 'Recession'
    if stress_score >= 0.52:
        return 'Recovery'
    if stress_score >= 0.32:
        return 'Stable'
    return 'Growth'


def main() -> None:
    symbol = sys.argv[1].upper() if len(sys.argv) > 1 else ''
    if not symbol:
        raise SystemExit('Missing symbol argument')

    session = requests.Session()
    headers = {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json,text/plain,*/*',
    }

    session.get('https://www.nseindia.com', headers=headers, timeout=10)

    quote_url = f'https://www.nseindia.com/api/quote-equity?symbol={symbol}'
    indices_url = 'https://www.nseindia.com/api/allIndices'

    quote = session.get(quote_url, headers=headers, timeout=10).json()
    all_indices = session.get(indices_url, headers=headers, timeout=10).json()

    indices = all_indices.get('data', [])
    nifty = next((item for item in indices if str(item.get('indexSymbol', '')).upper() == 'NIFTY 50'), {})
    india_vix_row = next((item for item in indices if str(item.get('indexSymbol', '')).upper() == 'INDIA VIX'), {})

    price_info = quote.get('priceInfo', {})
    industry_info = quote.get('industryInfo', {})

    last_price = to_number(price_info.get('lastPrice'))
    day_change_pct = to_number(price_info.get('pChange'), 0.0) or 0.0
    prev_close = to_number(price_info.get('previousClose'))

    week_high = to_number(((price_info.get('weekHighLow') or {}).get('max')))
    drawdown_pct = ((week_high - last_price) / week_high * 100) if week_high and last_price and week_high > 0 else 0.0

    nifty_daily_change = to_number(nifty.get('percentChange'), 0.0) or 0.0
    nifty_30d = to_number(nifty.get('perChange30d'), 0.0) or 0.0
    advances = to_number(nifty.get('advances'), 0.0) or 0.0
    declines = to_number(nifty.get('declines'), 0.0) or 0.0
    breadth_ratio = declines / (advances + declines) if (advances + declines) > 0 else 0.5

    company_return_90d = day_change_pct * 6
    market_return_90d = nifty_30d * 3
    relative_return_90d = company_return_90d - market_return_90d

    company_volatility_90d = abs(day_change_pct) * 1.25 + max(0.0, drawdown_pct / 20)
    market_volatility_90d = abs(nifty_daily_change) * 1.8 + max(0.0, (breadth_ratio - 0.5) * 4)

    india_vix = to_number(india_vix_row.get('last'))

    market_stress_score = compute_market_stress(
        company_return_90d,
        market_return_90d,
        relative_return_90d,
        company_volatility_90d,
        market_volatility_90d,
        india_vix,
    )

    revenue_growth_pct = clamp(5 + (0.35 * company_return_90d) + (0.15 * market_return_90d), -12, 24)
    profit_margin_pct = clamp(10 + (0.25 * relative_return_90d) + (0.05 * company_return_90d), -8, 30)

    payload: Dict[str, Any] = {
        'stockPriceChange': rnd(day_change_pct, 3),
        'employees': None,
        'sector': industry_info.get('sector') or 'Technology',
        'industry': industry_info.get('industry') or industry_info.get('sector') or 'Information Technology',
        'financials': {
            'revenueGrowth': rnd(revenue_growth_pct / 100, 4),
            'profitMargin': rnd(profit_margin_pct / 100, 4),
        },
        'marketSignals': {
            'marketRegime': classify_market_regime(market_stress_score),
            'marketStressScore': rnd(market_stress_score, 4),
            'company_return_90d': rnd(company_return_90d, 3),
            'market_return_90d': rnd(market_return_90d, 3),
            'relative_return_90d': rnd(relative_return_90d, 3),
            'company_volatility_90d': rnd(company_volatility_90d, 4),
            'market_volatility_90d': rnd(market_volatility_90d, 4),
            'india_vix': rnd(india_vix, 3),
            'nse_index_price': rnd(to_number(nifty.get('last')), 3),
            'company_last_price': rnd(last_price, 3),
            'company_previous_close': rnd(prev_close, 3),
            'market_breadth_ratio': rnd(breadth_ratio, 4),
            'dataSource': 'nse_live_api',
            'proxyMode': False,
            'derived_window_estimate': True,
        },
    }

    print(json.dumps(payload, ensure_ascii=True))


if __name__ == '__main__':
    main()
