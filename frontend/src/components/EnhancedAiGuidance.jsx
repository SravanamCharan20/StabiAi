import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  HiAcademicCap,
  HiCheckCircle,
  HiClock,
  HiExclamationCircle,
  HiLightBulb,
  HiRefresh,
  HiSparkles,
} from "react-icons/hi";
import { API_BASE_URL } from "../config/api";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "roadmap", label: "Roadmap" },
  { id: "certifications", label: "Certifications" },
  { id: "learning", label: "Learning Path" },
  { id: "resources", label: "Recommended Resources" },
];

const PHASE_META = {
  phase1: { title: "Phase 1: Immediate Actions", timeline: "0-3 months", badge: "High Priority" },
  phase2: { title: "Phase 2: Role Reinforcement", timeline: "3-6 months", badge: "Important" },
  phase3: { title: "Phase 3: Future-Proofing", timeline: "6-12 months", badge: "Growth" },
};

const asArray = (value) => (Array.isArray(value) ? value : []);

const toText = (value) => String(value || "").replace(/\s+/g, " ").trim();

const toShortText = (value, limit = 180) => {
  const text = toText(value);
  if (!text) {
    return "";
  }
  return text.length > limit ? `${text.slice(0, limit - 1).trim()}...` : text;
};

const uniqueList = (items, limit = 8) => {
  const out = [];
  const seen = new Set();
  for (const item of asArray(items)) {
    const text = toText(item);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(text);
    if (out.length >= limit) {
      break;
    }
  }
  return out;
};

