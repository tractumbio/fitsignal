#!/usr/bin/env node
import fs from 'fs/promises';
import process from 'process';

import { loadEnv, validateProviderKey } from './lib/env.js';
import { loadRubric } from './lib/rubric.js';
import { buildPrompt, buildResponseSchema, detectInjection } from './lib/prompt.js';
import { callModel, resolveProvider } from './lib/provider.js';
import { assess } from './lib/score.js';

loadEnv();

function usage() {
  console.log(`Usage: fitsignal [options]

Options:
  --file <path>          Read resume text from a file
  --role <role>          Target role for the analysis (default: Accenture Consulting Analyst)
  --input-mode <mode>    text | pdf_layout | metadata  (default: text)
  --region <region>      US | UK | DACH | Gulf | Japan | AU ... (enables region rules)
  --route <route>        campus | graduate | experienced-hire | apd
  --practice <practice>  healthcare | life-sciences | pe-diligence
  --json                 Print the full JSON result (default prints a summary)
  --show-prompt          Print the built prompt and exit without calling the model
  --mock                 Run the full pipeline offline with placeholder scores (no API key)
  --help                 Show this help text

Examples:
  fitsignal --file resume.txt
  cat resume.txt | fitsignal --role "McKinsey APD Associate"
  fitsignal --file resume.txt --show-prompt
`);
}

function parseArgs(argv) {
  const options = { role: 'Accenture Consulting Analyst', inputMode: 'text', json: false, showPrompt: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') { options.help = true; continue; }
    if (arg === '--json') { options.json = true; continue; }
    if (arg === '--show-prompt') { options.showPrompt = true; continue; }
    if (arg === '--mock') { process.env.LLM_PROVIDER = 'mock'; continue; }
    if (arg === '--file') { options.file = argv[i + 1]; i += 1; continue; }
    if (arg === '--role') { options.role = argv[i + 1] || options.role; i += 1; continue; }
    if (arg === '--input-mode') { options.inputMode = argv[i + 1] || options.inputMode; i += 1; continue; }
    if (arg === '--region') { options.region = argv[i + 1]; i += 1; continue; }
    if (arg === '--route') { options.route = argv[i + 1]; i += 1; continue; }
    if (arg === '--practice') { options.practice = argv[i + 1]; i += 1; continue; }
    console.warn(`Unknown option: ${arg}`);
  }
  return options;
}

async function readStdin() {
  let body = '';
  for await (const chunk of process.stdin) body += chunk;
  return body.trim();
}

function printSummary(result) {
  const bar = (n) => '█'.repeat(Math.round(n / 5)).padEnd(20, '·');
  console.log(`\n  ${result.candidate} — ${result.verdict}`);
  console.log(`  Overall      ${bar(result.overall)} ${result.overall}/100`);

  const band = result.meta.likelihood_band;
  if (band) {
    console.log(`  Screen pass  roughly ${band.low}-${band.high}%  (${band.provenance_tier} estimate, uncalibrated)`);
  } else if (typeof result.likelihood === 'number') {
    console.log(`  Screen pass  ${bar(result.likelihood)} ${result.likelihood}%  (uncalibrated heuristic)`);
  }
  console.log(`  → ${result.recommendation}. ${result.recommendationNote}\n`);

  for (const dim of result.dims) console.log(`  ${String(dim.score).padStart(3)}  ${dim.name}`);

  console.log('\n  Rules');
  for (const finding of result.findings) {
    const mark = finding.state === 'scored' ? `${finding.score}/3` : finding.state === 'not_applicable' ? ' n/a' : '  ?';
    console.log(`  ${mark}  ${finding.id} ${finding.name}${finding.reason ? ` — ${finding.reason}` : ''}`);
  }

  if (result.warnings.length) {
    console.log('\n  Warnings');
    for (const warning of result.warnings) console.log(`  ! ${warning}`);
  }
  console.log(`\n  rubric v${result.meta.rubric_version} · ${result.meta.scored_rules} rules scored · ${Math.round(result.meta.weight_coverage * 100)}% of weight resolved\n`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) { usage(); process.exit(0); }

  const resumeText = options.file
    ? await fs.readFile(options.file, 'utf8')
    : process.stdin.isTTY ? '' : await readStdin();

  if (!resumeText || !resumeText.trim()) {
    console.error('Error: resume text is required. Use --file <path> or pipe text to stdin.');
    usage();
    process.exit(1);
  }

  const rubric = await loadRubric();
  const { system, user } = buildPrompt({
    rubric, resumeText, targetRole: options.role, inputMode: options.inputMode,
    context: { region: options.region, route: options.route, practice: options.practice },
  });

  if (options.showPrompt) {
    console.log(`===== SYSTEM =====\n${system}\n\n===== USER =====\n${user}`);
    process.exit(0);
  }

  const keyCheck = validateProviderKey(resolveProvider());
  if (!keyCheck.ok) {
    console.error(`Error: ${keyCheck.message}`);
    console.error('\nTo try the pipeline without a key, re-run with --mock.');
    process.exit(1);
  }

  const { modelOutput, rawResponse, provider } = await callModel({
    system,
    user,
    schema: buildResponseSchema(rubric),
  });
  const result = assess({ rubric, modelOutput, resumeText, inputMode: options.inputMode });
  result.meta.provider = provider;

  const injection = detectInjection(resumeText);
  if (injection.length) result.warnings.push(`resume text contains ${injection.length} instruction-like pattern(s) — review manually`);

  if (options.json) {
    console.log(JSON.stringify({ resume_source: options.file || 'stdin', role: options.role, result, raw_response: rawResponse }, null, 2));
  } else {
    printSummary(result);
  }
}

main().catch((err) => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
