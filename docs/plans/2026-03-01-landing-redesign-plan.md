# Landing Page Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 메인 랜딩페이지를 Exaggerated Minimalism(Forma-inspired) 스타일로 리디자인. 흑백 교차 섹션, 오버사이즈 타이포, 비대칭 레이아웃 적용.

**Architecture:** 기존 8개 컴포넌트를 in-place 리팩토링. 디자인 시스템(`design-system/MASTER.md`) 기준으로 Phase별 순차 적용. CSS 변수/폰트를 먼저 교체한 뒤 섹션별로 위→아래 순서로 진행.

**Tech Stack:** Next.js 16, Tailwind CSS 4, Framer Motion 12, Lucide React, Google Fonts (Barlow Condensed, Playfair Display, Noto Sans KR/JP)

**Design Reference:** `design-system/MASTER.md`, `docs/plans/2026-03-01-landing-redesign-design.md`

---

## Phase 0: 디자인 시스템 기반 (globals.css + layout.tsx)

### Task 1: 폰트 교체 — layout.tsx

**Files:**
- Modify: `app/layout.tsx`

**Step 1: 폰트 import 교체**

Geist, Geist_Mono 제거 → Barlow_Condensed, Playfair_Display 추가. Noto_Sans_JP 유지.

```tsx
import { Barlow_Condensed, Playfair_Display, Noto_Sans_JP } from "next/font/google";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-display",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["italic"],
  variable: "--font-accent",
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-body",
  display: "swap",
});
```

**Step 2: html/body 클래스 교체**

```tsx
// Before
<html lang="ko" className={`${notoSansJP.variable} text-[15px]`}>
<body className={`${geist.className} flex min-h-screen flex-col font-sans antialiased bg-zinc-900`}>

// After
<html lang="ko" className={`${barlowCondensed.variable} ${playfairDisplay.variable} ${notoSansJP.variable}`}>
<body className="flex min-h-screen flex-col font-body antialiased bg-black text-base">
```

**Step 3: dev 서버에서 폰트 로딩 확인**

Run: `npm run dev` → 브라우저에서 폰트 변경 확인

---

### Task 2: CSS 변수 + 유틸리티 교체 — globals.css

**Files:**
- Modify: `app/globals.css`

**Step 1: :root CSS 변수 교체**

기존 oklch 기반 변수를 hex 기반으로 교체. `--radius: 0px` 유지.

```css
:root {
  /* Design System: Exaggerated Minimalism */
  --background: #000000;
  --foreground: #FAFAFA;
  --card: #111111;
  --card-foreground: #FAFAFA;
  --popover: #111111;
  --popover-foreground: #FAFAFA;
  --primary: #FFFFFF;
  --primary-foreground: #000000;
  --secondary: #111111;
  --secondary-foreground: #FAFAFA;
  --muted: #111111;
  --muted-foreground: #888888;
  --accent: #111111;
  --accent-foreground: #FAFAFA;
  --destructive: #888888;
  --destructive-foreground: #FAFAFA;
  --border: rgba(255,255,255,0.12);
  --input: #111111;
  --ring: #FAFAFA;
  --radius: 0px;

  /* Font families */
  --font-display: 'Barlow Condensed', sans-serif;
  --font-accent: 'Playfair Display', serif;
  --font-body: 'Noto Sans KR', 'Noto Sans JP', sans-serif;
}
```

**Step 2: font-family 유틸리티 추가**

globals.css 하단에 Tailwind 4 `@utility` 추가:

```css
/* Font utility classes */
@utility font-display {
  font-family: var(--font-display);
}

@utility font-accent {
  font-family: var(--font-accent);
  font-style: italic;
}

@utility font-body {
  font-family: var(--font-body);
}
```

**Step 3: 마키 keyframes 추가**

```css
@keyframes marquee-left {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes marquee-right {
  0% { transform: translateX(-50%); }
  100% { transform: translateX(0); }
}
```

**Step 4: 기존 미사용 CSS 정리**

기존 sidebar 변수, chart 변수 등 랜딩페이지에서 사용하지 않는 것들은 유지 (어드민에서 사용 가능). 충돌하는 변수만 교체.

**Step 5: dev 서버에서 변수 적용 확인**

---

### Task 3: 섹션 순서 변경 — main-content.tsx

**Files:**
- Modify: `components/main-content.tsx`

**Step 1: import 순서 및 렌더링 순서 변경**

