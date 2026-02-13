# Careers Visual Upgrade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Careers 페이지의 비주얼 품질을 높이되 기존 다크/미니멀 톤을 유지한다.

**Architecture:** 기존 `app/careers/page.tsx` 단일 파일 수정이 메인. Navigation 공통 컴포넌트에 active state 추가. 번역 파일에 2개 키 추가. Framer Motion(이미 설치됨)과 react-intersection-observer(이미 설치됨)을 활용한 카운팅 애니메이션.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Framer Motion 12, Lucide React, react-intersection-observer

---

## Batch 1: Navigation Active State

### Task 1: Navigation active state 추가

**Files:**
- Modify: `components/navigation.tsx`

**Step 1: usePathname import 및 현재 경로 감지 추가**

`navigation.tsx` 상단에 `usePathname` import 추가, 컴포넌트 내에서 경로 변수 선언:

```tsx
import { usePathname } from 'next/navigation'
// ... 컴포넌트 내부
const pathname = usePathname()
```

**Step 2: 데스크톱 nav 링크에 active state 적용**

기존 데스크톱 메뉴 링크 (line ~121-129):

```tsx
{menuItems.filter((m) => m.href !== '/contact').map((item) => {
  const isActive = pathname === item.href
  return (
    <a
      key={item.href}
      href={item.href}
      className={`relative py-2 font-bold text-sm group whitespace-nowrap transition-all duration-200 ${
        isActive ? 'text-white' : 'text-zinc-200 hover:text-white'
      }`}
    >
      {item.label}
      <span className={`absolute bottom-0 left-0 h-0.5 bg-white transition-all duration-200 ${
        isActive ? 'w-full' : 'w-0 group-hover:w-full'
      }`} />
    </a>
  )
})}
```

**Step 3: 모바일 Sheet 메뉴에 active state 적용**

기존 모바일 메뉴 링크에 active 시 좌측 border 추가:

```tsx
className={`group flex items-center justify-between hover:bg-zinc-900 active:bg-zinc-800 transition-all duration-200 py-4 px-5 rounded-none text-base sm:text-sm font-bold tracking-tight relative z-10 border-b border-zinc-800 break-words ${
  pathname === item.href ? 'text-white border-l-2 border-l-white bg-zinc-900' : 'text-white'
}`}
```

**Step 4: 빌드 확인**

Run: `cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page && npx next build 2>&1 | tail -5`
Expected: 빌드 성공

**Step 5: 브라우저에서 /careers 페이지 확인**

Playwright로 `http://localhost:3000/careers` 접속, nav에서 Careers 링크에 하단 white bar 확인.

**Step 6: Commit**

```bash
git add components/navigation.tsx
git commit -m "feat(nav): add active state indicator for current page"
```

---

## Batch 2: Careers 페이지 전체 개선 + 번역 키

### Task 2: 번역 키 추가

**Files:**
- Modify: `locales/ko.json`
- Modify: `locales/jp.json`

**Step 1: ko.json에 새 키 추가**

기존 careers 키 블록 마지막(`careersLoading` 다음)에:

```json
"careersAboutDesc1": "코리너스는 일본 현지 네트워크와 네이티브 전문성을 결합하여 브랜드의 글로벌 확장을 설계하고 운영하는 크로스보더 마케팅 전문 기업입니다.",
"careersAboutDesc2": "단순한 마케팅 대행을 넘어, 브랜드가 일본 시장에서 성공적으로 안착하고 성장할 수 있도록 전략 컨설팅부터 실행, 성과 분석까지 전 과정을 책임집니다.",
"careersNoPositionQuestion": "원하는 포지션이 없으신가요?",
"careersNoPositionCta": "자유 양식으로 지원하기"
```

**Step 2: jp.json에 대응 키 추가**

```json
"careersAboutDesc1": "コリナースは日本現地ネットワークとネイティブの専門性を組み合わせ、ブランドのグローバル展開を設計・運営するクロスボーダーマーケティング専門企業です。",
"careersAboutDesc2": "単なるマーケティング代行を超え、ブランドが日本市場で成功裏に定着し成長できるよう、戦略コンサルティングから実行、成果分析まで全プロセスを担います。",
"careersNoPositionQuestion": "希望のポジションが見つかりませんか？",
"careersNoPositionCta": "自由形式で応募する"
```

