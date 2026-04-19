# Blog SSR 전환 플랜 (Approach A — 최소 침습)

- 작성일: 2026-04-19
- 오너: Leo
- 관련: [GEO 감사](../../../../Obsidian_Vault/personal/리서치/260419-리서치-koreaners-geo-analysis.md) — 감사 점수 37/100, 블로그 27페이지 AI 크롤러 invisible
- 선행 조건: 홈페이지 전면 개편(4/18~)과 **병행**. 본 작업은 backend 렌더링 한정, UI 구조 불변 → 개편 목업과 충돌 없음.
- 로케일 전략: **KR default SSR, JA는 기존 client-side 스위칭 유지**. URL 구조 (`/blog/...`) 불변.

---

## 목표

블로그 상세 페이지(`/blog/[slug]`) 27개 + 인덱스(`/blog`) 의 **본문을 서버에서 렌더**하여, GPTBot/ClaudeBot/PerplexityBot 같이 JavaScript를 실행하지 않는 AI 크롤러도 본문을 수집하게 만든다.

### 성공 기준 (정량)
1. `curl -sL https://www.koreaners.co/blog/japan-influencer-marketing-cost-guide-2026 | grep -v "<script" | wc -c` → **5,000 bytes 이상** (현재 ~241자)
2. HTML 파싱 시 `<h2>`/`<h3>` 태그가 DOM에 존재 (현재 0개)
3. `x-nextjs-prerender: 1` 헤더 유지
4. 브라우저에서 로케일 KR↔JA 스위칭 정상 작동, hydration warning 0개
5. Lighthouse SEO score 유지/상승

### Out of scope
- `/service`, `/portfolio`, `/careers`, `/contact` SSR 전환 (동일 패턴, Phase 5+ 후속 작업으로 분리)
- 홈 `main-content.tsx` SSR 재검토 (현재 SSR 정상 작동 중)
- BlockNote JSON 본문 SSR (현 블로그 23+개 중 대부분 Notion sync HTML — BlockNote 경로는 legacy admin 전용)
- 로케일 URL 라우팅(`/ko/`, `/ja/`) 도입 (Approach B)

---

## 작업 범위 (4개 파일)

| 파일 | 변경 방향 |
|---|---|
| `components/blog/blog-post-view.tsx` | `"use client"` → **server component** 로 전환. `SafeHydration` 제거. `useLocale`·`useEffect` 의존부를 client sub-component 로 격리. |
| `components/blog/blog-content.tsx` | HTML string 경로는 server 유지. BlockNote JSON 경로(`dynamic + ssr:false`)는 그대로 두되, 실제 사용 여부 확인 후 필요 시 제거. |
| `components/blog-content.tsx` (블로그 인덱스) | 클라이언트 fetch 제거. `initialPosts` prop 으로 받고 필터링/페이지네이션만 client. |
| `app/blog/page.tsx` | Supabase `createStaticClient` 로 서버 fetch → `<BlogPageContent initialPosts={...} />` 에 주입. `revalidate` 추가. |

신규 파일 (1개):
- `components/blog/blog-locale-controls.tsx` — `"use client"` 로 로케일 스위치 버튼 + `scrollTo(0,0)` 이펙트만 담당

---

## 구현 단계 (의존 순서)

### Step 1 — 로케일 서버 초기값 주입 메커니즘 결정

**문제**: 현재 `useLocale()` 은 client context. 서버에서 기본 로케일(KR) 을 알아야 `getBlogTitle(blogPost, 'ko')` 를 바로 렌더 가능.

**방법**: 서버 컴포넌트에서는 **하드코딩 `'ko'`** 를 default 로 사용. `lib/localized-content.ts` 의 `getBlogTitle`/`getBlogContent` 는 이미 locale param 을 받는 순수 함수 → 리팩토링 불필요.

**하이드레이션 대응**:
- 서버에선 항상 KR 로 렌더
- 클라이언트 마운트 후 `useLocale()` 값이 `'ja'` 면 **title/content DOM 을 client-only sub-component 에서 재렌더**
- 이 sub-component 는 `suppressHydrationWarning` 적용

**대안** (리스크 검토용): Next.js `cookies()` API 로 서버에서 로케일 쿠키 읽기. 현재 `locale-context` 가 쿠키를 쓰는지 코드 확인 후 결정. **→ Step 1.5 에서 검증**

### Step 1.5 — `locale-context` 확인 (5분)

```bash
grep -n "document.cookie\|localStorage\|sessionStorage\|cookies" contexts/locale-context.tsx
```

