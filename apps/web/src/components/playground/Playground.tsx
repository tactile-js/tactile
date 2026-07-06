import { useEffect, useReducer, useRef, useState } from 'react';
import {
  KeybindProvider,
  useEngine,
  useShortcut,
  useScope,
  useShortcutRecorder,
} from '@tactile-js/react';

/** Classify how hybrid mode would resolve a key — for the inspector. */
function classify(key: string, code: string): string {
  if (/^[a-z]$/i.test(key) || /^Key[A-Z]$/.test(code) || /^Digit\d$/.test(code)) {
    return 'physical (event.code)';
  }
  return 'logical (event.key)';
}

function Inner() {
  const engine = useEngine();
  const { setScope } = useScope();
  const [scope, setScopeLabel] = useState('global');
  const [log, setLog] = useState<string[]>([]);
  const [bold, setBold] = useState(false);
  const [snap, setSnap] = useState<{ key: string; code: string; mods: string } | null>(null);
  const { isRecording, combo, start } = useShortcutRecorder();
  const [, bump] = useReducer((n: number) => n + 1, 0);

  const fire = (msg: string) => setLog((l) => [msg, ...l].slice(0, 6));

  useShortcut({ id: 'palette', keys: 'mod+k', group: 'Navigation', description: 'Command palette', handler: () => fire('⌘K → command palette') });
  useShortcut({ id: 'save', keys: 'mod+s', group: 'File', description: 'Save', handler: () => fire('⌘S → saved') });
  useShortcut({ id: 'help', keys: '?', group: 'Navigation', description: 'Help', handler: () => fire('? → help') });
  useShortcut({ id: 'seq', keys: 'g i', group: 'Navigation', description: 'Go to inbox', handler: () => fire('g i → go to inbox') });
  useShortcut({
    id: 'bold',
    keys: 'ctrl+b',
    when: "scope == 'editor'",
    group: 'Editing',
    description: 'Bold (editor scope only)',
    handler: () => {
      setBold((b) => !b);
      fire('ctrl+B → bold toggled (editor scope)');
    },
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mods = [e.ctrlKey && 'Ctrl', e.altKey && 'Alt', e.shiftKey && 'Shift', e.metaKey && 'Meta']
        .filter(Boolean)
        .join('+');
      setSnap({ key: e.key, code: e.code, mods: mods || 'none' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => engine.subscribeKeymap(bump), [engine]);

  const collisions = engine.getCollisions();
  const keymap = engine.getKeymap();

  return (
    <div className="pg">
      <p className="pg__hint">
        Click into this panel, then press <kbd>⌘K</kbd>, <kbd>⌘S</kbd>, <kbd>?</kbd>, or type <kbd>g</kbd>{' '}
        <kbd>i</kbd>. Focus the editor to unlock its <code>ctrl+B</code> scope.
      </p>

      <div className="pg__grid">
        <section className="pg__card">
          <h3>KeyboardEvent inspector</h3>
          {snap ? (
            <dl className="pg__kv">
              <div><dt>event.key</dt><dd>{JSON.stringify(snap.key)}</dd></div>
              <div><dt>event.code</dt><dd>{snap.code}</dd></div>
              <div><dt>modifiers</dt><dd>{snap.mods}</dd></div>
              <div><dt>hybrid uses</dt><dd className="pg__accent">{classify(snap.key, snap.code)}</dd></div>
            </dl>
          ) : (
            <p className="pg__muted">Press any key…</p>
          )}
        </section>

        <section className="pg__card">
          <h3>Editor scope <span className="pg__pill">scope: {scope}</span></h3>
          <div
            className="pg__editor"
            tabIndex={0}
            style={{ fontWeight: bold ? 700 : 400 }}
            onFocus={() => { setScope('editor'); setScopeLabel('editor'); }}
            onBlur={() => { setScope('global'); setScopeLabel('global'); }}
          >
            Click to focus, then press <code>ctrl+B</code>. It's gated on{' '}
            <code>scope == 'editor'</code>, so it does nothing while blurred.
          </div>
        </section>

        <section className="pg__card">
          <h3>Record a shortcut</h3>
          <button className={isRecording ? 'pg__btn pg__btn--rec' : 'pg__btn'} onClick={start}>
            {isRecording ? 'Press any combination…' : 'Click and press keys'}
          </button>
          {combo && (
            <p className="pg__rec">
              <kbd>{combo.label}</kbd> <span className="pg__muted">({combo.binding})</span>
            </p>
          )}
        </section>

        <section className="pg__card">
          <h3>Collisions</h3>
          {collisions.length === 0 ? (
            <p className="pg__muted">No conflicting bindings registered.</p>
          ) : (
            <ul className="pg__list">
              {collisions.map((c) => (
                <li key={c.keys}><code>{c.keys}</code> — {c.rules.map((r) => r.id).join(' vs ')}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="pg__card">
          <h3>Fired</h3>
          {log.length === 0 ? (
            <p className="pg__muted">Nothing yet — press a shortcut.</p>
          ) : (
            <ul className="pg__list">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>
          )}
        </section>

        <section className="pg__card">
          <h3>Keymap ({keymap.length})</h3>
          <ul className="pg__list">
            {keymap.map((r) => (
              <li key={r.id}>
                <span className="pg__accent">{r.labels.join(' / ')}</span> — {r.description ?? r.id}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default function Playground() {
  return (
    <KeybindProvider options={{ debug: false }}>
      <Inner />
    </KeybindProvider>
  );
}
