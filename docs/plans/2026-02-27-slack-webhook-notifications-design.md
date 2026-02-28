# Slack Webhook Notifications Design

**Date**: 2026-02-27
**Status**: Approved

## Goal

웹사이트 폼 제출(문의, 크리에이터 신청) 시 Slack 채널에 실시간 알림 전송.

## Approach

Slack Incoming Webhook — 기존 fire-and-forget 패턴 활용, 서버 사이드에서만 호출.

## Architecture

```
폼 제출 (클라이언트)
  ├─→ [필수] Supabase insert
  ├─→ [fire-and-forget] Notion API
  └─→ [fire-and-forget] Slack Webhook  ← NEW
```

## Channels

- `#website-inquiries` — 문의 알림
- `#creator-applications` — 크리에이터 신청 알림

## Env Vars

```
SLACK_WEBHOOK_INQUIRIES=https://hooks.slack.com/services/...
SLACK_WEBHOOK_CREATORS=https://hooks.slack.com/services/...
```

## Files

| File | Change |
|------|--------|
| `lib/slack.ts` | NEW — sendSlackInquiry(), sendSlackCreatorApplication() |
| `app/api/notion/route.ts` | Add Slack call after Notion save |
| `app/api/creator-application/route.ts` | Add Slack call after Notion save |
| `.env.local` | Add 2 webhook URLs |
