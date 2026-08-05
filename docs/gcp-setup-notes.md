cd /Users/adriancioanca/gcp-projects/resume_analyser/design_handoff_fitsignal/deploy

# install backend deps
npm install
# if npm fails for @google-cloud/bigquery, use a valid version:
# npm install @google-cloud/bigquery@latest

# authenticate and set the project
gcloud auth login
gcloud config set project primordial-mile-502615-m2

# create the BigQuery dataset
bq --location=US mk --dataset primordial-mile-502615-m2:fitsignal

# create the BigQuery table using SQL DDL
bq query --use_legacy_sql=false --project_id=primordial-mile-502615-m2 \
'CREATE TABLE `primordial-mile-502615-m2.fitsignal.resume_scores` (
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
)'

# deploy the backend to Cloud Run
gcloud run deploy fitsignal-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars OPENAI_API_KEY=YOUR_OPENAI_KEY,BIGQUERY_PROJECT=primordial-mile-502615-m2

  gcloud auth list
gcloud config get-value project


gcloud auth login
gcloud config set account adrian@tractumbio.com


gcloud builds log REAL_BUILD_ID --project primordial-mile-502615-m2


