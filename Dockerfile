# ── STAGE 1: Build Frontend ───────────────────────────────────────────
FROM node:20-slim AS build-stage
# DOCKER_BUILD_ID: 769
# REBUILD: 2026-04-07T19:00:00Z — GOLDEN RECOVERY (PARSER POLISH)
ENV BUILD_ID=769

WORKDIR /app/client
COPY client/package*.json ./
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-maxtimeout 600000 && \
    npm ci --prefer-offline --no-audit || npm install --prefer-offline --no-audit
COPY client/ .
RUN npm run build

# ── STAGE 2: Core Server Runtime ──────────────────────────────────────
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies (Tesseract for OCR)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libtesseract-dev \
    gcc \
    python3-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install backend dependencies
COPY server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy server code
COPY server/ .

# Copy built frontend from build-stage to the location server expects
COPY --from=build-stage /app/client/dist ./dist

# Set permissions for the non-root user (Hugging Face uses UID 1000)
RUN chown -R 1000:1000 /app

# Switch to non-root user
USER 1000

# Hugging Face Spaces expects the app on port 7860
EXPOSE 7860

# Run the app
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "7860"]
