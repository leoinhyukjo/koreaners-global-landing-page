import React from "react"
import type { Metadata } from 'next'
import Script from 'next/script'
import { Geist, Geist_Mono, Noto_Sans_JP } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { FooterWrapper } from '@/components/layout/footer-wrapper'
import { LocaleProvider } from '@/contexts/locale-context'
import { ScrollToTop } from '@/components/common/ScrollToTop'
import ClarityProvider from './ClarityProvider'

const geist = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })
const notoSansJP = Noto_Sans_JP({ subsets: ["latin"], variable: '--font-noto-sans-jp', display: 'swap' })

// 환경 변수
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
    <html lang="ko" className={`${notoSansJP.variable} text-[15px]`}>
      <body className={`${geist.className} flex min-h-screen flex-col font-sans antialiased bg-zinc-900`}>
        <LocaleProvider>
          <ClarityProvider />
          <ScrollToTop />
          {children}
          <FooterWrapper />
        </LocaleProvider>
        <Toaster />
        <Analytics />
        {/* GA4 - 환경변수로 관리 */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
        {/* Meta Pixel - 환경변수로 관리 */}
        {process.env.NEXT_PUBLIC_FB_PIXEL_ID && (
          <>
            <Script id="fb-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window,document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${process.env.NEXT_PUBLIC_FB_PIXEL_ID}');
                fbq('track', 'PageView');
              `}
            </Script>
            <noscript>
              <img
                height={1}
                width={1}
                style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_FB_PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
      </body>
    </html>
  )
}
