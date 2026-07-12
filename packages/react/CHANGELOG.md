# @tactile-js/react

## 0.3.0

### Minor Changes

- a71f8ce: Add per-rule `enableInFormFields` so a shortcut (e.g. a command palette's `mod+k`) can fire while
  the user is typing in an input, textarea, select, or contenteditable — without replacing the
  engine-wide `ignore` predicate.

  Guardrails: sequences never fire inside form fields (indistinguishable from typing), keystrokes in
  form fields no longer arm the sequence buffer for after focus leaves, and `debug: true` warns when
  the flag is set on a binding without a ctrl/alt/meta modifier.

### Patch Changes

- Updated dependencies [a71f8ce]
  - @tactile-js/core@0.3.0

## 0.2.0

### Minor Changes

- fcae48f: Initial release: a context-aware keyboard shortcut engine.

  - Layout-aware matching built on `event.key` + `event.code` with hybrid / physical / logical modes
  - `when`-expression context system with named scopes as sugar over context keys
  - Register-time collision detection and priority/last-write-wins runtime resolution
  - Introspection (`getKeymap`), runtime recording, and platform-aware label formatting
  - React adapter: `KeybindProvider`, `useShortcut`, `useScope`, `useShortcutRecorder`, `useKeymap`

### Patch Changes

- Updated dependencies [fcae48f]
  - @tactile-js/core@0.2.0
