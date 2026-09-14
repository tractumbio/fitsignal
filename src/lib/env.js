import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { isAvailable as claudeCliAvailable } from './provider-claude-cli.js';

// src/lib/env.js -> src/lib -> src -> project root
const PROJECT_ROOT = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const ENV_PATH = path.join(PROJECT_ROOT, '.env');

/**
 * Minimal .env parser. Supports `KEY=value`, `export KEY=value`, quoted values,
 * comments, and blank lines. Deliberately not a dependency.
 */
function parseEnvFile(contents) {
  const out = {};
  for (const rawLine of contents.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    let value = match[2].trim();
    // Strip matching surrounding quotes, then any trailing inline comment on
    // unquoted values.
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, '').trim();
    }
    out[match[1]] = value;
  }
  return out;
}

/**
 * Loads .env if present.
 *
 * NOTE: values in .env OVERRIDE the surrounding shell environment. That is the
 * opposite of dotenv's default, and it is deliberate — this machine's ~/.zshrc
 * exports a truncated ANTHROPIC_API_KEY that would otherwise silently shadow a
 * correct key and produce a confusing 401. On Cloud Run there is no .env file,
 * so deployment env vars are unaffected.
 */
export function loadEnv({ path: envPath = ENV_PATH } = {}) {
  if (!fs.existsSync(envPath)) return { loaded: false, keys: [] };

  const parsed = parseEnvFile(fs.readFileSync(envPath, 'utf8'));
  for (const [key, value] of Object.entries(parsed)) process.env[key] = value;

  return { loaded: true, keys: Object.keys(parsed), path: envPath };
}

const KEY_RULES = {
  ANTHROPIC_API_KEY: { prefix: 'sk-ant-', minLength: 40, console: 'https://console.anthropic.com/settings/keys' },
  OPENAI_API_KEY: { prefix: 'sk-', minLength: 40, console: 'https://platform.openai.com/api-keys' },
};

/**
 * Checks the shape of whichever provider key is in play and returns an
 * actionable message. Catches the truncated-key case up front instead of
 * letting it surface as an opaque 401 mid-request.
 */
export function validateProviderKey(provider) {
  if (provider === 'mock') return { ok: true, message: 'mock provider — no key required' };

  if (provider === 'claude-cli') {
    return claudeCliAvailable()
      ? { ok: true, message: 'using the local `claude` CLI — no API key required' }
      : {
          ok: false,
          message:
            'LLM_PROVIDER=claude-cli (or no API key was found) but the `claude` CLI is not on PATH. ' +
            'Install Claude Code and log in (claude auth), set CLAUDE_CLI_BIN, or set ANTHROPIC_API_KEY/OPENAI_API_KEY.',
        };
  }

  const name = provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY';
  const rule = KEY_RULES[name];
  const value = process.env[name] || '';

  if (!value) {
    return { ok: false, message: `${name} is not set. Add it to .env — see .env.example. Create a key at ${rule.console}` };
  }
  if (!value.startsWith(rule.prefix)) {
    return { ok: false, message: `${name} does not start with "${rule.prefix}" — this does not look like a valid key.` };
  }
  if (value.length < rule.minLength) {
    return {
      ok: false,
      message:
        `${name} is only ${value.length} characters — it is truncated, not a full key. ` +
        `Note that ~/.zshrc exports this variable (lines 9-10) with a truncated value; ` +
        `a value in .env overrides it, or remove those export lines. Create a fresh key at ${rule.console}`,
    };
  }
  return { ok: true, message: `${name} present (${value.length} chars)` };
}
