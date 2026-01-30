-- ============================================
-- KR/JP 다국어 컬럼 추가 마이그레이션
-- ============================================
-- Supabase Dashboard > SQL Editor에서 실행하세요.
-- 기존 한국어 데이터는 title, client_name, content 등 그대로 사용 (KR).
-- 일본어는 title_jp, content_jp 등으로 저장.
-- ============================================

-- 1. portfolios: 일본어 컬럼 추가
ALTER TABLE portfolios
  ADD COLUMN IF NOT EXISTS title_jp TEXT,
  ADD COLUMN IF NOT EXISTS client_name_jp TEXT,
  ADD COLUMN IF NOT EXISTS content_jp JSONB;

COMMENT ON COLUMN portfolios.title IS '한국어 제목 (KR)';
COMMENT ON COLUMN portfolios.title_jp IS '일본어 제목 (JP)';
COMMENT ON COLUMN portfolios.client_name_jp IS '일본어 클라이언트명';
COMMENT ON COLUMN portfolios.content_jp IS '일본어 본문 (BlockNote JSON)';

-- 2. blog_posts: 일본어 컬럼 추가 (테이블이 이미 있다고 가정)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_posts') THEN
    ALTER TABLE blog_posts
      ADD COLUMN IF NOT EXISTS title_jp TEXT,
      ADD COLUMN IF NOT EXISTS summary_jp TEXT,
      ADD COLUMN IF NOT EXISTS content_jp JSONB,
      ADD COLUMN IF NOT EXISTS meta_title_jp TEXT,
      ADD COLUMN IF NOT EXISTS meta_description_jp TEXT;
  END IF;
END $$;
