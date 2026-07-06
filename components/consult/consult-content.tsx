// components/consult/consult-content.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FooterCTA } from "@/components/footer-cta";
import { Logo } from "@/components/logo";
import { ChannelTalk } from "@/components/consult/channel-talk";

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

export function ConsultContent() {
  useEffect(() => {
    if (typeof window.fbq === "function") {
      window.fbq("track", "ViewContent", { content_name: "consult_landing" });
    }
  }, []);

  return (
    <main className="min-h-screen">
      {/* 슬림 헤더: 로고만, 사이트 네비게이션 없음 (이탈 경로 제거) */}
      <header className="flex items-center justify-center py-5 bg-[var(--kn-dark)] border-b border-[#A8A29E]/15">
        <Link href="/" aria-label="KOREANERS 홈">
          <Logo variant="header" />
        </Link>
      </header>

      {/* 히어로 */}
      <section className="relative bg-[var(--kn-dark)] hero-glow px-6 pt-16 pb-12 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#FF4500] bg-white/10 mb-6">
            수출바우처 공식 수행기관
          </p>
          <h1 className="font-display font-bold uppercase text-4xl md:text-5xl leading-[0.95] text-[var(--foreground)] mb-6">
            일본 진출은
            <br />
            코리너스입니다
          </h1>
          <p className="text-lg text-[#A8A29E] mb-8">
            일본인 크리에이터 리뷰 하나로 인지도부터 매출까지 이어집니다.
            코리너스가 크리에이터 섭외부터 콘텐츠 제작, 성과 리포트까지
            캠페인 전 과정을 직접 운영합니다.
          </p>
          <Button size="lg" className="uppercase tracking-wider" onClick={scrollToForm}>
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

      {/* 레퍼런스 사례 */}
      <section className="bg-[var(--kn-light)] px-6 py-16 max-w-3xl mx-auto text-center">
        <h2 className="font-display font-bold text-2xl md:text-3xl text-[var(--kn-dark)] mb-4">
          Qoo10 메가와리 시즌, K뷰티 4개 브랜드 동시 캠페인
        </h2>
        <p className="text-[#78716C]">
          일본인 크리에이터 마루오카 에츠코가 4일간 투고한 콘텐츠가 누적 113만
          조회를 기록했습니다. 코리너스는 시즌 커머스 일정에 맞춰 크리에이터
          캠페인을 설계하고 운영합니다.
        </p>
      </section>

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

      {/* 문의 폼: 기존 파이프라인 재사용 (Supabase + Notion + Slack + Pixel Lead) */}
      <div id="consult-form" className="scroll-mt-8">
        <FooterCTA />
      </div>

      {/* 모바일 sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 z-50 p-3 bg-[var(--kn-dark)]/95 backdrop-blur border-t border-[#A8A29E]/15 md:hidden">
        <Button size="lg" className="w-full uppercase tracking-wider" onClick={scrollToForm}>
          무료 상담 받기
        </Button>
      </div>

      <ChannelTalk />
    </main>
  );
}
