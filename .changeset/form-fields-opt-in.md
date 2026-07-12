---
'@tactile-js/core': minor
'@tactile-js/react': minor
---

Add per-rule `enableInFormFields` so a shortcut (e.g. a command palette's `mod+k`) can fire while
the user is typing in an input, textarea, select, or contenteditable — without replacing the
engine-wide `ignore` predicate.

Guardrails: sequences never fire inside form fields (indistinguishable from typing), keystrokes in
form fields no longer arm the sequence buffer for after focus leaves, and `debug: true` warns when
the flag is set on a binding without a ctrl/alt/meta modifier.
