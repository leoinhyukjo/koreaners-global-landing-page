# Slack Webhook Notifications Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 웹사이트 문의/크리에이터 신청 시 Slack 채널에 실시간 알림 전송

**Architecture:** 기존 API 라우트(`/api/notion`, `/api/creator-application`)에서 Notion 저장 성공 후 fire-and-forget으로 Slack Incoming Webhook 호출. 공용 유틸리티 `lib/slack.ts`에서 메시지 포맷팅 및 전송 담당.

**Tech Stack:** Next.js API Routes, Slack Incoming Webhook, Slack Block Kit

---

### Task 1: lib/slack.ts 유틸리티 생성

**Files:**
- Create: `lib/slack.ts`

**Step 1: Create `lib/slack.ts`**

```typescript
// Slack Incoming Webhook 유틸리티
// fire-and-forget 패턴: 실패해도 사용자 경험에 영향 없음

interface InquiryData {
  name: string
  company?: string
  position?: string
  email: string
  phone?: string
  message: string
}

interface CreatorApplicationData {
  name: string
  email: string
  phone?: string
  instagram_url: string
  youtube_url?: string
  tiktok_url?: string
  x_url?: string
  message?: string
  track_type: 'exclusive' | 'partner'
  locale: 'ko' | 'ja'
}

async function sendSlackWebhook(webhookUrl: string, blocks: any[]): Promise<void> {
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    })
    if (!res.ok) {
      console.error('[Slack] Webhook failed:', res.status, await res.text())
    }
  } catch (error) {
    console.error('[Slack] Webhook error:', error)
  }
}

export function sendSlackInquiry(data: InquiryData): void {
  const webhookUrl = process.env.SLACK_WEBHOOK_INQUIRIES
  if (!webhookUrl) return

  const fields = [
    `*이름:* ${data.name}`,
    `*이메일:* ${data.email}`,
    data.company ? `*회사:* ${data.company}` : null,
    data.position ? `*직급:* ${data.position}` : null,
    data.phone ? `*전화:* ${data.phone}` : null,
  ].filter(Boolean).join('\n')

  const blocks = [
    { type: 'header', text: { type: 'plain_text', text: '📩 새 문의가 접수되었습니다' } },
    { type: 'section', text: { type: 'mrkdwn', text: fields } },
    { type: 'section', text: { type: 'mrkdwn', text: `*💬 문의 내용*\n${data.message}` } },
  ]

  // fire-and-forget: 호출만 하고 await 하지 않음
  sendSlackWebhook(webhookUrl, blocks)
}

export function sendSlackCreatorApplication(data: CreatorApplicationData): void {
  const webhookUrl = process.env.SLACK_WEBHOOK_CREATORS
  if (!webhookUrl) return

  const localeEmoji = data.locale === 'ko' ? '🇰🇷' : '🇯🇵'
  const trackLabel = data.track_type === 'exclusive' ? 'Exclusive' : 'Partner'

  const info = [
    `*이름:* ${data.name}`,
    `*이메일:* ${data.email}`,
    `*트랙:* ${trackLabel}`,
    `*로케일:* ${localeEmoji} ${data.locale.toUpperCase()}`,
    data.phone ? `*전화:* ${data.phone}` : null,
  ].filter(Boolean).join('\n')

  const socials = [
    `• <${data.instagram_url}|Instagram>`,
    data.youtube_url ? `• <${data.youtube_url}|YouTube>` : null,
    data.tiktok_url ? `• <${data.tiktok_url}|TikTok>` : null,
    data.x_url ? `• <${data.x_url}|X>` : null,
  ].filter(Boolean).join('\n')

  const blocks: any[] = [
    { type: 'header', text: { type: 'plain_text', text: '🎨 새 크리에이터 신청이 접수되었습니다' } },
    { type: 'section', text: { type: 'mrkdwn', text: info } },
    { type: 'section', text: { type: 'mrkdwn', text: `*📱 소셜 미디어*\n${socials}` } },
  ]

  if (data.message) {
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*💬 자기소개*\n${data.message}` } })
  }

  sendSlackWebhook(webhookUrl, blocks)
}
```

**Step 2: Verify no type errors**

Run: `cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page && npx tsc --noEmit lib/slack.ts` (or full build check)

---

### Task 2: /api/notion 라우트에 Slack 호출 추가

**Files:**
- Modify: `app/api/notion/route.ts:191-194` (Notion 저장 성공 직후)

**Step 1: Add import and Slack call**

After line 3 (imports), add:
```typescript
import { sendSlackInquiry } from '@/lib/slack'
```

After line 193 (`console.log` success), before building successResponse, add:
```typescript
    // Slack 알림 (fire-and-forget)
    sendSlackInquiry({
      name: safeName,
      email: safeEmail,
      company: safeCompany || undefined,
      position: safePosition || undefined,
      phone: safePhone || undefined,
      message: safeMessage,
    })
```

---

### Task 3: /api/creator-application 라우트에 Slack 호출 추가

**Files:**
- Modify: `app/api/creator-application/route.ts:162-164` (Notion 저장 성공 직후)

**Step 1: Add import and Slack call**

After line 7 (imports), add:
```typescript
import { sendSlackCreatorApplication } from '@/lib/slack'
```

After line 163 (`console.log` success), before return, add:
```typescript
    // Slack 알림 (fire-and-forget)
    sendSlackCreatorApplication({
      name: safeName,
      email: safeEmail,
      phone: safePhone || undefined,
      instagram_url: safeInstagram,
      youtube_url: safeYoutube || undefined,
      tiktok_url: safeTiktok || undefined,
      x_url: safeX || undefined,
      message: safeMessage || undefined,
      track_type: safeTrackType,
      locale: safeLocale,
    })
```

---

### Task 4: 환경 변수 설정 및 테스트

**Step 1: Slack 앱에서 Incoming Webhook 생성**
- https://api.slack.com/apps → 기존 앱 또는 새 앱
- Incoming Webhooks 활성화
- `#website-inquiries` 채널용 webhook URL 생성
- `#creator-applications` 채널용 webhook URL 생성

**Step 2: .env.local에 추가**
```
SLACK_WEBHOOK_INQUIRIES=https://hooks.slack.com/services/...
SLACK_WEBHOOK_CREATORS=https://hooks.slack.com/services/...
```

**Step 3: Vercel 환경 변수에도 동일하게 추가**

**Step 4: 로컬에서 폼 제출 테스트 → Slack 메시지 수신 확인**

**Step 5: Commit**
```
feat: add Slack notifications for inquiries and creator applications
```
