# Blog Auto Content Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** launchd 주 1회 실행 → Claude API로 블로그 3편 자동 생성 → Notion DB에 "리뷰" 상태로 저장 + sync 자동화

**Architecture:** Python 스크립트가 keywords.json에서 미사용 키워드 3개를 선택, Claude API로 각각 블로그 글을 생성하고, Notion API로 페이지를 생성한다. 기존 `/api/sync/blog` 엔드포인트를 launchd로 주기적 호출하여 "발행" 상태 글을 웹사이트에 동기화한다.

**Tech Stack:** Python 3, anthropic SDK, notion-client SDK, python-dotenv, launchd

---

## Context

**프로젝트 경로:** `/Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page/`

**기존 파일 참조:**
- `docs/blog-content-prompt-template.md` — 프롬프트 템플릿 (6 Pillars, 30개 키워드)
- `scripts/requirements.txt` — 기존 Python 의존성
- `lib/notion/client.ts` — Notion SDK 설정 (NOTION_TOKEN 사용)
- `app/api/sync/blog/route.ts` — Notion→Supabase 동기화 API
- `.env.local` — NOTION_TOKEN, NOTION_BLOG_DB_ID, SYNC_SECRET 등

**Notion DB 속성 (📝 블로그 포스트):**
- 이름 (title), 상태 (select: 초안/리뷰/발행/비공개), 슬러그 (rich_text)
- 카테고리 (multi_select), 요약 (rich_text), 썸네일 (url)
- Meta Title (rich_text), Meta Description (rich_text), 발행일 (date)

**환경변수 (필요):**
- `NOTION_TOKEN` — 기존 (`.env.local`)
- `NOTION_BLOG_DB_ID` — 기존 (`2f501ca3e4808082aae4f046911ccf9b`)
- `ANTHROPIC_API_KEY` — 신규 추가 필요

---

### Task 1: Keywords JSON 데이터 파일 생성

**Files:**
- Create: `scripts/blog-generator/keywords.json`

**Step 1: keywords.json 파일 작성**

`docs/blog-content-prompt-template.md`의 30개 키워드를 JSON으로 변환한다. 각 키워드에 pillar, keyword, used 필드를 둔다.

