#!/usr/bin/env node
// Stands in for the `claude` binary in tests via CLAUDE_CLI_BIN, so
// provider-claude-cli.js is exercised without a real CLI or network call.
// Reads stdin (the "user" turn) and echoes a canned JSON envelope shaped
// like `claude -p --output-format json` actually returns.
import process from 'node:process';

let input = '';
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  if (process.env.FAKE_CLAUDE_MODE === 'error') {
    process.stdout.write(JSON.stringify({ type: 'result', subtype: 'error_during_execution', is_error: true, result: 'simulated failure' }));
    process.exit(1);
  }
  if (process.env.FAKE_CLAUDE_MODE === 'not-json') {
    process.stdout.write('not json at all');
    process.exit(0);
  }
  const echoLength = input.length;
  process.stdout.write(JSON.stringify({
    type: 'result',
    subtype: 'success',
    is_error: false,
    result: JSON.stringify({ echoLength, ok: true }),
  }));
});
