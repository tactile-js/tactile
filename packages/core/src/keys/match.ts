import type { Chord } from './chord.js';
import { classifyToken, normalizeEventKey, tokenToCode } from './chord.js';
import type { KeyEvent, MatchMode } from '../types.js';

/**
 * Resolve which signal a token compares against under a given mode.
 *
 * Hybrid is the interesting one, and the policy is deliberate:
 *   - letters & digits  -> physical (`code`). `Cmd+K` should be the K position,
 *     which is what app authors almost always mean, and it stays put across
 *     layouts.
 *   - named keys        -> logical (`key`). `Enter`, `ArrowUp`, `F5` have stable,
 *     layout-independent `key` values, so the character side is the reliable one.
 *   - symbols           -> logical (`key`). The author means the *character*
 *     `?` or `/`, whose physical position differs by layout — matching the glyph
 *     is the only thing that behaves sanely internationally.
 *
 * This is the single most important design call in the library, and it's the
 * thing the popular incumbents get wrong by leaning entirely on `keyCode`.
 */
function effectiveMode(token: string, mode: MatchMode): 'physical' | 'logical' {
  if (mode !== 'hybrid') return mode;
  const kind = classifyToken(token);
  return kind === 'letter' || kind === 'digit' ? 'physical' : 'logical';
}

function matchKeyToken(token: string, event: KeyEvent, mode: MatchMode): boolean {
  if (effectiveMode(token, mode) === 'physical') {
    const code = tokenToCode(token);
    // Symbols have no stable code; fall back to the character. Documented caveat.
    // Same fallback when the *event* carries no position data — synthetic events,
    // some IMEs, and virtual keyboards dispatch with an empty `code`, and matching
    // the character then beats matching nothing.
    if (code && event.code) return event.code === code;
    return normalizeEventKey(event.key) === token;
  }
  return normalizeEventKey(event.key) === token;
}

/**
 * Does this event satisfy this chord?
 *
 * Ctrl/Alt/Meta are matched exactly. Shift is matched exactly *except* when the
 * main key is a symbol: producing `?` already requires Shift on many layouts, so
 * enforcing it as well would make `'?'` impossible to bind. We let the glyph
 * carry that information instead.
 */
export function matchChord(chord: Chord, event: KeyEvent, mode: MatchMode): boolean {
  if (event.ctrlKey !== chord.ctrl) return false;
  if (event.altKey !== chord.alt) return false;
  if (event.metaKey !== chord.meta) return false;

  const symbolMain = classifyToken(chord.key) === 'symbol';
  if (!symbolMain && event.shiftKey !== chord.shift) return false;

  return matchKeyToken(chord.key, event, mode);
}
