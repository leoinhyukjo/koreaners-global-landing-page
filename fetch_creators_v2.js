const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN || process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID || process.env.NOTION_CREATORS_DATABASE_ID;

async function fetchCreators() {
  try {
    console.log('노션 API 호출 중...');
    const response = await notion.request({
      path: `databases/${databaseId}/query`,
      method: 'POST',
      body: {}
    });
    
    console.log('=== 크리에이터 수:', response.results.length);
    
    const creators = response.results.map((page, index) => {
      const props = page.properties;
      const data = {
        index: index + 1,
        id: page.id
      };
      
      // 각 속성 파싱
      Object.keys(props).forEach(key => {
        const prop = props[key];
        if (prop.type === 'title' && prop.title.length > 0) {
          data[key] = prop.title[0].plain_text;
        } else if (prop.type === 'rich_text' && prop.rich_text.length > 0) {
          data[key] = prop.rich_text[0].plain_text;
        } else if (prop.type === 'select' && prop.select) {
          data[key] = prop.select.name;
        } else if (prop.type === 'multi_select') {
          data[key] = prop.multi_select.map(s => s.name).join(', ');
        } else if (prop.type === 'url') {
          data[key] = prop.url;
        } else if (prop.type === 'email') {
          data[key] = prop.email;
        } else if (prop.type === 'phone_number') {
          data[key] = prop.phone_number;
        }
      });
      
      return data;
    });
    
    console.log('\n=== 크리에이터 목록 ===');
    console.log(JSON.stringify(creators, null, 2));
    
  } catch (error) {
    console.error('에러:', error.message);
    if (error.body) console.error('상세:', JSON.stringify(error.body, null, 2));
  }
}

fetchCreators();
