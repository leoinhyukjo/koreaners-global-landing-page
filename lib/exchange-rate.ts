import { createAdminClient } from "@/lib/supabase/admin";

export interface ExchangeRates {
  jpyToKrw: number;
  usdToKrw: number;
}

const FALLBACK_JPY_TO_KRW = 9.0;
const FALLBACK_USD_TO_KRW = 1350.0;

/**
 * JPY/KRW + USD/KRW 환율을 한 번에 조회한다.
 * 조회 순서: Supabase 당일 캐시 → ECOS API → 최근 캐시 → 폴백
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  const [jpyToKrw, usdToKrw] = await Promise.all([
    getRate("JPY/KRW", "JPY", true, FALLBACK_JPY_TO_KRW),
    getRate("USD/KRW", "USD", false, FALLBACK_USD_TO_KRW),
  ]);
  return { jpyToKrw, usdToKrw };
}

/** 하위 호환: 기존 코드에서 JPY 환율만 필요한 경우 */
export async function getJpyToKrwRate(): Promise<number> {
  return getRate("JPY/KRW", "JPY", true, FALLBACK_JPY_TO_KRW);
}

/**
 * 단일 통화쌍 환율 조회 (공통 로직)
 * @param currencyPair  "JPY/KRW" | "USD/KRW"
 * @param ecosCurrency  ECOS API 통화 코드 ("JPY" | "USD")
 * @param divideBy100   JPY는 100엔 기준 → true, USD는 1달러 기준 → false
 * @param fallback      최종 폴백값
 */
async function getRate(
  currencyPair: string,
  ecosCurrency: string,
  divideBy100: boolean,
  fallback: number,
): Promise<number> {
  const today = getTodayDateString();

  // 1. Supabase 당일 캐시
  try {
    const supabase = createAdminClient();
    const { data: cached } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("currency_pair", currencyPair)
      .eq("rate_date", today)
      .maybeSingle();

    if (cached?.rate != null) {
      return cached.rate;
    }
  } catch {
    // 캐시 조회 실패 → API 호출로 진행
  }

  // 2. ECOS API
  const apiKey = process.env.BOK_ECOS_API_KEY;
  if (apiKey) {
    try {
      const rate = await fetchEcosRate(apiKey, today, ecosCurrency, divideBy100);
      if (rate != null) {
        await upsertRate(currencyPair, rate, today, "ecos");
        return rate;
      }
    } catch {
      // API 실패 → 최근 캐시로 폴백
    }
  }

  // 3. 최근 캐시
  try {
    const supabase = createAdminClient();
    const { data: recent } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("currency_pair", currencyPair)
      .order("rate_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent?.rate != null) {
      return recent.rate;
    }
  } catch {
    // 최근 캐시도 실패 → 폴백
  }

  return fallback;
}

async function fetchEcosRate(
  apiKey: string,
  date: string,
  currency: string,
  divideBy100: boolean,
): Promise<number | null> {
  const url = `https://ecos.bok.or.kr/api/StatisticSearch/${apiKey}/json/kr/1/1/731Y001/D/${date}/${date}/${currency}/0000003`;

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

  return divideBy100 ? raw / 100 : raw;
}

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
    // upsert 실패는 조용히 무시
  }
}

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}
