import { useKeymap } from '@tactile/react';

/** Auto-generated shortcut help — built entirely from the engine's keymap, so it
 *  can never drift from what's actually registered. */
export function HelpDialog({ onClose }: { onClose: () => void }) {
  const keymap = useKeymap();

  const groups = new Map<string, typeof keymap>();
  for (const rule of keymap) {
    const key = rule.group ?? 'Other';
    const bucket = groups.get(key) ?? [];
    bucket.push(rule);
    groups.set(key, bucket);
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <header>Keyboard shortcuts</header>
        {[...groups.entries()].map(([group, rules]) => (
          <div key={group}>
            <div className="row" style={{ paddingBottom: 0 }}>
              <strong className="muted" style={{ fontSize: '0.75rem' }}>
                {group.toUpperCase()}
              </strong>
            </div>
            {rules.map((rule) => (
              <div className="row" key={rule.id}>
                <span>{rule.description ?? rule.id}</span>
                <span>
                  {rule.labels.map((label, i) => (
                    <kbd key={i} style={{ marginLeft: i ? 6 : 0 }}>
                      {label}
                    </kbd>
                  ))}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