```json
{
  "keywords": [
    {
      "pillar": "일본 인플루언서 마케팅",
      "keyword": "일본 인플루언서 마케팅 비용 가이드 (2026)",
      "used": false
    },
    {
      "pillar": "일본 인플루언서 마케팅",
      "keyword": "일본 인스타그램 vs 유튜브 vs 틱톡 인플루언서 비교",
      "used": false
    },
    {
      "pillar": "일본 인플루언서 마케팅",
      "keyword": "일본 마이크로 인플루언서 섭외 5단계 프로세스",
      "used": false
    },
    {
      "pillar": "일본 인플루언서 마케팅",
      "keyword": "한국 브랜드 일본 인플루언서 성공 사례 3선",
      "used": false
    },
    {
      "pillar": "일본 인플루언서 마케팅",
      "keyword": "일본 인플루언서 마케팅 ROI 측정법",
      "used": false
    },
    {
      "pillar": "일본 인플루언서 마케팅",
      "keyword": "일본 KOL이란? 인플루언서와의 차이",
      "used": false
    },
    {
      "pillar": "일본 인플루언서 마케팅",
      "keyword": "일본 인플루언서 계약 시 주의사항",
      "used": false
    },
    {
      "pillar": "일본 체험단/시딩",
      "keyword": "일본 체험단 마케팅이란? 한국과의 차이점",
      "used": false
    },
    {
      "pillar": "일본 체험단/시딩",
      "keyword": "일본 리뷰 체험단 운영 A to Z",
      "used": false
    },
    {
      "pillar": "일본 체험단/시딩",
      "keyword": "큐텐 vs 라쿠텐 체험단 전략 비교",
      "used": false
    },
    {
      "pillar": "일본 체험단/시딩",
      "keyword": "일본 대량 시딩 캠페인 설계 방법",
      "used": false
    },
    {
      "pillar": "일본 체험단/시딩",
      "keyword": "일본 체험단 비용 및 기대 효과",
      "used": false
    },
    {
      "pillar": "일본 체험단/시딩",
      "keyword": "일본 아마존 리뷰 마케팅 가이드",
      "used": false
    },
    {
      "pillar": "K-뷰티/K-컬처 일본 트렌드",
      "keyword": "2026 K-뷰티 일본 시장 트렌드",
      "used": false
    },
    {
      "pillar": "K-뷰티/K-컬처 일본 트렌드",
      "keyword": "일본 드럭스토어 K-뷰티 입점 전략",
      "used": false
    },
    {
      "pillar": "K-뷰티/K-컬처 일본 트렌드",
      "keyword": "일본 MZ세대 K-뷰티 소비 패턴",
      "used": false
    },
    {
      "pillar": "K-뷰티/K-컬처 일본 트렌드",
      "keyword": "K-뷰티 일본 인플루언서 마케팅 전략",
      "used": false
    },
    {
      "pillar": "K-뷰티/K-컬처 일본 트렌드",
      "keyword": "K-컬처가 일본 마케팅에 미치는 영향",
      "used": false
    },
    {
      "pillar": "일본 SNS 플랫폼 가이드",
      "keyword": "일본 인스타그램 마케팅 전략 (한국과의 차이)",
      "used": false
    },
    {
      "pillar": "일본 SNS 플랫폼 가이드",
      "keyword": "일본 TikTok 마케팅 한국 브랜드 사례",
      "used": false
    },
    {
      "pillar": "일본 SNS 플랫폼 가이드",
      "keyword": "일본 X(트위터) 마케팅 특성과 활용법",
      "used": false
    },
    {
      "pillar": "일본 SNS 플랫폼 가이드",
      "keyword": "일본 LINE 마케팅 광고 방법",
      "used": false
    },
    {
      "pillar": "일본 SNS 플랫폼 가이드",
      "keyword": "일본 SNS 플랫폼 전체 비교 가이드 (2026)",
      "used": false
    },
    {
      "pillar": "일본 관광객/인바운드 마케팅",
      "keyword": "일본 관광객 타겟 인플루언서 마케팅이란",
      "used": false
    },
    {
      "pillar": "일본 관광객/인바운드 마케팅",
      "keyword": "방일 관광객 SNS 콘텐츠 전략",
      "used": false
    },
    {
      "pillar": "일본 관광객/인바운드 마케팅",
      "keyword": "인바운드 마케팅으로 일본인 관광객 유치하기",
      "used": false
    },
    {
      "pillar": "일본 관광객/인바운드 마케팅",
      "keyword": "일본인 여행객이 한국에서 소비하는 패턴 분석",
      "used": false
    },
    {
      "pillar": "한-일 크로스보더 실무",
      "keyword": "한일 크로스보더 마케팅이란? 완벽 가이드",
      "used": false
    },
    {
      "pillar": "한-일 크로스보더 실무",
      "keyword": "일본 마케팅 대행사(에이전시) 선택 기준 5가지",
      "used": false
    },
    {
      "pillar": "한-일 크로스보더 실무",
      "keyword": "일본 시장 진출 시 마케팅 비용 가이드",
      "used": false
    }
  ]
}
```

**Step 2: 파일 확인**

Run: `python3 -c "import json; d=json.load(open('scripts/blog-generator/keywords.json')); print(f'{len(d[\"keywords\"])} keywords loaded'); print(f'Unused: {sum(1 for k in d[\"keywords\"] if not k[\"used\"])}')" `
Expected: `30 keywords loaded` / `Unused: 30`

**Step 3: Commit**

```bash
git add scripts/blog-generator/keywords.json
git commit -m "feat: add keywords.json for blog auto-generation (30 keywords, 6 pillars)"
```

---

### Task 2: Python 의존성 및 환경 설정

**Files:**
- Create: `scripts/blog-generator/requirements.txt`
- Modify: `.env.local` — ANTHROPIC_API_KEY 추가

**Step 1: requirements.txt 작성**

```txt
anthropic>=0.40.0
notion-client>=2.2.0
python-dotenv>=1.0.0
```

**Step 2: 의존성 설치**

Run: `cd scripts/blog-generator && pip3 install -r requirements.txt`
Expected: Successfully installed anthropic, notion-client, python-dotenv

