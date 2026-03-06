import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { HiExclamationCircle, HiLightBulb } from "react-icons/hi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:9000";

const isShortTimeline = (timeline = "") => {
  const value = String(timeline).toLowerCase();
  return (
    value.includes("1 month")
    || value.includes("2 month")
    || value.includes("3 month")
    || value.includes("30-day")
    || value.includes("60-day")
    || value.includes("90-day")
  );
};

const SectionCard = ({ title, subtitle, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
    <div className="mt-4 space-y-3">{children}</div>
  </section>
);

const EmptyItem = ({ message }) => (
  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-500">{message}</div>
);

const AI_TABS = [
  { id: "skills", label: "AI Skills" },
  { id: "immediate", label: "AI Immediate" },
  { id: "strategic", label: "AI Strategic" },
  { id: "opportunities", label: "AI Opportunities" },
];

const AiTabs = ({ active, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {AI_TABS.map((tab) => (
      <button
        key={tab.id}
        type="button"
        onClick={() => onChange(tab.id)}
        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
          active === tab.id
            ? "border-cyan-700 bg-cyan-600 text-white"
            : "border-cyan-200 bg-cyan-50/70 text-cyan-800 hover:border-cyan-300 hover:bg-cyan-100"
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

const AiSuggestions = ({ employeeData, predictionData, loading }) => {
  const [suggestions, setSuggestions] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("skills");

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!employeeData || !predictionData?.prediction) {
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const payload = {
          employeeData: {
            job_title: employeeData.job_title || "",
            tech_stack: employeeData.tech_stack || "",
            performance_rating: Number(employeeData.performance_rating) || 0,
            years_at_company: Number(employeeData.years_at_company) || 0,
            company_name: employeeData.company_name || "",
            company_location: employeeData.company_location || "",
            reporting_quarter: employeeData.reporting_quarter || "",
            department: employeeData.department || "",
            remote_work: employeeData.remote_work || "",
            salary_range: Number(employeeData.salary_range) || 0,
          },
          predictionData: {
            prediction: {
              layoff_risk: predictionData.prediction?.layoff_risk || "Medium",
              confidence: Number(predictionData.prediction?.confidence) || 0,
              probabilities: predictionData.prediction?.probabilities || {},
              top_factors: Array.isArray(predictionData.prediction?.top_factors)
                ? predictionData.prediction.top_factors
                : [],
              improvement_tips: Array.isArray(predictionData.prediction?.improvement_tips)
                ? predictionData.prediction.improvement_tips
                : [],
            },
            data: predictionData.data || {},
            stack_survival: predictionData.stack_survival || null,
            market_signals: predictionData.market_signals || {},
            reliability: predictionData.reliability || {},
          },
        };

        const response = await axios.post(`${API_BASE_URL}/api/suggestions`, payload);
        if (!response.data?.success) {
          throw new Error(response.data?.message || "Unable to generate suggestions");
        }
        setSuggestions(response.data.suggestions);
      } catch (requestError) {
        setError(requestError.response?.data?.message || requestError.message || "Failed to generate suggestions.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [employeeData, predictionData]);

  const grouped = useMemo(() => {
    const skills = Array.isArray(suggestions?.skills) ? suggestions.skills : [];
    const actions = Array.isArray(suggestions?.actions) ? suggestions.actions : [];
    const opportunities = Array.isArray(suggestions?.opportunities) ? suggestions.opportunities : [];

    const immediateActions = actions.filter((item) => isShortTimeline(item.timeline));
    const strategicActions = actions.filter((item) => !isShortTimeline(item.timeline));

    return {
      skills,
      immediateActions,
      strategicActions: strategicActions.length ? strategicActions : actions,
      opportunities,
    };
  }, [suggestions]);

  if (loading || isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3 text-slate-600">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
          <p className="text-sm">Building your personalized career action plan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
        <div className="flex items-start gap-3">
          <HiExclamationCircle className="mt-0.5 h-5 w-5 text-rose-700" />
          <div>
            <p className="text-sm font-semibold text-rose-800">Could not generate AI suggestions</p>
            <p className="mt-1 text-sm text-rose-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!suggestions) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-cyan-200 bg-cyan-50/30 p-5">
        <div className="flex items-start gap-3">
          <HiLightBulb className="mt-0.5 h-5 w-5 text-cyan-700" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">AI Career Guidance</h2>
            <p className="mt-1 text-sm text-slate-600">
              Actionable suggestions grounded in predicted risk, market signals, and role context.
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Governance note: use these suggestions as advisory guidance, not as standalone decision criteria.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Engine: {String(suggestions?.generator || "rag").toUpperCase()}
              {suggestions?.generator_model ? ` (${suggestions.generator_model})` : ""}
            </p>
            {String(suggestions?.generator || "").toLowerCase() === "rag" ? (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900">
                Live Gemini suggestions are temporarily unavailable (usually provider quota/rate limits). Showing grounded RAG guidance.
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-4">
          <AiTabs active={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      {activeTab === "skills" ? (
        <SectionCard title="Priority Skills" subtitle="Skills that improve retention and internal mobility">
          {grouped.skills.length ? (
            grouped.skills.map((skill, index) => (
              <div key={`${skill.name}-${index}`} className="rounded-xl border border-cyan-100 bg-cyan-50/40 p-3">
                <p className="text-sm font-semibold text-slate-900">{skill.name}</p>
                <p className="mt-1 text-sm text-slate-700">{skill.why}</p>
                <p className="mt-1 text-xs text-slate-600">How: {skill.how}</p>
                <p className="mt-1 text-xs text-slate-600">Impact: {skill.impact}</p>
              </div>
            ))
          ) : (
            <EmptyItem message="No skill recommendations generated." />
          )}
        </SectionCard>
      ) : null}

      {activeTab === "immediate" ? (
        <SectionCard title="Immediate Actions" subtitle="Short-term steps (next 1-3 months)">
          {grouped.immediateActions.length ? (
            grouped.immediateActions.map((action, index) => (
              <div key={`${action.title}-${index}`} className="rounded-xl border border-cyan-100 bg-cyan-50/40 p-3">
                <p className="text-sm font-semibold text-slate-900">{action.title}</p>
                <p className="mt-1 text-xs text-slate-600">Timeline: {action.timeline}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {(action.steps || []).map((step, stepIndex) => (
                    <li key={`${step}-${stepIndex}`}>{step}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-slate-600">Success indicator: {action.indicators}</p>
              </div>
            ))
          ) : (
            <EmptyItem message="No immediate actions generated." />
          )}
        </SectionCard>
      ) : null}

      {activeTab === "strategic" ? (
        <SectionCard title="Strategic Actions" subtitle="Medium/long horizon career stabilization">
          {grouped.strategicActions.length ? (
            grouped.strategicActions.map((action, index) => (
              <div key={`${action.title}-${index}`} className="rounded-xl border border-cyan-100 bg-cyan-50/40 p-3">
                <p className="text-sm font-semibold text-slate-900">{action.title}</p>
                <p className="mt-1 text-xs text-slate-600">Timeline: {action.timeline}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {(action.steps || []).map((step, stepIndex) => (
                    <li key={`${step}-${stepIndex}`}>{step}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-slate-600">Success indicator: {action.indicators}</p>
              </div>
            ))
          ) : (
            <EmptyItem message="No strategic actions generated." />
          )}
        </SectionCard>
      ) : null}

      {activeTab === "opportunities" ? (
        <SectionCard title="Opportunities" subtitle="Internal or external paths with risk-reduction impact">
          {grouped.opportunities.length ? (
            grouped.opportunities.map((opportunity, index) => (
              <div key={`${opportunity.title}-${index}`} className="rounded-xl border border-cyan-100 bg-cyan-50/40 p-3">
                <p className="text-sm font-semibold text-slate-900">{opportunity.title}</p>
                <p className="mt-1 text-xs text-slate-600">Timeline: {opportunity.timeline}</p>
                <p className="mt-1 text-sm text-slate-700">Requirements: {opportunity.requirements}</p>
                <p className="mt-1 text-xs text-slate-600">Impact: {opportunity.impact}</p>
              </div>
            ))
          ) : (
            <EmptyItem message="No opportunity recommendations generated." />
          )}
        </SectionCard>
      ) : null}
    </div>
  );
};

export default AiSuggestions;
