import React from "react";
import { Link } from "react-router-dom";
import {
  HiArrowRight,
  HiOutlineChartBar,
  HiOutlineChartPie,
  HiOutlineCheckCircle,
  HiOutlineSparkles,
  HiOutlineUserGroup,
} from "react-icons/hi";
import Footer from "../components/Footer";

const FLOW_STEPS = [
  {
    title: "Validated Input Capture",
    detail: "Collect role, company, and employee profile data with quality checks.",
  },
  {
    title: "Risk Classification",
    detail: "Generate Low, Medium, or High risk with confidence score.",
  },
  {
    title: "Signal Explanation",
    detail: "Expose top drivers using plain-language pressure and protection narrative.",
  },
  {
    title: "Action Simulation",
    detail: "Run what-if scenarios and track stabilization actions.",
  },
  {
    title: "Accountable Review",
    detail: "Finalize with human reviewer notes before any operational action.",
  },
];

const PILLARS = [
  {
    title: "Explainable Risk Story",
    detail: "Clear reasoning for each score so users understand why risk moved.",
    icon: HiOutlineSparkles,
  },
  {
    title: "Market-Aware Interpretation",
    detail: "Layoff risk is interpreted with volatility and regime context.",
    icon: HiOutlineChartPie,
  },
  {
    title: "Human Review Controls",
    detail: "Predictions remain advisory until review checks are completed.",
    icon: HiOutlineUserGroup,
  },
];

const Home = () => (
  <div className="min-h-screen bg-[#f3f5f8] text-slate-900">
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,rgba(15,23,42,0.07)_1px,transparent_1px)] [background-size:132px_100%]" />

      <section className="relative mx-auto max-w-6xl px-6 pb-10 pt-24">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Employee Risk Intelligence</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
              StabiAI turns employee-risk signals into decision-ready clarity.
            </h1>
          </div>
          <div>
            <p className="max-w-md text-base leading-relaxed text-slate-600">
              Built for responsible workforce decisions using explainable predictions, market context, and accountable human governance.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/employee/predict"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Open Predictor
                <HiArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#platform"
                className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Explore Platform
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-3xl bg-[radial-gradient(circle_at_18%_15%,#f9e8bc_0%,transparent_45%),linear-gradient(135deg,#f6cd87_0%,#f5a98e_38%,#caa2d9_100%)] p-5 shadow-[0_20px_65px_rgba(2,6,23,0.2)] sm:p-7">
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-white/70 bg-white/70 px-3 py-1 font-medium text-slate-700">Employee Inputs</span>
              <span className="rounded-full border border-white/60 bg-white/55 px-3 py-1 font-medium text-slate-700">Layoff Risk Prediction</span>
              <span className="rounded-full border border-white/60 bg-white/55 px-3 py-1 font-medium text-slate-700">Market Volatility Signals</span>
              <span className="rounded-full border border-white/60 bg-white/55 px-3 py-1 font-medium text-slate-700">Responsible AI Guidance</span>
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white/90 p-4 shadow-sm">
              <p className="text-sm leading-relaxed text-slate-700">
                For this employee submission, StabiAI predicts <span className="font-semibold text-slate-900">medium layoff risk</span> with
                {" "}
                <span className="font-semibold text-indigo-700">92% confidence</span>. The system evaluates role, tenure, performance, and company context against live market signals to explain both pressure factors and protective factors.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">Risk Class: Medium</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">Confidence: 92%</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">Market Regime: Stable</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">Review Gate: Required</span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">Prediction Run</span>
                <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700">Company + Market Context</span>
                <span className="ml-auto text-[11px] text-slate-500">Powered by StabiAI Employee Risk Engine</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Why Teams Choose StabiAI</p>
          <p className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
            StabiAI connects model reasoning, market signals, and governance workflow in one continuous decision surface.
          </p>
        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-3">
          {PILLARS.map((item) => (
            <article key={item.title} className="border-l-2 border-slate-300 pl-4">
              <item.icon className="h-5 w-5 text-slate-700" />
              <h3 className="mt-3 text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="platform" className="relative mx-auto max-w-6xl px-6 pb-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Platform Flow</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">From input to accountable action</h2>
          </div>
          <Link
            to="/employee/predict"
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Launch Workspace
            <HiOutlineChartBar className="h-4 w-4" />
          </Link>
        </div>

        <div className="relative mt-10">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-300/80" />
          <ol className="space-y-7 pl-14">
            {FLOW_STEPS.map((step, index) => (
              <li key={step.title} className="relative">
                <span className="absolute -left-14 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-800">
                  {index + 1}
                </span>
                <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{step.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>

    <Footer />
  </div>
);

export default Home;