**Step 3: .env.local에 ANTHROPIC_API_KEY 추가**

```bash
echo 'ANTHROPIC_API_KEY=your-api-key-here' >> .env.local
```

> **사용자 작업**: `your-api-key-here`를 실제 Anthropic API 키로 교체해야 함

**Step 4: 환경변수 로드 테스트**

Run: `cd scripts/blog-generator && python3 -c "from dotenv import load_dotenv; import os; load_dotenv('../../.env.local'); print('NOTION_TOKEN:', 'OK' if os.getenv('NOTION_TOKEN') else 'MISSING'); print('NOTION_BLOG_DB_ID:', 'OK' if os.getenv('NOTION_BLOG_DB_ID') else 'MISSING'); print('ANTHROPIC_API_KEY:', 'OK' if os.getenv('ANTHROPIC_API_KEY') else 'MISSING')"`
Expected: 3줄 모두 OK

**Step 5: Commit**

```bash
git add scripts/blog-generator/requirements.txt
git commit -m "feat: add requirements.txt for blog generator (anthropic, notion-client)"
```

---

### Task 3: 프롬프트 템플릿 파일 생성

**Files:**
- Create: `scripts/blog-generator/prompt_template.txt`

**Step 1: Claude API용 시스템 프롬프트 작성**

`docs/blog-content-prompt-template.md`의 프롬프트 섹션을 기반으로, Claude API가 **JSON으로 구조화된 출력**을 반환하도록 수정한다.

```txt
당신은 한-일 크로스보더 마케팅 전문가입니다. 코리너스(KOREANERS) 블로그에 게시할 글을 작성해주세요.

## 기본 정보
- 키워드: {keyword}
- 필러 토픽: {pillar}
- 타겟 독자: 한-일 크로스보더 비즈니스 관련 업계 관계자 (마케터, 경영진, 에이전시)
- 톤: 전문적이면서 읽기 쉬운 B2B 톤. 딱딱하지 않되 가볍지도 않게.

## 필수 구조 (이 순서를 반드시 따를 것)

### 1. Quick Answer (40-80자)
- 글의 첫 문장에서 키워드에 대한 직접 답변을 제공
- AI가 가장 먼저 인용하는 부분

### 2. 핵심 요약 박스
- 3-5개 bullet point
- 각 bullet에 구체적 수치나 핵심 팩트 포함

### 3. 본문 (H2 헤딩 3-5개)
- 모든 H2는 의문문으로 작성
- 각 섹션 300-500자
- 최소 3개의 구체적 수치/통계 포함
- 비교표 최소 1개 포함 (HTML table)

### 4. FAQ (3-5개)
- 실제 고객이 물어볼 법한 질문
- 답변은 2-3문장으로 간결하게

## 작성 규칙
- 글 전체 길이: 1,500-3,000자 (한국어 기준)
- 통계/수치에는 반드시 출처 표시 (연도 포함)
- "코리너스"를 본문에 1-2회 자연스럽게 언급
- 마지막에 CTA: "일본 마케팅 전문가와 상담하고 싶다면 코리너스에 문의하세요."

## 출력 형식

반드시 아래 JSON 형식으로만 응답하세요. JSON 외의 텍스트는 포함하지 마세요.

{{
  "title": "제목 (40-60자, 키워드 포함)",
  "slug": "영문-소문자-하이픈-slug",
  "category": "업계 동향 | 최신 트렌드 | 전문가 인사이트 | 마케팅 뉴스 중 택 1",
  "summary": "Quick Answer용 요약 (40-80자)",
  "meta_title": "Meta Title (50-60자)",
  "meta_description": "Meta Description (120-160자)",
  "content_html": "본문 전체를 HTML로 (h2, p, ul, li, table, strong, em 태그 사용)",
  "faqs": [
    {{"question": "질문1", "answer": "답변1"}},
    {{"question": "질문2", "answer": "답변2"}},
    {{"question": "질문3", "answer": "답변3"}}
  ]
}}
```

> 참고: `{{` / `}}` 는 Python `.format()` 이스케이프용. `{keyword}`, `{pillar}`만 치환됨.

