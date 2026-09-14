import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { extractJson } from './json.js';

/**
 * Scores through the `claude` CLI already installed and logged in on this
 * machine, instead of an Anthropic API key. Same account, same subscription,
 * no key to provision or leak — the natural choice when FitSignal is run
 * from a machine that already has Claude Code set up (see
 * pipeline/score.sh in the resume repo, which prefers this automatically).
 *
 * Uses `claude -p --output-format json --json-schema <schema>` — the CLI's
 * own structured-output support, the same guarantee provider-anthropic.js
 * gets from the Messages API's output_config. The rubric-derived system
 * prompt goes in via --system-prompt-file (a temp file, not a CLI arg — the
 * full rubric is tens of KB and could bump an OS argv limit); the resume
 * goes in over stdin for the same reason, and so it's never echoed into the
 * CLI's own history the way a positional argument would be.
 *
 * --tools "" / --permission-prompts none / --strict-mcp-config: this is a
 * pure text-completion call. Nothing here should read a file, run a command,
 * or reach an MCP server — those are all switched off so a call can't hang
 * on a permission prompt with no one there to answer it, and can't do
 * anything to the machine beyond returning text.
 * --no-session-persistence: a scoring call is not a conversation; nothing
 * about it should show up in `claude --resume` afterwards.
 */

// Read per-call, not captured at module-load time: lets tests point at a
// stub binary via CLAUDE_CLI_BIN without needing to control import order.
function claudeBin() {
  return process.env.CLAUDE_CLI_BIN || 'claude';
}

const availabilityCache = new Map();

/** True if the configured binary runs at all. Cached per binary path. */
export function isAvailable() {
  const bin = claudeBin();
  if (availabilityCache.has(bin)) return availabilityCache.get(bin);
  let ok;
  try {
    execFileSync(bin, ['--version'], { stdio: 'ignore', timeout: 5000 });
    ok = true;
  } catch {
    ok = false;
  }
  availabilityCache.set(bin, ok);
  return ok;
}

export async function callModel({ system, user, schema }) {
  const CLAUDE_BIN = claudeBin();
  const MODEL = process.env.CLAUDE_CLI_MODEL || '';
  const sysFile = path.join(os.tmpdir(), `fitsignal-system-${process.pid}-${Date.now()}.txt`);
  fs.writeFileSync(sysFile, system, 'utf8');

  const args = [
    '-p', '--output-format', 'json',
    '--no-session-persistence',
    '--strict-mcp-config',
    '--tools', '',
    '--permission-prompts', 'none',
    '--system-prompt-file', sysFile,
  ];
  if (schema) args.push('--json-schema', JSON.stringify(schema));
  if (MODEL) args.push('--model', MODEL);

  let raw;
  try {
    try {
      raw = execFileSync(CLAUDE_BIN, args, {
        input: user,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
      });
    } catch (err) {
      // Non-zero exit (e.g. the CLI reported a modelled error) still writes
      // its JSON envelope to stdout — prefer that over the bare exit code.
      if (err.stdout) {
        raw = err.stdout;
      } else if (err.code === 'ENOENT') {
        throw new Error(
          `"${CLAUDE_BIN}" is not on PATH. Install Claude Code and log in, ` +
          `or set CLAUDE_CLI_BIN to its path, or use LLM_PROVIDER=anthropic/openai/mock.`
        );
      } else {
        throw new Error(`claude CLI exited with an error: ${err.stderr || err.message}`);
      }
    }
  } finally {
    fs.rmSync(sysFile, { force: true });
  }

  let envelope;
  try {
    envelope = JSON.parse(raw);
  } catch {
    throw new Error(`claude CLI did not return the expected JSON envelope: ${String(raw).slice(0, 300)}`);
  }

  if (envelope.is_error || envelope.subtype !== 'success') {
    const detail = envelope.result || envelope.error || envelope.subtype || 'no detail';
    throw new Error(`claude CLI reported an error: ${detail}`);
  }

  return { modelOutput: extractJson(envelope.result), rawResponse: envelope };
}
