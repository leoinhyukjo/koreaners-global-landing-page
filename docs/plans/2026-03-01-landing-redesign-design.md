# Landing Page Redesign — Exaggerated Minimalism

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 메인 랜딩페이지를 Forma-inspired Exaggerated Minimalism 스타일로 리디자인. 기존 컴포넌트를 리팩토링하여 흑백 교차 섹션, 오버사이즈 타이포, 비대칭 레이아웃을 적용.

**Architecture:** 기존 8개 컴포넌트 in-place 리팩토링 + 디자인 시스템 MD + CSS 변수/폰트 교체

**Tech Stack:** Next.js 16, Tailwind CSS 4, Framer Motion 12, Lucide React, Google Fonts (Barlow Condensed, Playfair Display, Noto Sans KR/JP)

**Design System:** `design-system/MASTER.md` 참조

---

## 변경 요약

### Phase 0: 디자인 시스템 기반
- [x] `design-system/MASTER.md` 생성
- [ ] `globals.css` CSS 변수 교체 (oklch → hex, 다크/라이트 토큰)
- [ ] `layout.tsx` 폰트 교체 (Geist → Barlow Condensed + Playfair Display + Noto Sans)
- [ ] Tailwind 유틸리티 클래스 추가 (`font-display`, `font-accent`)

### Phase 1: Navigation + Hero
- [ ] `navigation.tsx` — 투명→blur 헤더, 로고 Barlow Condensed, 슬로건 제거, 호버 밑줄
- [ ] `hero-section.tsx` — #000 배경, 그리드패턴/그라데이션 제거, 초대형 BEYOND+AGENCY, Playfair Italic accent

