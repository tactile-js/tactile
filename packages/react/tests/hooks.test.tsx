import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import {
  KeybindProvider,
  useShortcut,
  useScope,
  useKeymap,
  type KeybindingHandler,
} from '../src/index.js';

afterEach(cleanup);

/** Dispatch a real keyboard event on the document, as a user keystroke would. */
function press(init: KeyboardEventInit & { key: string }): void {
  act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }));
  });
}

function wrapper(children: ReactNode) {
  return <KeybindProvider options={{ platform: 'other' }}>{children}</KeybindProvider>;
}

describe('useShortcut', () => {
  it('fires while mounted and stops after unmount', () => {
    const handler = vi.fn();
    function Bound() {
      useShortcut({ id: 'save', keys: 'ctrl+s', handler });
      return null;
    }
    const { unmount } = render(wrapper(<Bound />));

    press({ key: 's', code: 'KeyS', ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);

    unmount();
    press({ key: 's', code: 'KeyS', ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('uses the latest handler closure without re-registering', () => {
    const calls: number[] = [];
    function Counter() {
      const [count, setCount] = useState(0);
      const handler: KeybindingHandler = () => {
        calls.push(count);
      };
      useShortcut({ id: 'inc', keys: 'ctrl+i', handler });
      return (
        <button onClick={() => setCount((c) => c + 1)} type="button">
          inc
        </button>
      );
    }
    const { getByText } = render(wrapper(<Counter />));

    press({ key: 'i', code: 'KeyI', ctrlKey: true });
    act(() => getByText('inc').click());
    act(() => getByText('inc').click());
    press({ key: 'i', code: 'KeyI', ctrlKey: true });

    // First press saw count 0, second saw the updated count 2 — proving the
    // ref-based handler stays current while the binding itself is stable.
    expect(calls).toEqual([0, 2]);
  });
});

describe('useScope', () => {
  it('gates shortcuts by the active scope', () => {
    const handler = vi.fn();
    function App() {
      const { setScope } = useScope();
      useShortcut({ id: 'fmt', keys: 'ctrl+f', when: "scope == 'editor'", handler });
      return (
        <button onClick={() => setScope('editor')} type="button">
          focus editor
        </button>
      );
    }
    const { getByText } = render(wrapper(<App />));

    press({ key: 'f', code: 'KeyF', ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();

    act(() => getByText('focus editor').click());
    press({ key: 'f', code: 'KeyF', ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('useKeymap', () => {
  it('exposes registered shortcuts with formatted labels', () => {
    let captured: string[] = [];
    function App() {
      useShortcut({ id: 'pal', keys: 'ctrl+k', description: 'Palette', handler: () => {} });
      const keymap = useKeymap();
      captured = keymap.flatMap((r) => r.labels);
      return null;
    }
    render(wrapper(<App />));
    expect(captured).toContain('Ctrl+K');
  });
});
