// Slack Incoming Webhook 유틸리티
// fire-and-forget 패턴: 실패해도 사용자 경험에 영향 없음

interface InquiryData {
  name: string;
  company?: string;
  position?: string;
  email: string;
  phone?: string;
  message: string;
}

interface CreatorApplicationData {
  name: string;
  email: string;
  phone?: string;
  instagram_url: string;
  youtube_url?: string;
  tiktok_url?: string;
  x_url?: string;
  message?: string;
  track_type: "exclusive" | "partner";
  locale: "ko" | "ja";
}

async function sendSlackWebhook(
  webhookUrl: string,
  blocks: Record<string, unknown>[],
): Promise<void> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });
    if (!res.ok) {
      console.error("[Slack] Webhook failed:", res.status, await res.text());
    }
  } catch (error) {
    console.error("[Slack] Webhook error:", error);
  }
}

export function sendSlackInquiry(data: InquiryData): void {
  const webhookUrl = process.env.SLACK_WEBHOOK_INQUIRIES;
  if (!webhookUrl) return;

  const fields = [
    `*이름:* ${data.name}`,
    `*이메일:* ${data.email}`,
    data.company ? `*회사:* ${data.company}` : null,
    data.position ? `*직급:* ${data.position}` : null,
    data.phone ? `*전화:* ${data.phone}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "📩 새 문의가 접수되었습니다",
        emoji: true,
      },
    },
    { type: "section", text: { type: "mrkdwn", text: fields } },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*💬 문의 내용*\n${data.message}` },
    },
  ];

  sendSlackWebhook(webhookUrl, blocks);
}

export function sendSlackCreatorApplication(
  data: CreatorApplicationData,
): void {
  const webhookUrl = process.env.SLACK_WEBHOOK_CREATORS;
  if (!webhookUrl) return;

  const localeEmoji = data.locale === "ko" ? "🇰🇷" : "🇯🇵";
  const trackLabel = data.track_type === "exclusive" ? "Exclusive" : "Partner";

  const info = [
    `*이름:* ${data.name}`,
    `*이메일:* ${data.email}`,
    `*트랙:* ${trackLabel}`,
    `*로케일:* ${localeEmoji} ${data.locale.toUpperCase()}`,
    data.phone ? `*전화:* ${data.phone}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const socials = [
    `• <${data.instagram_url}|Instagram>`,
    data.youtube_url ? `• <${data.youtube_url}|YouTube>` : null,
    data.tiktok_url ? `• <${data.tiktok_url}|TikTok>` : null,
    data.x_url ? `• <${data.x_url}|X>` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const blocks: Record<string, unknown>[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🎨 새 크리에이터 신청이 접수되었습니다",
        emoji: true,
      },
    },
    { type: "section", text: { type: "mrkdwn", text: info } },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*📱 소셜 미디어*\n${socials}` },
    },
  ];

  if (data.message) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*💬 자기소개*\n${data.message}` },
    });
  }

  sendSlackWebhook(webhookUrl, blocks);
}
