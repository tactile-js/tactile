import type { Chord } from '../keys/chord.js';
import { parseBindings } from '../keys/parse.js';
import { compileWhen } from '../context/whenParser.js';
import type { WhenNode } from '../context/whenParser.js';
import type { KeybindingRule, MatchMode, Platform } from '../types.js';

/** A binding string together with its parsed chord sequence. */
export interface ParsedBinding {
  source: string;
  chords: Chord[];
}

/** A rule after parsing/compiling, with bookkeeping the dispatcher relies on. */
export interface RegisteredRule {
  rule: KeybindingRule;
  bindings: ParsedBinding[];
  when?: WhenNode;
  match: MatchMode;
  eventType: 'keydown' | 'keyup';
  /** Monotonic registration order; ties break toward the most recent (last wins). */
  order: number;
}

/**
 * Owns the live set of rules. Parsing and `when`-compilation happen here at
 * registration time so failures surface to the caller of `add`, and so the hot
 * dispatch path never re-parses anything.
 */
export class KeybindingRegistry {
  private readonly rules = new Map<symbol, RegisteredRule>();
  private orderCounter = 0;

  constructor(
    private readonly platform: Platform,
    private readonly defaultMatch: MatchMode,
  ) {}

  add(rule: KeybindingRule): symbol {
    const handle = Symbol(rule.id);
    const registered: RegisteredRule = {
      rule,
      bindings: parseBindings(rule.keys, this.platform),
      when: rule.when ? compileWhen(rule.when) : undefined,
      match: rule.match ?? this.defaultMatch,
      eventType: rule.eventType ?? 'keydown',
      order: this.orderCounter++,
    };
    this.rules.set(handle, registered);
    return handle;
  }

  remove(handle: symbol): boolean {
    return this.rules.delete(handle);
  }

  list(): RegisteredRule[] {
    return [...this.rules.values()];
  }

  /** Longest sequence currently registered — caps the dispatcher's key buffer. */
  maxSequenceLength(): number {
    let max = 1;
    for (const registered of this.rules.values()) {
      for (const binding of registered.bindings) {
        if (binding.chords.length > max) max = binding.chords.length;
      }
    }
    return max;
  }
}
