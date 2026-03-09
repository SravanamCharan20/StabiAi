import { HiCheckCircle, HiExclamationCircle, HiInformationCircle } from "react-icons/hi";

export const FALLBACK_COMPANY_OPTIONS = [
  "Accenture India Pvt Ltd",
  "Amazon Development Centre India Pvt Ltd",
  "Amazon India",
  "Apollo Hospitals",
  "Apple India",
  "Axis Bank",
  "Bajaj Auto",
  "Bharti Airtel",
  "Capgemini India",
  "Cipla",
  "Cognizant India",
  "Coforge",
  "Deloitte India",
  "EY India",
  "Facebook India",
  "Flipkart Internet Pvt Ltd",
  "Fortis Healthcare",
  "Google India",
  "HCL Technologies",
  "HDFC Bank",
  "IBM India",
  "ICICI Bank",
  "Infosys",
  "Jio Platforms",
  "Larsen & Toubro",
  "LTIMindtree",
  "Mahindra & Mahindra",
  "Meesho",
  "Meta India",
  "Microsoft India",
  "Mphasis",
  "Myntra",
  "Netflix India",
  "Oracle Financial Services Software Ltd.",
  "Paytm",
  "Persistent Systems",
  "PwC India",
  "Razorpay",
  "Sun Pharma",
  "Tata Consultancy Services (TCS)",
  "Tata Motors",
  "Tech Mahindra Ltd.",
  "Vodafone Idea",
  "Wipro Limited",
];

export const FALLBACK_LOCATION_OPTIONS = [
  "Ahmedabad",
  "Bengaluru",
  "Chennai",
  "Coimbatore",
  "Delhi",
  "Gurugram",
  "Hyderabad",
  "Kochi",
  "Kolkata",
  "Mumbai",
  "Noida",
  "Pune",
];

export const FALLBACK_QUARTER_OPTIONS = [
  "Q1 2024",
  "Q2 2024",
  "Q3 2024",
  "Q4 2024",
  "Q1 2025",
  "Q2 2025",
  "Q3 2025",
  "Q4 2025",
];

export const FALLBACK_JOB_OPTIONS = [
  "Software Engineer",
  "Senior Software Engineer",
  "Data Scientist",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "Site Reliability Engineer",
  "Product Manager",
  "Project Manager",
  "Engineering Manager",
  "Business Analyst",
];

export const FALLBACK_DEPARTMENT_OPTIONS = [
  "Engineering",
  "Analytics",
  "Product",
  "IT",
  "Operations",
  "Finance",
  "HR",
  "Sales",
  "Management",
];

export const FALLBACK_TECH_STACK_OPTIONS = [
  ".NET + Azure",
  "ATS + LinkedIn Recruiter",
  "AWS + Incident Response",
  "AWS + Terraform + Kubernetes",
  "Agile + Jira + Architecture Reviews",
  "Agile + Jira + Stakeholder Management",
  "Application Support + Monitoring",
  "CRM + Customer Analytics",
  "CRM + Sales Analytics",
  "Cloud Architecture + Microservices",
  "Cloud Delivery + Program Governance",
  "Cloud Security + IAM + Zero Trust",
  "Data Modeling + Power BI + Requirements",
  "Docker + Kubernetes + AWS",
  "Excel + Power BI + SQL",
  "Excel + SQL + Reporting",
  "Enterprise Integration + API Design",
  "Figma + Design Systems",
  "GCP + Docker + Networking",
  "HRMS + Excel + Analytics",
  "ITSM + Linux + SQL",
  "Java + Spring Boot",
  "Kubernetes + AWS",
  "Kubernetes + SRE + Observability",
  "LLM Ops + Vector DB + Python",
  "Linux + Ansible + Observability",
  "Linux + Prometheus + Grafana",
  "Manual QA + Regression Testing",
  "Node.js + Microservices",
  "Node.js + React",
  "People Analytics + HR Operations",
  "Pipeline Automation + Prospecting Tools",
  "Playwright + CI Test Automation",
  "Product Analytics + SQL + A/B Testing",
  "Program Planning + Risk Tracking",
  "PySpark + MLflow + Python",
  "PyTorch + Kubernetes + MLflow",
  "Python + Django",
  "Python + FastAPI",
  "Python + ML + SQL",
  "Python + NLP + Statistics",
  "Python + TensorFlow + MLOps",
  "Roadmapping + Jira + Experimentation",
  "SAP + Financial Modeling",
  "SAP Finance + Compliance",
  "SIEM + SOC + Threat Hunting",
  "SQL + Excel + Process Mapping",
  "SQL + Power BI + Excel",
  "SQL + Tableau + Python",
  "SaaS Onboarding + QBR Playbooks",
  "Selenium + Cypress + API Testing",
  "Sourcing Automation + Talent Analytics",
  "Tally + Excel + GST",
  "Terraform + CI/CD + GCP",
  "Ticketing + Debugging + Scripting",
  "UX Research + Prototyping",
  "VAPT + Incident Response",
];

