#!/usr/bin/env python3
"""Update Notion page title, properties, and add content blocks."""

import json
import urllib.request
import urllib.error
import sys

NOTION_TOKEN = "ntn_lF4805029123dCmTQhoGgXGD1W3e48lFxf8l2BWZaqv9pT"
PAGE_ID = "30601ca3-e480-802b-becf-f42202f06fcd"
NOTION_VERSION = "2022-06-28"
BASE_URL = "https://api.notion.com/v1"

def notion_request(method, endpoint, data=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"HTTP Error {e.code}: {error_body}")
        sys.exit(1)

def update_properties():
    """Update page title, status, and priority."""
    data = {
        "properties": {
            "프로젝트 이름": {
                "title": [
                    {
                        "text": {
                            "content": "KOREANERS 랜딩 페이지 \u2014 작업 아카이브"
                        }
                    }
                ]
            },
            "상태": {
                "status": {
                    "name": "완료"
                }
            },
            "우선순위": {
                "select": {
                    "name": "보통"
                }
            }
        }
    }
    result = notion_request("PATCH", f"/pages/{PAGE_ID}", data)
    title = result["properties"]["프로젝트 이름"]["title"][0]["plain_text"]
    status = result["properties"]["상태"]["status"]["name"]
    priority = result["properties"]["우선순위"]["select"]["name"]
    print(f"Title: {title}")
    print(f"Status: {status}")
    print(f"Priority: {priority}")
    return result

def text(content, bold=False, italic=False, code=False, color="default", link=None):
    """Create a rich text object."""
    obj = {
        "type": "text",
        "text": {
            "content": content,
            "link": {"url": link} if link else None
        },
        "annotations": {
            "bold": bold,
            "italic": italic,
            "strikethrough": False,
            "underline": False,
            "code": code,
            "color": color
        }
    }
    return obj

def heading1(content):
    return {
        "object": "block",
        "type": "heading_1",
        "heading_1": {
            "rich_text": [text(content)]
        }
    }

def heading2(content):
    return {
        "object": "block",
        "type": "heading_2",
        "heading_2": {
            "rich_text": [text(content)]
        }
    }

def heading3(content):
    return {
        "object": "block",
        "type": "heading_3",
        "heading_3": {
            "rich_text": [text(content)]
        }
    }

def bullet(rich_text_list):
    """Create a bulleted list item with rich text array."""
    return {
        "object": "block",
        "type": "bulleted_list_item",
        "bulleted_list_item": {
            "rich_text": rich_text_list
        }
    }

def numbered(rich_text_list):
    """Create a numbered list item with rich text array."""
    return {
        "object": "block",
        "type": "numbered_list_item",
        "numbered_list_item": {
            "rich_text": rich_text_list
        }
    }

def divider():
    return {
        "object": "block",
        "type": "divider",
        "divider": {}
    }

def paragraph(rich_text_list):
    return {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": rich_text_list
        }
    }

def table_block(rows, has_header=True):
    """Create a table block. rows is a list of lists of rich_text arrays."""
    width = len(rows[0]) if rows else 0
    children = []
    for row in rows:
        cells = []
        for cell in row:
            if isinstance(cell, str):
                cells.append([text(cell)])
            else:
                cells.append(cell)
        children.append({
            "object": "block",
            "type": "table_row",
            "table_row": {
                "cells": cells
            }
        })
    return {
        "object": "block",
        "type": "table",
        "table": {
            "table_width": width,
            "has_column_header": has_header,
            "has_row_header": False,
            "children": children
        }
    }

def callout_block(rich_text_list, emoji="📌"):
    return {
        "object": "block",
        "type": "callout",
        "callout": {
            "rich_text": rich_text_list,
            "icon": {
                "type": "emoji",
                "emoji": emoji
            }
        }
    }

def add_blocks(blocks):
    """Append blocks to the page. Notion API allows max 100 blocks per request."""
    for i in range(0, len(blocks), 100):
        chunk = blocks[i:i+100]
        data = {"children": chunk}
        result = notion_request("PATCH", f"/blocks/{PAGE_ID}/children", data)
        print(f"Added {len(chunk)} blocks (batch {i//100 + 1})")
    return result

