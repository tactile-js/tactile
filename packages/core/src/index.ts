/**
 * @tactile/core — a modern, context-aware keyboard shortcut engine.
 *
 * The public surface is intentionally small. Most apps need only
 * `createKeybindingEngine` plus the types; the lower-level helpers are exported
 * for tooling (custom adapters, inspectors, settings editors).
 */

export { createKeybindingEngine } from './engine/engine.js';
export type { KeybindingEngine } from './engine/engine.js';

export { createDomSource, defaultIgnore } from './engine/source.js';

export { ContextStore } from './context/contextStore.js';
export type { ContextSnapshot, ContextValue } from './context/contextStore.js';

export { detectPlatform, resolveMod } from './keys/platform.js';
export { parseBinding } from './keys/parse.js';
export { formatBinding } from './keys/format.js';
export { matchChord } from './keys/match.js';

export { compileWhen } from './context/whenParser.js';
export { evaluateWhen, matchWhen } from './context/whenEval.js';

export { KeybindingParseError, WhenExpressionError } from './errors.js';

export type {
  Collision,
  EngineOptions,
  EventType,
  KeyEvent,
  KeyEventSource,
  KeybindingHandler,
  KeybindingRule,
  MatchInfo,
  MatchMode,
  Platform,
  RecordedShortcut,
  ResolvedBinding,
} from './types.js';
