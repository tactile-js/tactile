/**
 * The key model: a `Chord` is one keystroke — a set of modifier flags plus a
 * single main key, stored as a canonical token. Bindings parse into sequences
 * of chords (`g i` -> two chords), and matching compares a chord against a live
 * `KeyEvent`.
 *
 * Everything here is layout-aware on purpose. We keep two ideas separate: the
 * *character* a key produces (`KeyboardEvent.key`) and its *physical position*
 * (`KeyboardEvent.code`). The match mode decides which one a given token uses —
 * see `match.ts` for the policy.
 */

export interface Chord {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  /** Canonical token for the main key, e.g. `'k'`, `'enter'`, `'up'`, `'?'`. */
  key: string;
}

export type TokenKind = 'named' | 'letter' | 'digit' | 'symbol';

/**
 * Named (non-character) keys. The value is the token's canonical form; the key
 * side lists the aliases a user might type. We map both author input and live
 * `event.key` values into this same space so comparison is apples-to-apples.
 */
const NAMED_ALIASES: Record<string, string> = {
  enter: 'enter',
  return: 'enter',
  escape: 'escape',
  esc: 'escape',
  space: 'space',
  spacebar: 'space',
  tab: 'tab',
  backspace: 'backspace',
  delete: 'delete',
  del: 'delete',
  insert: 'insert',
  ins: 'insert',
  up: 'up',
  arrowup: 'up',
  down: 'down',
  arrowdown: 'down',
  left: 'left',
  arrowleft: 'left',
  right: 'right',
  arrowright: 'right',
  home: 'home',
  end: 'end',
  pageup: 'pageup',
  pgup: 'pageup',
  pagedown: 'pagedown',
  pgdn: 'pagedown',
  capslock: 'capslock',
};

// Function keys F1–F24 are named keys too; generate them rather than list them.
for (let i = 1; i <= 24; i++) NAMED_ALIASES[`f${i}`] = `f${i}`;

/** Canonical token -> `KeyboardEvent.code`, used by physical-mode matching. */
const NAMED_CODES: Record<string, string> = {
  enter: 'Enter',
  escape: 'Escape',
  space: 'Space',
  tab: 'Tab',
  backspace: 'Backspace',
  delete: 'Delete',
  insert: 'Insert',
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  home: 'Home',
  end: 'End',
  pageup: 'PageUp',
  pagedown: 'PageDown',
  capslock: 'CapsLock',
};
for (let i = 1; i <= 24; i++) NAMED_CODES[`f${i}`] = `F${i}`;

/** Symbol aliases a user may spell out instead of typing the glyph. */
const SYMBOL_ALIASES: Record<string, string> = {
  plus: '+',
  minus: '-',
  comma: ',',
  period: '.',
  dot: '.',
  slash: '/',
  backslash: '\\',
  semicolon: ';',
  quote: "'",
  backtick: '`',
  tilde: '~',
  equal: '=',
  equals: '=',
};

/** `event.key` values for modifier keys, so a lone modifier press is ignorable. */
const MODIFIER_KEYS = new Set(['control', 'shift', 'alt', 'meta', 'os', 'capslock', 'altgraph']);

/**
 * Normalize an author-supplied token (from a binding string) into canonical form.
 */
export function normalizeToken(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower in NAMED_ALIASES) return NAMED_ALIASES[lower];
  if (lower in SYMBOL_ALIASES) return SYMBOL_ALIASES[lower];
  return lower;
}

/**
 * Normalize a live `KeyboardEvent.key` into the same canonical token space, so
 * it can be compared against a parsed chord's `key`.
 */
export function normalizeEventKey(key: string): string {
  if (key === ' ') return 'space';
  const lower = key.toLowerCase();
  if (lower in NAMED_ALIASES) return NAMED_ALIASES[lower];
  return lower;
}

export function isModifierEventKey(key: string): boolean {
  return MODIFIER_KEYS.has(key.toLowerCase());
}

export function classifyToken(token: string): TokenKind {
  if (token in NAMED_CODES) return 'named';
  if (/^[a-z]$/.test(token)) return 'letter';
  if (/^[0-9]$/.test(token)) return 'digit';
  return 'symbol';
}

/**
 * Map a canonical token to its `KeyboardEvent.code`, or `undefined` when there
 * isn't a stable one (most symbols, whose code is layout-dependent).
 */
export function tokenToCode(token: string): string | undefined {
  if (/^[a-z]$/.test(token)) return `Key${token.toUpperCase()}`;
  if (/^[0-9]$/.test(token)) return `Digit${token}`;
  return NAMED_CODES[token];
}

/** Stable string signature for a chord, used for grouping and collision checks. */
export function chordSignature(chord: Chord): string {
  return [
    chord.ctrl ? 'C' : '',
    chord.alt ? 'A' : '',
    chord.shift ? 'S' : '',
    chord.meta ? 'M' : '',
    ':',
    chord.key,
  ].join('');
}

export function sequenceSignature(chords: Chord[]): string {
  return chords.map(chordSignature).join(' ');
}
