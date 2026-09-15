# Case Interviews

Practice case interviews for consulting and data analytics roles. Self-contained, no external dependencies required.

## CDMP Case: Department of Health Chronic Disease Management Program

**File:** `cdmp-case.html`  
**Duration:** 45–90 minutes  
**Format:** Self-paced, browser-based interactive case

### Overview

A state Department of Health has collected six years of data from their Chronic Disease Management Program (CDMP) across 14 clinics. They want to know: *Is this program actually working?*

You're given a real schema (three tables: region, clinic, annual_outcome) with sample data, then asked seven progressively harder questions that mirror a real consulting engagement:

1. **Schema reading** — Walk through the data structure and relationships
2. **Data collection verification** — Assess geographic coverage and sampling gaps
3. **Executive synthesis** — Distill findings into a client pitch with visualization
4. **Critical evaluation** — Spot flaws in an analyst's cost analysis
5. **Trend analysis** — Prioritize which clinics need cost intervention
6. **Causal reasoning** — Design a test for whether funding drives outcomes
7. **Translation** — Explain complex regression results to a non-technical leader

### How to Use

#### For Self-Study
1. Open `cdmp-case.html` in a browser
2. Read the situation and exhibits (ERD, data dictionary)
3. Answer each question in the text boxes—no answer keys, just reflection
4. Use SQL or Python if you want to query the data or build analyses (both tools available)

#### For Interview Practice
1. **Facilitator:** Open the case in a browser, share with the candidate
2. **Candidate:** Works through questions aloud, thinking out loud
3. **Facilitator:** Listens for:
   - Whether they read the schema before diving into numbers
   - How they spot data quality issues (undersampling by region)
   - Whether they can synthesize findings for a non-technical audience
   - How they evaluate someone else's analytical work
   - Whether they conflate correlation with causation
   - How they translate statistical output into business language

#### Tools
- **SQL:** Query the in-memory SQLite database to answer questions about coverage, costs, and outcomes
- **Python:** Build analyses, visualizations, or statistical tests
- **Claude:** Use as your thought partner—ask for help understanding concepts, validating analysis, or workshopping explanations

Both tools are optional. Some candidates will write SQL or Python; others will reason through Exhibit 2 by hand. Both approaches are valid.

### What It Tests

| Question | Skill | Difficulty |
|----------|-------|------------|
| 1 | Schema literacy, ER modeling | Warm-up |
| 2 | Data quality, geographic analysis | Analyst |
| 3 | Executive synthesis, storytelling | Analyst |
| 4 | Critical evaluation of peer work | Senior |
| 5 | Trend analysis, prioritization | Senior |
| 6 | Hypothesis design, causal thinking | Senior |
| 7 | Communication to non-technical stakeholders | Senior |

### Case Structure

**Exhibits:**
- **Exhibit 1:** Entity-relationship diagram (region → clinic → annual_outcome)
- **Exhibit 2:** Data dictionary with real sample values for each field

**Data Fields:**
- `program_cost_usd` — Annual spend per clinic
- `patients_enrolled`, `patients_completed` — Engagement and completion
- `avg_a1c_reduction` — Clinical outcome for diabetes
- `readmission_rate`, `fall_rate`, `hosp_readmit_count` — Safety and hospital outcomes

**Key Pedagogical Twist:** The regression results in Q7 show higher costs marginally associated with *more* readmissions—counterintuitive and forces discussion of confounders vs. causation.

### Design Philosophy

- **No answer keys** — The case tests judgment, not memorization
- **Open-ended questions** — Multiple valid approaches to each question
- **Real consultant workflows** — Questions move from "read the schema" through "translate for the client"
- **Jargon-heavy exhibits** — Q7's regression table is deliberately dense; tests ability to explain statistics to non-technical people
- **No tool prescription** — Candidate chooses SQL, Python, or reasoning. Case works with any approach.
- **Client as proxy for judgment** — Each question implicitly asks "what does the *client* actually need to know?"

### Tips for Facilitators

1. **Listen for schema comprehension first.** If they don't understand the ER diagram in Q1, they'll struggle later.
2. **Watch for data quality thinking.** Do they notice that some clinics opened later? That only 9 of 14 clinics had data collected?
3. **Evaluate synthesis, not just analysis.** Anyone can run a query; the case rewards candidates who turn findings into narrative.
4. **Probe Q4 deeply.** The ability to spot methodological flaws in peer work is a differentiator.
5. **On Q7, let them struggle with the table.** The regression output is intentionally complex. Give them time to parse it, then ask them to explain it plainly. That's where the real skill shows.

### Self-Paced Timing

- **Q1–2:** 10–15 minutes (schema + data quality)
- **Q3:** 10–15 minutes (synthesis)
- **Q4–5:** 15–20 minutes (critical evaluation + trend analysis)
- **Q6–7:** 20–30 minutes (causal reasoning + translation)
- **Total:** 45–90 minutes depending on how deeply you dive

### No External Dependencies

The case is a single HTML file. Open it anywhere—no server, no login, no downloads required. If using SQL or Python, you'll ask Claude (or spin up your own environment), but the case itself is entirely self-contained.

---

**Created:** 2026-09-15  
**For:** Consulting case interview practice; data analytics hiring; teaching SQL/Python in context of real client problems
