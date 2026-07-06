# 메타광고 전환 퍼널 개선 (광고 전용 랜딩 + 계측 복구) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 메타광고 클릭이 홈페이지 메인에서 방황하다 이탈하는 문제를 광고 전용 랜딩 페이지(`/consult`) + 검증된 성과 요약 + 무료 상담 CTA + 실시간 상담 슬롯으로 해결하고, 그 전에 끊어져 있는 광고 귀속 계측을 복구한다.

**Architecture:** Next.js 16 App Router에 noindex 전용 라우트 `/consult`를 추가한다. 문의 제출은 기존 `FooterCTA` 컴포넌트를 그대로 재사용해 Supabase `inquiries` + Notion + Slack + Meta Pixel Lead 파이프라인을 무수정으로 태운다. UTM 캡처는 루트 layout의 전역 `UtmTracker`가 자동 처리한다. 계측 복구(Phase 0)가 선행되어야 랜딩 효과를 측정할 수 있다.

**Tech Stack:** Next.js 16 + Tailwind 4 (기존 랜딩 리포), Supabase `inquiries`, Meta Marketing API (url_tags), 채널톡(Channel.io) 또는 카카오톡 채널 (Leo 결정 대기, env-gated 슬롯).

**Repo:** `/Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page/`

## 배경 진단 (2026-07-06 실측)

- 2026-04~05 감액 실험에서 X4 판정 확정: 광고가 인바운드 문의의 주 드라이버 (`~/Obsidian/work/프로젝트/260412-프로젝트-문의폼-utm트래킹-광고감액실험.md`)
- 현재(6/22 신규 캠페인 이후) CPC/노출 성과는 좋은데, Supabase `inquiries` 기준 **6/15 이후 광고 귀속(utm_source=meta 또는 ig/fb/th) 문의 = 0건**. 실 문의는 전부 google/naver/exportvoucher organic
- 원인 후보 2개: (a) 6/22 신규 캠페인 광고에 URL 파라미터(url_tags) 미설정 → 계측 공백, (b) 광고 트래픽이 실제로 0% 전환 → 랜딩 퍼널 실패. 둘 다 이 플랜이 커버
- `lib/utm-tracking.ts`의 6/29 수정(다이렉트/봇 구분)이 **아직 uncommitted** 상태로 워킹트리에 있음

## Global Constraints

- **수치 화이트리스트**: 랜딩 카피의 모든 수치·주장은 `/Users/leo/Downloads/Claude-Projects/meta-ads-automation/config/verified_numbers.json`의 `ad_safe_claims` 배열에 있는 것만 사용. `forbidden_claims` 배열의 표현은 절대 금지 (예: "전속 크리에이터 105명", "체험단 5,000명", "70+ 브랜드 진행 중")
- **모델 라우팅**: 기계적 코드 작업 = Sonnet 서브에이전트, 한국어 카피·판정 = Opus 메인 세션 직접 (CLAUDE.md 서브에이전트 모델 라우팅 룰)
- **기존 제출 파이프라인 무수정**: `components/footer-cta.tsx`의 submit 로직(Supabase insert + `/api/notion` POST + `fbq("track","Lead")` + CSRF)은 수정하지 않고 재사용만 한다
- **/consult는 noindex**: `robots: { index: false, follow: false }` + `app/sitemap.ts`에 추가하지 않음 (광고 전용, SEO 오염 방지)
- **디자인**: `design-system/MASTER.md` 패턴 준수. 아래 태스크의 JSX 구조·카피·데이터는 유지하되 클래스는 MASTER.md 패턴에 맞춰 조정 가능
- **배포 게이트**: `git push` (= Vercel prod 자동 배포)는 항상 Leo 컨펌 후. 커밋까지는 태스크 내에서 진행
- **커밋 컨벤션**: `feat:` / `fix:`, attribution 없음 (글로벌 설정)
- **외부 SNS 링크 금지**: 랜딩 페이지에 인스타/틱톡 등 외부 링크를 넣지 않는다 (이탈 경로 + 링크 검증 부담)

---

## Phase 0: 계측 복구 (랜딩과 무관하게 즉시)

### Task 0.1: utm-tracking 6/29 픽스 커밋 + 배포 [Sonnet]

