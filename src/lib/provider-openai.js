import { extractJson } from './json.js';

const OPENAI_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const DEFAULT_MAX_OUTPUT_TOKENS = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || 8000);

/**
 * Pulls text out of a Responses API payload.
 *
 * The previous implementation read `data.output[0].content` directly. That is
 * fragile: `output` is an array of items and index 0 is not guaranteed to be
 * the message, which silently yielded '' and surfaced as a JSON parse error.
 */
export function extractText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text;

  const items = Array.isArray(data?.output) ? data.output : [];
  return items
    .flatMap((item) => (Array.isArray(item?.content) ? item.content : []))
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('')
    .trim();
}

export async function callModel({ system, user, apiKey, model = DEFAULT_MODEL, maxOutputTokens = DEFAULT_MAX_OUTPUT_TOKENS, signal }) {
  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    // NOTE: the Responses API parameter is `max_output_tokens`. The previous
    // code sent `max_tokens`, which is the Chat Completions name.
    body: JSON.stringify({ model, input: `${system}\n\n${user}`, max_output_tokens: maxOutputTokens }),
    signal,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}: ${body}`);
  }

  const data = await response.json();
  return { modelOutput: extractJson(extractText(data)), rawResponse: data };
}