**Step 2: 템플릿 변수 치환 테스트**

Run: `python3 -c "t=open('scripts/blog-generator/prompt_template.txt').read(); print(t.format(keyword='테스트 키워드', pillar='테스트 필러')[:200])"`
Expected: `당신은 한-일 크로스보더 마케팅 전문가입니다...` (keyword/pillar 치환 확인)

**Step 3: Commit**

```bash
git add scripts/blog-generator/prompt_template.txt
git commit -m "feat: add Claude API prompt template for blog generation (JSON output)"
```

---

### Task 4: 메인 생성 스크립트 구현

**Files:**
- Create: `scripts/blog-generator/generate_blog.py`

**Step 1: 스크립트 구현**

```python
#!/usr/bin/env python3
"""
Blog Auto Generator

키워드 리스트에서 미사용 키워드 3개를 선택하여
Claude API로 블로그 글을 생성하고 Notion DB에 저장합니다.

Usage:
    python generate_blog.py              # 3편 생성 (기본)
    python generate_blog.py --count 1    # 1편 생성
    python generate_blog.py --dry-run    # API 호출 없이 키워드 선택만 확인
"""

import json
import os
import sys
import argparse
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

# ─── 경로 설정 ────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
KEYWORDS_PATH = SCRIPT_DIR / "keywords.json"
PROMPT_PATH = SCRIPT_DIR / "prompt_template.txt"

# .env.local 로드
load_dotenv(PROJECT_ROOT / ".env.local")

# ─── 환경변수 검증 ────────────────────────────────────────
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
NOTION_TOKEN = os.getenv("NOTION_TOKEN")
NOTION_BLOG_DB_ID = os.getenv("NOTION_BLOG_DB_ID")

def check_env():
    missing = []
    if not ANTHROPIC_API_KEY:
        missing.append("ANTHROPIC_API_KEY")
    if not NOTION_TOKEN:
        missing.append("NOTION_TOKEN")
    if not NOTION_BLOG_DB_ID:
        missing.append("NOTION_BLOG_DB_ID")
    if missing:
        print(f"[ERROR] Missing env vars: {', '.join(missing)}")
        sys.exit(1)


# ─── 키워드 선택 ──────────────────────────────────────────

def load_keywords() -> list[dict]:
    with open(KEYWORDS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["keywords"]


def save_keywords(keywords: list[dict]):
    with open(KEYWORDS_PATH, "w", encoding="utf-8") as f:
        json.dump({"keywords": keywords}, f, ensure_ascii=False, indent=2)


def select_keywords(keywords: list[dict], count: int) -> list[dict]:
    """미사용 키워드에서 pillar 분산하여 count개 선택."""
    unused = [k for k in keywords if not k["used"]]
    if not unused:
        print("[WARN] All keywords used. Resetting all to unused.")
        for k in keywords:
            k["used"] = False
        unused = keywords[:]

    # pillar별로 그룹핑 후 라운드로빈 선택
    pillars: dict[str, list[dict]] = {}
    for k in unused:
        pillars.setdefault(k["pillar"], []).append(k)

    selected = []
    pillar_keys = list(pillars.keys())
    idx = 0
    while len(selected) < count and any(pillars.values()):
        pillar = pillar_keys[idx % len(pillar_keys)]
        if pillars[pillar]:
            selected.append(pillars[pillar].pop(0))
        idx += 1
        # 빈 pillar 제거
        pillar_keys = [p for p in pillar_keys if pillars[p]]
        if not pillar_keys:
            break

    return selected


# ─── Claude API 호출 ──────────────────────────────────────

def generate_article(keyword: str, pillar: str) -> dict | None:
    """Claude API로 블로그 글 1편 생성. JSON dict 반환."""
    import anthropic

    prompt_template = PROMPT_PATH.read_text(encoding="utf-8")
    prompt = prompt_template.format(keyword=keyword, pillar=pillar)

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.content[0].text.strip()

        # JSON 파싱 (```json ... ``` 래핑 제거)
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            text = text.rsplit("```", 1)[0]

        return json.loads(text)

    except json.JSONDecodeError as e:
        print(f"[ERROR] JSON parse failed for '{keyword}': {e}")
        return None
    except Exception as e:
        print(f"[ERROR] Claude API failed for '{keyword}': {e}")
        return None


