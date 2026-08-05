/**
 * Tolerant JSON extraction: direct parse, then fenced block, then the first
 * balanced object. Replaces a blanket ``` strip, which corrupted any response
 * containing a backtick.
 *
 * With structured outputs the first branch always wins; the rest is the safety
 * net for providers or models that don't enforce a schema.
 */
export function extractJson(text) {
  const raw = String(text || '').trim();
  if (!raw) throw new Error('model returned an empty response');

  try {
    return JSON.parse(raw);
  } catch { /* fall through */ }

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch { /* fall through */ }
  }

  const start = raw.indexOf('{');
  if (start !== -1) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < raw.length; i += 1) {
      const char = raw[i];
      if (escaped) { escaped = false; continue; }
      if (char === '\\') { escaped = true; continue; }
      if (char === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (char === '{') depth += 1;
      if (char === '}') {
        depth -= 1;
        if (depth === 0) return JSON.parse(raw.slice(start, i + 1));
      }
    }
  }

  throw new Error('could not extract JSON from model response');
}
