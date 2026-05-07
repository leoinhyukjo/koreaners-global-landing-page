import CareersContent from '@/components/careers-content'
import { getCareerJobs } from '@/lib/notion/careers'

export const revalidate = 60

export default async function CareersPage() {
  const initialJobs = await getCareerJobs({ includeClosed: true })
  return <CareersContent initialJobs={initialJobs} />
}