const toSearchUrl = (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`;

const getPhaseKeyFromTimeline = (timeline = "") => {
  const value = toText(timeline).toLowerCase();
  if (!value) {
    return "phase1";
  }
  if (/week|0-3|1-3|30|60|90/.test(value)) {
    return "phase1";
  }
  if (/3-6|4-6|month\s*[3-6]|quarter/.test(value)) {
    return "phase2";
  }
  if (/6-12|9-12|month\s*(7|8|9|10|11|12)/.test(value)) {
    return "phase3";
  }
  return "phase2";
};

const parseResumeList = (value) => {
  if (Array.isArray(value)) {
    return uniqueList(value.map((item) => (typeof item === "string" ? item : item?.name || item?.title)));
  }
  if (typeof value === "string") {
    return uniqueList(value.split(",").map((item) => item.trim()));
  }
  return [];
};

const normalizeSuggestions = (raw, predictionData, resumeIntelligence) => {
  const safe = raw && typeof raw === "object" ? raw : {};
  const trends = safe?.trends && typeof safe.trends === "object" ? safe.trends : {};
  const insights = safe?.insights && typeof safe.insights === "object" ? safe.insights : {};
  const guidanceMix = safe?.guidance_mix && typeof safe.guidance_mix === "object" ? safe.guidance_mix : {};
  const generatorStatus = safe?.generator_status && typeof safe.generator_status === "object"
    ? safe.generator_status
    : {};

  const resumeCertifications = parseResumeList(
    resumeIntelligence?.certifications || predictionData?.resume_insights?.certifications || []
  );

  const skills = asArray(safe.skills)
    .map((item) => ({
      name: toText(item?.name),
      why: toShortText(item?.why, 150),
      how: toShortText(item?.how, 150),
      impact: toShortText(item?.impact, 140),
    }))
    .filter((item) => item.name)
    .slice(0, 6);

  const actions = asArray(safe.actions)
    .map((item) => ({
      title: toText(item?.title),
      timeline: toText(item?.timeline),
      steps: asArray(item?.steps).map((step) => toShortText(step, 140)).filter(Boolean).slice(0, 4),
      indicators: toShortText(item?.indicators, 150),
    }))
    .filter((item) => item.title)
    .slice(0, 6);

  const timelinePlan = asArray(guidanceMix?.timeline_plan)
    .map((item) => ({
      window: toText(item?.window),
      focus: toShortText(item?.focus, 150),
    }))
    .filter((item) => item.window && item.focus)
    .slice(0, 4);

  const learningTracksFromActions = actions.map((action) => ({
    title: action.title,
    timeline: action.timeline || "0-3 months",
    steps: action.steps,
    outcome: action.indicators,
  }));

  const learningTracks = learningTracksFromActions.length
    ? learningTracksFromActions
    : timelinePlan.map((item) => ({
      title: item.focus,
      timeline: item.window,
      steps: [item.focus],
      outcome: "Track measurable execution for this timeline window.",
    }));

  const grouped = { phase1: [], phase2: [], phase3: [] };
  for (const track of learningTracks) {
    const phaseKey = getPhaseKeyFromTimeline(track.timeline);
    grouped[phaseKey].push(track);
  }

  const roadmapPhases = Object.entries(PHASE_META)
    .map(([phaseKey, meta]) => ({
      ...meta,
      key: phaseKey,
      items: grouped[phaseKey] || [],
    }))
    .filter((phase) => phase.items.length > 0);

  const trendingCertifications = asArray(trends?.trending_certifications)
    .map((item) => ({
      name: toText(item?.name),
      provider: toText(item?.provider),
      level: toText(item?.level),
      why: toShortText(item?.why, 150),
    }))
    .filter((item) => item.name)
    .slice(0, 6);

  let certFocus = uniqueList([
    ...asArray(guidanceMix?.certification_focus),
    ...asArray(trends?.certification_gaps),
  ], 6);

  if (!certFocus.length) {
    certFocus = uniqueList(
      trendingCertifications
        .map((item) => item.name)
        .filter((name) => !resumeCertifications.some((cert) => cert.toLowerCase() === String(name).toLowerCase())),
      2
    );
  }

  const certificationCards = certFocus.map((name) => {
    const trendDetail = trendingCertifications.find((item) => item.name.toLowerCase() === name.toLowerCase());
    const hasAlready = resumeCertifications.some((item) => item.toLowerCase() === name.toLowerCase());
    return {
      name,
      provider: trendDetail?.provider || "",
      level: trendDetail?.level || "",
      reason: trendDetail?.why || "Improves role defensibility and internal mobility signal.",
      hasAlready,
    };
  });

  const attention = uniqueList([
    ...asArray(guidanceMix?.attention_points),
    ...asArray(insights?.why_this_prediction).map((item) => {
      if (typeof item === "string") {
        return toShortText(item, 150);
      }
      const factor = toText(item?.factor || item?.title || "Signal");
      const reason = toShortText(item?.reason || item?.why, 110);
      return factor && reason ? `${factor}: ${reason}` : factor || reason;
    }),
  ], 5);

  const opportunities = asArray(safe.opportunities)
    .map((item) => ({
      title: toText(item?.title),
      timeline: toText(item?.timeline),
      requirements: toShortText(item?.requirements, 120),
      impact: toShortText(item?.impact, 120),
    }))
    .filter((item) => item.title)
    .slice(0, 4);

  const resourceSeeds = uniqueList([
    ...skills.map((item) => item.name),
    ...certFocus,
    ...learningTracks.map((item) => item.title),
  ], 10);

  const resources = resourceSeeds.map((topic) => ({
    topic,
    docs: toSearchUrl(`${topic} official documentation`),
    learning: toSearchUrl(`${topic} complete learning path course`),
    practice: toSearchUrl(`${topic} hands on project practice`),
    certification: toSearchUrl(`${topic} certification guide`),
  }));

  const risk = toText(guidanceMix?.security_brief?.risk_label || predictionData?.prediction?.layoff_risk || "Medium");
  const confidence = Number.isFinite(Number(guidanceMix?.security_brief?.confidence_pct))
    ? Number(guidanceMix.security_brief.confidence_pct)
    : Math.round(Number(predictionData?.prediction?.confidence || 0) * 100);

  const engine = toText(safe?.generator || "rag").toLowerCase();
  const engineMessage = toShortText(
    generatorStatus?.message
      || (engine === "gemini"
        ? "Guidance generated by Gemini using your profile and market-aware signals."
        : "Gemini is unavailable for this run. Showing grounded RAG guidance."),
    220
  );

  return {
    engine,
    model: toText(safe?.generator_model),
    engineStatus: {
      reason: toText(generatorStatus?.reason || ""),
      retryAfterMs: Number.isFinite(Number(generatorStatus?.retry_after_ms))
        ? Number(generatorStatus.retry_after_ms)
        : 0,
      message: engineMessage,
    },
    summary: toShortText(guidanceMix?.market_outlook || trends?.summary, 230),
    risk,
    confidence,
    marketRegime: toText(guidanceMix?.security_brief?.market_regime || predictionData?.market_signals?.marketRegime || "Stable"),
    reliability: toText(guidanceMix?.security_brief?.reliability_gate || predictionData?.reliability?.gate || "medium"),
    attention,
    opportunities,
    skills,
    learningTracks,
    roadmapPhases,
    certifications: certificationCards,
    resumeCertifications,
    resources,
  };
};

const TabButton = ({ active, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
      active
        ? "border-slate-900 bg-slate-900 text-white"
        : "border-cyan-200 bg-cyan-50/70 text-cyan-800 hover:border-cyan-300 hover:bg-cyan-100"
    }`}
  >
    {label}
  </button>
);

