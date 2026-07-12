import { useEffect, useState } from 'react';

interface Snap {
  key: string;
  code: string;
  keyCode: number;
  mods: string[];
  binding: string;
  hybrid: string;
}

/** Which signal Tactile's hybrid mode would match this key on. */
function classify(key: string, code: string): string {
  if (/^[a-z]$/i.test(key) || /^Key[A-Z]$/.test(code) || /^Digit\d$/.test(code)) {
    return 'event.code (physical keycap)';
  }
  return 'event.key (character)';
}

/** Normalize a live event into a copy-ready Tactile binding string. */
function toBinding(e: KeyboardEvent): string {
  const mods: string[] = [];
  if (e.ctrlKey) mods.push('ctrl');
  if (e.altKey) mods.push('alt');
  if (e.shiftKey) mods.push('shift');
  if (e.metaKey) mods.push('meta');
  let main = e.key === ' ' ? 'space' : e.key.toLowerCase();
  if (['control', 'shift', 'alt', 'meta'].includes(main)) return mods.join('+') || main;
  if (main.startsWith('arrow')) main = main.slice(5);
  return [...mods, main].join('+');
}

export default function KeyInspectorTool() {
  const [snap, setSnap] = useState<Snap | null>(null);
  const [history, setHistory] = useState<Snap[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Let browser-critical combos (paste, devtools, reload) work normally,
      // but stop things like "/" quick-find or space scrolling the page.
      if (!e.metaKey && !e.ctrlKey) e.preventDefault();
      const next: Snap = {
        key: e.key,
        code: e.code,
        keyCode: e.keyCode,
        mods: [
          e.ctrlKey && 'Ctrl',
          e.altKey && 'Alt',
          e.shiftKey && 'Shift',
          e.metaKey && 'Meta',
        ].filter(Boolean) as string[],
        binding: toBinding(e),
        hybrid: classify(e.key, e.code),
      };
      setSnap(next);
      setHistory((h) => [next, ...h].slice(0, 5));
      setCopied(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const copy = async () => {
    if (!snap) return;
    await navigator.clipboard.writeText(snap.binding);
    setCopied(true);
  };

  return (
    <div className="kit">
      {!snap && (
        <div className="kit-empty">
          <span className="keycap keycap--green">Press</span>
          <span className="keycap keycap--green">any</span>
          <span className="keycap keycap--green">key</span>
        </div>
      )}

      {snap && (
        <>
          <div className="kit-hero">
            <div className="kit-cell">
              <span className="kit-label">event.key</span>
              <span className="kit-value kit-value--big">{JSON.stringify(snap.key)}</span>
            </div>
            <div className="kit-cell">
              <span className="kit-label">event.code</span>
              <span className="kit-value kit-value--big">{snap.code}</span>
            </div>
          </div>

          <div className="kit-row">
            <div className="kit-cell">
              <span className="kit-label">modifiers</span>
              <span className="kit-value">{snap.mods.length ? snap.mods.join(' + ') : 'none'}</span>
            </div>
            <div className="kit-cell">
              <span className="kit-label">
                keyCode <em>(deprecated)</em>
              </span>
              <span className="kit-value kit-value--strike">{snap.keyCode}</span>
            </div>
            <div className="kit-cell">
              <span className="kit-label">hybrid mode matches on</span>
              <span className="kit-value kit-accent">{snap.hybrid}</span>
            </div>
          </div>

          <div className="kit-binding">
            <span className="kit-label">Tactile binding string</span>
            <div className="kit-binding__row">
              <code>{snap.binding}</code>
              <button type="button" onClick={copy}>
                {copied ? 'copied' : 'copy'}
              </button>
            </div>
          </div>
        </>
      )}

      {history.length > 1 && (
        <div className="kit-history">
          <span className="kit-label">recent</span>
          <ul>
            {history.slice(1).map((h, i) => (
              <li key={i}>
                <code>{h.binding}</code>
                <span>
                  {JSON.stringify(h.key)} · {h.code}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