### Task 3: Careers 페이지 전체 리팩터링

**Files:**
- Modify: `app/careers/page.tsx`

이 Task는 `page.tsx` 전체를 재작성합니다. 변경 사항:

**Step 1: import 수정**

기존 import에서 `CheckCircle2` 제거, 새 아이콘 추가. `ChevronDown` 추가. Framer Motion 및 useInView import 추가:

```tsx
import {
  Users, Tv, BookOpen, Globe, Brain, Zap, Target, Handshake, Rocket,
  Calendar, FileText, ChevronDown, Building2, Award, BarChart3, Mail,
} from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
```

**Step 2: AnimatedNumber 컴포넌트 추가**

page.tsx 내부, `CareersPage` 컴포넌트 위에 선언:

```tsx
function AnimatedNumber({ value, suffix = '' }: { value: string; suffix?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const numericPart = value.replace(/[^0-9.]/g, '')
  const prefix = value.replace(/[0-9.]/g, '')

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {isInView ? numericPart : '0'}
      {suffix}
    </span>
  )
}
```

**Step 3: Hero 섹션 개선**

- radial-gradient 배경 추가
- 디바이더 라인 추가
- 타이포 위계 수정 (subtitle ↔ description 크기 역전)
- scroll indicator 추가

```tsx
{/* Hero Section */}
<section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-24 relative overflow-hidden w-full max-w-full">
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,_rgba(255,255,255,0.04)_0%,_transparent_70%)]" />
  <div className="container mx-auto max-w-7xl relative z-10">
    <div className="text-center space-y-4 sm:space-y-6">
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight break-keep">
        JOIN KOREANERS
      </h1>
      <div className="w-24 h-px mx-auto bg-gradient-to-r from-transparent via-zinc-500 to-transparent" />
      <p className="text-xl sm:text-2xl md:text-3xl text-zinc-200 max-w-prose mx-auto break-keep font-semibold">
        {t('careersHeroSubtitle')}
      </p>
      <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto break-keep">
        {t('careersHeroTitle')}
      </p>
      <div className="pt-8">
        <ChevronDown className="w-6 h-6 text-zinc-500 mx-auto motion-safe:animate-bounce" />
      </div>
    </div>
  </div>
</section>
```

**Step 4: 기업 정체성 섹션 개선**

- 섹션 라벨 추가
- 문단 분리 (careersAboutDesc1 + careersAboutDesc2)
- max-w-prose 적용

```tsx
{/* About Section */}
<section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-24 w-full max-w-full">
  <div className="container mx-auto max-w-7xl">
    <div className="text-center mb-12 sm:mb-16">
      <p className="text-xs tracking-widest text-zinc-500 uppercase mb-4">About Us</p>
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-8 break-keep">
        {t('careersAboutTitle')}
      </h2>
      <div className="max-w-prose mx-auto space-y-4">
        <p className="text-base sm:text-lg text-white font-semibold leading-relaxed break-keep">
          {t('careersAboutDesc1')}
        </p>
        <p className="text-base sm:text-lg text-zinc-400 leading-relaxed break-keep">
          {t('careersAboutDesc2')}
        </p>
      </div>
    </div>
  </div>
</section>
```

**Step 5: 핵심 사업 영역 카드 개선**

- 섹션 라벨 추가
- 넘버링 + 좌측 accent border
- duration-300

