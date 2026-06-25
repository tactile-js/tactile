import type { Chord } from './chord.js';
import { parseBinding } from './parse.js';
import { detectPlatform } from './platform.js';
import type { Platform } from '../types.js';

/** Pretty labels for named keys, shared across platforms. */
const KEY_LABELS: Record<string, string> = {
  enter: '↵',
  escape: 'Esc',
  space: 'Space',
  tab: 'Tab',
  backspace: '⌫',
  delete: 'Del',
  insert: 'Ins',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  home: 'Home',
  end: 'End',
  pageup: 'PgUp',
  pagedown: 'PgDn',
  capslock: 'Caps',
};

function labelForKey(token: string): string {
  if (token in KEY_LABELS) return KEY_LABELS[token];
  if (/^f\d{1,2}$/.test(token)) return token.toUpperCase();
  if (/^[a-z]$/.test(token)) return token.toUpperCase();
  return token;
}

function formatChord(chord: Chord, platform: Platform): string {
  if (platform === 'mac') {
    // macOS convention: ⌃⌥⇧⌘, no separators, modifiers before the key.
    const mods =
      (chord.ctrl ? '⌃' : '') +
      (chord.alt ? '⌥' : '') +
      (chord.shift ? '⇧' : '') +
      (chord.meta ? '⌘' : '');
    return mods + labelForKey(chord.key);
  }

  const parts: string[] = [];
  if (chord.ctrl) parts.push('Ctrl');
  if (chord.alt) parts.push('Alt');
  if (chord.shift) parts.push('Shift');
  if (chord.meta) parts.push('Win');
  parts.push(labelForKey(chord.key));
  return parts.join('+');
}

/**
 * Format a binding string into a human-readable, platform-appropriate label.
 * `'mod+shift+p'` becomes `'⇧⌘P'` on macOS and `'Ctrl+Shift+P'` elsewhere.
 * Sequence strokes are joined with a thin gap, e.g. `'g i'` -> `'G I'`.
 */
export function formatBinding(binding: string, platform: Platform = detectPlatform()): string {
  const chords = parseBinding(binding, platform);
  return chords.map((chord) => formatChord(chord, platform)).join(' ');
}
