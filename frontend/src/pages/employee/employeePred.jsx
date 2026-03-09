import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";
import {
  ACTION_STATUS_OPTIONS,
  FALLBACK_COMPANY_OPTIONS,
  FALLBACK_DEPARTMENT_OPTIONS,
  FALLBACK_JOB_OPTIONS,
  FALLBACK_LOCATION_OPTIONS,
  FALLBACK_QUARTER_OPTIONS,
  FALLBACK_TECH_STACK_OPTIONS,
  SALARY_BOUNDS,
} from "./predictor/constants";
import {
  buildActionTrackerSeed,
  buildRiskStory,
  getResponsibleAssessment,
  mergeResumeInsightsFromForm,
  parseListInput,
  sanitizeResumeInsights,
  toAnnualInr,
} from "./predictor/utils";
import { InputPanel, PredictionWorkspace } from "./predictor/sections";

const EmployeePred = () => {
  const [formData, setFormData] = useState({
    company_name: "",
    company_location: "",
    reporting_quarter: "",
    job_title: "",
    tech_stack: "",
    stack_profile: "",
    skill_tags: "",
    certifications: "",
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

  const [whatIfForm, setWhatIfForm] = useState({
    years_at_company: "",
    performance_rating: "",
    salary_lpa: "",
  });
  const [whatIfResult, setWhatIfResult] = useState(null);
  const [whatIfLoading, setWhatIfLoading] = useState(false);

  const [evalReport, setEvalReport] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState("");

  const [workspaceTab, setWorkspaceTab] = useState("simulator");
  const [viewMode, setViewMode] = useState("simple");

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeParsing, setResumeParsing] = useState(false);
  const [resumeInsights, setResumeInsights] = useState(null);
  const [resumeMissingFields, setResumeMissingFields] = useState([]);
  const [resumeTrendGuidance, setResumeTrendGuidance] = useState(null);
  const [resumeMessage, setResumeMessage] = useState("");
  const [resumeIntelligence, setResumeIntelligence] = useState(null);

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

    const hasPrimaryStack = String(formData.tech_stack || "").trim() && options.techStacks.includes(formData.tech_stack);
    const hasMixedStack = String(formData.stack_profile || "").trim().length > 0;
    const hasSkillTags = parseListInput(formData.skill_tags, 12).length > 0;
    const hasResumeSkills = Array.isArray(resumeInsights?.skills) && resumeInsights.skills.length > 0;
    if (!hasPrimaryStack && !hasMixedStack && !hasSkillTags && !hasResumeSkills) {
      score -= 16;
      warnings.push("Add stack signals: choose primary stack, or enter mixed stack profile / skill tags.");
    } else if (!hasPrimaryStack) {
      score -= 6;
      warnings.push("Primary stack is optional if mixed stack and skill tags are clearly provided.");
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
  }, [annualSalaryInr, formData, options, resumeInsights]);

  const activeRunId = predictionData?.run_id || predictionData?.history_entry?.run_id || null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (error) {
      setError("");
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSalaryUnitChange = (event) => {
    if (error) {
      setError("");
    }
    setSalaryUnit(event.target.value);
  };

  const handleResumeFileChange = (event) => {
    const file = event?.target?.files?.[0] || null;
    setResumeFile(file);
    setResumeMessage(file ? `Ready to parse: ${file.name}` : "");
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

      let response;
      try {
        response = await axios.post(`${API_BASE_URL}/api/employee/resume-parse-enhanced`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (response.data?.success && response.data?.resumeIntelligence) {
          const extractedProfile = response.data.profile || {};
          const intelligence = response.data.resumeIntelligence || {};
          const missingFields = Array.isArray(response.data.missing_required_fields)
            ? response.data.missing_required_fields
            : [];
          const normalizedSkills = Array.isArray(intelligence.skills)
            ? intelligence.skills
              .map((item) => (typeof item === "string" ? item : item?.name))
              .filter(Boolean)
            : [];
          const normalizedCertifications = Array.isArray(intelligence.certifications)
            ? intelligence.certifications
              .map((item) => (typeof item === "string" ? item : item?.name))
              .filter(Boolean)
            : [];
          const filledFieldCount = Object.values(extractedProfile)
            .filter((value) => value != null && String(value).trim() !== "")
            .length;

          setFormData((prev) => {
            const next = { ...prev };
            for (const [key, value] of Object.entries(extractedProfile)) {
              if (value != null && String(value).trim() !== "") {
                next[key] = String(value);
              }
            }

            if (!String(next.skill_tags || "").trim() && Array.isArray(intelligence.skills) && intelligence.skills.length) {
              next.skill_tags = intelligence.skills
                .slice(0, 10)
                .map((item) => (typeof item === "string" ? item : item?.name))
                .filter(Boolean)
                .join(", ");
            }

            if (!String(next.certifications || "").trim() && Array.isArray(intelligence.certifications) && intelligence.certifications.length) {
              next.certifications = intelligence.certifications
                .slice(0, 8)
                .map((item) => (typeof item === "string" ? item : item?.name))
                .filter(Boolean)
                .join(", ");
            }

            return next;
          });

          setResumeInsights({
            candidate_name: intelligence.candidate_name || null,
            years_of_experience: Number.isFinite(Number(intelligence.years_of_experience))
              ? Number(intelligence.years_of_experience)
              : null,
            certifications: normalizedCertifications,
            skills: normalizedSkills,
            ai_readiness_score: Number.isFinite(Number(intelligence?.scores?.overallStrength))
              ? Number(intelligence.scores.overallStrength)
              : 0,
            parse_confidence: Number.isFinite(Number(intelligence.parse_confidence))
              ? Number(intelligence.parse_confidence)
              : 0.7,
          });
          setResumeMissingFields(missingFields);
          setResumeIntelligence(intelligence);
          setResumeTrendGuidance(response.data.trend_guidance || null);
          const scores = intelligence.scores || {};
          setResumeMessage(
            missingFields.length
              ? `Resume analyzed. Auto-filled ${filledFieldCount} fields. Fill remaining: ${missingFields.join(", ")}.`
              : `Resume analyzed. Overall strength: ${scores.overallStrength || 0}/100. Skills found: ${intelligence.skills?.length || 0}.`
          );
          return;
        }
      } catch (enhancedError) {
        console.warn("Enhanced parser failed, falling back to basic parser:", enhancedError.message);
      }

      response = await axios.post(`${API_BASE_URL}/api/employee/resume-parse`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Unable to parse resume");
      }

      const extractedProfile = response.data.profile || {};
      const parsedInsights = response.data.resume_insights || {};

      setFormData((prev) => {
        const next = { ...prev };
        for (const [key, value] of Object.entries(extractedProfile)) {
          if (value != null && String(value).trim() !== "") {
            next[key] = String(value);
          }
        }
        if (!String(next.skill_tags || "").trim() && Array.isArray(parsedInsights.skills) && parsedInsights.skills.length) {
          next.skill_tags = parsedInsights.skills.slice(0, 10).join(", ");
        }
        if (!String(next.certifications || "").trim()
          && Array.isArray(parsedInsights.certifications)
          && parsedInsights.certifications.length) {
          next.certifications = parsedInsights.certifications.slice(0, 8).join(", ");
        }
        if (!String(next.stack_profile || "").trim() && String(next.tech_stack || "").trim()) {
          next.stack_profile = next.tech_stack;
        }
        return next;
      });

      const nextInsights = parsedInsights || null;
      const nextMissing = Array.isArray(response.data.missing_required_fields)
        ? response.data.missing_required_fields
        : [];
      const nextTrend = response.data.trend_guidance || null;

      setResumeIntelligence(null);
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

  const validateFormData = useCallback((data, unit) => {
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

    const hasPrimaryStack = String(data.tech_stack || "").trim().length > 0;
    const hasMixedStackProfile = String(data.stack_profile || "").trim().length > 0;
    const hasSkillTags = parseListInput(data.skill_tags, 12).length > 0;
    const hasResumeSkills = Array.isArray(resumeInsights?.skills) && resumeInsights.skills.length > 0;
    if (!hasPrimaryStack && !hasMixedStackProfile && !hasSkillTags && !hasResumeSkills) {
      errors.tech_stack = "Select primary stack or provide mixed stack profile / skill tags.";
    } else if (hasPrimaryStack && !options.techStacks.includes(data.tech_stack)) {
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
  }, [
    options.companies,
    options.departments,
    options.jobs,
    options.locations,
    options.perfMax,
    options.perfMin,
    options.quarters,
    options.remote,
    options.techStacks,
    options.yearsMax,
    resumeInsights,
  ]);

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

  const buildPayloadFromForm = () => {
    const mergedResumeInsights = mergeResumeInsightsFromForm(resumeInsights, formData);
    return {
      ...formData,
      years_at_company: Number(formData.years_at_company),
      salary_range: annualSalaryInr,
      performance_rating: Number(formData.performance_rating),
      stack_profile: String(formData.stack_profile || "").trim(),
      skill_tags: String(formData.skill_tags || "").trim(),
      certifications: String(formData.certifications || "").trim(),
      resume_insights: mergedResumeInsights,
    };
  };

  const runPrediction = async (payload) => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/api/employee/predict`, payload);
      setPredictionData(response.data);

      const resolvedStack = String(response.data?.normalized_input?.tech_stack || "").trim();
      if (resolvedStack) {
        setFormData((prev) => ({ ...prev, tech_stack: resolvedStack }));
      }

      setWhatIfResult(null);
      return response.data;
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Failed to fetch employee prediction.";
      setError(message);
      throw requestError;
    } finally {
      setLoading(false);
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
      await runPrediction(payload);
    } catch {
      // error state already handled in runPrediction
    }
  };

  const employeeDataForSuggestions = useMemo(() => {
    const mergedResumeInsights = mergeResumeInsightsFromForm(
      resumeInsights || predictionData?.resume_insights,
      formData
    );
    return {
      ...formData,
      years_at_company: Number(formData.years_at_company) || 0,
      performance_rating: Number(formData.performance_rating) || 0,
      salary_range: annualSalaryInr || 0,
      stack_profile: String(formData.stack_profile || "").trim(),
      skill_tags: String(formData.skill_tags || "").trim(),
      certifications: String(formData.certifications || "").trim(),
      resume_insights: sanitizeResumeInsights(mergedResumeInsights),
    };
  }, [annualSalaryInr, formData, predictionData?.resume_insights, resumeInsights]);

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

    if (predictionData?.resume_insights) {
      setResumeInsights(predictionData.resume_insights);
    }
    if (predictionData?.trend_guidance) {
      setResumeTrendGuidance(predictionData.trend_guidance);
    }
  }, [predictionData, annualSalaryInr, formData.performance_rating, formData.salary_range, formData.years_at_company]);

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
      const actionTracker = Array.isArray(predictionData?.history_entry?.action_tracker)
        && predictionData.history_entry.action_tracker.length
        ? predictionData.history_entry.action_tracker
        : buildActionTrackerSeed(predictionData);

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
        y += lines.length * gap;
      };

      addTextBlock("Career Shield Employee Risk Report", 16, "bold", 18);
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
      actionTracker.slice(0, 6).forEach((item, idx) => {
        const statusLabel = ACTION_STATUS_OPTIONS.find((opt) => opt.value === item.status)?.label || item.status;
        addTextBlock(`${idx + 1}. ${item.title} [${statusLabel}]`, 10, "normal", 13);
      });
      y += 2;

      addTextBlock("Responsible Use", 12, "bold", 14);
      addTextBlock(assessment?.statusMeta?.text || "", 10, "normal", 13);
      (assessment?.limitations || []).slice(0, 4).forEach((item) => {
        addTextBlock(`- ${item}`, 10, "normal", 13);
      });

      if (review) {
        y += 2;
        addTextBlock("Human Review Note", 12, "bold", 14);
        addTextBlock(`Reviewer: ${review.reviewed_by} (${review.decision})`, 10, "normal", 13);
        addTextBlock(`Reason: ${review.review_reason}`, 10, "normal", 13);
      }

      const fileDate = new Date().toISOString().slice(0, 10);
      doc.save(`career_shield_employee_report_${fileDate}.pdf`);
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
          <InputPanel
            formData={formData}
            options={options}
            fieldErrors={fieldErrors}
            inputQuality={inputQuality}
            error={error}
            loading={loading}
            salaryUnit={salaryUnit}
            annualSalaryInr={annualSalaryInr}
            resumeFileName={resumeFile?.name || ""}
            resumeParsing={resumeParsing}
            resumeInsights={resumeInsights}
            resumeMissingFields={resumeMissingFields}
            resumeTrendGuidance={resumeTrendGuidance}
            resumeMessage={resumeMessage}
            onChange={handleChange}
            onSalaryUnitChange={handleSalaryUnitChange}
            onSubmit={handleSubmit}
            onResumeFileChange={handleResumeFileChange}
            onResumeParse={handleResumeParse}
          />

          <PredictionWorkspace
            predictionData={predictionData}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            inputQuality={inputQuality}
            resumeIntelligence={resumeIntelligence}
            workspaceTab={workspaceTab}
            onWorkspaceTabChange={setWorkspaceTab}
            whatIfForm={whatIfForm}
            setWhatIfForm={setWhatIfForm}
            onRunWhatIf={handleRunWhatIf}
            onApplyScenarioToForm={handleApplyScenarioToForm}
            whatIfLoading={whatIfLoading}
            whatIfResult={whatIfResult}
            employeeDataForSuggestions={employeeDataForSuggestions}
            evalReport={evalReport}
            evalLoading={evalLoading}
            evalError={evalError}
            onLoadModelEval={handleLoadModelEval}
            onExportPdf={handleExportPdf}
          />
        </div>
      </div>
    </div>
  );
};

export default EmployeePred;
