# Blog Auto Content Pipeline Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 키워드 기반 블로그 글 자동 생성 → Notion 리뷰 → 웹사이트 발행까지의 전체 파이프라인 자동화

**Architecture:** launchd 스케줄러가 주 1회 Python 스크립트를 실행하여 Claude API로 3편의 블로그 글을 생성하고, Notion DB에 "리뷰" 상태로 저장. 사람이 Notion에서 검수/수정 후 "발행"으로 변경하면, 기존 sync 파이프라인(`/api/sync/blog`)이 주기적으로 동기화하여 웹사이트에 게시.

**Tech Stack:** Python 3, Anthropic SDK, Notion SDK (notion-client), launchd, 기존 Supabase sync API

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│  launchd (주 1회, 예: 매주 월 10:00)                   │
│  → generate_blog.py                                  │
│    ├─ 키워드 30개 리스트에서 순환 선택 (3개)              │
│    ├─ Claude API × 3 (글 생성)                        │
│    │   - 제목, 본문(HTML), 요약, slug                   │
│    │   - Meta Title, Meta Description, FAQs            │
│    ├─ Notion API × 3 (페이지 생성, 상태: "리뷰")         │
│    └─ 결과 로그 출력                                    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  Notion DB (📝 블로그 포스트)                           │
│  상태: 리뷰 → 사람이 검수/수정 → 발행                     │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  Sync (기존 구현)                                      │
│  launchd 하루 2회 or 어드민 수동 버튼                     │
│  POST /api/sync/blog → Supabase upsert               │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  koreaners.co 웹사이트                                 │
│  published: true인 글만 표시                            │
└─────────────────────────────────────────────────────┘
```

## Content Generation Flow

1. **키워드 선택**: `keywords.json`에서 아직 사용하지 않은 키워드 3개 순환 선택
   - Phase 1: 기존 30개 키워드 (docs/blog-content-prompt-template.md의 6 Pillars)
   - Phase 2 (미래): 웹 리서치로 신규 키워드 자동 발굴

2. **Claude API 호출**: 키워드별 1편씩 총 3편 생성
   - 기존 `blog-content-prompt-template.md`를 시스템 프롬프트로 활용
   - 출력: JSON 구조 (title, content_html, summary, slug, meta_title, meta_description, faqs, category)
   - 한국어 + 영어/일본어 SEO 메타데이터

3. **Notion 페이지 생성**: notion-client SDK로 DB에 직접 생성
   - 모든 속성 자동 세팅 (제목, 슬러그, 카테고리, 요약, 썸네일 제외, Meta Title/Description, 상태="리뷰", 발행일)
   - 본문은 Notion 블록으로 변환하여 삽입

4. **상태 워크플로우**:
   ```
   [자동 생성] → 리뷰 → 발행 → 비공개
                   ↑
               사람이 검수/수정
   ```

## Sync Trigger

- 기존 `/api/sync/blog` API 그대로 활용
- launchd로 하루 2회 자동 sync (예: 12:00, 18:00)
- 어드민 페이지 수동 "Notion 동기화" 버튼도 유지

## File Structure

```
koreaners-global-landing-page/
├── scripts/
│   └── blog-generator/
│       ├── generate_blog.py      # 메인 스크립트
│       ├── keywords.json         # 키워드 리스트 + 사용 이력
│       ├── prompt_template.txt   # Claude API 프롬프트
│       └── requirements.txt      # anthropic, notion-client
```

## Error Handling

- Claude API 실패: 해당 키워드 스킵, 다음 키워드 진행
- Notion API 실패: 재시도 1회, 실패 시 로그 기록
- 전체 실패: stdout/stderr 로그 (launchd 표준)

## Decisions

- **실행 환경**: launchd (기존 10개 자동화와 동일 패턴)
- **생성 주기**: 주 1회 (매주 월요일)
- **배치 수량**: 3편/회
- **LLM**: Claude API (Anthropic SDK)
- **발행 방식**: Notion 상태 "발행" → sync API가 자동 반영
- **썸네일**: 자동 생성 범위 외 (수동 설정 or Phase 2)
