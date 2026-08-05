# Sources & bibliography

> **NEVER inject this file into a prompt.** A model cannot dereference a URL.
> Injecting a link list adds no evaluative signal, costs tokens on every call,
> and actively invites the model to *cite* pages it never read. This file is
> for humans, and for resolving the `provenance.sources` IDs in `rubric.yaml`.

**Last checked:** 2026-08-06

## Provenance tiers

| Tier | Meaning | How to weight it |
|---|---|---|
| `firm_primary` | Published by the firm itself | Authoritative for eligibility, process and deadlines. Still expires. |
| `coach_consensus` | Multiple ex-screener / coaching sources agree | Informed convention. Commercially motivated — these businesses sell the premise that a knowable code exists. |
| `forum_anecdote` | Single unverified account | Directional only. Never a hard stop. |
| `analyst_added` | Not in the source corpus | Added to close a coverage gap; flagged as such in `rubric.yaml`. |

---

## `firm_primary`

| ID | Source | URL |
|---|---|---|
| `mckinsey_apd_allschools` | McKinsey APD landing page — eligibility + deadlines | https://www.mckinsey.com/careers/students/advanced-professional-degree-candidates/all-schools |
| `mckinsey_apd_tips` | McKinsey — tips for APD candidates | https://www.mckinsey.com/careers/students/tips-for-advanced-professional-degree-candidates |
| `mckinsey_quantumblack` | McKinsey QuantumBlack — Data Scientist role | https://www.mckinsey.com/capabilities/quantumblack/careers-and-community/data-scientist |
| `bcg_x_careers` | BCG — careers in AI (BCG X) | https://careers.bcg.com/global/en/careers-in-ai |

## `coach_consensus` — annotated example resumes

| ID | Source | URL |
|---|---|---|
| `igotanoffer_consulting` | 6 real anonymised MBB-offer resumes + free template | https://igotanoffer.com/blogs/mckinsey-case-interview-blog/consulting-resume |
| `igotanoffer_phd` | PhD consulting resume guide | https://igotanoffer.com/blogs/mckinsey-case-interview-blog/phd-consulting-resume |
| `igotanoffer_experienced_hire` | Experienced-hire consulting resume | https://igotanoffer.com/blogs/mckinsey-case-interview-blog/experienced-hire-consulting-resume |
| `managementconsulted_template` | Resume webinar + MBB-standard template | https://managementconsulted.com/crafting-winning-consulting-resume/ |
| `managementconsulted_phd` | Applying to McKinsey as a PhD | https://managementconsulted.com/breaking-mckinsey-phd/ |
| `leland_mckinsey_guide` | Annotated McKinsey-ready example resume | https://www.joinleland.com/library/a/mckinsey-resume-guide |

> ⭐ `igotanoffer_consulting` contains **6 real anonymised resumes that won MBB
> offers**. That is the closest thing available to a labelled positive set —
> see the evaluation plan in `../README-rules.md`.

## `coach_consensus` — ex-screener guides

| ID | Source | URL |
|---|---|---|
| `htci_mckinsey` | Hacking the Case Interview — McKinsey resume | https://www.hackingthecaseinterview.com/pages/mckinsey-resume |
| `htci_phd` | HTCI — PhD resume for consulting | https://www.hackingthecaseinterview.com/pages/phd-resume-for-consulting |
| `htci_experienced` | HTCI — experienced hires | https://www.hackingthecaseinterview.com/pages/consulting-resume-experienced-hires |
| `htci_apd` | HTCI — McKinsey APD recruiting | https://www.hackingthecaseinterview.com/pages/mckinsey-apd-recruiting |
| `htci_quantumblack` | HTCI — QuantumBlack interview | https://www.hackingthecaseinterview.com/pages/mckinsey-quantumblack-interview |
| `htci_bain_vector` | HTCI — Bain Vector interview | https://www.hackingthecaseinterview.com/pages/bain-vector-interview |
| `strategycase` | StrategyCase (ex-McKinsey screener) — consulting resume | https://strategycase.com/consulting-resume/ |
| `nextep_cv_guide` | NextEp (ex-Bain interviewer) — consulting CV guide | https://nextepmbb.com/en/consulting-cv-guide-en/ |
| `caseinterview_apd` | CaseInterview.com — McKinsey APD/PhD CV format | https://caseinterview.com/mckinsey-apd-phd-cv-format-for-consulting |
| `consultedge_2026` | ConsultEdge — 2026 consulting resume guide | https://consultedge.app/blog/consulting-resume-guide-2026 |
| `resumeoptimizerpro` | Resume Optimizer Pro — management consulting resume | https://resumeoptimizerpro.com/blog/resume-for-management-consulting |
| `roadtooffer_ds_case` | Road to Offer — data science case interview guide | https://www.roadtooffer.com/blog/data-science-case-interview-guide |

## `forum_anecdote`

| ID | Source | URL |
|---|---|---|
| `wso_phd_thread` | Wall Street Oasis — PhD resume critiqued by self-identified MBB consultants | https://www.wallstreetoasis.com/forum/consulting/how-to-get-into-consulting-from-phd |
| `preplounge_quantify` | PrepLounge — how to quantify impact | https://www.preplounge.com/consulting-forum/how-to-quantify-impacts-on-resume-16536 |
| `preplounge_mbb_phd` | PrepLounge — MBB with PhD + 5 yrs industry | https://www.preplounge.com/consulting-forum/breaking-the-into-mbb-with-phd-in-industry-with-5-year-experience-24321 |

---

## Templates

Single-column, minimalist, black-and-white. Two-column templates look modern
but break ATS parsers and deviate from consulting norms.

| Template | Note | URL |
|---|---|---|
| Awesome-CV | Clean, widely used LaTeX CV/résumé template | https://github.com/posquit0/Awesome-CV |
| Awesome-PhD-CV | Academic CV → ATS-safe industry resume; includes Jake's Resume | https://github.com/LimHyungTae/Awesome-PhD-CV |
| Deedy-Resume | ⚠️ Two-column XeTeX — **ATS risk**, prefer single-column | https://github.com/deedy/Deedy-Resume |
| Enhanced-Deedy | ⚠️ Reversed-layout Deedy variant — same ATS risk | https://github.com/harshad-kadam/Enhanced-Deedy_Resume |

Browse: https://github.com/topics/latex-resume-template ·
https://github.com/topics/resume-template

**Recommendation:** Jake's Resume or single-column Awesome-CV, or a plain Word
template from a firm or coaching source.

## Visual examples

The vetted annotated examples live inside `igotanoffer_*`, `leland_mckinsey_guide`
and `managementconsulted_template` above. Image search
("McKinsey resume example annotated", "BCG consulting resume template one page")
returns mostly coaching-site mockups rather than real offer resumes — treat
with caution.
