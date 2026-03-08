# Organic Warm — 전체 사이트 스타일 통합 & 비주얼 개선

**Date**: 2026-03-08
**Branch**: `feat/organic-warm-redesign`
**Scope**: 메인 랜딩 Organic Warm v2 적용 후, 서브페이지 + 공유 컴포넌트 전체 스타일 통합

---

## 1. HIGH 우선순위 — 글로벌 컴포넌트

### button.tsx (기본 컴포넌트)
- `rounded-none` → `rounded-[var(--radius-sm)]` (전역 영향)
- default variant: `border-2 border-[#FF4500]` → `border-0` (테두리 제거)
- outline variant: `hover:bg-[#FF4500]` → `hover:border-[#FF4500]/60 hover:bg-white/5` (절제된 호버)

### navigation.tsx (헤더)
- 데스크탑 CTA: 단색 `bg-[#FF4500]` → `gradient-warm` + hover scale/glow
- 모바일 CTA: 동일하게 `gradient-warm` + `rounded-[var(--radius-sm)]`
- 모바일 메뉴 `rounded-none` 제거

### footer-cta.tsx (문의 폼)
- 제출 버튼: `gradient-warm` + `rounded-[var(--radius-sm)]` + hover 이펙트
- 성공 다이얼로그: `rounded-[var(--radius)]`
- 체크박스: `rounded-[var(--radius-sm)]`
- 확인 버튼: `gradient-warm`

### card.tsx / skeleton-card.tsx
- 기본 카드: `rounded-none` → `rounded-[var(--radius)]`, `border-border` → `border-[var(--border)]`

---

## 2. MEDIUM 우선순위 — 서브페이지 (병렬 서브에이전트 5개)

### service/page.tsx
- 5개 섹션: `bg-white` → `bg-[var(--kn-light)]`, 카드 → warm sand
- 액센트 라인 → SectionTag pill, 뮤트 텍스트 컬러 통일
- Data & Reporting 섹션 비주얼 개선:
  - 헤딩 키워드 `gradient-warm-text`
  - 핵심 수치(450%, 4m 32s, ¥8.2M 등) `gradient-warm-text`
  - 프로그레스바 `rounded-full`
  - 키워드 태그 `rounded-full` pill
  - 내부 박스 `rounded-[var(--radius-sm)]`

### careers/page.tsx
- 7개 SectionTag, 3개 `bg-white` → cream
- 카드 radius/border 통일, CTA `gradient-warm`
- 상세보기 버튼 outline 호버 통일

### creator/page.tsx
- 3개 SectionTag, `bg-white` → cream
- 카드/다이얼로그 radius, CTA `gradient-warm`
- Section 3→4 사이 이중 패딩 제거 (`py-` → `pb-` only)
- 페이지네이션: 이전/다음 버튼 추가 (블로그와 동일)
- `CREATORS_PER_PAGE` 12 → 9

### portfolio/page.tsx + [id]/page.tsx
- SectionTag, 카테고리 탭 `gradient-warm`
- 뱃지 `rounded-full` pill, 이미지 `rounded-[var(--radius-lg)]`

### blog/page.tsx + blog-post-view.tsx + blog-faq-section.tsx
- SectionTag, 카드 radius/border 통일
- 페이지네이션 스타일 통일 (이전/다음 + gradient-warm 활성)
- `POSTS_PER_PAGE` 12 → 9
- blog-post-view: 이미지 `rounded-[var(--radius-lg)]`, 뱃지 `rounded-full`, 콘텐츠 래퍼 `rounded-[var(--radius)]`

---

## 3. 기타 컴포넌트

| 파일 | 변경 내용 |
|------|----------|
| `not-found.tsx` | `bg-black` → `bg-[var(--kn-dark)]`, CTA `gradient-warm` |
| `creator-track-section.tsx` | SectionTag, 카드 radius, outline 링크 호버 통일 |
| `welcome-popup.tsx` | 컨테이너 radius, CTA `gradient-warm` |
| `marketing-cta.tsx` | 섹션 radius, CTA `gradient-warm` |
| `contact/page.tsx` | skeleton radius |

---

## 4. 히어로 섹션

- **BEYOND** 텍스트: 단색 `text-[#FF4500]` → `gradient-warm-text` (오렌지→앰버 그라데이션)

---

## 변경 파일 총 21개

```
app/blog/page.tsx
app/careers/page.tsx
app/contact/page.tsx
app/creator/page.tsx
app/not-found.tsx
app/portfolio/[id]/page.tsx
app/portfolio/page.tsx
app/service/page.tsx
components/blog/blog-faq-section.tsx
components/blog/blog-post-view.tsx
components/common/marketing-cta.tsx
components/creator-track-section.tsx
components/footer-cta.tsx
components/hero-section.tsx
components/navigation.tsx
components/ui/button.tsx
components/ui/card.tsx
components/ui/skeleton-card.tsx
components/welcome-popup.tsx
```
