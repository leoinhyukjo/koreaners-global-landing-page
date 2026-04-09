import Link from 'next/link'
import { LayoutDashboard, RefreshCw } from 'lucide-react'

export default function AdminLandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-semibold text-neutral-50">어드민</h1>
        <p className="text-sm text-muted-foreground">관리할 메뉴를 선택하세요</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-xl lg:max-w-2xl">
        {/* 콘텐츠 관리 */}
        <Link
          href="/admin/content"
          className="group relative rounded-xl border border-neutral-800 bg-neutral-900 p-6 hover:border-orange-500/50 hover:bg-neutral-800/60 transition-all"
        >
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'radial-gradient(ellipse at top left, rgba(255,69,0,0.08) 0%, transparent 60%)' }}
          />
          <div className="relative space-y-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20">
              <RefreshCw className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h2 className="font-semibold text-neutral-50 group-hover:text-orange-300 transition-colors">
                콘텐츠 관리
              </h2>
              <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                블로그·포트폴리오·크리에이터 동기화
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">
              이동 →
            </span>
          </div>
        </Link>

        {/* 프로젝트 현황 */}
        <Link
          href="/admin/projects"
          className="group relative rounded-xl border border-neutral-800 bg-neutral-900 p-6 hover:border-sky-500/50 hover:bg-neutral-800/60 transition-all"
        >
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'radial-gradient(ellipse at top left, rgba(14,165,233,0.08) 0%, transparent 60%)' }}
          />
          <div className="relative space-y-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/20">
              <LayoutDashboard className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <h2 className="font-semibold text-neutral-50 group-hover:text-sky-300 transition-colors">
                프로젝트 현황
              </h2>
              <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                KPI·마진 분석·미수금 관리 대시보드
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity">
              이동 →
            </span>
          </div>
        </Link>

      </div>
    </div>
  )
}
