// components/contact-landing.tsx
"use client";

import { useEffect } from "react";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { FooterCTA } from "@/components/footer-cta";
import { ChannelTalk } from "@/components/common/channel-talk";
import { LogoWall } from "@/components/common/logo-wall";
import { ShaderBackdrop } from "@/components/ui/shader-backdrop";

// 폼 상단 신뢰 로고 — LogoWall 큐레이션 중 인지도 상위 3종 (흰 카드 위, 다크 섹션)
const TRUST_LOGOS = [
  { slug: "medicube", ext: "png", name: "medicube" },
  { slug: "dalba", ext: "png", name: "d'Alba" },
  { slug: "drg", ext: "png", name: "Dr.G" },
];

// 수치 SoT: meta-ads-automation/config/verified_numbers.json > ad_safe_claims
// 이 배열 밖의 수치를 추가하려면 verified_numbers 검증 절차를 먼저 거칠 것
const STATS = [
  { value: "220명+", label: "크리에이터 네트워크" },
  { value: "185개+", label: "누적 협업 브랜드" },
  { value: "10곳", label: "일본 현지 미디어 직접 연결" },
];

const PROCESS = [
  {
    step: "01",
    title: "무료 상담 신청",
    desc: "폼 작성은 1분이면 충분합니다. 담당 매니저가 확인 후 바로 연락드립니다.",
  },
  {
    step: "02",
    title: "맞춤 제안",
    desc: "브랜드와 목표에 맞는 크리에이터 조합과 캠페인 구조를 설계해 제안드립니다.",
  },
  {
    step: "03",
    title: "캠페인 실행",
    desc: "크리에이터 섭외부터 콘텐츠 제작, 성과 리포트까지 코리너스가 직접 운영합니다.",
  },
];

function scrollToForm() {
  document.getElementById("consult-form")?.scrollIntoView({ behavior: "smooth" });
}

export default function ContactLanding() {
  useEffect(() => {
    if (typeof window.fbq === "function") {
      window.fbq("track", "ViewContent", { content_name: "contact_landing" });
    }
  }, []);

  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden">
      <Navigation />

      {/* 히어로 */}
      <section className="relative bg-[var(--kn-dark)] hero-glow px-6 pt-32 md:pt-36 pb-14 text-center">
        {/* 정적 셰이더 (speed 0, 드로우 1회) — hero-glow 는 폴백으로 유지 */}
        <ShaderBackdrop variant="hero-sub" seed={9} forceStatic />
        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#FF4500] bg-white/10 mb-6">
            수출바우처 공식 수행기관
          </p>
          <h1 className="font-display font-bold uppercase text-4xl md:text-5xl leading-[0.95] text-[var(--foreground)] mb-6">
            일본, 대만 진출은
            <br />
            코리너스입니다
          </h1>
          <p className="text-lg text-[#A8A29E] mb-8">
            현지 크리에이터 리뷰 하나로 인지도부터 매출까지 이어집니다.
            코리너스가 크리에이터 섭외부터 콘텐츠 제작, 성과 리포트까지
            캠페인 전 과정을 직접 운영합니다.
          </p>
          <Button
            size="lg"
            onClick={scrollToForm}
            className="gradient-warm text-white uppercase tracking-wider hover:opacity-90 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#FF4500]/20"
          >
            무료 상담 받기
          </Button>
        </div>
      </section>

      {/* 성과 스탯 */}
      <section className="bg-[var(--kn-light)] px-6 py-12 border-y border-[var(--kn-dark)]/10">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="font-display font-bold text-4xl text-[var(--kn-dark)]">{s.value}</p>
              <p className="text-sm text-[#78716C] mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 그룹별 대표 브랜드 로고 월 */}
      <LogoWall />

      {/* 프로세스 */}
      <section className="bg-[var(--kn-card-light)] px-6 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {PROCESS.map((p) => (
            <div key={p.step}>
              <p className="text-sm font-bold text-[#FF4500]">{p.step}</p>
              <h3 className="font-display font-bold text-xl text-[var(--kn-dark)] mt-2 mb-3">{p.title}</h3>
              <p className="text-sm text-[#78716C]">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 폼 직상단 신뢰 요소: 대표 브랜드 로고 3종 + 수출바우처 pill 재노출 */}
      <section className="bg-background px-6 pt-16 md:pt-20">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          <p className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#FF4500] bg-white/10">
            수출바우처 공식 수행기관
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {TRUST_LOGOS.map((logo) => (
              <div
                key={logo.slug}
                className="flex h-16 w-32 items-center justify-center rounded-xl border border-[var(--kn-dark)]/8 bg-white px-5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/logos/${logo.slug}.${logo.ext}`}
                  alt={`${logo.name} 로고`}
                  loading="lazy"
                  className="max-h-8 w-auto max-w-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 문의 폼: 기존 파이프라인 재사용 (Supabase + Notion + Slack + Pixel Lead) */}
      <div id="consult-form" className="scroll-mt-8">
        <FooterCTA />
      </div>

      <ChannelTalk />
    </main>
  );
}
