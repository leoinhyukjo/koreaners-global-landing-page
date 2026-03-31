"""Google Sheets/Drive API 클라이언트 테스트"""
from __future__ import annotations

import sys
import os
import unittest
from unittest.mock import MagicMock, patch

# campaign-flywheel 디렉토리를 sys.path에 추가
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def _make_client(mock_sheets=None, mock_drive=None):
    """SheetsClient를 모킹된 서비스로 생성하는 헬퍼"""
    mock_sheets = mock_sheets or MagicMock()
    mock_drive = mock_drive or MagicMock()
    with patch("sheets_client.build_sheets_service", return_value=mock_sheets), \
         patch("sheets_client.build_drive_service", return_value=mock_drive):
        from sheets_client import SheetsClient
        return SheetsClient(), mock_sheets, mock_drive


class TestReadTab(unittest.TestCase):
    """read_tab 메서드 테스트"""

    def test_read_tab_returns_rows(self):
        """시트 데이터를 정상적으로 반환하는지 확인"""
        mock_sheets = MagicMock()
        mock_sheets.spreadsheets().values().get().execute.return_value = {
            "values": [
                ["header1", "header2"],
                ["row1col1", "row1col2"],
                ["row2col1", "row2col2"],
            ]
        }

        client, _, _ = _make_client(mock_sheets=mock_sheets)
        rows = client.read_tab("spreadsheet_id_123", "Sheet1!A:Z")

        self.assertEqual(len(rows), 3)
        self.assertEqual(rows[0], ["header1", "header2"])
        self.assertEqual(rows[1], ["row1col1", "row1col2"])
        self.assertEqual(rows[2], ["row2col1", "row2col2"])

    def test_read_tab_empty_sheet(self):
        """빈 시트일 때 빈 리스트를 반환하는지 확인"""
        mock_sheets = MagicMock()
        mock_sheets.spreadsheets().values().get().execute.return_value = {}

        client, _, _ = _make_client(mock_sheets=mock_sheets)
        rows = client.read_tab("spreadsheet_id_123", "Sheet1!A:Z")

        self.assertEqual(rows, [])

    def test_read_tab_calls_correct_params(self):
        """올바른 파라미터로 API를 호출하는지 확인"""
        mock_sheets = MagicMock()
        mock_sheets.spreadsheets().values().get().execute.return_value = {
            "values": []
        }

        client, mock_sheets, _ = _make_client(mock_sheets=mock_sheets)
        client.read_tab("my_spreadsheet", "Dashboard!A:Z")

        mock_sheets.spreadsheets().values().get.assert_called_with(
            spreadsheetId="my_spreadsheet",
            range="Dashboard!A:Z",
            valueRenderOption="FORMATTED_VALUE",
        )


class TestAppendRows(unittest.TestCase):
    """append_rows 메서드 테스트"""

    def test_append_rows(self):
        """행 추가 후 추가된 행 수를 반환하는지 확인"""
        mock_sheets = MagicMock()
        mock_sheets.spreadsheets().values().append().execute.return_value = {
            "updates": {
                "updatedRows": 3,
            }
        }

        client, _, _ = _make_client(mock_sheets=mock_sheets)
        rows = [["a", "b"], ["c", "d"], ["e", "f"]]
        count = client.append_rows("spreadsheet_id_123", "Sheet1", rows)

        self.assertEqual(count, 3)

    def test_append_rows_calls_correct_params(self):
        """올바른 파라미터로 append API를 호출하는지 확인"""
        mock_sheets = MagicMock()
        mock_sheets.spreadsheets().values().append().execute.return_value = {
            "updates": {"updatedRows": 2}
        }

        client, mock_sheets, _ = _make_client(mock_sheets=mock_sheets)
        rows_to_add = [["val1", "val2"], ["val3", "val4"]]
        client.append_rows("my_sheet_id", "MyTab", rows_to_add)

        mock_sheets.spreadsheets().values().append.assert_called_with(
            spreadsheetId="my_sheet_id",
            range="MyTab",
            valueInputOption="USER_ENTERED",
            insertDataOption="INSERT_ROWS",
            body={"values": rows_to_add},
        )


class TestListDriveSheets(unittest.TestCase):
    """list_drive_sheets 메서드 테스트"""

    def test_list_drive_sheets(self):
        """Drive 폴더 내 시트 목록을 반환하는지 확인"""
        mock_drive = MagicMock()
        mock_drive.files().list().execute.return_value = {
            "files": [
                {"id": "file1", "name": "Sheet One"},
                {"id": "file2", "name": "Sheet Two"},
            ],
        }

        client, _, _ = _make_client(mock_drive=mock_drive)
        files = client.list_drive_sheets("folder_id_abc")

        self.assertEqual(len(files), 2)
        self.assertEqual(files[0]["id"], "file1")
        self.assertEqual(files[0]["name"], "Sheet One")
        self.assertEqual(files[1]["id"], "file2")

    def test_list_drive_sheets_pagination(self):
        """페이지네이션을 통해 전체 목록을 수집하는지 확인"""
        mock_drive = MagicMock()

        # 첫 번째 페이지: nextPageToken 포함
        first_response = {
            "files": [{"id": "file1", "name": "Sheet One"}],
            "nextPageToken": "token_page2",
        }
        # 두 번째 페이지: nextPageToken 없음
        second_response = {
            "files": [{"id": "file2", "name": "Sheet Two"}],
        }

        mock_drive.files().list().execute.side_effect = [
            first_response,
            second_response,
        ]

        client, _, _ = _make_client(mock_drive=mock_drive)
        files = client.list_drive_sheets("folder_id_abc")

        self.assertEqual(len(files), 2)

    def test_list_drive_sheets_supports_all_drives(self):
        """shared drive 지원 파라미터가 포함되는지 확인"""
        mock_drive = MagicMock()
        mock_drive.files().list().execute.return_value = {"files": []}

        client, _, mock_drive = _make_client(mock_drive=mock_drive)
        client.list_drive_sheets("folder_id_abc")

        call_kwargs = mock_drive.files().list.call_args[1]
        self.assertTrue(call_kwargs.get("supportsAllDrives"))
        self.assertTrue(call_kwargs.get("includeItemsFromAllDrives"))


if __name__ == "__main__":
    unittest.main()
