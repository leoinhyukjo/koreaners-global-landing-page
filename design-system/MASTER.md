# KOREANERS Design System — MASTER

> 모든 페이지/컴포넌트 구현 시 이 문서를 기준으로 합니다.
> 페이지별 오버라이드가 있으면 `design-system/pages/<page>.md`를 우선 적용합니다.

## Style: Exaggerated Minimalism (Editorial)

레퍼런스: Squarespace Forma (https://forma-fluid-demo.squarespace.com/)

핵심 원칙:
- **검/흰 교차 배경** — #141414(다크)와 #FFFFFF(화이트) 섹션 교차
- **오렌지(#FF4500)는 포인트 컬러만** — 배경 사용 금지, CTA/숫자/장식에만
- 오버사이즈 condensed 타이포그래피 — 타이포가 곧 디자인
- 극단적 여백 (negative space)
- 에디토리얼/매거진 그리드 (비대칭 허용)
- 장식 요소 최소화 (그리드 패턴, 글로우 금지)
- 예외: hero-glow (상단 radial-gradient `rgba(255,69,0,0.18)`, 고정 500px) — 히어로 섹션 분위기용으로 허용

---

## Colors

### Color Tokens

```css
--kn-dark:    #141414;    /* 다크 섹션 배경 */
--kn-light:   #FFFFFF;    /* 라이트 섹션 배경 */
--kn-accent:  #FF4500;    /* 포인트 — CTA, 숫자, 장식 */
--kn-card:    #F5F5F5;    /* 라이트 섹션 카드 배경 */
```

### 규칙

- 배경은 #141414 또는 #FFFFFF만 사용
- #FF4500은 배경으로 절대 사용 금지 — 포인트 요소에만
- 그라데이션 사용 금지 — 플랫 컬러만 (예외: hero-glow)
- "이거 써도 되나?" 싶으면 쓰지 않는 게 맞음

### 다크 섹션 (bg-[#141414])

| 토큰 | 값 | 용도 |
|------|------|------|
| 배경 | `#141414` | 섹션 배경 |
| 카드 배경 | `#111` | 카드, 입력 필드 |
| 텍스트 | `#FFFFFF` | 제목, 주요 텍스트 |
| 뮤트 | `white/40` ~ `white/60` | 부가 설명, 캡션, 라벨 |
| 보더 | `white/10` | 구분선, 카드 테두리 |
| 액센트 | `#FF4500` | 숫자, CTA 버튼, 카테고리 태그, 장식 라인 |

### 라이트 섹션 (bg-white)

| 토큰 | 값 | 용도 |
|------|------|------|
| 배경 | `#FFFFFF` | 섹션 배경 |
| 카드 배경 | `#F5F5F5` | 카드, stat 블록 |
| 텍스트 | `#141414` | 제목, 주요 텍스트 |
| 뮤트 | `black/50` ~ `black/60` | 부가 설명, 캡션 |
| 보더 | `black/5` ~ `black/10` | 구분선, 카드 테두리, 태그 |
| 액센트 | `#FF4500` | 숫자, CTA 버튼, 카테고리 태그, step 번호 |

### 섹션 리듬

```
[#141414] 히어로 — 타이포 중심
[#141414] 마키 — orange 텍스트 단일행 마퀴
[#FFFFFF] 마켓 기회 — 데이터, 통계 (오렌지 숫자)
[#141414] 장벽 — 문제 제시
[#FFFFFF] 솔루션 로드맵 — 오버사이즈 타이포, step 번호
[#141414] 실적(Results) — 오렌지 숫자
[#FFFFFF] 포트폴리오 — 케이스 그리드
[#141414] CTA — "CONTACT US" + 문의 폼
[#141414] 푸터
```

- 다크/라이트 교차가 기본 리듬
- 다크 섹션 연속은 허용 (히어로→마키, CTA→푸터)
- 라이트 섹션 연속은 가급적 회피

---

## Typography

### 3+1 Font System

| 역할 | 폰트 | Weight | CSS Variable | 용도 |
|------|------|--------|-------------|------|
| Display EN | Barlow Condensed | 700 | `--font-display` | 영문 섹션 헤딩, 대형 숫자, 로고 |
| Display KR | (Barlow Condensed → Noto Sans JP fallback) | — | `--font-display` | 한글 헤딩은 Barlow가 렌더 못하면 Noto Sans JP로 자동 fallback |
| Accent | Playfair Display Italic | 400, 700 | `--font-accent` | 헤딩 내 강조 단어 (섹션당 1개) |
| Body | Noto Sans KR / Noto Sans JP | 300-700 | `--font-body` | 본문, 설명, UI, 폼 |

### Font Stack

```css
@utility font-display {
  font-family: var(--font-display), var(--font-body), sans-serif;
}
```

영문 → Barlow Condensed, 한글 → Noto Sans JP (자동 fallback)

### Heading Hierarchy

| 레벨 | 폰트 | 크기 | 스타일 |
|------|------|------|--------|
| Section Tag | Body | `text-xs` | `uppercase tracking-[0.2em] opacity-40` |
| Hero Heading | Display | `clamp(3rem, 8vw, 8rem)` | `font-bold leading-[0.85] uppercase` |
| Section Heading | Display | `text-4xl lg:text-6xl` | `font-bold leading-[0.9] uppercase` |
| Oversize Heading | Display | `text-5xl ~ xl:text-[8rem]` | `font-bold leading-[0.85] uppercase` |
| Card Title | Body | `text-lg` | `font-bold` |
| Body | Body | `text-base` (16px) | `font-normal leading-relaxed` |
| Caption | Body | `text-sm` | `font-normal` |

### 타이포 문법

- 헤드라인은 **최대한 크게, 2-3줄**
- 키워드 하나를 Playfair Display Italic으로 강조
- 영문은 ALL CAPS 가능, 한글은 폰트 크기로 위계 표현
- 본문은 작게, 절제하여
- **font-bold(700) 사용** — font-black(900)은 대형 헤딩에서 가독성 저하

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

## Components

### Section Container

```tsx
// 다크 섹션
<section className="bg-[#141414] py-24 md:py-32 lg:py-40 px-6 lg:px-24">
  <div className="max-w-7xl mx-auto">...</div>
</section>

// 라이트 섹션
<section className="bg-white py-24 md:py-32 lg:py-40 px-6 lg:px-24">
  <div className="max-w-7xl mx-auto">...</div>
</section>
```

### Section Header

```tsx
// 다크 섹션 위
<div className="mb-16">
  <span className="text-xs uppercase tracking-[0.2em] text-white/40">SECTION TAG</span>
  <div className="w-12 h-0.5 bg-[#FF4500] mt-3 mb-6" />
  <h2 className="font-display font-bold text-4xl lg:text-6xl uppercase leading-[0.9] text-white">
    헤딩 <span className="font-accent italic">강조</span>
  </h2>
</div>

// 라이트 섹션 위
<div className="mb-16">
  <span className="text-xs uppercase tracking-[0.2em] text-black/40">SECTION TAG</span>
  <div className="w-12 h-0.5 bg-[#FF4500] mt-3 mb-6" />
  <h2 className="font-display font-bold text-4xl lg:text-6xl uppercase leading-[0.9] text-[#141414]">
    헤딩 텍스트
  </h2>
</div>
```

### Card (다크 섹션)

```tsx
<div className="bg-[#111] border border-white/10 p-8 hover:border-[#FF4500]/60 transition-all duration-300 cursor-pointer">
  ...
</div>
```

### Card (라이트 섹션)

```tsx
<div className="bg-[#F5F5F5] border border-black/5 p-8 hover:border-[#FF4500]/40 transition-all duration-300 cursor-pointer">
  ...
</div>
```

### CTA Button

```tsx
// Primary (다크 섹션 위)
<button className="bg-[#FF4500] text-white px-8 py-4 text-sm font-bold uppercase tracking-wider hover:bg-[#E03E00] border border-[#FF4500] transition-all duration-300 cursor-pointer">
  무료 상담 신청 →
</button>

// Primary (라이트 섹션 위)
<button className="bg-[#FF4500] text-white px-8 py-4 text-sm font-bold uppercase tracking-wider hover:bg-[#E03E00] border border-[#FF4500] transition-all duration-300 cursor-pointer">
  문의하기
</button>

// Secondary
<button className="bg-transparent text-white px-8 py-4 text-sm font-bold uppercase tracking-wider border border-white/30 hover:bg-white/10 transition-all duration-300 cursor-pointer">
  포트폴리오 보기
</button>
```

### Marquee

```css
@keyframes marquee-left {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
```

- 단일행, 40s linear infinite
- `hover: animation-play-state: paused`
- 다크 배경 (`bg-[#141414]`), 오렌지 텍스트 (`text-[#FF4500]`)
- 하단 2px 오렌지 액센트 라인
- 텍스트: `text-sm font-bold uppercase tracking-[0.15em]`

---

## 장식 요소 — 딱 3개만

| 요소 | 스펙 | 용도 |
|------|------|------|
| **마퀴 텍스트** | 무한 스크롤, 다크 배경 + 오렌지 텍스트 | 섹션 구분자, 파트너 리스트 |
| **액센트 라인** | #FF4500, 1-2px | 섹션 태그 아래, 마키 하단 |
| **액센트 도트** | #FF4500, 1px 원형 | 리스트 불릿 |

**이 세 가지 외 장식 요소 사용 금지.**

---

## Animation

| 요소 | 애니메이션 | 속성 |
|------|----------|------|
| 스크롤 인뷰 | fade-in + slide-up | `opacity: 0→1, translateY: 20px→0, duration: 0.6s, ease-out` |
| Stagger | 같은 섹션 내 카드 | `delay: index * 0.1s` |
| 호버 | 카드, 버튼 | `transition-all duration-300` |
| Counter | 숫자 카운트업 | `0→target, duration: 2s, easeOut, IntersectionObserver 트리거` |
| Marquee | 무한 스크롤 | CSS @keyframes, 40s linear infinite |
| Reduced motion | `prefers-reduced-motion: reduce` | 모든 애니메이션 비활성화 |

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
- 터치 타겟 최소 44×44px
- `prefers-reduced-motion` 대응

---

## Anti-Patterns (절대 금지)

- 오렌지(#FF4500) 배경 섹션 ❌ → 포인트 요소에만 사용
- 이모지를 아이콘으로 사용 ❌ → Lucide SVG 사용
- 그라데이션 배경 ❌ → 순수 단색 (예외: hero-glow 상단 radial-gradient)
- border-radius ❌ → sharp edges (0px)
- 그리드 패턴, 글로우 ❌ (예외: hero-glow는 허용)
- font-black(900) 대형 헤딩 ❌ → font-bold(700) 사용
- 모든 요소 중앙 정렬 ❌ → 비대칭 그리드 활용
- 호버 시 scale로 layout shift ❌ → transform + opacity만
- 차가운 블루톤 ❌
- 둥근 모서리 (pills, rounded cards) ❌

---

## Quick Reference

```
배경:  #141414(다크) / #FFFFFF(라이트) 교차 — 오렌지 배경 금지
포인트: #FF4500 — CTA 버튼, 숫자, 태그, 장식 라인에만
폰트:  Barlow Condensed (Display) + Playfair Display Italic (강조) + Noto Sans JP (바디/한글 fallback)
굵기:  font-bold(700) — font-black(900) 금지
모서리: 0px (전부 sharp)
장식:  마퀴 + 액센트 라인 + 도트 (이 3개만)
철학:  적을수록 강하다
```
