-- ============================================
-- Campaign Flywheel Schema Migration
-- Date: 2026-03-30
-- ============================================

-- 1. campaign_posts 테이블 (크리에이터 콘텐츠 성과)
CREATE TABLE IF NOT EXISTS campaign_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  brand_name TEXT NOT NULL,
  creator_name TEXT,
  ig_handle TEXT,
  post_url TEXT NOT NULL UNIQUE,
  post_type TEXT CHECK (post_type IN ('reels', 'feed', 'story')),
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  collected_at TIMESTAMPTZ,
  source_sheet_id TEXT,
  campaign_code TEXT
);

-- campaign_posts 인덱스
CREATE INDEX IF NOT EXISTS idx_campaign_posts_brand_name ON campaign_posts(brand_name);
CREATE INDEX IF NOT EXISTS idx_campaign_posts_ig_handle ON campaign_posts(ig_handle);
CREATE INDEX IF NOT EXISTS idx_campaign_posts_campaign_code ON campaign_posts(campaign_code);
CREATE INDEX IF NOT EXISTS idx_campaign_posts_collected_at ON campaign_posts(collected_at DESC);

-- 2. campaign_financials 테이블 (캠페인 재무 데이터)
CREATE TABLE IF NOT EXISTS campaign_financials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_code TEXT NOT NULL UNIQUE,
  company_name TEXT,
  brand_name TEXT NOT NULL,
  campaign_type TEXT,
  media TEXT,
  contract_amount_krw NUMERIC DEFAULT 0,
  contract_amount_jpy NUMERIC DEFAULT 0,
  contract_amount_usd NUMERIC DEFAULT 0,
  cost_krw NUMERIC DEFAULT 0,
  cost_jpy NUMERIC DEFAULT 0,
  margin_krw NUMERIC DEFAULT 0,
  status TEXT,
  start_date DATE,
  end_date DATE,
  pm_primary TEXT,
  pm_secondary TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- campaign_financials 인덱스
CREATE INDEX IF NOT EXISTS idx_campaign_financials_brand_name ON campaign_financials(brand_name);
CREATE INDEX IF NOT EXISTS idx_campaign_financials_status ON campaign_financials(status);
CREATE INDEX IF NOT EXISTS idx_campaign_financials_start_date ON campaign_financials(start_date DESC);

-- 3. campaign_reviews 테이블 (리뷰 기록)
CREATE TABLE IF NOT EXISTS campaign_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  review_type TEXT NOT NULL CHECK (review_type IN ('completion', 'periodic')),
  period_start DATE,
  period_end DATE,
  campaign_code TEXT,
  insights_json JSONB,
  action_items TEXT[],
  notion_page_id TEXT
);

-- campaign_reviews 인덱스
CREATE INDEX IF NOT EXISTS idx_campaign_reviews_review_type ON campaign_reviews(review_type);
CREATE INDEX IF NOT EXISTS idx_campaign_reviews_created_at ON campaign_reviews(created_at DESC);

-- ============================================
-- Row Level Security (RLS) 설정
-- ============================================

-- campaign_posts RLS
ALTER TABLE campaign_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_campaign_posts" ON campaign_posts
  FOR SELECT USING (true);

CREATE POLICY "service_write_campaign_posts" ON campaign_posts
  FOR ALL USING (true);

-- campaign_financials RLS
ALTER TABLE campaign_financials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_campaign_financials" ON campaign_financials
  FOR SELECT USING (true);

CREATE POLICY "service_write_campaign_financials" ON campaign_financials
  FOR ALL USING (true);

-- campaign_reviews RLS
ALTER TABLE campaign_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_campaign_reviews" ON campaign_reviews
  FOR SELECT USING (true);

CREATE POLICY "service_write_campaign_reviews" ON campaign_reviews
  FOR ALL USING (true);