- localStorage 만 쓴다면: Step 1 의 "하드코딩 KR + client 재렌더" 로 진행
- 쿠키도 쓴다면: `cookies()` 서버 API 로 읽어 prop 으로 주입 가능 (더 깔끔)

### Step 2 — `BlogPostView` 서버/클라이언트 분리

**현재 구조**:
```
BlogPostView ("use client")
├── SafeHydration fallback={<BlogDetailSkeleton />}
│   ├── article
│   │   ├── Back button (Link)
│   │   ├── Thumbnail image
│   │   ├── Badge + date
│   │   ├── <h1>title</h1>
│   │   ├── <BlogContent> (HTML dangerouslySetInnerHTML)
│   │   └── <MarketingCTA />
```

**목표 구조**:
```
BlogPostView (server component)  ← "use client" 제거
├── article (직접 렌더, SafeHydration 없음)
│   ├── <BackAndLocaleControls /> (client, 스크롤 리셋 + 로케일 전환 버튼만)
│   ├── Thumbnail image (server)
│   ├── Badge + formatted date (server, KR 포맷 하드코딩)
│   ├── <h1>{getBlogTitle(blogPost, 'ko')}</h1> (server)
│   ├── <BlogLocalizedBody blogPost={blogPost} /> (server shell + client locale override)
│   └── <MarketingCTA /> (이미 존재, 내부 확인)
```

`<BlogLocalizedBody>` 설계:
- 서버: `getBlogContent(blogPost, 'ko')` 로 HTML string 을 `dangerouslySetInnerHTML` 서버 렌더
- 클라이언트: mount 후 `useLocale()` 값이 `'ja'` 이면 JA 버전으로 교체
- 초기 KR 렌더를 그대로 두면 hydration mismatch 없음 (JA 는 client effect 로 overwrite)

### Step 3 — `BlogContent` 컴포넌트 정리

HTML string 경로가 주경로. BlockNote JSON 경로는:
```bash
grep -rn "content.*\[\{" components/admin/ 2>/dev/null
# 또는 Supabase 에서 JSON array content 가 실제 있는지 샘플 쿼리
```

- 현재 published 포스트 중 BlockNote JSON 사용하는 것 없으면: `BlockNote` import 제거, BlogContent 를 server component 로 전환
- 있으면: 해당 경로는 `dynamic ssr:false` 유지 (소수 영향)

### Step 4 — 블로그 인덱스 `/blog` SSR 전환

**`app/blog/page.tsx`**:
```tsx
export const revalidate = 3600;

export default async function BlogPage() {
  const supabase = createStaticClient();
  const { data: initialPosts } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  return (
    <>
      <script type="application/ld+json" ... />
      <BlogPageContent initialPosts={initialPosts ?? []} />
    </>
  );
}
```

**`components/blog-content.tsx`**:
- `initialPosts` prop 받기
- `useState(initialPosts)` 초기값 주입, `useEffect fetchBlogPosts` 를 조건부(필터 변경 시만)로
- 첫 렌더에 loading skeleton 대신 initialPosts 바로 표시
- SafeHydration 사용 시 내부 children 을 initialPosts 렌더 가능한 구조로 분리

### Step 5 — JSON-LD 스키마 강화 (GEO 감사 Top 5 ④ 일부)

이미 server 에서 렌더되므로 Step 1-4 와 독립. 작은 win:
- `app/blog/[slug]/page.tsx` 의 `jsonLd` 에 `speakable`, `wordCount` 필드 추가
- `author` 를 Organization `@id` reference 에서 **Person** 으로 전환 (Leo 프로필 정해지면). 이번 플랜에서는 schema 필드만 준비, 실제 값은 blocker 표시.
- 영향: GEO 점수 +3 (작지만 무료)

### Step 6 — 빌드 & 로컬 검증

```bash
npm run build
npm run start
# 새 터미널
curl -sL http://localhost:3000/blog/japan-influencer-marketing-cost-guide-2026 \
  | python3 -c "import sys,re; h=sys.stdin.read(); t=re.sub(r'<script.*?</script>','',h,flags=re.DOTALL); t=re.sub(r'<[^>]+>',' ',t); t=re.sub(r'\s+',' ',t); print(f'len: {len(t)}'); print(t[:600])"
```

통과 기준: rendered body len **5,000 자 이상**, 첫 600자에 본문 시작 보임.

### Step 7 — 브라우저 수동 QA

- Chrome DevTools Network 탭 → "Disable JavaScript" 켜고 블로그 상세 접속 → 본문 보여야 함
- JavaScript 다시 켜고 KR↔JA 전환 버튼 클릭 → 콘텐츠 바뀌는지 확인
- Console 에 hydration warning 0
- Lighthouse SEO 재측정 (기준: 기존 점수 유지)

