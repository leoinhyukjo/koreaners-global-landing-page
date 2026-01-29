import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

// Notion 클라이언트 초기화
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

/**
 * Notion 데이터베이스에 문의 데이터를 저장하는 API 엔드포인트
 * 
 * 환경 변수 설정 필요:
 * - NOTION_TOKEN: Notion Integration Token
 * - NOTION_DATABASE_ID: Notion Database ID
 * 
 * Notion Database 속성 예시:
 * - Name (title): 성함
 * - Company (rich_text): 회사명
 * - Position (rich_text): 직급
 * - Email (email): 이메일
 * - Phone (rich_text): 전화번호 (텍스트 유형)
 * - Message (rich_text): 문의내용
 * - Privacy Agreement (checkbox): 개인정보 동의
 * - Marketing Agreement (checkbox): 마케팅 동의
 */
export async function POST(request: NextRequest) {
  // properties 변수를 함수 스코프 상단에 선언하여 catch 블록에서도 접근 가능하도록 함
  let properties: Record<string, any> | null = null

  try {
    // 환경 변수 확인 및 로깅
    console.log('[Notion API] 환경 변수 확인 중...')
    console.log('[Notion API] NOTION_TOKEN 존재 여부:', !!process.env.NOTION_TOKEN)
    console.log('[Notion API] NOTION_TOKEN 길이:', process.env.NOTION_TOKEN?.length || 0)
    console.log('[Notion API] NOTION_DATABASE_ID 존재 여부:', !!process.env.NOTION_DATABASE_ID)
    console.log('[Notion API] NOTION_DATABASE_ID:', process.env.NOTION_DATABASE_ID || '없음')

    if (!process.env.NOTION_TOKEN) {
      console.error('[Notion API] NOTION_TOKEN이 설정되지 않았습니다.')
      return NextResponse.json(
        { error: 'Notion 토큰이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    if (!process.env.NOTION_DATABASE_ID) {
      console.error('[Notion API] NOTION_DATABASE_ID가 설정되지 않았습니다.')
      return NextResponse.json(
        { error: 'Notion 데이터베이스 ID가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 요청 본문 파싱
    const body = await request.json()
    console.log('[Notion API] 받은 요청 데이터:', {
      name: body.name,
      company: body.company,
      position: body.position,
      email: body.email,
      phone: body.phone,
      message: body.message?.substring(0, 50) + '...',
      privacy_agreement: body.privacy_agreement,
      marketing_agreement: body.marketing_agreement,
    })

    const {
      name,
      company,
      position,
      email,
      phone,
      message,
      privacy_agreement,
      marketing_agreement,
    } = body

    // 필수 필드 검증 (name, email, message만 필수 / phone, company, position은 선택)
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: '성함을 입력해주세요.' }, { status: 400 })
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: '이메일을 입력해주세요.' }, { status: 400 })
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: '문의내용을 입력해주세요.' }, { status: 400 })
    }

    const trim = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
    const has = (v: unknown) => trim(v).length > 0

    // Notion 데이터베이스에 페이지 생성
    // ⚠️ 속성 이름은 Notion DB와 정확히 일치해야 합니다. 선택 필드는 값이 있을 때만 포함합니다.
    properties = {
      Name: {
        title: [{ text: { content: trim(name) } }],
      },
      Message: {
        rich_text: [{ text: { content: trim(message) } }],
      },
      'Privacy Agreement': {
        checkbox: Boolean(privacy_agreement),
      },
      'Marketing Agreement': {
        checkbox: Boolean(marketing_agreement),
      },
    }

    // Email: 값이 있을 때만 포함 (Notion email 타입은 빈 값 시 validation_error 발생 가능)
    if (has(email)) {
      (properties as Record<string, unknown>)['Email'] = { email: trim(email) }
    }

    // 선택 필드: 값이 있을 때만 포함 (빈 문자열/undefined 전송 시 에러 방지)
    if (has(company)) {
      (properties as Record<string, unknown>)['Company'] = {
        rich_text: [{ text: { content: trim(company) } }],
      }
    }
    if (has(position)) {
      (properties as Record<string, unknown>)['Position'] = {
        rich_text: [{ text: { content: trim(position) } }],
      }
    }
    if (has(phone)) {
      (properties as Record<string, unknown>)['Phone'] = {
        rich_text: [{ text: { content: trim(phone) } }],
      }
    }

    console.log('[Notion API] Notion API 호출 시작...')
    console.log('[Notion API] Database ID:', process.env.NOTION_DATABASE_ID)
    console.log('[Notion API] ====== 전송할 Properties (상세) ======')
    console.log('[Notion API] Properties JSON:', JSON.stringify(properties, null, 2))
    console.log('[Notion API] 속성 이름 목록:', Object.keys(properties))
    console.log('[Notion API] ======================================')

    const response = await notion.pages.create({
      parent: {
        database_id: process.env.NOTION_DATABASE_ID,
      },
      properties,
    })

    console.log('[Notion API] ✅ 문의 데이터가 성공적으로 저장되었습니다!')
    console.log('[Notion API] Page ID:', response.id)
    console.log('[Notion API] Response:', JSON.stringify(response, null, 2))

    return NextResponse.json(
      { success: true, pageId: response.id },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[Notion API] ❌ 에러 발생!')
    console.error('[Notion API] 에러 타입:', typeof error)
    console.error('[Notion API] 에러 객체:', error)
    console.error('[Notion API] 에러 메시지:', error?.message)
    console.error('[Notion API] 에러 코드:', error?.code)
    console.error('[Notion API] 에러 스택:', error?.stack)
    
    // Notion API 에러 상세 정보
    if (error?.body) {
      console.error('[Notion API] 에러 본문:', JSON.stringify(error.body, null, 2))
    }
    
    if (error?.response) {
      console.error('[Notion API] 에러 응답:', JSON.stringify(error.response, null, 2))
    }

    // Notion API 에러 처리
    if (error.code === 'object_not_found') {
      console.error('[Notion API] 데이터베이스를 찾을 수 없습니다. Database ID를 확인하세요.')
      return NextResponse.json(
        { 
          error: 'Notion 데이터베이스를 찾을 수 없습니다. 데이터베이스 ID를 확인해주세요.',
          details: error.message,
        },
        { status: 404 }
      )
    }

    if (error.code === 'unauthorized') {
      console.error('[Notion API] 인증 실패. Integration Token을 확인하세요.')
      return NextResponse.json(
        { 
          error: 'Notion 인증에 실패했습니다. 토큰을 확인해주세요.',
          details: error.message,
        },
        { status: 401 }
      )
    }

    if (error.code === 'validation_error') {
      const path = error?.body?.path ?? 'unknown'
      const bodyMessage = error?.body?.message ?? error?.message ?? ''
      console.error('[Notion API] ❌ validation_error — 필드 경로:', path, '| 메시지:', bodyMessage)
      if (error?.body) {
        console.error('[Notion API] 에러 본문:', JSON.stringify(error.body, null, 2))
      }
      if (properties) {
        console.error('[Notion API] 전송했던 Properties 키:', Object.keys(properties))
      }
      return NextResponse.json(
        {
          error: 'Notion 데이터베이스 속성 검증에 실패했습니다.',
          validationError: { path, message: bodyMessage },
          body: error?.body ?? null,
          sentPropertyKeys: properties ? Object.keys(properties) : null,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: error.message || 'Notion 데이터 저장 중 오류가 발생했습니다.',
        code: error.code,
        details: error.body || error.response,
      },
      { status: 500 }
    )
  }
}
