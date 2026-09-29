# RUIP Python Analytics Backend — MIT-WPU

Accounts & Finance Directorate service modules for the Rural Immersion Programme (RUIP).

## Structure
- `analytics.py`: Financial aggregation, category/payment/faculty breakdown, budget burn rate forecast, and expense policy validation.
- `pdf_generator.py`: Generates official reconciliation and settlement statement reports with signatures.
- `cli.py`: Interactive command-line utility for local analysis and report generation.
- `main.py`: FastAPI server providing REST endpoints for summary, breakdowns, forecast, compliance, and statement export.
- `requirements.txt`: Python dependencies (`fastapi`, `uvicorn`, `pydantic`).

## CLI Usage
Run summary and forecast on sample immersion expenses:
```bash
python3 -m python_backend.cli
```

Generate official text settlement report:
```bash
python3 -m python_backend.cli --statement
```

## Running the API Server
```bash
uvicorn python_backend.main:app --reload --port 8000
```