### Phase 2: 파트너 마키 + 시장 기회
- [ ] `trust-signals.tsx` → 마키만 남기고 간소화, 2줄 반대방향, border-y 구분
- [ ] `main-content.tsx` — TrustSignals 위치를 Hero 바로 아래로 이동
- [ ] `market-opportunity.tsx` — 라이트 배경(#FFF), 비대칭 2열 (좌측 텍스트 + 우측 통계 카드)

### Phase 3: 장벽 + 솔루션
- [ ] `barriers.tsx` — #000 배경, 아이콘 상단 배치, 카드 bg-[#111]
- [ ] `solution-roadmap.tsx` — 라이트 배경(#FFF), 세로 타임라인, 검은색 텍스트

### Phase 4: 실적 + 포트폴리오
- [ ] `final-cta.tsx` — 실적 섹션으로 리팩토링, #000, 4열+세로 구분선, 초대형 숫자
- [ ] `performance.tsx` — 포트폴리오로 리팩토링, 라이트 배경(#FFF), 캐러셀→3열 정적 카드

### Phase 5: 문의 폼 + Footer
- [ ] `footer-cta.tsx` — #111 배경, 비대칭 2열 (좌측 LET'S TALK + 우측 폼), 밑줄 input
- [ ] `layout/footer.tsx` — #000, border-t, 미니멀

---

## 섹션 순서 (main-content.tsx)

```
Before:                          After:
1. HeroSection                   1. HeroSection
2. MarketOpportunity             2. TrustSignals (마키)     ← 이동
3. Barriers                      3. MarketOpportunity       ← 라이트
4. SolutionRoadmap               4. Barriers                ← 다크
5. Performance (캐러셀)           5. SolutionRoadmap         ← 라이트
6. FinalCTA (숫자)               6. FinalCTA (실적)         ← 다크
7. TrustSignals (마키)           7. Performance (포트폴리오)  ← 라이트
8. FooterCTA (문의폼)            8. FooterCTA (문의폼)       ← 다크
```

---

## 컴포넌트별 상세

### Navigation (`navigation.tsx`)

**Before → After:**
- 배경: `zinc-900/85` → 투명 (스크롤 > 20px → `bg-black/90 backdrop-blur-md`)
- 로고: Geist → Barlow Condensed 700, `text-lg uppercase tracking-tight`
- 슬로건(`tagline`): 제거
- 메뉴 호버: 텍스트 색상 변경 → 밑줄 width 0→100% 애니메이션
- 모바일 Sheet: 기존 유지하되 배경 #000

### Hero (`hero-section.tsx`)

**Before → After:**
- 배경: zinc-900 그라데이션 + 그리드패턴 → 순수 `bg-black`
- 메인 카피: `heroBrandName` 번역 텍스트 → 하드코딩 `BEYOND` + `AGENCY` 2줄
  - BEYOND: Playfair Display Italic, `text-7xl md:text-8xl lg:text-[10rem]`
  - AGENCY: Barlow Condensed 900, 동일 크기
  - `leading-[0.85]`
- 태그라인: `text-sm uppercase tracking-[0.3em] text-white/60`
- 서브카피: `text-lg md:text-xl text-white/70 max-w-xl mx-auto mt-8`
- CTA: 기존 Button 컴포넌트 → 커스텀 스타일 (MASTER.md 참조)
- 배경 장식(그리드, radial): 모두 제거

### Trust Signals → 파트너 마키 (`trust-signals.tsx`)

**Before → After:**
- 위치: 7번째 → 2번째 (Hero 바로 아래)
- 내용: 3줄 마키 → 2줄 마키 (반대방향)
- "TRUSTED BY" 헤딩, 부제, 수출바우처 텍스트: 제거
- `border-y border-white/10 py-4`
- 기존 75개 파트너를 2등분 (1줄 ~37개, 2줄 ~38개)

### Market Opportunity (`market-opportunity.tsx`)

**Before → After:**
- 배경: zinc-900 계열 → `bg-white` (라이트 섹션)
- 레이아웃: 중앙 헤딩 + 3열 카드 → 비대칭 2열 (`grid-cols-1 lg:grid-cols-2 gap-16`)
  - 좌: 태그 + 헤딩 + 본문
  - 우: 통계 카드 3개 세로 (`flex flex-col gap-4`)
- 헤딩: "일본"에 Playfair Italic
- 카드: zinc-800 → `bg-[#F5F5F5] border border-black/10 p-8`
- 텍스트 색상: white → `text-[#09090B]` / `text-black/70`

### Barriers (`barriers.tsx`)

**Before → After:**
- 배경: zinc-900 계열 → `bg-black`
- 카드 레이아웃: 아이콘 좌+텍스트 우 (수평) → 아이콘 상단+텍스트 하단 (세로)
- 카드: zinc-800 → `bg-[#111] border border-white/10 p-8`
- 아이콘 박스(w-14 h-14 bg-white/10): 제거 → 아이콘만 (`w-10 h-10 text-white/60 mb-4`)
- 호버: 기존 아이콘 반전 효과 제거 → border + translate만

### Solution Roadmap (`solution-roadmap.tsx`)

**Before → After:**
- 배경: zinc-900 계열 → `bg-white` (라이트 섹션)
- 레이아웃: 2열 카드 그리드 → 세로 타임라인
  - 좌측: 세로 라인(1px, `border-l border-black/20`) + 원형 노드(스텝 번호)
  - 우측: 태그 라벨 + 제목 + 설명 + 하위 기능
- 카드 배경: zinc-800 → 없음 (라인 기반)
- 대형 배경 숫자(text-7xl): 제거 → 노드 안에 작은 숫자
- 텍스트 색상: white → `text-[#09090B]` / `text-black/60`
- 태그 라벨: `bg-black text-white text-xs uppercase px-3 py-1`

### Final CTA → 실적 섹션 (`final-cta.tsx`)

**Before → After:**
- 배경: zinc-800~900 그라데이션 → `bg-black`
- 헤딩 추가: 태그 `RESULTS` + 메인 헤딩
- 숫자 크기: text-4xl → `text-6xl lg:text-8xl` (Barlow Condensed 900)
- 4열 사이에 세로 구분선 `border-r border-white/10` (마지막 제외)
- Counter 애니메이션 유지 (IntersectionObserver)

### Performance → 포트폴리오 (`performance.tsx`)

**Before → After:**
- 배경: zinc-900 계열 → `bg-white` (라이트 섹션)
- 레이아웃: Embla 캐러셀 → `grid grid-cols-1 md:grid-cols-3 gap-6` (정적 카드)
- 최대 3개만 표시 (Supabase에서 limit 3)
- 카드: zinc-800 → 흰색 + `border border-black/10`
- 카테고리 배지, 호버 효과 유지
- 텍스트: white → `text-[#09090B]`
- 하단 CTA: 텍스트 링크 `전체 포트폴리오 보기 →`

### Footer CTA → 문의 폼 (`footer-cta.tsx`)

**Before → After:**
- 배경: zinc-900 → `bg-[#111]`
- 레이아웃: 중앙 세로 → 비대칭 2열 (`grid-cols-1 lg:grid-cols-[2fr_3fr] gap-16`)
  - 좌측: "LET'S *TALK*" 대형 헤딩 + 설명 + 이메일
  - 우측: 폼 (기존 필드 + 로직 유지)
- 입력 필드: `bg-zinc-800 border-zinc-700` → `bg-transparent border-b border-white/20 focus:border-white`
- label: `text-xs uppercase tracking-wider text-white/40`
- 폼 그리드: 이름/회사/직책 3열, 이메일/전화 2열, 메시지 전체너비
- Submit 버튼: `bg-white text-black w-full py-4 text-sm font-bold uppercase`
- Supabase 저장, Notion 동기화, Meta Pixel Lead 이벤트: 기존 로직 100% 유지

### Footer (`layout/footer.tsx`)

**Before → After:**
- 배경: zinc-900 → `bg-black`
- `border-t border-white/10`
- 로고: Barlow Condensed
- 나머지 구조/내용 유지, 스타일만 조정

---

## 의존성 변경

| 패키지 | 변경 |
|--------|------|
| `next/font/google` | Barlow_Condensed, Playfair_Display 추가, Geist/Geist_Mono 제거 |
| `embla-carousel-react` | Performance 섹션에서 더 이상 사용하지 않으면 제거 검토 |

## 유지 사항 (건드리지 않음)

- LocaleProvider, getTranslation 시스템
- Supabase 연동 (문의 폼 저장, 포트폴리오 데이터)
- Notion API 비동기 저장
- Meta Pixel (fbq), GA4, Clarity
- Vercel Analytics
- SEO 메타데이터 (layout.tsx의 metadata)
- 다른 페이지들 (/blog, /portfolio, /service, /contact, /creator, /careers)