# ─── Notion 페이지 생성 ───────────────────────────────────

def create_notion_page(article: dict) -> str | None:
    """Notion DB에 블로그 페이지 생성. 페이지 ID 반환."""
    from notion_client import Client

    notion = Client(auth=NOTION_TOKEN)

    # 본문 HTML → Notion paragraph 블록 (HTML을 하나의 paragraph에 담음)
    # Notion API는 HTML을 직접 지원하지 않으므로,
    # sync 파이프라인이 Notion→HTML 변환을 하는 역방향.
    # 여기서는 content_html을 하나의 코드블록 or paragraph로 저장하되,
    # 실제 발행 시 sync가 이 HTML을 그대로 Supabase에 넣으므로
    # Notion 본문은 "리뷰용"이고 실제 웹 표시는 content_html 기반.

    # 전략: Notion 페이지 본문에 rich text paragraph들로 나누어 저장
    # 단, HTML 태그를 Notion 블록으로 변환하는 것은 복잡하므로
    # 본문은 하나의 paragraph 블록 + 별도 sync에서 content_html 직접 사용

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    properties = {
        "이름": {"title": [{"text": {"content": article["title"]}}]},
        "상태": {"select": {"name": "리뷰"}},
        "슬러그": {"rich_text": [{"text": {"content": article["slug"]}}]},
        "카테고리": {"multi_select": [{"name": article["category"]}]},
        "요약": {"rich_text": [{"text": {"content": article["summary"]}}]},
        "Meta Title": {
            "rich_text": [{"text": {"content": article.get("meta_title", "")}}]
        },
        "Meta Description": {
            "rich_text": [
                {"text": {"content": article.get("meta_description", "")}}
            ]
        },
        "발행일": {"date": {"start": today}},
    }

    # 본문을 Notion 블록으로: 단순 텍스트 paragraph로 분할
    # content_html에서 태그를 제거하여 plain text 단락으로 변환
    import re

    content_html = article.get("content_html", "")
    # HTML을 단락으로 분할 (p, h2 태그 기준)
    sections = re.split(r"<(?:p|h[1-6]|li|tr|blockquote)[^>]*>", content_html)
    sections = [re.sub(r"<[^>]+>", "", s).strip() for s in sections]
    sections = [s for s in sections if s]

    children = []
    for section in sections[:100]:  # Notion API 제한: 100 블록
        # 2000자 제한 per rich_text
        text = section[:2000]
        children.append(
            {
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"type": "text", "text": {"content": text}}]
                },
            }
        )

    try:
        response = notion.pages.create(
            parent={"database_id": NOTION_BLOG_DB_ID},
            properties=properties,
            children=children,
        )
        return response["id"]
    except Exception as e:
        print(f"[ERROR] Notion create failed for '{article['title']}': {e}")
        return None


# ─── 메인 실행 ────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Blog Auto Generator")
    parser.add_argument("--count", type=int, default=3, help="생성할 글 수 (기본: 3)")
    parser.add_argument(
        "--dry-run", action="store_true", help="API 호출 없이 키워드 선택만 확인"
    )
    args = parser.parse_args()

    check_env()

    print(f"[{datetime.now().isoformat()}] Blog Auto Generator 시작")
    print(f"  생성 수: {args.count}")

    # 1. 키워드 선택
    keywords = load_keywords()
    selected = select_keywords(keywords, args.count)

    if not selected:
        print("[WARN] No keywords available.")
        return

    print(f"  선택된 키워드:")
    for kw in selected:
        print(f"    - [{kw['pillar']}] {kw['keyword']}")

    if args.dry_run:
        print("[DRY RUN] 종료")
        return

    # 2. 글 생성 + Notion 저장
    success = 0
    for kw in selected:
        print(f"\n--- 생성 중: {kw['keyword']} ---")

        article = generate_article(kw["keyword"], kw["pillar"])
        if not article:
            print(f"  [SKIP] 글 생성 실패")
            continue

        print(f"  제목: {article['title']}")
        print(f"  슬러그: {article['slug']}")

        page_id = create_notion_page(article)
        if not page_id:
            print(f"  [SKIP] Notion 저장 실패")
            continue

        # 키워드 사용 표시
        for k in keywords:
            if k["keyword"] == kw["keyword"]:
                k["used"] = True
                break

        success += 1
        print(f"  [OK] Notion 페이지 생성: {page_id}")

    # 3. keywords.json 업데이트 (사용 표시)
    save_keywords(keywords)

    print(f"\n[완료] 성공: {success}/{len(selected)}")


