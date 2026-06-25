import type { Platform } from '../types.js';

/**
 * Best-effort platform detection. We check `userAgentData` first (the modern
 * API) and fall back to the older `platform`/`userAgent` strings. Defaults to
 * `'other'` outside the browser, which is the safe choice for `mod` -> Ctrl.
 */
export function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'other';

  const uaData = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
  const platformHint = uaData?.platform ?? navigator.platform ?? '';
  if (/mac|iphone|ipad|ipod/i.test(platformHint)) return 'mac';
  if (/mac os x/i.test(navigator.userAgent ?? '')) return 'mac';
  return 'other';
}

/** `mod` resolves to Cmd (meta) on macOS, Ctrl everywhere else. */
export function resolveMod(platform: Platform): 'ctrl' | 'meta' {
  return platform === 'mac' ? 'meta' : 'ctrl';
}