### Step 8 — Vercel preview 배포 검증

- `git checkout -b feat/blog-ssr-conversion`
- 커밋 + push → Vercel preview URL 수신
- Preview URL 에 동일 curl 검증
- Prerendered 확인: 응답 헤더 `x-nextjs-prerender: 1`
- OK 하면 main merge

### Step 9 — 프로덕션 검증 (배포 후)

```bash
for slug in japan-influencer-marketing-cost-guide-2026 2026-k-beauty-japan-market-trends-personalization-sustainability japan-instagram-marketing-strategy-vs-korea-2026; do
  echo "=== $slug ==="
  curl -sL --compressed "https://www.koreaners.co/blog/$slug" \
    | python3 -c "import sys,re; h=sys.stdin.read(); t=re.sub(r'<script.*?</script>','',h,flags=re.DOTALL); t=re.sub(r'<[^>]+>',' ',t); t=re.sub(r'\s+',' ',t).strip(); print(f'len: {len(t)}')"
done
```

- 모든 블로그 5,000자 이상 확인
- Google Search Console 재크롤 요청 (3-5개 핵심 포스트)
- 1주일 후 GSC Coverage / AI Overviews 노출 변화 관찰

---

## 리스크 & 대응

| 리스크 | 발생 조건 | 대응 |
|---|---|---|
| Hydration mismatch | 서버 KR 렌더 → 클라이언트 로케일이 JA 이고 같은 DOM 이 다른 텍스트로 override 될 때 React 경고 | 로케일 override 는 **별도 client component** 로 격리, `suppressHydrationWarning` 사용. 또는 mount 후 교체라 initial paint 가 KR 로 일관되게 나오도록 보장 |
| SafeHydration 다른 페이지에서 유사 이슈 잠재 | careers/contact/portfolio/service 에도 동일 패턴 | 본 플랜 out of scope. 블로그 변경 성공 후 별도 플랜으로 (같은 패턴 재사용) |
| 로케일 쿠키 저장 방식이 바뀌면 서버 읽기 불가 | `locale-context` 리팩토링과 충돌 | Step 1.5 에서 현재 저장 방식 확인. localStorage-only 면 서버 초기값 = `'ko'` 하드코딩 유지 |
| BlockNote JSON 본문을 쓰는 레거시 포스트 존재 | admin editor 로 작성된 과거 포스트 | Step 3 에서 DB 확인. 있으면 해당 경로만 `ssr:false` 유지 (JSON array 렌더는 SafeHydration 없이도 server 불가능) |
| 개편 작업과 파일 충돌 | 4/22~23 손효정 매니저 목업 이후 디자인 변경 시 `blog-post-view.tsx` 수정 충돌 | 본 변경은 **구조만**, UI/스타일 유지. merge conflict 최소화. 개편 브랜치와 별도 브랜치 운영 |

---

## 예상 소요 시간

| Step | 시간 |
|---|---|
| 1-1.5 로케일 저장 방식 확인 | 10분 |
| 2 BlogPostView 분리 | 60-90분 |
| 3 BlogContent 정리 | 20분 |
| 4 블로그 인덱스 SSR | 40분 |
| 5 JSON-LD 강화 | 15분 |
| 6 빌드 & 로컬 검증 | 20분 |
| 7 브라우저 QA | 15분 |
| 8 Preview 배포 검증 | 10분 |
| 9 프로덕션 검증 | 10분 |
| **합계** | **약 3-4시간** (단일 세션 완료 가능) |

---

## 체크포인트 (user 확인 필요 지점)

- **CP1 — Step 1.5 완료 직후**: 로케일 저장 방식 확인 결과 공유 → Step 2 방향 최종 결정
- **CP2 — Step 4 완료**: 로컬 `npm run build` 통과, `npm run start` 에서 curl 검증 통과 후 Vercel 배포 직전
- **CP3 — Step 8 Preview 배포 직후**: Preview URL 검증 결과 공유 → main merge 승인

## 다음 작업 (본 플랜 완료 후)

GEO 감사 Top 5 나머지:
- ② Author Person schema + sameAs 3-5개 추가
- ③ 블로그 첫 문단 134-167단어 정의 블록 (콘텐츠 템플릿, blog v3 prompt 에 반영)
- ④ 비교 테이블 HTML + per-post FAQPage
- ⑤ robots.txt 명시적 AI 크롤러 정책

그리고 같은 SafeHydration 패턴 제거:
- `/service`, `/portfolio`, `/careers`, `/contact`, `/main`(검증 필요) 에 동일 작업
