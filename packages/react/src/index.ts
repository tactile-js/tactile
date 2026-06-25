/**
 * @tactile/react — thin React bindings over @tactile/core.
 *
 * The adapter contains no key-matching logic of its own; it manages engine
 * lifecycle and binding registration around the React component lifecycle, and
 * re-exports the core so consumers can keep a single import.
 */

export { KeybindProvider } from './KeybindProvider.js';
export type { KeybindProviderProps } from './KeybindProvider.js';
export { useEngine } from './context.js';
export { useShortcut } from './useShortcut.js';
export { useScope } from './useScope.js';
export type { ScopeControls } from './useScope.js';
export { useShortcutRecorder } from './useShortcutRecorder.js';
export type { ShortcutRecorder } from './useShortcutRecorder.js';
export { useKeymap } from './useKeymap.js';
export type { UseKeymapOptions } from './useKeymap.js';

// Re-export the core surface for one-import ergonomics.
export * from '@tactile/core';
