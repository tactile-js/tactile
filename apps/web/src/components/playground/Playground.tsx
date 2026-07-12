import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  KeybindProvider,
  useEngine,
  useKeymap,
  useShortcut,
  useScope,
  useShortcutRecorder,
  type KeyEvent,
} from '@tactile-js/react';

/** Classify how hybrid mode would resolve a key — for the inspector. */
function classify(key: string, code: string): string {
  if (/^[a-z]$/i.test(key) || /^Key[A-Z]$/.test(code) || /^Digit\d$/.test(code)) {
    return 'physical (event.code)';
  }
  return 'logical (event.key)';
}

/**
 * The playground overrides the default ignore predicate: INPUT/TEXTAREA/SELECT
 * still pause shortcuts (the title field demos this), but contenteditable is
 * allowed through so the editor's scoped ctrl+b works while actually typing.
 */
function ignoreFormFieldsOnly(event: KeyEvent): boolean {
  const target = event.target as HTMLElement | null;
  if (!target || typeof target.tagName !== 'string') return false;
  const tag = target.tagName.toUpperCase();
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

type Folder = 'inbox' | 'drafts' | 'archive';

const FOLDERS: { id: Folder; label: string; seq: string }[] = [
  { id: 'inbox', label: 'Inbox', seq: 'g i' },
  { id: 'drafts', label: 'Drafts', seq: 'g d' },
  { id: 'archive', label: 'Archive', seq: 'g a' },
];

const SEED: Record<Folder, { title: string; body: string }> = {
  inbox: {
    title: 'Ship the playground redesign',
    body: 'Wire every shortcut to something visible. The demo should feel like an app, not a feature matrix.',
  },
  drafts: {
    title: 'Draft: why layout-aware matching',
    body: 'On a German layout the physical KeyZ types y. keyCode-based libraries fire the wrong shortcut…',
  },
  archive: {
    title: 'Archived: API sketches',
    body: 'Early notes on when-expressions and the collision resolver. Kept for reference.',
  },
};

interface Command {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
}

function CommandPalette({ commands, onClose }: { commands: Command[]; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the query on open; return focus to wherever the user was on close.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => prev?.focus?.();
  }, []);

  const filtered = useMemo(
    () => commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase())),
    [commands, query],
  );

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      filtered[active]?.run();
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }

  return (
    <div className="pgx-overlay" onClick={onClose} role="dialog" aria-label="Command palette">
      <div className="pgx-palette" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={query}
          placeholder="Type a command… (typing here pauses global shortcuts)"
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
        <ul>
          {filtered.map((c, i) => (
            <li
              key={c.id}
              className={i === active ? 'is-active' : ''}
              onMouseEnter={() => setActive(i)}
              onClick={() => {
                c.run();
                onClose();
              }}
            >
              <span>{c.label}</span>
              {c.hint && <kbd>{c.hint}</kbd>}
            </li>
          ))}
          {filtered.length === 0 && <li className="pgx-muted">No matching commands</li>}
        </ul>
      </div>
    </div>
  );
}

function HelpOverlay({ onClose }: { onClose: () => void }) {
  const [activeOnly, setActiveOnly] = useState(false);
  const keymap = useKeymap({ forContext: activeOnly });

  // Return focus to wherever the user was when the dialog closes.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    return () => prev?.focus?.();
  }, []);

  const groups = new Map<string, typeof keymap>();
  for (const rule of keymap) {
    const key = rule.group ?? 'Other';
    const bucket = groups.get(key) ?? [];
    bucket.push(rule);
    groups.set(key, bucket);
  }

  return (
    <div className="pgx-overlay" onClick={onClose} role="dialog" aria-label="Keyboard shortcuts">
      <div className="pgx-help" onClick={(e) => e.stopPropagation()}>
        <header>
          <span>Keyboard shortcuts</span>
          <label className="pgx-toggle">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
            />
            active in current context only
          </label>
        </header>
        <div className="pgx-help__body">
          {[...groups.entries()].map(([group, rules]) => (
            <section key={group}>
              <h4>{group}</h4>
              {rules.map((rule) => (
                <div className="pgx-help__row" key={rule.id}>
                  <span className="pgx-help__desc">
                    {rule.description ?? rule.id}
                    {rule.when && <code className="pgx-when">{rule.when}</code>}
                  </span>
                  <span>
                    {rule.labels.map((label, i) => (
                      <kbd key={i}>{label}</kbd>
                    ))}
                  </span>
                </div>
              ))}
            </section>
          ))}
          <p className="pgx-muted pgx-help__note">
            Rendered live from <code>useKeymap()</code> — this dialog can never drift from what's
            registered.
          </p>
        </div>
      </div>
    </div>
  );
}

