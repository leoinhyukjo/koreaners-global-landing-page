import { Client } from '@notionhq/client'

export type CareerJob = {
  id: string
  title: string
  status: string
  startDate: string | null
  note: string
  applyUrl: string | null
  jdUrl: string | null
}

const PUBLIC_NOTION_PREFIX = 'https://descriptive-wallflower-afd.notion.site/'

function mapPage(page: any): CareerJob {
  const props = page.properties
  const title =
    props['공고명']?.title?.[0]?.plain_text ??
    props['Name']?.title?.[0]?.plain_text ??
    ''
  const status = props['채용현황']?.select?.name ?? ''
  const startDate = props['채용개시일']?.date?.start ?? null
  const note =
    props['비고']?.rich_text?.[0]?.plain_text ??
    props['Note']?.rich_text?.[0]?.plain_text ??
    ''
  const applyUrl: string | null = props['지원 링크']?.url ?? null
  const rawJdUrl: string | null = props['JD']?.url ?? null
  const jdUrl = rawJdUrl
    ? rawJdUrl.replace('https://www.notion.so/', PUBLIC_NOTION_PREFIX).split('?')[0]
    : null

  return { id: page.id, title, status, startDate, note, applyUrl, jdUrl }
}

function sortJobs(jobs: CareerJob[]): CareerJob[] {
  return [...jobs].sort((a, b) => {
    const aOpen = a.status === '채용중' ? 0 : 1
    const bOpen = b.status === '채용중' ? 0 : 1
    if (aOpen !== bOpen) return aOpen - bOpen
    return (b.startDate ?? '').localeCompare(a.startDate ?? '')
  })
}

export async function getCareerJobs(options: { includeClosed?: boolean } = {}): Promise<CareerJob[]> {
  if (!process.env.NOTION_CAREERS_TOKEN || !process.env.NOTION_CAREERS_DATASOURCE_ID) {
    return []
  }
  try {
    const notion = new Client({ auth: process.env.NOTION_CAREERS_TOKEN })
    const filter = options.includeClosed
      ? {
          or: [
            { property: '채용현황', select: { equals: '채용중' } },
            { property: '채용현황', select: { equals: '채용마감' } },
          ],
        }
      : { property: '채용현황', select: { equals: '채용중' } }

    const response = await notion.dataSources.query({
      data_source_id: process.env.NOTION_CAREERS_DATASOURCE_ID,
      filter,
    })
    return sortJobs(response.results.map(mapPage))
  } catch (error: any) {
    console.error('[careers] Notion fetch failed:', error?.message ?? error)
    return []
  }
}
