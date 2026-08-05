import { RESUME_OPEN, RESUME_CLOSE } from './prompt.js';

/**
 * Offline provider — no API key, no network, no cost.
 *
 * It fabricates a plausible model response so the rest of the pipeline (prompt
 * assembly, evidence verification, weighted aggregation, hard stops, dimension
 * and criteria rollup) can be exercised end to end. It does NOT score anything:
 * the numbers are a function of the rule id, not of the resume's quality.
 *
 * Deliberately includes one fabricated evidence span so the anti-hallucination
 * guard is visible in a demo run rather than only in the test suite.
 */

const FABRICATED_SPAN = 'Reduced customer churn by 38% across the EMEA portfolio';

function resumeLines(user) {
  const start = user.indexOf(RESUME_OPEN);
  const end = user.indexOf(RESUME_CLOSE);
  const body = start === -1 || end === -1 ? user : user.slice(start + RESUME_OPEN.length, end);
  return body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length >= 15);
}

/** Stable per-rule pseudo-score so repeat runs are identical. */
function pseudoScore(id) {
  const n = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return [1, 2, 2, 3][n % 4];
}

export async function callModel({ user, schema }) {
  const lines = resumeLines(user);
  const ids = schema?.properties?.findings?.items?.properties?.id?.enum ?? [];

  const findings = ids.map((id, index) => {
    const score = pseudoScore(id);
    // One rule cites a span that isn't in the resume, to demonstrate the guard.
    const evidence = id === 'R05'
      ? [FABRICATED_SPAN]
      : [lines[index % Math.max(lines.length, 1)] ?? 'insufficient sample text'];

    return {
      id,
      applicable: true,
      score,
      evidence,
      note: `MOCK — deterministic placeholder score for ${id}.`,
    };
  });

  return {
    modelOutput: {
      candidate: lines[0] || 'Candidate',
      summary: 'MOCK RUN — scores are placeholders, not an assessment of this resume.',
      findings,
      strengths: ['Mock strength — run with a real API key for genuine findings.'],
      flags: ['Mock flag — this run did not call a model.'],
      recs: ['Set ANTHROPIC_API_KEY or OPENAI_API_KEY for a real assessment.'],
    },
    rawResponse: { provider: 'mock', note: 'no model was called' },
  };
}
