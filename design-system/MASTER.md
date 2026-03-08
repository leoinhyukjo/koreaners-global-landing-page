# KOREANERS Design System — MASTER v2 (Organic Warm)

> 모든 페이지/컴포넌트 구현 시 이 문서를 기준으로 합니다.
> 페이지별 오버라이드가 있으면 `design-system/pages/<page>.md`를 우선 적용합니다.

## Style: Organic Warm

레퍼런스: Claura (Framer), 이전 Squarespace Forma에서 진화

핵심 원칙:
- **크림/웜다크 교차 배경** — #1C1917(웜다크)와 #FAF7F2(크림) 섹션 교차
- **오렌지(#FF4500) + 앰버/틸 그라데이션** — accent 영역에 의도적으로 사용
- 오버사이즈 condensed 타이포그래피 — 타이포가 곧 디자인
- 극단적 여백 (negative space)
- 에디토리얼/매거진 그리드 (비대칭 허용)
- **둥근 모서리** — 카드 12px, 버튼 8px, 이미지/배너 16px
- hero-glow: 상단 radial-gradient (오렌지→앰버, 600px)
- **부드러운 모션** — 페이지 트랜지션, 다양한 스크롤 애니메이션

---

## Colors

### Color Tokens

```css
--kn-dark:       #1C1917;    /* 웜다크 섹션 배경 (stone-950) */
--kn-light:      #FAF7F2;    /* 크림 섹션 배경 */
--kn-card-light: #F3EDE4;    /* 라이트 카드 배경 (warm sand) */
--accent-orange: #FF4500;    /* 포인트 — CTA, 숫자, 태그 */
--accent-warm:   #F59E0B;    /* 그라데이션 보조 (amber-500) */
--accent-teal:   #0D9488;    /* 그라데이션 보조 (teal-600) */
```

### 그라데이션 팔레트

```css
gradient-warm:      #FF4500 → #F59E0B   /* CTA 버튼, 강조 */
gradient-sunset:    #FF4500 → #F59E0B → #0D9488  /* stats 카드, 배너 */
gradient-soft:      #F3EDE4 → #FAF7F2   /* 카드 배경 */
gradient-dark:      #292524 → #1C1917   /* 다크 카드 깊이감 */
gradient-warm-text: #FF4500 → #F59E0B   /* 그라데이션 텍스트 */
```

### 규칙

- 배경은 `--kn-dark`(#1C1917) 또는 `--kn-light`(#FAF7F2) 교차
- 그라데이션은 **accent 영역에 의도적으로** — stats 카드, CTA 버튼, 숫자 텍스트
- 전체 섹션 배경에 그라데이션 사용 금지 — 카드/버튼/텍스트 단위로만

### 다크 섹션 (bg-[var(--kn-dark)])

| 토큰 | 값 | 용도 |
|------|------|------|
| 배경 | `#1C1917` | 섹션 배경 |
| 카드 배경 | `#292524` (stone-800) | 카드, 입력 필드 |
| 텍스트 | `#FAF7F2` | 제목, 주요 텍스트 |
| 뮤트 | `#A8A29E` (stone-400) | 부가 설명, 캡션, 라벨 |
| 보더 | `rgba(168,162,158,0.15)` | 구분선, 카드 테두리 |
| 액센트 | `#FF4500` | 숫자, CTA, 태그, 장식 |

### 라이트 섹션 (bg-[var(--kn-light)])

| 토큰 | 값 | 용도 |
|------|------|------|
| 배경 | `#FAF7F2` | 섹션 배경 |
| 카드 배경 | `#F3EDE4` (warm sand) | 카드, stat 블록 |
| 텍스트 | `#1C1917` | 제목, 주요 텍스트 |
| 뮤트 | `#78716C` (stone-500) | 부가 설명, 캡션 |
| 보더 | `var(--kn-dark)/10` | 구분선, 카드 테두리, 태그 |
| 액센트 | `#FF4500` | 숫자, CTA, 태그, step 번호 |

### 섹션 리듬

```
[#1C1917] 히어로 — hero-glow + SectionTag pill
[#1C1917] 마키 — 마퀴 (rounded-full pills)
[#FAF7F2] 마켓 기회 — gradient-sunset stats 카드
[#1C1917] 장벽 — rounded 카드 + stagger
[#FAF7F2] 솔루션 로드맵 — 오버사이즈 타이포, gradient-warm-text 번호
[#1C1917] 실적(Results) — gradient-warm-text 숫자
[#FAF7F2] 포트폴리오 — rounded 이미지 카드
[#1C1917] 클라이언트 쇼케이스 — rounded-full pill 마퀴
[#1C1917] CTA — "CONTACT US" + 문의 폼
[#1C1917] 푸터
```

---

## Typography

### 3+1 Font System

| 역할 | 폰트 | Weight | CSS Variable | 용도 |
|------|------|--------|-------------|------|
| Display EN | Barlow Condensed | 700 | `--font-display` | 영문 섹션 헤딩, 대형 숫자, 로고 |
| Display KR | (Barlow Condensed → Noto Sans JP fallback) | — | `--font-display` | 한글 헤딩 자동 fallback |
| Accent | Playfair Display Italic | 400, 700 | `--font-accent` | 헤딩 내 강조 단어 (섹션당 1개) |
| Body | Noto Sans KR / Noto Sans JP | 300-700 | `--font-body` | 본문, 설명, UI, 폼 |

### Heading Hierarchy

| 레벨 | 폰트 | 크기 | 스타일 |
|------|------|------|--------|
| Section Tag | — | `text-xs` | SectionTag pill 컴포넌트 |
| Hero Heading | Display | `clamp(3rem, 8vw, 8rem)` | `font-bold leading-[0.85] uppercase` |
| Section Heading | Display | `text-4xl lg:text-6xl` | `font-bold leading-[0.9] uppercase` |
| Oversize Heading | Display | `text-5xl ~ xl:text-[8rem]` | `font-bold leading-[0.85] uppercase` |
| Card Title | Body | `text-lg` | `font-bold` |
| Body | Body | `text-base` (15px) | `font-normal leading-relaxed` |
| Caption | Body | `text-sm` | `font-normal` |

---

## Border Radius

```css
--radius:    12px;   /* 카드 기본 */
--radius-sm:  8px;   /* 버튼, 입력 필드 */
--radius-lg: 16px;   /* 이미지, 배너, stats 카드 */
```

- 마퀴 pill, feature 태그: `rounded-full`
- SectionTag: `rounded-full`

---

## Components

### SectionTag (pill 라벨)

```tsx
import { SectionTag } from '@/components/ui/section-tag'

// 다크 섹션
<SectionTag variant="dark">SECTION NAME</SectionTag>

// 라이트 섹션
<SectionTag variant="light">SECTION NAME</SectionTag>
```

- 기존 "액센트 라인" 장식 → SectionTag pill로 교체
- `rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest`

### Section Container

```tsx
// 다크 섹션
<section className="bg-[var(--kn-dark)] py-24 md:py-32 lg:py-40 px-6 lg:px-24">
  <div className="max-w-7xl mx-auto">...</div>
</section>

// 라이트 섹션
<section className="bg-[var(--kn-light)] py-24 md:py-32 lg:py-40 px-6 lg:px-24">
  <div className="max-w-7xl mx-auto">...</div>
</section>
```

### Card (다크 섹션)

```tsx
<div className="bg-card rounded-[var(--radius)] border border-[var(--border)] p-8 hover:border-[#FF4500]/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#FF4500]/5 transition-all duration-300 cursor-pointer">
  ...
</div>
```

### Card (라이트 섹션)

```tsx
<div className="bg-[var(--kn-card-light)] rounded-[var(--radius)] border border-[var(--kn-dark)]/5 p-8 hover:border-[#FF4500]/40 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer">
  ...
</div>
```

### CTA Button

```tsx
// Primary — 그라데이션
<button className="gradient-warm text-white px-8 py-4 text-sm font-bold uppercase tracking-wider rounded-[var(--radius-sm)] hover:opacity-90 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#FF4500]/20 transition-all duration-300 cursor-pointer">
  무료 상담 신청
</button>

// Secondary
<button className="bg-transparent text-[var(--foreground)] px-8 py-4 text-sm font-bold uppercase tracking-wider border border-[#A8A29E]/30 rounded-[var(--radius-sm)] hover:border-[#FF4500] hover:text-[#FF4500] transition-all duration-300 cursor-pointer">
  포트폴리오 보기
</button>
```

### Stats Card (그라데이션)

```tsx
<div className="rounded-[var(--radius-lg)] overflow-hidden gradient-sunset p-8 md:p-10">
  <div className="bg-white/10 backdrop-blur-sm rounded-[var(--radius)] p-6">
    <div className="font-display font-bold text-5xl text-white">500만</div>
  </div>
</div>
```

---

## Animation

### 모션 컴포넌트

| 컴포넌트 | import | 용도 |
|---------|--------|------|
| `FadeIn` | `@/components/ui/fade-in` | 기본 스크롤 등장 (y: 30→0) |
| `Reveal` | 〃 | 좌/우 슬라이드 등장 (x: ±60→0) |
| `ScaleIn` | 〃 | 스케일 등장 (0.95→1) |
| `StaggerContainer` | 〃 | 자식 순차 등장 래퍼 |
| `StaggerItem` | 〃 | 순차 등장 아이템 |

### 페이지 트랜지션

`app/template.tsx` — Framer Motion으로 모든 페이지 전환 시 fade + slide up

### 이징 & 듀레이션

```
ease-smooth:  [0.25, 0.1, 0.25, 1.0]  (기본)
duration-fast:    0.2s   (호버)
duration-normal:  0.4s   (스크롤 등장)
duration-slow:    0.8s   (페이지 트랜지션, 히어로)
```

### 호버 인터랙션

| 요소 | 효과 |
|------|------|
| 카드 | `translateY(-4px)` + `shadow-xl` |
| CTA 버튼 | `scale(1.02)` + glow shadow |
| 포트폴리오 이미지 | `scale(1.05)` |
| 네비 링크 | 오렌지 언더라인 좌→우 슬라이드 |

### Reduced Motion

`prefers-reduced-motion: reduce` → 모든 애니메이션 duration 0

---

## Spacing

| 토큰 | 값 | 용도 |
|------|------|------|
| Section padding | `py-24 md:py-32 lg:py-40` | 섹션 상하 여백 |
| Section horizontal | `px-6 lg:px-24` | 섹션 좌우 여백 |
| Container | `max-w-7xl mx-auto` | 콘텐츠 최대 너비 |
| Heading → Content gap | `mt-16` | 헤딩 아래 콘텐츠까지 간격 |
| Card gap | `gap-4 md:gap-6` | 카드 그리드 간격 |
| Card padding | `p-8` | 카드 내부 여백 |

---

## Responsive

| 브레이크포인트 | 범위 | 그리드 | 특징 |
|-------------|------|--------|------|
| Mobile | < 768px | 1열 | 터치 타겟 44px+, 햄버거 메뉴 |
| Tablet | 768~1024px | 2열 | 여백 축소, 타이포 크기 중간 |
| Desktop | 1024px+ | 풀 그리드 | 비대칭 레이아웃 활성 |
| Wide | 1440px+ | `max-w-7xl` | 콘텐츠 제한 |

---

## Accessibility

- 색상 대비 4.5:1 이상 (WCAG AA)
- 모든 인터랙티브 요소에 visible focus ring
- 이미지 alt 텍스트 필수
- 폼 input에 label 연결
- 키보드 탐색 순서 = 시각적 순서
- 터치 타겟 최소 44x44px
- `prefers-reduced-motion` 대응

---

## Anti-Patterns (절대 금지)

- 전체 섹션 배경에 그라데이션 ❌ → 카드/버튼/텍스트 단위로만
- 이모지를 아이콘으로 사용 ❌ → Lucide SVG 사용
- font-black(900) 대형 헤딩 ❌ → font-bold(700) 사용
- 차가운 블루톤 ❌
- 순백(#FFFFFF) 배경 ❌ → 크림(#FAF7F2) 사용
- 순흑(#000000) 배경 ❌ → 웜다크(#1C1917) 사용
- border-radius: 0px ❌ → CSS 변수 기반 radius 사용

---

## Quick Reference

```
배경:  #1C1917(웜다크) / #FAF7F2(크림) 교차
포인트: #FF4500 — CTA, 숫자, 태그 + gradient-warm/sunset 확장
폰트:  Barlow Condensed (Display) + Playfair Display Italic (강조) + Noto Sans JP (바디)
굵기:  font-bold(700) — font-black(900) 금지
모서리: 12px(카드) / 8px(버튼) / 16px(이미지) / full(pill)
장식:  SectionTag pill + 마퀴 pill + 그라데이션 카드
모션:  페이지 트랜지션 + FadeIn/Reveal/Stagger + 호버 glow
철학:  따뜻하고 유기적이되, 절제된 우아함
```
