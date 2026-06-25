import type { WhenNode } from './whenParser.js';
import { compileWhen } from './whenParser.js';
import type { ContextSnapshot, ContextValue } from './contextStore.js';

type Evaluated = ContextValue | undefined;

function toBool(value: Evaluated): boolean {
  return Boolean(value);
}

function valueOf(node: WhenNode, ctx: ContextSnapshot): Evaluated {
  switch (node.t) {
    case 'str':
      return node.value;
    case 'num':
      return node.value;
    case 'bool':
      return node.value;
    case 'id':
      return ctx[node.name];
    case 'not':
      return !toBool(valueOf(node.e, ctx));
    case 'and':
      return toBool(valueOf(node.l, ctx)) && toBool(valueOf(node.r, ctx));
    case 'or':
      return toBool(valueOf(node.l, ctx)) || toBool(valueOf(node.r, ctx));
    case 'eq':
      return valueOf(node.l, ctx) === valueOf(node.r, ctx);
    case 'neq':
      return valueOf(node.l, ctx) !== valueOf(node.r, ctx);
    case 'in': {
      const haystack = valueOf(node.r, ctx);
      const needle = valueOf(node.l, ctx);
      if (typeof haystack === 'string') return haystack.includes(String(needle));
      return false;
    }
  }
}

/** Evaluate a parsed `when` AST against a context snapshot. */
export function evaluateWhen(node: WhenNode, ctx: ContextSnapshot): boolean {
  return toBool(valueOf(node, ctx));
}

/** Convenience: compile (cached) and evaluate a `when` string in one call. */
export function matchWhen(expression: string, ctx: ContextSnapshot): boolean {
  return evaluateWhen(compileWhen(expression), ctx);
}
