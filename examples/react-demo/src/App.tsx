import { useState } from 'react';
import { useShortcut, useScope, useShortcutRecorder, useEngine } from '@tactile/react';
import { CommandPalette, type Command } from './CommandPalette.js';
import { HelpDialog } from './HelpDialog.js';
import { KeyInspector } from './KeyInspector.js';

export function App() {
  const engine = useEngine();
  const { setScope } = useScope();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [scope, setScopeLabel] = useState('global');
  const [flash, setFlash] = useState<string | null>(null);
  const [bold, setBold] = useState(false);

  function notify(message: string) {
    setFlash(message);
    window.setTimeout(() => setFlash(null), 1200);
  }

  // --- Global shortcuts ----------------------------------------------------
  useShortcut({
    id: 'palette.toggle',
    keys: 'mod+k',
    group: 'Navigation',
    description: 'Toggle command palette',
    handler: () => setPaletteOpen((o) => !o),
  });

  useShortcut({
    id: 'help.toggle',
    keys: '?',
    group: 'Navigation',
    description: 'Show keyboard shortcuts',
    handler: () => setHelpOpen((o) => !o),
  });

  useShortcut({
    id: 'file.save',
    keys: 'mod+s',
    group: 'File',
    description: 'Save',
    handler: () => notify('Saved'),
  });

  // --- Scope-gated shortcut: only fires while the editor surface is focused --
  useShortcut({
    id: 'editor.bold',
    keys: 'ctrl+b',
    when: "scope == 'editor'",
    group: 'Editing',
    description: 'Toggle bold (editor only)',
    handler: () => {
      setBold((b) => !b);
      notify('Bold toggled');
    },
  });

  const commands: Command[] = [
    { id: 'c.save', label: 'Save file', hint: engine.format('mod+s'), run: () => notify('Saved') },
    { id: 'c.help', label: 'Show shortcuts', hint: '?', run: () => setHelpOpen(true) },
    { id: 'c.bold', label: 'Toggle bold', hint: engine.format('ctrl+b'), run: () => setBold((b) => !b) },
  ];

  const collisions = engine.getCollisions();

  return (
    <div className="page">
      <h1>Tactile</h1>
      <p className="sub">
        A context-aware keyboard shortcut engine. Try <kbd>{engine.format('mod+k')}</kbd> for the
        palette, <kbd>?</kbd> for help, and focus the editor to unlock its scope.
      </p>

      <div className="grid">
        <div className="card">
          <h2>
            Editor surface <span className="scope-pill">scope: {scope}</span>
          </h2>
          <div
            className="editor"
            tabIndex={0}
            onFocus={() => {
              setScope('editor');
              setScopeLabel('editor');
            }}
            onBlur={() => {
              setScope('global');
              setScopeLabel('global');
            }}
            style={{
              minHeight: 120,
              border: '1px solid #30363d',
              borderRadius: 8,
              padding: '0.75rem',
              fontWeight: bold ? 700 : 400,
            }}
          >
            Click here to focus, then press <kbd>{engine.format('ctrl+b')}</kbd>. The bold shortcut
            is gated on <code>scope == 'editor'</code>, so it does nothing while this panel is
            blurred.
          </div>
        </div>

        <KeyInspector />

        <RecorderCard />

        <div className="card">
          <h2>Collision check</h2>
          {collisions.length === 0 ? (
            <p className="muted">No conflicting bindings registered.</p>
          ) : (
            <ul>
              {collisions.map((c) => (
                <li key={c.keys}>
                  <kbd>{c.keys}</kbd> — {c.rules.map((r) => r.id).join(' vs ')}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {paletteOpen && <CommandPalette commands={commands} onClose={() => setPaletteOpen(false)} />}
      {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}
      {flash && <div className="flash">{flash}</div>}
    </div>
  );
}

/** A "press a key to rebind" field, powered by the core recorder. */
function RecorderCard() {
  const { isRecording, combo, start } = useShortcutRecorder();
  return (
    <div className="card">
      <h2>Record a shortcut</h2>
      <div className="row">
        <button type="button" className={isRecording ? 'recording' : ''} onClick={start}>
          {isRecording ? 'Press any combination…' : 'Click and press keys'}
        </button>
        <span>
          {combo ? (
            <>
              <kbd>{combo.label}</kbd> <span className="muted">({combo.binding})</span>
            </>
          ) : (
            <span className="muted">nothing captured yet</span>
          )}
        </span>
      </div>
    </div>
  );
}
