import { createAdminClient } from "@/lib/supabase/admin";
import {
  CURRENCY_PAIRS,
  FALLBACK_RATES,
  type ExchangeRates,
} from "@/lib/dashboard/calculations";

export type { ExchangeRates };

/**
 * Supabase exchange_rates에서 최신 환율을 읽는다.
 *
 * 환율 적재는 외부 launchd(work-scripts/scripts/exchange_rate_sync.py)가 한국 IP에서
 * 한국수출입은행 API를 호출해 매일 11:30에 upsert함. Vercel 데이터센터 IP는 봇 차단되어
 * 직접 호출 불가 → cache-only 전략.
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("exchange_rates")
      .select("currency_pair, rate")
      .in("currency_pair", [CURRENCY_PAIRS.JPY, CURRENCY_PAIRS.USD, CURRENCY_PAIRS.CNY])
      .order("rate_date", { ascending: false });

    if (error || !data?.length) {
      console.warn("[exchange-rate] cache empty, using fallback:", error?.message);
      return FALLBACK_RATES;
    }

    // .order로 내림차순 정렬되어있어 currency_pair별 첫 매칭이 최신 row.
    return {
      jpyToKrw: pickLatest(data, CURRENCY_PAIRS.JPY) ?? FALLBACK_RATES.jpyToKrw,
      usdToKrw: pickLatest(data, CURRENCY_PAIRS.USD) ?? FALLBACK_RATES.usdToKrw,
      cnyToKrw: pickLatest(data, CURRENCY_PAIRS.CNY) ?? FALLBACK_RATES.cnyToKrw,
    };
  } catch (e) {
    console.warn("[exchange-rate] cache read failed, using fallback:", e);
    return FALLBACK_RATES;
  }
}

/** 하위 호환: legacy caller가 JPY만 필요한 경우. */
export async function getJpyToKrwRate(): Promise<number> {
  const rates = await getExchangeRates();
  return rates.jpyToKrw;
}

function pickLatest(
  rows: Array<{ currency_pair: string; rate: number | string | null }>,
  pair: string,
): number | null {
  const row = rows.find((r) => r.currency_pair === pair);
  if (!row?.rate) return null;
  const n = Number(row.rate);
  return Number.isFinite(n) && n > 0 ? n : null;
}
