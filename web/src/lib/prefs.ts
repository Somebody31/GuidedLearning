// Theme and session length saved in the browser (localStorage).

export const PREFS_KEY = "gl:prefs";

export type GlTheme = "dark" | "light";

export type GlPrefs = {
  theme: GlTheme;
  motion: boolean;
  paperDefault: boolean;
  sessionMinutes: number;
};

export const DEFAULT_PREFS: GlPrefs = {
  theme: "light",
  motion: true,
  paperDefault: false,
  sessionMinutes: 25,
};

const SESSION_OPTIONS = new Set([15, 25, 45, 60]);

function normalizeTheme(value: unknown): GlTheme {
  return value === "dark" ? "dark" : "light";
}

export function readPrefs(): GlPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_PREFS };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<GlPrefs>;
    const sessionMinutes = Number(parsed.sessionMinutes);
    return {
      theme: normalizeTheme(parsed.theme),
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
  next.theme = normalizeTheme(next.theme);
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  } catch {
    /* private mode / quota */
  }
  applyPrefsAttrs(next);
  return next;
}

/** Restore factory defaults and clear local storage key. */
export function resetPrefs(): GlPrefs {
  try {
    localStorage.removeItem(PREFS_KEY);
  } catch {
    /* private mode */
  }
  applyPrefsAttrs(DEFAULT_PREFS);
  return { ...DEFAULT_PREFS };
}

export function applyMotionAttr(motion: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.motion = motion ? "on" : "off";
}

export function applyThemeAttr(theme: GlTheme) {
  if (typeof document === "undefined") return;
  const t = normalizeTheme(theme);
  const root = document.documentElement;
  root.dataset.theme = t;
  root.style.colorScheme = t;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", t === "light" ? "#e4e6ec" : "#101216");
  }
}

export function applyPrefsAttrs(prefs: Pick<GlPrefs, "theme" | "motion">) {
  applyThemeAttr(prefs.theme);
  applyMotionAttr(prefs.motion);
}

/** Inline boot snippet — keep in sync with PREFS_KEY / theme values. */
export const THEME_BOOT_SCRIPT = `(function(){try{var r=document.documentElement;var p=JSON.parse(localStorage.getItem(${JSON.stringify(PREFS_KEY)})||"{}");var t=p.theme==="dark"?"dark":"light";r.dataset.theme=t;r.style.colorScheme=t;if(p.motion===false)r.dataset.motion="off";else r.dataset.motion="on";}catch(e){document.documentElement.dataset.theme="light";document.documentElement.dataset.motion="on";}})();`;
