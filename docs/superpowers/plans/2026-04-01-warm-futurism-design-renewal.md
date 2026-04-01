# Warm Futurism 디자인 리뉴얼 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 전체 퍼블릭 페이지에 Warm Futurism 디자인 효과 적용 (glassmorphism, 3D tilt, aurora mesh gradient, kinetic typography, count-up, glow button, dot pattern, cursor glow spotlight)

**Architecture:** 8개 신규 UI 컴포넌트를 생성하고, globals.css에 CSS 유틸리티/keyframes를 추가한 뒤, 메인 페이지 → 네비게이션/푸터 → 서브 페이지 순서로 적용. 기존 컬러 팔레트(#FF4500, #1C1917, #FAF7F2) 100% 유지.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, Framer Motion 12, TypeScript

**Spec:** `docs/superpowers/specs/2026-04-01-warm-futurism-design-renewal.md`

---

## File Structure

### 새로 생성할 파일
| 파일 | 역할 |
|------|------|
| `components/ui/glass-card.tsx` | 글래스모피즘 카드 래퍼 (variant: dark/light) |
| `components/ui/tilt-card.tsx` | 3D 마우스 트래킹 틸트 래퍼 |
| `components/ui/aurora-background.tsx` | 오로라 mesh gradient blob 배경 |
| `components/ui/glow-spotlight.tsx` | 마우스 따라다니는 glow (다크 섹션 전용) |
| `components/ui/kinetic-text.tsx` | 글자 단위 stagger 애니메이션 텍스트 |
| `components/ui/count-up.tsx` | 숫자 카운트업 (intersection observer) |
| `components/ui/glow-button.tsx` | animated gradient border CTA 버튼 |
| `components/ui/dot-pattern.tsx` | 미세 도트 패턴 오버레이 |

### 수정할 파일
| 파일 | 변경 |
|------|------|
| `app/globals.css` | aurora keyframes, animated border @property, glass utility, dot pattern, custom scrollbar, hero-glow 교체 |
| `components/hero-section.tsx` | KineticText + AuroraBackground + GlowButton + scroll indicator |
| `components/navigation.tsx` | 글래스 강화 + underline animation + CTA glow |
| `components/layout/footer.tsx` | 오로라 blob + 소셜 아이콘 hover |
| `components/market-opportunity.tsx` | GlassCard + TiltCard + CountUp |
| `components/performance.tsx` | GlassCard + TiltCard + CountUp |
| `components/barriers.tsx` | GlassCard + TiltCard |
| `components/solution-roadmap.tsx` | GlassCard + TiltCard |
| `components/trust-signals.tsx` | 글래스 효과 |
| `components/final-cta.tsx` | GlowButton + AuroraBackground |
| `components/footer-cta.tsx` | GlassCard |
| `components/client-showcase.tsx` | 배경 효과 |
| `components/main-content.tsx` | GlowSpotlight 래핑 |
| `components/creator-content.tsx` | GlassCard + TiltCard + CountUp |
| `components/portfolio-content.tsx` | GlassCard + TiltCard |
| `components/service-content.tsx` | GlassCard + TiltCard |
| `components/blog-content.tsx` | GlassCard |
| `app/about/page.tsx` | GlassCard + CountUp + AuroraBackground |
| `app/careers/page.tsx` | GlassCard + AuroraBackground |
| `app/contact/page.tsx` | GlassCard + AuroraBackground |
| `app/privacy/page.tsx` | minimal aurora |

---

## Task 1: globals.css — CSS 유틸리티 & Keyframes 추가

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Aurora keyframes 추가**

`globals.css` 맨 끝(reduced motion 블록 위)에 추가:

```css
/* ─── Warm Futurism: Aurora Animation ─── */
@keyframes aurora-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -20px) scale(1.05); }
  66% { transform: translate(-20px, 15px) scale(0.95); }
}

@keyframes aurora-float-reverse {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-25px, 20px) scale(0.95); }
  66% { transform: translate(15px, -25px) scale(1.05); }
}
```

- [ ] **Step 2: Animated gradient border @property 추가**

Aurora keyframes 아래에 추가:

```css
/* ─── Warm Futurism: Animated Gradient Border ─── */
@property --border-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

@keyframes rotate-border {
  to { --border-angle: 360deg; }
}
```

- [ ] **Step 3: Glass utility 클래스 추가**

```css
/* ─── Warm Futurism: Glass Utilities ─── */
@utility glass-dark {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
}

@utility glass-light {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
}
```

- [ ] **Step 4: Dot pattern utility 추가**

```css
@utility dot-pattern {
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

- [ ] **Step 5: Custom scrollbar 추가**

```css
/* ─── Warm Futurism: Custom Scrollbar ─── */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: var(--kn-dark);
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 69, 0, 0.4);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 69, 0, 0.6);
}
```

- [ ] **Step 6: hero-glow 클래스를 aurora 스타일로 교체**

기존 `.hero-glow::before` (line ~709-719)를 교체:

```css
/* Hero glow: aurora mesh gradient */
.hero-glow {
  position: relative;
  overflow: hidden;
}
.hero-glow::before {
  content: '';
  position: absolute;
  top: -200px;
  left: -200px;
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(255,69,0,0.15) 0%, transparent 70%);
  animation: aurora-float 18s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
  filter: blur(80px);
}
.hero-glow::after {
  content: '';
  position: absolute;
  top: -100px;
  right: -300px;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%);
  animation: aurora-float-reverse 20s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
  filter: blur(100px);
}
.hero-glow > * {
  position: relative;
  z-index: 1;
}
```

- [ ] **Step 7: @theme inline에 aurora 애니메이션 등록**

`@theme inline` 블록(line ~98) 안에 추가:

```css
  --animate-aurora-float: aurora-float 18s ease-in-out infinite;
  --animate-aurora-float-reverse: aurora-float-reverse 20s ease-in-out infinite;
