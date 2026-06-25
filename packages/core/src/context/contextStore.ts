/**
 * A tiny observable key/value store for context keys — the state that `when`
 * expressions evaluate against. Scopes are not a separate concept here: a named
 * scope is just a context key (`scope == 'editor'`), which keeps the model small.
 */

export type ContextValue = string | number | boolean;
export type ContextSnapshot = Readonly<Record<string, ContextValue>>;

export class ContextStore {
  private readonly values = new Map<string, ContextValue>();
  private readonly listeners = new Set<() => void>();

  set(key: string, value: ContextValue): this {
    if (this.values.get(key) !== value) {
      this.values.set(key, value);
      this.emit();
    }
    return this;
  }

  get(key: string): ContextValue | undefined {
    return this.values.get(key);
  }

  has(key: string): boolean {
    return this.values.has(key);
  }

  delete(key: string): this {
    if (this.values.delete(key)) this.emit();
    return this;
  }

  /** Replace the whole context in one shot, emitting a single change. */
  assign(values: Record<string, ContextValue>): this {
    for (const [k, v] of Object.entries(values)) this.values.set(k, v);
    this.emit();
    return this;
  }

  snapshot(): ContextSnapshot {
    return Object.fromEntries(this.values);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}
