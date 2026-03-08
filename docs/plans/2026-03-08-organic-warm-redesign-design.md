# Organic Warm Redesign — Design Document

**Date**: 2026-03-08
**Status**: Approved
**Scope**: 디자인 시스템 v2 ("Organic Warm") + 모션 시스템 + 인터랙션 강화

## 동기

Claura(Framer) 사이트에서 영감. 현재 "Exaggerated Minimalism"의 날카로운 톤을 따뜻하고 유기적인 방향으로 진화시키면서 5가지 개선안을 통합 적용.

## 1. 컬러 시스템 리뉴얼

### 토큰 변경

| 토큰 | Before | After | 용도 |
|------|--------|-------|------|
| `--kn-dark` | `#141414` | `#1C1917` (stone-950) | 다크 섹션 배경 |
| `--kn-light` | `#FFFFFF` | `#FAF7F2` (warm cream) | 라이트 섹션 배경 |
| `--kn-card` | `#F5F5F5` | `#F3EDE4` (warm sand) | 라이트 카드 배경 |
| `--kn-accent` | `#FF4500` | `#FF4500` (유지) | CTA, 포인트 |
| `--kn-accent-warm` | — | `#F59E0B` (amber-500) | 그라데이션 보조 |
| `--kn-teal` | — | `#0D9488` (teal-600) | 그라데이션 보조 |
| 다크 카드 | `#111` | `#292524` (stone-800) | 다크 카드 |
| 다크 뮤트 | `white/40~60` | `#A8A29E` (stone-400) | 서브 텍스트 |
| 라이트 뮤트 | `black/50~60` | `#78716C` (stone-500) | 서브 텍스트 |

### 그라데이션 팔레트 (신규)

```
gradient-warm:   #FF4500 → #F59E0B  (오렌지→앰버, CTA/stats)
gradient-sunset: #FF4500 → #0D9488  (오렌지→틸, 히어로/배너)
gradient-soft:   #F3EDE4 → #FAF7F2  (카드 배경)
gradient-dark:   #292524 → #1C1917  (다크 카드 깊이감)
```

### 원칙 변경

- ~~그라데이션 금지~~ → accent 영역에 의도적 사용
- ~~border-radius: 0px~~ → `12px`(카드), `8px`(버튼), `16px`(이미지/배너)
- 오렌지 단색 → 오렌지+앰버/틸 그라데이션 확장

## 2. 모션 시스템

### 2-1. 페이지 트랜지션

`app/template.tsx`에 Framer Motion `AnimatePresence` 적용:
- 진입: `opacity: 0→1, y: 20→0` (0.4s, easeOut)
- 퇴장: `opacity: 1→0, y: 0→-10` (0.3s, easeIn)
- 네비/푸터 제외, 콘텐츠 영역만

### 2-2. 스크롤 애니메이션 분화

| 패턴 | 적용 대상 | 동작 |
|------|----------|------|
| fade-up | 일반 텍스트, CTA | y: 30→0, opacity |
| stagger-children | 카드 그리드 | 자식 0.1s 간격 순차 등장 |
| reveal-left/right | 2컬럼 레이아웃 | x: ±60→0 슬라이드 |
| scale-in | 이미지, 배너 | scale: 0.95→1, opacity |
| counter-roll | 숫자 stats | 카운터 + y 슬라이드 |

### 2-3. 호버 & 마이크로 인터랙션

| 요소 | 변경 |
|------|------|
| 카드 | `translateY(-4px)` + `shadow-xl` + `0.3s ease` |
| CTA 버튼 | `scale(1.02)` + 그라데이션 시프트 + 소프트 glow |
| 포트폴리오 이미지 | `scale(1.05)` + 오버레이 페이드 + 캡션 슬라이드업 |
| 네비 링크 | 언더라인 좌→우 슬라이드 (오렌지) |

### 2-4. 이징 & 듀레이션

```css
--ease-smooth:  cubic-bezier(0.25, 0.1, 0.25, 1.0)
--ease-bounce:  cubic-bezier(0.34, 1.56, 0.64, 1.0)
--duration-fast:    0.2s
--duration-normal:  0.4s
--duration-slow:    0.8s
```

`prefers-reduced-motion: reduce` → 모든 duration 0

## 3. 섹션 태그 (Section Labels)

각 섹션 상단에 필(pill) 라벨 추가:

- 라이트 섹션: `#FF4500` 텍스트 + `#FF4500/10` 배경
- 다크 섹션: `#FF4500` 텍스트 + `white/10` 배경
- 스타일: `rounded-full px-4 py-1.5 text-xs tracking-widest uppercase`
- 기존 "액센트 라인" 장식 → 필 라벨로 교체

## 4. Stats 그라데이션 카드

MarketOpportunity 숫자 영역:
- `gradient-sunset` 배경 (오렌지→틸, 부드러운 블러)
- `border-radius: 16px`
- 숫자: Barlow Condensed 대형
- `backdrop-blur`로 깊이감

## 5. 적용 범위

- `globals.css` — 컬러 토큰, border-radius, 그라데이션, 이징 변수
- `design-system/MASTER.md` — 디자인 시스템 문서 v2 업데이트
- `app/template.tsx` — 페이지 트랜지션 래퍼 (신규)
- `components/ui/fade-in.tsx` — 애니메이션 패턴 확장
- `components/ui/section-tag.tsx` — 섹션 태그 컴포넌트 (신규)
- `components/hero-section.tsx` — hero-glow 업데이트
- `components/market-opportunity.tsx` — stats 그라데이션 카드
- `components/barriers.tsx` — stagger 애니메이션
- `components/solution-roadmap.tsx` — reveal 애니메이션
- `components/navigation.tsx` — 링크 호버 애니메이션
- 전체 컴포넌트 — border-radius, 컬러, 호버 업데이트
