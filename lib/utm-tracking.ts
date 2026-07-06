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
 *
 * A real page load ALWAYS records landing_page + first_touch_at, even when there is
 * no utm param and no referrer (direct / typed-URL / bookmark traffic). This leaves a
 * minimal fingerprint for legitimate page-loaded visits, so that an all-blank inquiry
 * (no utm, no referrer, no landing_page) is a reliable signal of a bot POSTing straight
 * to the form endpoint without ever loading the page.
 *
 * Trade-off: a pure-direct first touch (no utm + no referrer) is now locked in, so a
 * later utm/referrer touch in the same tab session cannot overwrite it. In practice utm
 * arrives on the first touch (campaign link), so this edge case is negligible.
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

  const referrer = sanitize(document.referrer);
  const landingPage = sanitize(window.location.pathname + window.location.search);

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
