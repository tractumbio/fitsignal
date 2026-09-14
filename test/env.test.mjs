import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const FAKE_CLAUDE = fileURLToPath(new URL('./fixtures/fake-claude.mjs', import.meta.url));

// This file's tests mutate provider env vars; node --test isolates each test
// file in its own process, so this never leaks into score.test.mjs et al.
delete process.env.ANTHROPIC_API_KEY;
delete process.env.OPENAI_API_KEY;
delete process.env.LLM_PROVIDER;
process.env.CLAUDE_CLI_BIN = FAKE_CLAUDE;

const { validateProviderKey } = await import('../src/lib/env.js');
const { resolveProvider } = await import('../src/lib/provider.js');

test('with no API key set, resolveProvider falls back to the local claude CLI', () => {
  assert.equal(resolveProvider(), 'claude-cli');
});

test('validateProviderKey(claude-cli) needs no API key and passes when the binary runs', () => {
  const result = validateProviderKey('claude-cli');
  assert.equal(result.ok, true);
  assert.match(result.message, /no API key required/);
});

test('validateProviderKey(claude-cli) fails clearly when the binary is missing', () => {
  process.env.CLAUDE_CLI_BIN = '/definitely/not/a/real/binary';
  try {
    const result = validateProviderKey('claude-cli');
    assert.equal(result.ok, false);
    assert.match(result.message, /not on PATH/);
  } finally {
    process.env.CLAUDE_CLI_BIN = FAKE_CLAUDE;
  }
});

test('an explicit ANTHROPIC_API_KEY still wins over the claude-cli fallback', () => {
  process.env.ANTHROPIC_API_KEY = 'sk-ant-' + 'x'.repeat(40);
  try {
    assert.equal(resolveProvider(), 'anthropic');
  } finally {
    delete process.env.ANTHROPIC_API_KEY;
  }
});

test('LLM_PROVIDER=claude-cli is accepted explicitly', () => {
  process.env.LLM_PROVIDER = 'claude-cli';
  try {
    assert.equal(resolveProvider(), 'claude-cli');
  } finally {
    delete process.env.LLM_PROVIDER;
  }
});
