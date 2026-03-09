import React from "react";
import EnhancedAiGuidance from "../../../../components/EnhancedAiGuidance";
import SimplifiedResults from "../../../../components/SimplifiedResults";
import { WORKSPACE_TABS } from "../constants";
import { SegmentTabs, WorkspacePanelFrame } from "./core";
import { ResultPanel } from "./result";
import { ModelQualityPanel, WhatIfSimulator } from "./workspace";

export const PredictionWorkspace = ({
  predictionData,
  viewMode,
  onViewModeChange,
  inputQuality,
  resumeIntelligence,
  workspaceTab,
  onWorkspaceTabChange,
  whatIfForm,
  setWhatIfForm,
  onRunWhatIf,
  onApplyScenarioToForm,
  whatIfLoading,
  whatIfResult,
  employeeDataForSuggestions,
  evalReport,
  evalLoading,
  evalError,
  onLoadModelEval,
  onExportPdf,
}) => (
  <section className="space-y-6">
    {!predictionData ? (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-blue/70 p-8 text-center">
        <p className="text-sm text-slate-500">
          Complete the three-step flow to get calibrated risk, reliability diagnostics, and targeted actions.
        </p>
      </div>
    ) : (
      <>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Results View</p>
              <p className="mt-1 text-xs text-slate-600">
                Choose how you want to see your analysis
              </p>
            </div>
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
              <button
                onClick={() => onViewModeChange("simple")}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  viewMode === "simple"
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-white"
                }`}
              >
                Simple View
              </button>
              <button
                onClick={() => onViewModeChange("advanced")}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  viewMode === "advanced"
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-white"
                }`}
              >
                Advanced View
              </button>
            </div>
          </div>
        </div>

        {viewMode === "simple" ? (
          <SimplifiedResults
            predictionData={predictionData}
            resumeIntelligence={resumeIntelligence}
          />
        ) : (
          <ResultPanel predictionData={predictionData} inputQuality={inputQuality} />
        )}

        <section className="rounded-3xl border border-slate-300 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Operator Console</p>
              <p className="font-display mt-1 text-sm font-semibold text-slate-900">Decision Workspace</p>
              <p className="mt-1 text-xs text-slate-500">
                One compact control center for simulation, AI guidance, and model quality checks.
              </p>
            </div>
            <button
              type="button"
              onClick={onExportPdf}
              className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Export PDF
            </button>
          </div>
          <div className="mt-3">
            <SegmentTabs tabs={WORKSPACE_TABS} active={workspaceTab} onChange={onWorkspaceTabChange} />
          </div>
        </section>

        {workspaceTab === "simulator" ? (
          <WorkspacePanelFrame tabId="simulator">
            <WhatIfSimulator
              whatIfForm={whatIfForm}
              setWhatIfForm={setWhatIfForm}
              onRun={onRunWhatIf}
              onApplyToInput={onApplyScenarioToForm}
              loading={whatIfLoading}
              result={whatIfResult}
              baselineRisk={predictionData?.prediction?.layoff_risk}
            />
          </WorkspacePanelFrame>
        ) : null}

        {workspaceTab === "guidance" ? (
          <WorkspacePanelFrame tabId="guidance">
            <EnhancedAiGuidance
              employeeData={employeeDataForSuggestions}
              predictionData={predictionData}
              resumeIntelligence={resumeIntelligence}
            />
          </WorkspacePanelFrame>
        ) : null}

        {workspaceTab === "quality" ? (
          <WorkspacePanelFrame tabId="quality">
            <ModelQualityPanel
              report={evalReport}
              loading={evalLoading}
              error={evalError}
              onLoad={onLoadModelEval}
            />
          </WorkspacePanelFrame>
        ) : null}
      </>
    )}
  </section>
);
