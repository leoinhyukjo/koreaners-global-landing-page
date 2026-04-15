#!/usr/bin/env python3
"""
KOREANERS Blog Auto-Generator

Selects unused keywords from keywords.json, generates blog posts via Claude API,
and creates Notion pages for human review.

Usage:
    python3 generate_blog.py              # Generate 3 posts
    python3 generate_blog.py --count 5    # Generate 5 posts
    python3 generate_blog.py --dry-run    # Preview without API calls
"""

import argparse
import json
import os
import re
import sys
import tempfile
import time
import traceback
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent

sys.path.insert(0, str(Path.home() / ".config/shared-env"))
from krns_automation import wait_for_network, notify_slack, ping_healthcheck

# Max limits for Notion API
NOTION_MAX_CHILDREN = 100
NOTION_MAX_RICH_TEXT_LENGTH = 2000


def log(message: str) -> None:
    """Print a timestamped log message."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")


def load_env() -> None:
    """Load environment variables from .env.local at project root."""
    from dotenv import load_dotenv

    env_path = PROJECT_ROOT / ".env.local"
    if not env_path.exists():
        log(f"WARNING: .env.local not found at {env_path}")
        return
    load_dotenv(env_path)
    log(f"Loaded env from {env_path}")


def load_keywords() -> list[dict]:
    """Load keywords from keywords.json."""
    keywords_path = SCRIPT_DIR / "keywords.json"
    with open(keywords_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["keywords"]


def save_keywords(keywords: list[dict]) -> None:
    """Save keywords back to keywords.json (atomic write via temp file)."""
    keywords_path = SCRIPT_DIR / "keywords.json"
    with tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", dir=SCRIPT_DIR, suffix=".tmp", delete=False
    ) as tmp:
        json.dump({"keywords": keywords}, tmp, ensure_ascii=False, indent=2)
        tmp_path = tmp.name
    os.replace(tmp_path, keywords_path)
    log("Updated keywords.json")


def select_keywords(keywords: list[dict], count: int) -> list[dict]:
    """
    Select `count` unused keywords with round-robin pillar distribution.
    If all keywords are used, reset all to unused first.
    """
    unused = [kw for kw in keywords if not kw["used"]]

    if not unused:
        log("All keywords used. Resetting all to unused.")
        for kw in keywords:
            kw["used"] = False
        unused = keywords[:]

    # Group unused keywords by pillar
    pillar_groups: dict[str, list[dict]] = {}
    for kw in unused:
        pillar = kw["pillar"]
        if pillar not in pillar_groups:
            pillar_groups[pillar] = []
        pillar_groups[pillar].append(kw)

    # Round-robin selection across pillars
    selected: list[dict] = []
    pillar_names = list(pillar_groups.keys())
    pillar_index = 0

    while len(selected) < count and any(pillar_groups.values()):
        pillar = pillar_names[pillar_index % len(pillar_names)]
        if pillar_groups[pillar]:
            selected.append(pillar_groups[pillar].pop(0))
        pillar_index += 1

        # Remove empty pillars
        if not pillar_groups[pillar]:
            pillar_names = [p for p in pillar_names if pillar_groups.get(p)]
            if not pillar_names:
                break
            pillar_index = pillar_index % len(pillar_names) if pillar_names else 0

    log(f"Selected {len(selected)} keywords across {len(set(kw['pillar'] for kw in selected))} pillars")
    return selected


def load_prompt_template() -> str:
    """Load the prompt template from prompt_template.txt."""
    template_path = SCRIPT_DIR / "prompt_template.txt"
    with open(template_path, "r", encoding="utf-8") as f:
        return f.read()


def generate_article(keyword: str, pillar: str, template: str) -> dict:
    """
    Call Claude API to generate a blog article.
    Returns parsed JSON dict with article fields.
    """
    import anthropic

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    current_year = str(datetime.now().year)
    prompt = template.replace("{keyword}", keyword).replace("{pillar}", pillar).replace("{year}", current_year)

    log(f"Calling Claude API for: {keyword}")
    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=8192,
        messages=[{"role": "user", "content": prompt}],
    )

    if not response.content:
        raise ValueError("Claude API returned empty content")

    block = response.content[0]
    if not hasattr(block, "text"):
        raise ValueError(f"Unexpected content block type: {type(block).__name__}")

    raw_text = block.text.strip()
    if not raw_text:
        raise ValueError("Claude API returned empty text")

    if response.stop_reason == "max_tokens":
        log("WARNING: Response truncated (max_tokens). JSON may be incomplete.")

    # Handle ```json ... ``` wrapping
    if raw_text.startswith("```"):
        # Remove opening ```json or ```
        raw_text = re.sub(r"^```(?:json)?\s*\n?", "", raw_text)
        # Remove closing ```
        raw_text = re.sub(r"\n?```\s*$", "", raw_text)

    article = json.loads(raw_text)

    # Validate required fields
    required_fields = [
        "title", "slug", "category", "format_type", "summary",
        "meta_title", "meta_description", "content_html",
    ]
    missing = [f for f in required_fields if f not in article]
    if missing:
        raise ValueError(f"Missing fields in Claude response: {missing}")

    # Validate format_type value
    valid_formats = {"concept", "tactical", "trend", "comparative", "pitfall"}
    if article["format_type"] not in valid_formats:
        log(f"WARNING: unknown format_type={article['format_type']!r}, defaulting to 'tactical'")
        article["format_type"] = "tactical"

    # leo_markers_count is optional metadata; coerce to int 0..5 or None
    raw_count = article.get("leo_markers_count")
    if isinstance(raw_count, int):
        article["leo_markers_count"] = max(0, min(5, raw_count))
    else:
        article["leo_markers_count"] = None

    log(f"Generated [{article['format_type']}]: {article['title']} (markers={article.get('leo_markers_count')})")
    return article


def strip_html_tags(html: str) -> str:
    """Remove HTML tags from a string."""
    return re.sub(r"<[^>]+>", "", html)


def html_to_notion_blocks(content_html: str) -> list[dict]:
    """
    Convert content_html into Notion block children.
    Produces heading_2, paragraph, bulleted_list_item, and table blocks.
    <mark data-leo="...">text</mark> tags are rendered as orange-highlighted bold rich_text.
    Respects Notion limits: max 100 children, max 2000 chars per rich_text.
    """
    blocks: list[dict] = []

    def make_rich_text(text: str) -> list[dict]:
        """Create rich_text array, chunking if text exceeds 2000 chars."""
        chunks = []
        while text:
            chunk = text[:NOTION_MAX_RICH_TEXT_LENGTH]
            chunks.append({"type": "text", "text": {"content": chunk}})
            text = text[NOTION_MAX_RICH_TEXT_LENGTH:]
        return chunks

    def _chunked_text_objects(text: str, annotations: dict | None = None) -> list[dict]:
        """Chunk plain text into rich_text objects of <= NOTION_MAX_RICH_TEXT_LENGTH."""
        if not text:
            return []
        objs: list[dict] = []
        while text:
            chunk = text[:NOTION_MAX_RICH_TEXT_LENGTH]
            obj: dict = {"type": "text", "text": {"content": chunk}}
            if annotations:
                obj["annotations"] = dict(annotations)
            objs.append(obj)
            text = text[NOTION_MAX_RICH_TEXT_LENGTH:]
        return objs

    def make_rich_text_with_marks(html_fragment: str) -> list[dict]:
        """
        Build rich_text preserving <mark data-leo="cat">...</mark> as orange-highlighted bold.
        Non-mark segments become plain text. Other HTML tags are stripped.
        """
        if not html_fragment:
            return []

        mark_pattern = re.compile(
            r'<mark\s+data-leo\s*=\s*"([^"]+)"\s*>(.*?)</mark>',
            re.DOTALL,
        )

        result: list[dict] = []
        cursor = 0
        for m in mark_pattern.finditer(html_fragment):
            before = html_fragment[cursor:m.start()]
            before_text = strip_html_tags(before)
            if before_text:
                result.extend(_chunked_text_objects(before_text))

            category = m.group(1).strip()
            inner_text = strip_html_tags(m.group(2)).strip()
            labeled = f"[{category}] {inner_text}" if inner_text else f"[{category}]"
            result.extend(_chunked_text_objects(
                labeled,
                annotations={"bold": True, "color": "orange_background"},
            ))
            cursor = m.end()

        tail = html_fragment[cursor:]
        tail_text = strip_html_tags(tail)
        if tail_text:
            result.extend(_chunked_text_objects(tail_text))

        return result

    def add_heading(html_fragment: str) -> None:
        rich = make_rich_text_with_marks(html_fragment)
        if rich and len(blocks) < NOTION_MAX_CHILDREN:
            blocks.append({
                "object": "block",
                "type": "heading_2",
                "heading_2": {"rich_text": rich},
            })

    def add_paragraph(html_fragment: str) -> None:
        rich = make_rich_text_with_marks(html_fragment)
        if rich and len(blocks) < NOTION_MAX_CHILDREN:
            blocks.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {"rich_text": rich},
            })

    def add_bulleted_item(html_fragment: str) -> None:
        rich = make_rich_text_with_marks(html_fragment)
        if rich and len(blocks) < NOTION_MAX_CHILDREN:
            blocks.append({
                "object": "block",
                "type": "bulleted_list_item",
                "bulleted_list_item": {"rich_text": rich},
            })

    def add_table_block(table_html: str) -> None:
        """Parse an HTML table and create a Notion table block."""
        if len(blocks) >= NOTION_MAX_CHILDREN:
            return

        rows_data: list[list[str]] = []

        # Extract rows
        row_matches = re.findall(r"<tr[^>]*>(.*?)</tr>", table_html, re.DOTALL)
        for row_html in row_matches:
            cells = re.findall(r"<(?:td|th)[^>]*>(.*?)</(?:td|th)>", row_html, re.DOTALL)
            cells = [strip_html_tags(c).strip() for c in cells]
            if cells:
                rows_data.append(cells)

        if not rows_data:
            return

        # Normalize column count
        max_cols = max(len(row) for row in rows_data)
        for row in rows_data:
            while len(row) < max_cols:
                row.append("")

        table_rows = []
        for row in rows_data:
            table_rows.append({
                "type": "table_row",
                "table_row": {
                    "cells": [make_rich_text(cell) for cell in row],
                },
            })

        if len(blocks) < NOTION_MAX_CHILDREN:
            blocks.append({
                "object": "block",
                "type": "table",
                "table": {
                    "table_width": max_cols,
                    "has_column_header": True,
                    "has_row_header": False,
                    "children": table_rows,
                },
            })

    # --- Parse content_html ---

    # Split by table boundaries first, process non-table and table segments
    segments = re.split(r"(<table[^>]*>.*?</table>)", content_html, flags=re.DOTALL)

    for segment in segments:
        segment = segment.strip()
        if not segment:
            continue

        if segment.startswith("<table"):
            add_table_block(segment)
            continue

        # Process non-table HTML: split by headings, paragraphs, lists
        # Split by h2 tags
        parts = re.split(r"(<h2[^>]*>.*?</h2>)", segment, flags=re.DOTALL)

        for part in parts:
            part = part.strip()
            if not part:
                continue

            if re.match(r"<h2[^>]*>", part):
                add_heading(part)
                continue

            # Split remaining content by paragraphs and list items
            sub_parts = re.split(
                r"(<p[^>]*>.*?</p>|<ul[^>]*>.*?</ul>|<ol[^>]*>.*?</ol>)",
                part,
                flags=re.DOTALL,
            )

            for sub in sub_parts:
                sub = sub.strip()
                if not sub:
                    continue

                if re.match(r"<ul[^>]*>", sub) or re.match(r"<ol[^>]*>", sub):
                    items = re.findall(r"<li[^>]*>(.*?)</li>", sub, re.DOTALL)
                    for item in items:
                        add_bulleted_item(item)
                elif re.match(r"<p[^>]*>", sub):
                    add_paragraph(sub)
                else:
                    # Fallback: plain text that wasn't wrapped in tags
                    cleaned = strip_html_tags(sub).strip()
                    if cleaned:
                        add_paragraph(cleaned)

    # Final safety: truncate to max children
    return blocks[:NOTION_MAX_CHILDREN]


def create_notion_page(article: dict) -> str:
    """
    Create a Notion page in the blog database.
    Returns the page URL.
    """
    from notion_client import Client

    notion = Client(auth=os.environ["NOTION_TOKEN"])
    database_id = os.environ["NOTION_BLOG_DB_ID"]

    # Build page properties
    properties = {
        "이름": {
            "title": [{"text": {"content": article["title"][:NOTION_MAX_RICH_TEXT_LENGTH]}}],
        },
        "상태": {
            "select": {"name": "리뷰"},
        },
        "슬러그": {
            "rich_text": [{"text": {"content": article["slug"][:NOTION_MAX_RICH_TEXT_LENGTH]}}],
        },
        "카테고리": {
            "multi_select": [{"name": article["category"]}],
        },
        "Meta Title": {
            "rich_text": [{"text": {"content": article["meta_title"][:NOTION_MAX_RICH_TEXT_LENGTH]}}],
        },
        "Meta Description": {
            "rich_text": [{"text": {"content": article["meta_description"][:NOTION_MAX_RICH_TEXT_LENGTH]}}],
        },
        "발행일": {
            "date": {"start": datetime.now(timezone.utc).strftime("%Y-%m-%d")},
        },
    }

    # Build page body blocks
    children = html_to_notion_blocks(article["content_html"])

    log(f"Creating Notion page: {article['title']} ({len(children)} blocks)")
    page = notion.pages.create(
        parent={"database_id": database_id},
        properties=properties,
        children=children,
    )

    page_url = page.get("url", "")
    log(f"Created Notion page: {page_url}")
    return page_url


def dry_run_report(selected_keywords: list[dict], template: str) -> None:
    """Print a dry-run report without making any API calls."""
    log("=== DRY RUN MODE ===")
    log(f"Would generate {len(selected_keywords)} blog posts:")
    print()

    for i, kw in enumerate(selected_keywords, 1):
        print(f"  {i}. [{kw['pillar']}] {kw['keyword']}")

    print()
    log(f"Prompt template: {len(template)} chars")
    log(f"Model: claude-opus-4-6")
    log(f"Target Notion DB: NOTION_BLOG_DB_ID (from env)")
    log("=== DRY RUN COMPLETE (no API calls made) ===")


def main() -> int:
    parser = argparse.ArgumentParser(description="KOREANERS Blog Auto-Generator")
    parser.add_argument("--count", type=int, default=3, help="Number of posts to generate (default: 3)")
    parser.add_argument("--dry-run", action="store_true", help="Preview without making API calls")
    args = parser.parse_args()

    log(f"Starting blog generation (count={args.count}, dry_run={args.dry_run})")

    # Load keywords and template
    keywords = load_keywords()
    template = load_prompt_template()
    selected = select_keywords(keywords, args.count)

    if not selected:
        log("ERROR: No keywords available")
        return 1

    # Dry run mode: just report and exit
    if args.dry_run:
        dry_run_report(selected, template)
        return 0

    # Load environment for API calls
    load_env()

    # Validate required env vars before starting generation
    required_env = ["ANTHROPIC_API_KEY", "NOTION_TOKEN", "NOTION_BLOG_DB_ID"]
    missing_env = [k for k in required_env if not os.environ.get(k)]
    if missing_env:
        log(f"ERROR: Missing required environment variables: {', '.join(missing_env)}")
        return 1

    # Generate articles
    success_count = 0
    fail_count = 0

    for kw in selected:
        keyword = kw["keyword"]
        pillar = kw["pillar"]

        try:
            # Generate article via Claude
            article = generate_article(keyword, pillar, template)

            # Create Notion page
            page_url = create_notion_page(article)

            # Mark keyword as used
            kw["used"] = True
            save_keywords(keywords)

            success_count += 1
            log(f"SUCCESS [{success_count}/{len(selected)}]: {keyword}")

        except Exception as e:
            fail_count += 1
            log(f"FAILED [{fail_count}]: {keyword} - {type(e).__name__}: {e}")
            continue

    # Summary
    log(f"=== COMPLETE: {success_count} succeeded, {fail_count} failed out of {len(selected)} ===")

    if success_count == 0:
        log("ERROR: All generations failed")
        return 1

    return 0


if __name__ == "__main__":
    wait_for_network()
    ping_healthcheck("start")
    try:
        exit_code = main()
        ping_healthcheck("success")
        if exit_code == 0:
            notify_slack("블로그 자동 생성", "success", "블로그 포스트 초안 생성 완료")
        else:
            notify_slack("블로그 자동 생성", "fail", f"exit code: {exit_code}")
        sys.exit(exit_code)
    except Exception as e:
        tb = traceback.format_exc()
        log(f"[FATAL] {e}\n{tb}")
        ping_healthcheck("fail", f"{e}\n{tb}")
        notify_slack("블로그 자동 생성", "fail", f"{e}")
        sys.exit(1)