```tsx
export function MainContent() {
  return (
    <SafeHydration fallback={<MainSkeleton />}>
      <HeroSection />
      <TrustSignals />
      <MarketOpportunity />
      <Barriers />
      <SolutionRoadmap />
      <FinalCTA />
      <Performance />
      <FooterCTA />
    </SafeHydration>
  )
}
```

**Step 2: MainSkeleton도 새 순서에 맞게 간소화**

히어로 스켈레톤만 유지 (나머지는 스크롤 아래라 불필요).

**Step 3: 커밋**

```
feat: reorder landing sections for alternating dark/light layout
```

---

## Phase 1: Navigation + Hero

### Task 4: Navigation 리팩토링

**Files:**
- Modify: `components/navigation.tsx`

**변경 사항:**
1. 로고 텍스트를 `font-display font-bold uppercase tracking-tight` 적용
2. 슬로건(`tagline`) 텍스트 제거
3. 스크롤 배경: `zinc-950/95` → `bg-black/90 backdrop-blur-md`
4. 비스크롤 배경: `zinc-900/85` → `bg-transparent`
5. 메뉴 호버: 텍스트 색상 변경 → 밑줄 width 0→100% 유지 (이미 있음)
6. 모바일 Sheet 배경: `bg-black`
7. 언어 토글 스타일: 기존 유지 (이미 미니멀)

**핵심 코드 변경:**

```tsx
// 로고 영역 — 슬로건 제거, 폰트 변경
<span className="font-display font-bold text-lg uppercase tracking-tight text-white">
  KOREANERS
</span>

// 스크롤 배경
const headerBg = scrolled
  ? 'bg-black/90 backdrop-blur-md border-b border-white/10'
  : 'bg-transparent border-b border-transparent'
```

**커밋:** `refactor: navigation to minimal transparent header`

---

### Task 5: Hero Section 리팩토링

**Files:**
- Modify: `components/hero-section.tsx`

**변경 사항:**
1. 배경: 그라데이션 + 그리드패턴 + radial → `bg-black`
2. 카피 구조: `heroBrandName` → `BEYOND` (Playfair Italic) + `AGENCY` (Barlow Condensed) 2줄
3. 태그라인: `text-sm uppercase tracking-[0.3em] text-white/60`
4. 서브카피: `text-lg md:text-xl text-white/70 max-w-xl mx-auto`
5. CTA: Button 컴포넌트 → 커스텀 스타일
6. fade-in 애니메이션: 기존 Framer Motion 유지하되 간소화

**핵심 구조:**

```tsx
<section className="relative min-h-screen flex items-center justify-center bg-black px-6 lg:px-24">
  <div className="max-w-7xl mx-auto text-center">
    {/* 태그라인 */}
    <p className="text-sm uppercase tracking-[0.3em] text-white/60 mb-8">
      {t('heroTagline')}
    </p>

    {/* 메인 헤딩 */}
    <h1 className="leading-[0.85]">
      <span className="block font-accent text-7xl md:text-8xl lg:text-[10rem] text-white">
        BEYOND
      </span>
      <span className="block font-display font-black text-7xl md:text-8xl lg:text-[10rem] uppercase text-white">
        AGENCY
      </span>
    </h1>

    {/* 서브카피 */}
    <p className="text-lg md:text-xl text-white/70 max-w-xl mx-auto mt-8">
      {t('heroSubcopy')}
    </p>

    {/* CTA */}
    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
      <Link href="/contact" className="bg-white text-black px-8 py-4 text-sm font-bold uppercase tracking-wider hover:bg-transparent hover:text-white border border-white transition-all duration-300 cursor-pointer">
        {t('heroCta1')}
      </Link>
      <Link href="/portfolio" className="bg-transparent text-white px-8 py-4 text-sm font-bold uppercase tracking-wider border border-white/30 hover:bg-white/10 transition-all duration-300 cursor-pointer">
        {t('heroCta2')}
      </Link>
    </div>
  </div>
</section>
```

**커밋:** `refactor: hero section to exaggerated minimalism style`

---

## Phase 2: 파트너 마키 + 시장 기회

### Task 6: Trust Signals → 파트너 마키 간소화

**Files:**
- Modify: `components/trust-signals.tsx`

**변경 사항:**
1. "TRUSTED BY" 헤딩, 부제, 수출바우처 텍스트: 제거
2. 3줄 마키 → 2줄 마키 (파트너를 2등분, 반대 방향)
3. 섹션 래퍼: `<section className="bg-black border-y border-white/10 py-4 overflow-hidden">`
4. 마키 속도: 기존 50s → 45s
5. 패딩: 기존 섹션 대형 패딩 → `py-4` (띠 형태)
6. 기존 75개 파트너 배열 유지, 2개 row로 분할

