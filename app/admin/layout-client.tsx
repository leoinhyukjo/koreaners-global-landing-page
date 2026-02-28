'use client'

import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { LayoutDashboard, FileText, LogOut, ExternalLink } from 'lucide-react'
import Link from 'next/link'

const navItems = [
  { label: '대시보드', href: '/admin', icon: LayoutDashboard },
  { label: '블로그', href: '/admin/blog', icon: FileText },
]

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-sm font-semibold tracking-tight text-neutral-50">
              KOREANERS
            </Link>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                      active
                        ? 'bg-neutral-800 text-neutral-50'
                        : 'text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-neutral-500 transition-colors hover:text-neutral-300"
            >
              <ExternalLink className="h-3 w-3" />
              <span className="hidden sm:inline">사이트</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-neutral-500 transition-colors hover:text-neutral-300"
            >
              <LogOut className="h-3 w-3" />
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  )
}
