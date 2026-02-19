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

// 환경 변수 — 프로덕션 도메인을 폴백으로 사용 (VERCEL_URL 폴백 시 canonical이 깨짐)
const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  ? process.env.NEXT_PUBLIC_APP_URL.startsWith('http')
    ? process.env.NEXT_PUBLIC_APP_URL
    : `https://${process.env.NEXT_PUBLIC_APP_URL}`
  : 'https://www.koreaners.co'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: '코리너스 | KOREANERS - 일본 마케팅 & 인플루언서 전문 에이전시',
    template: '%s | 코리너스 KOREANERS',
  },
  description: '코리너스는 일본 인플루언서 마케팅, 시딩, 콘텐츠 제작, 데이터 리포팅까지 크로스보더 마케팅 전 과정을 운영하는 전문 에이전시입니다. 30만 커뮤니티, 100+ 미디어 네트워크 보유.',
  keywords: ['코리너스', 'KOREANERS', '일본 마케팅', '일본 인플루언서', '크로스보더 마케팅', '일본 진출', '인플루언서 마케팅', '일본 시딩', 'K-뷰티 일본', '일본 현지화', 'Japanese influencer marketing', 'cross-border marketing'],
  verification: {
    other: { 'naver-site-verification': '223270d36646f19566b9451e5f6775ac2996dbf2' },
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    type: 'website',
    siteName: '코리너스 KOREANERS',
    title: '코리너스 | KOREANERS - 일본 마케팅 & 인플루언서 전문 에이전시',
    description: '일본 인플루언서 마케팅, 시딩, 콘텐츠 제작, 데이터 리포팅까지. 크로스보더 마케팅 전문 에이전시 코리너스.',
    url: baseUrl,
    locale: 'ko_KR',
    images: [{ url: '/images/logo.png', width: 800, height: 400, alt: '코리너스 KOREANERS' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '코리너스 | KOREANERS',
    description: '일본 인플루언서 마케팅, 시딩, 콘텐츠 제작까지. 크로스보더 마케팅 전문 에이전시.',
    images: ['/images/logo.png'],
  },
  alternates: {
    canonical: baseUrl,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
        <Script
          id="json-ld"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: '코리너스',
              alternateName: 'KOREANERS',
              url: 'https://www.koreaners.co',
              logo: 'https://www.koreaners.co/images/logo.png',
              description: '일본 인플루언서 마케팅, 시딩, 콘텐츠 제작, 데이터 리포팅까지. 크로스보더 마케팅 전문 에이전시.',
              foundingDate: '2022',
              areaServed: ['KR', 'JP'],
              knowsLanguage: ['ko', 'ja'],
              sameAs: [
                'https://www.instagram.com/koreaners_global',
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                email: 'leo@koreaners.com',
                contactType: 'sales',
                availableLanguage: ['Korean', 'Japanese'],
              },
            }),
          }}
        />
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
