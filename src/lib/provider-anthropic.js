import Anthropic from '@anthropic-ai/sdk';

import { extractJson } from './json.js';

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5';
const DEFAULT_MAX_TOKENS = Number(process.env.ANTHROPIC_MAX_TOKENS || 16000);

/**
 * Concatenates the text blocks of a Messages API response.
 *
 * Thinking is on by default on Claude Opus 5, so `content` normally leads with
 * a thinking block — indexing content[0] would return the wrong block.
 */
export function extractText(message) {
  return (message?.content || [])
    .filter((block) => block?.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();
}

export async function callModel({ system, user, schema, apiKey, model = DEFAULT_MODEL, maxTokens = DEFAULT_MAX_TOKENS }) {
  const client = new Anthropic(apiKey ? { apiKey } : {});

  const request = {
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  };

  // Structured outputs guarantee schema-valid JSON, which removes the whole
  // class of "model wrapped the JSON in prose" failures.
  if (schema) request.output_config = { format: { type: 'json_schema', schema } };

  const message = await client.messages.create(request);

  if (message.stop_reason === 'refusal') {
    const category = message.stop_details?.category ?? 'unspecified';
    throw new Error(`model declined to score this input (refusal category: ${category})`);
  }
  if (message.stop_reason === 'max_tokens') {
    throw new Error(`response truncated at max_tokens (${maxTokens}) — raise ANTHROPIC_MAX_TOKENS`);
  }

  return { modelOutput: extractJson(extractText(message)), rawResponse: message };
}
