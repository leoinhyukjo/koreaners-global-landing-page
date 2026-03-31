import { NextRequest, NextResponse } from 'next/server'
import { authenticateSync } from '@/lib/sync-auth'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    // Body might be empty — auth via header is fine
  }

  const auth = authenticateSync(
    request,
    typeof body?.secret === 'string' ? body.secret : undefined,
  )
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // campaign_posts / campaign_financials / campaign_reviews 는
  // Python ETL 파이프라인(campaign-insights/)이 Supabase에 직접 upsert.
  // 이 엔드포인트는 어드민 버튼용 트리거 및 상태 확인에 사용.
  return NextResponse.json({
    message:
      'campaign_posts, campaign_financials, campaign_reviews 동기화는 Python ETL 파이프라인이 담당합니다. ' +
      'launchd 스케줄: 하루 2회(09:00, 21:00). 수동 실행: python main.py --run-now',
    schedule: 'launchd: 09:00, 21:00 KST daily',
    tables: ['campaign_posts', 'campaign_financials', 'campaign_reviews'],
  })
}
