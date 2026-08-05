import * as anthropic from './provider-anthropic.js';
import * as openai from './provider-openai.js';
import * as mock from './provider-mock.js';

export { extractJson } from './json.js';
export { extractText } from './provider-openai.js';

/**
 * Picks a provider from the environment.
 *
 * The repo was internally inconsistent about this: the code called OpenAI while
 * README.md and GCP_SCHEMA.md both described an Anthropic backend. Rather than
 * pick for you, this dispatches on whichever key is present. Set LLM_PROVIDER
 * explicitly to override.
 */
export function resolveProvider() {
  const explicit = (process.env.LLM_PROVIDER || '').toLowerCase();
  if (['anthropic', 'openai', 'mock'].includes(explicit)) return explicit;
  if (explicit) throw new Error(`unknown LLM_PROVIDER "${explicit}" (expected "anthropic", "openai" or "mock")`);

  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY) return 'openai';
  throw new Error('no model provider configured — set ANTHROPIC_API_KEY or OPENAI_API_KEY, or use LLM_PROVIDER=mock');
}

export async function callModel({ system, user, schema }) {
  const provider = resolveProvider();

  if (provider === 'mock') {
    const result = await mock.callModel({ system, user, schema });
    return { ...result, provider };
  }

  if (provider === 'anthropic') {
    const result = await anthropic.callModel({ system, user, schema, apiKey: process.env.ANTHROPIC_API_KEY });
    return { ...result, provider };
  }

  // The OpenAI path predates the rubric rewrite and has no structured-output
  // support wired up; the tolerant JSON extractor covers it.
  const result = await openai.callModel({ system, user, apiKey: process.env.OPENAI_API_KEY });
  return { ...result, provider };
}