if __name__ == "__main__":
    main()
```

**Step 2: dry-run 테스트**

Run: `cd scripts/blog-generator && python3 generate_blog.py --dry-run`
Expected:
```
[...] Blog Auto Generator 시작
  생성 수: 3
  선택된 키워드:
    - [일본 인플루언서 마케팅] 일본 인플루언서 마케팅 비용 가이드 (2026)
    - [일본 체험단/시딩] 일본 체험단 마케팅이란? 한국과의 차이점
    - [K-뷰티/K-컬처 일본 트렌드] 2026 K-뷰티 일본 시장 트렌드
[DRY RUN] 종료
```

(pillar 분산되어 3개 다른 pillar에서 1개씩 선택됨을 확인)

**Step 3: 실제 1편 테스트 (ANTHROPIC_API_KEY 설정 후)**

Run: `cd scripts/blog-generator && python3 generate_blog.py --count 1`
Expected: Notion 페이지 1개 생성, 상태 "리뷰"로 표시

**Step 4: Commit**

```bash
git add scripts/blog-generator/generate_blog.py
git commit -m "feat: implement blog auto-generator (Claude API → Notion)"
```

---

### Task 5: Sync 자동 호출 스크립트

**Files:**
- Create: `scripts/blog-generator/trigger_sync.sh`

**Step 1: sync 트리거 스크립트 작성**

기존 `/api/sync/blog` API를 curl로 호출하는 간단한 셸 스크립트.

```bash
#!/bin/bash
# Blog Sync Trigger - Notion → Supabase 동기화
# launchd에서 하루 2회 호출

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# .env.local에서 SYNC_SECRET 읽기
SYNC_SECRET=$(grep '^SYNC_SECRET=' "$PROJECT_ROOT/.env.local" | cut -d'=' -f2-)

if [ -z "$SYNC_SECRET" ]; then
    echo "[ERROR] SYNC_SECRET not found in .env.local"
    exit 1
fi

SITE_URL="${SITE_URL:-https://www.koreaners.co}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Triggering blog sync..."

RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "${SITE_URL}/api/sync/blog" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${SYNC_SECRET}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "[OK] Sync complete: $BODY"
else
    echo "[ERROR] HTTP $HTTP_CODE: $BODY"
    exit 1
fi
```

**Step 2: 실행 권한 부여**

Run: `chmod +x scripts/blog-generator/trigger_sync.sh`

**Step 3: 테스트 (로컬 dev 서버 실행 중일 때)**

Run: `SITE_URL=http://localhost:3000 scripts/blog-generator/trigger_sync.sh`
Expected: `[OK] Sync complete: {"synced":N,"errors":[...]}`

**Step 4: Commit**

```bash
git add scripts/blog-generator/trigger_sync.sh
git commit -m "feat: add sync trigger script for launchd automation"
```

---

### Task 6: launchd plist 생성

**Files:**
- Create: `scripts/blog-generator/com.koreaners.blog-generator.plist`
- Create: `scripts/blog-generator/com.koreaners.blog-sync.plist`

**Step 1: 블로그 생성 plist (주 1회 월요일 10:00)**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.koreaners.blog-generator</string>

    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>/Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page/scripts/blog-generator/generate_blog.py</string>
    </array>

    <key>StartCalendarInterval</key>
    <dict>
        <key>Weekday</key>
        <integer>1</integer>
        <key>Hour</key>
        <integer>10</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>

    <key>StandardOutPath</key>
    <string>/tmp/koreaners-blog-generator.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/koreaners-blog-generator.err</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin</string>
    </dict>