```

- [ ] **Step 8: dev 서버에서 확인**

Run: `cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page && npm run dev`
Expected: 빌드 성공, 히어로 섹션 오로라 blob 2개가 느리게 움직임, 스크롤바 오렌지

- [ ] **Step 9: Commit**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page
git add app/globals.css
git commit -m "feat: add Warm Futurism CSS utilities — aurora keyframes, glass, dot pattern, scrollbar"
```

---

## Task 2: GlassCard 컴포넌트

**Files:**
- Create: `components/ui/glass-card.tsx`

- [ ] **Step 1: GlassCard 컴포넌트 작성**

```tsx
'use client'

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  variant?: 'dark' | 'light'
  className?: string
  hover?: boolean
}

export function GlassCard({ children, variant = 'dark', className, hover = true }: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius)] transition-all duration-300',
        variant === 'dark' ? 'glass-dark' : 'glass-light',
        hover && 'hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#FF4500]/10',
        className
      )}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/glass-card.tsx
git commit -m "feat: add GlassCard component with dark/light variants"
```

---

## Task 3: TiltCard 컴포넌트

**Files:**
- Create: `components/ui/tilt-card.tsx`

- [ ] **Step 1: TiltCard 컴포넌트 작성**

```tsx
'use client'

import { useRef, useCallback, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TiltCardProps {
  children: ReactNode
  className?: string
  maxTilt?: number
  glowColor?: string
}

export function TiltCard({ children, className, maxTilt = 8, glowColor = 'rgba(255,69,0,0.15)' }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      if (!cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      cardRef.current.style.transform = `perspective(1000px) rotateY(${x * maxTilt}deg) rotateX(${-y * maxTilt}deg) scale(1.02)`
      cardRef.current.style.boxShadow = `0 20px 60px ${glowColor}`
    })
  }, [maxTilt, glowColor])

  const handleMouseLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    if (!cardRef.current) return
    cardRef.current.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)'
    cardRef.current.style.boxShadow = 'none'
  }, [])

  // 터치 디바이스 감지: hover가 가능한 디바이스에서만 틸트 적용
  const isTouchDevice = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches

  return (
    <div
      ref={cardRef}
      className={cn(
        'transition-[box-shadow] duration-300 will-change-transform',
        className
      )}
      onMouseMove={isTouchDevice ? undefined : handleMouseMove}
      onMouseLeave={isTouchDevice ? undefined : handleMouseLeave}
      style={{ transition: 'transform 0.15s ease-out, box-shadow 0.3s ease-out' }}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/tilt-card.tsx
git commit -m "feat: add TiltCard component with 3D mouse tracking"
```

