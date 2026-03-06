#!/usr/bin/env python3
"""Train lightweight Naive Bayes style artifacts for employee layoff risk prediction."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List

import numpy as np
import pandas as pd


CATEGORICAL_FEATURES = [
    "company_name",
    "company_location",
    "reporting_quarter",
    "economic_condition_tag",
    "past_layoffs",
    "job_title",
    "tech_stack",
    "department",
    "remote_work",
    "industry",
]

NUMERICAL_FEATURES = [
    "revenue_growth",
    "profit_margin",
    "stock_price_change",
    "total_employees",
    "role_demand_index",
    "department_resilience_index",
    "tech_stack_trend_score",
    "years_at_company",
    "salary_range",
    "performance_rating",
    "industry_layoff_rate",
    "unemployment_rate",
    "inflation_rate",
    "employee_stability",
    "economic_pressure",
]

CLASS_ORDER = ["Low", "Medium", "High"]
CLASS_INDEX = {label: idx for idx, label in enumerate(CLASS_ORDER)}


def to_serializable(obj):
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    raise TypeError(f"Type {type(obj)!r} is not JSON serializable")


def normalize_category(value) -> str:
    if pd.isna(value):
        return "unknown"
    text = str(value).strip()
    return text if text else "unknown"


def build_target(df: pd.DataFrame) -> Dict[str, float]:
    q_low = float(df["role_layoff_rate"].quantile(0.62))
    q_mid = float(df["role_layoff_rate"].quantile(0.88))

    if q_mid <= q_low:
        q_mid = q_low + 0.8

    def map_class(rate: float) -> str:
        if rate <= q_low:
            return "Low"
        if rate <= q_mid:
            return "Medium"
        return "High"

    df["layoff_risk"] = df["role_layoff_rate"].apply(map_class)
    return {"low_max": round(q_low, 3), "medium_max": round(q_mid, 3)}


def validate_schema(df: pd.DataFrame) -> None:
    required = set(CATEGORICAL_FEATURES + [
        "role_layoff_rate",
        "revenue_growth",
        "profit_margin",
        "stock_price_change",
        "total_employees",
        "role_demand_index",
        "department_resilience_index",
        "tech_stack_trend_score",
        "years_at_company",
        "salary_range",
        "performance_rating",
        "industry_layoff_rate",
        "unemployment_rate",
        "inflation_rate",
    ])
    missing = sorted(required.difference(df.columns))
    if missing:
        raise ValueError(f"Missing required columns: {missing}")


def build_alias_maps(df: pd.DataFrame) -> Dict[str, Dict[str, str]]:
    def loose(value: str) -> str:
        cleaned = "".join(ch if (ch.isalnum() or ch.isspace()) else " " for ch in value.lower())
        return " ".join(cleaned.split())

    def build_value_aliases(values, extra_aliases=None):
        mapping = {}
        for item in sorted(values):
            canonical = str(item).strip()
            if not canonical:
                continue
            lower = canonical.lower()
            mapping[lower] = canonical

            normalized = loose(canonical)
            if normalized:
                mapping[normalized] = canonical

            compact = normalized.replace(" ", "")
            if compact:
                mapping[compact] = canonical

            slash_variant = lower.replace("/", " ").replace("&", " and ")
            slash_normalized = loose(slash_variant)
            if slash_normalized:
                mapping[slash_normalized] = canonical

        for key, value in (extra_aliases or {}).items():
            k = loose(str(key).strip())
            if k:
                mapping[k] = value
            compact_key = k.replace(" ", "")
            if compact_key:
                mapping[compact_key] = value
            mapping[str(key).strip().lower()] = value

        return mapping

    company_aliases = {}
    for name in sorted(df["company_name"].dropna().unique()):
        canonical = str(name).strip()
        lower = canonical.lower()
        company_aliases[lower] = canonical

        normalized = loose(canonical)
        if normalized:
            company_aliases[normalized] = canonical

        if "(" in canonical:
            base = canonical.split("(", 1)[0].strip().lower()
            company_aliases[base] = canonical
            company_aliases[loose(base)] = canonical

    location_aliases = {
        "bangalore": "Bengaluru",
        "bengaluru": "Bengaluru",
        "mumbai": "Mumbai",
        "hyderabad": "Hyderabad",
        "chennai": "Chennai",
        "pune": "Pune",
        "gurgaon": "Gurugram",
        "gurugram": "Gurugram",
        "delhi": "Delhi",
        "new delhi": "Delhi",
        "kolkata": "Kolkata",
        "noida": "Noida",
    }

    quarter_aliases = {}
    for quarter in sorted(df["reporting_quarter"].dropna().unique()):
        canonical = str(quarter).strip()
        lower = canonical.lower()
        quarter_aliases[lower] = canonical
        quarter_aliases[lower.replace(" ", "-")] = canonical
        quarter_aliases[lower.replace(" ", "")] = canonical

    job_title_aliases = build_value_aliases(
        df["job_title"].dropna().unique(),
        extra_aliases={
            "software developer": "Software Engineer",
            "developer": "Software Engineer",
            "sdet": "QA Engineer",
            "qa tester": "QA Engineer",
            "ml engineer": "Machine Learning Engineer",
            "machine learning scientist": "Machine Learning Engineer",
            "sr software engineer": "Senior Software Engineer",
            "ux designer": "UI/UX Designer",
            "ui designer": "UI/UX Designer",
            "customer success": "Customer Success Manager",
        },
    )

    department_aliases = build_value_aliases(
        df["department"].dropna().unique(),
        extra_aliases={
            "human resources": "HR",
            "people operations": "HR",
            "information technology": "IT",
            "information systems": "IT",
            "engineering and development": "Engineering",
            "product management": "Product",
            "sales and marketing": "Sales",
        },
    )

    tech_stack_aliases = build_value_aliases(
        df["tech_stack"].dropna().unique(),
        extra_aliases={
            "manual testing": "Manual QA + Regression Testing",
            "manual qa": "Manual QA + Regression Testing",
            "automation testing": "Selenium + Cypress + API Testing",
            "selenium testing": "Selenium + Cypress + API Testing",
            "playwright testing": "Playwright + CI Test Automation",
            "python mlops": "Python + TensorFlow + MLOps",
            "llmops": "LLM Ops + Vector DB + Python",
            "java spring": "Java + Spring Boot",
            "node react": "Node.js + React",
            "devops aws kubernetes": "AWS + Terraform + Kubernetes",
        },
    )

    remote_work_aliases = {
        "yes": "Yes",
        "y": "Yes",
        "true": "Yes",
        "1": "Yes",
        "no": "No",
        "n": "No",
        "false": "No",
        "0": "No",
    }

    return {
        "company": company_aliases,
        "location": location_aliases,
        "reporting_quarter": quarter_aliases,
        "job_title": job_title_aliases,
        "department": department_aliases,
        "tech_stack": tech_stack_aliases,
        "remote_work": remote_work_aliases,
    }


def compute_artifacts(df: pd.DataFrame, input_path: Path) -> Dict:
    for feature in CATEGORICAL_FEATURES:
        df[feature] = df[feature].apply(normalize_category)

    for feature in [
        "revenue_growth",
        "profit_margin",
        "stock_price_change",
        "total_employees",
        "role_demand_index",
        "department_resilience_index",
        "tech_stack_trend_score",
        "years_at_company",
        "salary_range",
        "performance_rating",
        "industry_layoff_rate",
        "unemployment_rate",
        "inflation_rate",
    ]:
        df[feature] = pd.to_numeric(df[feature], errors="coerce")

    df = df.dropna().reset_index(drop=True)

    df["employee_stability"] = df["years_at_company"] * df["performance_rating"]
    df["economic_pressure"] = df["inflation_rate"] + df["unemployment_rate"] - df["revenue_growth"]

    thresholds = build_target(df)

    alpha = 1.0

    priors = {}
    categorical_likelihoods = {feature: {} for feature in CATEGORICAL_FEATURES}
    numerical_stats = {feature: {} for feature in NUMERICAL_FEATURES}

    value_space = {
        feature: sorted(df[feature].dropna().astype(str).unique().tolist())
        for feature in CATEGORICAL_FEATURES
    }

    for label in CLASS_ORDER:
        class_df = df[df["layoff_risk"] == label]
        class_count = len(class_df)
        priors[label] = class_count / len(df)

        for feature in CATEGORICAL_FEATURES:
            counts = class_df[feature].value_counts().to_dict()
            categories = value_space[feature]
            denom = class_count + alpha * (len(categories) + 1)
            feature_probs = {
                value: (counts.get(value, 0) + alpha) / denom
                for value in categories
            }
            feature_probs["__default__"] = alpha / denom
            categorical_likelihoods[feature][label] = feature_probs

        for feature in NUMERICAL_FEATURES:
            series = class_df[feature]
            mean_val = float(series.mean())
            std_val = float(series.std(ddof=0))
            numerical_stats[feature][label] = {
                "mean": mean_val,
                "std": max(std_val, 1e-3),
            }

    risk_numeric = df["layoff_risk"].map(CLASS_INDEX).astype(float)
    categorical_risk_profiles = {}
    for feature in CATEGORICAL_FEATURES:
        grouped = df.groupby(feature)["layoff_risk"].apply(lambda s: float(s.map(CLASS_INDEX).mean()))
        categorical_risk_profiles[feature] = grouped.to_dict()

    numeric_direction = {}
    numeric_baselines = {}
    for feature in NUMERICAL_FEATURES:
        corr = float(df[feature].corr(risk_numeric))
        if not np.isfinite(corr):
            corr = 0.0
        numeric_direction[feature] = corr

        numeric_baselines[feature] = {
            "mean": float(df[feature].mean()),
            "std": max(float(df[feature].std(ddof=0)), 1e-3),
            "low_mean": float(df[df["layoff_risk"] == "Low"][feature].mean()),
            "high_mean": float(df[df["layoff_risk"] == "High"][feature].mean()),
        }

    company_stats = (
        df.groupby("company_name")
        .agg(
            industry=("industry", lambda s: str(s.mode().iloc[0])),
            revenue_growth=("revenue_growth", "median"),
            profit_margin=("profit_margin", "median"),
            stock_price_change=("stock_price_change", "median"),
            total_employees=("total_employees", "median"),
            industry_layoff_rate=("industry_layoff_rate", "median"),
        )
        .reset_index()
    )

    industry_defaults = (
        df.groupby("industry")
        .agg(
            industry_layoff_rate=("industry_layoff_rate", "median"),
            revenue_growth=("revenue_growth", "median"),
            profit_margin=("profit_margin", "median"),
            stock_price_change=("stock_price_change", "median"),
        )
        .reset_index()
    )

    quarter_defaults = (
        df.groupby("reporting_quarter")
        .agg(
            unemployment_rate=("unemployment_rate", "median"),
            inflation_rate=("inflation_rate", "median"),
            economic_condition_tag=("economic_condition_tag", lambda s: str(s.mode().iloc[0])),
        )
        .reset_index()
    )

    stack_survival_profiles = (
        df.groupby(["reporting_quarter", "job_title", "tech_stack"])
        .agg(
            sample_size=("layoff_risk", "size"),
            avg_role_layoff_rate=("role_layoff_rate", "mean"),
            low_risk_share=("layoff_risk", lambda s: float((s == "Low").mean())),
            high_risk_share=("layoff_risk", lambda s: float((s == "High").mean())),
        )
        .reset_index()
    )

    role_stack_profiles = (
        df.groupby(["job_title", "tech_stack"])
        .agg(
            sample_size=("layoff_risk", "size"),
            avg_role_layoff_rate=("role_layoff_rate", "mean"),
            low_risk_share=("layoff_risk", lambda s: float((s == "Low").mean())),
            high_risk_share=("layoff_risk", lambda s: float((s == "High").mean())),
        )
        .reset_index()
    )

    role_defaults = (
        df.groupby("job_title")
        .agg(
            role_demand_index=("role_demand_index", "median"),
        )
        .reset_index()
    )

    department_defaults = (
        df.groupby("department")
        .agg(
            department_resilience_index=("department_resilience_index", "median"),
        )
        .reset_index()
    )

    stack_defaults = (
        df.groupby("tech_stack")
        .agg(
            tech_stack_trend_score=("tech_stack_trend_score", "median"),
        )
        .reset_index()
    )

    global_numeric_medians = {feature: float(df[feature].median()) for feature in NUMERICAL_FEATURES}
    global_categorical_modes = {
        feature: str(df[feature].mode().iloc[0])
        for feature in CATEGORICAL_FEATURES
    }

    artifact = {
        "metadata": {
            "created_at_utc": datetime.now(timezone.utc).isoformat(),
            "input_path": str(input_path),
            "row_count": int(len(df)),
            "risk_thresholds": thresholds,
            "class_distribution": {
                label: float((df["layoff_risk"] == label).mean())
                for label in CLASS_ORDER
            },
        },
        "feature_schema": {
            "categorical": CATEGORICAL_FEATURES,
            "numerical": NUMERICAL_FEATURES,
            "classes": CLASS_ORDER,
        },
        "priors": priors,
        "categorical_likelihoods": categorical_likelihoods,
        "numerical_stats": numerical_stats,
        "global_defaults": {
            "numerical_medians": global_numeric_medians,
            "categorical_modes": global_categorical_modes,
        },
        "profiles": {
            "categorical_risk": categorical_risk_profiles,
            "numeric_direction": numeric_direction,
            "numeric_baselines": numeric_baselines,
            "company_defaults": company_stats.to_dict(orient="records"),
            "industry_defaults": industry_defaults.to_dict(orient="records"),
            "quarter_defaults": quarter_defaults.to_dict(orient="records"),
            "stack_survival_profiles": stack_survival_profiles.to_dict(orient="records"),
            "role_stack_profiles": role_stack_profiles.to_dict(orient="records"),
            "role_defaults": role_defaults.to_dict(orient="records"),
            "department_defaults": department_defaults.to_dict(orient="records"),
            "stack_defaults": stack_defaults.to_dict(orient="records"),
        },
        "aliases": build_alias_maps(df),
    }

    return artifact


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build JSON artifacts for backend risk inference.")
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("backend/data/enhanced_synthetic_employee_data.csv"),
        help="Input dataset CSV path.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("backend/data/employee_risk_artifacts.json"),
        help="Output artifact JSON path.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    df = pd.read_csv(args.input)
    validate_schema(df)
    artifacts = compute_artifacts(df, args.input)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as handle:
        json.dump(artifacts, handle, indent=2, ensure_ascii=True, default=to_serializable)

    distribution = artifacts["metadata"]["class_distribution"]
    thresholds = artifacts["metadata"]["risk_thresholds"]
    print(f"Wrote artifacts to {args.output}")
    print(f"rows: {artifacts['metadata']['row_count']}")
    print(f"thresholds: low<= {thresholds['low_max']}, medium<= {thresholds['medium_max']}")
    print("class distribution:")
    for label in CLASS_ORDER:
        print(f"  {label}: {distribution[label]:.3f}")


if __name__ == "__main__":
    main()
