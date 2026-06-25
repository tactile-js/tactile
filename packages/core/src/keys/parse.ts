import type { Chord } from './chord.js';
import { normalizeToken } from './chord.js';
import { resolveMod } from './platform.js';
import type { Platform } from '../types.js';
import { KeybindingParseError } from '../errors.js';

/** Modifier aliases -> the chord flag they set. `mod` is resolved per platform. */
const MODIFIER_TOKENS: Record<string, 'ctrl' | 'shift' | 'alt' | 'meta' | 'mod'> = {
  ctrl: 'ctrl',
  control: 'ctrl',
  shift: 'shift',
  alt: 'alt',
  option: 'alt',
  opt: 'alt',
  meta: 'meta',
  cmd: 'meta',
  command: 'meta',
  win: 'meta',
  super: 'meta',
  mod: 'mod',
};

function parseStroke(stroke: string, platform: Platform, full: string): Chord {
  const chord: Chord = { ctrl: false, shift: false, alt: false, meta: false, key: '' };

  // Split on '+', but an empty segment means the literal '+' key (e.g. "ctrl++").
  const parts = stroke.split('+').map((p) => p.trim());
  let keyAssigned = false;

  for (const part of parts) {
    const token = part === '' ? '+' : part.toLowerCase();

    const mod = part === '' ? undefined : MODIFIER_TOKENS[token];
    if (mod) {
      const flag = mod === 'mod' ? resolveMod(platform) : mod;
      chord[flag] = true;
      continue;
    }

    const canonical = normalizeToken(token);
    if (keyAssigned && canonical !== chord.key) {
      throw new KeybindingParseError(
        `a single stroke may only have one main key (saw "${chord.key}" and "${canonical}")`,
        full,
      );
    }
    chord.key = canonical;
    keyAssigned = true;
  }

  if (!keyAssigned) {
    throw new KeybindingParseError('expected a key, found only modifiers', full);
  }
  return chord;
}

/**
 * Parse a single binding string into a sequence of chords. Whitespace separates
 * strokes in a sequence (`"g i"`), `+` joins keys within a stroke (`"ctrl+k"`).
 */
export function parseBinding(input: string, platform: Platform): Chord[] {
  const trimmed = input.trim();
  if (trimmed === '') throw new KeybindingParseError('binding is empty', input);

  const strokes = trimmed.split(/\s+/);
  return strokes.map((stroke) => parseStroke(stroke, platform, input));
}

/** Parse a rule's `keys` (string or alternatives) into one sequence per binding. */
export function parseBindings(
  keys: string | string[],
  platform: Platform,
): Array<{ source: string; chords: Chord[] }> {
  const list = Array.isArray(keys) ? keys : [keys];
  return list.map((source) => ({ source, chords: parseBinding(source, platform) }));
}
