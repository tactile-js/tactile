/**
 * Public types for the keybinding engine.
 *
 * `KeyEvent` is intentionally a structural subset of the DOM `KeyboardEvent`,
 * so a real browser event satisfies it — but tests (and non-DOM hosts) can pass
 * a plain object without pulling in jsdom. That split is what keeps the engine
 * testable in Node.
 */

export type MatchMode = 'hybrid' | 'physical' | 'logical';
export type EventType = 'keydown' | 'keyup';
export type Platform = 'mac' | 'other';

export interface KeyEvent {
  key: string;
  code: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  repeat?: boolean;
  target?: EventTarget | null;
  preventDefault?: () => void;
}

/** Details handed to a rule's handler when it fires. */
export interface MatchInfo {
  /** The rule's command id. */
  id: string;
  /** The specific binding string that matched (useful when a rule has alternatives). */
  keys: string;
  /** Whether the match came from a multi-stroke sequence like `g i`. */
  sequence: boolean;
}

/**
 * A handler returns nothing (or `true`) to let the engine call `preventDefault`,
 * or `false` to explicitly let the event through. This mirrors how most apps
 * want shortcuts to behave by default while leaving an escape hatch.
 */
export type KeybindingHandler = (event: KeyEvent, info: MatchInfo) => void | boolean;

export interface KeybindingRule {
  /** Stable command identifier, e.g. `'palette.open'`. */
  id: string;
  /** Binding string, or alternatives. `'mod+k'`, `'g i'`, `['mod+k', 'ctrl+p']`. */
  keys: string | string[];
  handler: KeybindingHandler;
  /** A `when` expression gating the rule, e.g. `"scope == 'editor' && !readOnly"`. */
  when?: string;
  /** Higher wins when two rules match the same event. Defaults to `0`. */
  priority?: number;
  /** Grouping label for help dialogs, e.g. `'Editing'`. */
  group?: string;
  /** Human-readable description for help UI. */
  description?: string;
  /** Per-rule override of the engine's default match mode. */
  match?: MatchMode;
  /**
   * Let this rule fire even while the user is typing in an input, textarea,
   * select, or contenteditable (i.e. wherever the engine's `ignore` predicate
   * would normally skip the event). Defaults to `false`.
   *
   * Meant for modifier chords like a command palette's `mod+k` — plain keys
   * would collide with typing, and sequences never fire inside form fields.
   */
  enableInFormFields?: boolean;
  /** Whether to call `preventDefault` on a match. Defaults to `true`. */
  preventDefault?: boolean | ((event: KeyEvent) => boolean);
  /** Which event to bind on. Defaults to `'keydown'`. */
  eventType?: EventType;
}

/** Abstracts where key events come from, so the DOM is injectable. */
export interface KeyEventSource {
  on(type: EventType, listener: (event: KeyEvent) => void): () => void;
}

export interface EngineOptions {
  /** Where to listen. Defaults to a DOM source bound to `document`. */
  source?: KeyEventSource;
  /** Default match strategy for rules that don't set their own. Defaults to `'hybrid'`. */
  defaultMatch?: MatchMode;
  /** Max gap (ms) between strokes of a sequence. Defaults to `1000`. */
  sequenceTimeout?: number;
  /** Override which events are ignored. Defaults to ignoring text-input targets. */
  ignore?: (event: KeyEvent) => boolean;
  /** Platform override; auto-detected when omitted. */
  platform?: Platform;
  /** Log registrations, collisions and dispatches to the console. */
  debug?: boolean;
}

/** A rule plus engine-resolved presentation data, for building help UIs. */
export interface ResolvedBinding {
  id: string;
  keys: string[];
  /** Platform-formatted labels parallel to `keys`, e.g. `['⌘K']`. */
  labels: string[];
  when?: string;
  group?: string;
  description?: string;
  priority: number;
}

export interface Collision {
  /** The binding signature both rules compete for. */
  keys: string;
  rules: Array<Pick<KeybindingRule, 'id' | 'when' | 'priority'>>;
}

/** The shape passed to a `recordShortcut` callback. */
export interface RecordedShortcut {
  /** Canonical, re-parseable binding string, e.g. `'ctrl+shift+k'`. */
  binding: string;
  /** Platform label for display, e.g. `'⇧⌘K'`. */
  label: string;
}