</dict>
</plist>
```

**Step 2: 동기화 plist (매일 12:00, 18:00)**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.koreaners.blog-sync</string>

    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page/scripts/blog-generator/trigger_sync.sh</string>
    </array>

    <key>StartCalendarInterval</key>
    <array>
        <dict>
            <key>Hour</key>
            <integer>12</integer>
            <key>Minute</key>
            <integer>0</integer>
        </dict>
        <dict>
            <key>Hour</key>
            <integer>18</integer>
            <key>Minute</key>
            <integer>0</integer>
        </dict>
    </array>

    <key>StandardOutPath</key>
    <string>/tmp/koreaners-blog-sync.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/koreaners-blog-sync.err</string>
</dict>
</plist>
```

**Step 3: plist 설치 (사용자 에이전트)**

```bash
cp scripts/blog-generator/com.koreaners.blog-generator.plist ~/Library/LaunchAgents/
cp scripts/blog-generator/com.koreaners.blog-sync.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.koreaners.blog-generator.plist
launchctl load ~/Library/LaunchAgents/com.koreaners.blog-sync.plist
```

**Step 4: 설치 확인**

Run: `launchctl list | grep koreaners`
Expected:
```
-  0  com.koreaners.blog-generator
-  0  com.koreaners.blog-sync
```

**Step 5: Commit**

```bash
git add scripts/blog-generator/com.koreaners.blog-generator.plist scripts/blog-generator/com.koreaners.blog-sync.plist
git commit -m "feat: add launchd plists for weekly blog generation + daily sync"
```

---

### Task 7: Notion DB에 "리뷰" 상태 추가

**Files:** (없음 — Notion MCP 작업)

**Step 1: Notion DB 상태 속성에 "리뷰" 옵션 추가**

현재 상태 옵션: 초안, 발행, 비공개
추가 필요: **리뷰**

Notion MCP `notion-update-data-source`로 상태 select에 "리뷰" 옵션을 추가한다.

**Step 2: 확인**

Notion에서 📝 블로그 포스트 DB 열고 상태 필터에 "리뷰"가 표시되는지 확인.

**Step 3: sync route 업데이트 — "리뷰" 상태는 published: false**

Modify: `app/api/sync/blog/route.ts:189`

현재:
```typescript
const published = statusSelect === "발행";
```

이 로직은 그대로 유지. "리뷰" 상태는 "발행"이 아니므로 `published: false`가 된다. 변경 불필요.

---

### Task 8: E2E 통합 테스트

**Step 1: dry-run으로 키워드 선택 확인**

Run: `cd scripts/blog-generator && python3 generate_blog.py --dry-run`
Expected: 3개 키워드가 서로 다른 pillar에서 선택됨

**Step 2: 1편 실제 생성 테스트**

Run: `cd scripts/blog-generator && python3 generate_blog.py --count 1`
Expected:
- Claude API 호출 성공
- Notion DB에 새 페이지 생성 (상태: 리뷰)
- keywords.json에서 해당 키워드 `used: true`로 업데이트

**Step 3: Notion에서 상태 "발행"으로 변경**

Notion UI에서 생성된 테스트 글의 상태를 "발행"으로 수동 변경

**Step 4: sync 트리거 테스트**

Run: `SITE_URL=http://localhost:3000 scripts/blog-generator/trigger_sync.sh`
Expected: `[OK] Sync complete: {"synced":1,"errors":[]}`

**Step 5: 웹사이트에서 글 확인**

`http://localhost:3000/blog/[slug]` 접속하여 글이 정상 표시되는지 확인

**Step 6: 최종 Commit**

```bash
git add -A
git commit -m "feat: complete blog auto-content pipeline (generate + sync + launchd)"
```

---

## Summary

| Task | 내용 | 예상 시간 |
|------|------|----------|
| 1 | keywords.json 생성 | 5분 |
| 2 | Python 의존성 + 환경 설정 | 5분 |
| 3 | 프롬프트 템플릿 | 5분 |
| 4 | 메인 생성 스크립트 | 15분 |
| 5 | Sync 트리거 스크립트 | 5분 |
| 6 | launchd plist 생성 + 설치 | 10분 |
| 7 | Notion DB "리뷰" 상태 추가 | 3분 |
| 8 | E2E 통합 테스트 | 10분 |
