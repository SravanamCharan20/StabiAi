# Employee Layoff Pipeline

This folder contains scripts to improve employee layoff prediction quality with a stronger synthetic dataset and local model artifacts.

## 1) Generate enhanced synthetic dataset

```bash
python3 backend/ml/generate_enhanced_dataset.py \
  --rows 12000 \
  --seed 42 \
  --output backend/data/enhanced_synthetic_employee_data.csv
```

## 2) Train JSON artifacts for backend inference

```bash
python3 backend/ml/train_risk_engine_artifacts.py \
  --input backend/data/enhanced_synthetic_employee_data.csv \
  --output backend/data/employee_risk_artifacts.json
```

The backend endpoint `POST /api/employee/predict` reads `backend/data/employee_risk_artifacts.json`.

## 3) Optional: train from your existing CSV

If you want to train on your current dataset directly:

```bash
python3 backend/ml/train_risk_engine_artifacts.py \
  --input /Users/charan/Downloads/cleaned_synthetic_employee_data_12000.csv \
  --output backend/data/employee_risk_artifacts.json
```

## Output files

- `backend/data/enhanced_synthetic_employee_data.csv`
- `backend/data/employee_risk_artifacts.json`
- `backend/data/employee_rag_knowledge.json` (retrieval knowledge base)

## Evaluation and calibration

Run evaluation locally:

```bash
cd backend
npm run eval:employee-model
```

API endpoint:

```bash
GET /api/employee/eval
GET /api/employee/eval?sample_size=3000
GET /api/employee/eval?force=true
```

The response includes:
- confusion matrix
- precision/recall/F1 per class
- overall metrics (accuracy, balanced accuracy, macro F1, weighted F1)
- probability calibration report (ECE, MCE, reliability bins)
- high-confidence error examples

## Live market enrichment

Employee prediction now uses live external market stats (company/index movement and volatility proxies).

- Primary source: Yahoo chart API
- Fallback source: NSE live API via `backend/ml/fetch_live_nse_market.py`

Make sure `python3` is available in runtime for the NSE fallback path.
