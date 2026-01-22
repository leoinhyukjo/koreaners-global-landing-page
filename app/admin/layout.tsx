'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FolderOpen, Users, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/admin-auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'

export default function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()

  async function handleLogout() {
    const { error } = await signOut()
    if (error) {
      toast({
        title: '오류',
        description: '로그아웃 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: '로그아웃',
        description: '로그아웃되었습니다.',
      })
      router.push('/admin/login')
      router.refresh()
    }
  }

  const navItems = [
    { href: '/admin', label: '대시보드', icon: LayoutDashboard },
    { href: '/admin/portfolios', label: '포트폴리오', icon: FolderOpen },
    { href: '/admin/creators', label: '크리에이터', icon: Users },
  ]

  // 로그인 페이지인지 확인
  const isLoginPage = pathname === '/admin/login'

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - 로그인 페이지가 아닐 때만 표시 */}
      {!isLoginPage && (
        <aside className="fixed left-0 top-0 h-full w-64 border-r border-border bg-card">
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="border-b border-border p-6">
              <Link href="/admin" className="text-xl font-bold text-primary">
                관리자 패널
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* Footer */}
            <div className="border-t border-border p-4 space-y-2">
              <Link
                href="/"
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                랜딩페이지로
              </Link>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-5 w-5" />
                로그아웃
              </Button>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className={cn('min-h-screen', !isLoginPage && 'ml-64')}>
        {isLoginPage ? (
          // 로그인 페이지는 전체 화면 사용 (children에서 이미 스타일링됨)
          children
        ) : (
          // 다른 페이지는 컨테이너와 패딩 사용
          <div className="container mx-auto p-8">
            {children}
          </div>
        )}
      </main>
    </div>
  )
}
