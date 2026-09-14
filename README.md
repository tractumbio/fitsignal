# FitSignal

Scores a resume against a versioned, weighted rubric for consulting roles.

The model does **not** produce the score. It assigns each rule a 0–3 ordinal
plus verbatim evidence quoted from the resume; `overall`, the four dimensions,
the six checklist booleans and the recommendation are all computed in code from
the weights in [`rules/rubric.yaml`](rules/rubric.yaml). Same findings in, same
numbers out — every time. Change a weight, change the scoring; no code edit, no
re-prompt.

Evidence spans are checked against the resume text. A span that doesn't appear
verbatim is dropped as hallucinated, and a rule claiming a high score with no
surviving evidence is demoted to `unknown` rather than trusted.

## Quick start

```bash
npm install
cp .env.example .env          # then paste your key into ANTHROPIC_API_KEY
npm run score -- --file resume.txt
```

No API key handy? Run the whole pipeline offline with placeholder scores:

```bash
npm run score -- --file resume.txt --mock
```

Run the HTTP server instead:

```bash
npm start                     # POST /api/analyze, GET /health
```

## Layout

```
src/            application code
  server.js       Express API (POST /api/analyze)
  cli.js          command-line scorer
  lib/            rubric loader, prompt builder, providers, scoring engine
rules/          the rubric and its provenance — edit these to change scoring
  rubric.yaml     15 scored rules, weights, dimensions, criteria, exclusions
  playbook.md     career strategy notes; NOT a scoring input
  sources.md      bibliography; never injected into a prompt
test/           test suite (npm test)
web/            FitSignal.dc.html — design reference, see caveat below
deploy/         Dockerfile, GCP setup script, BigQuery DDL
docs/           design spec, GCP schema, deployment notes
archive/        superseded source material, safe to delete
```

## How scoring works

1. `rules/rubric.yaml` is loaded and validated at boot — weights must sum to
   1.0 and every weighted rule must map to a dimension, or the process refuses
   to start.
2. The rubric goes in the **system** turn; the resume goes in the **user** turn,
   so the candidate document is structurally data rather than instructions.
3. The model returns per-rule findings against a schema generated from the
   rubric, so the rule-id enum can never drift from the rules being scored.
4. `src/lib/score.js` verifies evidence, applies hard stops, renormalises over
   the rules that actually resolved, and emits the scorecard.

Rules that can't be observed in the given input are returned as `unknown` and
excluded from both numerator and denominator — never guessed. With plain-text
input, layout rules (`R01`) always resolve this way, because column count and
formatting are definitionally absent from plain text.

## Configuration

All settings live in `.env` — see [`.env.example`](.env.example) for the full
list. Set one of `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`; the provider is
auto-detected, or force it with `LLM_PROVIDER=anthropic|openai|claude-cli|mock`.

**No key? If the `claude` CLI is installed and logged in** (i.e. this is a machine with
Claude Code set up), FitSignal falls back to it automatically — no key to provision,
scores through whatever account is already logged in. This is what
`pipeline/score.sh` in the `resume` repo relies on by default.

> `.env` values **override** the surrounding shell environment. This is
> deliberate: `~/.zshrc` on this machine exports a truncated
> `ANTHROPIC_API_KEY` that would otherwise silently shadow a correct key.

## Known gaps

- **`web/FitSignal.dc.html` does not run in a browser.** It's a design-tool
  export that loads a `./support.js` runtime which was never shipped. Treat it
  as a visual reference; a working frontend still needs building.
- **`likelihood` is uncalibrated.** It's a documented heuristic transform of
  `overall`, reported with `likelihood_calibrated: false`. It is not an outcome
  prediction.
- **The rubric is unvalidated.** No labelled set has been run through it yet, so
  its ability to separate strong from weak resumes is untested. See the
  evaluation notes in `rules/sources.md`.
- **Fairness.** `R07` and `R15` are prestige proxies that correlate with
  socioeconomic background. They're low-weight and never hard stops; set their
  weights to 0 when screening third parties, and read the `exclusions` block in
  `rules/rubric.yaml` first — automated employment decision tools are regulated
  in several jurisdictions.
