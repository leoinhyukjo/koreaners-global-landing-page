import { createAdminClient } from "@/lib/supabase/admin";

export interface ExchangeRates {
  jpyToKrw: number;
  usdToKrw: number;
  cnyToKrw: number;
}

// 한국수출입은행 API 실패 시 폴백 (2026-04 기준 근사치)
const FALLBACK_JPY_TO_KRW = 9.3;
const FALLBACK_USD_TO_KRW = 1450.0;
const FALLBACK_CNY_TO_KRW = 200.0;

const PAIR_JPY = "JPY/KRW";
const PAIR_USD = "USD/KRW";
const PAIR_CNY = "CNY/KRW";

/**
 * JPY/USD/CNY → KRW 환율을 한국수출입은행 API에서 조회한다.
 *
 * 조회 순서:
 *  1. Supabase 당일 캐시 (3통화 모두 있으면 즉시 반환)
 *  2. 한국수출입은행 API (주말/휴일/11시 이전이면 전 영업일로 롤백, 최대 7일)
 *  3. 최근 캐시 (통화별 fallback)
 *  4. 하드코딩 폴백
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  const today = getTodayDateString();

  // 1. Supabase 당일 캐시에서 3통화 모두 조회
  const cached = await readCachedRates(today);
  if (cached) {
    return cached;
  }

  // 2. 한국수출입은행 API 호출 (영업일 롤백)
  const apiKey = process.env.KOREA_EXIM_API_KEY;
  if (apiKey) {
    const fetched = await fetchKoreaEximRatesWithRollback(apiKey, 7);
    if (fetched) {
      await upsertRates(fetched.rates, today, "korea_exim");
      return fetched.rates;
    }
  }

  // 3. 최근 캐시 per currency pair
  const recent = await readMostRecentRates();
  return {
    jpyToKrw: recent.jpy ?? FALLBACK_JPY_TO_KRW,
    usdToKrw: recent.usd ?? FALLBACK_USD_TO_KRW,
    cnyToKrw: recent.cny ?? FALLBACK_CNY_TO_KRW,
  };
}

/** 하위 호환: JPY 환율만 필요한 legacy caller용 */
export async function getJpyToKrwRate(): Promise<number> {
  const rates = await getExchangeRates();
  return rates.jpyToKrw;
}

// ──────────────────────────────────────────────────────────────
// Supabase cache helpers
// ──────────────────────────────────────────────────────────────

async function readCachedRates(date: string): Promise<ExchangeRates | null> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("exchange_rates")
      .select("currency_pair, rate")
      .eq("rate_date", date)
      .in("currency_pair", [PAIR_JPY, PAIR_USD, PAIR_CNY]);

    if (!data || data.length < 3) return null;

    const map = new Map<string, number>();
    for (const row of data) {
      if (row.rate != null) map.set(row.currency_pair, Number(row.rate));
    }

    const jpy = map.get(PAIR_JPY);
    const usd = map.get(PAIR_USD);
    const cny = map.get(PAIR_CNY);
    if (jpy == null || usd == null || cny == null) return null;

    return { jpyToKrw: jpy, usdToKrw: usd, cnyToKrw: cny };
  } catch {
    return null;
  }
}

async function readMostRecentRates(): Promise<{
  jpy: number | null;
  usd: number | null;
  cny: number | null;
}> {
  const result = { jpy: null as number | null, usd: null as number | null, cny: null as number | null };
  try {
    const supabase = createAdminClient();
    for (const [pair, key] of [
      [PAIR_JPY, "jpy"],
      [PAIR_USD, "usd"],
      [PAIR_CNY, "cny"],
    ] as const) {
      const { data } = await supabase
        .from("exchange_rates")
        .select("rate")
        .eq("currency_pair", pair)
        .order("rate_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.rate != null) {
        result[key] = Number(data.rate);
      }
    }
  } catch {
    // 조용히 무시, 폴백으로 진행
  }
  return result;
}

async function upsertRates(
  rates: ExchangeRates,
  rateDate: string,
  source: string,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const fetchedAt = new Date().toISOString();
    await supabase.from("exchange_rates").upsert(
      [
        { currency_pair: PAIR_JPY, rate: rates.jpyToKrw, rate_date: rateDate, source, fetched_at: fetchedAt },
        { currency_pair: PAIR_USD, rate: rates.usdToKrw, rate_date: rateDate, source, fetched_at: fetchedAt },
        { currency_pair: PAIR_CNY, rate: rates.cnyToKrw, rate_date: rateDate, source, fetched_at: fetchedAt },
      ],
      { onConflict: "currency_pair,rate_date" },
    );
  } catch {
    // 캐시 upsert 실패는 조용히 무시
  }
}

// ──────────────────────────────────────────────────────────────
// Korea Exim API helpers
// ──────────────────────────────────────────────────────────────

interface KoreaEximRow {
  result: number;
  cur_unit: string | null;
  deal_bas_r: string | null;
  cur_nm: string | null;
}

/**
 * 한국수출입은행 API를 오늘부터 최대 maxRollbackDays일 전까지 롤백하며 호출.
 * 주말/공휴일/11시 이전에는 당일 데이터가 없을 수 있으므로.
 */
async function fetchKoreaEximRatesWithRollback(
  apiKey: string,
  maxRollbackDays: number,
): Promise<{ rates: ExchangeRates; dateUsed: string } | null> {
  for (let i = 0; i <= maxRollbackDays; i++) {
    const date = getDateStringDaysAgo(i);
    try {
      const rates = await fetchKoreaEximRates(apiKey, date);
      if (rates) {
        return { rates, dateUsed: date };
      }
    } catch {
      // 다음 날짜로 롤백
    }
  }
  return null;
}

async function fetchKoreaEximRates(
  apiKey: string,
  date: string,
): Promise<ExchangeRates | null> {
  const url = `https://www.koreaexim.go.kr/site/program/financial/exchangeJSON?authkey=${encodeURIComponent(
    apiKey,
  )}&searchdate=${date}&data=AP01`;

  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`Korea Exim HTTP ${res.status}`);
  }

  const rows: KoreaEximRow[] = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  // result = 1 (성공) 이외는 데이터 없음
  // (주말/공휴일엔 빈 배열 또는 result 비성공이 올 수 있음)
  const firstResult = rows[0]?.result;
  if (firstResult !== undefined && firstResult !== 1) {
    return null;
  }

  let jpy: number | null = null;
  let usd: number | null = null;
  let cny: number | null = null;

  for (const row of rows) {
    if (!row.cur_unit || row.deal_bas_r == null) continue;
    const raw = parseFloat(String(row.deal_bas_r).replace(/,/g, ""));
    if (!isFinite(raw)) continue;

    if (row.cur_unit === "JPY(100)") {
      jpy = raw / 100; // 100엔 기준 → 1엔당
    } else if (row.cur_unit === "USD") {
      usd = raw;
    } else if (row.cur_unit === "CNH") {
      cny = raw;
    }
  }

  if (jpy == null || usd == null || cny == null) {
    return null;
  }

  return { jpyToKrw: jpy, usdToKrw: usd, cnyToKrw: cny };
}

// ──────────────────────────────────────────────────────────────
// Date helpers
// ──────────────────────────────────────────────────────────────

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** N일 전 날짜를 YYYYMMDD 형식으로 반환 (한국수출입은행 API 파라미터 형식) */
function getDateStringDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}
