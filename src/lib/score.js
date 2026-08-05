/**
 * Deterministic scoring.
 *
 * The model supplies per-rule ordinals and evidence. Everything a consumer
 * actually sees — overall, likelihood, the 4 dimensions, the 6 checklist
 * booleans, the verdict and the recommendation — is computed here from the
 * weights in rules/rubric.yaml. Same findings in, same numbers out, every time.
 */

/** Whitespace-insensitive, case-insensitive comparison for verbatim checking. */
function normalise(text) {
  return String(text || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Verifies each cited span actually occurs in the resume. Spans that do not
 * are dropped as hallucinated. This is the cheapest strong guard available:
 * a claim that quotes text which isn't there is not evidence.
 */
function verifyEvidence(spans, haystack) {
  const verified = [];
  const rejected = [];
  for (const span of Array.isArray(spans) ? spans : []) {
    const needle = normalise(span);
    if (needle.length < 10) {
      rejected.push({ span, reason: 'too short to verify' });
    } else if (haystack.includes(needle)) {
      verified.push(String(span));
    } else {
      rejected.push({ span, reason: 'not found verbatim in resume' });
    }
  }
  return { verified, rejected };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function weightedMean(entries) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) return null;
  return entries.reduce((sum, entry) => sum + entry.weight * entry.points, 0) / total;
}

/**
 * @returns a result object that is a superset of the original API shape, so
 *          the existing frontend and BigQuery table keep working unchanged.
 */
export function assess({ rubric, modelOutput, resumeText, inputMode = 'text' }) {
  const warnings = [];
  const haystack = normalise(resumeText);
  const cfg = rubric.scoring;
  const pointsFor = (score) => cfg.points[score] ?? cfg.points[String(score)];

  const submitted = new Map(
    (Array.isArray(modelOutput.findings) ? modelOutput.findings : [])
      .filter((finding) => finding && finding.id)
      .map((finding) => [String(finding.id), finding]),
  );

  for (const id of submitted.keys()) {
    if (!rubric.byId.has(id)) warnings.push(`model returned unknown rule id "${id}" (ignored)`);
  }

  const findings = [];

  for (const rule of rubric.rules) {
    if (rule.weight <= 0) continue;

    const raw = submitted.get(rule.id);
    const base = {
      id: rule.id,
      name: rule.name,
      weight: rule.weight,
      provenance_tier: rule.provenance?.tier ?? 'unspecified',
      evidence: [],
      rejected_evidence: [],
      note: raw?.note ? String(raw.note) : '',
    };

    if (!raw) {
      warnings.push(`${rule.id}: no finding returned by model — excluded from scoring`);
      findings.push({ ...base, state: 'unknown', score: null, points: null, reason: 'missing from model output' });
      continue;
    }

    if (!rule.observable_in.includes(inputMode)) {
      findings.push({
        ...base,
        state: 'unknown',
        score: null,
        points: null,
        reason: `not observable in input mode "${inputMode}" (needs ${rule.observable_in.join(' or ')})`,
      });
      if (raw.score !== null && raw.score !== undefined) {
        warnings.push(`${rule.id}: model scored an unobservable rule — discarded (layout cannot be inferred from plain text)`);
      }
      continue;
    }

    if (rule.conditional && raw.applicable === false) {
      findings.push({ ...base, state: 'not_applicable', score: null, points: null, reason: 'condition not met' });
      continue;
    }

    const score = Number(raw.score);
    if (!Number.isInteger(score) || score < 0 || score > 3) {
      warnings.push(`${rule.id}: invalid score ${JSON.stringify(raw.score)} — excluded from scoring`);
      findings.push({ ...base, state: 'unknown', score: null, points: null, reason: 'invalid score' });
      continue;
    }

    const { verified, rejected } = verifyEvidence(raw.evidence, haystack);
    if (rejected.length) {
      warnings.push(`${rule.id}: ${rejected.length} evidence span(s) not found verbatim in the resume — discarded`);
    }

    const needsEvidence = cfg.evidence_policy?.require_verbatim_spans !== false;
    const demoteAt = cfg.evidence_policy?.demote_unverified_at_or_above;
    if (needsEvidence && !verified.length && Number.isInteger(demoteAt) && score >= demoteAt) {
      warnings.push(`${rule.id}: claimed score ${score} with no verifiable evidence — demoted to unknown`);
      findings.push({
        ...base,
        state: 'unknown',
        score: null,
        points: null,
        rejected_evidence: rejected,
        reason: `unsupported claim of score ${score}`,
      });
      continue;
    }

    findings.push({
      ...base,
      state: 'scored',
      score,
      points: pointsFor(score),
      evidence: verified,
      rejected_evidence: rejected,
    });
  }

  const byId = new Map(findings.map((finding) => [finding.id, finding]));
  const scored = findings.filter((finding) => finding.state === 'scored');

  if (!scored.length) {
    throw new Error('no rule could be scored from the model output — refusing to emit a score');
  }

  // --- overall -------------------------------------------------------------
  // Renormalised over scored rules only, so unobservable and not-applicable
  // rules neither help nor hurt.
  let overall = weightedMean(scored.map((f) => ({ weight: f.weight, points: f.points })));

  const hardStops = [];
  for (const rule of rubric.rules) {
    const stop = rule.hard_stop;
    const finding = byId.get(rule.id);
    if (!stop || !finding || finding.state !== 'scored') continue;
    if (finding.score <= stop.at_or_below) {
      hardStops.push({ id: rule.id, name: rule.name, cap: stop.cap_overall });
      overall = Math.min(overall, stop.cap_overall);
    }
  }

  overall = Math.round(clamp(overall, 0, 100));

  // --- likelihood ----------------------------------------------------------
  // v1 emitted a point percentage. There is no ground truth for it and the only
  // base rates available are coaching-site estimates, so a point value implied
  // precision that does not exist. Default is now a band.
  const likelihoodCfg = cfg.likelihood || {};
  let likelihood = null;
  let likelihoodBand = null;

  if (likelihoodCfg.mode === 'point') {
    likelihood = Math.round(clamp(0.9 * overall - 6 * hardStops.length, 0, likelihoodCfg.max ?? 97));
  } else if (likelihoodCfg.mode !== 'off') {
    const band = (likelihoodCfg.bands || []).find((entry) => overall >= entry.min_overall);
    if (band) {
      likelihoodBand = {
        low: band.low,
        high: band.high,
        stage: likelihoodCfg.stage ?? 'passes_initial_resume_screen',
        provenance_tier: likelihoodCfg.provenance_tier ?? 'T4',
        calibrated: likelihoodCfg.calibrated === true,
        note: likelihoodCfg.note ?? '',
      };
    }
  }

  // --- dimensions (4 bars in the UI) ---------------------------------------
  const dims = rubric.dimensions.map((dim) => {
    const members = (dim.rules || [])
      .map((id) => byId.get(id))
      .filter((finding) => finding && finding.state === 'scored');
    const mean = weightedMean(members.map((f) => ({ weight: f.weight, points: f.points })));
    const unresolved = (dim.rules || []).length - members.length;

    if (mean === null) {
      return { name: dim.name, score: 0, note: 'Not assessable from this input.', unresolved_rules: unresolved };
    }
    const drivers = [...members].sort((a, b) => a.points - b.points).slice(0, 2);
    return {
      name: dim.name,
      score: Math.round(mean),
      note: drivers.map((f) => `${f.id}: ${f.note || f.name}`).join(' '),
      unresolved_rules: unresolved,
    };
  });

  // --- checklist (6 booleans in the UI) ------------------------------------
  const criteria = rubric.criteria.map((criterion) => {
    const members = (criterion.from || [])
      .map((id) => byId.get(id))
      .filter((finding) => finding && finding.state === 'scored');
    if (!members.length) {
      return { label: criterion.label, ok: false, unknown: true };
    }
    return {
      label: criterion.label,
      ok: members.every((finding) => finding.score >= criterion.min_score),
      unknown: false,
    };
  });

  // --- verdict & recommendation --------------------------------------------
  const band = (cfg.verdict_bands || []).find((entry) => overall >= entry.min);
  const verdict = band ? band.label : 'Unscored';

  const thresholds = cfg.recommendation_thresholds || {};
  const recommendation =
    overall >= thresholds.advance ? 'Advance to interview'
      : overall >= thresholds.reservations ? 'Advance with reservations'
        : 'Do not advance';

  const weakest = [...scored].sort((a, b) => a.points - b.points).slice(0, 2);
  const recommendationNote = hardStops.length
    ? `Capped at ${overall} by hard stop${hardStops.length > 1 ? 's' : ''}: ${hardStops.map((s) => `${s.id} ${s.name}`).join('; ')}.`
    : `Driven mainly by ${weakest.map((f) => `${f.id} (${f.name})`).join(' and ')}.`;

  const unresolved = findings.filter((f) => f.state !== 'scored');

  return {
    // --- original API shape, preserved for the frontend and BigQuery -------
    candidate: modelOutput.candidate ? String(modelOutput.candidate) : 'Candidate',
    overall,
    likelihood,
    verdict,
    verdictNote: modelOutput.summary ? String(modelOutput.summary) : `Scored ${overall}/100 against rubric ${rubric.version}.`,
    recommendation,
    recommendationNote,
    dims,
    criteria,
    strengths: toStringArray(modelOutput.strengths),
    flags: toStringArray(modelOutput.flags),
    recs: toStringArray(modelOutput.recs),

    // --- new, additive ----------------------------------------------------
    findings,
    warnings,
    meta: {
      rubric_version: rubric.version,
      rubric_checked_on: rubric.checked_on,
      input_mode: inputMode,
      scored_rules: scored.length,
      unresolved_rules: unresolved.map((f) => ({ id: f.id, state: f.state, reason: f.reason })),
      hard_stops: hardStops,
      weight_coverage: Number(scored.reduce((sum, f) => sum + f.weight, 0).toFixed(4)),
      likelihood_mode: likelihoodCfg.mode ?? 'band',
      likelihood_band: likelihoodBand,
      likelihood_calibrated: likelihoodCfg.calibrated === true,
    },
  };
}

function toStringArray(value) {
  return Array.isArray(value) ? value.map(String) : [];
}
