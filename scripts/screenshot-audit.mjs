// scripts/screenshot-audit.mjs
// 사용: node scripts/screenshot-audit.mjs --routes=/,/contact --label=baseline [--base=http://localhost:3000]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=')[1];
const routes = arg('routes', '/').split(',');
const label = arg('label', 'shot');
const base = arg('base', 'http://localhost:3000');
const outDir = `docs/plans/assets/shots/${label}`;
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const errors = [];
for (const [w, h, tag] of [[1440, 900, '1440'], [390, 844, '390']]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('console', (m) => m.type() === 'error' && errors.push(`[${tag}] ${page.url()} ${m.text()}`));
  for (const r of routes) {
    await page.goto(base + r, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(2500);
    const slug = r === '/' ? 'home' : r.replaceAll('/', '_').replace(/^_/, '');
    await page.screenshot({ path: `${outDir}/${slug}-${tag}-top.jpg`, quality: 85, type: 'jpeg' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${outDir}/${slug}-${tag}-mid.jpg`, quality: 85, type: 'jpeg' });
  }
  await page.close();
}
await browser.close();
console.log(errors.length ? `CONSOLE ERRORS:\n${errors.join('\n')}` : 'console clean');
console.log(`saved to ${outDir}`);
