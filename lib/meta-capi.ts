import crypto from "crypto";

const PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const API_VERSION = "v22.0";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

interface CAPIEventParams {
  eventName: "Lead" | "CompleteRegistration" | "PageView";
  email?: string;
  phone?: string;
  sourceUrl?: string;
  clientIp?: string;
  userAgent?: string;
  fbc?: string;
  fbp?: string;
}

export async function sendCAPIEvent(params: CAPIEventParams): Promise<void> {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn("[Meta CAPI] PIXEL_ID or ACCESS_TOKEN not set, skipping");
    return;
  }

  const userData: Record<string, string> = {};
  if (params.email) userData.em = sha256(params.email);
  if (params.phone) userData.ph = sha256(params.phone);
  if (params.clientIp) userData.client_ip_address = params.clientIp;
  if (params.userAgent) userData.client_user_agent = params.userAgent;
  if (params.fbc) userData.fbc = params.fbc;
  if (params.fbp) userData.fbp = params.fbp;

  const event = {
    event_name: params.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: params.sourceUrl || "https://koreaners.co",
    action_source: "website",
    user_data: userData,
  };

  const url = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [event] }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[Meta CAPI] API error:", res.status, body);
    }
  } catch (err) {
    console.error("[Meta CAPI] Network error:", err);
  }
}
