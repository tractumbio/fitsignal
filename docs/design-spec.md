# Handoff: FitSignal — Resume Fit Scorer

## Overview
A recruiter-facing tool that ingests a candidate resume and uses AI to score its fit and likelihood of success for an Accenture Consulting Analyst role. Three-step flow: upload/paste resume → AI analysis (with progress) → scorecard results.

## About the Design Files
`FitSignal.dc.html` is a **design reference built in HTML** — a working prototype showing the intended look, states, and behavior. It is not production code to copy verbatim. The task is to **recreate this design in the target codebase's existing stack** (React, Vue, native, etc.) using its established components, styling approach, and patterns — or, if no stack exists yet, choose the most appropriate framework and implement it there. `deploy/` is closer to real backend code (a minimal Express service) and can be adapted directly.

## Fidelity
**High-fidelity.** Colors, type, spacing, and copy in the HTML are final — recreate pixel-close. All values are inline styles in the HTML file; read them directly rather than guessing.

## Screens / Views

### 1. Upload
- **Purpose**: Recruiter provides resume text and picks a target role, then triggers analysis.
- **Layout**: Centered column, max-width 720px. Header block (kicker label + H1 + subhead, centered). Below it, a white card (`border-radius:16px`, `border:1px solid oklch(0.92 0.006 265)`, `padding:28px`) containing: a dashed drop-zone (click opens a hidden `<input type="file" accept=".txt">`), a labeled `<textarea>` bound to resume text (editable — this is the actual analysis input), a "Target role" field (static select-look, non-functional in the prototype), and a primary "Analyze resume →" button. Below the card, a 3-column grid of small info cards.
- **Components**:
  - Drop-zone: dashed border `1.5px dashed oklch(0.85 0.01 275)`, bg `oklch(0.985 0.004 275)`, hover darkens border/bg to the accent tint. Contains a 44×44px icon tile (bg `oklch(0.93 0.03 275)`, accent ↑ glyph), bold label, gray helper text.
  - Textarea: monospace (IBM Plex Mono), 12.5px, border `oklch(0.9 0.006 265)`, resizable vertically, live char count shown top-right.
  - Primary button: bg `oklch(0.52 0.15 275)` (indigo accent), white text, `border-radius:9px`, hover darkens to `oklch(0.44 0.15 275)`.
  - Info cards: white, 1px border `oklch(0.93 0.006 265)`, `border-radius:10px`, mono kicker label in accent color + gray body copy.
- **Content/copy**: "Score a resume against the consulting bar" (H1); subhead about parsing/grading against consulting-analyst criteria; info cards read "8 SIGNALS", "~4 SEC", "EXPLAINABLE" with one-line descriptions each.

### 2. Analyzing
- **Purpose**: Shows AI work in progress; blocks input.
- **Layout**: Centered column, max-width 520px, appears ~48px below header.
- **Components**:
  - Circular progress ring, 96×96px: static light-gray track ring + accent-colored spinning arc (`border-top-color` accent, 1s linear infinite rotation), percentage text centered inside in accent color/mono font.
  - H2 "Analyzing {fileName}", gray subhead "Matching against the consulting analyst rubric".
  - A white card listing 4 sequential steps ("Parsing resume & structure", "Extracting skills and experience", "Matching against consulting rubric", "Scoring & modeling success"), each row = 20px status dot (empty/outlined = pending, filled accent = active, filled green with ✓ = done) + label (gray when pending, dark + bold when active/done).
- **Behavior**: A decorative progress counter increments from 0–97% every 90ms while the real AI call runs in parallel; on response (or failure) it jumps to 100% and transitions to Results.

### 3. Results
- **Purpose**: Present the AI-generated scorecard; let the recruiter act on it.
- **Layout**: Centered column, max-width 960px. Header row (candidate name + role line, left; "Edit & re-run" + "Download report" buttons, right). Then a 3-column stat row. Then a 2-column area: left column (1.4fr) has "Signal breakdown" and "Consulting criteria checklist" cards; right column (1fr) has "Strengths", "Red flags & gaps", and "How to improve fit" cards (the last has a tinted indigo background, not white).
- **Components**:
  - Overall-fit card: 104px circular SVG gauge (12px stroke, track `oklch(0.93 0.01 275)`, progress arc colored by score band — green ≥80, amber 68–79, red <68 — animated stroke-dashoffset draw-in), big mono score number + "/100" centered inside, verdict label + note beside it.
  - Likelihood card: big mono percentage (indigo) + explanatory line.
  - Recommendation card: colored pill badge (green/amber/red background tint per recommendation text) + note line.
  - Signal breakdown: per-dimension row = label + mono score (right-aligned, colored by band) above an 8px rounded progress bar (colored by band, animated width grow-in) + a one-line evidence note.
  - Criteria checklist: 2-column grid of 18px square icon chips (✓ green tint / – red tint) + label, for 6 fixed criteria (Top-tier academics, Quantified impact, Leadership evidence, Brand-name experience, Clear structure, Client-facing exposure).
  - Strengths / Red flags / Improve-fit lists: each a card with a colored 8px square swatch + bold title, then a bullet list (✓ / ! / → marker + text).
  - Toast: fixed bottom-center, dark pill, fades in/out, used for transient messages (file-picker hint, AI failure notice, "report exported").

