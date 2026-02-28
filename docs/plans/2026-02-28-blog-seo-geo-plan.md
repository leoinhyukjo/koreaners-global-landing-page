# Blog SEO/GEO 기술 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 블로그에 FAQ Schema, Author Schema를 추가하고, FAQ 에디터/렌더러를 구현하여 GEO 최적화 기반을 완성한다.

**Architecture:** DB에 `faqs` JSONB 컬럼 추가 → 관리자 에디터에 FAQ 입력 UI → 프론트에 FAQ 섹션 렌더링 + FAQPage JSON-LD 자동 생성. 기존 summary 필드는 Quick Answer로 활용 (이미 스타일링 되어 있으므로 코드 변경 불필요).

**Tech Stack:** Next.js (App Router), Supabase (PostgreSQL), Zod, TypeScript, Tailwind 4

---

## Task 1: DB 마이그레이션 — faqs 컬럼 추가

**Files:**
- Create: `supabase/migrations/add-blog-faqs.sql`

**Step 1: 마이그레이션 SQL 작성**

```sql
-- blog_posts 테이블에 FAQ 컬럼 추가
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS faqs_jp JSONB DEFAULT '[]'::jsonb;

-- faqs 형식: [{"question": "...", "answer": "..."}, ...]

COMMENT ON COLUMN blog_posts.faqs IS 'FAQ 목록 (JSON 배열). 형식: [{"question": "질문", "answer": "답변"}]';
COMMENT ON COLUMN blog_posts.faqs_jp IS 'FAQ 목록 일본어 버전';
```

**Step 2: Supabase에서 마이그레이션 실행**

Supabase Dashboard > SQL Editor에서 위 SQL 실행.

**Step 3: 확인**

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'blog_posts' AND column_name IN ('faqs', 'faqs_jp');
```

Expected: 두 컬럼 모두 `jsonb` 타입으로 표시

---

## Task 2: TypeScript 타입 업데이트

**Files:**
- Modify: `lib/supabase.ts` (BlogPost 타입)

**Step 1: BlogPost 타입에 faqs 필드 추가**

`lib/supabase.ts`의 BlogPost 타입에 추가:

```typescript
export type BlogFAQ = {
  question: string
  answer: string
}

export type BlogPost = {
  // ... 기존 필드 ...
  // FAQ
  faqs?: BlogFAQ[] | null
  faqs_jp?: BlogFAQ[] | null
}
```

**Step 2: 빌드 확인**

Run: `cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page && npx tsc --noEmit`
Expected: 에러 없음

---

## Task 3: Zod 검증 스키마 업데이트

**Files:**
- Modify: `lib/validation/blog-schema.ts`

**Step 1: FAQ 검증 스키마 추가**

```typescript
const faqItemSchema = z.object({
  question: z.string()
    .min(1, 'FAQ 질문을 입력해주세요')
    .max(200, 'FAQ 질문은 200자를 초과할 수 없습니다')
    .refine((val) => !XSS_PATTERN.test(val), 'FAQ 질문에 허용되지 않는 패턴이 감지되었습니다.'),
  answer: z.string()
    .min(1, 'FAQ 답변을 입력해주세요')
    .max(500, 'FAQ 답변은 500자를 초과할 수 없습니다')
    .refine((val) => !XSS_PATTERN.test(val), 'FAQ 답변에 허용되지 않는 패턴이 감지되었습니다.'),
})

// blogPostSchema에 추가:
faqs: z.array(faqItemSchema).max(10, 'FAQ는 최대 10개까지 가능합니다').optional(),
```

**Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

---

## Task 4: 다국어 헬퍼 업데이트

**Files:**
- Modify: `lib/localized-content.ts`

**Step 1: getBlogFaqs 함수 추가**

```typescript
import type { BlogFAQ } from '@/lib/supabase'

export function getBlogFaqs(p: BlogPost, locale: Locale): BlogFAQ[] {
  if (locale === 'ja' && p.faqs_jp && Array.isArray(p.faqs_jp) && p.faqs_jp.length > 0) {
    return p.faqs_jp
  }
  return p.faqs && Array.isArray(p.faqs) ? p.faqs : []
}
```

---

## Task 5: 관리자 에디터에 FAQ 입력 UI 추가

**Files:**
- Modify: `components/admin/blog-dialog.tsx`

**Step 1: FAQ state 추가**

blog-dialog.tsx 상단 state에 추가:

```typescript
const [faqs, setFaqs] = useState<Array<{question: string, answer: string}>>([])
```

blogPost 로드 시 (useEffect 내부) 추가:

```typescript
setFaqs(blogPost.faqs && Array.isArray(blogPost.faqs) ? blogPost.faqs : [])
```

리셋 시:

```typescript
setFaqs([])
```

**Step 2: FAQ 에디터 UI 추가 (본문 에디터 위, SEO 설정 아래)**

```tsx
{/* FAQ 섹션 */}
<div className="space-y-4 border-t pt-6">
  <div className="flex items-center justify-between">
    <h3 className="text-lg font-semibold">FAQ (자주 묻는 질문)</h3>
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setFaqs([...faqs, { question: '', answer: '' }])}
      disabled={faqs.length >= 10}
    >
      + FAQ 추가
    </Button>
  </div>
  <p className="text-xs text-muted-foreground">
    FAQ를 추가하면 Google AI Overview, ChatGPT 등에서 인용될 확률이 높아집니다. (최대 10개)
  </p>
  {faqs.map((faq, index) => (
    <div key={index} className="space-y-2 border rounded-lg p-4 relative">
      <button
        type="button"
        onClick={() => setFaqs(faqs.filter((_, i) => i !== index))}
        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
        aria-label="FAQ 삭제"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="space-y-1">
        <Label>질문 {index + 1}</Label>
        <Input
          value={faq.question}
          onChange={(e) => {
            const updated = [...faqs]
            updated[index] = { ...updated[index], question: e.target.value }
            setFaqs(updated)
          }}
          placeholder="예: 일본 인플루언서 마케팅 비용은 얼마인가요?"
        />
      </div>
      <div className="space-y-1">
        <Label>답변</Label>
        <Textarea
          value={faq.answer}
          onChange={(e) => {
            const updated = [...faqs]
            updated[index] = { ...updated[index], answer: e.target.value }
            setFaqs(updated)
          }}
          placeholder="간결하고 명확한 답변을 작성하세요 (AI가 인용하기 좋은 형식)"
          rows={3}
        />
      </div>
    </div>
  ))}
