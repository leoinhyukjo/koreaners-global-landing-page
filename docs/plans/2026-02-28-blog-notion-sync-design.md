# 블로그 Notion → Supabase 동기화 설계

**작성일:** 2026-02-28
**상태:** 설계 승인 완료

---

## 배경

블로그 콘텐츠를 Notion에서 작성하고, Supabase로 동기화하여 웹사이트에 반영하는 구조.
Notion = 에디터, Supabase = 서빙 DB. 포트폴리오도 나중에 같은 패턴으로 확장 예정.

## 아키텍처

```
Notion DB (블로그 포스트) → /api/sync/blog → Supabase DB (blog_posts) → Next.js 기존 코드
                              │
                              ├── Notion 블록 → HTML 변환
                              ├── ## FAQ 섹션 파싱 → faqs JSONB
                              └── Notion 이미지 → Supabase Storage (영구 URL)
```

- 트리거: 어드민 페이지 수동 버튼 (팀원도 사용 가능)
- 단방향 동기화 (Notion → Supabase)
- 콘텐츠 포맷: HTML 통일 (기존 BlockNote JSON 걷어냄)

## Notion DB 스키마 확장

### 추가할 속성

| 속성명 | 타입 | 매핑 → Supabase |
|--------|------|-----------------|
| 상태 | Select (초안/발행/비공개) | `published` (발행=true) |
| 슬러그 | Text | `slug` |
| 요약 | Text | `summary` (Quick Answer) |
| 썸네일 | URL | `thumbnail_url` |
| Meta Title | Text | `meta_title` |
| Meta Description | Text | `meta_description` |

### 기존 속성

| 속성명 | 매핑 → Supabase |
|--------|-----------------|
| 이름 | `title` |
| 발행일 | `created_at` |
| 카테고리 | `category` |

### 본문 & FAQ

- 본문: Notion 페이지 콘텐츠 → HTML 변환 → `content` (HTML string)
- FAQ: 본문 내 `## FAQ` 헤딩 이후 Q&A 파싱 → `faqs` JSONB

## 동기화 흐름

```
[어드민 "동기화" 버튼 클릭]
       │
       ▼
[/api/sync/blog] API Route (시크릿 키 검증)
       │
       ├── 1. Notion DB 쿼리 (전체 글)
       │
       ├── 2. 각 글의 페이지 콘텐츠(블록) 가져오기
       │
       ├── 3. 변환
       │     ├── Notion 블록 → HTML (본문)
       │     ├── ## FAQ 섹션 파싱 → {question, answer}[]
       │     └── Notion 이미지 → Supabase Storage 복사 (영구 URL)
       │
       ├── 4. Supabase upsert (slug 기준)
       │     ├── 상태=발행 → published=true
       │     └── 상태=초안/비공개 → published=false
       │
       └── 5. 결과 반환 (동기화된 글 수, 에러 등)
```

## 보안

- API Route에 `SYNC_SECRET` 환경변수로 인증
- 어드민 페이지에서 호출 시 서버사이드로 시크릿 포함

## 에러 처리

- Notion API 실패 → 에러 메시지 반환, 다음 시도에서 재시도
- 개별 글 변환 실패 → 해당 글만 스킵, 나머지 정상 동기화
- 이미지 복사 실패 → 원본 Notion URL 임시 사용

## 프론트엔드 변경

- content 렌더러: BlockNote JSON → HTML prose 렌더러로 교체
- 기존 BlockNote 에디터/렌더러 코드 제거 가능 (어드민 에디터는 유지하되 사용 안 함)

## Notion DB 정보

- DB: 📝 블로그 포스트
- data_source_id: 2f501ca3-e480-81ed-ac89-000babe4a50c
- URL: https://www.notion.so/2f501ca3e4808082aae4f046911ccf9b
