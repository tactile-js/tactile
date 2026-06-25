import type { Chord } from '../keys/chord.js';
import { isModifierEventKey, normalizeEventKey } from '../keys/chord.js';
import { formatBinding } from '../keys/format.js';
import type { KeyEvent, KeyEventSource, Platform, RecordedShortcut } from '../types.js';

/** Build a canonical, re-parseable binding string from a single keystroke. */
function chordToBinding(chord: Chord): string {
  const parts: string[] = [];
  if (chord.ctrl) parts.push('ctrl');
  if (chord.alt) parts.push('alt');
  if (chord.shift) parts.push('shift');
  if (chord.meta) parts.push('meta');
  parts.push(chord.key);
  return parts.join('+');
}

function eventToChord(event: KeyEvent): Chord | null {
  const key = normalizeEventKey(event.key);
  // Ignore lone modifier presses — wait for a "real" key to complete the combo.
  if (isModifierEventKey(key)) return null;
  return {
    ctrl: event.ctrlKey,
    shift: event.shiftKey,
    alt: event.altKey,
    meta: event.metaKey,
    key,
  };
}

/**
 * Listen for the next complete keystroke and report it as a binding string plus
 * a display label — the primitive behind "press a key to rebind" settings UIs.
 * Returns a stop function; recording also stops itself after the first capture.
 */
export function recordShortcut(
  source: KeyEventSource,
  platform: Platform,
  callback: (shortcut: RecordedShortcut) => void,
): () => void {
  let stopped = false;

  const off = source.on('keydown', (event) => {
    if (stopped) return;
    const chord = eventToChord(event);
    if (!chord) return;

    event.preventDefault?.();
    const binding = chordToBinding(chord);
    stop();
    callback({ binding, label: formatBinding(binding, platform) });
  });

  function stop(): void {
    if (stopped) return;
    stopped = true;
    off();
  }

  return stop;
}
