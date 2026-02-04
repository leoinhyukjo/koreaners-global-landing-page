#!/usr/bin/env node
/**
 * Notion 연동 테스트 스크립트
 * - NOTION_TOKEN, NOTION_DATABASE_ID 로 DB 접근 가능 여부 확인
 * 사용: node scripts/test-notion-connection.js
 * .env.local 이 있으면 프로젝트 루트에서 실행 시 자동으로 로드합니다.
 */

const path = require('path');
const fs = require('fs');

// 프로젝트 루트의 .env.local 로드 (선택)
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
    }
  });
}

const { Client } = require('@notionhq/client');

async function main() {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!token) {
    console.error('❌ NOTION_TOKEN 이 설정되지 않았습니다.');
    console.error('   .env.local 에 넣거나, 터미널에서 export NOTION_TOKEN=... 후 실행하세요.');
    process.exit(1);
  }
  if (!databaseId) {
    console.error('❌ NOTION_DATABASE_ID 가 설정되지 않았습니다.');
    console.error('   .env.local 에 넣거나, 터미널에서 export NOTION_DATABASE_ID=... 후 실행하세요.');
    process.exit(1);
  }

  const notion = new Client({ auth: token });
  console.log('Notion DB ID:', databaseId.replace(/-/g, '').slice(0, 8) + '...');

  try {
    const db = await notion.databases.retrieve({ database_id: databaseId });
    console.log('✅ DB 연결 성공:', db.title?.[0]?.plain_text || '(제목 없음)');
    console.log('\n로컬 환경 변수와 DB ID가 올바르게 설정되어 있습니다.');
    console.log('배포 환경(Vercel)에서는 대시보드에서 NOTION_TOKEN, NOTION_DATABASE_ID 를 설정했는지 확인하세요.');
  } catch (err) {
    console.error('❌ Notion API 오류:', err.message);
    if (err.body) console.error('   body:', JSON.stringify(err.body, null, 2));
    if (err.code === 'object_not_found') {
      console.error('   → DB ID가 틀렸거나, 해당 DB에 Integration 이 연결되지 않았습니다.');
    }
    if (err.code === 'unauthorized') {
      console.error('   → 토큰이 잘못되었거나 만료되었습니다.');
    }
    process.exit(1);
  }
}

main();
