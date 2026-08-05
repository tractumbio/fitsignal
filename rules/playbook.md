# MBB Application Playbook — track selection & sequencing

> **NOT A SCORING INPUT.** This file must never be injected into the resume
> scoring prompt. It describes *which track a specific person should target*
> and *what to do next* — neither is a property of a resume, so neither can be
> scored. It is also written around one specific background (see below), so
> using it as scorer grounding would make the scorer reward candidates who
> resemble its author rather than measure resume quality.
>
> Intended consumer: a separate "what should I do next" advisor, or a human.

**Profile this was written for:** Neuroscience/Bioinformatics PhD +
startup co-founder/CTO + Accenture Data & AI consulting.

**Last verified:** 2026-08-06 · **Recheck dated facts before acting.**

---

## ⚠️ Dated facts — verify before use

Facts below carry expiry. An agent reading this file **must not assert an
expired date as actionable**; it should say the date has passed and point at
the primary source.

| Fact | Value | Status as of 2026-08-06 | Source |
|---|---|---|---|
| McKinsey APD deadline — graduated/graduating by Oct 2026 | **June 26, 2026** (rolling review) | 🔴 **EXPIRED** ~6 weeks ago | `mckinsey_apd_allschools` |
| McKinsey APD window — graduating Dec 2026–Fall 2027 | **July 1 – Aug 11, 2026** | 🟠 **CLOSES IN 5 DAYS** | `mckinsey_apd_allschools` |
| McKinsey APD Associate US base salary | ~$192,000 | 🟡 Unverified coaching-site figure; location-specific and stale-prone | `htci_apd` |
| QuantumBlack / BCG X / Bain Vector hiring | Year-round, rolling | 🟢 Structural, low staleness risk | `htci_quantumblack`, `bcg_x_careers` |

---

## Which track to target

### 1. McKinsey APD (Advanced Professional Degree)
- PhDs, postdocs, MDs, JDs and non-MBA Master's (4+ years between degrees)
  enter as full-time **Associates** — same level and pay as MBA hires. APDs are
  more than a third of each incoming Associate class. Generalist or expert
  paths (digital, analytics, operations).
- **Caveat for this profile:** APD is built for candidates ~0–2 years post-PhD.
  A PhD *plus* several years of startup and consulting experience sits
  **between** APD and experienced-hire generalist. Ask recruiting directly
  which track HR should route you to — do not guess.

### 2. Experienced-hire generalist
- Rare and skeptically screened. Post-MBA-equivalent generalist seats go mostly
  to MBA/PhD campus hires. Experienced-hire slots are few and hinge on prior
  peer-firm consulting or deep directly-relevant industry expertise. Referrals
  and partner networking matter disproportionately.
- *Provenance: `wso_phd_thread` — self-identified consultants on a public
  forum. Unverified; treat as directional, not factual.*

### 3. Digital / AI specialist tracks — highest leverage for this profile
- McKinsey **QuantumBlack**, **BCG X** (formerly Gamma), **Bain Vector /
  Advanced Analytics** all run year-round technical recruiting.
- QuantumBlack: advanced quantitative degree + strong Python/R/statistics.
  Typical process — QuantHub/HackerRank test → Technical Experience Interviews
  → Personal Experience Interview (PEI).
- BCG X / Bain Vector: technical screen + business case. Both want
  production-grade data-product experience tied to business outcomes.

---

## Converting an academic CV to a one-page business resume

*(The scoreable version of this guidance lives in `rubric.yaml` as R02, R04,
R06, R07, R14. This section is the writer-facing companion.)*

- Cut to one page. Fold Publications/Conferences/Teaching into a single
  Education bullet — e.g. *"Authored 8 peer-reviewed papers (400+ citations);
  presented at 3 international conferences."*
- De-jargonise ruthlessly. If a non-scientist friend cannot parse a bullet,
  rewrite it.
- Quantify research: team size led, grant dollars, dataset scale, model
  performance gains, students mentored, publications and citations.
  - *Before:* "Conducted experiments in the lab"
  - *After:* "Designed and executed a 12-month study across 3 clinical sites,
    producing findings that influenced hospital treatment protocols."
- Make your own contribution attributable — a screener must see what **you**
  did, not what the group did. Lead with the point, never with filler.
- Foreground selectivity: competitive labs, fellowships, medals, awards.
  Show you were chosen for things few people are chosen for.
- On GPA: omitting it tends to read as "not great". Surround credentials with
  awards and selectivity signals rather than leaving a bare gap.
  - ⚠️ *This directly contradicts the older corpus advice to "hide a credential
    that is not obviously strong." Prefer contextualising over hiding —
    concealment is what the omission heuristic is designed to catch.*

## Framing entrepreneurship (co-founder / CTO)

- Entrepreneurial drive is an explicit McKinsey screening value — founders are
  attractive.
- Avoid clichés ("scrappy", "wore many hats", "owned end-to-end",
  "fast-paced") unless you specify **what** you owned and **what changed**.
- Quantify funding, revenue, users, team size, growth, exit or licensing.
  Use Problem → Action → Outcome.
- Add a one-line descriptor for unrecognisable companies — e.g.
  *"ErythroSight (seed-stage cell-therapy startup; $670K raised; commercial
  licensing exit)."*

## Framing current Data & AI consulting (Accenture)

- This is the strongest consulting-relevance signal in the profile. Translate
  delivery work into MBB language: workstreams, diligence, executive readouts,
  frameworks, steering committees.
- Balance technical bullets (models, pipelines, tools) against client-facing
  and leadership bullets (stakeholders advised, decisions influenced, teams led).
- Tie every technical metric to a business decision or dollar figure.
  "My AUC was 0.92" lands flat unless connected to churn reduction, risk
  avoided, or savings delivered.
- Name the stack explicitly (Python, SQL, PySpark, TensorFlow/PyTorch,
  RAG/LLM systems, Azure/GCP, Databricks) — technical screens keyword-match it.

---

## Application sequence

1. Build the base one-pager: XYZ bullets, quantified, jargon-free.
2. Produce **two variants** —
   (a) generalist/APD: impact, leadership and selectivity forward;
   (b) technical: AI/ML stack, production systems and business-tied metrics forward.
3. Write firm-specific cover paragraphs for McKinsey / BCG / Bain. Experienced
   hires must explicitly answer *"why consulting, why now."*
4. **Network before applying.** APD and experienced-hire recruiters, alumni,
   partners in QuantumBlack / BCG X / Vector. Ask HR which track fits this
   profile. Referrals materially raise the odds of a human read.
5. Timing: check the dated-facts table above against the primary source.
   QuantumBlack / BCG X / Vector hire on a rolling basis.
6. Get an ex-MBB screener review before submitting.

**Benchmark:** zero screens after 7–10 applications → shift weight toward
specialist AI tracks and referrals. The resume or the track fit is wrong.
