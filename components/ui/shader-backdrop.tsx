'use client';

import { Component, type ReactNode, useEffect, useRef, useState } from 'react';
import { GrainGradient, MeshGradient } from '@paper-design/shaders-react';

type Variant = 'hero' | 'hero-sub' | 'card' | 'cta';

// 가이드 §3(가드레일)·§4(파라미터 스타터) 준수: 기존 토큰만, 저휘도, 저속.
const BASE_SPEED: Record<Variant, number> = {
  hero: 0.18,
  'hero-sub': 0.15,
  card: 0.2,
  cta: 0.12,
};

class ShaderErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function ShaderBackdrop({
  variant,
  seed = 0,
  className = '',
  forceStatic = false,
}: {
  variant: Variant;
  seed?: number;
  className?: string;
  /** true 면 speed 0 강제(rAF 루프 off, 최초 1회 드로우) — /contact 등 보수적 페이지용 */
  forceStatic?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [canRender, setCanRender] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [inView, setInView] = useState(true);
  const [mobile, setMobile] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!document.createElement('canvas').getContext('webgl2')) return;
    } catch {
      return;
    }
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    setMobile(window.matchMedia('(max-width: 1023px)').matches);
    setCanRender(true);
    // 캔버스 첫 프레임 이후 페이드인 (CSS transition — framer-motion 금지)
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    return () => cancelAnimationFrame(raf);
  }, []);

  // 뷰포트 이탈 시 speed 0 가드 — 첫 effect 시점엔 canRender=false 로 host div 가
  // 아직 미마운트(ref null)라 별도 effect 로 분리해야 observer 가 실제로 붙는다.
  useEffect(() => {
    if (!canRender) return;
    const host = hostRef.current;
    if (!host) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0 });
    io.observe(host);
    return () => io.disconnect();
  }, [canRender]);

  if (!canRender) return null; // CSS 폴백(.hero-glow 등)은 부모 마크업이 상시 유지

  const speed = forceStatic || reduced || !inView ? 0 : BASE_SPEED[variant];
  const common = {
    speed,
    frame: 20000 + seed * 11000, // 페이지별 다른 컷
    fit: 'cover' as const,
    minPixelRatio: mobile ? 1 : 2,
    style: { width: '100%', height: '100%' },
  };

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-700 ${
        visible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    >
      <ShaderErrorBoundary>
        {variant === 'card' ? (
          <MeshGradient
            {...common}
            colors={['#FF4500', '#F59E0B', '#0D9488']}
            distortion={0.6}
            swirl={0.3}
          />
        ) : (
          <GrainGradient
            {...common}
            colorBack="#1C1917"
            colors={['#FF4500', '#F59E0B']}
            softness={0.8}
            intensity={variant === 'hero' ? 0.15 : variant === 'hero-sub' ? 0.1 : 0.08}
            noise={0.3}
          />
        )}
      </ShaderErrorBoundary>
    </div>
  );
}
