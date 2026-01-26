# Notion 데이터베이스 연동 설정 가이드

문의하기 폼 제출 시 Supabase와 함께 Notion 데이터베이스에도 자동으로 저장되도록 설정하는 방법입니다.

## 1. Notion Integration 생성

1. [Notion Integrations](https://www.notion.so/my-integrations) 페이지에 접속
2. "New integration" 버튼 클릭
3. Integration 이름 입력 (예: "Koreaners Global Landing Page")
4. Workspace 선택
5. "Submit" 클릭하여 Integration 생성
6. 생성된 Integration의 **Internal Integration Token** 복사

## 2. Notion 데이터베이스 생성 및 설정

1. Notion에서 새 데이터베이스를 생성하거나 기존 데이터베이스 사용
2. 데이터베이스 페이지에서 우측 상단 "..." 메뉴 클릭
3. "Connections" → 생성한 Integration 선택하여 연결
4. 데이터베이스 URL에서 **Database ID** 추출
   - URL 형식: `https://www.notion.so/workspace-name/DATABASE_ID?v=...`
   - `DATABASE_ID` 부분을 복사 (32자리 문자열, 하이픈 포함)

## 3. 데이터베이스 속성(Properties) 설정

다음 속성들을 데이터베이스에 추가하세요:

| 속성 이름 | 속성 타입 | 설명 |
|---------|---------|------|
| Name | Title | 성함 (필수) |
| Company | Rich text | 회사명 |
| Position | Rich text | 직급 |
| Email | Email | 이메일 (필수) |
| Phone | Phone number | 전화번호 (필수) |
| Message | Rich text | 문의내용 (필수) |
| Privacy Agreement | Checkbox | 개인정보 동의 |
| Marketing Agreement | Checkbox | 마케팅 동의 |

**⚠️ 중요:** 
- 속성 이름은 **정확히** 위와 같이 설정해야 합니다. 
- **대소문자를 구분**하므로 `Name`, `Email`, `Phone` 등이 정확히 일치해야 합니다.
- `Privacy Agreement`와 `Marketing Agreement`는 **공백이 포함**되어 있습니다.
- 속성 이름이 다르면 `validation_error`가 발생합니다.

## 4. 환경 변수 설정

프로젝트 루트의 `.env.local` 파일에 다음 환경 변수를 추가하세요:

```env
# Notion Integration Token
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Notion Database ID
NOTION_DATABASE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**중요:**
- `.env.local` 파일은 Git에 커밋하지 마세요 (이미 `.gitignore`에 포함되어 있음)
- 프로덕션 환경(Vercel 등)에서는 환경 변수를 별도로 설정해야 합니다

## 5. 테스트

1. 개발 서버 실행: `npm run dev`
2. 문의하기 폼에 테스트 데이터 입력 후 제출
3. 브라우저 콘솔에서 로그 확인:
   - `[Contact Form] Success:` - Supabase 저장 성공
   - `[Contact Form] Notion 저장 성공` - Notion 저장 성공
4. Notion 데이터베이스에서 새로 생성된 페이지 확인

## 6. 문제 해결

### Notion 저장이 실패하는 경우

1. **환경 변수 확인**
   - `.env.local` 파일에 `NOTION_TOKEN`과 `NOTION_DATABASE_ID`가 올바르게 설정되었는지 확인
   - 개발 서버를 재시작했는지 확인 (환경 변수 변경 시 필요)

2. **Integration 권한 확인**
   - Notion 데이터베이스에 Integration이 연결되어 있는지 확인
   - 데이터베이스 페이지 → "..." 메뉴 → "Connections" 확인

3. **속성 이름 확인**
   - 데이터베이스 속성 이름이 정확히 일치하는지 확인 (대소문자 포함)
   - 속성 타입이 올바른지 확인

4. **콘솔 로그 확인**
   - 브라우저 개발자 도구 콘솔에서 에러 메시지 확인
   - 서버 로그에서 상세 에러 확인

### 일반적인 에러

- **`object_not_found`**: 데이터베이스 ID가 잘못되었거나 Integration이 데이터베이스에 연결되지 않음
- **`unauthorized`**: Integration Token이 잘못되었거나 만료됨
- **`validation_error`**: 속성 이름이나 타입이 일치하지 않음

## 7. 프로덕션 배포 시 주의사항

Vercel 등에 배포할 때는 환경 변수를 별도로 설정해야 합니다:

1. Vercel 대시보드 → 프로젝트 선택
2. Settings → Environment Variables
3. 다음 변수 추가:
   - `NOTION_TOKEN`
   - `NOTION_DATABASE_ID`
4. 배포 재실행

## 참고 자료

- [Notion API 공식 문서](https://developers.notion.com/)
- [Notion Integration 가이드](https://developers.notion.com/docs/getting-started)