```tsx
{/* Core Business Areas */}
<section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-24 bg-zinc-800/30 w-full max-w-full">
  <div className="container mx-auto max-w-7xl">
    <p className="text-xs tracking-widest text-zinc-500 uppercase text-center mb-4">Business</p>
    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white text-center mb-12 break-keep">
      {t('careersBizTitle')}
    </h2>
    <div className="grid md:grid-cols-3 gap-6">
      {bizAreas.map((area, index) => (
        <Card
          key={index}
          className="p-6 sm:p-8 bg-zinc-800 border-zinc-700/50 border-l-2 border-l-zinc-600 hover:border-l-white hover:border-white hover:-translate-y-1 transition-all duration-300 group min-w-0 overflow-hidden"
        >
          <p className="text-xs text-zinc-600 font-mono mb-4">{String(index + 1).padStart(2, '0')}</p>
          <div className="w-16 h-16 rounded-none bg-white/10 flex items-center justify-center mb-6 group-hover:bg-white group-hover:scale-110 transition-all duration-300 shrink-0">
            <area.icon className="w-8 h-8 text-white group-hover:text-black transition-colors duration-300" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3 break-keep">{t(area.titleKey)}</h3>
          <p className="text-zinc-200 leading-relaxed break-words">{t(area.descKey)}</p>
        </Card>
      ))}
    </div>
  </div>
</section>
```

**Step 6: Stats 섹션 개선**

- 세로 구분선
- 라벨 크기/색상 업
- (카운팅 애니메이션은 간단 버전으로 적용 — `useInView` + transition)

```tsx
{/* Stats Row */}
<section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-24 w-full max-w-full">
  <div className="container mx-auto max-w-7xl">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
      {stats.map((stat, index) => (
        <div key={index} className={`text-center ${index < stats.length - 1 ? 'md:border-r md:border-zinc-700/50' : ''}`}>
          <div className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2">
            {stat.value}
          </div>
          <div className="text-sm sm:text-base text-zinc-300 break-keep">
            {t(stat.labelKey)}
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
```

**Step 7: 핵심 경쟁력 섹션 개선**

- 섹션 라벨 추가
- 항목별 고유 아이콘
- 아이콘 박스 + 수직 중앙 정렬

```tsx
const strengthItems = [
  { icon: Globe, key: 'careersStrength1' as const },
  { icon: Building2, key: 'careersStrength2' as const },
  { icon: Award, key: 'careersStrength3' as const },
  { icon: BarChart3, key: 'careersStrength4' as const },
]
```

```tsx
{/* Core Strengths */}
<section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-24 bg-zinc-800/30 w-full max-w-full">
  <div className="container mx-auto max-w-7xl">
    <p className="text-xs tracking-widest text-zinc-500 uppercase text-center mb-4">Strengths</p>
    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white text-center mb-12 break-keep">
      {t('careersStrengthTitle')}
    </h2>
    <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
      {strengthItems.map((item, index) => (
        <div
          key={index}
          className="flex items-center gap-4 p-4 sm:p-6 bg-zinc-800 border border-zinc-700/50 hover:border-white transition-all duration-300"
        >
          <div className="w-10 h-10 bg-white/10 flex items-center justify-center shrink-0">
            <item.icon className="w-5 h-5 text-white" />
          </div>
          <p className="text-zinc-200 leading-relaxed break-keep">{t(item.key)}</p>
        </div>
      ))}
    </div>
  </div>
</section>
```

**Step 8: 인재상 섹션 개선 — 하단 2개 중앙 정렬**

- 섹션 라벨 추가
- 상단 3개 + 하단 2개 분리, 하단 flex justify-center
- duration-300

```tsx
{/* Culture / Talent Section */}
<section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-24 w-full max-w-full">
  <div className="container mx-auto max-w-7xl">
    <p className="text-xs tracking-widest text-zinc-500 uppercase text-center mb-4">Culture</p>
    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white text-center mb-12 break-keep">
      {t('careersCultureTitle')}
    </h2>
    {/* Top 3 */}
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {cultureValues.slice(0, 3).map((val, index) => (
        <Card key={index} className="p-6 sm:p-8 bg-zinc-800 border-zinc-700/50 hover:border-white hover:-translate-y-1 transition-all duration-300 group min-w-0 overflow-hidden">
          <div className="w-12 h-12 rounded-none bg-white/10 flex items-center justify-center mb-4 group-hover:bg-white group-hover:scale-110 transition-all duration-300 shrink-0">
            <val.icon className="w-6 h-6 text-white group-hover:text-black transition-colors duration-300" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2 break-keep">{t(val.titleKey)}</h3>
          <p className="text-zinc-200 text-sm leading-relaxed break-words">{t(val.descKey)}</p>
        </Card>
      ))}
    </div>
    {/* Bottom 2 centered */}
    <div className="flex flex-col sm:flex-row gap-6 mt-6 justify-center">
      {cultureValues.slice(3).map((val, index) => (
        <Card key={index + 3} className="p-6 sm:p-8 bg-zinc-800 border-zinc-700/50 hover:border-white hover:-translate-y-1 transition-all duration-300 group min-w-0 overflow-hidden sm:w-[calc(33.333%-0.5rem)] lg:w-[calc(33.333%-0.75rem)]">
          <div className="w-12 h-12 rounded-none bg-white/10 flex items-center justify-center mb-4 group-hover:bg-white group-hover:scale-110 transition-all duration-300 shrink-0">
            <val.icon className="w-6 h-6 text-white group-hover:text-black transition-colors duration-300" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2 break-keep">{t(val.titleKey)}</h3>
          <p className="text-zinc-200 text-sm leading-relaxed break-words">{t(val.descKey)}</p>
        </Card>
      ))}
    </div>
  </div>
</section>
```

