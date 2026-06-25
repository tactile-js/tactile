import { sequenceSignature } from '../keys/chord.js';
import type { RegisteredRule } from './registry.js';
import type { Collision } from '../types.js';

/**
 * Find rules that compete for the same keystroke.
 *
 * We group rules by binding signature, then flag a group as a collision when two
 * of its rules could be active at the same time. Proving two arbitrary `when`
 * expressions are mutually exclusive is a SAT-shaped problem, so we stay
 * deliberately conservative and low-noise: rules collide only when at least one
 * has no `when`, or their `when` strings are identical. Different `when`s are
 * assumed to be intentional scoping and are not reported.
 */
export function detectCollisions(rules: RegisteredRule[]): Collision[] {
  const groups = new Map<string, RegisteredRule[]>();

  for (const registered of rules) {
    for (const binding of registered.bindings) {
      const signature = sequenceSignature(binding.chords);
      const bucket = groups.get(signature);
      if (bucket) bucket.push(registered);
      else groups.set(signature, [registered]);
    }
  }

  const collisions: Collision[] = [];

  for (const bucket of groups.values()) {
    if (bucket.length < 2) continue;

    const conflicting = bucket.filter((a) =>
      bucket.some((b) => a !== b && whensCanOverlap(a.rule.when, b.rule.when)),
    );
    if (conflicting.length < 2) continue;

    // Use a stable, human-readable representation of the shared binding.
    const sample = bucket[0].bindings[0].source;
    collisions.push({
      keys: sample,
      rules: dedupeById(conflicting).map((r) => ({
        id: r.rule.id,
        when: r.rule.when,
        priority: r.rule.priority ?? 0,
      })),
    });
  }

  return collisions;
}

function whensCanOverlap(a: string | undefined, b: string | undefined): boolean {
  if (a === undefined || b === undefined) return true;
  return a === b;
}

function dedupeById(rules: RegisteredRule[]): RegisteredRule[] {
  const seen = new Set<string>();
  const result: RegisteredRule[] = [];
  for (const r of rules) {
    if (seen.has(r.rule.id)) continue;
    seen.add(r.rule.id);
    result.push(r);
  }
  return result;
}