---

## Task 4: AuroraBackground 컴포넌트

**Files:**
- Create: `components/ui/aurora-background.tsx`

- [ ] **Step 1: AuroraBackground 컴포넌트 작성**

```tsx
'use client'

import { cn } from '@/lib/utils'

interface AuroraBlobConfig {
  color: string
  size: number
  top: string
  left: string
  animation: 'aurora-float' | 'aurora-float-reverse'
  duration: string
}

const defaultBlobs: AuroraBlobConfig[] = [
  { color: 'rgba(255,69,0,0.12)', size: 600, top: '-10%', left: '-10%', animation: 'aurora-float', duration: '18s' },
  { color: 'rgba(245,158,11,0.08)', size: 500, top: '20%', left: '60%', animation: 'aurora-float-reverse', duration: '20s' },
  { color: 'rgba(13,148,136,0.06)', size: 400, top: '60%', left: '30%', animation: 'aurora-float', duration: '22s' },
]

interface AuroraBackgroundProps {
  blobs?: AuroraBlobConfig[]
  className?: string
  withDotPattern?: boolean
}

export function AuroraBackground({ blobs = defaultBlobs, className, withDotPattern = true }: AuroraBackgroundProps) {
  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)} aria-hidden="true">
      {blobs.map((blob, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: blob.size,
            height: blob.size,
            top: blob.top,
            left: blob.left,
            background: `radial-gradient(circle, ${blob.color} 0%, transparent 70%)`,
            filter: 'blur(80px)',
            animation: `${blob.animation} ${blob.duration} ease-in-out infinite`,
          }}
        />
      ))}
      {withDotPattern && (
        <div className="absolute inset-0 dot-pattern" />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/aurora-background.tsx
git commit -m "feat: add AuroraBackground component with configurable blobs"
```

---

## Task 5: GlowSpotlight 컴포넌트

**Files:**
- Create: `components/ui/glow-spotlight.tsx`

- [ ] **Step 1: GlowSpotlight 컴포넌트 작성**

```tsx
'use client'

import { useRef, useCallback, useEffect, useState } from 'react'

export function GlowSpotlight() {
  const spotlightRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const [visible, setVisible] = useState(false)

  // 터치 디바이스 감지
  const [isTouch, setIsTouch] = useState(true)
  useEffect(() => {
    setIsTouch(window.matchMedia('(hover: none)').matches)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      if (!spotlightRef.current) return
      spotlightRef.current.style.left = `${e.clientX}px`
      spotlightRef.current.style.top = `${e.clientY}px`
    })
    if (!visible) setVisible(true)
  }, [visible])

  const handleMouseLeave = useCallback(() => {
    setVisible(false)
  }, [])

  useEffect(() => {
    if (isTouch) return
    window.addEventListener('mousemove', handleMouseMove)
    document.body.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.body.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(rafRef.current)
    }
  }, [isTouch, handleMouseMove, handleMouseLeave])

  if (isTouch) return null

  return (
    <div
      ref={spotlightRef}
      className="fixed pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300"
      style={{
        width: 400,
        height: 400,
        background: 'radial-gradient(circle, rgba(255,69,0,0.06) 0%, transparent 70%)',
        opacity: visible ? 1 : 0,
      }}
      aria-hidden="true"
    />
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/glow-spotlight.tsx
git commit -m "feat: add GlowSpotlight cursor glow component"
```

---