export const RISK_TONE = {
  low: {
    badge: "bg-emerald-100/70 text-emerald-800",
    card: "border-emerald-200 bg-emerald-50/30",
    icon: HiCheckCircle,
  },
  medium: {
    badge: "bg-amber-100/70 text-amber-800",
    card: "border-amber-200 bg-amber-50/30",
    icon: HiInformationCircle,
  },
  high: {
    badge: "bg-rose-100/70 text-rose-800",
    card: "border-rose-200 bg-rose-50/30",
    icon: HiExclamationCircle,
  },
  unknown: {
    badge: "bg-slate-100 text-slate-700",
    card: "border-slate-200 bg-white",
    icon: HiInformationCircle,
  },
};

export const RELIABILITY_TONE = {
  high: {
    wrap: "border-emerald-200 bg-emerald-50/45",
    text: "text-emerald-800",
    icon: HiCheckCircle,
    title: "High Reliability",
  },
  medium: {
    wrap: "border-amber-200 bg-amber-50/45",
    text: "text-amber-800",
    icon: HiInformationCircle,
    title: "Moderate Reliability",
  },
  warning: {
    wrap: "border-rose-200 bg-rose-50/45",
    text: "text-rose-800",
    icon: HiExclamationCircle,
    title: "Reduced Reliability",
  },
};

export const INPUT_QUALITY_TONE = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-rose-200 bg-rose-50 text-rose-800",
};

export const RELIABILITY_SOURCE_LABEL = {
  nse_live_api: "NSE Live Feed",
  stooq_daily_api: "Global Market Feed",
  yahoo_chart_api: "Global Chart Feed",
  fallback: "Unavailable",
  unavailable: "Unavailable",
};

export const RELIABILITY_STATUS_LABEL = {
  live_market: "Live Market Connected",
  fallback_defaults: "Fallback Defaults",
};

export const MAPPING_MODE_LABEL = {
  direct_listing: "Direct Listed Company",
  market_equivalent: "Market-Equivalent Company",
  user_ticker: "User Symbol",
};

export const DISPLAY_MARKET_SIGNAL_KEYS = [
  "marketRegime",
  "marketStressScore",
  "company_return_90d",
  "market_return_90d",
  "relative_return_90d",
  "company_volatility_90d",
  "market_volatility_90d",
  "india_vix",
  "benchmark_symbol",
  "nse_index_price",
  "us_index_price",
  "global_index_price",
  "company_last_price",
  "company_previous_close",
];

export const ACTION_STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "blocked", label: "Blocked" },
];

export const REVIEW_DECISIONS = [
  "manual_review_required",
  "monitor_with_manager",
  "coach_and_reassess",
  "advisory_acknowledged",
];

export const RESULT_VIEW_TABS = [
  { id: "story", label: "Story" },
  { id: "signals", label: "Signals" },
  { id: "drivers", label: "Drivers" },
  { id: "inputs", label: "Inputs" },
];

export const WORKSPACE_TABS = [
  { id: "simulator", label: "What-If" },
  { id: "quality", label: "Quality" },
  { id: "guidance", label: "AI Guidance" },
];

export const SALARY_BOUNDS = {
  minInr: 300000,
  maxInr: 12000000,
  minLpa: 3,
  maxLpa: 120,
};

export const FORM_INPUT_CLASS =
  "w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:ring-2";

export const FORM_SELECT_CLASS =
  "select-input w-full rounded-xl border bg-white px-3 py-2.5 pr-9 text-sm text-slate-900 outline-none transition focus:ring-2";

export const WORKSPACE_FRAME_THEME = {
  simulator: {
    border: "border-sky-200",
    bg: "bg-sky-50/45",
    text: "text-sky-800",
    label: "Scenario Lab",
  },
  actions: {
    border: "border-emerald-200",
    bg: "bg-emerald-50/45",
    text: "text-emerald-800",
    label: "Execution Tracker",
  },
  review: {
    border: "border-amber-200",
    bg: "bg-amber-50/45",
    text: "text-amber-900",
    label: "Governance Review",
  },
  history: {
    border: "border-slate-300",
    bg: "bg-slate-100/60",
    text: "text-slate-800",
    label: "Historical Trend",
  },
  quality: {
    border: "border-indigo-200",
    bg: "bg-indigo-50/45",
    text: "text-indigo-800",
    label: "Model Health",
  },
  guidance: {
    border: "border-cyan-200",
    bg: "bg-cyan-50/45",
    text: "text-cyan-800",
    label: "AI Guidance",
  },
};
