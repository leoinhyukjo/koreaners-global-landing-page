'use client'

export const dynamic = 'force-dynamic'

import { useParams } from 'next/navigation'
import { PortfolioEditForm } from '@/components/admin/portfolio-edit-form'

export default function EditPortfolioPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : null
  return <PortfolioEditForm portfolioId={id} />
}
