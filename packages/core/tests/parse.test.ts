import { describe, it, expect } from 'vitest';
import { parseBinding } from '../src/keys/parse.js';
import { KeybindingParseError } from '../src/errors.js';

describe('parseBinding', () => {
  it('parses a single modifier combo', () => {
    expect(parseBinding('ctrl+shift+k', 'other')).toEqual([
      { ctrl: true, shift: true, alt: false, meta: false, key: 'k' },
    ]);
  });

  it('resolves `mod` per platform', () => {
    expect(parseBinding('mod+k', 'mac')[0]!).toMatchObject({ meta: true, ctrl: false });
    expect(parseBinding('mod+k', 'other')[0]!).toMatchObject({ ctrl: true, meta: false });
  });

  it('parses a multi-stroke sequence', () => {
    const chords = parseBinding('g i', 'other');
    expect(chords).toHaveLength(2);
    expect(chords[0]!.key).toBe('g');
    expect(chords[1]!.key).toBe('i');
  });

  it('normalizes named-key and modifier aliases', () => {
    expect(parseBinding('cmd+esc', 'mac')[0]!).toMatchObject({ meta: true, key: 'escape' });
    expect(parseBinding('option+up', 'mac')[0]!).toMatchObject({ alt: true, key: 'up' });
    expect(parseBinding('control+return', 'other')[0]!).toMatchObject({ ctrl: true, key: 'enter' });
  });

  it('lowercases letters (uppercase does not imply shift)', () => {
    expect(parseBinding('K', 'other')[0]!).toMatchObject({ shift: false, key: 'k' });
  });

  it('parses the literal plus key', () => {
    expect(parseBinding('ctrl++', 'other')[0]!).toMatchObject({ ctrl: true, key: '+' });
    expect(parseBinding('plus', 'other')[0]!).toMatchObject({ key: '+' });
  });

  it('throws on modifier-only bindings', () => {
    expect(() => parseBinding('ctrl+shift', 'other')).toThrow(KeybindingParseError);
  });

  it('throws on two main keys in one stroke', () => {
    expect(() => parseBinding('a+b', 'other')).toThrow(KeybindingParseError);
  });

  it('throws on an empty binding', () => {
    expect(() => parseBinding('   ', 'other')).toThrow(KeybindingParseError);
  });
});
