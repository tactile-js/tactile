import { createRoot } from 'react-dom/client';
import { KeybindProvider } from '@tactile-js/react';
import { App } from './App.js';
import './styles.css';

// Note: intentionally not wrapped in <StrictMode>. StrictMode double-mounts in
// dev, which would attach the engine's document listeners twice and fire each
// shortcut twice — a dev-only artifact, not a library bug.
createRoot(document.getElementById('root')!).render(
  <KeybindProvider options={{ debug: true }}>
    <App />
  </KeybindProvider>,
);
