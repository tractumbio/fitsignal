import express from 'express';
import cors from 'cors';
import { BigQuery } from '@google-cloud/bigquery';
import { randomUUID } from 'crypto';

import { loadEnv, validateProviderKey } from './lib/env.js';
import { loadRubric } from './lib/rubric.js';
import { buildPrompt, buildResponseSchema, detectInjection } from './lib/prompt.js';
import { callModel, resolveProvider } from './lib/provider.js';
import { assess } from './lib/score.js';

// Load deploy/.env before anything reads process.env.
const env = loadEnv();
if (env.loaded) console.log(`Loaded ${env.keys.length} variable(s) from ${env.path}`);

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const BIGQUERY_PROJECT = process.env.BIGQUERY_PROJECT;
const BIGQUERY_DATASET = process.env.BIGQUERY_DATASET || 'fitsignal';
const BIGQUERY_TABLE = process.env.BIGQUERY_TABLE || 'resume_scores';
const MAX_RESUME_CHARS = Number(process.env.MAX_RESUME_CHARS || 200000);

const bigquery = new BigQuery(BIGQUERY_PROJECT ? { projectId: BIGQUERY_PROJECT } : {});

// Fail fast: a malformed rubric must not start a server that emits bad scores.
const rubric = await loadRubric();
console.log(`FitSignal rubric v${rubric.version} loaded (${rubric.rules.length} rules, checked ${rubric.checked_on})`);

// Report credential state at boot rather than failing on the first request.
try {
  const provider = resolveProvider();
  const check = validateProviderKey(provider);
  console.log(`Provider: ${provider} — ${check.message}`);
  if (!check.ok) console.warn('WARNING: /api/analyze will fail until this is fixed.');
} catch (e) {
  console.warn(`WARNING: ${e.message}`);
}

function formatBigQueryRow({ resumeId, fileName, targetRole, resumeText, result, rawResponse }) {
  return {
    resume_id: resumeId,
    created_at: new Date().toISOString(),
    source_file_name: fileName || 'pasted-text.txt',
    target_role: targetRole,
    resume_text: resumeText,
    candidate_name: result.candidate,
    status: 'COMPLETED',
    overall: result.overall,
    likelihood: result.likelihood,
    verdict: result.verdict,
    verdict_note: result.verdictNote,
    recommendation: result.recommendation,
    recommendation_note: result.recommendationNote,
    dims: result.dims.map((dim) => ({ name: dim.name, score: dim.score, note: dim.note })),
    criteria: result.criteria.map((item) => ({ label: item.label, ok: item.ok })),
    strengths: result.strengths,
    flags: result.flags,
    recs: result.recs,
    // Per-rule findings ride along inside raw_response so no DDL change is
    // required. To query them directly, add a dedicated column:
    //   ALTER TABLE `<dataset>.resume_scores` ADD COLUMN findings JSON;
    raw_response: {
      provider: rawResponse,
      assessment: { findings: result.findings, warnings: result.warnings, meta: result.meta },
    },
    updated_at: new Date().toISOString(),
  };
}

async function saveAnalysisToBigQuery(row) {
  if (!BIGQUERY_PROJECT && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('BigQuery client is not configured. Set BIGQUERY_PROJECT or GOOGLE_APPLICATION_CREDENTIALS.');
  }
  await bigquery.dataset(BIGQUERY_DATASET).table(BIGQUERY_TABLE).insert([row], { raw: true });
}

app.post('/api/analyze', async (req, res) => {
  try {
    const { resumeText, fileName, targetRole, inputMode, region, route, practice } = req.body || {};

    if (!resumeText || !String(resumeText).trim()) {
      return res.status(400).json({ error: 'resumeText is required' });
    }
    if (String(resumeText).length > MAX_RESUME_CHARS) {
      return res.status(413).json({ error: `resumeText exceeds ${MAX_RESUME_CHARS} characters` });
    }

    const role = targetRole || 'Accenture Consulting Analyst';
    // Plain text carries no layout, so layout-dependent rules resolve to
    // `unknown` rather than being guessed at.
    const mode = inputMode || 'text';

    const keyCheck = validateProviderKey(resolveProvider());
    if (!keyCheck.ok) return res.status(500).json({ error: keyCheck.message });

    const { system, user } = buildPrompt({
      rubric, resumeText, targetRole: role, inputMode: mode,
      context: { region, route, practice },
    });
    const { modelOutput, rawResponse, provider } = await callModel({
      system,
      user,
      schema: buildResponseSchema(rubric),
    });
    const result = assess({ rubric, modelOutput, resumeText, inputMode: mode });
    result.meta.provider = provider;

    const injection = detectInjection(resumeText);
    if (injection.length) {
      result.warnings.push(`resume text contains ${injection.length} instruction-like pattern(s) — review manually`);
      result.meta.injection_suspected = true;
    }

    const resumeId = randomUUID();
    try {
      await saveAnalysisToBigQuery(formatBigQueryRow({ resumeId, fileName, targetRole: role, resumeText, result, rawResponse }));
    } catch (bigQueryError) {
      console.warn('Failed to save analysis to BigQuery:', bigQueryError.message || bigQueryError);
    }

    res.json({ resume_id: resumeId, ...result });
  } catch (e) {
    console.error('analyze failed:', e);
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.get('/health', (_req, res) => {
  let provider;
  try {
    provider = resolveProvider();
  } catch (e) {
    provider = `unconfigured (${e.message})`;
  }
  res.json({
    status: 'ok',
    provider,
    rubric_version: rubric.version,
    rubric_checked_on: rubric.checked_on,
    rules: rubric.rules.length,
  });
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log('FitSignal backend listening on', port));
