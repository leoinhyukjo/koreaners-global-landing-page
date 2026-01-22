-- ============================================
-- Supabase 데이터베이스 스키마
-- ============================================
-- 이 SQL을 Supabase Dashboard > Table Editor > SQL Editor에 붙여넣어 실행하세요.
-- ============================================

-- 1. portfolios 테이블 생성
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT[] DEFAULT '{}',
  link TEXT,
  content JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. creators 테이블 생성
CREATE TABLE IF NOT EXISTS creators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  profile_image_url TEXT,
  instagram_url TEXT,
  youtube_url TEXT,
  tiktok_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_portfolios_category ON portfolios USING GIN(category);
CREATE INDEX IF NOT EXISTS idx_portfolios_created_at ON portfolios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creators_created_at ON creators(created_at DESC);

-- 4. RLS (Row Level Security) 정책 설정
-- 참고: 실제 운영 환경에서는 적절한 RLS 정책을 설정해야 합니다.
-- 여기서는 모든 사용자가 읽기/쓰기 가능하도록 설정합니다.
-- (보안을 위해 나중에 인증 기반 정책으로 변경하는 것을 권장합니다)

ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

-- 포트폴리오 테이블 정책
CREATE POLICY "Allow public read access on portfolios" ON portfolios
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on portfolios" ON portfolios
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on portfolios" ON portfolios
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on portfolios" ON portfolios
  FOR DELETE USING (true);

-- 크리에이터 테이블 정책
CREATE POLICY "Allow public read access on creators" ON creators
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on creators" ON creators
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on creators" ON creators
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on creators" ON creators
  FOR DELETE USING (true);

-- ============================================
-- Storage 버킷 생성 (이미지 업로드용)
-- ============================================
-- Supabase Dashboard > Storage에서 'uploads' 버킷을 생성하거나
-- 아래 SQL을 실행하세요.

-- Storage 버킷 생성 (이미 존재하면 무시됨)
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage 정책 설정 (모든 사용자가 업로드/읽기 가능)
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Allow public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'uploads');

CREATE POLICY "Allow public delete access" ON storage.objects
  FOR DELETE USING (bucket_id = 'uploads');