</div>
```

**Step 3: handleSubmit의 finalPayload에 faqs 추가**

```typescript
const finalPayload = {
  // ... 기존 필드 ...
  faqs: faqs.filter(f => f.question.trim() && f.answer.trim()),
}
```

**Step 4: 빌드 및 동작 확인**

Run: `npm run build`
Expected: 빌드 성공

---

## Task 6: 블로그 상세 페이지에 FAQ 섹션 렌더링

**Files:**
- Create: `components/blog/blog-faq-section.tsx`
- Modify: `components/blog/blog-post-view.tsx`

**Step 1: FAQ 섹션 컴포넌트 생성**

`components/blog/blog-faq-section.tsx`:

```tsx
import type { BlogFAQ } from '@/lib/supabase'

interface BlogFAQSectionProps {
  faqs: BlogFAQ[]
}

export function BlogFAQSection({ faqs }: BlogFAQSectionProps) {
  if (!faqs || faqs.length === 0) return null

  return (
    <section className="mt-10 sm:mt-12 border border-zinc-700/50 bg-zinc-800 px-6 md:px-12 lg:px-24 py-6 md:py-8 lg:py-10 rounded-none">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">
        자주 묻는 질문 (FAQ)
      </h2>
      <dl className="space-y-6">
        {faqs.map((faq, index) => (
          <div key={index} className="border-b border-zinc-700/50 pb-6 last:border-b-0 last:pb-0">
            <dt className="text-base lg:text-lg font-semibold text-zinc-100 mb-2">
              Q. {faq.question}
            </dt>
            <dd className="text-base lg:text-lg text-zinc-300 leading-relaxed">
              {faq.answer}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
```

**Step 2: blog-post-view.tsx에 FAQ 섹션 추가**

import 추가:

```typescript
import { BlogFAQSection } from './blog-faq-section'
import { getBlogFaqs } from '@/lib/localized-content'
```

MarketingCTA 바로 위에 추가:

```tsx
<BlogFAQSection faqs={getBlogFaqs(blogPost, locale)} />
<MarketingCTA />
```

**Step 3: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

---

## Task 7: JSON-LD Schema 강화 (FAQPage + Author)

**Files:**
- Modify: `app/blog/[slug]/page.tsx`

**Step 1: FAQPage Schema 추가**

기존 jsonLd 객체 아래에 FAQ Schema 추가:

```typescript
// FAQ Schema (faqs가 있을 때만)
const faqJsonLd = blogPost.faqs && Array.isArray(blogPost.faqs) && blogPost.faqs.length > 0
  ? {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: blogPost.faqs
        .filter((f: any) => f.question?.trim() && f.answer?.trim())
        .map((faq: any) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
    }
  : null
```

**Step 2: Author Schema를 Person으로 강화**

기존 jsonLd의 author 부분 수정:

```typescript
author: [{
  '@type': 'Organization',
  name: 'KOREANERS',
  url: siteUrl,
}, {
  '@type': 'Organization',
  name: '코리너스',
  url: siteUrl,
}],
```

**Step 3: FAQ JSON-LD script 태그 추가**

return문에서 기존 script 태그 아래에:

```tsx
{faqJsonLd && (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(faqJsonLd) }}
  />
)}
```

**Step 4: 빌드 및 Schema 검증**

Run: `npm run build`
Expected: 빌드 성공

발행 후 https://search.google.com/test/rich-results 에서 FAQ 리치 결과 확인 가능.

---

## Task 8: 콘텐츠 생산 프롬프트 템플릿 작성

**Files:**
- Create: `docs/blog-content-prompt-template.md`

**Step 1: AI 초안 생성용 프롬프트 템플릿 작성**

코리너스 블로그 글을 AI로 생성할 때 사용할 표준 프롬프트 템플릿. GEO 최적화 구조(Quick Answer, 의문문 H2, 비교표, FAQ)를 자동으로 적용.

이 파일은 실제 콘텐츠 생산 시 프롬프트로 활용.

---

## 실행 순서 요약

```
Task 1 (DB) → Task 2 (Types) → Task 3 (Zod) → Task 4 (i18n)
    ↓
Task 5 (Admin UI) → Task 6 (Frontend FAQ) → Task 7 (JSON-LD)
    ↓
Task 8 (Prompt Template)
```

**예상 소요:** Task 1-7 코드 작업 약 1-2시간, Task 8 프롬프트 작성 약 30분
