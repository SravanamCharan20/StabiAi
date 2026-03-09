import React from "react";
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
import { FORM_INPUT_CLASS, INPUT_QUALITY_TONE, SALARY_BOUNDS } from "../constants";
import { Field, SelectControl } from "./core";
import { ResumeIntakeCard } from "./resume";

export const InputPanel = ({
  formData,
  options,
  fieldErrors,
  inputQuality,
  error,
  loading,
  salaryUnit,
  annualSalaryInr,
  resumeFileName,
  resumeParsing,
  resumeInsights,
  resumeMissingFields,
  resumeTrendGuidance,
  resumeMessage,
  onChange,
  onSalaryUnitChange,
  onSubmit,
  onResumeFileChange,
  onResumeParse,
}) => (
  <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <h2 className="font-display text-lg font-semibold text-slate-900">Prediction Input Flow</h2>
    <p className="mt-1 text-sm text-slate-500">
      Step-by-step profile capture designed for cleaner and more accurate model input.
    </p>

    <div className="mt-4">
      <ResumeIntakeCard
        onFileChange={onResumeFileChange}
        onParse={onResumeParse}
        parsing={resumeParsing}
        fileName={resumeFileName}
        insights={resumeInsights}
        missingFields={resumeMissingFields}
        trendGuidance={resumeTrendGuidance}
        message={resumeMessage}
      />
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

    <form onSubmit={onSubmit} className="mt-5 space-y-5">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 1: Company Context</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            icon={HiOutlineOfficeBuilding}
            label="Company"
            name="company_name"
            value={formData.company_name}
            onChange={onChange}
            options={options.companies}
            error={fieldErrors.company_name}
          />
          <Field
            icon={HiOutlineLocationMarker}
            label="Location"
            name="company_location"
            value={formData.company_location}
            onChange={onChange}
            options={options.locations}
            error={fieldErrors.company_location}
          />
          <div className="sm:col-span-2">
            <Field
              icon={HiOutlineCalendar}
              label="Reporting Quarter"
              name="reporting_quarter"
              value={formData.reporting_quarter}
              onChange={onChange}
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
            onChange={onChange}
            options={options.jobs}
            error={fieldErrors.job_title}
          />
          <Field
            icon={HiOutlineBriefcase}
            label="Primary Tech Stack"
            name="tech_stack"
            value={formData.tech_stack}
            onChange={onChange}
            options={options.techStacks}
            error={fieldErrors.tech_stack}
          />
          <label className="space-y-2 sm:col-span-2">
            <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <HiOutlineBriefcase className="h-4 w-4 text-slate-500" />
              Mixed Stack Profile (Optional)
            </span>
            <textarea
              name="stack_profile"
              value={formData.stack_profile}
              onChange={onChange}
              rows={2}
              placeholder="Example: MERN + DevOps + ML (Python), Kubernetes, Terraform"
              className={`${FORM_INPUT_CLASS} min-h-[74px] resize-y border-slate-200 focus:border-slate-400 focus:ring-slate-200`}
            />
            <p className="text-xs text-slate-500">
              Free-form stack details are auto-mapped to the closest model-supported stack.
            </p>
          </label>
          <label className="space-y-2 sm:col-span-2">
            <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <HiOutlineChartBar className="h-4 w-4 text-slate-500" />
              Skill Tags (Optional)
            </span>
            <input
              name="skill_tags"
              value={formData.skill_tags}
              onChange={onChange}
              placeholder="Comma-separated: Python, MLOps, AWS, React, Microservices"
              className={`${FORM_INPUT_CLASS} border-slate-200 focus:border-slate-400 focus:ring-slate-200`}
            />
            <p className="text-xs text-slate-500">
              Use comma-separated skills if your stack is broader than dropdown options.
            </p>
          </label>
          <Field
            icon={HiOutlineUserGroup}
            label="Department"
            name="department"
            value={formData.department}
            onChange={onChange}
            options={options.departments}
            error={fieldErrors.department}
          />
          <div className="sm:col-span-2">
            <Field
              icon={HiOutlineHome}
              label="Remote Work"
              name="remote_work"
              value={formData.remote_work}
              onChange={onChange}
              options={options.remote}
              error={fieldErrors.remote_work}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 3: Employee Profile</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 sm:col-span-2">
            <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <HiOutlineChartBar className="h-4 w-4 text-slate-500" />
              Certifications (Optional)
            </span>
            <input
              name="certifications"
              value={formData.certifications}
              onChange={onChange}
              placeholder="Comma-separated: AWS Certified Developer, CKA, Databricks Associate"
              className={`${FORM_INPUT_CLASS} border-slate-200 focus:border-slate-400 focus:ring-slate-200`}
            />
            <p className="text-xs text-slate-500">
              Certifications directly influence AI guidance and certification-gap recommendations.
            </p>
          </label>

          <Field
            icon={HiOutlineClock}
            label="Years At Company"
            name="years_at_company"
            value={formData.years_at_company}
            onChange={onChange}
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
                onChange={onSalaryUnitChange}
                className="w-32 border-slate-200 focus:border-slate-400 focus:ring-slate-200"
              >
                <option value="LPA">LPA</option>
                <option value="INR">Annual INR</option>
              </SelectControl>
              <input
                name="salary_range"
                type="number"
                value={formData.salary_range}
                onChange={onChange}
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
            onChange={onChange}
            type="number"
            min={String(options.perfMin)}
            max={String(options.perfMax)}
            step={String(options.perfStep)}
            error={fieldErrors.performance_rating}
          />
        </div>
      </div>

      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

      <div className="space-y-2">
        <div
          className={`flex items-center justify-between rounded-full border px-3 py-2 text-xs font-semibold ${INPUT_QUALITY_TONE[inputQuality.level]}`}
        >
          <span>Input Quality</span>
          <span>{inputQuality.score}/100 • {inputQuality.level.toUpperCase()}</span>
        </div>
        {inputQuality.warnings.length ? (
          <details className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-amber-900">
              Improve Input Quality
            </summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-900">
              {inputQuality.warnings.map((warning, index) => (
                <li key={`${warning}-${index}`}>{warning}</li>
              ))}
            </ul>
          </details>
        ) : (
          <p className="text-xs text-slate-500">Inputs look consistent with model expectations.</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {loading ? "Running Prediction..." : "Analyze Layoff Risk"}
      </button>
    </form>
  </section>
);
