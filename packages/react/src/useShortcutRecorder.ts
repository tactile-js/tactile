import { useCallback, useEffect, useRef, useState } from 'react';
import type { RecordedShortcut } from '@tactile-js/core';
import { useEngine } from './context.js';

export interface ShortcutRecorder {
  /** Whether the recorder is currently listening for a keystroke. */
  isRecording: boolean;
  /** The most recently captured shortcut, or `null` before the first capture. */
  combo: RecordedShortcut | null;
  /** Begin listening; resolves on the next complete keystroke. */
  start(): void;
  /** Cancel listening without capturing. */
  stop(): void;
}

/**
 * Hook wrapper around the core recorder — the building block for a "press a key
 * to rebind" settings field. Cleans up any in-progress recording on unmount.
 */
export function useShortcutRecorder(): ShortcutRecorder {
  const engine = useEngine();
  const [isRecording, setRecording] = useState(false);
  const [combo, setCombo] = useState<RecordedShortcut | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const start = useCallback(() => {
    stopRef.current?.();
    setRecording(true);
    stopRef.current = engine.recordShortcut((shortcut) => {
      setCombo(shortcut);
      setRecording(false);
      stopRef.current = null;
    });
  }, [engine]);

  const stop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    setRecording(false);
  }, []);

  useEffect(() => () => stopRef.current?.(), []);

  return { isRecording, combo, start, stop };
}
