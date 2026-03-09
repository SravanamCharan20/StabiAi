import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  HiOutlineBriefcase,
  HiOutlineCalendar,
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiOutlineHome,
  HiOutlineLocationMarker,
  HiOutlineOfficeBuilding,
  HiOutlineUserGroup,
} from "react-icons/hi";
import AiSuggestions from "./aiSuggestions";
import { API_BASE_URL } from "../../config/api";
import {
  ACTION_STATUS_OPTIONS,
  FALLBACK_COMPANY_OPTIONS,
  FALLBACK_DEPARTMENT_OPTIONS,
  FALLBACK_JOB_OPTIONS,
  FALLBACK_LOCATION_OPTIONS,
  FALLBACK_QUARTER_OPTIONS,
  FALLBACK_TECH_STACK_OPTIONS,
  FORM_INPUT_CLASS,
  INPUT_QUALITY_TONE,
  REVIEW_DECISIONS,
  SALARY_BOUNDS,
  WORKSPACE_TABS,
} from "./predictor/constants";
import {
  buildActionTrackerSeed,
  buildRiskStory,
  getResponsibleAssessment,
  sanitizeResumeInsights,
  toAnnualInr,
} from "./predictor/utils";
import {
  ActionTrackerPanel,
  Field,
  HistoryPanel,
  HumanReviewPanel,
  ModelQualityPanel,
  ResumeIntakeCard,
  ResultPanel,
  SegmentTabs,
  SelectControl,
  WhatIfSimulator,
  WorkspacePanelFrame,
} from "./predictor/sections";
const EmployeePred = () => {
  const [formData, setFormData] = useState({
    company_name: "",
    company_location: "",
    reporting_quarter: "",
    job_title: "",
    tech_stack: "",
    department: "",
    remote_work: "",
    years_at_company: "",
    salary_range: "",
    performance_rating: "",
  });
  const [salaryUnit, setSalaryUnit] = useState("LPA");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [predictionData, setPredictionData] = useState(null);
  const [inputSpec, setInputSpec] = useState(null);
  const [historyEntries, setHistoryEntries] = useState([]);
  const [historyTrend, setHistoryTrend] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [whatIfForm, setWhatIfForm] = useState({
    years_at_company: "",
    performance_rating: "",
    salary_lpa: "",
  });
  const [whatIfResult, setWhatIfResult] = useState(null);
  const [whatIfLoading, setWhatIfLoading] = useState(false);
  const [actionTracker, setActionTracker] = useState([]);
  const [actionSaving, setActionSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [rescoreLoading, setRescoreLoading] = useState(false);
  const [rescoreSummary, setRescoreSummary] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    reviewed_by: "",
    decision: REVIEW_DECISIONS[0],
    review_reason: "",
  });
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [evalReport, setEvalReport] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState("");
  const [workspaceTab, setWorkspaceTab] = useState("simulator");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeParsing, setResumeParsing] = useState(false);
  const [resumeInsights, setResumeInsights] = useState(null);
  const [resumeMissingFields, setResumeMissingFields] = useState([]);
  const [resumeTrendGuidance, setResumeTrendGuidance] = useState(null);
  const [resumeMessage, setResumeMessage] = useState("");

  useEffect(() => {
    const fetchInputSpec = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/employee/input-spec`);
        if (response.data?.success && response.data?.spec) {
          setInputSpec(response.data.spec);
        }
      } catch (specError) {
        console.warn("Unable to fetch input spec:", specError.message);
      }
    };

    fetchInputSpec();
  }, []);

  const options = useMemo(() => {
    const fields = inputSpec?.fields || {};
    return {
      companies: fields.company_name?.options || FALLBACK_COMPANY_OPTIONS,
      locations: fields.company_location?.options || FALLBACK_LOCATION_OPTIONS,
      quarters: fields.reporting_quarter?.options || FALLBACK_QUARTER_OPTIONS,
      jobs: fields.job_title?.options || FALLBACK_JOB_OPTIONS,
      techStacks: fields.tech_stack?.options || FALLBACK_TECH_STACK_OPTIONS,
      departments: fields.department?.options || FALLBACK_DEPARTMENT_OPTIONS,
      remote: fields.remote_work?.options || ["Yes", "No"],
      yearsMax: Number(fields.years_at_company?.max || 18),
      perfMin: Number(fields.performance_rating?.min || 1),
      perfMax: Number(fields.performance_rating?.max || 5),
      perfStep: Number(fields.performance_rating?.step || 1),
      guidance: Array.isArray(inputSpec?.guidance) ? inputSpec.guidance : [],
    };
  }, [inputSpec]);

  useEffect(() => {
    setFormData((prev) => {
      const companyValid = !prev.company_name || options.companies.includes(prev.company_name);
      const techValid = !prev.tech_stack || options.techStacks.includes(prev.tech_stack);
      if (companyValid && techValid) {
        return prev;
      }
      return {
        ...prev,
        company_name: companyValid ? prev.company_name : "",
        tech_stack: techValid ? prev.tech_stack : "",
      };
    });
  }, [options.companies, options.techStacks]);

  const annualSalaryInr = useMemo(
    () => toAnnualInr(formData.salary_range, salaryUnit),
    [formData.salary_range, salaryUnit]
  );

  const inputQuality = useMemo(() => {
    let score = 100;
    const warnings = [];

    if (!formData.company_name || !options.companies.includes(formData.company_name)) {
      score -= 20;
      warnings.push("Choose a company from the known list to improve model match.");
    }

    if (!formData.job_title || !options.jobs.includes(formData.job_title)) {
      score -= 15;
      warnings.push("Use the exact job title from available options.");
    }

    if (!formData.tech_stack || !options.techStacks.includes(formData.tech_stack)) {
      score -= 12;
      warnings.push("Select the primary tech stack used in your current role.");
    }

    const years = Number(formData.years_at_company);
    if (!Number.isFinite(years) || years < 0 || years > options.yearsMax) {
      score -= 20;
      warnings.push(`Years at company should be between 0 and ${options.yearsMax}.`);
    }

    const performance = Number(formData.performance_rating);
    if (!Number.isFinite(performance) || performance < options.perfMin || performance > options.perfMax) {
      score -= 20;
      warnings.push(`Performance rating should be between ${options.perfMin} and ${options.perfMax}.`);
    }

    if (!Number.isFinite(annualSalaryInr) || annualSalaryInr < SALARY_BOUNDS.minInr || annualSalaryInr > SALARY_BOUNDS.maxInr) {
      score -= 25;
      warnings.push("Salary looks out of range. Check unit and entered amount.");
    }

    const clampedScore = Math.max(0, score);
    const level = clampedScore >= 85 ? "high" : clampedScore >= 65 ? "medium" : "low";
    return { score: clampedScore, level, warnings };
  }, [annualSalaryInr, formData, options]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (error) {
      setError("");
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResumeFileChange = (event) => {
    const file = event?.target?.files?.[0] || null;
    setResumeFile(file);
    if (file) {
      setResumeMessage(`Ready to parse: ${file.name}`);
    } else {
      setResumeMessage("");
    }
  };

  const handleResumeParse = async () => {
    if (!resumeFile) {
      setError("Choose a resume file first.");
      return;
    }

    setResumeParsing(true);
    setResumeMessage("");
    setError("");

    try {
      const payload = new FormData();
      payload.append("resume", resumeFile);
      const response = await axios.post(`${API_BASE_URL}/api/employee/resume-parse`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Unable to parse resume");
      }

      const extractedProfile = response.data.profile || {};
      setFormData((prev) => {
        const next = { ...prev };
        for (const [key, value] of Object.entries(extractedProfile)) {
          if (value != null && String(value).trim() !== "") {
            next[key] = String(value);
          }
        }
        return next;
      });

      const nextInsights = response.data.resume_insights || null;
      const nextMissing = Array.isArray(response.data.missing_required_fields)
        ? response.data.missing_required_fields
        : [];
      const nextTrend = response.data.trend_guidance || null;

      setResumeInsights(nextInsights);
      setResumeMissingFields(nextMissing);
      setResumeTrendGuidance(nextTrend);
      setResumeMessage(
        nextMissing.length
          ? `Resume parsed. Fill remaining fields: ${nextMissing.join(", ")}`
          : "Resume parsed successfully. Profile fields were auto-filled."
      );
    } catch (resumeError) {
      const message = resumeError.response?.data?.message || resumeError.message || "Unable to parse resume.";
      setError(message);
      setResumeMessage("");
    } finally {
      setResumeParsing(false);
    }
  };

  const activeRunId = predictionData?.run_id || predictionData?.history_entry?.run_id || null;

  const fetchHistory = useCallback(async (companyName) => {
    const selectedCompany = String(companyName || "").trim();
    if (!selectedCompany) {
      setHistoryEntries([]);
      setHistoryTrend(null);
      return;
    }

    setHistoryLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/employee/history`, {
        params: { company_name: selectedCompany, limit: 14 },
      });
      if (response.data?.success) {
        setHistoryEntries(Array.isArray(response.data.entries) ? response.data.entries : []);
        setHistoryTrend(response.data.trend || null);
      }
    } catch (historyError) {
      console.warn("Unable to load prediction history:", historyError.message);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const validateFormData = useCallback((data = formData, unit = salaryUnit) => {
    const errors = {};
    const requiredText = "This field is required.";

    if (!String(data.company_name || "").trim()) {
      errors.company_name = requiredText;
    } else if (!options.companies.includes(data.company_name)) {
      errors.company_name = "Select a company from the dropdown options.";
    }

    if (!String(data.company_location || "").trim()) {
      errors.company_location = requiredText;
    } else if (!options.locations.includes(data.company_location)) {
      errors.company_location = "Select a location from the dropdown options.";
    }

    if (!String(data.reporting_quarter || "").trim()) {
      errors.reporting_quarter = requiredText;
    } else if (!options.quarters.includes(data.reporting_quarter)) {
      errors.reporting_quarter = "Select a valid reporting quarter.";
    }

    if (!String(data.job_title || "").trim()) {
      errors.job_title = requiredText;
    } else if (!options.jobs.includes(data.job_title)) {
      errors.job_title = "Select a valid job title from the list.";
    }

    if (!String(data.tech_stack || "").trim()) {
      errors.tech_stack = requiredText;
    } else if (!options.techStacks.includes(data.tech_stack)) {
      errors.tech_stack = "Select a valid tech stack from the list.";
    }

    if (!String(data.department || "").trim()) {
      errors.department = requiredText;
    } else if (!options.departments.includes(data.department)) {
      errors.department = "Select a valid department from the list.";
    }

    if (!String(data.remote_work || "").trim()) {
      errors.remote_work = requiredText;
    } else if (!options.remote.includes(data.remote_work)) {
      errors.remote_work = "Select Yes or No.";
    }

    const years = Number(data.years_at_company);
    if (!String(data.years_at_company || "").trim()) {
      errors.years_at_company = requiredText;
    } else if (!Number.isFinite(years) || years < 0 || years > options.yearsMax) {
      errors.years_at_company = `Enter years between 0 and ${options.yearsMax}.`;
    }

    const performance = Number(data.performance_rating);
    if (!String(data.performance_rating || "").trim()) {
      errors.performance_rating = requiredText;
    } else if (!Number.isFinite(performance) || performance < options.perfMin || performance > options.perfMax) {
      errors.performance_rating = `Enter performance between ${options.perfMin} and ${options.perfMax}.`;
    }

    const salaryRaw = String(data.salary_range || "").trim();
    const salaryNumber = Number(data.salary_range);
    const annualInr = toAnnualInr(data.salary_range, unit);
    if (!salaryRaw) {
      errors.salary_range = requiredText;
    } else if (!Number.isFinite(salaryNumber) || salaryNumber <= 0) {
      errors.salary_range = "Enter a valid numeric salary.";
    } else if (unit === "LPA" && (salaryNumber < SALARY_BOUNDS.minLpa || salaryNumber > SALARY_BOUNDS.maxLpa)) {
      errors.salary_range = `Salary in LPA must be between ${SALARY_BOUNDS.minLpa} and ${SALARY_BOUNDS.maxLpa}.`;
    } else if (annualInr < SALARY_BOUNDS.minInr || annualInr > SALARY_BOUNDS.maxInr) {
      errors.salary_range = `Salary must be between ₹${SALARY_BOUNDS.minInr.toLocaleString("en-IN")} and ₹${SALARY_BOUNDS.maxInr.toLocaleString("en-IN")} annually.`;
    }

    return errors;
  }, [formData, options, salaryUnit]);

  useEffect(() => {
    if (!Object.keys(fieldErrors).length) {
      return;
    }
    const nextErrors = validateFormData(formData, salaryUnit);
    const currentKeys = Object.keys(fieldErrors);
    const nextKeys = Object.keys(nextErrors);
    const isSame =
      currentKeys.length === nextKeys.length
      && currentKeys.every((key) => fieldErrors[key] === nextErrors[key]);
    if (!isSame) {
      setFieldErrors(nextErrors);
    }
  }, [fieldErrors, formData, salaryUnit, validateFormData]);

  const validate = () => {
    const nextErrors = validateFormData(formData, salaryUnit);
    setFieldErrors(nextErrors);
    if (!Object.keys(nextErrors).length) {
      return "";
    }
    return Object.values(nextErrors)[0] || "Please correct highlighted fields before prediction.";
  };

  const buildPayloadFromForm = () => ({
    ...formData,
    years_at_company: Number(formData.years_at_company),
    salary_range: annualSalaryInr,
    performance_rating: Number(formData.performance_rating),
    resume_insights: sanitizeResumeInsights(resumeInsights),
  });

  const runPrediction = async (payload, mode = "predict") => {
    const isRescore = mode === "rescore";
    if (isRescore) {
      setRescoreLoading(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const previousRisk = predictionData?.prediction?.layoff_risk || null;
      const previousScore = Number(predictionData?.prediction?.risk_score);

      const response = await axios.post(`${API_BASE_URL}/api/employee/predict`, payload);
      setPredictionData(response.data);

      const runId = response.data?.run_id || response.data?.history_entry?.run_id || null;
      const persistedActions = response.data?.history_entry?.action_tracker;
      if (Array.isArray(persistedActions) && persistedActions.length > 0) {
        setActionTracker(persistedActions);
      } else {
        setActionTracker(buildActionTrackerSeed(response.data));
      }

      setWhatIfResult(null);
      await fetchHistory(payload.company_name);

      if (isRescore) {
        const nextRisk = response.data?.prediction?.layoff_risk || "Unknown";
        const nextScore = Number(response.data?.prediction?.risk_score);
        const delta = Number.isFinite(previousScore) && Number.isFinite(nextScore) ? nextScore - previousScore : 0;
        setRescoreSummary({
          runId,
          from: previousRisk || "Unknown",
          to: nextRisk,
          delta,
        });
      }

      return response.data;
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Failed to fetch employee prediction.";
      setError(message);
      throw requestError;
    } finally {
      if (isRescore) {
        setRescoreLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    const payload = buildPayloadFromForm();
    try {
      await runPrediction(payload, "predict");
    } catch (errorResponse) {
      // error state already handled in runPrediction
    }
  };

  const handleRescore = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    const payload = buildPayloadFromForm();
    try {
      await runPrediction(payload, "rescore");
    } catch (errorResponse) {
      // error state already handled in runPrediction
    }
  };

  const employeeDataForSuggestions = useMemo(
    () => ({
      ...formData,
      years_at_company: Number(formData.years_at_company) || 0,
      performance_rating: Number(formData.performance_rating) || 0,
      salary_range: annualSalaryInr || 0,
      resume_insights: sanitizeResumeInsights(resumeInsights || predictionData?.resume_insights),
    }),
    [annualSalaryInr, formData, predictionData?.resume_insights, resumeInsights]
  );

  useEffect(() => {
    if (!predictionData) {
      return;
    }

    const normalized = predictionData.normalized_input || predictionData.data || {};
    const salaryInr = Number(normalized.salary_range || annualSalaryInr || 0);
    const salaryLpa = salaryInr > 0 ? (salaryInr / 100000).toFixed(1) : "";

    setWhatIfForm({
      years_at_company: normalized.years_at_company != null ? String(normalized.years_at_company) : String(formData.years_at_company || ""),
      performance_rating: normalized.performance_rating != null ? String(normalized.performance_rating) : String(formData.performance_rating || ""),
      salary_lpa: salaryLpa || String(formData.salary_range || ""),
    });

    const persistedActions = predictionData?.history_entry?.action_tracker;
    if (Array.isArray(persistedActions) && persistedActions.length > 0) {
      setActionTracker(persistedActions);
    } else {
      setActionTracker(buildActionTrackerSeed(predictionData));
    }

    const savedReview = predictionData?.history_entry?.review;
    if (savedReview) {
      setReviewForm((prev) => ({
        reviewed_by: savedReview.reviewed_by || prev.reviewed_by,
        decision: savedReview.decision || prev.decision || REVIEW_DECISIONS[0],
        review_reason: savedReview.review_reason || prev.review_reason,
      }));
    }

    if (predictionData?.resume_insights) {
      setResumeInsights(predictionData.resume_insights);
    }
    if (predictionData?.trend_guidance) {
      setResumeTrendGuidance(predictionData.trend_guidance);
    }
  }, [predictionData, annualSalaryInr, formData.performance_rating, formData.salary_range, formData.years_at_company]);

  useEffect(() => {
    if (!formData.company_name) {
      return;
    }
    fetchHistory(formData.company_name);
  }, [fetchHistory, formData.company_name]);

  const handleRunWhatIf = async () => {
    if (!predictionData?.prediction) {
      return;
    }

    const years = Number(whatIfForm.years_at_company);
    const performance = Number(whatIfForm.performance_rating);
    const salaryLpa = Number(whatIfForm.salary_lpa);
    if (!Number.isFinite(years) || years < 0 || years > options.yearsMax) {
      setError(`What-if years must be between 0 and ${options.yearsMax}.`);
      return;
    }
    if (!Number.isFinite(performance) || performance < options.perfMin || performance > options.perfMax) {
      setError(`What-if performance must be between ${options.perfMin} and ${options.perfMax}.`);
      return;
    }
    if (!Number.isFinite(salaryLpa) || salaryLpa <= 0) {
      setError("What-if salary must be a valid LPA value.");
      return;
    }

    setWhatIfLoading(true);
    setError("");
    try {
      const scenarioPayload = {
        ...employeeDataForSuggestions,
        years_at_company: years,
        performance_rating: performance,
        salary_range: Math.round(salaryLpa * 100000),
      };
      const response = await axios.post(`${API_BASE_URL}/api/employee/what-if`, {
        employeeData: scenarioPayload,
        referencePrediction: predictionData,
      });
      setWhatIfResult(response.data);
    } catch (whatIfError) {
      setError(whatIfError.response?.data?.message || "Unable to run what-if simulation.");
    } finally {
      setWhatIfLoading(false);
    }
  };

  const handleApplyScenarioToForm = () => {
    const scenarioSalaryLpa = String(whatIfForm.salary_lpa || "").trim();
    setFormData((prev) => ({
      ...prev,
      years_at_company: String(whatIfForm.years_at_company || prev.years_at_company),
      performance_rating: String(whatIfForm.performance_rating || prev.performance_rating),
      salary_range: salaryUnit === "LPA"
        ? scenarioSalaryLpa
        : String(Math.round(Number(whatIfForm.salary_lpa || 0) * 100000)),
    }));
  };

  const handleActionStatusUpdate = (index, status) => {
    setActionTracker((prev) => prev.map((item, idx) => (
      idx === index ? { ...item, status } : item
    )));
  };

  const handleSaveActionTracker = async () => {
    if (!activeRunId) {
      setActionMessage("Run ID unavailable. Re-run prediction to enable action tracking.");
      return;
    }
    if (!actionTracker.length) {
      setActionMessage("No actions available to save.");
      return;
    }

    setActionSaving(true);
    setActionMessage("");
    try {
      const response = await axios.post(`${API_BASE_URL}/api/employee/history/${activeRunId}/actions`, {
        actions: actionTracker,
      });
      if (response.data?.success && response.data?.entry) {
        const updatedEntry = response.data.entry;
        setActionTracker(Array.isArray(updatedEntry.action_tracker) ? updatedEntry.action_tracker : actionTracker);
        setPredictionData((prev) => prev ? ({
          ...prev,
          run_id: updatedEntry.run_id,
          history_entry: {
            ...(prev.history_entry || {}),
            run_id: updatedEntry.run_id,
            action_tracker: updatedEntry.action_tracker || [],
            review: updatedEntry.review || prev.history_entry?.review || null,
          },
        }) : prev);
      }
      setActionMessage("Action tracker updated.");
      await fetchHistory(formData.company_name);
    } catch (actionError) {
      setActionMessage(actionError.response?.data?.message || "Unable to save action tracker.");
    } finally {
      setActionSaving(false);
    }
  };

  const handleSaveReview = async () => {
    if (!activeRunId) {
      setReviewMessage("Run ID unavailable. Re-run prediction to enable review logging.");
      return;
    }
    if (!reviewForm.reviewed_by.trim() || !reviewForm.review_reason.trim()) {
      setReviewMessage("Reviewer name and review reason are required.");
      return;
    }

    setReviewSaving(true);
    setReviewMessage("");
    try {
      const response = await axios.post(`${API_BASE_URL}/api/employee/history/${activeRunId}/review`, {
        reviewed_by: reviewForm.reviewed_by.trim(),
        decision: reviewForm.decision,
        review_reason: reviewForm.review_reason.trim(),
      });
      if (response.data?.success && response.data?.entry) {
        const updatedEntry = response.data.entry;
        setPredictionData((prev) => prev ? ({
          ...prev,
          run_id: updatedEntry.run_id,
          history_entry: {
            ...(prev.history_entry || {}),
            run_id: updatedEntry.run_id,
            review: updatedEntry.review || null,
            action_tracker: updatedEntry.action_tracker || prev.history_entry?.action_tracker || [],
          },
        }) : prev);
      }
      setReviewMessage("Review note saved.");
      await fetchHistory(formData.company_name);
    } catch (reviewError) {
      setReviewMessage(reviewError.response?.data?.message || "Unable to save review note.");
    } finally {
      setReviewSaving(false);
    }
  };

  const handleRefreshHistory = async () => {
    await fetchHistory(formData.company_name || predictionData?.normalized_input?.company_name);
  };

  const handleLoadHistorySnapshot = (entry) => {
    if (!entry) {
      return;
    }
    const profile = entry.employee_profile || {};
    const salaryInr = Number(profile.salary_range || 0);
    const salaryLpa = salaryInr > 0 ? (salaryInr / 100000).toFixed(1) : "";

    setSalaryUnit("LPA");
    setFormData({
      company_name: profile.company_name || "",
      company_location: profile.company_location || "",
      reporting_quarter: profile.reporting_quarter || "",
      job_title: profile.job_title || "",
      tech_stack: profile.tech_stack || "",
      department: profile.department || "",
      remote_work: profile.remote_work || "",
      years_at_company: profile.years_at_company != null ? String(profile.years_at_company) : "",
      salary_range: salaryLpa,
      performance_rating: profile.performance_rating != null ? String(profile.performance_rating) : "",
    });

    setPredictionData({
      success: true,
      run_id: entry.run_id,
      history_entry: {
        run_id: entry.run_id,
        created_at_utc: entry.created_at_utc,
        review: entry.review || null,
        action_tracker: entry.action_tracker || [],
      },
      normalized_input: entry.normalized_input || {},
      data: entry.feature_vector || {},
      prediction: entry.prediction || {},
      stack_survival: entry.stack_survival || null,
      market_signals: entry.market_signals || null,
      resume_insights: entry.resume_insights || null,
      trend_guidance: entry.trend_guidance || null,
      reliability: entry.reliability || {},
    });
    setWhatIfResult(null);
    setActionTracker(Array.isArray(entry.action_tracker) ? entry.action_tracker : []);
    setResumeInsights(entry.resume_insights || null);
    setResumeTrendGuidance(entry.trend_guidance || null);
    setResumeMissingFields([]);
    setResumeMessage("Loaded profile snapshot from history.");
  };

  const handleLoadModelEval = async () => {
    setEvalLoading(true);
    setEvalError("");
    try {
      const response = await axios.get(`${API_BASE_URL}/api/employee/eval`, {
        params: { sample_size: 4000 },
      });
      if (response.data?.success && response.data?.report) {
        setEvalReport(response.data.report);
      } else {
        setEvalError("Evaluation report is unavailable.");
      }
    } catch (evalRequestError) {
      setEvalError(evalRequestError.response?.data?.message || "Failed to load model evaluation.");
    } finally {
      setEvalLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!predictionData?.prediction) {
      setError("Run prediction first to export a report.");
      return;
    }
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const riskStory = buildRiskStory(predictionData);
      const assessment = getResponsibleAssessment(predictionData, inputQuality);
      const review = predictionData?.history_entry?.review || null;
      const pageWidth = doc.internal.pageSize.getWidth();
      const maxWidth = pageWidth - 80;
      let y = 44;

      const addTextBlock = (text, size = 11, style = "normal", gap = 14) => {
        if (!text) {
          return;
        }
        doc.setFont("helvetica", style);
        doc.setFontSize(size);
        const lines = doc.splitTextToSize(String(text), maxWidth);
        doc.text(lines, 40, y);
        y += (lines.length * gap);
      };

      addTextBlock("StabiAI Employee Risk Report", 16, "bold", 18);
      addTextBlock(`Generated: ${new Date().toLocaleString("en-IN")}`, 10, "normal", 13);
      addTextBlock(`Run ID: ${activeRunId || "N/A"}`, 10, "normal", 13);
      y += 6;
      addTextBlock(`Predicted Risk: ${predictionData?.prediction?.layoff_risk || "Unknown"}`, 12, "bold", 14);
      addTextBlock(`Confidence: ${((Number(predictionData?.prediction?.confidence || 0)) * 100).toFixed(2)}%`, 11, "normal", 14);
      addTextBlock(`Risk Score: ${Number(predictionData?.prediction?.risk_score || 0).toFixed(2)} / 100`, 11, "normal", 14);
      addTextBlock(`Market Regime: ${predictionData?.market_signals?.marketRegime || "N/A"}`, 11, "normal", 14);
      y += 4;
      addTextBlock("Why This Risk Score", 12, "bold", 14);
      addTextBlock(riskStory.summary, 11, "normal", 14);
      addTextBlock(riskStory.marketLine, 11, "normal", 14);
      addTextBlock(riskStory.stackLine, 11, "normal", 14);
      addTextBlock(riskStory.overall, 11, "normal", 14);
      y += 4;
      addTextBlock("Top Pressure Signals", 12, "bold", 14);
      (riskStory.pressureSignals || []).slice(0, 3).forEach((item, idx) => {
        addTextBlock(`${idx + 1}. ${item.title}: ${item.reason}`, 10, "normal", 13);
      });
      y += 2;
      addTextBlock("Action Tracker", 12, "bold", 14);
      (actionTracker || []).slice(0, 6).forEach((item, idx) => {
        const statusLabel = ACTION_STATUS_OPTIONS.find((opt) => opt.value === item.status)?.label || item.status;
        addTextBlock(`${idx + 1}. ${item.title} [${statusLabel}]`, 10, "normal", 13);
      });
      y += 2;
      addTextBlock("Responsible Use", 12, "bold", 14);
      addTextBlock(assessment?.statusMeta?.text || "", 10, "normal", 13);
      (assessment?.limitations || []).slice(0, 4).forEach((item, idx) => {
        addTextBlock(`- ${item}`, 10, "normal", 13);
      });
      if (review) {
        y += 2;
        addTextBlock("Human Review Note", 12, "bold", 14);
        addTextBlock(`Reviewer: ${review.reviewed_by} (${review.decision})`, 10, "normal", 13);
        addTextBlock(`Reason: ${review.review_reason}`, 10, "normal", 13);
      }

      const fileDate = new Date().toISOString().slice(0, 10);
      doc.save(`stabiai_employee_report_${fileDate}.pdf`);
    } catch (exportError) {
      setError(exportError.message || "Unable to export PDF report.");
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5f8fa_0%,#ffffff_42%,#f4f7f9_100%)] px-4 pb-16 pt-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[95rem]">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Employee Intelligence</p>
          <h1 className="font-display mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">Layoff Risk Predictor</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            Guided flow using model-aligned fields for higher prediction quality.
          </p>
          <p className="mx-auto mt-2 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Responsible use notice: this prediction is advisory and probabilistic. It must be reviewed with manager and HR context, and must not be used as a sole basis for employment decisions.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1.5fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-display text-lg font-semibold text-slate-900">Prediction Input Flow</h2>
            <p className="mt-1 text-sm text-slate-500">
              Step-by-step profile capture designed for cleaner and more accurate model input.
            </p>

            <div className="mt-4">
              <ResumeIntakeCard
                onFileChange={handleResumeFileChange}
                onParse={handleResumeParse}
                parsing={resumeParsing}
                fileName={resumeFile?.name || ""}
                insights={resumeInsights}
                missingFields={resumeMissingFields}
                trendGuidance={resumeTrendGuidance}
                message={resumeMessage}
              />
            </div>

            <div className={`mt-4 rounded-xl border p-3 text-sm ${INPUT_QUALITY_TONE[inputQuality.level]}`}>
              <p className="font-semibold">
                Input Quality: {inputQuality.score}/100 ({inputQuality.level.toUpperCase()})
              </p>
              {inputQuality.warnings.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                  {inputQuality.warnings.map((warning, index) => (
                    <li key={`${warning}-${index}`}>{warning}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs">Inputs look consistent with model expectations.</p>
              )}
            </div>

            {options.guidance.length ? (
              <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <summary className="text-xs font-semibold uppercase tracking-wide text-slate-600">Data Tips</summary>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                  {options.guidance.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </details>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 1: Company Context</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    icon={HiOutlineOfficeBuilding}
                    label="Company"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    options={options.companies}
                    error={fieldErrors.company_name}
                  />
                  <Field
                    icon={HiOutlineLocationMarker}
                    label="Location"
                    name="company_location"
                    value={formData.company_location}
                    onChange={handleChange}
                    options={options.locations}
                    error={fieldErrors.company_location}
                  />
                  <div className="sm:col-span-2">
                    <Field
                      icon={HiOutlineCalendar}
                      label="Reporting Quarter"
                      name="reporting_quarter"
                      value={formData.reporting_quarter}
                      onChange={handleChange}
                      options={options.quarters}
                      error={fieldErrors.reporting_quarter}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 2: Role Context</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    icon={HiOutlineBriefcase}
                    label="Job Title"
                    name="job_title"
                    value={formData.job_title}
                    onChange={handleChange}
                    options={options.jobs}
                    error={fieldErrors.job_title}
                  />
                  <Field
                    icon={HiOutlineBriefcase}
                    label="Primary Tech Stack"
                    name="tech_stack"
                    value={formData.tech_stack}
                    onChange={handleChange}
                    options={options.techStacks}
                    error={fieldErrors.tech_stack}
                  />
                  <Field
                    icon={HiOutlineUserGroup}
                    label="Department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    options={options.departments}
                    error={fieldErrors.department}
                  />
                  <div className="sm:col-span-2">
                    <Field
                      icon={HiOutlineHome}
                      label="Remote Work"
                      name="remote_work"
                      value={formData.remote_work}
                      onChange={handleChange}
                      options={options.remote}
                      error={fieldErrors.remote_work}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 3: Employee Profile</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    icon={HiOutlineClock}
                    label="Years At Company"
                    name="years_at_company"
                    value={formData.years_at_company}
                    onChange={handleChange}
                    type="number"
                    min="0"
                    max={String(options.yearsMax)}
                    step="0.5"
                    error={fieldErrors.years_at_company}
                  />

                  <label className="space-y-2">
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <HiOutlineCurrencyDollar className="h-4 w-4 text-slate-500" />
                      Salary
                    </span>
                    <div className="flex gap-2">
                      <SelectControl
                        value={salaryUnit}
                        onChange={(event) => {
                          if (error) {
                            setError("");
                          }
                          setSalaryUnit(event.target.value);
                        }}
                        className="w-32 border-slate-200 focus:border-slate-400 focus:ring-slate-200"
                      >
                        <option value="LPA">LPA</option>
                        <option value="INR">Annual INR</option>
                      </SelectControl>
                      <input
                        name="salary_range"
                        type="number"
                        value={formData.salary_range}
                        onChange={handleChange}
                        min={salaryUnit === "LPA" ? String(SALARY_BOUNDS.minLpa) : String(SALARY_BOUNDS.minInr)}
                        max={salaryUnit === "LPA" ? String(SALARY_BOUNDS.maxLpa) : String(SALARY_BOUNDS.maxInr)}
                        step={salaryUnit === "LPA" ? "0.5" : "10000"}
                        aria-invalid={Boolean(fieldErrors.salary_range)}
                        className={`${FORM_INPUT_CLASS} ${
                          fieldErrors.salary_range
                            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                            : "border-slate-200 focus:border-slate-400 focus:ring-slate-200"
                        }`}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Model receives salary as annual INR. Current converted value:
                      {" "}
                      {annualSalaryInr > 0 ? `₹${Math.round(annualSalaryInr).toLocaleString("en-IN")}` : "N/A"}
                    </p>
                    {fieldErrors.salary_range ? <p className="text-xs text-rose-700">{fieldErrors.salary_range}</p> : null}
                  </label>

                  <Field
                    icon={HiOutlineChartBar}
                    label="Performance Rating"
                    name="performance_rating"
                    value={formData.performance_rating}
                    onChange={handleChange}
                    type="number"
                    min={String(options.perfMin)}
                    max={String(options.perfMax)}
                    step={String(options.perfStep)}
                    error={fieldErrors.performance_rating}
                  />
                </div>
              </div>

              {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {loading ? "Running Prediction..." : "Analyze Layoff Risk"}
              </button>
            </form>
          </section>

          <section className="space-y-6">
            {!predictionData ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
                <p className="text-sm text-slate-500">
                  Complete the three-step flow to get calibrated risk, reliability diagnostics, and targeted actions.
                </p>
              </div>
            ) : (
              <>
                <ResultPanel predictionData={predictionData} inputQuality={inputQuality} />
                <section className="rounded-3xl border border-slate-300 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Operator Console</p>
                      <p className="font-display mt-1 text-sm font-semibold text-slate-900">Decision Workspace</p>
                      <p className="mt-1 text-xs text-slate-500">
                        One compact control center for simulation, actions, governance, and quality.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportPdf}
                      className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      Export PDF
                    </button>
                  </div>
                  <div className="mt-3">
                    <SegmentTabs tabs={WORKSPACE_TABS} active={workspaceTab} onChange={setWorkspaceTab} />
                  </div>
                </section>

                {workspaceTab === "simulator" ? (
                  <WorkspacePanelFrame tabId="simulator">
                    <WhatIfSimulator
                      whatIfForm={whatIfForm}
                      setWhatIfForm={setWhatIfForm}
                      onRun={handleRunWhatIf}
                      onApplyToInput={handleApplyScenarioToForm}
                      loading={whatIfLoading}
                      result={whatIfResult}
                      baselineRisk={predictionData?.prediction?.layoff_risk}
                    />
                  </WorkspacePanelFrame>
                ) : null}

                {workspaceTab === "actions" ? (
                  <WorkspacePanelFrame tabId="actions">
                    <ActionTrackerPanel
                      actions={actionTracker}
                      onUpdateStatus={handleActionStatusUpdate}
                      onSave={handleSaveActionTracker}
                      onRescore={handleRescore}
                      saving={actionSaving}
                      rescoreLoading={rescoreLoading}
                      message={actionMessage}
                      rescoreSummary={rescoreSummary}
                    />
                  </WorkspacePanelFrame>
                ) : null}

                {workspaceTab === "review" ? (
                  <WorkspacePanelFrame tabId="review">
                    <HumanReviewPanel
                      runId={activeRunId}
                      reviewForm={reviewForm}
                      setReviewForm={setReviewForm}
                      onSubmit={handleSaveReview}
                      saving={reviewSaving}
                      savedReview={predictionData?.history_entry?.review || null}
                      message={reviewMessage}
                    />
                  </WorkspacePanelFrame>
                ) : null}

                {workspaceTab === "guidance" ? (
                  <WorkspacePanelFrame tabId="guidance">
                    <AiSuggestions
                      employeeData={employeeDataForSuggestions}
                      predictionData={predictionData}
                      loading={loading}
                    />
                  </WorkspacePanelFrame>
                ) : null}

                {workspaceTab === "history" ? (
                  <WorkspacePanelFrame tabId="history">
                    <HistoryPanel
                      historyEntries={historyEntries}
                      trend={historyTrend}
                      loading={historyLoading}
                      onRefresh={handleRefreshHistory}
                      onLoadRun={handleLoadHistorySnapshot}
                    />
                  </WorkspacePanelFrame>
                ) : null}

                {workspaceTab === "quality" ? (
                  <WorkspacePanelFrame tabId="quality">
                    <ModelQualityPanel
                      report={evalReport}
                      loading={evalLoading}
                      error={evalError}
                      onLoad={handleLoadModelEval}
                    />
                  </WorkspacePanelFrame>
                ) : null}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default EmployeePred;
