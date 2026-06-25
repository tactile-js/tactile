import type { EventType, KeyEvent, KeyEventSource } from '../src/types.js';

/** Build a synthetic KeyEvent. Only the fields the engine reads are required. */
export function keyEvent(partial: Partial<KeyEvent> & { key: string }): KeyEvent {
  return {
    key: partial.key,
    code: partial.code ?? '',
    ctrlKey: partial.ctrlKey ?? false,
    shiftKey: partial.shiftKey ?? false,
    altKey: partial.altKey ?? false,
    metaKey: partial.metaKey ?? false,
    repeat: partial.repeat ?? false,
    target: partial.target ?? null,
    preventDefault: partial.preventDefault ?? (() => {}),
  };
}

/**
 * An in-memory key source for tests: `emit` pushes events to the engine without
 * touching the DOM, which is exactly the seam the engine was designed around.
 */
export function fakeSource() {
  const listeners: Record<EventType, Set<(e: KeyEvent) => void>> = {
    keydown: new Set(),
    keyup: new Set(),
  };

  const source: KeyEventSource = {
    on(type, listener) {
      listeners[type].add(listener);
      return () => listeners[type].delete(listener);
    },
  };

  function emit(type: EventType, event: KeyEvent): void {
    for (const listener of [...listeners[type]]) listener(event);
  }

  return { source, emit };
}
