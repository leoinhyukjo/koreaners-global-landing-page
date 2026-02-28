# Notion → Portfolio 자동 포스팅 설계

**날짜**: 2026-02-28
**상태**: 승인됨

## 요약

Notion DB(📓 포트폴리오 포스트)를 유일한 콘텐츠 소스로 사용하여 웹사이트 `/portfolio` 페이지에 자동 렌더링. 기존 Supabase 기반 포트폴리오 시스템을 완전 대체.

## 현재 상태

- Supabase `portfolios` 테이블에 감자밭/뉴믹스 2개 포스트 존재 (BlockNote JSON)
- Notion DB에도 동일한 2개 포스트 존재 (Notion 블록)
- Admin 포트폴리오 관리 페이지 존재 (`/admin/portfolios/`)

## 전환 후 상태

- Notion DB가 유일한 콘텐츠 소스
- Supabase portfolios 테이블 미사용
- Admin 포트폴리오 페이지 비활성화
- ISR 60초 캐싱으로 자동 반영

## Notion DB 스키마 (속성 추가 필요)

| 속성 | 타입 | 용도 |
|------|------|------|
| 이름 | Title (기존) | 포트폴리오 제목 |
| 썸네일 | Files & media | 카드 이미지 (외부 URL) |
| 게시 | Checkbox | 체크된 것만 웹사이트 노출 |
| 요약 | Rich text | 카드 1~2줄 설명 |
| 카테고리 | Select | Beauty / F&B / Fashion 등 |
| 클라이언트명 | Rich text | 브랜드명 |

## 아키텍처

```
Notion DB (📓 포트폴리오 포스트)
    │
    ├─ 목록 API: queryDatabase → 게시=true 필터
    │   → 속성만 fetch (제목, 썸네일, 요약, 카테고리)
    │
    └─ 상세 API: getPage + listBlockChildren
        → 전체 블록 fetch → 커스텀 렌더러로 React 변환

Next.js ISR (revalidate: 60)
    → 최대 1분 내 자동 반영
    → 별도 배포/수동 작업 불필요
```

## 페이지 구조

### 목록 `/portfolio` (Server Component + ISR)
- 기존 UI 패턴 유지 (다크 테마, 카드 그리드, 카테고리 필터)
- Supabase fetch → Notion API fetch로 교체
- 카테고리 필터 동일하게 유지

### 상세 `/portfolio/[id]` (Server Component + ISR)
- BlockNote 뷰어 → Notion 블록 커스텀 렌더러로 교체
- `prose dark:prose-invert` 스타일 유지
- 하단 추천 포트폴리오 + CTA 유지

## Notion 블록 렌더러

커스텀 경량 렌더러 (react-notion-x 등 외부 라이브러리 미사용)

**지원 블록**: paragraph, heading_1/2/3, bulleted_list_item, numbered_list_item, image, divider, callout, quote, table, bookmark

**지원 인라인**: bold, italic, strikethrough, underline, code, link, color

## 이미지 처리

| 유형 | 처리 |
|------|------|
| 썸네일 | 외부 URL (Supabase Storage 등 영구 링크) |
| 본문 이미지 | Notion API에서 ISR마다 신선한 URL 수급 |

## 신규 파일

```
lib/
  notion-portfolio.ts     # Notion API fetch 함수
  notion-renderer.tsx     # Notion 블록 → React 변환
```

## 수정 파일

```
app/portfolio/page.tsx           # Supabase → Notion API
app/portfolio/[id]/page.tsx      # BlockNote → Notion 렌더러
next.config.mjs                  # Notion 이미지 도메인 추가
```

## 삭제/비활성화

```
components/portfolio/portfolio-content-client.tsx  # BlockNote 뷰어 삭제
app/admin/portfolios/                              # 추후 정리 (당장 삭제 안 함)
```

## 환경변수

기존 `NOTION_TOKEN` 재사용. 추가 필요:
- `NOTION_PORTFOLIO_DB_ID` — 포트폴리오 DB ID

## 향후 확장

- 블로그도 동일 패턴으로 Notion 전환 가능
- 일본어 지원: Notion에 `이름_JP`, `요약_JP` 속성 추가로 확장