## Interactions & Behavior
- Clicking the drop-zone opens the native file picker (`.txt` only in this prototype); selected file is read via `FileReader` and replaces the textarea content + filename.
- Textarea is fully editable and is the literal input sent to the AI.
- "Analyze resume" is disabled in effect if the textarea is empty (shows a toast instead of proceeding).
- On click: state moves to `analyzing`; a decorative interval animates progress 0→97% over ~3s while, in parallel, the real prompt is sent to an AI model requesting **strict JSON** matching a fixed schema (see below). On success, progress snaps to 100% and state moves to `results` with the parsed JSON. On failure (bad JSON, network error), a toast reads "AI scoring failed — showing a demo scorecard instead" and a hardcoded demo object fills the same shape so the UI never breaks.
- "Edit & re-run" returns to Upload with the same resume text still populated (state persists across the round trip).
- "Download report" is a stub — in the prototype it only shows a toast ("Report exported — FitSignal_Report.pdf"); real implementation should generate/download an actual file (e.g. PDF from the scorecard data).
- All entrance transitions use a 0.4s fade-up (`opacity 0→1` + `translateY(10px)→0`).

## State Management
- `stage`: `'upload' | 'analyzing' | 'results'`
- `resumeText`: string, the editable/uploaded resume content (seeded with a sample resume)
- `fileName`: string, display label for the current resume source
- `result`: the parsed AI JSON object (or `null` before first run) — see schema below
- `progress` / `step`: decorative analyzing-screen animation state
- `toast`: transient message string

### AI response schema (what the backend/model must return)
```json
{
  "candidate": "string",
  "overall": "integer 0-100",
  "likelihood": "integer 0-100",
  "verdict": "2-4 word string",
  "verdictNote": "one sentence",
  "recommendation": "'Advance to interview' | 'Advance with reservations' | 'Do not advance'",
  "recommendationNote": "one sentence",
  "dims": [
    {"name": "Skills match vs. role", "score": 0, "note": "..."},
    {"name": "Experience relevance", "score": 0, "note": "..."},
    {"name": "Culture & values alignment", "score": 0, "note": "..."},
    {"name": "Keyword / ATS coverage", "score": 0, "note": "..."}
  ],
  "criteria": [
    {"label": "Top-tier academics", "ok": true},
    {"label": "Quantified impact", "ok": false},
    {"label": "Leadership evidence", "ok": true},
    {"label": "Brand-name experience", "ok": true},
    {"label": "Clear structure", "ok": true},
    {"label": "Client-facing exposure", "ok": false}
  ],
  "strengths": ["string", "..."],
  "flags": ["string", "..."],
  "recs": ["string", "..."]
}
```
The exact prompt used to request this from the model is in `FitSignal.dc.html`'s `buildPrompt()` method and duplicated server-side in `deploy/server.js`.

## Design Tokens
- **Colors** (all OKLCH):
  - Background: `oklch(0.98 0.004 265)`; card/surface: `#fff`
  - Ink (primary text): `oklch(0.24 0.012 265)`; secondary text: `oklch(0.5–0.55 0.012 265)`
  - Borders: `oklch(0.92 0.006 265)` (default), `oklch(0.9 0.006 265)` (inputs)
  - Accent (indigo, primary actions / brand): `oklch(0.52 0.15 275)`, hover `oklch(0.44 0.15 275)`, light tint `oklch(0.975 0.012 275)` / `oklch(0.93 0.03 275)`
  - Score bands: good ≥80 `oklch(0.55 0.13 150)` (green), mid 68–79 `oklch(0.65 0.14 90)` (amber), low <68 `oklch(0.6 0.15 25)` (red)
- **Typography**: IBM Plex Sans (400/500/600/700) for UI text and headings; IBM Plex Mono (400/500/600) for scores, labels, kickers, and percentages. Loaded via Google Fonts.
- **Radius**: 16px (large cards), 14px (result cards), 10–12px (small cards/inputs), 9px (buttons/inputs), 6–8px (chips/badges), 50% (circles/dots).
- **Spacing**: card padding 22–28px; grid/list gaps 12–20px; section vertical rhythm ~16–20px between stacked cards.
- **Shadows**: none used — flat cards distinguished by 1px borders only.

## Assets
No external images/icons — all visual marks are CSS shapes (SVG circles for the gauge, colored squares/dots, unicode glyphs ✓ / – / ! / → / ▾ / ↑ as icon substitutes). Fonts loaded from Google Fonts CDN.

## Files
- `FitSignal.dc.html` — the full front-end design reference (all 3 screens, states, and the client-side AI call).
- `deploy/server.js` — minimal Express backend that proxies the same AI prompt to Anthropic's API server-side (for when the API key can't live in the browser).
- `deploy/package.json`, `deploy/Dockerfile` — backend deploy scaffolding.
- `deploy/DEPLOY.md` — step-by-step Cloud Run deployment instructions.