function Inner() {
  const engine = useEngine();
  const { setScope } = useScope();

  const [folder, setFolder] = useState<Folder>('inbox');
  const [scope, setScopeLabel] = useState('global');
  const [bold, setBold] = useState(false);
  const [typing, setTyping] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [activity, setActivity] = useState<string[]>([]);
  const [snap, setSnap] = useState<{ key: string; code: string; mods: string } | null>(null);
  const [seqHint, setSeqHint] = useState<string | null>(null);
  const [collisionDemo, setCollisionDemo] = useState(false);
  const { isRecording, combo, start, stop } = useShortcutRecorder();
  const [, bump] = useReducer((n: number) => n + 1, 0);

  const seqTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [titles, setTitles] = useState<Record<Folder, string>>({
    inbox: SEED.inbox.title,
    drafts: SEED.drafts.title,
    archive: SEED.archive.title,
  });

  const fire = useCallback((msg: string) => setActivity((l) => [msg, ...l].slice(0, 4)), []);

  const save = useCallback(() => {
    setSaveState('saved');
    fire(`${engine.format('mod+s')} → saved`);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveState('idle'), 2000);
  }, [engine, fire]);

  const goTo = useCallback(
    (target: Folder, via: string) => {
      setFolder(target);
      setSeqHint(null);
      fire(`${via} → ${target}`);
    },
    [fire],
  );

  useShortcut({
    id: 'palette',
    keys: 'mod+k',
    group: 'Navigation',
    description: 'Command palette',
    handler: () => setPaletteOpen((o) => !o),
  });
  useShortcut({
    id: 'save',
    keys: 'mod+s',
    group: 'File',
    description: 'Save note',
    handler: save,
  });
  useShortcut({
    id: 'help',
    keys: '?',
    group: 'Navigation',
    description: 'Keyboard shortcuts help',
    handler: () => setHelpOpen((o) => !o),
  });
  useShortcut({
    id: 'go.inbox',
    keys: 'g i',
    group: 'Navigation',
    description: 'Go to Inbox (sequence)',
    handler: () => goTo('inbox', 'g i'),
  });
  useShortcut({
    id: 'go.drafts',
    keys: 'g d',
    group: 'Navigation',
    description: 'Go to Drafts (sequence)',
    handler: () => goTo('drafts', 'g d'),
  });
  useShortcut({
    id: 'go.archive',
    keys: 'g a',
    group: 'Navigation',
    description: 'Go to Archive (sequence)',
    handler: () => goTo('archive', 'g a'),
  });
  useShortcut({
    id: 'bold',
    keys: 'ctrl+b',
    when: "scope == 'editor'",
    group: 'Editing',
    description: 'Toggle bold (editor only)',
    handler: () => {
      setBold((b) => !b);
      fire(`${engine.format('ctrl+b')} → bold (scope == 'editor')`);
    },
  });

  // Collision demo — a competing mod+k with higher priority steals the palette.
  useEffect(() => {
    if (!collisionDemo) return;
    const off = engine.add({
      id: 'collision.demo',
      keys: 'mod+k',
      priority: 5,
      group: 'Advanced',
      description: 'Collision demo (priority 5)',
      handler: () => fire('collision.demo won mod+k (priority 5)'),
    });
    bump();
    return () => {
      off();
      bump();
    };
  }, [collisionDemo, engine, fire]);

  // Inspector + sequence pending hint.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mods = [e.ctrlKey && 'Ctrl', e.altKey && 'Alt', e.shiftKey && 'Shift', e.metaKey && 'Meta']
        .filter(Boolean)
        .join('+');
      setSnap({ key: e.key, code: e.code, mods: mods || 'none' });

      if (!e.metaKey && !e.ctrlKey && !e.altKey && e.key === 'g' && !e.repeat) {
        setSeqHint('g — waiting for i / d / a…');
        if (seqTimer.current) clearTimeout(seqTimer.current);
        seqTimer.current = setTimeout(() => setSeqHint(null), 1000);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (seqTimer.current) clearTimeout(seqTimer.current);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => engine.subscribeKeymap(bump), [engine]);

  const collisions = engine.getCollisions();

  const commands: Command[] = [
    ...FOLDERS.map((f) => ({
      id: `cmd.${f.id}`,
      label: `Go to ${f.label}`,
      hint: f.seq,
      run: () => goTo(f.id, 'palette'),
    })),
    { id: 'cmd.save', label: 'Save note', hint: engine.format('mod+s'), run: save },
    {
      id: 'cmd.bold',
      label: 'Toggle bold',
      hint: engine.format('ctrl+b'),
      run: () => setBold((b) => !b),
    },
    { id: 'cmd.help', label: 'Show keyboard shortcuts', hint: '?', run: () => setHelpOpen(true) },
  ];

  return (
    <div className="pgx">
      {/* ── Mini app ─────────────────────────────────────────────── */}
      <div className="pgx-app">
        <aside className="pgx-side">
          <p className="pgx-side__head">notes</p>
          {FOLDERS.map((f) => (
            <button
              key={f.id}
              className={folder === f.id ? 'pgx-side__item is-active' : 'pgx-side__item'}
              onClick={() => goTo(f.id, 'click')}
            >
              <span>{f.label}</span>
              <kbd>{f.seq}</kbd>
            </button>
          ))}
          <div className="pgx-side__foot">
            <button className="pgx-side__item" onClick={() => setPaletteOpen(true)}>
              <span>Commands</span>
              <kbd>{engine.format('mod+k')}</kbd>
            </button>
            <button className="pgx-side__item" onClick={() => setHelpOpen(true)}>
              <span>Shortcuts</span>
              <kbd>?</kbd>
            </button>
          </div>
        </aside>

        <div className="pgx-main">
          <input
            className="pgx-title"
            value={titles[folder]}
            onChange={(e) => setTitles((t) => ({ ...t, [folder]: e.target.value }))}
            onFocus={() => setTyping(true)}
            onBlur={() => setTyping(false)}
            aria-label="Note title"
          />
          <div
            key={folder}
            className="pgx-editor"
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            style={{ fontWeight: bold ? 700 : 400 }}
            onFocus={() => {
              setScope('editor');
              setScopeLabel('editor');
            }}
            onBlur={() => {
              setScope('global');
              setScopeLabel('global');
            }}
          >
            {SEED[folder].body}
          </div>
          <div className="pgx-status">
            <span>
              scope: <b className={scope === 'editor' ? 'pgx-accent' : ''}>{scope}</b>
            </span>
            {typing && <span className="pgx-status__typing">typing — shortcuts paused</span>}
            {seqHint && <span className="pgx-accent">{seqHint}</span>}
            <span className="pgx-status__save">
              {saveState === 'saved' ? <span className="pgx-accent">Saved just now</span> : 'Saved'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Inspector rail ───────────────────────────────────────── */}
      <aside className="pgx-rail">
        <section>
          <h3>KeyboardEvent</h3>
          {snap ? (
            <dl className="pgx-kv">
              <div>
                <dt>event.key</dt>
                <dd>{JSON.stringify(snap.key)}</dd>
              </div>
              <div>
                <dt>event.code</dt>
                <dd>{snap.code}</dd>
              </div>
              <div>
                <dt>modifiers</dt>
                <dd>{snap.mods}</dd>
              </div>
              <div>
                <dt>hybrid uses</dt>
                <dd className="pgx-accent">{classify(snap.key, snap.code)}</dd>
              </div>
            </dl>
          ) : (
            <p className="pgx-muted">Press any key…</p>
          )}
        </section>

        <section>
          <h3>Context</h3>
          <dl className="pgx-kv">
            <div>
              <dt>scope</dt>
              <dd className={scope === 'editor' ? 'pgx-accent' : ''}>{scope}</dd>
            </div>
            <div>
              <dt>shortcuts</dt>
              <dd>{typing ? 'paused (input)' : 'listening'}</dd>
            </div>
          </dl>
        </section>

        <section className="pgx-rail__activity">
          <h3>Fired</h3>
          {activity.length === 0 ? (
            <p className="pgx-muted">Nothing yet — try {engine.format('mod+k')} or g i.</p>
          ) : (
            <ul>
              {activity.map((a, i) => (
                <li key={i} style={{ opacity: 1 - i * 0.2 }}>
                  {a}
                </li>
              ))}
            </ul>
          )}
        </section>

        <details className="pgx-adv">
          <summary>Advanced</summary>
          <section>
            <label className="pgx-toggle">
              <input
                type="checkbox"
                checked={collisionDemo}
                onChange={(e) => setCollisionDemo(e.target.checked)}
              />
              simulate a <code>mod+k</code> conflict
            </label>
            {collisions.length > 0 ? (
              <ul className="pgx-adv__list">
                {collisions.map((c) => (
                  <li key={c.keys}>
                    <code>{c.keys}</code> — {c.rules.map((r) => `${r.id} (${r.priority})`).join(' vs ')}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="pgx-muted">getCollisions() → none</p>
            )}
          </section>
          <section>
            <button className="pgx-btn" onClick={isRecording ? stop : start}>
              {isRecording ? 'Press any combination…' : 'Record a shortcut'}
            </button>
            {combo && (
              <p className="pgx-adv__rec">
                <kbd>{combo.label}</kbd> <span className="pgx-muted">({combo.binding})</span>
              </p>
            )}
          </section>
        </details>
      </aside>

      {paletteOpen && <CommandPalette commands={commands} onClose={() => setPaletteOpen(false)} />}
      {helpOpen && <HelpOverlay onClose={() => setHelpOpen(false)} />}
    </div>
  );
}

export default function Playground() {
  return (
    <KeybindProvider options={{ ignore: ignoreFormFieldsOnly }}>
      <Inner />
    </KeybindProvider>
  );
}
