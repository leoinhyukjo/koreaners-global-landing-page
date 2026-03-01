# Creator Notion Sync + Admin Consolidation Design

**Date**: 2026-02-28

## Goal

1. 크리에이터 Notion DB → Supabase 자동 동기화 파이프라인 구축
2. 어드민을 대시보드 단일 페이지로 통합 (통계 + 동기화 버튼 2개)

## 1. 크리에이터 동기화 파이프라인

### Data Flow

```
Notion 크리에이터 DB → POST /api/sync/creators → Supabase creators 테이블 → /creator 페이지
```

### Notion DB 변경 (수동)

- DB ID: `2f601ca3e480806794b5ec5b85167f35`
- Data Source: `collection://2f601ca3-e480-80c0-82a3-000b7f67640d`
- **추가 필드 1**: `프로필이미지` — Files & Media 타입
- **추가 필드 2**: `홈페이지공개` — Checkbox 타입

### Property Mapping (Notion → Supabase)

| Notion | Supabase `creators` | 비고 |
|--------|---------------------|------|
| `이름` (title) | `name` | |
| `프로필이미지` (files) | `profile_image_url` | Supabase Storage 업로드 |
| `인스타` (url) | `instagram_url` | |
| `유튜브` (url) | `youtube_url` | |
| `틱톡` (url) | `tiktok_url` | |
| `X` (url) | `x_url` | 컬럼 추가 필요 |
| `홈페이지공개` (checkbox) | — | true인 것만 동기화 |
| Notion page ID | `notion_id` | upsert 키, 컬럼 추가 필요 |

### Supabase Schema Changes

```sql
ALTER TABLE creators ADD COLUMN IF NOT EXISTS x_url TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS notion_id TEXT UNIQUE;
```

### Sync API: `POST /api/sync/creators`

- 인증: SYNC_SECRET Bearer token (블로그와 동일)
- Notion DB 조회 → `홈페이지공개 = true` 필터
- 프로필 이미지: Notion Files → Supabase Storage `creators/` 업로드
- Supabase `creators` upsert (onConflict: `notion_id`)
- Notion에서 비공개 전환된 크리에이터 → Supabase에서 삭제

### launchd 자동화

- 블로그 sync와 동일 시간대 (12:00, 18:00)에 함께 실행

## 2. 어드민 단일 페이지 통합

### Before → After

- Before: 대시보드 탭 + 블로그 탭 (2페이지 + 탭 네비게이션)
- After: 대시보드 1페이지 (탭 없음, 통계 + 동기화 버튼 2개)

### 제거

- `/admin/blog` 페이지 (route + component)
- 탭 네비게이션 (layout-client.tsx에서 navItems 제거)

### 대시보드 UI

```
┌──────────────────────────────────────────────┐
│  KOREANERS Admin                        [⏏]  │
├──────────────────────────────────────────────┤
│  대시보드                                     │
│  사이트 현황 요약                              │
│                                              │
│  ┌──────┐ ┌──────┐ ┌──────┐                  │
│  │전체 12│ │발행 10│ │임시 2 │                  │
│  └──────┘ └──────┘ └──────┘                  │
│                                              │
│  동기화                                       │
│  ┌─────────────────┐ ┌─────────────────┐     │
│  │ 블로그 Notion     │ │ 크리에이터 Notion │     │
│  │ 동기화            │ │ 동기화           │     │
│  └─────────────────┘ └─────────────────┘     │
│  (동기화 결과 배너)                             │
└──────────────────────────────────────────────┘
```

### Design Tokens (기존과 동일)

- bg-neutral-950 (page), bg-neutral-900 (cards)
- border-neutral-800, text-neutral-50/400/500
- rounded-lg, hover:border-neutral-700
