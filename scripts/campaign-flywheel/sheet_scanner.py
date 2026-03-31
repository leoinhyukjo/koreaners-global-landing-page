"""PM 공유 드라이브 시트에서 Instagram 콘텐츠 URL을 추출하는 스캐너"""
from __future__ import annotations

import re
from typing import TYPE_CHECKING

from config import PM_SHARED_DRIVE_FOLDER_ID, IG_URL_PATTERN

if TYPE_CHECKING:
    from sheets_client import SheetsClient

# 브랜드명 추출 정규식 — [KOREANERS] 브랜드명 키워드 패턴
_BRAND_PATTERN = re.compile(
    r"\[KOREANERS\]\s*(.+?)(?:\s+(?:진행|인플루언서|리스트|마케팅|매장|방문|체험|오프닝|클리닉))"
)

# Instagram 프로필 URL (콘텐츠 URL 아닌 것) 감지 — /reel/, /p/, /stories/ 없으면 프로필
_PROFILE_ONLY_PATTERN = re.compile(
    r"https?://(?:www\.)?instagram\.com/(?!(?:reel|p|stories)/)"
)

# post_type 판별
_POST_TYPE_MAP = {
    "/reel/": "reels",
    "/p/": "feed",
    "/stories/": "story",
}

# IG 핸들 감지 — @로 시작하거나 instagram.com/ 포함
_IG_HANDLE_PATTERN = re.compile(r"^@\w+$|instagram\.com/[\w.]+")

# 크리에이터 이름 — 짧은 텍스트(20자 미만), 숫자만인 값 제외
_NAME_MAX_LEN = 20


def _extract_post_type(url: str) -> str:
    """URL에서 post_type을 판별합니다."""
    for fragment, post_type in _POST_TYPE_MAP.items():
        if fragment in url:
            return post_type
    return "unknown"


def _is_content_url(url: str) -> bool:
    """콘텐츠 URL (reel/p/stories)인지 확인합니다. 프로필 URL은 False."""
    return bool(re.search(IG_URL_PATTERN, url))


def _extract_creator_from_left_cells(row: list[str], url_col_idx: int) -> tuple[str, str]:
    """URL 칼럼 왼쪽 셀들에서 ig_handle과 creator_name을 추출합니다.

    Returns:
        (ig_handle, creator_name) 튜플
    """
    ig_handle = ""
    creator_name = ""

    left_cells = row[:url_col_idx]
    for cell in left_cells:
        cell = cell.strip()
        if not cell:
            continue

        # IG 핸들: @로 시작하거나 instagram.com/ 포함
        if cell.startswith("@") or "instagram.com/" in cell:
            if not ig_handle:
                ig_handle = cell
            continue

        # 크리에이터 이름: 20자 미만, 숫자만은 아님, 파일 확장자 패턴 제외
        is_file_name = bool(re.search(r"\.\w{2,4}$", cell))
        if (
            len(cell) < _NAME_MAX_LEN
            and not cell.replace(",", "").replace(".", "").isdigit()
            and not is_file_name
        ):
            if not creator_name:
                creator_name = cell

    return ig_handle, creator_name


def extract_ig_urls_from_rows(
    rows: list[list[str]],
    brand_name: str,
    sheet_id: str,
) -> list[dict]:
    """시트 rows에서 Instagram 콘텐츠 URL을 추출합니다.

    Args:
        rows: 시트의 원시 행 데이터 (헤더 포함)
        brand_name: 브랜드명
        sheet_id: 소스 시트 ID

    Returns:
        추출된 URL 정보 딕셔너리 리스트
    """
    results: list[dict] = []
    seen_urls: set[str] = set()
    content_url_re = re.compile(IG_URL_PATTERN)

    for row in rows:
        for col_idx, cell in enumerate(row):
            cell_str = str(cell).strip()
            if not cell_str:
                continue

            # 콘텐츠 URL 탐색
            matches = content_url_re.findall(cell_str)
            for url in matches:
                if url in seen_urls:
                    continue
                seen_urls.add(url)

                post_type = _extract_post_type(url)
                ig_handle, creator_name = _extract_creator_from_left_cells(row, col_idx)

                results.append({
                    "brand_name": brand_name,
                    "creator_name": creator_name,
                    "ig_handle": ig_handle,
                    "post_url": url,
                    "post_type": post_type,
                    "source_sheet_id": sheet_id,
                })

    return results


def _extract_brand_from_filename(filename: str) -> str:
    """파일명에서 브랜드명을 추출합니다.

    패턴: [KOREANERS] 브랜드명 키워드...
    키워드: 진행, 인플루언서, 리스트, 마케팅, 매장, 방문, 체험, 오프닝, 클리닉

    Args:
        filename: Drive 파일명

    Returns:
        추출된 브랜드명. 실패 시 [KOREANERS] 이후 첫 단어 반환.
    """
    m = _BRAND_PATTERN.search(filename)
    if m:
        return m.group(1).strip()

    # 폴백: [KOREANERS] 이후 첫 단어
    fallback_m = re.search(r"\[KOREANERS\]\s*(\S+)", filename)
    if fallback_m:
        return fallback_m.group(1).strip()

    return filename


def scan_all_sheets(
    client: "SheetsClient",
    existing_urls: set[str],
) -> list[dict]:
    """PM 공유 드라이브 전체 시트를 스캔하여 신규 Instagram URL을 수집합니다.

    Args:
        client: SheetsClient 인스턴스
        existing_urls: 이미 수집된 URL 집합 (중복 방지)

    Returns:
        신규 URL 정보 딕셔너리 리스트
    """
    sheets = client.list_drive_sheets(PM_SHARED_DRIVE_FOLDER_ID)

    all_results: list[dict] = []
    global_seen: set[str] = set(existing_urls)

    for sheet in sheets:
        sheet_id = sheet["id"]
        filename = sheet.get("name", "")

        brand_name = _extract_brand_from_filename(filename)

        # 모든 탭 순회
        try:
            tab_names = client.get_sheet_tabs(sheet_id)
        except Exception:
            tab_names = [""]  # 폴백: 기본 탭

        for tab_name in tab_names:
            try:
                range_name = f"'{tab_name}'!A:Z" if tab_name else "A:Z"
                rows = client.read_tab(sheet_id, range_name)
            except Exception:
                continue

            sheet_results = extract_ig_urls_from_rows(rows, brand_name, sheet_id)

            for item in sheet_results:
                url = item["post_url"]
                if url in global_seen:
                    continue
                global_seen.add(url)
                all_results.append(item)

    return all_results
