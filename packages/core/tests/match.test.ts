import { describe, it, expect } from 'vitest';
import { parseBinding } from '../src/keys/parse.js';
import { matchChord } from '../src/keys/match.js';
import { keyEvent } from './helpers.js';

const chord = (binding: string) => parseBinding(binding, 'other')[0]!;

describe('matchChord — hybrid mode (default)', () => {
  it('matches letters by physical code, ignoring the produced character', () => {
    // A German layout where the physical "KeyZ" produces "y": Cmd+Z should still
    // fire on the Z key. This is the case keyCode-based libraries get wrong.
    const event = keyEvent({ key: 'y', code: 'KeyZ', ctrlKey: true });
    expect(matchChord(chord('ctrl+z'), event, 'hybrid')).toBe(true);
    expect(matchChord(chord('ctrl+y'), event, 'hybrid')).toBe(false);
  });

  it('matches symbols by character, not position', () => {
    // "?" is Shift+/ on US layouts; the author means the glyph, so shift is lenient.
    const event = keyEvent({ key: '?', code: 'Slash', shiftKey: true });
    expect(matchChord(chord('?'), event, 'hybrid')).toBe(true);
  });

  it('matches named keys by their stable key value', () => {
    const event = keyEvent({ key: 'ArrowUp', code: 'ArrowUp' });
    expect(matchChord(chord('up'), event, 'hybrid')).toBe(true);
  });

  it('enforces exact modifier state for non-symbol keys', () => {
    const noShift = keyEvent({ key: 'a', code: 'KeyA' });
    expect(matchChord(chord('a'), noShift, 'hybrid')).toBe(true);
    const withShift = keyEvent({ key: 'A', code: 'KeyA', shiftKey: true });
    expect(matchChord(chord('a'), withShift, 'hybrid')).toBe(false);
    expect(matchChord(chord('shift+a'), withShift, 'hybrid')).toBe(true);
  });
});

describe('matchChord — logical mode', () => {
  it('matches the produced character regardless of position', () => {
    const event = keyEvent({ key: 'y', code: 'KeyZ' });
    expect(matchChord(chord('y'), event, 'logical')).toBe(true);
    expect(matchChord(chord('z'), event, 'logical')).toBe(false);
  });
});

describe('matchChord — physical mode', () => {
  it('matches the physical position regardless of character', () => {
    const event = keyEvent({ key: 'y', code: 'KeyZ' });
    expect(matchChord(chord('z'), event, 'physical')).toBe(true);
    expect(matchChord(chord('y'), event, 'physical')).toBe(false);
  });
});
