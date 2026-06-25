# @tactile/react

React hooks for [`@tactile/core`](../core). The adapter manages engine lifecycle
and binding registration around the component lifecycle — it contains no
key-matching logic of its own, and re-exports the core so you can import from one
place.

```bash
npm install @tactile/react
```

`react >= 17` is a peer dependency.

## Setup

Wrap your app once:

```tsx
import { KeybindProvider } from '@tactile/react';

<KeybindProvider options={{ defaultMatch: 'hybrid' }}>
  <App />
</KeybindProvider>;
```

## Hooks

```tsx
import {
  useShortcut,
  useScope,
  useShortcutRecorder,
  useKeymap,
} from '@tactile/react';

// Register a shortcut for the component's lifetime (auto add/remove).
useShortcut({
  id: 'palette.open',
  keys: 'mod+k',
  when: "scope == 'global'",
  handler: () => setOpen((o) => !o),
});

// Manage context keys / scopes.
const { set, setScope, enableScope, disableScope, toggleScope } = useScope();

// "Press a key to rebind" field.
const { isRecording, combo, start, stop } = useShortcutRecorder();

// Live keymap for a help dialog (re-renders as rules/context change).
const keymap = useKeymap();              // all rules
const visible = useKeymap({ forContext: true }); // only those active right now
```

### `useShortcut` and changing handlers

The handler is read through a ref, so passing a fresh closure every render does
**not** re-register the binding — it just keeps the latest closure. Only the
binding's identity (`keys`, `when`, `eventType`, `match`, `id`) or an explicit
`deps` entry triggers a re-register. This sidesteps the usual "my shortcut sees
stale state" footgun.

```tsx
useShortcut({ id: 'inc', keys: 'mod+up', handler: () => setCount(count + 1) });
// `count` is always current — no deps juggling required.
```

## A note on React StrictMode

In development, StrictMode double-mounts components, which attaches the engine's
document listeners twice and can fire a shortcut twice. This is a dev-only
artifact of StrictMode, not a bug in your bindings — production renders once. The
example app opts out of StrictMode for exactly this reason.

See the [root README](../../README.md) for the match-mode policy and platform
limitations.