const EmptyState = ({ message }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">{message}</div>
);

const EnhancedAiGuidance = ({ employeeData, predictionData, resumeIntelligence }) => {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");
  const [refreshNonce, setRefreshNonce] = useState(0);

  const fetchKey = useMemo(
    () => JSON.stringify({
      runId: predictionData?.run_id || predictionData?.history_entry?.run_id || null,
      risk: predictionData?.prediction?.layoff_risk || "",
      score: predictionData?.prediction?.risk_score || "",
      role: employeeData?.job_title || "",
      stack: employeeData?.tech_stack || "",
      dept: employeeData?.department || "",
      skills: employeeData?.skill_tags || "",
      certs: employeeData?.certifications || "",
    }),
    [
      predictionData?.run_id,
      predictionData?.history_entry?.run_id,
      predictionData?.prediction?.layoff_risk,
      predictionData?.prediction?.risk_score,
      employeeData?.job_title,
      employeeData?.tech_stack,
      employeeData?.department,
      employeeData?.skill_tags,
      employeeData?.certifications,
    ]
  );

  const requestPayload = useMemo(() => ({
    employeeData: {
      job_title: employeeData?.job_title || "",
      tech_stack: employeeData?.tech_stack || "",
      performance_rating: Number(employeeData?.performance_rating) || 0,
      years_at_company: Number(employeeData?.years_at_company) || 0,
      company_name: employeeData?.company_name || "",
      company_location: employeeData?.company_location || "",
      reporting_quarter: employeeData?.reporting_quarter || "",
      department: employeeData?.department || "",
      remote_work: employeeData?.remote_work || "",
      salary_range: Number(employeeData?.salary_range) || 0,
      certifications: employeeData?.certifications || "",
      skill_tags: employeeData?.skill_tags || "",
      stack_profile: employeeData?.stack_profile || "",
      resume_insights: resumeIntelligence || employeeData?.resume_insights || {},
    },
    predictionData: {
      prediction: predictionData?.prediction || {},
      data: predictionData?.data || {},
      stack_survival: predictionData?.stack_survival || null,
      market_signals: predictionData?.market_signals || {},
      resume_insights: predictionData?.resume_insights || {},
      trend_guidance: predictionData?.trend_guidance || null,
      reliability: predictionData?.reliability || {},
      run_id: predictionData?.run_id || predictionData?.history_entry?.run_id || null,
    },
  }), [employeeData, predictionData, resumeIntelligence]);

  useEffect(() => {
    if (!predictionData?.prediction) {
      return;
    }

    let cancelled = false;

    const fetchSuggestions = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await axios.post(`${API_BASE_URL}/api/suggestions`, requestPayload, {
          timeout: 60000,
        });

        if (!response.data?.success || !response.data?.suggestions) {
          throw new Error(response.data?.message || "Unable to generate suggestions");
        }

        if (!cancelled) {
          setSuggestions(response.data.suggestions);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.response?.data?.message || requestError.message || "Failed to generate suggestions.");
          setSuggestions(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchSuggestions();

    return () => {
      cancelled = true;
    };
  }, [fetchKey, refreshNonce, predictionData?.prediction, requestPayload]);

  const normalized = useMemo(
    () => normalizeSuggestions(suggestions, predictionData, resumeIntelligence),
    [suggestions, predictionData, resumeIntelligence]
  );

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3 text-slate-600">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
          <p className="text-sm">Generating AI guidance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
        <div className="flex items-start gap-3">
          <HiExclamationCircle className="mt-0.5 h-5 w-5 text-rose-700" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-rose-800">AI guidance request failed</p>
            <p className="mt-1 text-sm text-rose-700">{error}</p>
            <button
              type="button"
              onClick={() => setRefreshNonce((value) => value + 1)}
              className="mt-3 inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100"
            >
              <HiRefresh className="h-4 w-4" /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!suggestions) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-600">Run prediction to generate AI guidance.</p>
      </div>
    );
  }

  const engineBadgeClass = normalized.engine === "gemini"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-amber-200 bg-amber-50 text-amber-900";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-cyan-200 bg-cyan-50/35 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <HiSparkles className="mt-0.5 h-5 w-5 text-cyan-700" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-800">AI Guidance</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">Personalized Career Guidance</h2>
              <p className="mt-1 text-sm text-slate-600">
                Data-driven guidance generated from your prediction signals, role context, and market trend patterns.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRefreshNonce((value) => value + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-cyan-300 bg-white px-3 py-1.5 text-xs font-semibold text-cyan-900 hover:bg-cyan-100"
          >
            <HiRefresh className="h-4 w-4" /> Refresh
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${engineBadgeClass}`}>
            Engine: {normalized.engine === "gemini" ? "Gemini" : "RAG"}
          </span>
          {normalized.model ? (
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700">
              Model: {normalized.model}
            </span>
          ) : null}
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700">
            Market: {normalized.marketRegime}
          </span>
        </div>

        <p className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
          {normalized.engineStatus.message}
          {normalized.engineStatus.retryAfterMs > 0
            ? ` Retry window: ~${Math.ceil(normalized.engineStatus.retryAfterMs / 1000)}s.`
            : ""}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {TABS.map((item) => (
            <TabButton
              key={item.id}
              label={item.label}
              active={tab === item.id}
              onClick={() => setTab(item.id)}
            />
          ))}
        </div>
      </div>

      {tab === "overview" ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-900">Summary</p>
            <p className="mt-1 text-sm text-slate-700">
              {normalized.summary || "No additional summary available for this run."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Risk</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{normalized.risk}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Confidence</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{normalized.confidence}%</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Market Regime</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{normalized.marketRegime}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Reliability</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{normalized.reliability}</p>
            </div>
          </div>

          {normalized.attention.length ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">What Needs Attention</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
                {normalized.attention.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {normalized.opportunities.length ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/35 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">Opportunity Paths</p>
              <div className="mt-2 space-y-2">
                {normalized.opportunities.map((item) => (
                  <div key={item.title} className="rounded-lg border border-emerald-100 bg-white p-2.5">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    {item.timeline ? <p className="mt-0.5 text-xs text-slate-600">Timeline: {item.timeline}</p> : null}
                    {item.impact ? <p className="mt-1 text-xs text-slate-700">Impact: {item.impact}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === "roadmap" ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <HiAcademicCap className="h-5 w-5 text-slate-700" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Roadmap</h3>
          </div>

          {normalized.roadmapPhases.length ? normalized.roadmapPhases.map((phase) => (
            <div key={phase.key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{phase.title}</p>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                    {phase.timeline}
                  </span>
                  <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                    {phase.badge}
                  </span>
                </div>
              </div>

              <div className="mt-2 space-y-2">
                {phase.items.map((item) => (
                  <div key={`${phase.key}-${item.title}`} className="rounded-lg border border-slate-200 bg-white p-2.5">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    {item.timeline ? <p className="mt-0.5 text-xs text-slate-600">Timeline: {item.timeline}</p> : null}
                    {item.outcome ? <p className="mt-1 text-xs text-slate-700">Outcome: {item.outcome}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          )) : <EmptyState message="No roadmap phases were generated for this run." />}
        </section>
      ) : null}

      {tab === "certifications" ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <HiCheckCircle className="h-5 w-5 text-slate-700" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Certifications</h3>
          </div>

          {normalized.resumeCertifications.length ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/35 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">Already in your profile</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {normalized.resumeCertifications.map((cert) => (
                  <span key={cert} className="rounded-full border border-emerald-300 bg-white px-2.5 py-1 text-xs font-medium text-emerald-900">
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {normalized.certifications.length ? (
            <div className="space-y-2">
              {normalized.certifications.map((cert) => (
                <div key={cert.name} className="rounded-xl border border-indigo-200 bg-indigo-50/35 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{cert.name}</p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        cert.hasAlready
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {cert.hasAlready ? "Already Has" : "Recommended"}
                    </span>
                  </div>
                  {cert.provider || cert.level ? (
                    <p className="mt-0.5 text-xs text-slate-600">{[cert.provider, cert.level].filter(Boolean).join(" | ")}</p>
                  ) : null}
                  <p className="mt-1 text-sm text-slate-700">{cert.reason}</p>
                </div>
              ))}
            </div>
          ) : <EmptyState message="No certification recommendations were generated." />}
        </section>
      ) : null}

      {tab === "learning" ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <HiClock className="h-5 w-5 text-slate-700" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Learning Path</h3>
          </div>

          {normalized.learningTracks.length ? normalized.learningTracks.map((track, trackIdx) => (
            <div key={`${track.title}-${trackIdx}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{track.title}</p>
                <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                  {track.timeline || "Planned"}
                </span>
              </div>

              {track.steps.length ? (
                <ol className="mt-2 space-y-2">
                  {track.steps.map((step, stepIdx) => (
                    <li key={`${track.title}-step-${stepIdx}`} className="flex gap-2 text-sm text-slate-700">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                        {stepIdx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 text-sm text-slate-700">No detailed steps were generated for this action.</p>
              )}

              {track.outcome ? <p className="mt-2 text-xs text-slate-600">Target outcome: {track.outcome}</p> : null}
            </div>
          )) : <EmptyState message="No learning path actions were generated." />}
        </section>
      ) : null}

      {tab === "resources" ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <HiLightBulb className="h-5 w-5 text-slate-700" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Recommended Resources</h3>
          </div>

          {normalized.resources.length ? normalized.resources.map((resource) => (
            <div key={resource.topic} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">{resource.topic}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <a href={resource.docs} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50">
                  Documentation
                </a>
                <a href={resource.learning} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50">
                  Learning Path
                </a>
                <a href={resource.practice} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50">
                  Practice Projects
                </a>
                <a href={resource.certification} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50">
                  Certification Guide
                </a>
              </div>
            </div>
          )) : <EmptyState message="No resources were generated for this run." />}
        </section>
      ) : null}

      {normalized.engine === "rag" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-2 text-xs text-amber-900">
          Source Notice: Gemini is not active for this run; guidance is generated from RAG knowledge and prediction context.
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-3 py-2 text-xs text-emerald-900">
          Source Notice: Guidance is generated by Gemini and aligned with prediction context and retrieval grounding.
        </div>
      )}
    </div>
  );
};

export default EnhancedAiGuidance;
