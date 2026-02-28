-- blog_posts 테이블에 FAQ 컬럼 추가
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS faqs_jp JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN blog_posts.faqs IS 'FAQ 목록 (JSON 배열). 형식: [{"question": "질문", "answer": "답변"}]';
COMMENT ON COLUMN blog_posts.faqs_jp IS 'FAQ 목록 일본어 버전';
