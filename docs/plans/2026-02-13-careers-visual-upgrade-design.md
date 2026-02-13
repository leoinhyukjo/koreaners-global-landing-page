# Careers Page Visual Upgrade Design

**Date**: 2026-02-13
**Approach**: Gradient Accent System — 기존 다크/미니멀 톤 유지 + 비주얼 디테일 강화
**Scope**: Careers 페이지 우선 적용, 이후 전 페이지 확장 예정

---

## Design Principles

- 기존 디자인 DNA 보존: zinc-900 bg, zinc-800 cards, rounded-none, font-black headings
- 모노크롬 팔레트 유지 (새로운 악센트 컬러 도입 없음)
- 그래디언트, 보더, 타이포 위계, 애니메이션으로 깊이감 추가
- 다른 페이지 일괄 적용 시 변경 최소화

---

## Section-by-Section Changes

### 1. Navigation (공통 컴포넌트 — navigation.tsx)

**Issue**: 현재 페이지 active state 없음
**Fix**:
- `usePathname()`으로 현재 경로 감지
- 일치하는 링크: `text-white` + 하단 bar `w-full h-0.5 bg-white` 고정
- 모바일 Sheet: active 링크 좌측 `border-l-2 border-white`

### 2. Hero Section

**Issue**: 텍스트만, 시각적 임팩트 없음
**Changes**:
- 배경: radial-gradient glow (중앙 상단, white/[0.03])
- "JOIN KOREANERS" 아래 수평 디바이더: `w-24 h-px bg-gradient-to-r from-transparent via-zinc-500 to-transparent`
- 타이포 위계 수정: subtitle(컨설팅 기반~) → text-xl/2xl, description(함께 성장~) → text-base/lg zinc-400
- 하단 scroll indicator: ChevronDown + motion-safe:animate-bounce

### 3. 기업 정체성

**Issue**: 5줄 밀집 문단, 가독성 낮음
**Changes**:
- 섹션 라벨 추가: `ABOUT US` (text-xs tracking-widest text-zinc-500 uppercase)
- 핵심 문장 `font-semibold text-white`, 보조 설명 `text-zinc-400`으로 시각적 분리
- `max-w-prose` 적용으로 줄 길이 제한

### 4. 3대 핵심 사업 영역

**Issue**: 3개 카드 동일 패턴, 시각 위계 없음
**Changes**:
- 섹션 라벨: `BUSINESS`
- 카드 좌측 accent border: `border-l-2 border-zinc-600 hover:border-white`
- 넘버링: `01` `02` `03` (text-xs text-zinc-600 font-mono mb-4)
- hover 트랜지션: duration-500 → duration-300

### 5. Stats

**Issue**: 라벨 가독성 낮음
**Changes**:
- stat 간 세로 구분선: `border-r border-zinc-700/50` (마지막 제외)
- 라벨: text-sm → text-base, zinc-400 → zinc-300
- 숫자 카운팅 애니메이션: Framer Motion useInView + animate (motion-safe)

### 6. 핵심 경쟁력

**Issue**: CheckCircle2 반복 → 체크리스트 느낌
**Changes**:
- 섹션 라벨: `STRENGTHS`
- 항목별 고유 아이콘: Globe, Building2, Award, BarChart3
- 아이콘을 bg-white/10 p-2 w-10 h-10 박스로 감싸기
- 아이콘-텍스트 수직 중앙 정렬

### 7. 인재상

**Issue**: 5개 카드 3+2 비대칭
**Changes**:
- 섹션 라벨: `CULTURE`
- 하단 2개 카드를 중앙 정렬 (별도 flex container + justify-center)
- hover 트랜지션: duration-500 → duration-300

### 8. 채용 공고

**Issue**: 밋밋한 카드
**Changes**:
- 섹션 라벨: `OPENINGS`
- 카드 좌측 accent border: `border-l-2 border-white`
- 섹션 하단 fallback CTA: "원하는 포지션이 없나요?" + mailto 링크

### 9. 공통 패턴

- 모든 섹션 제목 위에 uppercase 라벨 태그
- hover 트랜지션 duration-300 통일
- 애니메이션에 motion-safe: 프리픽스
- prefers-reduced-motion 대응

---

## Files to Modify

1. `components/navigation.tsx` — active state 추가
2. `app/careers/page.tsx` — 전체 섹션 개선
3. `locales/ko.json` — 새 번역 키 (fallback CTA 텍스트)
4. `locales/jp.json` — 새 번역 키 (fallback CTA 텍스트)

## Files NOT Modified

- 기존 다른 페이지 (service, portfolio, blog 등) — 이후 별도 적용
- 공통 컴포넌트 (Card, Button) — 기존 유지

---

## Anti-patterns to Avoid

- Bebas Neue 폰트 사용 금지 (한국어 미지원)
- Forma-style 전면 리디자인 금지 (3회 롤백 이력)
- 악센트 컬러 도입 금지 (모노크롬 유지)
- 과도한 애니메이션 금지 (subtle only)
