import { createAdminClient } from "@/lib/supabase/admin";

const FALLBACK_JPY_TO_KRW = 9.0;
const CURRENCY_PAIR = "JPY/KRW";

/**
 * 한국은행 ECOS API에서 JPY→KRW 매매기준율을 조회합니다.
 * 조회 순서: Supabase 당일 캐시 → ECOS API → 최근 캐시 → 하드코딩 폴백(9.0)
 */
export async function getJpyToKrwRate(): Promise<number> {
  const today = getTodayDateString();

  // 1. Supabase 당일 캐시 조회
  try {
    const supabase = createAdminClient();
    const { data: cached } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("currency_pair", CURRENCY_PAIR)
      .eq("rate_date", today)
      .maybeSingle();

    if (cached?.rate != null) {
      return cached.rate;
    }
  } catch {
    // 캐시 조회 실패 시 API 호출로 진행
  }

  // 2. ECOS API 호출
  const apiKey = process.env.BOK_ECOS_API_KEY;
  if (apiKey) {
    try {
      const rate = await fetchEcosRate(apiKey, today);
      if (rate != null) {
        await upsertRate(CURRENCY_PAIR, rate, today, "ecos");
        return rate;
      }
    } catch {
      // API 호출 실패 시 최근 캐시로 폴백
    }
  }

  // 3. 최근 캐시 조회 (당일 데이터 없을 때)
  try {
    const supabase = createAdminClient();
    const { data: recent } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("currency_pair", CURRENCY_PAIR)
      .order("rate_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent?.rate != null) {
      return recent.rate;
    }
  } catch {
    // 최근 캐시도 실패 시 하드코딩 폴백
  }

  // 4. 하드코딩 폴백
  return FALLBACK_JPY_TO_KRW;
}

/**
 * ECOS API에서 특정 날짜의 JPY/KRW 매매기준율을 조회합니다.
 * JPY는 100엔 기준이므로 /100 변환 적용.
 */
async function fetchEcosRate(
  apiKey: string,
  date: string,
): Promise<number | null> {
  const url = `https://ecos.bok.or.kr/api/StatisticSearch/${apiKey}/json/kr/1/1/731Y001/D/${date}/${date}/JPY/0000003`;

  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`ECOS API HTTP ${res.status}`);
  }

  const json = await res.json();
  const rows = json?.StatisticSearch?.row;
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  const raw = parseFloat(rows[0].DATA_VALUE);
  if (isNaN(raw)) {
    return null;
  }

  // 100엔 기준 → 1엔 기준으로 변환
  return raw / 100;
}

/**
 * exchange_rates 테이블에 upsert합니다.
 * conflict 대상: currency_pair + rate_date
 */
async function upsertRate(
  currencyPair: string,
  rate: number,
  rateDate: string,
  source: string,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("exchange_rates").upsert(
      {
        currency_pair: currencyPair,
        rate,
        rate_date: rateDate,
        source,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "currency_pair,rate_date" },
    );
  } catch {
    // upsert 실패는 조용히 무시 (캐싱 실패가 비즈니스 로직에 영향 주지 않도록)
  }
}

/** YYYY-MM-DD 형식의 오늘 날짜 반환 */
function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}
