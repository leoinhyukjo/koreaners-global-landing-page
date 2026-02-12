import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminLayoutClient } from './layout-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '어드민',
}

/**
 * Admin Layout - 서버 측 인증 보호
 *
 * Middleware와 함께 이중 보호 제공:
 * 1. Middleware: 초기 인증 체크 및 리다이렉트
 * 2. Layout: 서버 컴포넌트 레벨 세션 검증
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('[Admin Layout] Session error:', error.message)
      redirect('/admin/login')
    }

    // 세션이 없으면 로그인 페이지로 리다이렉트
    if (!session) {
      redirect('/admin/login')
    }
  } catch (error) {
    console.error('[Admin Layout] Error:', error instanceof Error ? error.message : 'Unknown error')
    redirect('/admin/login')
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
