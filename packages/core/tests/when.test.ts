import { describe, it, expect } from 'vitest';
import { matchWhen } from '../src/context/whenEval.js';
import { compileWhen } from '../src/context/whenParser.js';
import { WhenExpressionError } from '../src/errors.js';

describe('when expressions', () => {
  it('evaluates bare identifiers as truthiness', () => {
    expect(matchWhen('editorFocus', { editorFocus: true })).toBe(true);
    expect(matchWhen('editorFocus', { editorFocus: false })).toBe(false);
    expect(matchWhen('editorFocus', {})).toBe(false);
  });

  it('evaluates equality against string and boolean literals', () => {
    expect(matchWhen("scope == 'editor'", { scope: 'editor' })).toBe(true);
    expect(matchWhen("scope == 'editor'", { scope: 'global' })).toBe(false);
    expect(matchWhen('readOnly != true', { readOnly: false })).toBe(true);
  });

  it('honors boolean precedence and grouping', () => {
    const ctx = { a: true, b: false, c: true };
    expect(matchWhen('a && b', ctx)).toBe(false);
    expect(matchWhen('a || b', ctx)).toBe(true);
    expect(matchWhen('a && (b || c)', ctx)).toBe(true);
    expect(matchWhen('!b && c', ctx)).toBe(true);
  });

  it('supports `in` for substring membership', () => {
    expect(matchWhen("lang in 'javascript typescript'", { lang: 'typescript' })).toBe(true);
    expect(matchWhen("lang in 'javascript typescript'", { lang: 'python' })).toBe(false);
  });

  it('caches compiled expressions', () => {
    expect(compileWhen('a && b')).toBe(compileWhen('a && b'));
  });

  it('throws a descriptive error on malformed input', () => {
    expect(() => compileWhen('a &&')).toThrow(WhenExpressionError);
    expect(() => compileWhen('(a || b')).toThrow(WhenExpressionError);
    expect(() => compileWhen('a $ b')).toThrow(WhenExpressionError);
  });
});
