const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function searchDatabases() {
  try {
    const response = await notion.search({
      filter: { property: 'object', value: 'database' },
      page_size: 100
    });
    
    console.log('=== 노션 데이터베이스 목록 ===');
    response.results.forEach((db, index) => {
      const title = db.title?.[0]?.plain_text || '제목 없음';
      console.log(`${index + 1}. ${title} (ID: ${db.id})`);
    });
    
    // 크리에이터 관련 데이터베이스 찾기
    const creatorDb = response.results.find(db => {
      const title = (db.title?.[0]?.plain_text || '').toLowerCase();
      return title.includes('creator') || title.includes('크리에이터');
    });
    
    if (creatorDb) {
      console.log('\n=== 크리에이터 데이터베이스 발견 ===');
      console.log('ID:', creatorDb.id);
      console.log('제목:', creatorDb.title?.[0]?.plain_text);
      
      // 데이터베이스 내용 조회
      const pages = await notion.databases.query({
        database_id: creatorDb.id
      });
      
      console.log('\n=== 크리에이터 목록 ===');
      console.log(JSON.stringify(pages.results, null, 2));
    } else {
      console.log('\n크리에이터 데이터베이스를 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('에러:', error.message);
  }
}

searchDatabases();
