import { WhenExpressionError } from '../errors.js';

/**
 * A small boolean expression language, modeled on VS Code's `when` clauses.
 * Grammar (loosest to tightest binding):
 *
 *   or         := and ('||' and)*
 *   and        := equality ('&&' equality)*
 *   equality   := unary (('=='|'!='|'in') unary)?
 *   unary      := '!' unary | primary
 *   primary    := '(' or ')' | string | number | 'true' | 'false' | identifier
 *
 * Identifiers may contain dots (`editor.langId`) to match how hosts namespace
 * context keys. A bare identifier is a truthiness check.
 */

export type WhenNode =
  | { t: 'or'; l: WhenNode; r: WhenNode }
  | { t: 'and'; l: WhenNode; r: WhenNode }
  | { t: 'eq'; l: WhenNode; r: WhenNode }
  | { t: 'neq'; l: WhenNode; r: WhenNode }
  | { t: 'in'; l: WhenNode; r: WhenNode }
  | { t: 'not'; e: WhenNode }
  | { t: 'id'; name: string }
  | { t: 'str'; value: string }
  | { t: 'num'; value: number }
  | { t: 'bool'; value: boolean };

type Token =
  | { kind: 'id'; value: string }
  | { kind: 'str'; value: string }
  | { kind: 'num'; value: number }
  | { kind: 'op'; value: string }
  | { kind: 'eof' };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      let value = '';
      while (j < input.length && input[j] !== quote) value += input[j++];
      if (j >= input.length) throw new WhenExpressionError('unterminated string', input);
      tokens.push({ kind: 'str', value });
      i = j + 1;
      continue;
    }

    if (/[0-9]/.test(ch)) {
      let j = i;
      let num = '';
      while (j < input.length && /[0-9.]/.test(input[j])) num += input[j++];
      tokens.push({ kind: 'num', value: Number(num) });
      i = j;
      continue;
    }

    const two = input.slice(i, i + 2);
    if (two === '&&' || two === '||' || two === '==' || two === '!=') {
      tokens.push({ kind: 'op', value: two });
      i += 2;
      continue;
    }

    if (ch === '!' || ch === '(' || ch === ')') {
      tokens.push({ kind: 'op', value: ch });
      i++;
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      let id = '';
      while (j < input.length && /[A-Za-z0-9_.]/.test(input[j])) id += input[j++];
      if (id === 'in') tokens.push({ kind: 'op', value: 'in' });
      else tokens.push({ kind: 'id', value: id });
      i = j;
      continue;
    }

    throw new WhenExpressionError(`unexpected character "${ch}"`, input);
  }

  tokens.push({ kind: 'eof' });
  return tokens;
}

class Parser {
  private pos = 0;
  constructor(
    private readonly tokens: Token[],
    private readonly source: string,
  ) {}

  parse(): WhenNode {
    const node = this.parseOr();
    if (this.peek().kind !== 'eof') {
      throw new WhenExpressionError('unexpected trailing tokens', this.source);
    }
    return node;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private isOp(value: string): boolean {
    const t = this.peek();
    return t.kind === 'op' && t.value === value;
  }

  private eatOp(value: string): boolean {
    if (this.isOp(value)) {
      this.pos++;
      return true;
    }
    return false;
  }

  private parseOr(): WhenNode {
    let node = this.parseAnd();
    while (this.eatOp('||')) node = { t: 'or', l: node, r: this.parseAnd() };
    return node;
  }

  private parseAnd(): WhenNode {
    let node = this.parseEquality();
    while (this.eatOp('&&')) node = { t: 'and', l: node, r: this.parseEquality() };
    return node;
  }

  private parseEquality(): WhenNode {
    const node = this.parseUnary();
    if (this.eatOp('==')) return { t: 'eq', l: node, r: this.parseUnary() };
    if (this.eatOp('!=')) return { t: 'neq', l: node, r: this.parseUnary() };
    if (this.eatOp('in')) return { t: 'in', l: node, r: this.parseUnary() };
    return node;
  }

  private parseUnary(): WhenNode {
    if (this.eatOp('!')) return { t: 'not', e: this.parseUnary() };
    return this.parsePrimary();
  }

  private parsePrimary(): WhenNode {
    const token = this.peek();

    if (this.eatOp('(')) {
      const node = this.parseOr();
      if (!this.eatOp(')')) throw new WhenExpressionError('missing closing ")"', this.source);
      return node;
    }

    if (token.kind === 'str') {
      this.pos++;
      return { t: 'str', value: token.value };
    }
    if (token.kind === 'num') {
      this.pos++;
      return { t: 'num', value: token.value };
    }
    if (token.kind === 'id') {
      this.pos++;
      if (token.value === 'true') return { t: 'bool', value: true };
      if (token.value === 'false') return { t: 'bool', value: false };
      return { t: 'id', name: token.value };
    }

    throw new WhenExpressionError('expected an expression', this.source);
  }
}

// Compiling a `when` string is pure, so cache the AST. The same expression is
// typically registered once and evaluated on every keystroke.
const cache = new Map<string, WhenNode>();

export function compileWhen(expression: string): WhenNode {
  const cached = cache.get(expression);
  if (cached) return cached;

  const node = new Parser(tokenize(expression), expression).parse();
  cache.set(expression, node);
  return node;
}
