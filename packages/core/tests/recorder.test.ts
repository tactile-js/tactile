import { describe, it, expect, vi } from 'vitest';
import { recordShortcut } from '../src/record/recorder.js';
import { fakeSource, keyEvent } from './helpers.js';

describe('recordShortcut', () => {
  it('captures the first complete keystroke as a binding + label', () => {
    const { source, emit } = fakeSource();
    const onRecord = vi.fn();
    recordShortcut(source, 'mac', onRecord);

    emit('keydown', keyEvent({ key: 'k', code: 'KeyK', ctrlKey: true, shiftKey: true }));

    expect(onRecord).toHaveBeenCalledWith({ binding: 'ctrl+shift+k', label: '⌃⇧K' });
  });

  it('waits past lone modifier presses', () => {
    const { source, emit } = fakeSource();
    const onRecord = vi.fn();
    recordShortcut(source, 'other', onRecord);

    emit('keydown', keyEvent({ key: 'Control', ctrlKey: true }));
    expect(onRecord).not.toHaveBeenCalled();

    emit('keydown', keyEvent({ key: 'p', code: 'KeyP', ctrlKey: true }));
    expect(onRecord).toHaveBeenCalledOnce();
  });

  it('stops after the first capture', () => {
    const { source, emit } = fakeSource();
    const onRecord = vi.fn();
    recordShortcut(source, 'other', onRecord);

    emit('keydown', keyEvent({ key: 'a', code: 'KeyA' }));
    emit('keydown', keyEvent({ key: 'b', code: 'KeyB' }));
    expect(onRecord).toHaveBeenCalledOnce();
  });
});
