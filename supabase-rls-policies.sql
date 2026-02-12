-- ========================================
-- Supabase Row Level Security (RLS) Policies
-- ========================================
--
-- 이 스크립트를 Supabase Dashboard의 SQL Editor에서 실행하세요.
-- 경로: Dashboard → SQL Editor → New Query
--
-- 목적: 모든 테이블에 RLS를 활성화하여 데이터 보안 강화
-- ========================================

-- 1. 모든 테이블에 RLS 활성화
ALTER TABLE IF EXISTS portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS creator_applications ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (재실행 시 중복 방지)
DROP POLICY IF EXISTS "Public read access portfolios" ON portfolios;
DROP POLICY IF EXISTS "Admin full access portfolios" ON portfolios;

DROP POLICY IF EXISTS "Public read published posts" ON blog_posts;
DROP POLICY IF EXISTS "Admin full access blog_posts" ON blog_posts;

DROP POLICY IF EXISTS "Public read creators" ON creators;
DROP POLICY IF EXISTS "Admin full access creators" ON creators;

DROP POLICY IF EXISTS "Public insert inquiries" ON inquiries;
DROP POLICY IF EXISTS "Admin read inquiries" ON inquiries;
DROP POLICY IF EXISTS "Admin delete inquiries" ON inquiries;

DROP POLICY IF EXISTS "Public insert applications" ON creator_applications;
DROP POLICY IF EXISTS "Admin read applications" ON creator_applications;
DROP POLICY IF EXISTS "Admin delete applications" ON creator_applications;

-- ========================================
-- 2. Portfolios 테이블 정책
-- ========================================

-- 모든 사용자가 읽기 가능
CREATE POLICY "Public read access portfolios"
ON portfolios
FOR SELECT
USING (true);

-- 인증된 사용자(Admin)만 모든 작업 가능
CREATE POLICY "Admin full access portfolios"
ON portfolios
FOR ALL
USING (auth.role() = 'authenticated');

-- ========================================
-- 3. Blog Posts 테이블 정책
-- ========================================

-- published=true인 포스트만 public 읽기 가능
CREATE POLICY "Public read published posts"
ON blog_posts
FOR SELECT
USING (published = true);

-- 인증된 사용자(Admin)만 모든 작업 가능
CREATE POLICY "Admin full access blog_posts"
ON blog_posts
FOR ALL
USING (auth.role() = 'authenticated');

-- ========================================
-- 4. Creators 테이블 정책
-- ========================================

-- 모든 사용자가 읽기 가능
CREATE POLICY "Public read creators"
ON creators
FOR SELECT
USING (true);

-- 인증된 사용자(Admin)만 모든 작업 가능
CREATE POLICY "Admin full access creators"
ON creators
FOR ALL
USING (auth.role() = 'authenticated');

-- ========================================
-- 5. Inquiries 테이블 정책
-- ========================================

-- 누구나 문의 제출 가능 (INSERT만)
CREATE POLICY "Public insert inquiries"
ON inquiries
FOR INSERT
WITH CHECK (true);

-- 인증된 사용자(Admin)만 읽기 가능
CREATE POLICY "Admin read inquiries"
ON inquiries
FOR SELECT
USING (auth.role() = 'authenticated');

-- 인증된 사용자(Admin)만 삭제 가능
CREATE POLICY "Admin delete inquiries"
ON inquiries
FOR DELETE
USING (auth.role() = 'authenticated');

-- ========================================
-- 6. Creator Applications 테이블 정책
-- ========================================

-- 누구나 지원서 제출 가능 (INSERT만)
CREATE POLICY "Public insert applications"
ON creator_applications
FOR INSERT
WITH CHECK (true);

-- 인증된 사용자(Admin)만 읽기 가능
CREATE POLICY "Admin read applications"
ON creator_applications
FOR SELECT
USING (auth.role() = 'authenticated');

-- 인증된 사용자(Admin)만 삭제 가능
CREATE POLICY "Admin delete applications"
ON creator_applications
FOR DELETE
USING (auth.role() = 'authenticated');

-- ========================================
-- 7. 정책 확인 (실행 후 확인용 쿼리)
-- ========================================

-- RLS 활성화 상태 확인
SELECT
  schemaname,
  tablename,
  rowsecurity AS "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('portfolios', 'blog_posts', 'creators', 'inquiries', 'creator_applications')
ORDER BY tablename;

-- 정책 목록 확인
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ========================================
-- 완료!
-- ========================================
--
-- 다음 단계:
-- 1. 위의 확인 쿼리 결과에서 RLS Enabled가 true인지 확인
-- 2. 각 테이블에 정책이 올바르게 적용되었는지 확인
-- 3. 프론트엔드에서 CRUD 작업 테스트
--    - 비로그인: 읽기만 가능
--    - 로그인(Admin): 모든 작업 가능
--
-- ========================================
