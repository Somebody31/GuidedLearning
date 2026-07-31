/** Demo prefs — browser-local only until backend sync. */

export const PREFS_KEY = "gl:prefs";

export type GlPrefs = {
  motion: boolean;
  paperDefault: boolean;
  sessionMinutes: number;
};

export const DEFAULT_PREFS: GlPrefs = {
  motion: true,
  paperDefault: false,
  sessionMinutes: 25,
};

const SESSION_OPTIONS = new Set([15, 25, 45, 60]);

export function readPrefs(): GlPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_PREFS };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<GlPrefs>;
    const sessionMinutes = Number(parsed.sessionMinutes);
    return {
      motion: parsed.motion !== false,
      paperDefault: Boolean(parsed.paperDefault),
      sessionMinutes: SESSION_OPTIONS.has(sessionMinutes)
        ? sessionMinutes
        : DEFAULT_PREFS.sessionMinutes,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function writePrefs(partial: Partial<GlPrefs>): GlPrefs {
  const next = { ...readPrefs(), ...partial };
  if (!SESSION_OPTIONS.has(next.sessionMinutes)) {
    next.sessionMinutes = DEFAULT_PREFS.sessionMinutes;
  }
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  } catch {
    /* private mode / quota */
  }
  applyMotionAttr(next.motion);
  return next;
}

/** Restore factory defaults and clear local storage key. */
export function resetPrefs(): GlPrefs {
  try {
    localStorage.removeItem(PREFS_KEY);
  } catch {
    /* private mode */
  }
  applyMotionAttr(DEFAULT_PREFS.motion);
  return { ...DEFAULT_PREFS };
}

export function applyMotionAttr(motion: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.motion = motion ? "on" : "off";
}
