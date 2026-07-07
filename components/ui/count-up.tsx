'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * 초기 렌더(SSR/JS 실패/reduced-motion)는 항상 실수치를 보여준다 — 0 노출 금지.
 * (CTA 전환 분석 문서의 지적: 인앱 웹뷰 JS 실패 세션에 0 이 노출되면 신뢰 훼손)
 * 애니메이션은 뷰포트 진입이 확인된 그 순간에만 0→value 로 잠깐 역치환해 재생.
 */
export function CountUp({
  value,
  suffix = '',
  duration = 1200,
  className,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  const [display, setDisplay] = useState(value); // 실수치로 시작

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; // 정적 유지
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || started.current) return;
        started.current = true;
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / duration);
          setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}
