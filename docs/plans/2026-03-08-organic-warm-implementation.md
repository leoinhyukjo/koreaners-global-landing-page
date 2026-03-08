# Organic Warm Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 코리너스 랜딩페이지 디자인 시스템을 "Exaggerated Minimalism"에서 "Organic Warm"으로 진화시키고, 페이지 트랜지션/스크롤 애니메이션/인터랙션을 강화한다.

**Architecture:** CSS 변수 기반 컬러 시스템을 warm 톤으로 교체하고, border-radius를 도입한다. Framer Motion으로 페이지 트랜지션과 다양한 스크롤 애니메이션을 추가한다. 섹션 태그 컴포넌트와 그라데이션 stats 카드를 새로 만든다.

**Tech Stack:** Next.js 16, Tailwind CSS 4, Framer Motion 12, React 19

---

## Batch 1: 컬러 시스템 & 기반 변경 (globals.css + layout)

### Task 1: CSS 변수 — warm 컬러로 교체

**Files:**
- Modify: `app/globals.css:18-53` (:root 블록)

**Step 1: :root 변수 업데이트**

`app/globals.css`의 `:root` 블록을 아래로 교체:

```css
:root {
  --background: #1C1917;
  --foreground: #FAF7F2;
  --card: #292524;
  --card-foreground: #FAF7F2;
  --popover: #292524;
  --popover-foreground: #FAF7F2;
  --primary: #FAF7F2;
  --primary-foreground: #1C1917;
  --secondary: #292524;
  --secondary-foreground: #FAF7F2;
  --muted: #292524;
  --muted-foreground: #A8A29E;
  --accent: #292524;
  --accent-foreground: #FAF7F2;
  --destructive: #A8A29E;
  --destructive-foreground: #FAF7F2;
  --border: rgba(168,162,158,0.15);
  --input: #292524;
  --ring: #FAF7F2;
  --chart-1: #FAF7F2;
  --chart-2: #A8A29E;
  --chart-3: #78716C;
  --chart-4: #44403C;
  --chart-5: #292524;
  --accent-orange: #FF4500;
  --accent-warm: #F59E0B;
  --accent-teal: #0D9488;
  --radius: 12px;
  --radius-sm: 8px;
  --radius-lg: 16px;
  --kn-light: #FAF7F2;
  --kn-dark: #1C1917;
  --kn-card-light: #F3EDE4;
  --sidebar: #292524;
  --sidebar-foreground: #FAF7F2;
  --sidebar-primary: #FAF7F2;
  --sidebar-primary-foreground: #1C1917;
  --sidebar-accent: #44403C;
  --sidebar-accent-foreground: #FAF7F2;
  --sidebar-border: rgba(168,162,158,0.15);
  --sidebar-ring: #FAF7F2;
}
```

**Step 2: @theme inline 라디우스 업데이트**

`app/globals.css`의 `@theme inline` 블록에서 radius 계산을 수정:

```css
  --radius-sm: var(--radius-sm);
  --radius-md: var(--radius);
  --radius-lg: var(--radius-lg);
  --radius-xl: calc(var(--radius-lg) + 4px);
```

**Step 3: 빌드 확인**

Run: `cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page && npm run build 2>&1 | tail -20`
Expected: 빌드 성공

**Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat: update CSS tokens to Organic Warm color system"
```

---

### Task 2: 그라데이션 유틸리티 & hero-glow 업데이트

**Files:**
- Modify: `app/globals.css:698-716` (hero-glow 섹션)
- Modify: `app/globals.css:718-745` (utility 섹션)

**Step 1: hero-glow를 warm 톤으로**

`.hero-glow::before`의 gradient를 업데이트:

```css
.hero-glow::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 600px;
  background: radial-gradient(ellipse 1000px 500px at 50% 0%, rgba(255,69,0,0.12) 0%, rgba(245,158,11,0.06) 40%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}
