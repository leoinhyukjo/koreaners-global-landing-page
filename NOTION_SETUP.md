# Notion 데이터베이스 연동 설정 가이드

문의하기 폼 제출 시 Supabase와 함께 Notion 데이터베이스에도 자동으로 저장되도록 설정하는 방법입니다.

## 1. Notion Integration 생성

1. [Notion Integrations](https://www.notion.so/my-integrations) 페이지에 접속
2. "New integration" 버튼 클릭
3. Integration 이름 입력 (예: "Koreaners Landing Page")
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
- **프로덕션(Vercel)**: Vercel 대시보드 → 프로젝트 → Settings → Environment Variables 에 `NOTION_TOKEN`, `NOTION_DATABASE_ID` 를 **반드시** 설정하세요. 설정하지 않으면 문의 폼 제출 시 노션에 저장되지 않습니다.
- 도메인을 `koreaners.co` 등으로 변경한 경우에도 위 두 변수만 올바르게 설정되어 있으면 됩니다. API 쪽 CORS 허용 목록에는 이미 `https://koreaners.co`, `https://www.koreaners.co` 가 포함되어 있습니다.

## 5. CORS / 허용 도메인

문의 API(`/api/notion`)는 아래 Origin만 허용합니다. 도메인 변경 시 `app/api/notion/route.ts` 의 `ALLOWED_ORIGINS` 에 추가하세요.

- `https://koreaners.co`
- `https://www.koreaners.co`
- `http://localhost:3000`, `http://127.0.0.1:3000`
- `https://*.vercel.app` (프리뷰 배포 자동 허용)

다른 도메인에서 폼을 제출하면 CORS 오류가 나므로, 프로덕션은 위 목록에 있는 도메인으로 접속해 테스트하세요.

## 6. 테스트

### 6.1 브라우저(로컬)

1. 개발 서버 실행: `npm run dev`
2. `http://localhost:3000/contact` 에서 문의하기 폼에 테스트 데이터 입력 후 제출
3. 브라우저 콘솔에서 로그 확인:
   - `[Contact Form] Success:` - Supabase 저장 성공
   - `[Contact Form] Notion 저장 성공` - Notion 저장 성공
4. Notion 데이터베이스에서 새로 생성된 페이지 확인

### 6.2 API 직접 호출(로컬)

서버가 떠 있는 상태에서:

```bash
curl -X POST http://localhost:3000/api/notion \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"name":"테스트","email":"test@example.com","phone":"010-0000-0000","message":"연동 테스트","privacyAgreement":true,"marketingAgreement":false}'
```

성공 시 `{"ok":true}`, 실패 시 `{"error":"..."}` 와 HTTP 상태 코드로 원인 확인.

### 6.3 배포 환경(koreaners.co)

1. `https://koreaners.co/contact` (또는 `https://www.koreaners.co/contact`) 에서 문의 폼 제출
2. 브라우저 개발자 도구 → Network 탭에서 `/api/notion` 요청이 200 인지, 응답 본문에 `ok: true` 가 있는지 확인
3. Notion DB에 새 행이 생겼는지 확인

배포 환경에서 실패할 경우:
- Vercel 대시보드에서 `NOTION_TOKEN`, `NOTION_DATABASE_ID` 가 설정되어 있는지 확인
- Vercel 함수 로그에서 `[Notion API]` 로 시작하는 에러 메시지 확인

### 6.4 노션 연동 테스트 스크립트(로컬)

환경 변수와 DB 접근만 검증하려면:

```bash
node scripts/test-notion-connection.js
```

- `.env.local` 이 프로젝트 루트에 있으면 자동으로 로드합니다.
- 성공 시: `✅ DB 연결 성공` 및 DB 제목 출력.
- 실패 시: `object_not_found`, `unauthorized` 등 원인 메시지 출력.

## 7. 문제 해결

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

## 8. 프로덕션 배포 시 주의사항

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