**Step 9: 채용 공고 섹션 개선**

- 섹션 라벨 추가
- 카드 좌측 accent border
- 섹션 하단 fallback CTA

```tsx
{/* Job Openings Section */}
<section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-24 bg-zinc-800/30 w-full max-w-full">
  <div className="container mx-auto max-w-7xl">
    <div className="text-center mb-12">
      <p className="text-xs tracking-widest text-zinc-500 uppercase mb-4">Openings</p>
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-4 break-keep">
        {t('careersOpeningsTitle')}
      </h2>
      <p className="text-base sm:text-lg text-zinc-400 break-keep">
        {t('careersOpeningsSubtitle')}
      </p>
    </div>

    {/* ... loading/error/empty states 유지 ... */}

    {/* Job Cards — border-l-2 border-white 추가 */}
    {!loading && !error && jobs.length > 0 && (
      <div className="space-y-6 max-w-3xl mx-auto">
        {jobs.map((job) => (
          <Card key={job.id} className="p-6 sm:p-8 bg-zinc-800 border-zinc-700/50 border-l-2 border-l-white hover:border-white transition-all duration-300 min-w-0 overflow-hidden">
            {/* ... 기존 내용 유지 ... */}
          </Card>
        ))}
      </div>
    )}

    {/* Fallback CTA */}
    <div className="text-center mt-12 pt-8 border-t border-zinc-800">
      <p className="text-zinc-400 mb-3">{t('careersNoPositionQuestion')}</p>
      <a href="mailto:leo@koreaners.com" className="inline-flex items-center gap-2 text-white hover:text-zinc-300 transition-colors duration-200 font-semibold">
        <Mail className="w-4 h-4" />
        {t('careersNoPositionCta')}
      </a>
    </div>
  </div>
</section>
```

**Step 10: 빌드 확인**

Run: `cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page && npx next build 2>&1 | tail -10`
Expected: 빌드 성공

**Step 11: Playwright 비주얼 확인**

- `http://localhost:3000/careers` 풀페이지 스크린샷 (데스크톱 1440px + 모바일 375px)
- 개선 사항 확인: 섹션 라벨, 디바이더, 카드 보더, 그리드 정렬

**Step 12: Commit**

```bash
git add app/careers/page.tsx locales/ko.json locales/jp.json
git commit -m "feat(careers): visual upgrade — gradient accents, section labels, grid balance, typography hierarchy"
```

---

## Verification Checklist

- [ ] Navigation Careers 링크에 active state (하단 white bar)
- [ ] Hero: radial gradient glow + 디바이더 라인 + scroll indicator
- [ ] 기업 정체성: 문단 분리 + max-w-prose
- [ ] 핵심 사업: 넘버링 + 좌측 accent border
- [ ] Stats: 세로 구분선 + 라벨 가독성 개선
- [ ] 핵심 경쟁력: 고유 아이콘 + 아이콘 박스
- [ ] 인재상: 하단 2개 중앙 정렬
- [ ] 채용 공고: 좌측 accent border + fallback CTA
- [ ] 모바일(375px) 반응형 정상
- [ ] TypeScript 빌드 에러 없음
