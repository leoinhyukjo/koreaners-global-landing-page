# KOREANERS Design System — MASTER

> 모든 페이지/컴포넌트 구현 시 이 문서를 기준으로 합니다.
> 페이지별 오버라이드가 있으면 `design-system/pages/<page>.md`를 우선 적용합니다.

## Style: Exaggerated Minimalism (Editorial)

레퍼런스: Squarespace Forma (https://forma-fluid-demo.squarespace.com/)

핵심 원칙:
- **진회색(#141414) + 오렌지(#FF4500) 교차** — 화이트 배경 없음
- 오버사이즈 condensed 타이포그래피 — 타이포가 곧 디자인
- 극단적 여백 (negative space)
- 오렌지는 전체 섹션의 30% 이하 — 나머지는 진회색
- 에디토리얼/매거진 그리드 (비대칭 허용)
- 장식 요소 최소화 (그라데이션, 그리드 패턴, 글로우 금지)

---

## Colors

### Color Tokens

```css
--kn-base:    #141414;    /* 기본 배경 (진회색) */
--kn-accent:  #FF4500;    /* 강조 — 유일한 컬러 */
--kn-text:    #FFFFFF;    /* 텍스트 */
--kn-muted:   #A0A0A0;    /* 보조 텍스트 */
--kn-border:  #FF450033;  /* 액센트 20% 투명 (카드 보더) */
```

### 규칙

- 이 5개 외 색상 사용 금지
- 사진을 제외한 모든 UI 요소는 이 팔레트 안에서
- 그라데이션 사용 금지 — 플랫 컬러만
- "이거 써도 되나?" 싶으면 쓰지 않는 게 맞음

### 다크 섹션 (bg-[#141414])

| 토큰 | 값 | 용도 |
|------|------|------|
| 배경 | `#141414` | 섹션 배경 |
| 카드 배경 | `#1a1a1a` | 카드, 입력 필드 |
| 텍스트 | `#FFFFFF` | 제목, 주요 텍스트 |
| 뮤트 | `#A0A0A0` / `white/50` | 부가 설명, 캡션 |
| 보더 | `white/10` | 구분선, 카드 테두리 |
| 액센트 | `#FF4500` | 숫자, CTA, 카테고리, 장식 |

### 오렌지 섹션 (bg-[#FF4500])

| 토큰 | 값 | 용도 |
|------|------|------|
| 배경 | `#FF4500` | 섹션 배경 |
| 텍스트 | `#FFFFFF` | 제목, 주요 텍스트 |
| 뮤트 | `white/70` | 부가 설명, 캡션 |
| 보더 | `white/30` | 구분선 |
| 카드 배경 | `#141414` | 카드, 태그 배지 |
| 액센트 | `#141414` 또는 `#FFFFFF` | 대비 요소 |

### 섹션 리듬

```
[#141414] 히어로 — 타이포 중심
[#FF4500] 파트너 마키 — Trusted by 105+ Brands
[#141414] 마켓 기회 — 데이터, 통계
[#141414] 장벽 — 문제 제시
[#FF4500] 솔루션 로드맵 — 해결책 하이라이트
[#141414] 실적(Results) — 오렌지 숫자
[#141414] 포트폴리오 — 케이스 그리드
[#FF4500] CTA — "LET'S TALK" + 문의 폼
[#141414] 푸터
```

- 오렌지 섹션은 전체의 30% 이하 (과하면 피로)
- 오렌지 섹션 연속 배치 금지
- 다크 섹션이 기본, 오렌지는 강조 포인트

---

## Typography

### 3-Font System

| 역할 | 폰트 | Weight | CSS Variable | 용도 |
|------|------|--------|-------------|------|
| Display EN | Barlow Condensed | 700, 900 | `--font-display` | 영문 섹션 헤딩, 대형 숫자, 로고 |
| Display KR | Black Han Sans | 400 | `--font-display-kr` | 한글 섹션 헤딩 (font-display fallback) |
| Accent | Playfair Display Italic | 400, 700 | `--font-accent` | 헤딩 내 강조 단어 (섹션당 1개) |
| Body | Noto Sans KR / Noto Sans JP | 300-700 | `--font-body` | 본문, 설명, UI, 폼 |

### Font Stack

```css
@utility font-display {
  font-family: var(--font-display), var(--font-display-kr), sans-serif;
}
```

영문 → Barlow Condensed, 한글 → Black Han Sans (자동 fallback)

### Heading Hierarchy

| 레벨 | 폰트 | 크기 | 스타일 |
|------|------|------|--------|
| Section Tag | Body | `text-xs` | `uppercase tracking-[0.2em] opacity-40` |
| Hero Heading | Display | `clamp(3rem, 8vw, 8rem)` | `font-black leading-[0.85] uppercase` |
| Section Heading | Display | `text-4xl lg:text-6xl` | `font-black leading-[0.9] uppercase` |
| Card Title | Body | `text-lg` | `font-bold` |
| Body | Body | `text-base` (16px) | `font-normal leading-relaxed` |
| Caption | Body | `text-sm` | `font-normal` |

### 타이포 문법

- 헤드라인은 **최대한 크게, 2-3줄**
- 키워드 하나를 Playfair Display Italic으로 강조
- 영문은 ALL CAPS 가능, 한글은 폰트 크기로 위계 표현
- 본문은 작게, 절제하여

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

// 오렌지 섹션
<section className="bg-[#FF4500] py-24 md:py-32 lg:py-40 px-6 lg:px-24">
  <div className="max-w-7xl mx-auto">...</div>
</section>
```

### Section Header

```tsx
// 다크 섹션 위
<div className="mb-16">
  <span className="text-xs uppercase tracking-[0.2em] text-white/40">SECTION TAG</span>
  <div className="w-12 h-0.5 bg-[#FF4500] mt-3 mb-6" />
  <h2 className="font-display font-black text-4xl lg:text-6xl uppercase leading-[0.9] text-white">
    헤딩 <span className="font-accent italic">강조</span>
  </h2>
</div>

// 오렌지 섹션 위
<div className="mb-16">
  <span className="text-xs uppercase tracking-[0.2em] text-white/70">SECTION TAG</span>
  <div className="w-12 h-0.5 bg-white/40 mt-3 mb-6" />
  <h2 className="font-display font-black text-4xl lg:text-6xl uppercase leading-[0.9] text-white">
    헤딩 텍스트
  </h2>
</div>
```

### Card (다크 섹션)

```tsx
<div className="bg-[#1a1a1a] border border-white/10 p-8 hover:border-[#FF4500]/40 transition-all duration-300 cursor-pointer">
  ...
</div>
```

### Card (오렌지 섹션)

```tsx
<div className="bg-[#141414] border border-white/20 p-8 hover:border-white/50 transition-all duration-300 cursor-pointer">
  ...
</div>
```

### CTA Button

```tsx
// Primary (다크 섹션 위)
<button className="bg-[#FF4500] text-white px-8 py-4 text-sm font-bold uppercase tracking-wider hover:bg-[#FF4500]/80 border border-[#FF4500] transition-all duration-300 cursor-pointer">
  무료 상담 신청 →
</button>

// Primary (오렌지 섹션 위)
<button className="bg-[#141414] text-white px-8 py-4 text-sm font-bold uppercase tracking-wider hover:bg-black transition-all duration-300 cursor-pointer">
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
@keyframes marquee-right {
  0% { transform: translateX(-50%); }
  100% { transform: translateX(0); }
}
```

- 2줄, 반대 방향
- `animation-duration: 45s`, `linear`, `infinite`
- `hover: animation-play-state: paused`
- 오렌지 배경 (`bg-[#FF4500]`), 흰색 텍스트
- 텍스트: `text-base font-semibold uppercase text-white/80`

---

## 장식 요소 — 딱 3개만

| 요소 | 스펙 | 용도 |
|------|------|------|
| **마퀴 텍스트** | 무한 스크롤, 오렌지 배경 | 섹션 구분자, 파트너 리스트 |
| **액센트 라인** | #FF4500 또는 white/40, 1-2px | 섹션 태그 아래 |
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
| Marquee | 무한 스크롤 | CSS @keyframes, 45s linear infinite |
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

- 화이트(#FFFFFF) 배경 섹션 ❌ → #141414 또는 #FF4500만
- 이모지를 아이콘으로 사용 ❌ → Lucide SVG 사용
- 그라데이션 배경 ❌ → 순수 단색
- border-radius ❌ → sharp edges (0px)
- 그리드 패턴, 글로우, radial gradient 배경 ❌
- 3개 이상 색상 ❌ → #141414 + #FF4500 + #FFFFFF만
- 모든 요소 중앙 정렬 ❌ → 비대칭 그리드 활용
- 호버 시 scale로 layout shift ❌ → transform + opacity만
- 차가운 블루톤 ❌
- 둥근 모서리 (pills, rounded cards) ❌

---

## Quick Reference

```
컬러:  #141414 / #FF4500 / #FFFFFF (이 3개만)
폰트:  Barlow Condensed (EN 헤드) + Black Han Sans (KR 헤드) + Playfair Display Italic (강조) + Noto Sans (바디)
모서리: 0px (전부 sharp)
장식:  마퀴 + 액센트 라인 + 도트 (이 3개만)
철학:  적을수록 강하다
```
