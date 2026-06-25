import { useEffect, useReducer } from 'react';
import type { ResolvedBinding } from '@tactile/core';
import { useEngine } from './context.js';

export interface UseKeymapOptions {
  /** When true, return only the rules whose `when` holds in the current context. */
  forContext?: boolean;
}

/**
 * The live keymap, for building help dialogs and shortcut listings. Re-renders
 * when context keys change so a `forContext` view stays in sync with the active
 * scope.
 */
export function useKeymap(options: UseKeymapOptions = {}): ResolvedBinding[] {
  const engine = useEngine();
  const [, bump] = useReducer((n: number) => n + 1, 0);

  // Update on both registry changes (a rule added/removed) and context changes
  // (which can change a `forContext` view).
  useEffect(() => {
    const offKeymap = engine.subscribeKeymap(bump);
    const offContext = engine.context.subscribe(bump);
    // Sibling effects (e.g. useShortcut) may have registered rules before this
    // subscription existed; re-read once so the first paint isn't stale.
    bump();
    return () => {
      offKeymap();
      offContext();
    };
  }, [engine]);

  return options.forContext
    ? engine.getKeymapForContext(engine.context.snapshot())
    : engine.getKeymap();
}
