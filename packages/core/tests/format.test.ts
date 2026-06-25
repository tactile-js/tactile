import { describe, it, expect } from 'vitest';
import { formatBinding } from '../src/keys/format.js';

describe('formatBinding', () => {
  it('uses macOS glyphs in conventional order', () => {
    expect(formatBinding('mod+shift+p', 'mac')).toBe('⇧⌘P');
    expect(formatBinding('ctrl+alt+delete', 'mac')).toBe('⌃⌥Del');
  });

  it('uses word labels elsewhere', () => {
    expect(formatBinding('mod+shift+p', 'other')).toBe('Ctrl+Shift+P');
  });

  it('formats named keys with friendly labels', () => {
    expect(formatBinding('up', 'mac')).toBe('↑');
    expect(formatBinding('enter', 'mac')).toBe('↵');
  });

  it('joins sequence strokes with a space', () => {
    expect(formatBinding('g i', 'other')).toBe('G I');
  });
});
