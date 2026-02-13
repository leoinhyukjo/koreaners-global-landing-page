import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

const notion = new Client({
  auth: process.env.NOTION_CAREERS_TOKEN,
})

export async function GET() {
  try {
    if (!process.env.NOTION_CAREERS_TOKEN || !process.env.NOTION_CAREERS_DATASOURCE_ID) {
      return NextResponse.json(
        { error: 'Careers API is not configured.' },
        { status: 500 },
      )
    }

    const response = await notion.dataSources.query({
      data_source_id: process.env.NOTION_CAREERS_DATASOURCE_ID!,
      filter: {
        property: '채용현황',
        select: {
          equals: '채용중',
        },
      },
    })

    const jobs = response.results.map((page: any) => {
      const props = page.properties
      const title =
        props['공고명']?.title?.[0]?.plain_text ??
        props['Name']?.title?.[0]?.plain_text ??
        ''
      const status =
        props['채용현황']?.select?.name ?? ''
      const startDate =
        props['채용개시일']?.date?.start ??
        null
      const note =
        props['비고']?.rich_text?.[0]?.plain_text ??
        props['Note']?.rich_text?.[0]?.plain_text ??
        ''
      const applyUrl: string | null = props['지원 링크']?.url ?? null
      const rawJdUrl: string | null = props['JD']?.url ?? null
      const jdUrl = rawJdUrl
        ? rawJdUrl.replace('https://www.notion.so/', 'https://descriptive-wallflower-afd.notion.site/').split('?')[0]
        : null

      return {
        id: page.id,
        title,
        status,
        startDate,
        note,
        jdUrl,
        applyUrl,
      }
    })

    return NextResponse.json(jobs, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    })
  } catch (error: any) {
    console.error('[Careers API] Error:', error?.message ?? error)
    return NextResponse.json(
      { error: 'Failed to fetch career postings.' },
      { status: 500 },
    )
  }
}