**Files:**
- Commit: `lib/utm-tracking.ts` (이미 수정돼 워킹트리에 있음, uncommitted)

**Interfaces:**
- Consumes: 없음 (기존 diff)
- Produces: 전 필드 공란 = "폼 직접 POST 봇" 신호로 사용 가능한 `inquiries` 데이터

- [ ] **Step 1: diff 확인**

Run: `cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page && git diff lib/utm-tracking.ts`

Expected: `if (!hasAnyUtm && !referrer) return null` early return 제거 + landing_page/first_touch_at 항상 저장하는 변경. 이 내용이 아니면 중단하고 보고 (2026-06-29 작업분 기준: `260412-프로젝트-문의폼-utm트래킹-광고감액실험.md`의 2026-06-29 entry 참조).

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 0

- [ ] **Step 3: 커밋**

```bash
git add lib/utm-tracking.ts
git commit -m "fix: utm 캡처 시 landing_page 항상 저장 (다이렉트/봇 구분)"
```

주의: `.gitignore` 수정분과 `.env.example` 신규 파일은 이 태스크 범위 아님. 함께 커밋하지 말 것.

- [ ] **Step 4: Leo 컨펌 후 push** (Vercel 자동 배포)

Run: `git push origin main`
Expected: Vercel 배포 트리거. 배포 후 www.koreaners.co 아무 페이지 접속 → DevTools Session Storage `krns_utm_data`에 `landing_page` 저장 확인.

### Task 0.2: 신규 캠페인 광고 url_tags 확인 + 설정 [Leo 확인 1분 + Sonnet API]

**Files:**
- 참조: `/Users/leo/Downloads/Claude-Projects/meta-ads-automation/` (API 토큰/스크립트, `scripts/manage_ads.py` 패턴)

**Interfaces:**
- Consumes: 신규 캠페인 ID `23858859504820793` (2026-06-22 생성분)
- Produces: 활성 광고 전체에 url_tags 템플릿 적용 → 이후 `inquiries.utm_source='meta'` 계측 재개

- [ ] **Step 1: Leo가 Ads Manager UI에서 확인**

현재 ACTIVE 캠페인의 각 광고 수정 화면 → "URL 파라미터" 필드에 아래 템플릿이 있는지 확인:

```
utm_source=meta&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}
```

주의: Meta Graph API에서 `url_tags`는 write-only (GET 시 `#100 nonexisting field`) — API 조회로 확인 불가, UI 육안 또는 실클릭 테스트만 가능 (2026-05-18 오판 사고 참조).

- [ ] **Step 2: 미설정 광고에 API로 POST** (미설정 발견 시에만)

meta-ads-automation 리포의 토큰으로, 4/20 작업과 동일 패턴:

```bash
# 캠페인 하위 활성 ad ID 목록 조회
curl -s "https://graph.facebook.com/v22.0/23858859504820793/ads?fields=id,name,status&access_token=$META_ACCESS_TOKEN"
# 각 ACTIVE ad에 url_tags POST
curl -s -X POST "https://graph.facebook.com/v22.0/<AD_ID>" \
  -d "url_tags=utm_source=meta&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}" \
  -d "access_token=$META_ACCESS_TOKEN"
```

Expected: 각 POST 응답 `{"success":true}`. url_tags 변경은 4/20, 5/18 선례상 심사·학습 이슈 없이 통과됨.

- [ ] **Step 3: 실클릭 검증**

광고 미리보기 링크 클릭 → 사이트 도착 → DevTools Session Storage `krns_utm_data`에 `utm_source=meta`, `utm_campaign=<캠페인명>` 확인. 또는 다음 광고 유입 문의의 Supabase row로 확인:

```sql
SELECT created_at, utm_source, utm_content, landing_page FROM inquiries
WHERE created_at >= '2026-07-06' ORDER BY created_at DESC LIMIT 10;
```

---

## Phase 1: 광고 전용 랜딩 페이지 `/consult`

### Task 1: /consult 라우트 스캐폴드 [Sonnet]

**Files:**
- Create: `app/consult/page.tsx`
- Create: `components/consult/consult-content.tsx`
- 참조(수정 금지): `components/footer-cta.tsx`, `components/logo.tsx`, `design-system/MASTER.md`, `app/sitemap.ts` (추가하지 않음을 확인만)