**커밋:** `refactor: trust signals to minimal marquee divider`

---

### Task 7: Market Opportunity → 라이트 섹션 리팩토링

**Files:**
- Modify: `components/market-opportunity.tsx`

**변경 사항:**
1. 배경: `bg-white`
2. 레이아웃: 중앙 3열 → 비대칭 2열 (`grid grid-cols-1 lg:grid-cols-2 gap-16 items-start`)
3. 좌측: 태그 `MARKET OPPORTUNITY` + 헤딩(Display) + 본문
4. 우측: 통계 카드 3개 세로 스택 (`flex flex-col gap-4`)
5. 카드: `bg-[#F5F5F5] border border-black/10 p-8`
6. 숫자: `font-display font-black text-5xl text-[#09090B]`
7. "일본"에 `font-accent` 적용
8. 텍스트 색상: 전부 dark 계열 (`text-[#09090B]`, `text-black/70`, `text-black/60`)

**커밋:** `refactor: market opportunity to light asymmetric layout`

---

## Phase 3: 장벽 + 솔루션

### Task 8: Barriers 리팩토링

**Files:**
- Modify: `components/barriers.tsx`

**변경 사항:**
1. 배경: `bg-black`
2. 카드 레이아웃: 수평(아이콘 좌 + 텍스트 우) → 세로(아이콘 상단)
3. 아이콘 박스(bg-white/10) 제거 → 아이콘만 `w-10 h-10 text-white/60 mb-4`
4. 카드: `bg-[#111] border border-white/10 p-8`
5. 호버: `hover:border-white/50 hover:-translate-y-1 transition-all duration-300`
6. 기존 아이콘 반전 효과 제거

**커밋:** `refactor: barriers to dark vertical card layout`

---

### Task 9: Solution Roadmap → 라이트 타임라인

**Files:**
- Modify: `components/solution-roadmap.tsx`

**변경 사항:**
1. 배경: `bg-white`
2. 레이아웃: 2열 카드 → 세로 타임라인
3. 타임라인 구조:
   - 좌측: 세로 라인(`border-l border-black/20`) + 원형 노드(스텝 번호)
   - 우측: 태그 라벨 + 제목 + 설명 + 하위 불릿
4. 번호 노드: `w-12 h-12 border-2 border-black flex items-center justify-center font-display font-bold text-sm`
5. 태그: `inline-block bg-black text-white text-xs uppercase tracking-wider px-3 py-1 mb-3`
6. 대형 배경 숫자(text-7xl) 제거
7. 텍스트: 전부 dark 계열

**핵심 구조:**

```tsx
<div className="relative">
  {steps.map((step, i) => (
    <div key={i} className="flex gap-8 mb-16 last:mb-0">
      {/* 좌측: 라인 + 노드 */}
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-2 border-black flex items-center justify-center font-display font-bold text-sm shrink-0">
          {String(i + 1).padStart(2, '0')}
        </div>
        {i < steps.length - 1 && <div className="w-px bg-black/20 flex-1 mt-2" />}
      </div>
      {/* 우측: 콘텐츠 */}
      <div className="pt-2 pb-8">
        <span className="inline-block bg-black text-white text-xs uppercase tracking-wider px-3 py-1 mb-3">
          {step.tag}
        </span>
        <h3 className="text-xl font-bold text-[#09090B] mb-2">{t(step.titleKey)}</h3>
        <p className="text-black/60 leading-relaxed mb-4">{t(step.descKey)}</p>
        <ul className="space-y-2">
          {step.features.map((f, j) => (
            <li key={j} className="text-sm text-black/50 flex items-center gap-2">
              <span className="w-1 h-1 bg-black/40 rounded-full shrink-0" />
              {t(f)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  ))}
</div>
```

**커밋:** `refactor: solution roadmap to light timeline layout`

---

## Phase 4: 실적 + 포트폴리오

### Task 10: FinalCTA → 실적 섹션 리팩토링

**Files:**
- Modify: `components/final-cta.tsx`

**변경 사항:**
1. 배경: 그라데이션 → `bg-black`
2. 섹션 헤더 추가: 태그 `RESULTS` + 메인 헤딩 (Display)
3. 숫자 크기: `text-4xl` → `text-6xl lg:text-8xl font-display font-black`
4. 4열 사이에 세로 구분선 `border-r border-white/10` (마지막 제외)
5. 설명: `text-sm text-white/50 mt-3 uppercase tracking-wider`
6. Counter 로직 유지

