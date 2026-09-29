# Production Dockerfile for RUIP FastAPI Backend
# Compatible with Google Cloud Run, Render, AWS ECS, Fly.io, etc.
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY . .

# Default port (Cloud Run sets $PORT dynamically, default 8080 or 8000)
ENV PORT=8000
EXPOSE 8000

# Start command accepting $PORT environment variable
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
