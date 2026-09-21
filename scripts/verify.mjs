/**
 * Responsive verification for the homepage.
 *
 *   pnpm generate && pnpm verify
 *
 * Serves .output/public on a local port (or uses BASE_URL if set), then with
 * playwright-core and the machine's installed Chromium:
 *   1. screenshots / at 390x844, 820x1180, 1440x900 (+ full page at 390 and 1440)
 *   2. flags any element whose right edge passes the viewport width
 *   3. checks the hero headline, lede and subscribe field fit inside the hero at 390
 *   4. confirms the page is static under prefers-reduced-motion (marquee included)
 *
 * No browser is downloaded. playwright-core is pinned to the version whose
 * Chromium revision is already in ~/Library/Caches/ms-playwright.
 */
import { createServer } from 'node:http'
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'
import { chromium } from 'playwright-core'

const ROOT = resolve(import.meta.dirname, '..')
const OUT = join(ROOT, '.verify')
const PUBLIC = join(ROOT, '.output', 'public')

const VIEWPORTS = [
  { name: '390x844', width: 390, height: 844, fullPage: true },
  { name: '820x1180', width: 820, height: 1180, fullPage: false },
  { name: '1440x900', width: 1440, height: 900, fullPage: true },
]

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
  '.wasm': 'application/wasm',
}

async function serveStatic() {
  if (!existsSync(join(PUBLIC, 'index.html'))) {
    throw new Error('No .output/public/index.html. Run `pnpm generate` first, or set BASE_URL.')
  }
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost')
      let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '')
      let file = join(PUBLIC, path)
      let s = await stat(file).catch(() => null)
      if (s?.isDirectory()) {
        file = join(file, 'index.html')
        s = await stat(file).catch(() => null)
      }
      if (!s) {
        file = join(PUBLIC, path + '.html')
        s = await stat(file).catch(() => null)
      }
      if (!s) {
        file = join(PUBLIC, '404.html')
        s = await stat(file).catch(() => null)
        if (!s) {
          res.writeHead(404).end('not found')
          return
        }
        res.writeHead(404, { 'content-type': MIME['.html'] })
        res.end(await readFile(file))
        return
      }
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' })
      res.end(await readFile(file))
    }
    catch (err) {
      res.writeHead(500).end(String(err))
    }
  })
  await new Promise(r => server.listen(0, '127.0.0.1', r))
  const { port } = server.address()
  return { server, url: `http://127.0.0.1:${port}` }
}

/** Elements whose right edge passes the viewport, ignoring marquee + clipped subtrees. */
const OVERFLOW_CHECK = () => {
  const limit = window.innerWidth + 1
  const flagged = []
  const clipped = (el) => {
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      if (n.classList.contains('marquee')) return true
      const o = getComputedStyle(n)
      if (o.overflow === 'hidden' || o.overflowX === 'hidden' || o.overflowX === 'clip') return true
    }
    return false
  }
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) continue
    if (r.right > limit && !clipped(el)) {
      flagged.push({
        tag: el.tagName.toLowerCase(),
        cls: String(el.className).slice(0, 80),
        right: Math.round(r.right),
        text: (el.textContent ?? '').trim().slice(0, 40),
      })
    }
  }
  return { innerWidth: window.innerWidth, scrollWidth: document.documentElement.scrollWidth, flagged }
}

const HERO_CHECK = () => {
  const hero = document.querySelector('section > div.min-h-\\(--hero-min\\)') ?? document.querySelector('main section:first-of-type > div')
  const h1 = document.querySelector('h1')
  const lede = h1?.nextElementSibling
  const field = document.querySelector('#subscribe input')?.parentElement
  const box = el => el ? el.getBoundingClientRect() : null
  const H = box(hero)
  const minH = hero ? parseFloat(getComputedStyle(hero).minHeight) : null
  return {
    heroTop: H?.top, heroBottom: Math.round(H?.bottom ?? 0), heroHeight: Math.round(H?.height ?? 0), heroMinHeight: minH,
    h1Bottom: Math.round(box(h1)?.bottom ?? -1),
    ledeBottom: Math.round(box(lede)?.bottom ?? -1),
    fieldBottom: Math.round(box(field)?.bottom ?? -1),
    viewportHeight: window.innerHeight,
  }
}

const FONT_CHECK = async () => {
  await document.fonts.ready
  return {
    satoshi500: document.fonts.check('500 16px Satoshi'),
    satoshiItalic: document.fonts.check('italic 400 16px Satoshi'),
    geistMono: document.fonts.check('400 12px "Geist Mono"'),
    bodyFamily: getComputedStyle(document.body).fontFamily,
    externalFontLinks: [...document.querySelectorAll('link[href*="fontshare"], link[href*="googleapis"], link[href*="gstatic"]')].length,
  }
}

async function main() {
  await mkdir(OUT, { recursive: true })
  let server = null
  let base = process.env.BASE_URL
  if (!base) ({ server, url: base } = await serveStatic())

  const browser = await chromium.launch({ headless: true })
  const report = { base, viewports: {}, reducedMotion: {}, fonts: null }
  let failures = 0

  try {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 })
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', e => errors.push(String(e)))
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
      await page.goto(base + '/', { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(300)

      if (!report.fonts) report.fonts = await page.evaluate(FONT_CHECK)

      await page.screenshot({ path: join(OUT, `${vp.name}.png`) })
      if (vp.fullPage) await page.screenshot({ path: join(OUT, `${vp.width}-full.png`), fullPage: true })

      const overflow = await page.evaluate(OVERFLOW_CHECK)
      const entry = { overflow, errors }
      if (vp.width === 390) entry.hero = await page.evaluate(HERO_CHECK)
      report.viewports[vp.name] = entry

      if (overflow.flagged.length) failures++
      if (errors.length) failures++
      if (entry.hero) {
        const h = entry.hero
        const fits = h.h1Bottom <= h.heroBottom && h.ledeBottom <= h.heroBottom && h.fieldBottom <= h.heroBottom
        const withinMin = h.heroHeight <= Math.ceil(h.heroMinHeight) + 1
        entry.hero.fits = fits
        entry.hero.withinMinHeight = withinMin
        if (!fits || !withinMin) failures++
      }
      await context.close()
    }

    // Reduced motion: marquee animation must be off and two shots 1s apart identical.
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
      const page = await context.newPage()
      await page.goto(base + '/', { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(300)
      const anim = await page.evaluate(() => {
        const track = document.querySelector('.marquee > div')
        const s = track ? getComputedStyle(track) : null
        return { animationName: s?.animationName, transform: s?.transform }
      })
      const a = await page.screenshot({ path: join(OUT, '1440-reduced-motion.png') })
      await page.waitForTimeout(1000)
      const b = await page.screenshot()
      const identical = Buffer.compare(a, b) === 0
      report.reducedMotion = { ...anim, staticAcrossOneSecond: identical }
      if (anim.animationName !== 'none' || !identical) failures++
      await context.close()
    }
  }
  finally {
    await browser.close()
    server?.close()
  }

  report.ok = failures === 0
  await writeFile(join(OUT, 'report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  console.log(report.ok ? '\nVERIFY OK' : `\nVERIFY FAILED (${failures} check group(s))`)
  process.exit(report.ok ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
