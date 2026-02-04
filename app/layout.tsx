import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono, Noto_Sans_JP } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { Footer } from '@/components/layout/footer'
import { LocaleProvider } from '@/contexts/locale-context'

const geist = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })
const notoSansJP = Noto_Sans_JP({ subsets: ["latin"], variable: '--font-noto-sans-jp', display: 'swap' })

const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  ? process.env.NEXT_PUBLIC_APP_URL.startsWith('http')
    ? process.env.NEXT_PUBLIC_APP_URL
    : `https://${process.env.NEXT_PUBLIC_APP_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: '코리너스 | KOREANERS',
  description: '일본 진출 및 현지 마케팅의 확실한 해답, 코리너스',
  generator: 'v0.app',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: '코리너스 | KOREANERS',
    description: '일본 진출 및 현지 마케팅의 확실한 해답, 코리너스',
    url: baseUrl,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={notoSansJP.variable}>
      <body className={`${geist.className} flex min-h-screen flex-col font-sans antialiased bg-zinc-900`}>
        <LocaleProvider>
          {children}
          <Footer />
        </LocaleProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