## Task 6: KineticText 컴포넌트

**Files:**
- Create: `components/ui/kinetic-text.tsx`

- [ ] **Step 1: KineticText 컴포넌트 작성**

```tsx
'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface KineticTextProps {
  text: string
  className?: string
  staggerDelay?: number
  as?: 'h1' | 'h2' | 'h3' | 'span' | 'p'
}

export function KineticText({ text, className, staggerDelay = 0.03, as: Tag = 'h1' }: KineticTextProps) {
  const words = text.split(' ')

  return (
    <Tag className={cn('overflow-hidden', className)}>
      <motion.span
        className="inline-flex flex-wrap justify-center"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: staggerDelay * 4 } },
        }}
      >
        {words.map((word, wordIndex) => (
          <span key={wordIndex} className="inline-flex overflow-hidden mr-[0.25em]">
            <motion.span
              className="inline-flex"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: staggerDelay } },
              }}
            >
              {word.split('').map((char, charIndex) => (
                <motion.span
                  key={charIndex}
                  className="inline-block"
                  variants={{
                    hidden: { y: '100%', opacity: 0 },
                    visible: {
                      y: '0%',
                      opacity: 1,
                      transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] },
                    },
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/kinetic-text.tsx
git commit -m "feat: add KineticText component with per-character stagger animation"
```

---

## Task 7: CountUp 컴포넌트

**Files:**
- Create: `components/ui/count-up.tsx`

- [ ] **Step 1: CountUp 컴포넌트 작성**

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { cn } from '@/lib/utils'

interface CountUpProps {
  end: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function CountUp({ end, duration = 1500, prefix = '', suffix = '', className }: CountUpProps) {
  const [count, setCount] = useState(0)
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 })
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!inView || hasAnimated.current) return
    hasAnimated.current = true
    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutCubic(progress)
      setCount(Math.floor(easedProgress * end))
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setCount(end)
      }
    }
    requestAnimationFrame(animate)
  }, [inView, end, duration])

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/count-up.tsx
git commit -m "feat: add CountUp component with intersection observer trigger"
```

---

## Task 8: GlowButton 컴포넌트

**Files:**
- Create: `components/ui/glow-button.tsx`

- [ ] **Step 1: GlowButton 컴포넌트 작성**

```tsx
'use client'

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface GlowButtonProps {
  children: ReactNode
  className?: string
  href?: string
  onClick?: () => void
}