**Interfaces:**
- Consumes: `FooterCTA` (named export, `components/footer-cta.tsx`, props `{ headingLevel?: "h1" | "h2" }`), `Logo` (`components/logo.tsx`), `Button` (`components/ui/button.tsx`), `window.fbq` (전역 타입 `types/global.d.ts`에 이미 선언됨)
- Produces: `/consult` 라우트 (noindex), 섹션 구조: 슬림 헤더 → 히어로 → 성과 스탯 → 레퍼런스 사례 → 프로세스 → 문의 폼(`id="consult-form"`) → 모바일 sticky CTA

- [ ] **Step 1: page.tsx 작성**

```tsx
// app/consult/page.tsx
import type { Metadata } from "next";
import { ConsultContent } from "@/components/consult/consult-content";

export const metadata: Metadata = {
  title: "무료 상담 신청 | 일본 인플루언서 마케팅",
  description:
    "일본 인플루언서 마케팅 무료 상담. 크리에이터 네트워크 220명+, 누적 협업 브랜드 185개+의 코리너스가 캠페인 전 과정을 운영합니다.",
  robots: { index: false, follow: false },
};

export default function ConsultPage() {
  return <ConsultContent />;
}
```

- [ ] **Step 2: consult-content.tsx 작성**

카피는 초안이다 (Task 2에서 Opus가 확정). 수치는 verified_numbers.json `ad_safe_claims`에서만 가져왔고, 임의 추가 금지.

