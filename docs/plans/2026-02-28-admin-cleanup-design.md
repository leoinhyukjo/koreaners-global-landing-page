# Admin Page Cleanup Design

**Date**: 2026-02-28
**Approach**: Incremental cleanup (A안)

## Goal

어드민 페이지에서 불필요한 섹션을 제거하고, 남은 2개 섹션을 미니멀 다크 디자인으로 통일

## Final Structure

### Before (6 sections + sidebar)
- Dashboard, Blog, Portfolio, Creator, Inquiries, Creator Applications
- Left sidebar navigation

### After (2 tabs, no sidebar)
- **Dashboard tab**: 블로그 통계 (총 포스트, 최근 동기화 시각 등)
- **Blog tab**: 블로그 목록 + Notion 동기화 버튼
- Top tab navigation (no sidebar)

## Sections Removed

| Section | Reason |
|---------|--------|
| Blog Editor (`/admin/blog/edit`) | Notion is single source |
| Portfolio (all) | Future Notion sync, hidden for now |
| Creator (all) | Future Notion sync, hidden for now |
| Inquiries | Managed in Notion |
| Creator Applications | Managed in Notion |

## Files to Delete

### Pages
- `app/admin/blog/edit/page.tsx`
- `app/admin/portfolios/` (entire directory)
- `app/admin/creators/page.tsx`
- `app/admin/inquiries/` (entire directory)
- `app/admin/creator-applications/` (entire directory)

### Components
- `components/admin/blog-editor.tsx`
- `components/admin/blog-editor-wrapper.tsx`
- `components/admin/blog-dialog.tsx`
- `components/admin/portfolio-edit-form.tsx`
- `components/admin/portfolio-editor-wrapper.tsx`
- `components/admin/portfolio-dialog.tsx`
- `components/admin/portfolios-list-page.tsx`
- `components/admin/creators-list-page.tsx`
- `components/admin/creator-dialog.tsx`
- `components/admin/realtime-notification.tsx` (no inquiries = no realtime needed)

### Components to Modify
- `components/admin/dashboard-page.tsx` — remove portfolio/creator/inquiry stats
- `components/admin/blog-list-page.tsx` — UI refresh only

### Layout Changes
- `app/admin/layout-client.tsx` — sidebar → top tab bar (2 tabs)

## Design: Minimal Dark

### Layout
```
┌──────────────────────────────────────────────┐
│  KOREANERS Admin    [Dashboard] [Blog]  [⏏]  │
├──────────────────────────────────────────────┤
│                                              │
│              Main Content Area               │
│                                              │
└──────────────────────────────────────────────┘
```

- No sidebar
- Fixed top bar with logo + tabs + logout
- Mobile: same top bar, tabs stay visible

### Design Tokens
- Background: `bg-neutral-950` (#0a0a0a)
- Card/Surface: `bg-neutral-900` (#171717)
- Border: `border-neutral-800` (#262626)
- Text primary: `text-neutral-50` (#fafafa)
- Text muted: `text-neutral-400` (#a3a3a3)
- Hover: `bg-neutral-800` (#262626)
- Active tab: underline or filled indicator
- Rounding: `rounded-lg` unified

### Dashboard Tab
- Blog stats: total posts, published count, draft count
- Recent blog posts (last 5)
- Last sync timestamp

### Blog Tab
- Notion sync button (top right)
- Table: thumbnail, title, category badge, status badge, date
- Mobile: card layout
- Sync status indicator

### Unified Patterns
1. Page header: title + description + action button
2. Table: consistent spacing, hover effect, neutral-800 borders
3. Badges: default/secondary variants only
4. Loading: skeleton with neutral-800 pulse
5. Empty state: icon + message centered
