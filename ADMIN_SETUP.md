# 관리자 페이지 설정 가이드

## 1. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase 설정 값 가져오기

1. [Supabase Dashboard](https://app.supabase.com)에 로그인
2. 프로젝트 선택 (또는 새 프로젝트 생성)
3. Settings > API 메뉴로 이동
4. 다음 값들을 복사:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. 데이터베이스 스키마 설정

1. Supabase Dashboard > SQL Editor로 이동
2. `supabase-schema.sql` 파일의 내용을 복사하여 붙여넣기
3. Run 버튼을 클릭하여 실행

## 3. Storage 버킷 설정

1. Supabase Dashboard > Storage로 이동
2. "New bucket" 버튼 클릭
3. Bucket name: `uploads`
4. Public bucket: ✅ 체크
5. Create bucket 클릭

또는 SQL Editor에서 `supabase-schema.sql`의 Storage 관련 SQL을 실행하면 자동으로 생성됩니다.

## 4. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 `http://localhost:3000/admin`으로 접속하여 관리자 페이지를 확인하세요.

## 보안 참고사항

현재 RLS 정책은 모든 사용자가 읽기/쓰기 가능하도록 설정되어 있습니다. 
실제 운영 환경에서는 인증 기반 정책으로 변경하는 것을 강력히 권장합니다.