```tsx
// components/consult/consult-content.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FooterCTA } from "@/components/footer-cta";
import { Logo } from "@/components/logo";

// 수치 SoT: meta-ads-automation/config/verified_numbers.json > ad_safe_claims
// 이 배열 밖의 수치를 추가하려면 verified_numbers 검증 절차를 먼저 거칠 것
const STATS = [
  { value: "220명+", label: "크리에이터 네트워크" },
  { value: "185개+", label: "누적 협업 브랜드" },
  { value: "10곳", label: "일본 현지 미디어 직접 연결" },
];

const PROCESS = [
  {
    step: "01",
    title: "무료 상담 신청",
    desc: "아래 폼 작성에 1분이면 충분합니다. 담당 매니저가 확인 후 연락드립니다.",
  },
  {
    step: "02",
    title: "맞춤 제안",
    desc: "브랜드와 목표에 맞는 크리에이터 조합과 캠페인 구조를 설계해 제안드립니다.",
  },
  {
    step: "03",
    title: "캠페인 실행",
    desc: "크리에이터 섭외부터 콘텐츠 제작, 성과 리포트까지 코리너스가 운영합니다.",
  },
];

function scrollToForm() {
  document.getElementById("consult-form")?.scrollIntoView({ behavior: "smooth" });
}

export function ConsultContent() {
  useEffect(() => {
    if (typeof window.fbq === "function") {
      window.fbq("track", "ViewContent", { content_name: "consult_landing" });
    }
  }, []);

  return (
    <main className="min-h-screen">
      {/* 슬림 헤더: 로고만, 사이트 네비게이션 없음 (이탈 경로 제거) */}
      <header className="flex items-center justify-center py-5 border-b border-border/40">
        <Link href="/" aria-label="KOREANERS 홈">
          <Logo />
        </Link>
      </header>

      {/* 히어로 */}
      <section className="px-6 pt-16 pb-12 text-center max-w-3xl mx-auto">
        <p className="inline-block rounded-full border border-border px-4 py-1 text-sm font-medium mb-6">
          수출바우처 공식 수행기관
        </p>
        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
          일본 진출, 검증된
          <br />
          크리에이터 네트워크로 시작하세요
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          코리너스는 크리에이터 섭외부터 콘텐츠 제작, 성과 리포트까지
          일본 인플루언서 마케팅 전 과정을 직접 운영합니다.
        </p>
        <Button size="lg" onClick={scrollToForm}>
          무료 상담 받기
        </Button>
      </section>

      {/* 성과 스탯 */}
      <section className="px-6 py-12 border-y border-border/40">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 레퍼런스 사례 */}
      <section className="px-6 py-16 max-w-3xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          Qoo10 메가와리 시즌, K뷰티 4개 브랜드 동시 캠페인
        </h2>
        <p className="text-muted-foreground">
          크리에이터 마루오카 에츠코가 4일간 투고한 콘텐츠가 누적 113만 조회를
          기록했습니다. 코리너스는 시즌 커머스 일정에 맞춘 크리에이터 캠페인을
          설계하고 운영합니다.
        </p>
      </section>

      {/* 프로세스 */}
      <section className="px-6 py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {PROCESS.map((p) => (
            <div key={p.step}>
              <p className="text-sm font-bold text-muted-foreground">{p.step}</p>
              <h3 className="text-xl font-bold mt-2 mb-3">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 문의 폼: 기존 파이프라인 재사용 (Supabase + Notion + Slack + Pixel Lead) */}
      <div id="consult-form" className="scroll-mt-8">
        <FooterCTA />
      </div>

      {/* 모바일 sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 z-50 p-3 bg-background/95 backdrop-blur border-t border-border md:hidden">
        <Button size="lg" className="w-full" onClick={scrollToForm}>
          무료 상담 받기
        </Button>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: 클래스를 design-system/MASTER.md 패턴에 맞춰 조정**

`design-system/MASTER.md`를 읽고 히어로/섹션/버튼 클래스를 사이트 기존 패턴(Organic Warm)으로 정렬. 구조, 카피, STATS/PROCESS 데이터는 변경 금지.

- [ ] **Step 4: 타입 체크 + 빌드**

Run: `npx tsc --noEmit && npm run build`
Expected: 에러 0, `/consult` 라우트 빌드 목록에 포함

- [ ] **Step 5: sitemap 미포함 + noindex 확인**

Run: `grep -n "consult" app/sitemap.ts || echo "OK: sitemap에 없음"`
Expected: `OK: sitemap에 없음`

Run: `npm run dev` 후 `curl -s localhost:3000/consult | grep -o 'noindex'`
Expected: `noindex`

- [ ] **Step 6: 커밋**

```bash
git add app/consult components/consult
git commit -m "feat: 메타광고 전용 랜딩 /consult (성과 요약 + 무료상담 CTA)"
```

### Task 2: 랜딩 카피 확정 [Opus 메인 세션 — 서브에이전트 위임 금지]

**Files:**
- Modify: `components/consult/consult-content.tsx` (카피 문자열만)

**Interfaces:**
- Consumes: Task 1의 초안 카피, Notion "메타 광고 소재" DB `32601ca3e48080dca05be379288ce1d5` (현재 라이브 소재의 훅 카피), `meta-ads-automation/config/verified_numbers.json`
- Produces: 발송 가능 수준의 확정 카피 (Leo 컨펌 완료 상태)

- [ ] **Step 1: 라이브 소재 훅 카피 조회**

Notion 메타 광고 소재 DB에서 현재 ACTIVE 소재의 훅 카피를 읽는다. 랜딩 히어로 헤드라인이 소재 메시지와 이어지도록 (message match) 조정. 광고에서 "수출바우처"를 앞세웠다면 랜딩 히어로도 수출바우처 앵글이 먼저 나와야 한다.

- [ ] **Step 2: 검증 게이트 3종 실행**

```bash
# forbidden claims 스캔 (verified_numbers.json의 forbidden_claims 각 항목으로)
grep -n "105명\|5,000명\|5000명\|언론사 100\|300+\|70+ 브랜드\|팔로워 5만\|67%\|500만\|리뷰 7개\|30만" components/consult/consult-content.tsx && echo "위반 발견" || echo "OK"
```

추가로: (a) 카피의 모든 수치가 `ad_safe_claims`에 있는지 육안 대조, (b) AI 잔재 스캔 (em-dash, 가운뎃점, 한자/카타카나 잔재 0건), (c) '짚다'/'박다' 금지 표현 0건.

- [ ] **Step 3: Leo에게 카피 diff 제시 + 컨펌**

터미널에 히어로/사례/프로세스 최종 카피를 보여주고 컨펌 받는다. 컨펌 전 push 금지.

- [ ] **Step 4: 커밋**

```bash
git add components/consult/consult-content.tsx
git commit -m "feat: /consult 카피 확정 (소재 메시지 정합 + 검증 수치 게이트 통과)"
```

### Task 3: 렌더 검수 + 배포 [Sonnet 검수, Leo 배포 컨펌]

**Files:**
- 없음 (검증 전용)

**Interfaces:**
- Consumes: Task 1~2 완료된 `/consult`
- Produces: 데스크톱/모바일 렌더 스크린샷, prod 배포

- [ ] **Step 1: Playwright 렌더 검수**

`npm run dev` 상태에서 Playwright로 `localhost:3000/consult` 접속, 데스크톱(1440px)과 모바일(390px) 스크린샷을 찍고 Read로 직접 확인: 폰트 로드, 섹션 정렬, 오버플로우 없음, 모바일 sticky CTA가 폼을 가리지 않는지 (폼 하단 여백 확인).

- [ ] **Step 2: 폼 E2E 1회**

Playwright로 폼 채워 제출 → 성공 다이얼로그 확인 → Supabase에서 테스트 row 확인 후 즉시 삭제:

```sql
DELETE FROM inquiries WHERE name = 'E2E테스트' AND created_at >= CURRENT_DATE;
```

Notion 문의 DB에 생성된 테스트 페이지는 이름을 `TEST_삭제예정`으로 바꿔 Leo 수동 삭제 대기 (Notion MCP에 영구삭제 없음, 2026-04-12 선례).

- [ ] **Step 3: Leo 컨펌 후 push**

Run: `git push origin main`
Expected: Vercel prod 배포. 배포 후 `https://www.koreaners.co/consult` 실접속 확인.

