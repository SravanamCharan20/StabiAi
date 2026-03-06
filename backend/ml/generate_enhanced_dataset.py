#!/usr/bin/env python3
"""Generate an improved synthetic employee layoff dataset with stronger causal structure."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List

import numpy as np
import pandas as pd


@dataclass(frozen=True)
class CompanyProfile:
    name: str
    industry: str
    base_employees: int
    salary_multiplier: float
    risk_bias: float
    growth_bias: float


@dataclass(frozen=True)
class IndustryProfile:
    name: str
    base_layoff_rate: float
    base_growth: float
    base_margin: float
    remote_share: float


@dataclass(frozen=True)
class RoleProfile:
    title: str
    department: str
    base_salary: int
    risk_bias: float
    remote_friendly: float


INDUSTRIES: Dict[str, IndustryProfile] = {
    "Information Technology": IndustryProfile("Information Technology", 1.4, 8.2, 15.5, 0.62),
    "Financial Services": IndustryProfile("Financial Services", 1.1, 6.1, 18.0, 0.45),
    "Telecommunications": IndustryProfile("Telecommunications", 1.8, 4.8, 13.0, 0.32),
    "E-commerce": IndustryProfile("E-commerce", 2.0, 10.0, 8.5, 0.58),
    "Healthcare": IndustryProfile("Healthcare", 0.9, 5.0, 16.0, 0.30),
    "Manufacturing": IndustryProfile("Manufacturing", 1.6, 4.3, 11.5, 0.22),
    "Consulting": IndustryProfile("Consulting", 1.2, 7.2, 16.5, 0.52),
}


COMPANIES: List[CompanyProfile] = [
    CompanyProfile("Tata Consultancy Services (TCS)", "Information Technology", 615000, 1.05, -0.25, 0.20),
    CompanyProfile("Infosys", "Information Technology", 345000, 1.00, -0.20, 0.12),
    CompanyProfile("Wipro Limited", "Information Technology", 240000, 0.98, -0.05, 0.04),
    CompanyProfile("HCL Technologies", "Information Technology", 225000, 1.02, -0.15, 0.10),
    CompanyProfile("Tech Mahindra Ltd.", "Information Technology", 152000, 0.95, 0.05, -0.03),
    CompanyProfile("LTIMindtree", "Information Technology", 82000, 0.98, 0.02, 0.01),
    CompanyProfile("Mphasis", "Information Technology", 35000, 0.97, 0.08, -0.01),
    CompanyProfile("Coforge", "Information Technology", 28000, 1.00, -0.04, 0.05),
    CompanyProfile("Persistent Systems", "Information Technology", 26000, 1.02, -0.08, 0.06),
    CompanyProfile("Oracle Financial Services Software Ltd.", "Financial Services", 28000, 1.08, -0.12, 0.02),
    CompanyProfile("HDFC Bank", "Financial Services", 170000, 1.10, -0.18, 0.00),
    CompanyProfile("ICICI Bank", "Financial Services", 130000, 1.08, -0.10, -0.01),
    CompanyProfile("Axis Bank", "Financial Services", 90000, 1.05, -0.06, -0.02),
    CompanyProfile("Paytm", "Financial Services", 18000, 1.15, 0.20, 0.03),
    CompanyProfile("Razorpay", "Financial Services", 12000, 1.18, 0.15, 0.05),
    CompanyProfile("Jio Platforms", "Telecommunications", 90000, 1.06, -0.08, 0.02),
    CompanyProfile("Bharti Airtel", "Telecommunications", 68000, 1.03, -0.05, -0.01),
    CompanyProfile("Vodafone Idea", "Telecommunications", 10000, 0.92, 0.35, -0.15),
    CompanyProfile("Amazon Development Centre India Pvt Ltd", "E-commerce", 155000, 1.25, 0.05, 0.12),
    CompanyProfile("Amazon India", "E-commerce", 120000, 1.22, 0.02, 0.10),
    CompanyProfile("Flipkart Internet Pvt Ltd", "E-commerce", 40000, 1.12, 0.18, 0.04),
    CompanyProfile("Meesho", "E-commerce", 7000, 1.08, 0.25, 0.02),
    CompanyProfile("Myntra", "E-commerce", 5000, 1.05, 0.15, 0.01),
    CompanyProfile("Google India", "Information Technology", 18000, 1.36, -0.22, 0.16),
    CompanyProfile("Meta India", "Information Technology", 7000, 1.40, -0.12, 0.13),
    CompanyProfile("Facebook India", "Information Technology", 6500, 1.35, -0.09, 0.10),
    CompanyProfile("Microsoft India", "Information Technology", 24000, 1.32, -0.18, 0.14),
    CompanyProfile("Apple India", "Information Technology", 9000, 1.38, -0.10, 0.09),
    CompanyProfile("Netflix India", "Information Technology", 3000, 1.44, 0.06, 0.07),
    CompanyProfile("IBM India", "Information Technology", 140000, 1.08, -0.06, 0.03),
    CompanyProfile("Cognizant India", "Information Technology", 255000, 1.03, -0.07, 0.04),
    CompanyProfile("Apollo Hospitals", "Healthcare", 70000, 1.00, -0.20, 0.00),
    CompanyProfile("Fortis Healthcare", "Healthcare", 25000, 0.98, -0.12, -0.01),
    CompanyProfile("Cipla", "Healthcare", 26000, 1.06, -0.08, 0.02),
    CompanyProfile("Sun Pharma", "Healthcare", 38000, 1.08, -0.10, 0.03),
    CompanyProfile("Tata Motors", "Manufacturing", 75000, 1.04, -0.05, 0.00),
    CompanyProfile("Mahindra & Mahindra", "Manufacturing", 82000, 1.02, -0.03, -0.01),
    CompanyProfile("Bajaj Auto", "Manufacturing", 9000, 1.07, -0.12, 0.02),
    CompanyProfile("Larsen & Toubro", "Manufacturing", 50000, 1.05, -0.08, 0.01),
    CompanyProfile("Accenture India Pvt Ltd", "Consulting", 300000, 1.18, -0.15, 0.05),
    CompanyProfile("Deloitte India", "Consulting", 110000, 1.16, -0.12, 0.03),
    CompanyProfile("EY India", "Consulting", 80000, 1.14, -0.10, 0.02),
    CompanyProfile("PwC India", "Consulting", 70000, 1.12, -0.08, 0.01),
    CompanyProfile("Capgemini India", "Consulting", 175000, 1.07, -0.06, 0.00),
]


ROLES: List[RoleProfile] = [
    RoleProfile("Software Engineer", "Engineering", 1300000, 0.10, 0.82),
    RoleProfile("Senior Software Engineer", "Engineering", 1900000, 0.00, 0.80),
    RoleProfile("Technical Lead", "Engineering", 2600000, -0.08, 0.76),
    RoleProfile("Engineering Manager", "Management", 3400000, -0.12, 0.62),
    RoleProfile("DevOps Engineer", "Engineering", 1800000, 0.02, 0.70),
    RoleProfile("Site Reliability Engineer", "Engineering", 2100000, 0.04, 0.76),
    RoleProfile("QA Engineer", "Engineering", 1200000, 0.24, 0.58),
    RoleProfile("Data Analyst", "Analytics", 1400000, 0.12, 0.64),
    RoleProfile("Data Scientist", "Analytics", 2200000, -0.10, 0.74),
    RoleProfile("Machine Learning Engineer", "Analytics", 2400000, -0.16, 0.76),
    RoleProfile("Cybersecurity Analyst", "IT", 1700000, -0.04, 0.52),
    RoleProfile("Cloud Engineer", "Engineering", 2100000, -0.08, 0.78),
    RoleProfile("Support Engineer", "IT", 950000, 0.28, 0.30),
    RoleProfile("Product Manager", "Product", 3000000, -0.10, 0.60),
    RoleProfile("Project Manager", "Management", 2800000, 0.06, 0.48),
    RoleProfile("Business Analyst", "Management", 1600000, 0.10, 0.52),
    RoleProfile("Finance Analyst", "Finance", 1400000, 0.16, 0.22),
    RoleProfile("Accountant", "Finance", 1000000, 0.20, 0.16),
    RoleProfile("HR Specialist", "HR", 1000000, 0.20, 0.34),
    RoleProfile("Recruiter", "HR", 900000, 0.35, 0.50),
    RoleProfile("Customer Success Manager", "Operations", 1500000, 0.22, 0.46),
    RoleProfile("Sales Executive", "Sales", 1200000, 0.30, 0.24),
    RoleProfile("UI/UX Designer", "Product", 1500000, 0.06, 0.70),
    RoleProfile("Solution Architect", "Engineering", 3200000, -0.20, 0.68),
]

ROLE_TECH_STACKS: Dict[str, List[str]] = {
    "Software Engineer": ["Java + Spring Boot", "Node.js + React", "Python + FastAPI", "Go + Microservices"],
    "Senior Software Engineer": ["Java + Spring Boot", "Node.js + React", "Python + Django", ".NET + Azure"],
    "Technical Lead": ["Java + Spring Boot", "Node.js + Microservices", ".NET + Azure", "Kubernetes + AWS"],
    "Engineering Manager": ["Agile + Jira + Architecture Reviews", "Cloud Delivery + Program Governance"],
    "DevOps Engineer": ["Docker + Kubernetes + AWS", "Terraform + CI/CD + GCP", "Linux + Ansible + Observability"],
    "Site Reliability Engineer": ["Kubernetes + SRE + Observability", "Linux + Prometheus + Grafana", "AWS + Incident Response"],
    "QA Engineer": ["Selenium + Cypress + API Testing", "Playwright + CI Test Automation", "Manual QA + Regression Testing"],
    "Data Analyst": ["SQL + Power BI + Excel", "SQL + Tableau + Python", "Excel + SQL + Reporting"],
    "Data Scientist": ["Python + ML + SQL", "PySpark + MLflow + Python", "Python + NLP + Statistics"],
    "Machine Learning Engineer": ["Python + TensorFlow + MLOps", "PyTorch + Kubernetes + MLflow", "LLM Ops + Vector DB + Python"],
    "Cybersecurity Analyst": ["SIEM + SOC + Threat Hunting", "Cloud Security + IAM + Zero Trust", "VAPT + Incident Response"],
    "Cloud Engineer": ["AWS + Terraform + Kubernetes", "Azure + DevOps + IaC", "GCP + Docker + Networking"],
    "Support Engineer": ["ITSM + Linux + SQL", "Application Support + Monitoring", "Ticketing + Debugging + Scripting"],
    "Product Manager": ["Product Analytics + SQL + A/B Testing", "Roadmapping + Jira + Experimentation"],
    "Project Manager": ["Agile + Jira + Stakeholder Management", "Program Planning + Risk Tracking"],
    "Business Analyst": ["SQL + Excel + Process Mapping", "Data Modeling + Power BI + Requirements"],
    "Finance Analyst": ["Excel + Power BI + SQL", "SAP + Financial Modeling"],
    "Accountant": ["Tally + Excel + GST", "SAP Finance + Compliance"],
    "HR Specialist": ["HRMS + Excel + Analytics", "People Analytics + HR Operations"],
    "Recruiter": ["ATS + LinkedIn Recruiter", "Sourcing Automation + Talent Analytics"],
    "Customer Success Manager": ["CRM + Customer Analytics", "SaaS Onboarding + QBR Playbooks"],
    "Sales Executive": ["CRM + Sales Analytics", "Pipeline Automation + Prospecting Tools"],
    "UI/UX Designer": ["Figma + Design Systems", "UX Research + Prototyping"],
    "Solution Architect": ["Cloud Architecture + Microservices", "Enterprise Integration + API Design"],
}

TECH_STACK_RISK_BIAS: Dict[str, float] = {
    "Java + Spring Boot": -0.06,
    "Node.js + React": -0.05,
    "Python + FastAPI": -0.08,
    "Go + Microservices": -0.09,
    "Python + Django": -0.03,
    ".NET + Azure": -0.05,
    "Node.js + Microservices": -0.08,
    "Kubernetes + AWS": -0.10,
    "Agile + Jira + Architecture Reviews": -0.04,
    "Cloud Delivery + Program Governance": -0.05,
    "Docker + Kubernetes + AWS": -0.11,
    "Terraform + CI/CD + GCP": -0.10,
    "Linux + Ansible + Observability": -0.07,
    "Kubernetes + SRE + Observability": -0.11,
    "Linux + Prometheus + Grafana": -0.08,
    "AWS + Incident Response": -0.06,
    "Selenium + Cypress + API Testing": -0.03,
    "Playwright + CI Test Automation": -0.05,
    "Manual QA + Regression Testing": 0.16,
    "SQL + Power BI + Excel": -0.02,
    "SQL + Tableau + Python": -0.04,
    "Excel + SQL + Reporting": 0.08,
    "Python + ML + SQL": -0.09,
    "PySpark + MLflow + Python": -0.12,
    "Python + NLP + Statistics": -0.08,
    "Python + TensorFlow + MLOps": -0.13,
    "PyTorch + Kubernetes + MLflow": -0.14,
    "LLM Ops + Vector DB + Python": -0.15,
    "SIEM + SOC + Threat Hunting": -0.11,
    "Cloud Security + IAM + Zero Trust": -0.12,
    "VAPT + Incident Response": -0.07,
    "AWS + Terraform + Kubernetes": -0.12,
    "Azure + DevOps + IaC": -0.09,
    "GCP + Docker + Networking": -0.08,
    "ITSM + Linux + SQL": 0.02,
    "Application Support + Monitoring": 0.04,
    "Ticketing + Debugging + Scripting": 0.06,
    "Product Analytics + SQL + A/B Testing": -0.06,
    "Roadmapping + Jira + Experimentation": -0.04,
    "Agile + Jira + Stakeholder Management": 0.00,
    "Program Planning + Risk Tracking": 0.03,
    "SQL + Excel + Process Mapping": 0.03,
    "Data Modeling + Power BI + Requirements": -0.02,
    "Excel + Power BI + SQL": 0.01,
    "SAP + Financial Modeling": 0.04,
    "Tally + Excel + GST": 0.10,
    "SAP Finance + Compliance": 0.03,
    "HRMS + Excel + Analytics": 0.06,
    "People Analytics + HR Operations": 0.02,
    "ATS + LinkedIn Recruiter": 0.08,
    "Sourcing Automation + Talent Analytics": 0.03,
    "CRM + Customer Analytics": 0.02,
    "SaaS Onboarding + QBR Playbooks": 0.01,
    "CRM + Sales Analytics": 0.07,
    "Pipeline Automation + Prospecting Tools": 0.04,
    "Figma + Design Systems": -0.03,
    "UX Research + Prototyping": -0.02,
    "Cloud Architecture + Microservices": -0.10,
    "Enterprise Integration + API Design": -0.07,
}

ROLE_DEMAND_INDEX: Dict[str, float] = {
    "Software Engineer": 8.0,
    "Senior Software Engineer": 7.8,
    "Technical Lead": 7.4,
    "Engineering Manager": 6.8,
    "DevOps Engineer": 8.4,
    "Site Reliability Engineer": 8.2,
    "QA Engineer": 6.2,
    "Data Analyst": 7.0,
    "Data Scientist": 8.0,
    "Machine Learning Engineer": 8.8,
    "Cybersecurity Analyst": 8.6,
    "Cloud Engineer": 8.5,
    "Support Engineer": 5.8,
    "Product Manager": 7.3,
    "Project Manager": 6.4,
    "Business Analyst": 6.6,
    "Finance Analyst": 6.0,
    "Accountant": 5.4,
    "HR Specialist": 5.3,
    "Recruiter": 5.1,
    "Customer Success Manager": 6.0,
    "Sales Executive": 5.7,
    "UI/UX Designer": 6.8,
    "Solution Architect": 8.0,
}

DEPARTMENT_RESILIENCE_INDEX: Dict[str, float] = {
    "Engineering": 8.1,
    "Analytics": 7.8,
    "Product": 7.1,
    "IT": 7.3,
    "Operations": 6.2,
    "Finance": 5.9,
    "HR": 5.2,
    "Sales": 5.7,
    "Management": 6.5,
}

AI_RELEVANT_STACK_MARKERS = (
    "llm",
    "ml",
    "mlops",
    "tensorflow",
    "pytorch",
    "data",
    "ai",
    "cloud",
    "kubernetes",
    "devops",
    "security",
)

LEGACY_STACK_MARKERS = (
    "manual qa",
    "tally",
    "ticketing",
    "excel + sql + reporting",
)


LOCATION_PROFILES = {
    "Bengaluru": {"weight": 0.21, "salary_multiplier": 1.12, "unemployment_offset": -0.5, "inflation_offset": 0.00},
    "Mumbai": {"weight": 0.16, "salary_multiplier": 1.10, "unemployment_offset": -0.4, "inflation_offset": 0.05},
    "Hyderabad": {"weight": 0.14, "salary_multiplier": 1.05, "unemployment_offset": -0.3, "inflation_offset": -0.05},
    "Chennai": {"weight": 0.11, "salary_multiplier": 1.00, "unemployment_offset": -0.2, "inflation_offset": -0.05},
    "Pune": {"weight": 0.10, "salary_multiplier": 1.02, "unemployment_offset": -0.2, "inflation_offset": -0.03},
    "Noida": {"weight": 0.07, "salary_multiplier": 0.98, "unemployment_offset": 0.1, "inflation_offset": 0.02},
    "Gurugram": {"weight": 0.07, "salary_multiplier": 1.08, "unemployment_offset": -0.1, "inflation_offset": 0.05},
    "Kolkata": {"weight": 0.04, "salary_multiplier": 0.90, "unemployment_offset": 0.5, "inflation_offset": -0.02},
    "Ahmedabad": {"weight": 0.03, "salary_multiplier": 0.88, "unemployment_offset": 0.3, "inflation_offset": -0.02},
    "Kochi": {"weight": 0.03, "salary_multiplier": 0.86, "unemployment_offset": 0.2, "inflation_offset": -0.03},
    "Coimbatore": {"weight": 0.02, "salary_multiplier": 0.84, "unemployment_offset": 0.4, "inflation_offset": -0.03},
    "Delhi": {"weight": 0.02, "salary_multiplier": 1.03, "unemployment_offset": 0.2, "inflation_offset": 0.06},
}


QUARTER_MACRO = {
    "Q1 2023": {"condition_weights": {"Recession": 0.45, "Recovery": 0.35, "Stable": 0.15, "Growth": 0.05}, "unemployment": 8.1, "inflation": 6.9, "growth_shift": -1.5},
    "Q2 2023": {"condition_weights": {"Recession": 0.35, "Recovery": 0.38, "Stable": 0.20, "Growth": 0.07}, "unemployment": 7.8, "inflation": 6.7, "growth_shift": -1.0},
    "Q3 2023": {"condition_weights": {"Recession": 0.20, "Recovery": 0.40, "Stable": 0.28, "Growth": 0.12}, "unemployment": 7.3, "inflation": 6.3, "growth_shift": -0.2},
    "Q4 2023": {"condition_weights": {"Recession": 0.14, "Recovery": 0.30, "Stable": 0.36, "Growth": 0.20}, "unemployment": 6.9, "inflation": 6.0, "growth_shift": 0.3},
    "Q1 2024": {"condition_weights": {"Recession": 0.10, "Recovery": 0.25, "Stable": 0.42, "Growth": 0.23}, "unemployment": 6.6, "inflation": 5.8, "growth_shift": 0.7},
    "Q2 2024": {"condition_weights": {"Recession": 0.08, "Recovery": 0.22, "Stable": 0.40, "Growth": 0.30}, "unemployment": 6.4, "inflation": 5.7, "growth_shift": 1.1},
    "Q3 2024": {"condition_weights": {"Recession": 0.07, "Recovery": 0.20, "Stable": 0.38, "Growth": 0.35}, "unemployment": 6.1, "inflation": 5.5, "growth_shift": 1.4},
    "Q4 2024": {"condition_weights": {"Recession": 0.09, "Recovery": 0.20, "Stable": 0.42, "Growth": 0.29}, "unemployment": 6.0, "inflation": 5.4, "growth_shift": 1.2},
    "Q1 2025": {"condition_weights": {"Recession": 0.08, "Recovery": 0.18, "Stable": 0.44, "Growth": 0.30}, "unemployment": 5.9, "inflation": 5.2, "growth_shift": 1.3},
    "Q2 2025": {"condition_weights": {"Recession": 0.08, "Recovery": 0.17, "Stable": 0.45, "Growth": 0.30}, "unemployment": 5.8, "inflation": 5.1, "growth_shift": 1.2},
    "Q3 2025": {"condition_weights": {"Recession": 0.10, "Recovery": 0.20, "Stable": 0.44, "Growth": 0.26}, "unemployment": 5.9, "inflation": 5.3, "growth_shift": 0.8},
    "Q4 2025": {"condition_weights": {"Recession": 0.13, "Recovery": 0.24, "Stable": 0.42, "Growth": 0.21}, "unemployment": 6.1, "inflation": 5.5, "growth_shift": 0.2},
}


CONDITION_GROWTH_SHIFT = {
    "Recession": -3.2,
    "Recovery": -0.5,
    "Stable": 0.7,
    "Growth": 2.1,
}

CONDITION_LAYOFF_SHIFT = {
    "Recession": 1.1,
    "Recovery": 0.4,
    "Stable": -0.1,
    "Growth": -0.45,
}


def weighted_choice(items: List[str], weights: List[float], rng: np.random.Generator) -> str:
    return items[int(rng.choice(len(items), p=np.array(weights) / np.sum(weights)))]


def clamp(value: float, lower: float, upper: float) -> float:
    return float(max(lower, min(upper, value)))


def choose_performance_rating(mean_score: float, rng: np.random.Generator) -> int:
    score = int(np.round(rng.normal(mean_score, 0.85)))
    return int(np.clip(score, 1, 5))

def choose_tech_stack(job_title: str, rng: np.random.Generator) -> str:
    options = ROLE_TECH_STACKS.get(job_title) or ["General Business Tools"]
    idx = int(rng.integers(0, len(options)))
    return options[idx]

def parse_reporting_year(reporting_quarter: str) -> int:
    parts = str(reporting_quarter).split()
    if len(parts) < 2:
        return 2024
    try:
        return int(parts[-1])
    except ValueError:
        return 2024

def estimate_stack_trend_score(tech_stack: str, tech_stack_bias: float, reporting_quarter: str, rng: np.random.Generator) -> float:
    text = str(tech_stack or "").lower()
    year = parse_reporting_year(reporting_quarter)

    ai_boost = 0.0
    if year >= 2024 and any(marker in text for marker in AI_RELEVANT_STACK_MARKERS):
        ai_boost += 0.55 if year == 2024 else 0.9

    legacy_penalty = -0.65 if any(marker in text for marker in LEGACY_STACK_MARKERS) else 0.0

    score = 6.2 + (-tech_stack_bias * 14.0) + ai_boost + legacy_penalty + rng.normal(0.0, 0.45)
    return clamp(score, 2.2, 9.8)


def generate_rows(row_count: int, seed: int) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    company_weights = [max(0.5, np.sqrt(c.base_employees)) for c in COMPANIES]
    location_names = list(LOCATION_PROFILES.keys())
    location_weights = [LOCATION_PROFILES[name]["weight"] for name in location_names]
    quarter_names = list(QUARTER_MACRO.keys())
    quarter_weights = [1.0 + (idx / len(quarter_names)) * 0.12 for idx, _ in enumerate(quarter_names)]
    role_titles = [role.title for role in ROLES]
    role_weights = [
        0.15,
        0.11,
        0.06,
        0.03,
        0.07,
        0.05,
        0.06,
        0.05,
        0.05,
        0.03,
        0.04,
        0.05,
        0.04,
        0.03,
        0.04,
        0.03,
        0.025,
        0.02,
        0.02,
        0.02,
        0.03,
        0.03,
        0.02,
        0.02,
    ]

    role_lookup = {role.title: role for role in ROLES}

    rows = []
    for _ in range(row_count):
        company = COMPANIES[int(rng.choice(len(COMPANIES), p=np.array(company_weights) / np.sum(company_weights)))]
        industry_profile = INDUSTRIES[company.industry]

        company_location = weighted_choice(location_names, location_weights, rng)
        location_profile = LOCATION_PROFILES[company_location]

        reporting_quarter = weighted_choice(quarter_names, quarter_weights, rng)
        quarter_macro = QUARTER_MACRO[reporting_quarter]

        econ_tags = list(quarter_macro["condition_weights"].keys())
        econ_weights = list(quarter_macro["condition_weights"].values())
        economic_condition_tag = weighted_choice(econ_tags, econ_weights, rng)

        job_title = weighted_choice(role_titles, role_weights, rng)
        role = role_lookup[job_title]
        tech_stack = choose_tech_stack(job_title, rng)
        tech_stack_bias = TECH_STACK_RISK_BIAS.get(tech_stack, 0.0)
        tech_stack_trend_score = estimate_stack_trend_score(tech_stack, tech_stack_bias, reporting_quarter, rng)

        years_at_company = int(np.clip(np.round(rng.gamma(shape=2.3, scale=2.0)), 0, 18))

        perf_mean = 3.5 + min(years_at_company, 8) * 0.05 - max(company.risk_bias, 0.0) * 0.35
        if economic_condition_tag == "Recession":
            perf_mean -= 0.12
        elif economic_condition_tag == "Growth":
            perf_mean += 0.08
        performance_rating = choose_performance_rating(perf_mean, rng)

        remote_probability = industry_profile.remote_share * 0.45 + role.remote_friendly * 0.45 + 0.10
        if company.industry in {"Manufacturing", "Healthcare"}:
            remote_probability -= 0.10
        remote_probability = clamp(remote_probability, 0.05, 0.92)
        remote_work = "Yes" if rng.random() < remote_probability else "No"

        total_employees = int(max(500, round(company.base_employees * rng.lognormal(mean=0.0, sigma=0.08))))

        revenue_growth = (
            industry_profile.base_growth
            + quarter_macro["growth_shift"]
            + CONDITION_GROWTH_SHIFT[economic_condition_tag]
            + company.growth_bias * 7.0
            + rng.normal(0.0, 2.2)
        )

        profit_margin = (
            industry_profile.base_margin
            + (revenue_growth * 0.28)
            + (0.8 if company.industry == "Financial Services" else 0.0)
            + rng.normal(0.0, 2.0)
        )

        stock_price_change = (
            revenue_growth * 0.70
            + profit_margin * 0.45
            + company.growth_bias * 12.0
            + rng.normal(0.0, 5.5)
        )

        unemployment_rate = (
            quarter_macro["unemployment"]
            + location_profile["unemployment_offset"]
            + rng.normal(0.0, 0.30)
        )

        inflation_rate = (
            quarter_macro["inflation"]
            + location_profile["inflation_offset"]
            + rng.normal(0.0, 0.22)
        )

        industry_layoff_rate = (
            industry_profile.base_layoff_rate
            + CONDITION_LAYOFF_SHIFT[economic_condition_tag]
            + max(0.0, -revenue_growth) * 0.05
            + rng.normal(0.0, 0.22)
        )
        industry_layoff_rate = clamp(industry_layoff_rate, 0.25, 6.0)

        layoff_signal = (
            industry_layoff_rate * 0.58
            + max(0.0, -revenue_growth) * 0.18
            + max(0.0, -profit_margin) * 0.10
            + company.risk_bias * 1.2
            + (0.45 if economic_condition_tag == "Recession" else 0.0)
        )
        past_layoffs_probability = 1.0 / (1.0 + np.exp(-(layoff_signal - 1.45)))
        past_layoffs = "Yes" if rng.random() < past_layoffs_probability else "No"

        salary_range = (
            role.base_salary
            * company.salary_multiplier
            * location_profile["salary_multiplier"]
            * (1.0 + years_at_company * 0.065)
            * (0.90 + (performance_rating - 3) * 0.06)
            * rng.lognormal(mean=0.0, sigma=0.17)
        )
        salary_range = int(clamp(salary_range, 240000.0, 8200000.0))

        department = role.department
        if rng.random() < 0.06:
            department = rng.choice([
                "Engineering",
                "Analytics",
                "Management",
                "Finance",
                "HR",
                "Product",
                "IT",
                "Operations",
                "Sales",
            ])

        role_demand_index = clamp(
            ROLE_DEMAND_INDEX.get(job_title, 6.4)
            + (0.25 if economic_condition_tag == "Growth" else -0.20 if economic_condition_tag == "Recession" else 0.0)
            + (0.35 if tech_stack_trend_score >= 7.8 else -0.25 if tech_stack_trend_score <= 4.8 else 0.0)
            + rng.normal(0.0, 0.35),
            2.0,
            9.8,
        )

        department_resilience_index = clamp(
            DEPARTMENT_RESILIENCE_INDEX.get(department, 6.2)
            + (0.20 if economic_condition_tag in {"Stable", "Growth"} else -0.35)
            + rng.normal(0.0, 0.40),
            2.0,
            9.8,
        )

        tenure_effect = 0.0
        if years_at_company < 1:
            tenure_effect = 0.48
        elif years_at_company < 2:
            tenure_effect = 0.22
        elif years_at_company >= 7:
            tenure_effect = -0.28

        salary_pressure = 0.0
        if salary_range > 2800000 and performance_rating <= 3:
            salary_pressure = 0.24
        elif salary_range < 900000 and performance_rating >= 4:
            salary_pressure = -0.06

        remote_effect = 0.0
        if remote_work == "No" and role.remote_friendly > 0.7:
            remote_effect = 0.10
        elif remote_work == "Yes" and role.remote_friendly < 0.3:
            remote_effect = 0.08
        elif remote_work == "Yes" and role.remote_friendly > 0.6:
            remote_effect = -0.08

        role_layoff_rate = (
            industry_layoff_rate * 0.46
            + role.risk_bias
            + (tech_stack_bias * 0.9)
            + max(0.0, -revenue_growth) * 0.14
            + max(0.0, -profit_margin) * 0.06
            + max(0.0, -stock_price_change) * 0.015
            + (8.4 - role_demand_index) * 0.18
            + (8.1 - department_resilience_index) * 0.14
            + (8.6 - tech_stack_trend_score) * 0.22
            + (4.2 - performance_rating) * 0.26
            + tenure_effect
            + salary_pressure
            + remote_effect
            + (0.42 if past_layoffs == "Yes" else -0.03)
            + (0.20 if economic_condition_tag == "Recession" else 0.0)
            + (company.risk_bias * 0.7)
            + rng.normal(0.0, 0.30)
        )
        role_layoff_rate = round(clamp(role_layoff_rate, 0.01, 7.8), 3)

        rows.append(
            {
                "company_name": company.name,
                "company_location": company_location,
                "reporting_quarter": reporting_quarter,
                "economic_condition_tag": economic_condition_tag,
                "revenue_growth": round(float(revenue_growth), 2),
                "profit_margin": round(float(profit_margin), 2),
                "stock_price_change": round(float(stock_price_change), 2),
                "past_layoffs": past_layoffs,
                "total_employees": total_employees,
                "job_title": job_title,
                "tech_stack": tech_stack,
                "role_demand_index": round(float(role_demand_index), 2),
                "department_resilience_index": round(float(department_resilience_index), 2),
                "tech_stack_trend_score": round(float(tech_stack_trend_score), 2),
                "years_at_company": years_at_company,
                "salary_range": salary_range,
                "performance_rating": performance_rating,
                "department": department,
                "remote_work": remote_work,
                "role_layoff_rate": role_layoff_rate,
                "industry": company.industry,
                "industry_layoff_rate": round(float(industry_layoff_rate), 2),
                "unemployment_rate": round(float(unemployment_rate), 2),
                "inflation_rate": round(float(inflation_rate), 2),
            }
        )

    columns = [
        "company_name",
        "company_location",
        "reporting_quarter",
        "economic_condition_tag",
        "revenue_growth",
        "profit_margin",
        "stock_price_change",
        "past_layoffs",
        "total_employees",
        "job_title",
        "tech_stack",
        "role_demand_index",
        "department_resilience_index",
        "tech_stack_trend_score",
        "years_at_company",
        "salary_range",
        "performance_rating",
        "department",
        "remote_work",
        "role_layoff_rate",
        "industry",
        "industry_layoff_rate",
        "unemployment_rate",
        "inflation_rate",
    ]

    return pd.DataFrame(rows, columns=columns)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate an enhanced synthetic employee layoff dataset.")
    parser.add_argument("--rows", type=int, default=12000, help="Number of rows to generate.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility.")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("backend/data/enhanced_synthetic_employee_data.csv"),
        help="Output CSV file path.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    df = generate_rows(row_count=args.rows, seed=args.seed)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(args.output, index=False)

    print(f"Wrote {len(df):,} rows to {args.output}")
    print("industry distribution:")
    print((df["industry"].value_counts(normalize=True) * 100).round(1).to_string())
    print("reporting quarter distribution:")
    print((df["reporting_quarter"].value_counts(normalize=True) * 100).round(1).sort_index().to_string())
    print("role_layoff_rate summary:")
    print(df["role_layoff_rate"].describe().round(3).to_string())


if __name__ == "__main__":
    main()
