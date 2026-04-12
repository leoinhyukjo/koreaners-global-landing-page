const STORAGE_KEY = "krns_utm_data";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

type UtmKey = (typeof UTM_KEYS)[number];

export type UtmData = Partial<Record<UtmKey, string>> & {
  referrer?: string;
  landing_page?: string;
  first_touch_at?: string;
};

function safeGetStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function sanitize(value: string | null, max = 500): string | undefined {
  if (!value) return undefined;
  const trimmed = value.slice(0, max).trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * First-touch capture: the first landing URL that carries utm params is preserved
 * for the rest of the session, even if the user navigates to utm-less pages before
 * submitting the inquiry form.
 */
export function captureUtmFromUrl(): UtmData | null {
  const storage = safeGetStorage();
  if (!storage) return null;

  const existing = storage.getItem(STORAGE_KEY);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch {
      return null;
    }
  }

  const params = new URLSearchParams(window.location.search);
  const captured: UtmData = {};

  for (const key of UTM_KEYS) {
    const v = sanitize(params.get(key));
    if (v) captured[key] = v;
  }

  const hasAnyUtm = Object.keys(captured).length > 0;
  const referrer = sanitize(document.referrer);
  const landingPage = sanitize(window.location.pathname + window.location.search);

  if (!hasAnyUtm && !referrer) {
    return null;
  }

  if (referrer) captured.referrer = referrer;
  if (landingPage) captured.landing_page = landingPage;
  captured.first_touch_at = new Date().toISOString();

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(captured));
  } catch {
    return captured;
  }

  return captured;
}

export function readStoredUtmData(): UtmData {
  const storage = safeGetStorage();
  if (!storage) return {};
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}
