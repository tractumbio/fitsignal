import fs from 'fs/promises';
import { parse } from 'yaml';

const RUBRIC_PATH = new URL('../../rules/rubric.yaml', import.meta.url);

/**
 * Loads and validates the scoring rubric.
 *
 * This replaces the previous behaviour, which read `fit_rules.txt` — a list of
 * URLs — and injected it under the header "expert consulting resume fit rules".
 * A model cannot dereference URLs, so the scorer was effectively ungrounded.
 */
export async function loadRubric(path = RUBRIC_PATH) {
  const raw = await fs.readFile(path, 'utf8');
  const rubric = parse(raw);
  validateRubric(rubric);
  normaliseWeights(rubric);
  rubric.byId = new Map(rubric.rules.map((rule) => [rule.id, rule]));
  return rubric;
}

/**
 * Weights in rubric.yaml are RELATIVE — they express importance against each
 * other and need not sum to anything. This rescales them to sum to 1.0 so the
 * scoring maths downstream is unchanged.
 *
 * Editing the rubric therefore means changing one number, not rebalancing
 * twenty-odd others by hand. `weight_raw` preserves what was authored.
 */
export function normaliseWeights(rubric) {
  const total = rubric.rules.reduce((sum, rule) => sum + rule.weight, 0);
  for (const rule of rubric.rules) {
    rule.weight_raw = rule.weight;
    rule.weight = rule.weight / total;
  }
  return rubric;
}

/**
 * Fails loudly at startup rather than silently producing garbage scores.
 * A rubric whose weights don't sum to 1 yields an `overall` that isn't on the
 * scale it claims to be on.
 */
export function validateRubric(rubric) {
  if (!rubric || typeof rubric !== 'object') throw new Error('rubric is not an object');
  if (!Array.isArray(rubric.rules) || !rubric.rules.length) throw new Error('rubric.rules must be a non-empty array');
  if (!Array.isArray(rubric.dimensions) || !rubric.dimensions.length) throw new Error('rubric.dimensions must be a non-empty array');
  if (!Array.isArray(rubric.criteria) || !rubric.criteria.length) throw new Error('rubric.criteria must be a non-empty array');

  const ids = new Set();
  for (const rule of rubric.rules) {
    if (!rule.id) throw new Error('every rule needs an id');
    if (ids.has(rule.id)) throw new Error(`duplicate rule id: ${rule.id}`);
    ids.add(rule.id);
    if (typeof rule.weight !== 'number' || rule.weight < 0) throw new Error(`${rule.id}: weight must be a non-negative number`);
    if (!rule.test) throw new Error(`${rule.id}: missing test`);
    if (!Array.isArray(rule.observable_in) || !rule.observable_in.length) {
      throw new Error(`${rule.id}: observable_in must list at least one input mode`);
    }
  }

  const total = rubric.rules.reduce((sum, rule) => sum + rule.weight, 0);
  if (total <= 0) {
    throw new Error('at least one rule must carry a positive weight');
  }

  for (const dim of rubric.dimensions) {
    for (const id of dim.rules || []) {
      if (!ids.has(id)) throw new Error(`dimension "${dim.name}" references unknown rule ${id}`);
    }
  }
  for (const criterion of rubric.criteria) {
    for (const id of criterion.from || []) {
      if (!ids.has(id)) throw new Error(`criterion "${criterion.label}" references unknown rule ${id}`);
    }
  }

  // Every rule with weight should be reachable from some dimension, or it
  // silently influences `overall` while being invisible in the UI.
  const inDims = new Set(rubric.dimensions.flatMap((dim) => dim.rules || []));
  const orphans = rubric.rules.filter((rule) => rule.weight > 0 && !inDims.has(rule.id));
  if (orphans.length) {
    throw new Error(`weighted rules not mapped to any dimension: ${orphans.map((r) => r.id).join(', ')}`);
  }

  return true;
}
