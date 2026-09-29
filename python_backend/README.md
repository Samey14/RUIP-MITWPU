# RUIP Python Analytics Backend — MIT-WPU

Accounts & Finance Directorate backend service for the Rural Immersion Programme (RUIP) at Dr. Vishwanath Karad MIT World Peace University, Pune.

## Architecture & Responsibilities

- **React + Vite Frontend (`/`)**: Faculty expense tracking, offline cache, UI dashboards, and Firebase Firestore authentication & data storage.
- **Python FastAPI Backend (`/python_backend`)**: Financial reconciliation, budget burn-rate forecasting, policy compliance audits, and official PDF settlement register generation.

## Directory Files
- `main.py`: Production FastAPI server with endpoints for summary, breakdowns, forecast, compliance, and PDF export.
- `analytics.py`: Financial aggregation, budget burn rate forecast, and MIT-WPU expense policy rules.
- `pdf_generator.py`: Generates official reconciliation and settlement statement PDF documents using ReportLab.
- `cli.py`: Auditor command-line utility for local analysis.
- `requirements.txt`: Python package requirements (`fastapi`, `uvicorn`, `pydantic`, `reportlab`).
- `Dockerfile`: Production container definition for Google Cloud Run / Render / AWS.
- `render.yaml`: Blueprint definition for Render deployment.
- `Procfile`: Process specification for platforms using Procfile.

## Endpoints

- `GET /api/health` — Service health check (returns `{"status": "ok", "service": "RUIP FastAPI"}`)
- `POST /api/analytics/summary` — Full financial calculations and category breakdowns
- `POST /api/analytics/breakdowns` — Category, payment method, faculty, and date breakdowns
- `POST /api/analytics/forecast` — Burn-rate calculation and expected surplus/deficit
- `POST /api/analytics/compliance` — Automated audit checks (cash limits, high value, missing vouchers)
- `POST /api/export/settlement-statement` — Binary PDF generation (`Content-Type: application/pdf`)

## Production Deployment

### 1. Build & Start Commands
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 2. Environment Variables
- `PORT`: Automatically set by Cloud Run / Render (e.g., `8080` or `10000`). Fallback is `8000`.
- `CORS_ORIGINS`: Comma-separated list of allowed origins.
  Example:
  ```
  CORS_ORIGINS=https://ruip-mitwpu.ai.studio,https://ais-pre-yfk3pkjk7f5rlecsjnqos2-888862711712.asia-southeast1.run.app
  ```

### 3. Deploying to Google Cloud Run (Recommended)
1. Push `python_backend/` to GitHub or deploy via Google Cloud CLI:
   ```bash
   gcloud run deploy ruip-fastapi-backend \
     --source ./python_backend \
     --region asia-south1 \
     --allow-unauthenticated \
     --set-env-vars CORS_ORIGINS="https://ruip-mitwpu.ai.studio"
   ```
2. Copy the resulting Service URL (e.g. `https://ruip-fastapi-backend-xyz.a.run.app`).
3. Set `VITE_RUIP_API_URL=https://ruip-fastapi-backend-xyz.a.run.app` in the React frontend environment.

### 4. Deploying to Render
1. Create a **New Web Service** connected to your GitHub repository.
2. Root Directory: `python_backend`
3. Environment: `Python 3`
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Under Environment Variables, add:
   - `CORS_ORIGINS`: `https://ruip-mitwpu.ai.studio`
7. Copy the public Render URL (`https://ruip-fastapi-backend.onrender.com`).
8. Set `VITE_RUIP_API_URL=https://ruip-fastapi-backend.onrender.com` in the React frontend.
