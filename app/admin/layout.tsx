'use client'

// 관리자 페이지는 빌드 타임에 정적으로 생성하지 않고 런타임에 동적으로 생성
export const dynamic = 'force-dynamic'

import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FolderOpen, Users, FileText, MessageSquare, LogOut, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/admin-auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

export default function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [isMounted, setIsMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

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
    { href: '/admin/portfolios', label: '포트폴리오 관리', icon: FolderOpen },
    { href: '/admin/creators', label: '크리에이터 관리', icon: Users },
    { href: '/admin/blog', label: '블로그 관리', icon: FileText },
    { href: '/admin/inquiries', label: '문의 내역', icon: MessageSquare },
  ]

  const isLoginPage = pathname === '/admin/login'

  function NavLinks({ onItemClick }: { onItemClick?: () => void }) {
    return (
      <>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </>
    )
  }

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background">
        {isLoginPage ? (
          children
        ) : (
          <main className="min-h-screen">
            <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
              {children}
            </div>
          </main>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 데스크톱 사이드바 (768px 이상) */}
      {!isLoginPage && (
        <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 border-r border-border bg-card md:block">
          <div className="flex h-full flex-col">
            <div className="border-b border-border px-6 py-5">
              <Link href="/admin" className="text-xl font-bold text-primary">
                관리자 패널
              </Link>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
              <NavLinks />
            </nav>
            <div className="space-y-2 border-t border-border p-4">
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
                <LogOut className="h-5 w-5 shrink-0" />
                로그아웃
              </Button>
            </div>
          </div>
        </aside>
      )}

      {/* 모바일 상단 바 + 햄버거 (768px 미만) */}
      {!isLoginPage && (
        <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
          <Link href="/admin" className="text-lg font-bold text-primary">
            관리자 패널
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="메뉴 열기"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </header>
      )}

      {/* 모바일 메뉴 Sheet (왼쪽에서 슬라이드) */}
      {!isLoginPage && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent
            side="left"
            className="w-72 border-r border-border bg-card p-0 sm:max-w-[288px]"
          >
            <SheetHeader className="border-b border-border px-6 py-5 text-left">
              <SheetTitle className="text-xl font-bold text-primary">
                관리자 패널
              </SheetTitle>
            </SheetHeader>
            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
              <NavLinks onItemClick={() => setMobileMenuOpen(false)} />
            </nav>
            <div className="mt-auto space-y-2 border-t border-border p-4">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                랜딩페이지로
              </Link>
              <Button
                variant="ghost"
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleLogout()
                }}
                className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                로그아웃
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}

      <main
        className={cn(
          'min-h-screen',
          !isLoginPage && 'pt-14 md:ml-64 md:pt-0'
        )}
      >
        {isLoginPage ? (
          children
        ) : (
          <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            {children}
          </div>
        )}
      </main>
    </div>
  )
}
