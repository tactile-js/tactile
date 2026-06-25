import { useEffect, useState, type ReactNode } from 'react';
import { createKeybindingEngine, type EngineOptions, type KeybindingEngine } from '@tactile-js/core';
import { KeybindContext } from './context.js';

export interface KeybindProviderProps {
  /** Options for an engine the provider creates and owns. Ignored if `engine` is set. */
  options?: EngineOptions;
  /** Supply a pre-built engine instead. The provider will not dispose it. */
  engine?: KeybindingEngine;
  children: ReactNode;
}

/**
 * Creates (or adopts) a single engine and shares it with descendants. An engine
 * the provider creates is disposed on unmount; an injected one is left alone,
 * since its lifecycle belongs to the caller.
 */
export function KeybindProvider({ options, engine: external, children }: KeybindProviderProps) {
  // Lazy initializer runs once per mount, so the engine — and its DOM listeners —
  // are created a single time rather than on every render.
  const [engine] = useState<KeybindingEngine>(() => external ?? createKeybindingEngine(options));

  useEffect(() => {
    if (external) return;
    return () => engine.dispose();
    // Engine identity is stable for the provider's lifetime.
  }, []);

  return <KeybindContext.Provider value={engine}>{children}</KeybindContext.Provider>;
}
