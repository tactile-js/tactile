import { useMemo } from 'react';
import type { ContextValue } from '@tactile-js/core';
import { useEngine } from './context.js';

export interface ScopeControls {
  /** Set any context key, e.g. `set('editorFocus', true)`. */
  set(key: string, value: ContextValue): void;
  /** Remove a context key. */
  remove(key: string): void;
  /** Set the single active scope: gates rules written as `scope == 'name'`. */
  setScope(name: string): void;
  /** Turn on a named scope flag: gates rules written as `scope.name`. */
  enableScope(name: string): void;
  /** Turn off a named scope flag. */
  disableScope(name: string): void;
  /** Flip a named scope flag on or off. */
  toggleScope(name: string): void;
}

/**
 * Imperative controls over the engine's context keys. Scopes are intentionally
 * just sugar over context keys, so two styles are supported: a single active
 * scope (`scope == 'editor'`) or independent flags (`scope.editor`).
 */
export function useScope(): ScopeControls {
  const engine = useEngine();

  return useMemo<ScopeControls>(
    () => ({
      set: (key, value) => {
        engine.context.set(key, value);
      },
      remove: (key) => {
        engine.context.delete(key);
      },
      setScope: (name) => {
        engine.context.set('scope', name);
      },
      enableScope: (name) => {
        engine.context.set(`scope.${name}`, true);
      },
      disableScope: (name) => {
        engine.context.set(`scope.${name}`, false);
      },
      toggleScope: (name) => {
        engine.context.set(`scope.${name}`, !engine.context.get(`scope.${name}`));
      },
    }),
    [engine],
  );
}
