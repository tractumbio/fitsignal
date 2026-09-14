import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FAKE_CLAUDE = fileURLToPath(new URL('./fixtures/fake-claude.mjs', import.meta.url));

// provider-claude-cli.js reads CLAUDE_CLI_BIN once via a module-level
// default, but resolves it per call — set it before importing so every test
// in this file talks to the stub, never a real `claude` install.
process.env.CLAUDE_CLI_BIN = FAKE_CLAUDE;

const { callModel, isAvailable } = await import('../src/lib/provider-claude-cli.js');

test('isAvailable is true when the binary runs, and is cached', () => {
  assert.equal(isAvailable(), true);
});

test('callModel sends the user turn over stdin and parses the result field as JSON', async () => {
  const user = 'x'.repeat(500); // large enough that an argv-based approach would be a smell
  const { modelOutput, rawResponse } = await callModel({ system: 'sys', user, schema: null });
  assert.equal(modelOutput.echoLength, user.length);
  assert.equal(rawResponse.subtype, 'success');
});

test('an error envelope on stdout is surfaced as a thrown error, not silently ignored', async () => {
  process.env.FAKE_CLAUDE_MODE = 'error';
  try {
    await assert.rejects(
      callModel({ system: 'sys', user: 'u', schema: null }),
      /claude CLI reported an error/
    );
  } finally {
    delete process.env.FAKE_CLAUDE_MODE;
  }
});

test('non-JSON stdout is a clear error, not a crash on JSON.parse', async () => {
  process.env.FAKE_CLAUDE_MODE = 'not-json';
  try {
    await assert.rejects(
      callModel({ system: 'sys', user: 'u', schema: null }),
      /did not return the expected JSON envelope/
    );
  } finally {
    delete process.env.FAKE_CLAUDE_MODE;
  }
});

test('a missing binary names itself in the error, not a bare ENOENT', async () => {
  process.env.CLAUDE_CLI_BIN = path.join(path.dirname(FAKE_CLAUDE), 'does-not-exist');
  try {
    await assert.rejects(
      callModel({ system: 'sys', user: 'u', schema: null }),
      /is not on PATH/
    );
  } finally {
    process.env.CLAUDE_CLI_BIN = FAKE_CLAUDE;
  }
});
