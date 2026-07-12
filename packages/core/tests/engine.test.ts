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
  const input = { tagName: 'INPUT' } as unknown as EventTarget;

  it('skips shortcuts while typing in a text field', () => {
    const { engine, emit } = setup();
    const handler = vi.fn();
    engine.add({ id: 'save', keys: 'ctrl+s', handler });

    emit('keydown', keyEvent({ key: 's', code: 'KeyS', ctrlKey: true, target: input }));
    expect(handler).not.toHaveBeenCalled();
  });

  it('fires opted-in rules inside form fields and prevents the browser default', () => {
    const { engine, emit } = setup();
    const palette = vi.fn();
    const save = vi.fn();
    engine.add({ id: 'palette', keys: 'ctrl+k', enableInFormFields: true, handler: palette });
    engine.add({ id: 'save', keys: 'ctrl+s', handler: save });

    const event = keyEvent({ key: 'k', code: 'KeyK', ctrlKey: true, target: input, preventDefault: vi.fn() });
    emit('keydown', event);
    emit('keydown', keyEvent({ key: 's', code: 'KeyS', ctrlKey: true, target: input }));

    expect(palette).toHaveBeenCalledOnce();
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(save).not.toHaveBeenCalled();
  });

  it('never fires sequences inside form fields, even when opted in', () => {
    const { engine, emit } = setup();
    const handler = vi.fn();
    engine.add({ id: 'goInbox', keys: 'g i', enableInFormFields: true, handler });

    emit('keydown', keyEvent({ key: 'g', code: 'KeyG', target: input }));
    emit('keydown', keyEvent({ key: 'i', code: 'KeyI', target: input }));
    expect(handler).not.toHaveBeenCalled();
  });

  it('typing in a field does not arm sequences for after focus leaves', () => {
    const { engine, emit } = setup();
    const handler = vi.fn();
    engine.add({ id: 'goInbox', keys: 'g i', handler });

    // "g" typed into the input, then "i" pressed outside — must not complete g i.
    emit('keydown', keyEvent({ key: 'g', code: 'KeyG', target: input }));
    emit('keydown', keyEvent({ key: 'i', code: 'KeyI' }));
    expect(handler).not.toHaveBeenCalled();

    // A clean g then i outside the field still works.
    emit('keydown', keyEvent({ key: 'g', code: 'KeyG' }));
    emit('keydown', keyEvent({ key: 'i', code: 'KeyI' }));
    expect(handler).toHaveBeenCalledOnce();
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