export function GlowButton({ children, className, href, onClick }: GlowButtonProps) {
  const buttonClasses = cn(
    'relative inline-flex items-center justify-center px-8 py-4',
    'text-sm font-bold uppercase tracking-wider text-white',
    'rounded-[var(--radius-sm)]',
    'bg-gradient-to-r from-[#FF4500] to-[#F59E0B]',
    'hover:scale-[1.05] transition-transform duration-300',
    'shadow-[0_0_20px_rgba(255,69,0,0.3)]',
    'hover:shadow-[0_0_40px_rgba(255,69,0,0.5)]',
    // Animated border glow
    'before:absolute before:inset-[-2px] before:rounded-[calc(var(--radius-sm)+2px)]',
    'before:bg-[conic-gradient(from_var(--border-angle),#FF4500,#F59E0B,#0D9488,#FF4500)]',
    'before:animate-[rotate-border_4s_linear_infinite] before:-z-10',
    'before:opacity-60 before:blur-[2px]',
    className
  )

  if (href) {
    return (
      <a href={href} className={buttonClasses}>
        {children}
      </a>
    )
  }

  return (
    <button onClick={onClick} className={buttonClasses}>
      {children}
    </button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/glow-button.tsx
git commit -m "feat: add GlowButton component with animated gradient border"
```

---

## Task 9: DotPattern 컴포넌트

**Files:**
- Create: `components/ui/dot-pattern.tsx`

- [ ] **Step 1: DotPattern 컴포넌트 작성**

```tsx
import { cn } from '@/lib/utils'

interface DotPatternProps {
  className?: string
}

export function DotPattern({ className }: DotPatternProps) {
  return (
    <div
      className={cn('absolute inset-0 dot-pattern pointer-events-none', className)}
      aria-hidden="true"
    />
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/dot-pattern.tsx
git commit -m "feat: add DotPattern overlay component"
```

---

## Task 10: 메인 페이지 히어로 리뉴얼

**Files:**
- Modify: `components/hero-section.tsx`

- [ ] **Step 1: 히어로 섹션에 KineticText + AuroraBackground + GlowButton + 스크롤 인디케이터 적용**

`components/hero-section.tsx` 전체를 아래로 교체:

```tsx
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'
import { SectionTag } from '@/components/ui/section-tag'
import { KineticText } from '@/components/ui/kinetic-text'
import { AuroraBackground } from '@/components/ui/aurora-background'
import { GlowButton } from '@/components/ui/glow-button'
import { ChevronDown } from 'lucide-react'

export default function HeroSection() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-[var(--kn-dark)] px-6 lg:px-24 overflow-hidden">
      {/* Aurora mesh gradient background */}
      <AuroraBackground
        blobs={[
          { color: 'rgba(255,69,0,0.15)', size: 800, top: '-20%', left: '-10%', animation: 'aurora-float', duration: '18s' },
          { color: 'rgba(245,158,11,0.1)', size: 600, top: '10%', left: '60%', animation: 'aurora-float-reverse', duration: '20s' },
          { color: 'rgba(13,148,136,0.07)', size: 500, top: '50%', left: '20%', animation: 'aurora-float', duration: '22s' },
          { color: 'rgba(255,69,0,0.08)', size: 400, top: '60%', left: '70%', animation: 'aurora-float-reverse', duration: '16s' },
        ]}
      />

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Section tag */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <SectionTag variant="dark">{t('tagline')}</SectionTag>
        </motion.div>

        {/* Main heading — kinetic typography */}
        <div className="mt-8 leading-[0.85]">
          <KineticText
            text="BEYOND"
            as="span"
            className="block font-display font-bold italic text-8xl md:text-9xl lg:text-[12rem] uppercase gradient-warm-text"
            staggerDelay={0.04}
          />
          <motion.span
            className="block font-display font-bold text-6xl md:text-7xl lg:text-[8rem] uppercase text-[var(--foreground)]"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.1, 0.25, 1.0] }}
          >
            AGENCY
          </motion.span>
        </div>

        {/* Subcopy — typewriter-like fade */}
        <motion.p
          className="text-lg md:text-xl text-[#A8A29E] max-w-xl mx-auto mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
        >
          {t('heroBrandName')}
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <GlowButton href="/contact">
            {t('heroCtaFreeConsult')}
          </GlowButton>
          <Link
            href="/portfolio"
            className="glass-dark px-8 py-4 text-sm font-bold uppercase tracking-wider text-[var(--foreground)] rounded-[var(--radius-sm)] hover:border-[#FF4500]/60 transition-all duration-300 cursor-pointer text-center"
          >
            {t('heroCtaViewCases')}
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <span className="text-xs uppercase tracking-widest">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={20} />
        </motion.div>
      </motion.div>
    </section>
  )
}
```

- [ ] **Step 2: dev 서버에서 확인**

메인 페이지 히어로: BEYOND 글자 개별 등장 → AGENCY 슬라이드 인 → CTA glow 버튼 → 스크롤 인디케이터 bounce → 배경 오로라 blob 4개

- [ ] **Step 3: Commit**

```bash
git add components/hero-section.tsx
git commit -m "feat: hero section — kinetic typography, aurora background, glow button, scroll indicator"
```

---

## Task 11: 메인 페이지 섹션들에 Glass + Tilt + CountUp 적용

**Files:**
- Modify: `components/market-opportunity.tsx`
- Modify: `components/performance.tsx`
- Modify: `components/barriers.tsx`
- Modify: `components/solution-roadmap.tsx`
- Modify: `components/trust-signals.tsx`
- Modify: `components/final-cta.tsx`
- Modify: `components/footer-cta.tsx`
- Modify: `components/client-showcase.tsx`

이 태스크는 각 컴포넌트를 열어서 다음 패턴을 적용합니다:

**패턴 A — 다크 섹션 카드:**
```tsx
import { GlassCard } from '@/components/ui/glass-card'
import { TiltCard } from '@/components/ui/tilt-card'