**커밋:** `refactor: final CTA to results section with oversized numbers`

---

### Task 11: Performance → 포트폴리오 정적 카드

**Files:**
- Modify: `components/performance.tsx`

**변경 사항:**
1. 배경: `bg-white` (라이트 섹션)
2. Embla 캐러셀 제거 → `grid grid-cols-1 md:grid-cols-3 gap-6`
3. Supabase 쿼리에 `.limit(3)` 추가 (최대 3개만)
4. 카드: 흰색 배경 + `border border-black/10`
5. 텍스트: dark 계열
6. 호버: `group-hover:scale-105` 유지 + `hover:shadow-lg`
7. 하단 CTA: 캐러셀 네비게이션 → 텍스트 링크 `전체 포트폴리오 보기 →`
8. 캐러셀 관련 import/state 정리

**커밋:** `refactor: performance to light portfolio grid`

---

## Phase 5: 문의 폼 + Footer

### Task 12: FooterCTA → 비대칭 문의 폼

**Files:**
- Modify: `components/footer-cta.tsx`

**변경 사항:**
1. 배경: `bg-[#111]`
2. 레이아웃: 중앙 세로 → 비대칭 2열 (`grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-16 items-start`)
3. 좌측: "LET'S" (Barlow) + "*TALK*" (Playfair Italic) 대형 헤딩 + 설명 + 이메일
4. 우측: 기존 폼 필드 + 검증 로직 100% 유지
5. 입력 필드: `bg-zinc-800 border-zinc-700` → `bg-transparent border-b border-white/20 focus:border-white py-3`
6. label: `text-xs uppercase tracking-wider text-white/40 mb-2`
7. 폼 그리드: 이름/회사/직책 `grid-cols-1 md:grid-cols-3`, 이메일/전화 `grid-cols-1 md:grid-cols-2`
8. Submit: `w-full bg-white text-black py-4 text-sm font-bold uppercase tracking-wider`
9. Supabase 저장, Notion 동기화, fbq Lead: 건드리지 않음

**커밋:** `refactor: footer CTA to asymmetric contact form`

---

### Task 13: Footer 미니멀 정리

**Files:**
- Modify: `components/layout/footer.tsx`

**변경 사항:**
1. 배경: `bg-zinc-900` → `bg-black`
2. 상단 구분: `border-t border-white/10`
3. 로고: `font-display font-bold text-lg uppercase tracking-tight`
4. 나머지 구조/내용 유지

**커밋:** `refactor: footer to pure black minimal style`

---

## Phase 6: 정리

### Task 14: 미사용 의존성 정리

**Files:**
- Modify: `package.json`
- Modify: `app/globals.css` (미사용 CSS 정리)

**Step 1: Embla 사용처 최종 확인**

```bash
grep -r "embla\|useEmbla\|EmblaCarousel" components/ --include="*.tsx" -l
```

Performance에서 제거했으면 → `npm uninstall embla-carousel-react`

carousel.tsx UI 컴포넌트는 다른 곳에서 쓸 수 있으니 유지.

**Step 2: Geist 폰트 import 확인**

```bash
grep -r "Geist\|geist" app/ components/ --include="*.tsx" -l
```

layout.tsx에서 제거 후 다른 곳에서 참조 없는지 확인.

**Step 3: 커밋**

```
chore: remove unused Embla dependency and Geist font imports
```

---

### Task 15: 최종 검증

**Step 1: dev 서버 기동 + 전체 페이지 확인**

```bash
npm run dev
```

체크리스트:
- [ ] 다크/라이트 섹션 교차 정상
- [ ] 폰트 3종 정상 로딩 (Barlow, Playfair, Noto Sans)
- [ ] 모바일 반응형 (375px)
- [ ] 태블릿 반응형 (768px)
- [ ] 데스크탑 (1440px)
- [ ] 문의 폼 제출 동작
- [ ] KR/JP 언어 전환
- [ ] 마키 스크롤 + 호버 정지
- [ ] Counter 애니메이션
- [ ] 네비게이션 스크롤 배경 전환

**Step 2: 빌드 확인**

```bash
npm run build
```

에러 없으면 완료.

**Step 3: 최종 커밋**

```
feat: complete landing page redesign — exaggerated minimalism
```
