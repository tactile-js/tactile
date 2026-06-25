# Contributing to Tactile

Thanks for your interest. This is a pnpm monorepo:

- `packages/core` — `@tactile-js/core`, the framework-agnostic engine
- `packages/react` — `@tactile-js/react`, the React adapter
- `examples/react-demo` — an interactive demo

## Getting set up

```bash
pnpm install
pnpm -r build
pnpm -r test
pnpm -r typecheck
pnpm lint

pnpm --filter @tactile-js/example-react-demo dev   # play with the demo
```

## Making a change

1. Branch off `main`.
2. Make your change with tests. The core is tested in Node (synthetic key events via a fake
   `KeyEventSource`); the React adapter is tested in jsdom with real `KeyboardEvent` dispatch.
3. Keep the public API small and the match-mode behavior documented — see the matching-policy table
   in the root `README.md`.
4. **Add a changeset:** `pnpm changeset`. Pick the affected packages and a semver bump, and describe
   the change in one or two sentences. This drives versioning and the changelog.
5. Open a PR. CI runs build, test, typecheck, and lint.

## Releases

Releases are automated. Merging the bot's "Version Packages" PR publishes the bumped packages to npm.
Maintainers don't publish by hand.