```

**Step 2: 그라데이션 유틸리티 추가**

`app/globals.css` 하단, 기존 utility 블록 뒤에 추가:

```css
/* Gradient utilities */
@utility gradient-warm {
  background: linear-gradient(135deg, #FF4500, #F59E0B);
}

@utility gradient-sunset {
  background: linear-gradient(135deg, #FF4500 0%, #F59E0B 50%, #0D9488 100%);
}

@utility gradient-soft {
  background: linear-gradient(135deg, #F3EDE4, #FAF7F2);
}

@utility gradient-dark {
  background: linear-gradient(135deg, #292524, #1C1917);
}

@utility gradient-warm-text {
  background: linear-gradient(135deg, #FF4500, #F59E0B);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Motion easing tokens */
@property --ease-smooth {
  syntax: '<string>';
  inherits: true;
  initial-value: cubic-bezier(0.25, 0.1, 0.25, 1.0);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: add gradient utilities and warm hero-glow"
```

---

### Task 3: 섹션 태그 컴포넌트 생성

**Files:**
- Create: `components/ui/section-tag.tsx`

**Step 1: 컴포넌트 작성**

```tsx
interface SectionTagProps {
  children: string
  variant?: 'light' | 'dark'
  className?: string
}

export function SectionTag({ children, variant = 'dark', className = '' }: SectionTagProps) {
  const styles = variant === 'dark'
    ? 'text-[#FF4500] bg-white/10'
    : 'text-[#FF4500] bg-[#FF4500]/10'

  return (
    <span className={`inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${styles} ${className}`}>
      {children}
    </span>
  )
}
```

**Step 2: Commit**

```bash
git add components/ui/section-tag.tsx
git commit -m "feat: add SectionTag pill component"
```

---

## Batch 2: 모션 시스템

### Task 4: fade-in.tsx 애니메이션 패턴 확장

**Files:**
- Modify: `components/ui/fade-in.tsx`

**Step 1: 기존 FadeIn 확장 + 새 패턴 추가**

전체 파일 재작성:

```tsx
'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface FadeInProps {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
}

export function FadeIn({ children, delay = 0, duration = 0.5, className }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1.0] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface RevealProps {
  children: ReactNode
  direction?: 'left' | 'right'
  delay?: number
  duration?: number
  className?: string
}

export function Reveal({ children, direction = 'left', delay = 0, duration = 0.6, className }: RevealProps) {
  const x = direction === 'left' ? -60 : 60
  return (
    <motion.div
      initial={{ opacity: 0, x }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1.0] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface ScaleInProps {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
}

export function ScaleIn({ children, delay = 0, duration = 0.6, className }: ScaleInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1.0] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface StaggerContainerProps {
  children: ReactNode
  staggerDelay?: number
  className?: string
}

export function StaggerContainer({ children, staggerDelay = 0.1, className }: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
```

**Step 2: 빌드 확인**

Run: `npm run build 2>&1 | tail -20`
Expected: 빌드 성공

**Step 3: Commit**

```bash
git add components/ui/fade-in.tsx
git commit -m "feat: expand animation system with Reveal, ScaleIn, Stagger"
```

---

### Task 5: 페이지 트랜지션 (template.tsx)

**Files:**
- Create: `app/template.tsx`

**Step 1: 트랜지션 래퍼 생성**

```tsx
'use client'

import { motion } from 'framer-motion'

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }}
    >
      {children}
    </motion.div>
  )
}
```

**Step 2: 빌드 확인**

Run: `npm run build 2>&1 | tail -20`
Expected: 빌드 성공

**Step 3: Commit**

```bash
git add app/template.tsx
git commit -m "feat: add page transition via template.tsx"
```

---

## Batch 3: 메인 페이지 컴포넌트 업데이트

### Task 6: hero-section.tsx — warm 톤 + 둥근 버튼

**Files:**
- Modify: `components/hero-section.tsx`

**Step 1: 전체 컴포넌트 업데이트**

```tsx
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'
import { SectionTag } from '@/components/ui/section-tag'

const fadeUp = {
  initial: { y: 30, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1.0] },
}

export default function HeroSection() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-[var(--kn-dark)] px-6 lg:px-24 hero-glow">
      <motion.div
        {...fadeUp}
        className="text-center"
      >
        {/* Section tag */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <SectionTag variant="dark">{t('tagline')}</SectionTag>
        </motion.div>

        {/* Main heading */}
        <h1 className="leading-[0.85] mt-8">
          <span className="block font-display font-bold italic text-8xl md:text-9xl lg:text-[12rem] text-[#FF4500] uppercase">
            BEYOND
          </span>
          <span className="block font-display font-bold text-6xl md:text-7xl lg:text-[8rem] uppercase text-[var(--foreground)]">
            AGENCY
          </span>
        </h1>

        {/* Subcopy */}
        <p className="text-lg md:text-xl text-[#A8A29E] max-w-xl mx-auto mt-8">
          {t('heroBrandName')}
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Link href="/contact" className="gradient-warm text-white px-8 py-4 text-sm font-bold uppercase tracking-wider rounded-[var(--radius-sm)] hover:opacity-90 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#FF4500]/20 cursor-pointer text-center">
            {t('heroCtaFreeConsult')}
          </Link>
          <Link href="/portfolio" className="bg-transparent text-[var(--foreground)] px-8 py-4 text-sm font-bold uppercase tracking-wider border border-[#A8A29E]/30 rounded-[var(--radius-sm)] hover:border-[#FF4500] hover:text-[#FF4500] transition-all duration-300 cursor-pointer text-center">
            {t('heroCtaViewCases')}
          </Link>
        </div>
      </motion.div>
    </section>
  )
}
```

**Step 2: Commit**

```bash
git add components/hero-section.tsx
git commit -m "feat: hero section with warm tones, gradient CTA, section tag"
```

---

### Task 7: market-opportunity.tsx — 그라데이션 stats 카드

**Files:**
- Modify: `components/market-opportunity.tsx`

**Step 1: 전체 컴포넌트 업데이트**

```tsx
'use client'

import { FadeIn, Reveal, StaggerContainer, StaggerItem } from '@/components/ui/fade-in'
import { Counter } from '@/components/ui/counter'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'
import { SectionTag } from '@/components/ui/section-tag'

export function MarketOpportunity() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)

  const stats = [
    { titleKey: 'marketStat1Title' as const, subtitleKey: 'marketStat1Subtitle' as const, descKey: 'marketStat1Desc' as const },
    { titleKey: 'marketStat2Title' as const, subtitleKey: 'marketStat2Subtitle' as const, descKey: 'marketStat2Desc' as const },
    { titleKey: 'marketStat3Title' as const, subtitleKey: 'marketStat3Subtitle' as const, descKey: 'marketStat3Desc' as const },
  ]

  return (
    <section id="market" className="bg-[var(--kn-light)] py-24 md:py-32 lg:py-40 px-6 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left column — Text */}
          <Reveal direction="left">
            <div>
              <SectionTag variant="light">MARKET OPPORTUNITY</SectionTag>
              <h2 className="font-display font-bold text-5xl lg:text-7xl uppercase leading-[0.9] text-[var(--kn-dark)] max-w-md mt-6">
                <span className="block">{t('marketTitle1')}</span>
                <span className="block">{t('marketTitle2')}</span>
              </h2>
              <p className="text-lg text-[#78716C] leading-relaxed mt-6">
                {t('marketSubtitle')}
              </p>
            </div>
          </Reveal>

          {/* Right column — Gradient stats card */}
          <Reveal direction="right">
            <div className="rounded-[var(--radius-lg)] overflow-hidden gradient-sunset p-8 md:p-10">
              <StaggerContainer staggerDelay={0.15} className="flex flex-col gap-6">
                {stats.map((stat, index) => (
                  <StaggerItem key={index}>
                    <div className="bg-white/10 backdrop-blur-sm rounded-[var(--radius)] p-6">
                      <div className="text-xs text-white/70 mb-1 font-medium uppercase tracking-wider">
                        {t(stat.titleKey)}
                      </div>
                      <div className="font-display font-bold text-5xl text-white">
                        {index === 0 ? <><Counter end={500} />{locale === 'ja' ? '万' : '만'}</> :
                         index === 1 ? <><Counter end={25} />%</> :
                         <><Counter end={90} />%</>}
                      </div>
                      <div className="text-sm text-white/60 mt-2">
                        {t(stat.descKey)}
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
```

**Step 2: Commit**

```bash
git add components/market-opportunity.tsx
git commit -m "feat: gradient stats card with stagger animation"
```

---

### Task 8: barriers.tsx — stagger + 둥근 카드 + 향상된 호버

**Files:**
- Modify: `components/barriers.tsx`

**Step 1: 전체 컴포넌트 업데이트**

```tsx
'use client'

import { Database, Shield, Target, AlertTriangle } from 'lucide-react'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/fade-in'
import { SectionTag } from '@/components/ui/section-tag'

const BARRIER_DESC_KEYS = ['barrier1Desc', 'barrier2Desc', 'barrier3Desc', 'barrier4Desc'] as const

export function Barriers() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)
  const barriers = [
    { icon: Database, title: 'Data Black-box', descKey: BARRIER_DESC_KEYS[0] },
    { icon: Shield, title: 'Trust Barrier', descKey: BARRIER_DESC_KEYS[1] },
    { icon: Target, title: 'Lack of Strategy', descKey: BARRIER_DESC_KEYS[2] },
    { icon: AlertTriangle, title: 'Operational Risk', descKey: BARRIER_DESC_KEYS[3] },
  ]

  return (
    <section className="bg-[var(--kn-dark)] py-24 md:py-32 lg:py-40 px-6 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <FadeIn>
          <SectionTag variant="dark">BARRIERS</SectionTag>
          <h2 className="font-display font-bold text-4xl lg:text-6xl uppercase leading-[0.9] text-[var(--foreground)] max-w-2xl mt-6">
            {t('barriersTitle1')}
            {t('barriersTitle2')}
          </h2>
        </FadeIn>

        <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-16">
          {barriers.map((barrier, index) => (
            <StaggerItem key={index}>
              <div className="bg-card rounded-[var(--radius)] border border-[var(--border)] p-8 hover:border-[#FF4500]/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#FF4500]/5 transition-all duration-300 cursor-pointer">
                <barrier.icon className="w-10 h-10 text-[#FF4500]/70 mb-4" />
                <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">{barrier.title}</h3>
                <p className="text-sm text-[#A8A29E] leading-relaxed">{t(barrier.descKey)}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
```

**Step 2: Commit**

```bash
git add components/barriers.tsx
git commit -m "feat: barriers with stagger animation, rounded cards, warm tones"
```

---

### Task 9: solution-roadmap.tsx — 둥근 feature 태그 + warm 컬러

**Files:**
- Modify: `components/solution-roadmap.tsx`

**Step 1: 전체 컴포넌트 업데이트**

```tsx
'use client'

import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'
import { FadeIn } from '@/components/ui/fade-in'
import { SectionTag } from '@/components/ui/section-tag'

const STEP_KEYS = [
  { tag: 'Diagnostic', titleKey: 'solutionStep1Title' as const, descKey: 'solutionStep1Desc' as const, featureKeys: ['solutionStep1F1', 'solutionStep1F2', 'solutionStep1F3'] as const },
  { tag: 'Seeding', titleKey: 'solutionStep2Title' as const, descKey: 'solutionStep2Desc' as const, featureKeys: ['solutionStep2F1', 'solutionStep2F2', 'solutionStep2F3'] as const },
  { tag: 'Impact', titleKey: 'solutionStep3Title' as const, descKey: 'solutionStep3Desc' as const, featureKeys: ['solutionStep3F1', 'solutionStep3F2', 'solutionStep3F3'] as const },
  { tag: 'Management', titleKey: 'solutionStep4Title' as const, descKey: 'solutionStep4Desc' as const, featureKeys: ['solutionStep4F1', 'solutionStep4F2', 'solutionStep4F3'] as const },
]

export function SolutionRoadmap() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)
  const steps = STEP_KEYS

  return (
    <section id="solution" className="bg-[var(--kn-light)] py-24 md:py-32 lg:py-40 px-6 lg:px-24">
      <div className="max-w-7xl mx-auto">
        {/* Section tag */}
        <FadeIn>
          <div className="flex items-center gap-4 mb-16">
            <SectionTag variant="light">OUR PROCESS</SectionTag>
            <div className="h-px flex-1 bg-[var(--kn-dark)]/10" />
          </div>
        </FadeIn>

        {/* Steps */}
        <div className="space-y-24 md:space-y-32">
          {steps.map((step, i) => (
            <FadeIn key={i} delay={i * 0.05}>
              <div>
                {/* Number + Tag */}
                <div className="flex items-center gap-3 mb-4 md:mb-6">
                  <span className="font-display font-bold text-xl md:text-2xl gradient-warm-text">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-xs uppercase tracking-[0.2em] text-[#78716C] font-bold">
                    {step.tag}
                  </span>
                </div>

                {/* MASSIVE title */}
                <h3 className="font-display font-bold text-5xl md:text-7xl lg:text-[6rem] xl:text-[8rem] uppercase leading-[0.85] tracking-tight text-[var(--kn-dark)]">
                  {t(step.titleKey)}
                </h3>

                {/* Description + Features row */}
                <div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 items-start">
                  <p className="text-base md:text-lg text-[#78716C] leading-relaxed max-w-xl">
                    {t(step.descKey)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {step.featureKeys.map((f, j) => (
                      <span key={j} className="text-xs text-[#78716C] border border-[var(--kn-dark)]/10 px-3 py-1.5 uppercase tracking-wider rounded-full">
                        {t(f)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                {i < steps.length - 1 && (
                  <div className="h-px bg-[var(--kn-dark)]/10 mt-24 md:mt-32" />
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
```

**Step 2: Commit**

```bash
git add components/solution-roadmap.tsx
git commit -m "feat: solution roadmap with warm tones, rounded feature tags"
```

---

### Task 10: final-cta.tsx — warm 컬러 + 섹션 태그

**Files:**
- Modify: `components/final-cta.tsx`

**Step 1: 전체 컴포넌트 업데이트**

```tsx
'use client'

import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/fade-in'
import { SectionTag } from '@/components/ui/section-tag'

const stats = [
  { value: '300+', key: 'finalCtaStat1' as const },
  { value: '105', key: 'finalCtaStat2' as const },
  { value: (locale: string) => (locale === 'ja' ? '30万' : '30만'), key: 'finalCtaStat3' as const },
  { value: '250%', key: 'finalCtaStat4' as const },
]

export function FinalCTA() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)

  return (
    <section className="bg-[var(--kn-dark)] py-24 md:py-32 lg:py-40 px-6 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <FadeIn>
          <SectionTag variant="dark">RESULTS</SectionTag>
          <h2 className="font-display font-bold text-4xl lg:text-6xl uppercase mt-6 leading-[0.9] text-[var(--foreground)]">
            {t('finalCtaTitle1')}<br />
            {t('finalCtaTitle2')}
          </h2>
        </FadeIn>

        {/* Stats Grid */}
        <StaggerContainer staggerDelay={0.1} className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
          {stats.map((stat, index) => (
            <StaggerItem key={stat.key}>
              <div className={`${index < stats.length - 1 ? 'border-r border-[var(--border)]' : ''}`}>
                <div className="font-display font-bold text-6xl lg:text-8xl gradient-warm-text leading-none">
                  {typeof stat.value === 'function' ? stat.value(locale) : stat.value}
                </div>
                <div className="text-sm text-[#A8A29E] mt-3 uppercase tracking-wider">
                  {t(stat.key)}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
```

**Step 2: Commit**

```bash
git add components/final-cta.tsx
git commit -m "feat: final CTA with gradient text stats, stagger animation"
```

---

### Task 11: performance.tsx — 둥근 카드 + warm 컬러 + 향상된 호버

**Files:**
- Modify: `components/performance.tsx`

**Step 1: 전체 컴포넌트 업데이트**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Portfolio } from '@/lib/supabase'
import Link from 'next/link'
import { SkeletonGrid } from '@/components/ui/skeleton-card'
import { useLocale } from '@/contexts/locale-context'
import { getTranslation } from '@/lib/translations'
import { getPortfolioTitle, getPortfolioClientName } from '@/lib/localized-content'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/fade-in'
import { SectionTag } from '@/components/ui/section-tag'

export function Performance() {
  const { locale } = useLocale()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(locale, key)
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPortfolios()
  }, [])

  async function fetchPortfolios() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) throw error
      setPortfolios(data || [])
    } catch (error: any) {
      console.error('Error fetching portfolios:', error)
      setPortfolios([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="performance" className="bg-[var(--kn-light)] py-24 md:py-32 lg:py-40 px-6 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <FadeIn>
          <SectionTag variant="light">PORTFOLIO</SectionTag>
          <h2 className="font-display font-bold text-4xl lg:text-6xl uppercase mt-6 leading-[0.9] text-[var(--kn-dark)] max-w-md">
            {t('performanceTitle1')}{t('performanceTitle2')}
          </h2>
        </FadeIn>

        {loading ? (
          <div className="mt-16">
            <SkeletonGrid count={3} />
          </div>
        ) : portfolios.length === 0 ? (
          <div className="text-center py-20 mt-16">
            <p className="text-[#78716C] text-lg">
              {t('performanceEmpty')}
            </p>
          </div>
        ) : (
          <>
            <StaggerContainer staggerDelay={0.15} className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              {portfolios.slice(0, 3).map((item) => (
                <StaggerItem key={item.id}>
                  <Link href={`/portfolio/${item.id}`} className="group cursor-pointer block">
                    <div className="aspect-video bg-[var(--kn-card-light)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--kn-dark)]/5">
                      {item.thumbnail_url ? (
                        <img
                          src={item.thumbnail_url}
                          alt={getPortfolioTitle(item, locale) || 'Portfolio image'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--kn-dark)]/20 font-display font-bold text-4xl">
                          {item.category?.[0]?.charAt(0) || 'P'}
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <span className="text-xs uppercase tracking-wider text-[#FF4500]">
                        {item.category && item.category.length > 0 ? item.category[0] : 'ETC'}
                      </span>
                      <h3 className="text-xl font-bold text-[var(--kn-dark)] mt-1 group-hover:text-[#FF4500] transition-colors duration-300">
                        {getPortfolioTitle(item, locale)}
                      </h3>
                      <p className="text-sm text-[#78716C] mt-1">
                        {getPortfolioClientName(item, locale)}
                      </p>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>

            <FadeIn delay={0.3}>
              <div className="mt-12 text-center">
                <Link
                  href="/portfolio"
                  className="text-sm uppercase tracking-wider font-bold text-[var(--kn-dark)] border-b border-[var(--kn-dark)]/30 hover:border-[#FF4500] hover:text-[#FF4500] pb-1 transition-colors duration-300"
                >
                  {t('performanceViewAll')} →
                </Link>
              </div>
            </FadeIn>
          </>
        )}
      </div>
    </section>
  )
}
```

**Step 2: Commit**

```bash
git add components/performance.tsx
git commit -m "feat: portfolio section with warm tones, rounded images, stagger"
```

---

### Task 12: client-showcase.tsx — 둥근 태그 + warm 톤

**Files:**
- Modify: `components/client-showcase.tsx`

**Step 1: MarqueeRow 카드에 border-radius 추가, 컬러 warm으로**

기존 파일에서 변경점:
- 마퀴 카드: `bg-card border border-border px-6 py-3` → `bg-card border border-[var(--border)] px-6 py-3 rounded-full`
- 섹션 라벨을 SectionTag로 교체
- 컬러를 CSS 변수 참조로

```tsx
'use client'

import { SectionTag } from '@/components/ui/section-tag'

const CLIENTS_ROW1 = [
  'BBIA', 'FOODOLOGY', 'INGA', 'Matin Kim', 'medicube', 'MEDI-PEEL', 'MENTHOLOGY',
  '미쟝센', 'moev', 'OVMENT', 'TREEMINGBIRD', 'WHIPPED', '강남언니', '녹십자웰빙',
  '뉴트리원', '더멜라닌', '모아씨앤씨', '세예의원', '아비쥬클리닉', '오운의원',
  '오퓰리크', '와우바이오텍', '플랜에스클리닉',
]

const CLIENTS_ROW2 = [
  'BNC KOREA', 'JUVENTA HEALTHCARE', 'KATE의원', 'Onlif', '더북컴퍼니', '미디어앤아트',
  '바비톡', '바이트랩', '스크럽대디', '인에디트', '코모래비', '트웨니스', 'Hakit',
  'The SMC Group', '감자밭', '구미곱창', '논두렁오리주물럭', '맘스피자', '판동면옥',
  'Bocado Butter', 'newmix', '가나스윔', 'narka',
]

const CLIENTS_ROW3 = [
  'NUMBERING', '네이처리퍼블릭', '뉴베러', '리포데이', 'MAJOURNEE', '블랑디바',
  '샵한현재', '싱글즈', '아일로', '엔트로피', 'OJOS', '와이낫', '원데이즈유',
  '정샘물뷰티', '코스노리', 'TNMORPH', "AGE20'S", 'ArteSinsa', 'Biodance',
  'BIOHEAL BOH', "d'Alba", 'Dr. Althea', 'Dr. G',
]

function MarqueeRow({ clients, direction, duration }: { clients: string[]; direction: 'left' | 'right'; duration: string }) {
  const duplicated = [...clients, ...clients]
  const animName = direction === 'left' ? 'marquee-left' : 'marquee-right'

  return (
    <div className="overflow-hidden py-2" aria-hidden>
      <div
        className="flex gap-3 w-max"
        style={{ animation: `${animName} ${duration} linear infinite` }}
      >
        {duplicated.map((name, i) => (
          <div
            key={`${name}-${i}`}
            className="flex-shrink-0 bg-card border border-[var(--border)] px-6 py-3 rounded-full hover:border-[#FF4500]/40 transition-colors duration-300"
          >
            <span className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider whitespace-nowrap">
              {name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ClientShowcase() {
  return (
    <section className="bg-[var(--kn-dark)] py-16 md:py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-24 mb-8">
        <SectionTag variant="dark">
          TRUSTED BY {CLIENTS_ROW1.length + CLIENTS_ROW2.length + CLIENTS_ROW3.length}+ BRANDS
        </SectionTag>
      </div>

      <div className="space-y-1">
        <MarqueeRow clients={CLIENTS_ROW1} direction="left" duration="50s" />
        <MarqueeRow clients={CLIENTS_ROW2} direction="right" duration="50s" />
        <MarqueeRow clients={CLIENTS_ROW3} direction="left" duration="50s" />
      </div>
    </section>
  )
}
```

**Step 2: Commit**

```bash
git add components/client-showcase.tsx
git commit -m "feat: client showcase with rounded pills, warm tones"
```

---

### Task 13: navigation.tsx — 링크 호버 애니메이션 + warm 톤

**Files:**
- Modify: `components/navigation.tsx`

**Step 1: 네비 링크 언더라인을 오렌지로 변경**

변경 포인트 (최소 수정):
- Line 89: `bg-background/90` → `bg-[var(--kn-dark)]/90`
- Line 131: 언더라인 `bg-white` → `bg-[#FF4500]`
- Line 138: Contact 버튼 `rounded-none` 삭제 안 해도 됨 (Button 컴포넌트가 --radius 사용)
- 모바일 메뉴 아이템: `rounded-none` → 제거 (자동으로 --radius 적용)

구체적으로 navigation.tsx에서 아래 3곳만 수정:

1. Line 131: `bg-white` → `bg-[#FF4500]`
2. Line 104: 랭귀지 토글 `rounded-none` → 삭제 (자동 radius 적용)
3. Line 147: 모바일 랭귀지 토글 `rounded-none` → 삭제

**Step 2: Commit**

```bash
git add components/navigation.tsx
git commit -m "feat: navigation with orange underline hover, warm tones"
```

---

## Batch 4: 검증 & 마무리

### Task 14: 빌드 & 시각 확인

**Step 1: 전체 빌드**

Run: `cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page && npm run build 2>&1 | tail -30`
Expected: 빌드 성공

**Step 2: dev 서버 띄우기**

Run: `npm run dev`
Expected: localhost:3000에서 변경사항 확인 가능

**Step 3: 시각 체크리스트**

- [ ] 배경색이 크림(#FAF7F2)/웜다크(#1C1917)로 변경되었는지
- [ ] 카드/버튼에 border-radius가 적용되었는지
- [ ] hero-glow가 따뜻한 톤으로 변경되었는지
- [ ] 섹션 태그(pill)가 각 섹션 상단에 표시되는지
- [ ] MarketOpportunity stats가 그라데이션 카드로 표시되는지
- [ ] 페이지 전환 시 fade 애니메이션이 작동하는지
- [ ] 스크롤 시 stagger/reveal 애니메이션이 작동하는지
- [ ] 카드 호버 시 떠오르는 효과 + 그림자 확장
- [ ] FinalCTA 숫자가 gradient-warm-text로 표시되는지
- [ ] 네비 링크 호버 시 오렌지 언더라인
- [ ] 마퀴 태그가 rounded-full pill 형태

### Task 15: design-system/MASTER.md 업데이트

**Files:**
- Modify: `design-system/MASTER.md`

기존 "Exaggerated Minimalism" 내용을 "Organic Warm v2"로 업데이트.
주요 변경: 컬러 토큰, border-radius 규칙, 그라데이션 허용 범위, 모션 시스템 문서화.

**Commit**

```bash
git add design-system/MASTER.md
git commit -m "docs: update design system to Organic Warm v2"
```
