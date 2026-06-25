import { describe, it, expect, vi } from 'vitest';
import { createKeybindingEngine } from '../src/engine/engine.js';
import { fakeSource, keyEvent } from './helpers.js';

function setup() {
  const { source, emit } = fakeSource();
  const engine = createKeybindingEngine({ source, platform: 'other' });
  return { engine, emit };
}

describe('engine — basic dispatch', () => {
  it('fires a handler when its binding matches', () => {
    const { engine, emit } = setup();
    const handler = vi.fn();
    engine.add({ id: 'save', keys: 'ctrl+s', handler });

    emit('keydown', keyEvent({ key: 's', code: 'KeyS', ctrlKey: true }));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('does not fire after the rule is removed', () => {
    const { engine, emit } = setup();
    const handler = vi.fn();
    const off = engine.add({ id: 'save', keys: 'ctrl+s', handler });
    off();

    emit('keydown', keyEvent({ key: 's', code: 'KeyS', ctrlKey: true }));
    expect(handler).not.toHaveBeenCalled();
  });

  it('calls preventDefault by default, but not when the handler returns false', () => {
    const { engine, emit } = setup();
    engine.add({ id: 'a', keys: 'ctrl+a', handler: () => {} });
    engine.add({ id: 'b', keys: 'ctrl+b', handler: () => false });

    const a = keyEvent({ key: 'a', code: 'KeyA', ctrlKey: true, preventDefault: vi.fn() });
    const b = keyEvent({ key: 'b', code: 'KeyB', ctrlKey: true, preventDefault: vi.fn() });
    emit('keydown', a);
    emit('keydown', b);

    expect(a.preventDefault).toHaveBeenCalledOnce();
    expect(b.preventDefault).not.toHaveBeenCalled();
  });
});

describe('engine — context gating', () => {
  it('only fires rules whose when-expression holds', () => {
    const { engine, emit } = setup();
    const handler = vi.fn();
    engine.add({ id: 'fmt', keys: 'ctrl+f', when: "scope == 'editor'", handler });

    emit('keydown', keyEvent({ key: 'f', code: 'KeyF', ctrlKey: true }));
    expect(handler).not.toHaveBeenCalled();

    engine.context.set('scope', 'editor');
    emit('keydown', keyEvent({ key: 'f', code: 'KeyF', ctrlKey: true }));
    expect(handler).toHaveBeenCalledOnce();
  });
});

describe('engine — collision resolution', () => {
  it('higher priority wins', () => {
    const { engine, emit } = setup();
    const low = vi.fn();
    const high = vi.fn();
    engine.add({ id: 'low', keys: 'ctrl+k', handler: low });
    engine.add({ id: 'high', keys: 'ctrl+k', handler: high, priority: 10 });

    emit('keydown', keyEvent({ key: 'k', code: 'KeyK', ctrlKey: true }));
    expect(high).toHaveBeenCalledOnce();
    expect(low).not.toHaveBeenCalled();
  });

  it('reports collisions via getCollisions', () => {
    const { engine } = setup();
    engine.add({ id: 'one', keys: 'ctrl+k', handler: () => {} });
    engine.add({ id: 'two', keys: 'ctrl+k', handler: () => {} });

    const collisions = engine.getCollisions();
    expect(collisions).toHaveLength(1);
    expect(collisions[0].rules.map((r) => r.id).sort()).toEqual(['one', 'two']);
  });

  it('does not report rules separated by distinct scopes', () => {
    const { engine } = setup();
    engine.add({ id: 'one', keys: 'ctrl+k', when: "scope == 'a'", handler: () => {} });
    engine.add({ id: 'two', keys: 'ctrl+k', when: "scope == 'b'", handler: () => {} });
    expect(engine.getCollisions()).toHaveLength(0);
  });
});

describe('engine — sequences', () => {
  it('fires only after both strokes of a sequence', () => {
    const { engine, emit } = setup();
    const handler = vi.fn();
    engine.add({ id: 'goInbox', keys: 'g i', handler });

    emit('keydown', keyEvent({ key: 'g', code: 'KeyG' }));
    expect(handler).not.toHaveBeenCalled();
    emit('keydown', keyEvent({ key: 'i', code: 'KeyI' }));
    expect(handler).toHaveBeenCalledOnce();
  });
});

describe('engine — ignore predicate', () => {
  it('skips shortcuts while typing in a text field', () => {
    const { engine, emit } = setup();
    const handler = vi.fn();
    engine.add({ id: 'save', keys: 'ctrl+s', handler });

    const target = { tagName: 'INPUT' } as unknown as EventTarget;
    emit('keydown', keyEvent({ key: 's', code: 'KeyS', ctrlKey: true, target }));
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('engine — introspection', () => {
  it('exposes a formatted keymap and filters by context', () => {
    const engine = createKeybindingEngine({ source: fakeSource().source, platform: 'mac' });
    engine.add({ id: 'pal', keys: 'mod+k', description: 'Palette', handler: () => {} });
    engine.add({ id: 'fmt', keys: 'mod+f', when: 'editorFocus', handler: () => {} });

    const map = engine.getKeymap();
    expect(map.find((r) => r.id === 'pal')?.labels).toEqual(['⌘K']);

    const visible = engine.getKeymapForContext({ editorFocus: false });
    expect(visible.map((r) => r.id)).toEqual(['pal']);
  });
});
