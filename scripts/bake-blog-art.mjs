// scripts/bake-blog-art.mjs
// /dev/blog-art 를 playwright 로 열어 카테고리별 셰이더 아트를 public/blog-art/<slug>.jpg 로 베이크.
// 사용: node scripts/bake-blog-art.mjs [--base=http://localhost:3000]
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=')[1]
const base = arg('base', 'http://localhost:3000')
const outDir = 'public/blog-art'
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })
await page.goto(`${base}/dev/blog-art`, { waitUntil: 'load', timeout: 30000 })
// 셰이더(webgl2) 첫 프레임 드로우 대기
await page.waitForTimeout(3000)

const handles = await page.$$('[data-art]')
if (handles.length === 0) {
  console.error('no [data-art] elements found — is dev server running and /dev/blog-art reachable?')
  await browser.close()
  process.exit(1)
}

let count = 0
for (const h of handles) {
  const slug = await h.getAttribute('data-art')
  await h.screenshot({ path: `${outDir}/${slug}.jpg`, quality: 88, type: 'jpeg' })
  count++
  console.log(`baked ${outDir}/${slug}.jpg`)
}
await browser.close()
console.log(`done — ${count} art assets`)
