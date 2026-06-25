import { createContext, useContext } from 'react';
import type { KeybindingEngine } from '@tactile/core';

/** Shared engine instance, provided by {@link KeybindProvider}. */
export const KeybindContext = createContext<KeybindingEngine | null>(null);

/**
 * Access the engine from any descendant of a `<KeybindProvider>`. Throws a clear
 * error when used outside one, rather than failing later with a null reference.
 */
export function useEngine(): KeybindingEngine {
  const engine = useContext(KeybindContext);
  if (!engine) {
    throw new Error('@tactile/react: hooks must be used inside a <KeybindProvider>.');
  }
  return engine;
}
