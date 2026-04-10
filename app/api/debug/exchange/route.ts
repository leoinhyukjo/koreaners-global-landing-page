import { NextResponse } from "next/server";

export const maxDuration = 30;
export const preferredRegion = "icn1";

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

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);
    const started = Date.now();
    let res: Response;
    try {
      res = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; KoreanersBot/1.0)" },
      });
    } finally {
      clearTimeout(timeoutId);
    }
    const elapsedMs = Date.now() - started;
    const text = await res.text();
    return NextResponse.json({
      ...diagnostics,
      date,
      elapsedMs,
      status: res.status,
      statusText: res.statusText,
      contentType: res.headers.get("content-type"),
      bodyLength: text.length,
      bodyPreview: text.slice(0, 500),
    });
  } catch (err) {
    return NextResponse.json({
      ...diagnostics,
      date,
      errorType: err instanceof Error ? err.constructor.name : typeof err,
      errorMessage: err instanceof Error ? err.message : String(err),
      errorCause: err instanceof Error && "cause" in err ? String((err as { cause: unknown }).cause) : null,
    });
  }
}