---

## Phase 2: 실시간 상담 슬롯 (Leo 결정 대기와 무관하게 코드는 inert 배포 가능)

### Task 4: 채널톡 env-gated 슬롯 [Sonnet 코드, Leo 결정]

**결정 대기 (Leo):** 채널톡 유료 가입 vs 카카오톡 채널 상담 버튼(무료, BD 실상담이 이미 카톡 중심) vs 1차 배포에서 보류. 코드는 플러그인 키가 없으면 아무것도 렌더하지 않으므로 결정 전에 머지해도 안전하다.

**Files:**
- Create: `components/consult/channel-talk.tsx`
- Modify: `components/consult/consult-content.tsx` (컴포넌트 1줄 마운트)
- Modify: `.env.example` (`NEXT_PUBLIC_CHANNELIO_PLUGIN_KEY=` 1줄 추가)

**Interfaces:**
- Consumes: env `NEXT_PUBLIC_CHANNELIO_PLUGIN_KEY` (Vercel 환경변수, Leo가 채널톡 가입 후 발급)
- Produces: `/consult` 한정 채널톡 위젯 (전 사이트 아님)

- [ ] **Step 1: channel-talk.tsx 작성**

```tsx
// components/consult/channel-talk.tsx
"use client";

import { useEffect } from "react";

const PLUGIN_KEY = process.env.NEXT_PUBLIC_CHANNELIO_PLUGIN_KEY;

declare global {
  interface Window {
    ChannelIO?: ((...args: unknown[]) => void) & { c?: (args: unknown) => void; q?: unknown[] };
    ChannelIOInitialized?: boolean;
  }
}

export function ChannelTalk() {
  useEffect(() => {
    if (!PLUGIN_KEY || window.ChannelIOInitialized) return;

    // 채널톡 공식 부트 스니펫 (https://developers.channel.io 기준)
    const w = window;
    const ch = function (...args: unknown[]) {
      ch.c?.(args);
    } as NonNullable<Window["ChannelIO"]>;
    ch.q = [];
    ch.c = function (args: unknown) {
      ch.q?.push(args);
    };
    w.ChannelIO = ch;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://cdn.channel.io/plugin/ch-plugin-web.js";
    document.head.appendChild(script);

    w.ChannelIOInitialized = true;
    w.ChannelIO("boot", { pluginKey: PLUGIN_KEY });

    return () => {
      w.ChannelIO?.("shutdown");
      w.ChannelIOInitialized = false;
    };
  }, []);

  return null;
}
```

주의: 채널톡 스니펫 최신 버전은 구현 시점에 공식 문서(developers.channel.io) 확인 후 필요하면 갱신. 부트 옵션에 `mobileMessengerMode` 등 추가 여부는 위젯이 모바일 sticky CTA와 겹치는지 렌더 검수로 판단.

- [ ] **Step 2: consult-content.tsx에 마운트**

