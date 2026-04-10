import { createAdminClient } from "@/lib/supabase/admin";

export interface ExchangeRates {
  jpyToKrw: number;
  usdToKrw: number;
  cnyToKrw: number;
}

// 캐시가 비어있을 때만 사용 (실제로는 거의 발생 X). 2026-04 기준 근사치.
const FALLBACK_JPY_TO_KRW = 9.3;
const FALLBACK_USD_TO_KRW = 1450.0;
const FALLBACK_CNY_TO_KRW = 200.0;

const PAIR_JPY = "JPY/KRW";
const PAIR_USD = "USD/KRW";
const PAIR_CNY = "CNY/KRW";

/**
 * Supabase exchange_rates 테이블에서 최신 환율을 읽는다.
 *
 * 환율 데이터 채우기는 외부 cron(work-scripts/launchd/com.koreaners.exchange-rate.plist)이
 * 한국 IP에서 한국수출입은행 API를 호출하여 매일 11:30에 upsert함.
 * Vercel에서 한국 정부 사이트 직접 호출은 봇 차단으로 불가능 → cache-only 전략.
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
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
