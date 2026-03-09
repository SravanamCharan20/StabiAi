import React from "react";
import { HiOutlineDocumentText, HiUpload } from "react-icons/hi";

export const ResumeIntakeCard = ({
  onFileChange,
  onParse,
  parsing,
  fileName,
  insights,
  missingFields,
  trendGuidance,
  message,
}) => (
  <section className="rounded-2xl border border-cyan-200 bg-cyan-50/35 p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-800">Resume Intake</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">Upload Resume for Auto-Prefill</p>
        <p className="mt-1 text-xs text-slate-600">
          Extracts role, stack, location, experience, certifications, and skills to pre-fill risk inputs.
        </p>
      </div>
      <span className="rounded-full border border-cyan-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-cyan-800">
        PDF / DOCX / TXT
      </span>
    </div>

    <div className="mt-3 flex flex-wrap items-center gap-2">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-cyan-300 bg-white px-3 py-2 text-xs font-semibold text-cyan-900 hover:border-cyan-400">
        <HiUpload className="h-4 w-4" />
        Choose Resume
        <input
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={onFileChange}
          className="hidden"
        />
      </label>
      <button
        type="button"
        onClick={onParse}
        disabled={parsing}
        className="rounded-lg bg-cyan-700 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-cyan-400"
      >
        {parsing ? "Extracting..." : "Extract Profile from Resume"}
      </button>
      {fileName ? <p className="text-xs text-slate-600">Selected: {fileName}</p> : null}
    </div>

    {message ? (
      <p className="mt-2 rounded-lg border border-cyan-200 bg-white px-2.5 py-2 text-xs text-cyan-900">{message}</p>
    ) : null}

    {insights ? (
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-cyan-100 bg-white p-3">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <HiOutlineDocumentText className="h-4 w-4 text-cyan-700" />
            Resume Signals
          </p>
          <p className="mt-2 text-xs text-slate-700">
            Candidate: {insights.candidate_name || "N/A"} | Experience: {insights.years_of_experience != null ? `${insights.years_of_experience} years` : "N/A"}
          </p>
          <p className="mt-1 text-xs text-slate-700">
            AI Readiness: {Number(insights.ai_readiness_score || 0).toFixed(0)} / 100
          </p>
          <p className="mt-1 text-xs text-slate-700">
            Parse Confidence: {(Number(insights.parse_confidence || 0) * 100).toFixed(0)}%
          </p>
          {Array.isArray(insights.skills) && insights.skills.length ? (
            <p className="mt-2 text-xs text-slate-700">Skills: {insights.skills.slice(0, 8).join(", ")}</p>
          ) : null}
          {Array.isArray(insights.certifications) && insights.certifications.length ? (
            <p className="mt-1 text-xs text-slate-700">Certifications: {insights.certifications.slice(0, 6).join(", ")}</p>
          ) : null}
        </div>

        <div className="rounded-xl border border-cyan-100 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Completeness</p>
          {Array.isArray(missingFields) && missingFields.length ? (
            <p className="mt-2 text-xs text-amber-800">
              Missing required fields: {missingFields.join(", ")}.
              {" "}
              Fill these before running prediction.
            </p>
          ) : (
            <p className="mt-2 text-xs text-emerald-800">All required fields were detected from resume.</p>
          )}
          {trendGuidance?.summary ? <p className="mt-2 text-xs text-slate-700">{trendGuidance.summary}</p> : null}
        </div>
      </div>
    ) : null}
  </section>
);
