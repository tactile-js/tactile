# @tactile/core

The framework-agnostic keyboard-shortcut engine behind [keybind](../../README.md).
Structured rules, a `when`-expression context system, layout-aware matching, and
collision detection — with no hard dependency on the DOM.

```bash
npm install @tactile/core
```

## Usage

```ts
import { createKeybindingEngine } from '@tactile/core';

const kb = createKeybindingEngine({
  defaultMatch: 'hybrid', // 'hybrid' | 'physical' | 'logical'
});

const off = kb.add({
  id: 'file.save',
  keys: 'mod+s',              // string, or alternatives: ['mod+s', 'ctrl+s']
  when: "scope == 'editor'",  // optional boolean expression over context keys
  group: 'File',
  description: 'Save the current file',
  priority: 0,                // higher wins a collision; ties → last registered
  handler: (event, info) => {
    save();
    // return false to skip the default preventDefault()
  },
});

kb.context.set('scope', 'editor');

off();          // unregister this rule
kb.dispose();   // detach all listeners
```

## API

| Member | Description |
| --- | --- |
| `createKeybindingEngine(options?)` | Create an engine instance (a factory, not a global). |
| `engine.add(rule)` | Register a rule; returns an unbind function. |
| `engine.context` | The context-key store: `set`/`get`/`delete`/`snapshot`/`subscribe`. |
| `engine.getKeymap()` | Every rule with platform-formatted labels. |
| `engine.getKeymapForContext(snapshot)` | Only the rules active for a given context. |
| `engine.getCollisions()` | Rules competing for the same keystroke. |
| `engine.recordShortcut(cb)` | Capture the next keystroke as a binding + label. |
| `engine.format(binding, platform?)` | Render a binding as a display label. |
| `engine.subscribeKeymap(cb)` | Notified when rules are added/removed. |

Lower-level helpers (`parseBinding`, `matchChord`, `formatBinding`, `compileWhen`,
`evaluateWhen`, `ContextStore`, `createDomSource`) are exported for building
adapters, inspectors and settings editors.

## Binding syntax

- Combos: `mod+shift+k`, `ctrl+alt+delete`
- Sequences: `g i`, `ctrl+k ctrl+s` (strokes separated by spaces)
- `mod` resolves to ⌘ on macOS, Ctrl elsewhere
- Modifier aliases: `cmd`/`command`/`win`/`super` → meta, `option`/`opt` → alt
- Named keys: `enter`, `esc`, `space`, `tab`, `up`/`arrowup`, `f1`…`f24`, …

## Non-DOM hosts

The engine reads events through a `KeyEventSource`. The default binds to
`document`; pass your own to drive it from anywhere (tests, Electron, a TUI):

```ts
const engine = createKeybindingEngine({
  source: { on: (type, listener) => subscribe(type, listener) },
});
```

See the [root README](../../README.md) for the match-mode policy and the
platform limitations worth knowing about.
