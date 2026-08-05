#!/usr/bin/env bash
set -euo pipefail

# End-to-end setup script for FitSignal backend on GCP.
# Usage:
#   PROJECT_ID=your-project-id ./setup_gcp.sh
# or with overrides:
#   PROJECT_ID=your-project-id REGION=us-central1 \
#     OPENAI_API_KEY=your-key ./setup_gcp.sh

PROJECT_ID=${PROJECT_ID:-}
REGION=${REGION:-us-central1}
DATASET=${DATASET:-fitsignal}
TABLE=${TABLE:-resume_scores}
SERVICE_NAME=${SERVICE_NAME:-fitsignal-backend}
OPENAI_API_KEY=${OPENAI_API_KEY:-}
SECRET_NAME=${SECRET_NAME:-}


command -v gcloud >/dev/null 2>&1 || { echo 'gcloud is required but not installed'; exit 1; }
command -v bq >/dev/null 2>&1 || { echo 'bq is required but not installed'; exit 1; }
command -v npm >/dev/null 2>&1 || { echo 'npm is required but not installed'; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$SCRIPT_DIR"

echo "=== FitSignal GCP setup ==="
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Dataset: $DATASET"
echo "Table: $TABLE"

if [[ -n "${CLOUDSDK_CONFIG:-}" ]]; then
  echo "Using CLOUDSDK_CONFIG=${CLOUDSDK_CONFIG}"
fi

# Ensure the right project is configured

echo "Setting gcloud project to $PROJECT_ID"
gcloud config set project "$PROJECT_ID"

# Install backend dependencies
if [[ ! -d node_modules ]]; then
  echo "Installing npm dependencies..."
  npm install
else
  echo "npm dependencies already installed"
fi

# Create BigQuery dataset if missing
if bq show --project_id="$PROJECT_ID" "$PROJECT_ID:$DATASET" >/dev/null 2>&1; then
  echo "BigQuery dataset '$DATASET' already exists"
else
  echo "Creating BigQuery dataset '$DATASET'"
  bq --location=US mk --dataset "$PROJECT_ID:$DATASET"
fi

# Create BigQuery table if missing
if bq show --project_id="$PROJECT_ID" "$PROJECT_ID:$DATASET.$TABLE" >/dev/null 2>&1; then
  echo "BigQuery table '$DATASET.$TABLE' already exists"
else
  echo "Creating BigQuery table '$DATASET.$TABLE'"
  bq query --use_legacy_sql=false --project_id="$PROJECT_ID" <<SQL
CREATE TABLE \\`${PROJECT_ID}.${DATASET}.${TABLE}\\` (
  resume_id STRING NOT NULL,
  created_at TIMESTAMP NOT NULL,
  source_file_name STRING,
  target_role STRING,
  resume_text STRING,
  candidate_name STRING,
  status STRING,
  overall INT64,
  likelihood INT64,
  verdict STRING,
  verdict_note STRING,
  recommendation STRING,
  recommendation_note STRING,
  dims ARRAY<STRUCT<name STRING, score INT64, note STRING>>,
  criteria ARRAY<STRUCT<label STRING, ok BOOL>>,
  strengths ARRAY<STRING>,
  flags ARRAY<STRING>,
  recs ARRAY<STRING>,
  raw_response JSON,
  updated_at TIMESTAMP,
  notes STRING
)
SQL
fi

# Deploy to Cloud Run

echo "Deploying Cloud Run service $SERVICE_NAME"
if [[ -n "$SECRET_NAME" ]]; then
  if [[ "$SECRET_NAME" == *:* ]]; then
    gcloud run deploy "$SERVICE_NAME" \
      --source . \
      --region "$REGION" \
      --allow-unauthenticated \
      --set-secrets "OPENAI_API_KEY=$SECRET_NAME" \
      --set-env-vars BIGQUERY_PROJECT="$PROJECT_ID"
  else
    gcloud run deploy "$SERVICE_NAME" \
      --source . \
      --region "$REGION" \
      --allow-unauthenticated \
      --set-secrets "OPENAI_API_KEY=${SECRET_NAME}:latest" \
      --set-env-vars BIGQUERY_PROJECT="$PROJECT_ID"
  fi
else
  gcloud run deploy "$SERVICE_NAME" \
    --source . \
    --region "$REGION" \
    --allow-unauthenticated \
    --set-env-vars OPENAI_API_KEY="$OPENAI_API_KEY",BIGQUERY_PROJECT="$PROJECT_ID"
fi

echo "Deployment complete"
