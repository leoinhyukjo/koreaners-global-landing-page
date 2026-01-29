'use client'

export const dynamic = 'force-dynamic'

import { PortfolioEditForm } from '@/components/admin/portfolio-edit-form'

export default function NewPortfolioPage() {
  return <PortfolioEditForm portfolioId={null} />
}