// 기존 카드 div를:
<TiltCard>
  <GlassCard variant="dark" className="p-8">
    {/* 기존 카드 내용 */}
  </GlassCard>
</TiltCard>
```

**패턴 B — 크림 섹션 카드:**
```tsx
<TiltCard>
  <GlassCard variant="light" className="p-8">
    {/* 기존 카드 내용 */}
  </GlassCard>
</TiltCard>
```

**패턴 C — 숫자 카운트업:**
```tsx
import { CountUp } from '@/components/ui/count-up'

// 기존 정적 숫자 "300+"를:
<CountUp end={300} suffix="+" className="gradient-warm-text" />
```

**패턴 D — 다크 섹션 배경 오로라:**
```tsx
import { AuroraBackground } from '@/components/ui/aurora-background'

// 섹션 최상위에 추가 (relative 부모 필요):
<section className="relative ...">
  <AuroraBackground blobs={[
    { color: 'rgba(255,69,0,0.08)', size: 400, top: '10%', left: '70%', animation: 'aurora-float', duration: '18s' },
  ]} withDotPattern={false} />
  <div className="relative z-10">
    {/* 기존 내용 */}
  </div>
</section>
```

- [ ] **Step 1: 각 섹션 파일을 읽고 위 패턴을 적용**

각 컴포넌트를 읽고 카드 영역에 GlassCard+TiltCard를 래핑합니다. 숫자 영역에는 CountUp을 적용합니다. 다크 섹션에는 AuroraBackground를 추가합니다.

주의사항:
- `import` 문 상단에 추가
- 기존 카드의 `bg-*`, `border-*`, `shadow-*` 클래스는 GlassCard가 대체하므로 제거
- `rounded-*` 클래스도 GlassCard가 처리하므로 제거 (padding은 유지)
- 섹션 `className`에 `relative overflow-hidden` 추가 (AuroraBackground용)

- [ ] **Step 2: dev 서버에서 전체 메인 페이지 스크롤하며 확인**

Expected: 각 섹션 카드에 글래스 효과 + 마우스 호버 시 3D 틸트 + 숫자 카운트업 애니메이션

- [ ] **Step 3: Commit**

```bash
git add components/market-opportunity.tsx components/performance.tsx components/barriers.tsx components/solution-roadmap.tsx components/trust-signals.tsx components/final-cta.tsx components/footer-cta.tsx components/client-showcase.tsx
git commit -m "feat: main page sections — glass cards, 3D tilt, count-up, aurora backgrounds"
```

---

## Task 12: GlowSpotlight을 MainContent에 연결

**Files:**
- Modify: `components/main-content.tsx`

- [ ] **Step 1: GlowSpotlight import 및 추가**

`components/main-content.tsx` 수정:

```tsx
import { GlowSpotlight } from '@/components/ui/glow-spotlight'