```tsx
import { ChannelTalk } from "@/components/consult/channel-talk";
// ConsultContent 반환 JSX의 <main> 최하단에:
<ChannelTalk />
```

- [ ] **Step 3: 타입 체크 + 키 없는 상태 렌더 확인**

Run: `npx tsc --noEmit`
Expected: 에러 0

env 미설정 상태로 `/consult` 접속 → 채널톡 위젯이 렌더되지 않고 콘솔 에러 없음 확인.

- [ ] **Step 4: 커밋**

```bash
git add components/consult/channel-talk.tsx components/consult/consult-content.tsx .env.example
git commit -m "feat: /consult 채널톡 env-gated 슬롯"
```

- [ ] **Step 5 (Leo, 채널톡 채택 시):** 채널톡 가입 → 플러그인 키 발급 → Vercel 환경변수 `NEXT_PUBLIC_CHANNELIO_PLUGIN_KEY` 설정 → 재배포 → 위젯 노출 확인. 카카오톡 채널로 결정 시 이 태스크 대신 히어로/폼 옆에 카카오톡 채널 채팅 URL 버튼 1개 추가 (별도 미니 태스크).

---

## Phase 3: 광고 도착 URL 전환 (Leo, Ads Manager 수동)

### Task 5: 도착 URL을 /consult로 전환 [Leo + Opus 가이드]

**전제:** Phase 0 완료 (utm 계측 살아있음) + Phase 1 배포 완료.

**방식 옵션:**

