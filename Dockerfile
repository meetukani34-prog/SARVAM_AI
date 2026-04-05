# ── STAGE 1: Build Frontend ───────────────────────────────────────────
FROM node:20-slim AS build-stage
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
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

# Hugging Face Spaces expects the app on port 7860
EXPOSE 7860

# Run the app
# Use 0.0.0.0 because it's in a container
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "7860"]
