'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLocale } from '@/contexts/locale-context';
import { getTranslation } from '@/lib/translations';

/** 모바일 전용: 히어로를 벗어나면 하단 고정 문의 바 (가이드 §1-3) */
export function StickyCtaBar() {
  const { locale } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [formInView, setFormInView] = useState(false);

  useEffect(() => {
    setMounted(true);
    // CTA 전환 분석 반영: 스크롤 33% 데드존 어디서든 진입로 확보 —
    // 히어로(자체 CTA 보유)를 벗어나는 즉시 상시 노출
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    // 문의 폼(#consult-form) 진입 시 바 숨김 — 폼 위 오버레이 방지 (Task 1.5)
    const form = document.getElementById('consult-form');
    if (!form) return;
    const io = new IntersectionObserver(([e]) => setFormInView(e.isIntersecting), { threshold: 0 });
    io.observe(form);
    return () => io.disconnect();
  }, []);

  // Hydration mismatch 방지 (navigation.tsx 의 effectiveLocale 패턴과 동일)
  const effectiveLocale = mounted ? locale : 'ko';

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-transform duration-300 lg:hidden ${
        show && !formInView ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <Link
        href="/contact"
        className="gradient-warm block w-full rounded-lg py-3.5 text-center font-bold text-white shadow-xl"
      >
        {getTranslation(effectiveLocale, 'contact') /* 기존 '문의하기' 번역 키 재사용 */}
      </Link>
    </div>
  );
}