// MainContent return문에 추가 (SafeHydration 바로 아래):
export function MainContent() {
  return (
    <>
      <GlowSpotlight />
      <SafeHydration fallback={<MainSkeleton />}>
        {/* ... 기존 섹션들 ... */}
      </SafeHydration>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/main-content.tsx
git commit -m "feat: add cursor glow spotlight to main page"
```

---

## Task 13: Navigation 글래스 강화 + 언더라인 애니메이션

**Files:**
- Modify: `components/navigation.tsx`

- [ ] **Step 1: Navigation 스타일 업데이트**

`components/navigation.tsx`에서:

1. 스크롤 시 nav 배경을 글래스로 변경 — `scrolled` 상태의 className:
   - 기존: `bg-background/95 backdrop-blur-md` (또는 유사)
   - 변경: `bg-[#1C1917]/80 backdrop-blur-xl border-b border-white/5`

2. 메뉴 링크에 hover 언더라인 효과 추가 — 각 Link에 `group` 클래스 추가 + 아래에 pseudo-element:
```tsx
<Link href={item.href} className="relative group ...">
  {item.label}
  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#FF4500] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
</Link>
```

3. CTA 버튼("문의하기")에 glow pulse 추가:
```tsx
className="... shadow-[0_0_15px_rgba(255,69,0,0.2)] animate-pulse-subtle"
```

4. 모바일 Sheet 배경을 글래스로:
```tsx
<SheetContent className="glass-dark border-l border-white/5 ...">
```

- [ ] **Step 2: dev 서버에서 확인**

스크롤 시 nav 글래스 전환, 메뉴 호버 시 오렌지 언더라인, CTA glow pulse

- [ ] **Step 3: Commit**

```bash
git add components/navigation.tsx
git commit -m "feat: navigation — glass backdrop, hover underline, CTA glow"
```

---

## Task 14: Footer 오로라 + 소셜 아이콘 hover

**Files:**
- Modify: `components/layout/footer.tsx`

- [ ] **Step 1: Footer 스타일 업데이트**

`components/layout/footer.tsx`에서:

1. footer 태그에 `relative overflow-hidden` 추가
2. 오로라 blob 추가 (좌하단):
```tsx
import { AuroraBackground } from '@/components/ui/aurora-background'

// footer 태그 안 최상단:
<AuroraBackground
  blobs={[
    { color: 'rgba(255,69,0,0.06)', size: 300, top: '50%', left: '-5%', animation: 'aurora-float', duration: '20s' },
  ]}
  withDotPattern={false}
/>
<div className="relative z-10">
  {/* 기존 footer 내용 */}
</div>
```

3. 링크 hover 색상을 오렌지로:
```tsx
className="... hover:text-[#FF4500] transition-colors duration-200"
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/footer.tsx
git commit -m "feat: footer — aurora blob, orange hover transitions"
```

---

## Task 15: 서브 페이지 — Creator, Portfolio, Service

**Files:**
- Modify: `components/creator-content.tsx`
- Modify: `components/portfolio-content.tsx`
- Modify: `components/service-content.tsx`

- [ ] **Step 1: 각 서브 페이지 콘텐츠 컴포넌트에 효과 적용**

공통 패턴 (각 파일에서):

1. 히어로/상단 영역에 AuroraBackground 추가 (blob 1~2개, 페이지마다 위치 변주)
2. 카드 영역에 GlassCard + TiltCard 래핑
3. 숫자 영역에 CountUp 적용
4. 섹션에 `relative overflow-hidden` 추가

크리에이터 페이지 카드 추가 효과:
```tsx
// 크리에이터 카드 hover 시 프로필 이미지 확대 + 오렌지 ring
className="... group"
// 이미지에:
className="... transition-transform duration-300 group-hover:scale-105 group-hover:ring-2 group-hover:ring-[#FF4500]/50"
```

포트폴리오 카드 hover overlay:
```tsx
// 썸네일 위에 글래스 오버레이:
<div className="absolute inset-0 glass-dark opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
  <h3 className="text-white font-bold translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{title}</h3>
</div>
```

- [ ] **Step 2: dev 서버에서 /creator, /portfolio, /service 확인**

- [ ] **Step 3: Commit**

```bash
git add components/creator-content.tsx components/portfolio-content.tsx components/service-content.tsx
git commit -m "feat: sub pages — glass cards, tilt, count-up, aurora backgrounds"
```

---

## Task 16: 서브 페이지 — About, Blog, Careers, Contact, Privacy

**Files:**
- Modify: `app/about/page.tsx`
- Modify: `components/blog-content.tsx`
- Modify: `app/careers/page.tsx`
- Modify: `app/contact/page.tsx`
- Modify: `app/privacy/page.tsx`

- [ ] **Step 1: 각 페이지에 효과 적용**

About:
- 스탯 카드에 GlassCard + TiltCard + CountUp
- 히어로에 AuroraBackground (blob 2개)
- 서비스 소개 카드에 GlassCard + 아이콘 glow circle

Blog:
- 블로그 카드에 GlassCard + TiltCard
- 리스트 페이지 상단에 AuroraBackground (blob 1개)

Careers:
- 포지션 카드에 GlassCard + TiltCard
- 상단에 AuroraBackground

Contact:
- 폼 영역에 GlassCard
- 배경에 AuroraBackground (blob 2개)

Privacy:
- AuroraBackground (blob 1개, 미니멀)

- [ ] **Step 2: dev 서버에서 각 페이지 확인**

- [ ] **Step 3: Commit**

```bash
git add app/about/page.tsx components/blog-content.tsx app/careers/page.tsx app/contact/page.tsx app/privacy/page.tsx
git commit -m "feat: remaining sub pages — glass, tilt, aurora effects"
```

---

## Task 17: 모바일 최적화 & 접근성 검증

**Files:**
- Modify: `app/globals.css` (reduced-motion 블록 강화)
- Modify: `components/ui/tilt-card.tsx` (touch 감지 개선)

- [ ] **Step 1: reduced-motion 블록에 aurora 비활성화 추가**

`globals.css`의 기존 `prefers-reduced-motion` 블록을 확인 — 이미 모든 animation을 0.01ms로 설정하므로 aurora/kinetic도 자동 적용됨. OK.

- [ ] **Step 2: TiltCard의 터치 감지를 SSR-safe하게 수정**

현재 `typeof window !== 'undefined'`를 렌더 중 직접 체크 → hydration mismatch 가능. `useState` + `useEffect`로 변경:

```tsx
const [isTouch, setIsTouch] = useState(true) // default true = 서버에서 틸트 비활성화
useEffect(() => {
  setIsTouch(window.matchMedia('(hover: none)').matches)
}, [])
```

- [ ] **Step 3: 모바일 뷰포트에서 dev 서버 확인**

Chrome DevTools → 모바일 시뮬레이션:
- 3D 틸트 비활성화 확인
- glow spotlight 비활성화 확인
- 오로라 blob 표시되지만 성능 OK 확인
- 카드 터치 시 정상 동작

- [ ] **Step 4: Commit**

```bash
git add app/globals.css components/ui/tilt-card.tsx
git commit -m "fix: mobile optimization — SSR-safe touch detection, reduced-motion"
```

---

## Task 18: 전체 통합 확인 & 최종 커밋

- [ ] **Step 1: 전 페이지 순회 체크리스트**

dev 서버에서 아래 페이지 모두 확인:
- `/` — 히어로 kinetic text + 오로라 + glow button + 스크롤 인디케이터 + 각 섹션 글래스/틸트
- `/service` — 히어로 슬라이드 + 서비스 카드 글래스/틸트
- `/creator` — 크리에이터 카드 글래스/틸트 + 호버 이미지 확대
- `/portfolio` — 포트폴리오 카드 글래스/틸트 + 호버 오버레이
- `/blog` — 블로그 카드 글래스
- `/about` — 스탯 카운트업 + 글래스 카드
- `/careers` — 포지션 카드 글래스
- `/contact` — 폼 글래스 + 오로라
- `/privacy` — 미니멀 오로라
- Nav: 글래스 전환 + 언더라인 + CTA glow
- Footer: 오로라 blob + 오렌지 hover
- 커서 glow spotlight: 다크 섹션에서 동작
- 커스텀 스크롤바: 오렌지 thin
- 모바일: 틸트/glow 비활성화

- [ ] **Step 2: 빌드 테스트**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page && npm run build
```

Expected: 빌드 성공, 경고 없음

- [ ] **Step 3: Commit & Push**

```bash
git add -A
git commit -m "feat: Warm Futurism design renewal — complete"
git push
```
