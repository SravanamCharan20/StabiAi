# StabiAI Employee Risk - Public Release Plan

## 1) Release Principle
This product is an **advisory risk signal** for employees and HR partners. It must never be used as an automatic employment decision system.

## 2) Must-Have Release Gates

### A. Model Quality and Safety
- Define minimum quality bars by class:
  - Macro F1 >= 0.70
  - Recall (High risk) >= 0.75
  - False positive rate (High risk) <= agreed threshold
- Add calibration monitoring:
  - Reliability curve and expected calibration error per risk class
- Run fairness checks by key slices:
  - Department
  - Tenure buckets
  - Location
  - Salary buckets
- Add model card with:
  - Training data scope
  - Known limitations
  - Out-of-scope usage

### B. Responsible UX
- Keep a persistent notice:
  - "Advisory only, not a sole decision basis."
- Add "Why this score" in plain language (done).
- Add "What to do next" section with practical, non-punitive actions (done).
- Show reliability and fallback status for each prediction (done).
- Add confidence/risk interpretation tooltip for non-technical users.

### C. Human Review Workflow
- Require manual review before any HR action when:
  - Confidence < 0.60
  - Reliability gate != high
  - Fallback data used
- Store reviewer decision notes:
  - Inputs verified
  - Additional evidence considered
  - Final decision and reason

### D. Data and Privacy Controls
- Mask or hash direct identifiers before logs/storage.
- Add explicit retention policy:
  - Input payload retention window
  - Prediction history retention window
- Add role-based access control:
  - Employee self-view
  - Manager view
  - HR audit view
- Add consent and policy acceptance tracking on UI.

### E. Reliability and Operations
- Add endpoint health checks:
  - Prediction engine
  - Market data providers
  - Gemini suggestions provider
- Add alerting for:
  - Gemini fallback rate spike
  - Market feed fallback rate spike
  - Prediction latency regression
- Log structured metrics per request:
  - Risk class
  - Confidence
  - Reliability score
  - Data source mode (live/fallback)

## 3) Final Pre-Launch Test Matrix
- Functional:
  - Low/Medium/High scenarios return stable outputs
  - Suggestions endpoint works with Gemini and RAG fallback
- Stress:
  - 200+ concurrent requests without failure spikes
- Failure-mode:
  - Market API failure -> graceful fallback
  - Gemini malformed output -> graceful fallback
- UX validation:
  - 10+ employee users can explain score logic in their own words

## 4) Rollout Strategy
- Phase 1 (Internal beta): 5-10% traffic, advisory only.
- Phase 2 (Controlled): 25-40% traffic, monitor fairness and calibration weekly.
- Phase 3 (Public): full rollout only after 2 consecutive stable evaluation cycles.

## 5) Non-Negotiable Policy
- Do not use this system for final termination decisions.
- Require documented human evidence before any action.
- Audit every high-risk case with reviewer traceability.
