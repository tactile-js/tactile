# Tactile

A keyboard-shortcut engine that takes context and keyboard layouts seriously.

Most shortcut libraries are built on `KeyboardEvent.keyCode`, treat scopes as an
afterthought, and leave you to discover binding conflicts at runtime. Tactile
starts from a different place: a small framework-agnostic core modeled on VS
Code's keybinding system — structured rules, a `when`-expression context system,
and explicit collision resolution — with thin adapters on top.

> **Status:** early. The API is settling but not yet 1.0.

## Packages

| Package | What it is |
| --- | --- |
| [`@tactile-js/core`](packages/core) | The engine: parsing, matching, context, collisions, recording. No DOM assumptions you can't override. |
| [`@tactile-js/react`](packages/react) | React hooks — `useShortcut`, `useScope`, `useShortcutRecorder`, `useKeymap`. |

## Quick taste

```ts
import { createKeybindingEngine } from '@tactile-js/core';

const kb = createKeybindingEngine();

kb.add({
  id: 'palette.open',
  keys: 'mod+k', // `mod` is ⌘ on macOS, Ctrl elsewhere
  when: "scope == 'global'",
  group: 'Navigation',
  description: 'Open command palette',
  handler: () => openPalette(),
});

kb.context.set('scope', 'editor'); // gate other rules on the active scope
```

```tsx
import { KeybindProvider, useShortcut } from '@tactile-js/react';

function Editor() {
  useShortcut({
    id: 'editor.bold',
    keys: 'mod+b',
    when: "scope == 'editor'",
    handler: () => toggleBold(),
  });
  return /* … */;
}
```

## What's actually different

- **Layout-aware matching.** Bindings match against `event.key` *and* `event.code`
  depending on what the key is — not the deprecated `keyCode`. `Cmd+Z` lands on the
  physical Z key across layouts; `?` matches the character you'd expect. See
  [Key matching](#key-matching) below.
- **`when` expressions, not flags.** Gate any rule with a boolean expression over
  context keys (`scope == 'editor' && !readOnly`). Named scopes are just sugar over
  context keys, so there's one concept to learn, not two.
- **Collisions are first-class.** `getCollisions()` tells you when two rules fight
  over the same keystroke; at runtime, ties resolve by `priority` then
  registration order (last wins), the same model VS Code uses.
- **Introspection built in.** `getKeymap()` returns every binding with a
  platform-formatted label (`⌘K` / `Ctrl+K`), which is all you need to render a
  shortcuts dialog that can't drift from reality.
- **A real core/adapter split.** The engine talks to a `KeyEventSource` interface,
  not the DOM directly — which is why the whole thing is unit-tested in Node with
  synthetic events, and why a Vue or Svelte adapter is a small job.

## Key matching

The engine keeps two ideas separate: the **character** a key produces
(`event.key`) and its **physical position** (`event.code`). Each binding token is
matched by one or the other, chosen by the match mode:

| Mode | Letters & digits | Named keys (Enter, ↑, F5) | Symbols (`?`, `/`) |
| --- | --- | --- | --- |
| `hybrid` *(default)* | physical (`code`) | logical (`key`) | logical (`key`) |
| `physical` | physical | physical | falls back to `key` |
| `logical` | logical | logical | logical |

Why hybrid defaults the way it does:

- **Letters → physical.** `Cmd+K` should be the K *position* — that's what app
  authors mean, and it stays put when the layout changes the character.
- **Symbols → logical.** You mean the glyph `?`, whose physical key differs by
  layout. Matching the character is the only thing that behaves internationally.

Override per binding with `match`, or globally with `defaultMatch`.

## Limitations (read this before filing a bug)

Keyboard handling on the web has hard edges. Being honest about them up front
saves everyone time:

- **OS/browser-reserved shortcuts can't be overridden.** `Cmd+W`, `Cmd+Q`,
  `Cmd+T`, `F11`, and friends are intercepted before your page sees them. No
  library can reliably take these — don't bind them.
- **`physical` mode assumes a key's `code` is stable; symbols aren't.** Most
  punctuation has a layout-dependent `code`, so in `physical` mode symbol tokens
  fall back to character matching. This is documented, not a bug.
- **`event.code` exposes physical position, not the user's intent.** On a Dvorak
  or AZERTY layout, "the Z key" and "the letter Z" diverge. Hybrid mode picks a
  sensible default per token, but there's no choice that's right for every app —
  use the `KeyboardEvent inspector` in the demo to see what your hardware reports.
- **Form fields are skipped by default.** Shortcuts don't fire while typing into
  `input`/`textarea`/contenteditable. Override with `EngineOptions.ignore`.

## Development

```bash
pnpm install
pnpm -r build      # ESM + CJS + d.ts for every package
pnpm -r test       # vitest (core: Node; react: jsdom)
pnpm -r typecheck
pnpm lint

pnpm --filter @tactile-js/example-react-demo dev   # the interactive demo
```

The demo (`examples/react-demo`) is the fastest way to feel the design: a command
palette on `⌘K`, a scope-gated editor shortcut, an auto-generated help dialog, a
"record a shortcut" field, and a live KeyboardEvent inspector.
