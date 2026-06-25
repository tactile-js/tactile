import type { EventType, KeyEvent, KeyEventSource } from '../types.js';

/**
 * The default source: real DOM key events from a target (the document, usually).
 * The engine only knows about the `KeyEventSource` interface, so swapping this
 * for a fake in tests — or a different host entirely — needs no engine changes.
 */
export function createDomSource(target?: EventTarget): KeyEventSource {
  const resolved = target ?? (typeof document !== 'undefined' ? document : undefined);
  if (!resolved) {
    throw new Error(
      'createDomSource: no DOM target available. Pass an explicit target, or provide a custom `source` in EngineOptions for non-DOM hosts.',
    );
  }

  return {
    on(type: EventType, listener: (event: KeyEvent) => void): () => void {
      const handler = (event: Event) => listener(event as unknown as KeyEvent);
      resolved.addEventListener(type, handler);
      return () => resolved.removeEventListener(type, handler);
    },
  };
}

/**
 * Default ignore predicate: skip shortcuts while the user is typing into a form
 * field or contenteditable region. Matches the long-standing behavior of
 * hotkeys-js and friends, and is overridable via `EngineOptions.ignore`.
 */
export function defaultIgnore(event: KeyEvent): boolean {
  const target = event.target as (HTMLElement & { isContentEditable?: boolean }) | null;
  if (!target || typeof target.tagName !== 'string') return false;

  const tag = target.tagName.toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}
