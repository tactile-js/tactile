import { useEffect, useState } from 'react';

interface Snap {
  key: string;
  code: string;
  mods: string;
}

/**
 * A live KeyboardEvent inspector — the antidote to guessing whether a shortcut
 * should check `event.key` or `event.code`. Press anything and watch both.
 */
export function KeyInspector() {
  const [snap, setSnap] = useState<Snap | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mods = [
        e.ctrlKey && 'Ctrl',
        e.altKey && 'Alt',
        e.shiftKey && 'Shift',
        e.metaKey && 'Meta',
      ]
        .filter(Boolean)
        .join(' + ');
      setSnap({ key: e.key, code: e.code, mods: mods || 'none' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="card inspector">
      <h2>KeyboardEvent inspector</h2>
      {snap ? (
        <div>
          <div className="row">
            <span className="muted">event.key</span>
            <code>{JSON.stringify(snap.key)}</code>
          </div>
          <div className="row">
            <span className="muted">event.code</span>
            <code>{snap.code}</code>
          </div>
          <div className="row">
            <span className="muted">modifiers</span>
            <code>{snap.mods}</code>
          </div>
        </div>
      ) : (
        <p className="muted">Press any key…</p>
      )}
    </div>
  );
}
