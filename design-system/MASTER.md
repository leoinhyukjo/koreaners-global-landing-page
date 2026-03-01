# KOREANERS Design System — MASTER

> 모든 페이지/컴포넌트 구현 시 이 문서를 기준으로 합니다.
> 페이지별 오버라이드가 있으면 `design-system/pages/<page>.md`를 우선 적용합니다.

## Style: Exaggerated Minimalism (Editorial)

레퍼런스: Squarespace Forma (https://forma-fluid-demo.squarespace.com/)

핵심 원칙:
- 흑백 교차 섹션 (다크 ↔ 라이트)
- 오버사이즈 condensed 타이포그래피
- 극단적 여백 (negative space)
- 단일 악센트만 (흑백 외 색상 최소화)
- 에디토리얼/매거진 그리드 (비대칭 허용)
- 장식 요소 최소화 (그라데이션, 그리드 패턴, 글로우 금지)

---

## Typography

### 3-Font System

| 역할 | 폰트 | Weight | CSS Variable | 용도 |
|------|------|--------|-------------|------|
| Display | Barlow Condensed | 700, 900 | `--font-display` | 섹션 헤딩, 대형 숫자, 스텝 번호, 로고 |
| Accent | Playfair Display Italic | 400, 700 | `--font-accent` | 헤딩 내 강조 단어 (섹션당 1개) |
| Body | Noto Sans KR / Noto Sans JP | 300, 400, 500, 700 | `--font-body` | 본문, 설명, UI 요소, 폼 |

### Google Fonts Import

```css
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Playfair+Display:ital,wght@1,400;1,700&family=Noto+Sans+KR:wght@300;400;500;700&family=Noto+Sans+JP:wght@300;400;500;700&display=swap');
```

### Heading Hierarchy

| 레벨 | 폰트 | 크기 | 스타일 |
|------|------|------|--------|
| Section Tag | Body | `text-xs` | `uppercase tracking-[0.2em] opacity-40` |
| Hero Heading | Display | `clamp(3rem, 8vw, 8rem)` | `font-black leading-[0.85] uppercase` |
| Section Heading | Display | `text-4xl lg:text-6xl` | `font-black leading-[0.9] uppercase` |
| Card Title | Body | `text-lg` | `font-bold` |
| Body | Body | `text-base` (16px) | `font-normal leading-relaxed` |
| Caption | Body | `text-sm` | `font-normal` |

### Italic Accent Rule

각 섹션 헤딩에서 **핵심 1단어**만 Playfair Display Italic으로 강조.

```tsx
// 예시
<h2 className="font-display font-black text-6xl uppercase">
  <span className="font-accent italic">BEYOND</span>{' '}AGENCY
</h2>
```

---

## Colors

### 다크 섹션 (bg-black)

| 토큰 | 값 | 용도 |
|------|------|------|
| `--bg-dark` | `#000000` | 섹션 배경 |
| `--surface-dark` | `#111111` | 카드, 입력 필드 배경 |
| `--text-dark` | `#FAFAFA` | 제목, 주요 텍스트 |
| `--muted-dark` | `#888888` | 부가 설명, 캡션 |
| `--border-dark` | `rgba(255,255,255,0.12)` | 구분선, 카드 테두리 |

### 라이트 섹션 (bg-white)

| 토큰 | 값 | 용도 |
|------|------|------|
| `--bg-light` | `#FFFFFF` | 섹션 배경 |
| `--surface-light` | `#F5F5F5` | 카드 배경 |
| `--text-light` | `#09090B` | 제목, 주요 텍스트 |
| `--muted-light` | `#666666` | 부가 설명, 캡션 |
| `--border-light` | `rgba(0,0,0,0.12)` | 구분선, 카드 테두리 |

### CTA Colors

| 상태 | 다크 섹션 위 | 라이트 섹션 위 |
|------|-----------|-------------|
| Default | `bg-white text-black` | `bg-black text-white` |
| Hover | `bg-transparent border-white text-white` | `bg-transparent border-black text-black` |

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
<section className="bg-black py-24 md:py-32 lg:py-40 px-6 lg:px-24">
  <div className="max-w-7xl mx-auto">...</div>
</section>

// 라이트 섹션
<section className="bg-white py-24 md:py-32 lg:py-40 px-6 lg:px-24">
  <div className="max-w-7xl mx-auto">...</div>
</section>
```

### Section Header

```tsx
<div className="mb-16">
  <span className="text-xs uppercase tracking-[0.2em] text-white/40">
    SECTION TAG
  </span>
  <h2 className="font-display font-black text-4xl lg:text-6xl uppercase mt-4 leading-[0.9]">
    헤딩 텍스트 <span className="font-accent italic">강조</span>
  </h2>
</div>
```

### Card (다크 섹션)

```tsx
<div className="bg-[#111] border border-white/10 p-8 hover:border-white/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
  ...
</div>
```

### Card (라이트 섹션)

```tsx
<div className="bg-[#F5F5F5] border border-black/10 p-8 hover:border-black/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
  ...
</div>
```

### CTA Button

```tsx
// Primary (다크 섹션 위)
<button className="bg-white text-black px-8 py-4 text-sm font-bold uppercase tracking-wider hover:bg-transparent hover:text-white border border-white transition-all duration-300 cursor-pointer">
  무료 상담 신청 →
</button>

// Secondary (다크 섹션 위)
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
- 텍스트: `text-sm font-semibold uppercase opacity-50`

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

- 이모지를 아이콘으로 사용 ❌ → Lucide SVG 사용
- 그라데이션 배경 ❌ → 순수 단색 (#000 또는 #FFF)
- border-radius ❌ → sharp edges (0px)
- 그리드 패턴, 글로우, radial gradient 배경 ❌
- 3개 이상 색상 ❌ → 흑백 + 단일 악센트만
- 모든 요소 중앙 정렬 ❌ → 비대칭 그리드 활용
- 호버 시 scale로 layout shift ❌ → transform + opacity만
