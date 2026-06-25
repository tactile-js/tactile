---
'@tactile/core': minor
'@tactile/react': minor
---

Initial release: a context-aware keyboard shortcut engine.

- Layout-aware matching built on `event.key` + `event.code` with hybrid / physical / logical modes
- `when`-expression context system with named scopes as sugar over context keys
- Register-time collision detection and priority/last-write-wins runtime resolution
- Introspection (`getKeymap`), runtime recording, and platform-aware label formatting
- React adapter: `KeybindProvider`, `useShortcut`, `useScope`, `useShortcutRecorder`, `useKeymap`
