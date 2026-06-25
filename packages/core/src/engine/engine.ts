import { ContextStore } from '../context/contextStore.js';
import type { ContextSnapshot } from '../context/contextStore.js';
import { KeybindingRegistry } from '../registry/registry.js';
import type { RegisteredRule } from '../registry/registry.js';
import { detectCollisions } from '../registry/collisions.js';
import { formatBinding } from '../keys/format.js';
import { detectPlatform } from '../keys/platform.js';
import { evaluateWhen } from '../context/whenEval.js';
import { recordShortcut } from '../record/recorder.js';
import { Dispatcher } from './dispatcher.js';
import { createDomSource, defaultIgnore } from './source.js';
import type {
  Collision,
  EngineOptions,
  KeybindingRule,
  Platform,
  RecordedShortcut,
  ResolvedBinding,
} from '../types.js';

/** The public engine instance returned by {@link createKeybindingEngine}. */
export interface KeybindingEngine {
  /** Register a rule. Returns an unbind function. */
  add(rule: KeybindingRule): () => void;
  /** The context-key store driving `when` expressions and scopes. */
  readonly context: ContextStore;
  /** All registered rules with platform-formatted labels, for help UIs. */
  getKeymap(): ResolvedBinding[];
  /** Like {@link getKeymap}, but only rules whose `when` holds in `snapshot`. */
  getKeymapForContext(snapshot: ContextSnapshot): ResolvedBinding[];
  /** Rules that compete for the same keystroke. */
  getCollisions(): Collision[];
  /** Capture the next keystroke as a binding string + label. */
  recordShortcut(callback: (shortcut: RecordedShortcut) => void): () => void;
  /** Format a binding string for display on the current (or given) platform. */
  format(binding: string, platform?: Platform): string;
  /** Subscribe to keymap changes (a rule added or removed). Returns an unsubscribe. */
  subscribeKeymap(listener: () => void): () => void;
  /** Detach all listeners and clear internal state. */
  dispose(): void;
}

/**
 * Create an engine. This is a factory, not a global singleton: each instance
 * owns its own registry, context and listeners, which keeps apps isolated and
 * makes the whole thing trivially testable.
 */
export function createKeybindingEngine(options: EngineOptions = {}): KeybindingEngine {
  const platform = options.platform ?? detectPlatform();
  const defaultMatch = options.defaultMatch ?? 'hybrid';
  const sequenceTimeout = options.sequenceTimeout ?? 1000;
  const ignore = options.ignore ?? defaultIgnore;
  const debug = options.debug ?? false;

  const context = new ContextStore();
  const registry = new KeybindingRegistry(platform, defaultMatch);
  const source = options.source ?? createDomSource();

  const dispatcher = new Dispatcher({
    registry,
    context,
    ignore,
    sequenceTimeout,
    now: () => Date.now(),
    debug,
  });

  // One pair of listeners for the engine's lifetime; rules come and go from the
  // registry rather than re-binding the DOM each time.
  const offKeydown = source.on('keydown', (event) => dispatcher.handle(event, 'keydown'));
  const offKeyup = source.on('keyup', (event) => dispatcher.handle(event, 'keyup'));

  const keymapListeners = new Set<() => void>();
  const emitKeymapChange = () => {
    for (const listener of keymapListeners) listener();
  };

  function resolveRule(registered: RegisteredRule): ResolvedBinding {
    const keys = registered.bindings.map((b) => b.source);
    return {
      id: registered.rule.id,
      keys,
      labels: keys.map((k) => formatBinding(k, platform)),
      when: registered.rule.when,
      group: registered.rule.group,
      description: registered.rule.description,
      priority: registered.rule.priority ?? 0,
    };
  }

  return {
    context,

    add(rule: KeybindingRule): () => void {
      const handle = registry.add(rule);
      if (debug) {
        const keys = Array.isArray(rule.keys) ? rule.keys.join(', ') : rule.keys;
        console.debug(`[keybind] registered ${rule.id} (${keys})`);
        for (const c of detectCollisions(registry.list())) {
          if (c.rules.some((r) => r.id === rule.id)) {
            console.warn(
              `[keybind] collision on "${c.keys}": ${c.rules.map((r) => r.id).join(' vs ')}`,
            );
          }
        }
      }
      emitKeymapChange();
      return () => {
        if (registry.remove(handle)) emitKeymapChange();
      };
    },

    getKeymap(): ResolvedBinding[] {
      return registry.list().map(resolveRule);
    },

    getKeymapForContext(snapshot: ContextSnapshot): ResolvedBinding[] {
      return registry
        .list()
        .filter((r) => !r.when || evaluateWhen(r.when, snapshot))
        .map(resolveRule);
    },

    getCollisions(): Collision[] {
      return detectCollisions(registry.list());
    },

    recordShortcut(callback: (shortcut: RecordedShortcut) => void): () => void {
      return recordShortcut(source, platform, callback);
    },

    format(binding: string, overridePlatform?: Platform): string {
      return formatBinding(binding, overridePlatform ?? platform);
    },

    subscribeKeymap(listener: () => void): () => void {
      keymapListeners.add(listener);
      return () => keymapListeners.delete(listener);
    },

    dispose(): void {
      offKeydown();
      offKeyup();
      keymapListeners.clear();
      dispatcher.reset();
    },
  };
}
