const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN || process.env.NOTION_API_KEY });
// 하이픈 추가된 형식으로 변환
const databaseId = '2f601ca3-e480-8067-94b5-ec5b85167f35';

async function fetchCreators() {
  try {
    const response = await notion.databases.query({
      database_id: databaseId
    });
    
    console.log('=== 크리에이터 수:', response.results.length);
    
    response.results.forEach((page, index) => {
      console.log(`\n--- 크리에이터 ${index + 1} ---`);
      console.log('ID:', page.id);
      
      // 속성 출력
      Object.keys(page.properties).forEach(key => {
        const prop = page.properties[key];
        console.log(`${key}:`, JSON.stringify(prop, null, 2));
      });
    });
  } catch (error) {
    console.error('에러:', error.message);
    if (error.body) console.error('상세:', JSON.stringify(error.body, null, 2));
  }
}

fetchCreators();
