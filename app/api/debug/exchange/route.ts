import { NextResponse } from "next/server";
import https from "node:https";

export const maxDuration = 30;
export const preferredRegion = "icn1";

interface HttpsResult {
  status: number;
  body: string;
  headers: Record<string, string | string[] | undefined>;
}

/** 단일 HTTPS GET (cookie 헤더 옵션) */
function httpsGetOnce(url: string, cookie?: string): Promise<HttpsResult> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (compatible; KoreanersBot/1.0)",
      Accept: "*/*",
      "Accept-Encoding": "identity",
      Connection: "close",
    };
    if (cookie) headers["Cookie"] = cookie;

    const req = https.get(
      url,
      {
        headers,
        timeout: 15000,
        rejectUnauthorized: false,
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () =>
          resolve({ status: res.statusCode ?? 0, body, headers: res.headers as Record<string, string | string[] | undefined> }),
        );
      },
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy(new Error("Request timeout"));
    });
  });
}

/**
 * 한국수출입은행 봇 차단 우회:
 *  1. 첫 요청 → 302 + Set-Cookie 받음
 *  2. 받은 쿠키로 같은 URL 재요청 → 실제 데이터 반환
 */
async function httpsGet(url: string): Promise<HttpsResult> {
  const first = await httpsGetOnce(url);

  if (first.status === 302 || first.status === 301) {
    // Set-Cookie 추출 (name=value 부분만)
    const setCookieRaw = first.headers["set-cookie"];
    const cookies = Array.isArray(setCookieRaw) ? setCookieRaw : setCookieRaw ? [setCookieRaw] : [];
    const cookieHeader = cookies
      .map((c) => c.split(";")[0])
      .filter(Boolean)
      .join("; ");

    // Location 헤더의 URL로 재요청 (절대 또는 상대 URL 처리)
    const locationHeader = first.headers["location"];
    const locationStr = Array.isArray(locationHeader) ? locationHeader[0] : locationHeader;
    const nextUrl = locationStr
      ? locationStr.startsWith("http")
        ? locationStr
        : new URL(locationStr, url).toString()
      : url;

    return httpsGetOnce(nextUrl, cookieHeader);
  }

  return first;
}

/**
 * 임시 디버그 엔드포인트 — Korea Exim API 호출 상태 진단용.
 * 작업 종료 후 삭제 예정.
 */
export async function GET() {
  const apiKey = process.env.KOREA_EXIM_API_KEY;
  const diagnostics: Record<string, unknown> = {
    envKeyPresent: !!apiKey,
    envKeyLength: apiKey?.length ?? 0,
    runtime: process.version,
    region: process.env.VERCEL_REGION ?? null,
  };

  if (!apiKey) {
    return NextResponse.json({ ...diagnostics, error: "KOREA_EXIM_API_KEY not set" });
  }

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const date = `${yyyy}${mm}${dd}`;

  const url = `https://www.koreaexim.go.kr/site/program/financial/exchangeJSON?authkey=${encodeURIComponent(
    apiKey,
  )}&searchdate=${date}&data=AP01`;

  // 두 가지 방법 동시 시도: undici fetch + node https
  const fetchResult = await tryFetch(url);
  const httpsResult = await tryHttps(url);

  return NextResponse.json({
    ...diagnostics,
    date,
    fetch: fetchResult,
    https: httpsResult,
  });
}

async function tryFetch(url: string) {
  const started = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);
    let res: Response;
    try {
      res = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; KoreanersBot/1.0)" },
      });
    } finally {
      clearTimeout(timeoutId);
    }
    const text = await res.text();
    return {
      ok: true,
      elapsedMs: Date.now() - started,
      status: res.status,
      bodyLength: text.length,
      bodyPreview: text.slice(0, 200),
    };
  } catch (err) {
    return {
      ok: false,
      elapsedMs: Date.now() - started,
      errorType: err instanceof Error ? err.constructor.name : typeof err,
      errorMessage: err instanceof Error ? err.message : String(err),
      errorCause: err instanceof Error && "cause" in err ? String((err as { cause: unknown }).cause) : null,
    };
  }
}

async function tryHttps(url: string) {
  const started = Date.now();
  try {
    const result = await httpsGet(url);
    return {
      ok: true,
      elapsedMs: Date.now() - started,
      status: result.status,
      location: result.headers["location"] ?? null,
      contentType: result.headers["content-type"] ?? null,
      setCookie: result.headers["set-cookie"] ?? null,
      bodyLength: result.body.length,
      bodyPreview: result.body.slice(0, 300),
    };
  } catch (err) {
    return {
      ok: false,
      elapsedMs: Date.now() - started,
      errorType: err instanceof Error ? err.constructor.name : typeof err,
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}
