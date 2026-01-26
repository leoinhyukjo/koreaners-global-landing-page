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

    // 필수 필드 검증
    if (!name || !email || !phone || !message) {
      console.error('[Notion API] 필수 필드 누락:', {
        name: !!name,
        email: !!email,
        phone: !!phone,
        message: !!message,
      })
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // Notion 데이터베이스에 페이지 생성
    // ⚠️ 중요: 아래 속성 이름은 Notion 데이터베이스의 속성 이름과 정확히 일치해야 합니다!
    // 속성 이름은 대소문자를 구분하므로 정확히 일치해야 합니다.
    // 
    // 필드명 대소문자 확인:
    // - Name (대문자 N)
    // - Company (대문자 C)
    // - Position (대문자 P)
    // - Email (대문자 E)
    // - Phone (대문자 P)
    // - Message (대문자 M)
    // - Privacy Agreement (대문자 P, A, 공백 포함)
    // - Marketing Agreement (대문자 M, A, 공백 포함)
    const properties = {
      // Name (title 타입) - Notion DB 속성 이름: "Name"
      Name: {
        title: [
          {
            text: {
              content: name,
            },
          },
        ],
      },
      // Company (rich_text 타입) - Notion DB 속성 이름: "Company"
      Company: {
        rich_text: [
          {
            text: {
              content: company || '',
            },
          },
        ],
      },
      // Position (rich_text 타입) - Notion DB 속성 이름: "Position"
      Position: {
        rich_text: [
          {
            text: {
              content: position || '',
            },
          },
        ],
      },
      // Email (email 타입) - Notion DB 속성 이름: "Email"
      Email: {
        email: email || null,
      },
      // Phone (rich_text 타입) - Notion DB 속성 이름: "Phone" (텍스트 유형)
      Phone: {
        rich_text: [
          {
            text: {
              content: phone || '',
            },
          },
        ],
      },
      // Message (rich_text 타입) - Notion DB 속성 이름: "Message"
      Message: {
        rich_text: [
          {
            text: {
              content: message || '',
            },
          },
        ],
      },
      // Privacy Agreement (checkbox 타입) - Notion DB 속성 이름: "Privacy Agreement" (공백 포함)
      'Privacy Agreement': {
        checkbox: privacy_agreement || false,
      },
      // Marketing Agreement (checkbox 타입) - Notion DB 속성 이름: "Marketing Agreement" (공백 포함)
      'Marketing Agreement': {
        checkbox: marketing_agreement || false,
      },
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
      console.error('[Notion API] ❌ 속성 검증 실패!')
      console.error('[Notion API] 에러 메시지:', error.message)
      
      // Notion API validation_error는 보통 어떤 필드에서 문제가 났는지 구체적인 정보를 제공합니다
      if (error.body) {
        console.error('[Notion API] ====== 상세 에러 정보 ======')
        console.error('[Notion API] 에러 본문 (전체):', JSON.stringify(error.body, null, 2))
        
        // validation_error의 경우 보통 path와 message를 포함합니다
        if (error.body.path) {
          console.error('[Notion API] 문제가 발생한 필드 경로:', error.body.path)
        }
        if (error.body.message) {
          console.error('[Notion API] 구체적인 에러 메시지:', error.body.message)
        }
        if (error.body.code) {
          console.error('[Notion API] 에러 코드:', error.body.code)
        }
        console.error('[Notion API] =========================')
      }
      
      // 요청했던 properties도 함께 출력하여 비교 가능하게 함
      console.error('[Notion API] 전송했던 Properties:', JSON.stringify(properties, null, 2))
      
      return NextResponse.json(
        { 
          error: 'Notion 데이터베이스 속성 검증에 실패했습니다. 속성 이름과 타입을 확인해주세요.',
          details: error.message,
          body: error.body,
          sentProperties: properties,
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
