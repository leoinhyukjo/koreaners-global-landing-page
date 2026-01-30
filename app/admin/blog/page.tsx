import type { Metadata } from 'next'
import { BlogListPage } from '@/components/admin/blog-list-page'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '블로그',
}

export default function AdminBlogPage() {
  return <BlogListPage />
}