def build_content():
    """Build all content blocks."""
    blocks = []

    # === 프로젝트 개요 ===
    blocks.append(heading1("프로젝트 개요"))
    blocks.append(paragraph([]))  # empty line
    blocks.append(bullet([text("프로젝트: ", bold=True), text("KOREANERS 랜딩 페이지 (koreaners.co)")]))
    blocks.append(bullet([text("GitHub: ", bold=True), text("https://github.com/leoinhyukjo/koreaners-global-landing-page", link="https://github.com/leoinhyukjo/koreaners-global-landing-page")]))
    blocks.append(bullet([text("스택: ", bold=True), text("Next.js 16, Tailwind CSS 4, shadcn/ui, Framer Motion, Supabase, Embla Carousel")]))
    blocks.append(bullet([text("배포: ", bold=True), text("Vercel (koreaners.co)")]))
    blocks.append(bullet([text("담당: ", bold=True), text("조인혁 (leo@koreaners.com)")]))
    blocks.append(divider())

    # === Careers 페이지 구현 ===
    blocks.append(heading1("Careers 페이지 구현"))
    blocks.append(paragraph([]))

    blocks.append(heading2("페이지 구성"))
    blocks.append(paragraph([text("Hero → 기업 소개(About Us) → 3대 사업영역(Business) → 핵심경쟁력(Strengths) → 비전(Vision) → 인재상(Culture) → 채용공고(Openings) → Talent Pool CTA")]))

    blocks.append(heading2("주요 기능"))
    blocks.append(bullet([text("Notion DB 실시간 연동: ", bold=True), text("채용공고 추가/수정 시 최대 1분 내 홈페이지 자동 반영")]))
    blocks.append(bullet([text("채용중 + 채용마감 공고 동시 표시 (채용마감은 하단 배치, 지원하기 버튼 비활성화)")]))
    blocks.append(bullet([text("각 공고별 JD 상세보기 + 지원하기 버튼 (Notion 페이지 링크)")]))
    blocks.append(bullet([text("모바일 반응형: ", bold=True), text("채용중은 상세보기+지원하기 반반 레이아웃, 채용마감은 풀너비")]))
    blocks.append(bullet([text("한국어/일본어 i18n 지원 (55개+ 번역 키)")]))

    blocks.append(heading2("인재상 6개 항목"))
    blocks.append(numbered([text("글로벌 마인드셋", bold=True), text(" — 국경을 넘어 다양한 문화와 시장을 이해하고 소통하는 열린 시각")]))
    blocks.append(numbered([text("데이터 기반 사고", bold=True), text(" — 감이 아닌 데이터로 의사결정하고 지속적으로 개선하는 태도")]))
    blocks.append(numbered([text("실행력", bold=True), text(" — 완벽한 계획보다 빠른 실행과 개선을 통해 성과를 만들어내는 능력")]))
    blocks.append(numbered([text("협업 정신", bold=True), text(" — 다양한 이해관계자와 원활하게 소통하고 협력하는 자세")]))
    blocks.append(numbered([text("성장 마인드", bold=True), text(" — 새로운 도전을 통해 개인과 조직의 성장을 추구하는 열정")]))
    blocks.append(numbered([text("몰입", bold=True), text(" — 이만하면 됐다고 멈추지 않고 한 단계 더 깊이 파고들어 결과의 차이를 만들어내는 힘")]))

    blocks.append(heading2("비전 3개 항목 (순서)"))
    blocks.append(numbered([text("생태계 구축")]))
    blocks.append(numbered([text("시장 확장")]))
    blocks.append(numbered([text("프로세스 효율화")]))

    blocks.append(heading2("생성/수정 파일"))
    blocks.append(bullet([text("app/careers/page.tsx", code=True), text(" — 채용 페이지 본체")]))
    blocks.append(bullet([text("app/careers/layout.tsx", code=True), text(" — SEO metadata")]))
    blocks.append(bullet([text("app/api/careers/route.ts", code=True), text(" — Notion 채용 DB API")]))
    blocks.append(bullet([text("components/navigation.tsx", code=True), text(" — Careers 메뉴 항목 추가")]))
    blocks.append(bullet([text("locales/ko.json", code=True), text(" / "), text("locales/jp.json", code=True), text(" — 번역 키 추가")]))
    blocks.append(divider())

    # === 크리에이터 페이지 개선 ===
    blocks.append(heading1("크리에이터 페이지 개선"))
    blocks.append(paragraph([]))

    blocks.append(heading2("변경 내용"))
    blocks.append(bullet([text("크리에이터 모집 인트로 섹션 추가: ", bold=True), text('"코리너스와 함께 성장할 크리에이터를 모집합니다" 문구 + 설명')]))
    blocks.append(bullet([text('기존 "두 가지 합류 여정" 위에 배치하여 고객사/크리에이터 혼동 방지')]))

    blocks.append(heading2("수정 파일"))
    blocks.append(bullet([text("components/creator-track-section.tsx", code=True)]))
    blocks.append(divider())

    # === 전체 페이지 비주얼 통일 ===
    blocks.append(heading1("전체 페이지 비주얼 통일"))
    blocks.append(paragraph([]))

    blocks.append(heading2("히어로 그라데이션 통일"))
    blocks.append(bullet([text("적용 범위: ", bold=True), text("Careers, Service, Creator, Portfolio, Blog (전 5개 페이지)")]))
    blocks.append(bullet([text("효과: ", bold=True), text("bg-[radial-gradient(ellipse_at_top_center,_rgba(255,255,255,0.04)_0%,_transparent_70%)]", code=True)]))

    blocks.append(heading2("서비스 페이지 아이콘 호버 수정"))
    blocks.append(bullet([text("문제: ", bold=True), text("카드 호버 시 아이콘 배경은 흰색으로 변하는데 아이콘 색상이 그대로 흰색이라 안 보임")]))
    blocks.append(bullet([text("해결: ", bold=True), text("group-hover:text-black", code=True), text(" 추가하여 색 반전")]))
    blocks.append(divider())

    # === SEO 전면 개선 ===
    blocks.append(heading1("SEO 전면 개선 (2026-02-13)"))
    blocks.append(paragraph([]))

    blocks.append(heading2("메타 태그"))
    blocks.append(bullet([text("루트 ", bold=True), text("layout.tsx", code=True), text(": title template, description(키워드 풍부), keywords 12개, OG/Twitter 태그, canonical URL, robots 설정")]))
    blocks.append(bullet([text("서브 페이지 5개에 개별 ", bold=True), text("layout.tsx", code=True), text(" 생성 (service, creator, portfolio, blog, careers)")]))
    blocks.append(bullet([text("각 페이지별 고유한 title과 description 설정")]))

    blocks.append(heading2("구조화 데이터"))
    blocks.append(bullet([text("JSON-LD Organization schema 추가 (회사명, 로고, 서비스 지역, 연락처)")]))

    blocks.append(heading2("사이트맵"))
    blocks.append(bullet([text("누락된 "), text("/service", code=True), text(", "), text("/careers", code=True), text(" 페이지 추가")]))
    blocks.append(bullet([text("총 정적 7페이지 + 동적 페이지(포트폴리오, 블로그, 크리에이터)")]))

    blocks.append(heading2("검색엔진 등록"))
    blocks.append(bullet([text("Google Search Console: ", bold=True), text("사이트맵 제출 완료, 주요 페이지 개별 색인 요청 완료")]))
    blocks.append(bullet([text("네이버 서치어드바이저: ", bold=True), text("소유확인 완료 (verification: "), text("223270d36646f19566b9451e5f6775ac2996dbf2", code=True), text("), 사이트맵 제출 완료")]))
    blocks.append(divider())

    # === 커밋 히스토리 ===
    blocks.append(heading1("커밋 히스토리 (주요)"))
    blocks.append(paragraph([]))

    commit_table = table_block([
        ["커밋", "내용"],
        [[text("a8fc272", code=True)], [text("Careers 페이지 가독성 개선 + 히어로 그라데이션 전 페이지 통일")]],
        [[text("9b099a9", code=True)], [text("채용마감 공고 표시 + 지원하기 버튼 비활성화")]],
        [[text("1b93b90", code=True)], [text("크리에이터 모집 인트로 추가 + 채용마감 공고 표시")]],
        [[text("6e3199d", code=True)], [text("채용공고 정렬 (채용중 상단, 채용마감 하단, 채용개시일순)")]],
        [[text("854dc59", code=True)], [text("비전 카드 순서 변경 + 모바일 버튼 레이아웃 + 서비스 아이콘 호버")]],
        [[text("55b386b", code=True)], [text("인재상 '몰입' 항목 추가")]],
        [[text("a3500ba", code=True)], [text("SEO 전면 개선 (메타 태그, JSON-LD, 사이트맵, 서브 페이지 metadata)")]],
        [[text("35c96d3", code=True)], [text("네이버 서치어드바이저 소유확인 메타 태그 추가")]],
    ], has_header=True)
    blocks.append(commit_table)
    blocks.append(divider())

    # === 남은 작업 ===
    blocks.append(heading1("남은 작업"))
    blocks.append(paragraph([]))
    blocks.append(bullet([text("OG 이미지 전용 제작 (1200x630, 현재 logo.png 사용 중)")]))
    blocks.append(bullet([text("검색엔진 색인 반영 모니터링 (구글/네이버 각 1-4주 소요)")]))
    blocks.append(bullet([text("(선택) 다른 페이지 디자인 톤 통일 검토")]))

    return blocks

if __name__ == "__main__":
    print("=== Step 1: Updating page properties ===")
    update_properties()
    print()

    print("=== Step 2: Adding content blocks ===")
    blocks = build_content()
    print(f"Total blocks to add: {len(blocks)}")
    add_blocks(blocks)
    print()
    print("Done!")
