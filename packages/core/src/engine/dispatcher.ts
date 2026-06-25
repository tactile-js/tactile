import { matchChord } from '../keys/match.js';
import { evaluateWhen } from '../context/whenEval.js';
import type { ContextStore } from '../context/contextStore.js';
import type { KeybindingRegistry, RegisteredRule, ParsedBinding } from '../registry/registry.js';
import type { EventType, KeyEvent } from '../types.js';

interface BufferedKey {
  event: KeyEvent;
  time: number;
}

interface Candidate {
  registered: RegisteredRule;
  binding: ParsedBinding;
}

export interface DispatcherDeps {
  registry: KeybindingRegistry;
  context: ContextStore;
  ignore: (event: KeyEvent) => boolean;
  sequenceTimeout: number;
  now: () => number;
  debug: boolean;
}

/**
 * The runtime matcher. Holds a short buffer of recent keystrokes so multi-stroke
 * sequences (`g i`) can be recognized, then resolves competing rules by priority
 * and registration recency — the same precedence model VS Code uses.
 */
export class Dispatcher {
  private buffer: BufferedKey[] = [];

  constructor(private readonly deps: DispatcherDeps) {}

  reset(): void {
    this.buffer = [];
  }

  handle(event: KeyEvent, type: EventType): void {
    if (this.deps.ignore(event)) return;

    // A held key repeats keydown; don't let that flood the sequence buffer.
    const isRepeat = type === 'keydown' && event.repeat === true;
    if (!isRepeat) this.appendToBuffer(event);

    const ctx = this.deps.context.snapshot();
    const candidates: Candidate[] = [];

    for (const registered of this.deps.registry.list()) {
      if (registered.eventType !== type) continue;
      if (registered.when && !evaluateWhen(registered.when, ctx)) continue;

      for (const binding of registered.bindings) {
        if (this.sequenceMatchesTail(binding, registered)) {
          candidates.push({ registered, binding });
        }
      }
    }

    if (candidates.length === 0) return;

    const winner = this.resolve(candidates);
    const multiStroke = winner.binding.chords.length > 1;

    if (this.deps.debug) {
      console.debug(
        `[keybind] ${winner.binding.source} -> ${winner.registered.rule.id}` +
          (candidates.length > 1 ? ` (won over ${candidates.length - 1})` : ''),
      );
    }

    const result = winner.registered.rule.handler(event, {
      id: winner.registered.rule.id,
      keys: winner.binding.source,
      sequence: multiStroke,
    });

    if (result !== false && this.shouldPreventDefault(winner.registered, event)) {
      event.preventDefault?.();
    }

    // A completed sequence consumes the buffer so the next stroke starts fresh.
    if (multiStroke) this.reset();
  }

  private appendToBuffer(event: KeyEvent): void {
    this.buffer.push({ event, time: this.deps.now() });
    const max = this.deps.registry.maxSequenceLength();
    if (this.buffer.length > max) {
      this.buffer = this.buffer.slice(this.buffer.length - max);
    }
  }

  /** Does the binding's chord sequence line up with the most recent keystrokes? */
  private sequenceMatchesTail(binding: ParsedBinding, registered: RegisteredRule): boolean {
    const seq = binding.chords;
    if (this.buffer.length < seq.length) return false;

    const slice = this.buffer.slice(this.buffer.length - seq.length);
    for (let i = 0; i < seq.length; i++) {
      if (!matchChord(seq[i], slice[i].event, registered.match)) return false;
      if (i > 0 && slice[i].time - slice[i - 1].time > this.deps.sequenceTimeout) return false;
    }
    return true;
  }

  private resolve(candidates: Candidate[]): Candidate {
    return candidates.reduce((best, current) => {
      const bestPriority = best.registered.rule.priority ?? 0;
      const currentPriority = current.registered.rule.priority ?? 0;
      if (currentPriority !== bestPriority) return currentPriority > bestPriority ? current : best;
      // Same priority: most recently registered rule wins (last-write-wins).
      return current.registered.order > best.registered.order ? current : best;
    });
  }

  private shouldPreventDefault(registered: RegisteredRule, event: KeyEvent): boolean {
    const pd = registered.rule.preventDefault;
    if (pd === undefined) return true;
    if (typeof pd === 'function') return pd(event);
    return pd;
  }
}
