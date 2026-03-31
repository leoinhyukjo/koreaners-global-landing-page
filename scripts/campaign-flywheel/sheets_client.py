"""Google Sheets/Drive API 클라이언트"""
from __future__ import annotations

import os
from typing import Any

from google.oauth2 import service_account
from googleapiclient.discovery import build

# Google API 스코프
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.readonly",
]

# Drive 파일 목록 페이지 크기
DRIVE_PAGE_SIZE = 100


def _get_credentials() -> service_account.Credentials:
    """환경 변수에서 서비스 계정 JSON 경로를 읽어 인증 정보를 반환합니다."""
    sa_json = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    if not sa_json:
        raise EnvironmentError(
            "GOOGLE_SERVICE_ACCOUNT_JSON 환경 변수가 설정되어 있지 않습니다."
        )
    return service_account.Credentials.from_service_account_file(
        sa_json, scopes=SCOPES
    )


def build_sheets_service() -> Any:
    """Google Sheets v4 서비스를 빌드하여 반환합니다."""
    creds = _get_credentials()
    return build("sheets", "v4", credentials=creds)


def build_drive_service() -> Any:
    """Google Drive v3 서비스를 빌드하여 반환합니다."""
    creds = _get_credentials()
    return build("drive", "v3", credentials=creds)


class SheetsClient:
    """Google Sheets/Drive API 클라이언트"""

    def __init__(self) -> None:
        self._sheets_service = build_sheets_service()
        self._drive_service = build_drive_service()

    def read_tab(self, spreadsheet_id: str, range_name: str) -> list[list[str]]:
        """시트 탭의 모든 데이터를 읽어 반환합니다.

        Args:
            spreadsheet_id: 스프레드시트 ID
            range_name: 읽을 범위 (예: "Sheet1!A:Z" 또는 "Dashboard")

        Returns:
            2차원 문자열 리스트. 빈 시트면 빈 리스트 반환.
        """
        result = (
            self._sheets_service.spreadsheets()
            .values()
            .get(
                spreadsheetId=spreadsheet_id,
                range=range_name,
                valueRenderOption="FORMATTED_VALUE",
            )
            .execute()
        )
        return result.get("values", [])

    def append_rows(
        self, spreadsheet_id: str, tab_name: str, rows: list[list[Any]]
    ) -> int:
        """시트 탭에 행을 추가하고 추가된 행 수를 반환합니다.

        Args:
            spreadsheet_id: 스프레드시트 ID
            tab_name: 탭 이름 (예: "Sheet1")
            rows: 추가할 행 데이터 (2차원 리스트)

        Returns:
            실제 추가된 행 수
        """
        result = (
            self._sheets_service.spreadsheets()
            .values()
            .append(
                spreadsheetId=spreadsheet_id,
                range=tab_name,
                valueInputOption="USER_ENTERED",
                insertDataOption="INSERT_ROWS",
                body={"values": rows},
            )
            .execute()
        )
        return result.get("updates", {}).get("updatedRows", 0)

    def get_sheet_tabs(self, spreadsheet_id: str) -> list[str]:
        """스프레드시트의 모든 탭(시트) 이름을 반환합니다."""
        result = (
            self._sheets_service.spreadsheets()
            .get(spreadsheetId=spreadsheet_id, fields="sheets.properties.title")
            .execute()
        )
        return [s["properties"]["title"] for s in result.get("sheets", [])]

    def list_drive_sheets(self, folder_id: str) -> list[dict]:
        """Drive 폴더 내 Google Sheets 파일 목록을 반환합니다.

        페이지네이션을 통해 전체 목록을 수집하며,
        공유 드라이브(Shared Drive)도 지원합니다.

        Args:
            folder_id: Drive 폴더 ID

        Returns:
            파일 정보 딕셔너리 리스트 (id, name 등 포함)
        """
        query = (
            f"'{folder_id}' in parents "
            f"and mimeType='application/vnd.google-apps.spreadsheet' "
            f"and trashed=false"
        )
        files: list[dict] = []
        page_token: str | None = None

        while True:
            kwargs: dict[str, Any] = {
                "q": query,
                "pageSize": DRIVE_PAGE_SIZE,
                "fields": "nextPageToken, files(id, name)",
                "supportsAllDrives": True,
                "includeItemsFromAllDrives": True,
            }
            if page_token:
                kwargs["pageToken"] = page_token

            response = self._drive_service.files().list(**kwargs).execute()
            files.extend(response.get("files", []))

            page_token = response.get("nextPageToken")
            if not page_token:
                break

        return files