| 옵션 | 방법 | 장점 | 단점 |
|---|---|---|---|
| A 즉시 전환 | 기존 ACTIVE 광고의 웹사이트 URL을 `https://www.koreaners.co/consult`로 수정 | 구조 단순, 예산 분산 없음 | 크리에이티브 수정 = 재심사 + 학습 리셋 (260524 가이드 룰 #1) |
| B 복제 전환 | 동일 소재로 광고 복제(URL만 /consult) 켜고, 기존 광고 PAUSE | 롤백 즉시 가능 (기존 광고 다시 ON) | 신규 광고도 학습은 처음부터 (룰 #7: 주간 전환 2~5건 규모라 어차피 Learning Limited, 실손실 작음) |

**권고: B.** 소재가 잘 먹히는 국면에서 되돌릴 수 없는 수정을 피한다. 룰 #6(7일 이내 재가동은 학습 무손실)에 따라 기존 광고를 PAUSE로 보존하면 2주 판정에서 실패해도 즉시 원복 가능.

- [ ] **Step 1 (Leo):** Ads Manager에서 ACTIVE 광고 복제 → 웹사이트 URL `https://www.koreaners.co/consult` → URL 파라미터 필드에 Phase 0 템플릿 유지 확인 → 게시
- [ ] **Step 2 (Leo):** 기존 광고 PAUSE (삭제 금지)
- [ ] **Step 3 (Oliver):** 전환 시각을 Phase 4 판정 기준일로 기록 (`~/Obsidian/work/프로젝트/260706-프로젝트-메타광고-랜딩퍼널-개선.md` 타임라인에 1줄)

---

## Phase 4: 측정 + 판정

### Task 6: 2주 판정 [Sonnet 쿼리 + Opus 판정]

**Baseline (2026-07-06 실측, Supabase inquiries):**

| 주 (월요일 기준) | 총 문의 | 광고 귀속 | utm 공란 |
|---|---|---|---|
| 06-15 | 3 | 0 | 3 |
| 06-22 | 5 | 0 | 5 |
| 06-29 | 4 | 0 | 4 |

광고 귀속 0건/주가 출발선. organic(구글/네이버/수출바우처)은 3~4건/주로 안정.

- [ ] **Step 1: 전환 2주 후 실측 쿼리 실행**

```sql
SELECT
  date_trunc('week', created_at)::date AS week_start,
  count(*) AS total,
  count(*) FILTER (WHERE utm_source = 'meta') AS meta_inq,
  count(*) FILTER (WHERE landing_page LIKE '/consult%') AS consult_inq,
  count(*) FILTER (WHERE utm_source IS NULL AND referrer IS NOT NULL) AS organic_inq
FROM inquiries
WHERE created_at >= '<Task 5 전환일>'
GROUP BY 1 ORDER BY 1;
```

보조 지표: Ads Manager 주간 클릭 수 (Leo 또는 meta-ads-automation 주간 리포트) → 클릭 대비 문의 CVR 산출. 참고 벤치마크: 2026-04 W14에서 클릭 143 → 광고 귀속 문의 3건 = 약 2.1%.

- [ ] **Step 2: 판정 프레임 적용**

| 시나리오 | 신호 | 해석 | 다음 액션 |
|---|---|---|---|
| L1 개선 | meta_inq 2건+/주 | 랜딩이 작동 | 유지 + 채널톡/카피 미세 개선 반복 |
| L2 도착만 증가 | consult 페이지뷰 증가 + meta_inq 0~1건 | 트래픽은 오는데 오퍼/카피가 약함 | 히어로 오퍼 실험 (수출바우처 앵글 전면화, 폼 필드 축소), 채널톡 가동 |
| L3 계측 후에도 0건 | url_tags 확인됐는데 meta_inq 0 | 트래픽 질 문제 (타겟/소재 미스매치) | 랜딩이 아니라 캠페인 타겟팅 재점검으로 이동 |

판정과 다음 액션 결정은 Opus 메인 세션에서 Leo와 진행. organic 3~4건/주 base rate 대비 증분으로만 평가 (총 문의 수로 판단하지 않기, 2026-05-04 X4 판정의 교훈: utm-split CPA 우선).

- [ ] **Step 3: 결과를 vault 프로젝트 문서 타임라인에 기록**

`~/Obsidian/work/프로젝트/260706-프로젝트-메타광고-랜딩퍼널-개선.md`에 주차별 실측 + 판정 + 결정 추가.

---

## 실행 로그 (2026-07-06 워크플로우 1차 실행)

- 완료: Task 0.1 (utm 픽스 커밋 `24edcc3`), Task 1 (`1d3d6d4`, Logo는 실제 인터페이스에 맞춰 `variant="header"` 보정), Task 4 (`67e793a`, .env.example 플레이스홀더 확인 후 포함), Task 2 (`3b9eb45`, Notion 라이브 소재 5종 대조, 히어로 = statement 소재 훅 "일본 진출은 코리너스" 매치, 게이트 4종 통과), Task 3 렌더 검수 (데스크톱 1440/모바일 390 전 체크 PASS, 폼 제출은 계획대로 미실행)
- 대기 (오토모드 세이프티 게이트, Leo 컨펌 필요): `git push origin main` (Vercel 배포), Task 0.2 Meta url_tags POST (라이브 광고 계정 수정이라 서브에이전트/메인 모두 차단됨 — Leo 컨펌 후 실행 또는 Leo가 Ads Manager UI에서 직접)
- Phase 4 판정 프레임은 아래 v2로 대체: utm 직접귀속 + organic 증분(블랙아웃 기저 2026-05-26~06-21 대비) + GSC 브랜드 검색량(서비스계정 재사용 가능: work-scripts/scripts/credentials.json, sc-domain:koreaners.co) 3지표 종합. 시나리오 6종은 vault 프로젝트 문서와 워크플로우 판정 결과 참조. 후속 제안: 문의 폼 유입 경로 자가응답 필드 신설
- 검수 시 발견 (비차단): dev에서 capig.datah04.com 이벤트 422 응답 — Meta CAPI 게이트웨이로 보이며 localhost origin 때문일 가능성. 배포 후 prod에서 픽셀 정상 발화 1회 확인할 것

## Self-Review 결과

- 스펙 커버리지: 피드백 4요소 (전용 랜딩 = Task 1~3 / 레퍼런스 성과 섹션 = Task 1 STATS+사례 / 무료 상담 CTA = Task 1 히어로+sticky / 실시간 상담 = Task 4) 모두 태스크 존재. 추가로 실측에서 발견한 계측 공백 = Phase 0
- 타입 일치: `FooterCTA` named export + `headingLevel` optional prop (footer-cta.tsx:25 확인), `window.fbq`는 types/global.d.ts 기존 선언 재사용, `ConsultContent` named export를 page.tsx가 동일 이름으로 import
- 플레이스홀더: 카피 초안은 실문구로 제공, Task 2가 확정 절차. 채널톡 스니펫은 공식 문서 재확인 지시 포함 (버전 드리프트 대비)
