/**
 * Typed errors. We throw these at registration time rather than swallowing bad
 * input, so a mistyped binding or `when` expression surfaces immediately with a
 * message that points at the offending source — not three keystrokes later when
 * nothing fires.
 */

export class KeybindingParseError extends Error {
  constructor(
    message: string,
    public readonly input: string,
  ) {
    super(`Invalid binding "${input}": ${message}`);
    this.name = 'KeybindingParseError';
  }
}

export class WhenExpressionError extends Error {
  constructor(
    message: string,
    public readonly expression: string,
  ) {
    super(`Invalid when-expression "${expression}": ${message}`);
    this.name = 'WhenExpressionError';
  }
}
