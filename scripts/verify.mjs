/**
 * Responsive verification for the homepage.
 *
 *   pnpm generate && pnpm verify
 *
 * Serves .output/public on a local port (or uses BASE_URL if set), then with
 * playwright-core and the machine's installed Chromium:
 *   1. screenshots / at 390x844, 820x1180, 1440x900 (+ full page at 390 and 1440)
 *   2. flags any element whose right edge passes the viewport width
 *   3. checks at 390 that the cinematic hero's title sits above the intro block and the intro fits the stage
 *   4. scrubs the pinned story at 1440x900 (0, 1100, 2300, 3700, 4700) and asserts the engine state and nav
 *   5. confirms the page is static under prefers-reduced-motion (marquee included)
 *
 * No browser is downloaded. playwright-core is pinned to the version whose
 * Chromium revision is already in ~/Library/Caches/ms-playwright.
 */
import { createServer } from 'node:http'
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'
import { inflateSync } from 'node:zlib'
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

/** Colour of one screen pixel from a 1×1 clip screenshot (a 1×1 PNG row needs no unfiltering). */
async function pixelAt(page, x, y) {
  // `clip` is viewport-relative for a non-full-page screenshot, so sample while the stop is on screen.
  const png = await page.screenshot({ clip: { x, y, width: 1, height: 1 } })
  const idat = []
  for (let off = 8; off < png.length;) {
    const len = png.readUInt32BE(off)
    const type = png.toString('ascii', off + 4, off + 8)
    if (type === 'IDAT') idat.push(png.subarray(off + 8, off + 8 + len))
    off += 12 + len
  }
  const raw = inflateSync(Buffer.concat(idat))
  return [raw[1], raw[2], raw[3]]
}

/** The cream card surface (#f5f0e6) allowing for the 3.5% grain overlay. */
const PAPER = [245, 240, 230]
const isPaper = px => px.every((v, i) => Math.abs(v - PAPER[i]) <= 16)

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

/** Scroll-zero layout of the cinematic stage: title above the intro block, intro and field inside the stage. */
const HERO_CHECK = () => {
  const stage = document.querySelector('.cinema-scroll .stage')
  const title = document.querySelector('.hero-title')
  const intro = document.querySelector('.intro-copy')
  const field = document.querySelector('.intro-copy input')?.parentElement
  const box = el => el ? el.getBoundingClientRect() : null
  const S = box(stage)
  const T = box(title)
  const I = box(intro)
  const F = box(field)
  return {
    stageHeight: Math.round(S?.height ?? 0),
    stageBottom: Math.round(S?.bottom ?? 0),
    titleBottom: Math.round(T?.bottom ?? -1),
    introTop: Math.round(I?.top ?? -1),
    introBottom: Math.round(I?.bottom ?? -1),
    fieldBottom: Math.round(F?.bottom ?? -1),
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

/** Positions through the 3700px pinned story at 1440x900 (section height 4600). */
const SCRUB_POSITIONS = [0, 1100, 2300, 3700, 4700]

const SCRUB_CHECK = () => {
  const section = document.querySelector('.cinema-scroll')
  const cs = getComputedStyle(section)
  const v = name => cs.getPropertyValue(name).trim()
  const header = document.querySelector('header')
  const hidden = el => el ? getComputedStyle(el).visibility === 'hidden' : null
  return {
    scrollY: Math.round(window.scrollY),
    titleOpacity: parseFloat(v('--title-opacity')),
    frame2: parseFloat(v('--frame2-opacity')),
    bridgeOpacity: parseFloat(v('--bridge-opacity')),
    imagesDecoded: [...document.querySelectorAll('img.scene-img')].every(i => i.complete && i.naturalWidth > 0),
    panel2: parseFloat(v('--panel2-opacity')),
    panel3: parseFloat(v('--panel3-opacity')),
    sightsVisibility: v('--sights-visibility'),
    sightsEnterX: v('--sights-enter-x'),
    cardsHidden: [...document.querySelectorAll('.sight-card')].every(hidden),
    cards: [...document.querySelectorAll('.sight-card')].map((c) => {
      const r = c.getBoundingClientRect()
      return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom) }
    }),
    links: document.querySelectorAll('a.sight-card[href]').length,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    introHidden: hidden(document.querySelector('.intro-copy')),
    noteHidden: hidden(document.querySelector('.note-button')),
    headerBg: getComputedStyle(header).backgroundColor,
  }
}

const TRANSPARENT = 'rgba(0, 0, 0, 0)'
/** Four linked cards, every one fully on screen, laid out in two rows and two columns, centred within a pixel. */
const gridOk = (r) => {
  const c = r.cards
  if (c.length !== 4 || r.links !== 4) return false
  const onScreen = c.every(k => k.l >= 0 && k.t >= 0 && k.r <= r.innerWidth && k.b <= r.innerHeight)
  const lefts = new Set(c.map(k => k.l)), tops = new Set(c.map(k => k.t))
  const minL = Math.min(...c.map(k => k.l)), maxR = Math.max(...c.map(k => k.r))
  return onScreen && lefts.size === 2 && tops.size === 2 && Math.abs(minL - (r.innerWidth - maxR)) <= 2
}
const SCRUB_EXPECT = {
  0: r => r.titleOpacity === 1 && r.sightsVisibility === 'hidden' && r.headerBg === TRANSPARENT && r.bridgeOpacity === 1 && r.imagesDecoded
    && r.cardsHidden && r.noteHidden && r.introHidden === false,
  1100: r => r.titleOpacity === 0 && r.frame2 >= 0.99 && r.panel2 >= 0.99 && r.introHidden,
  2300: r => r.panel3 >= 0.99 && r.frame2 <= 0.01 && r.noteHidden === false && r.bridgeOpacity === 0,
  3700: r => r.sightsVisibility === 'visible' && r.sightsEnterX === '0vw' && r.headerBg === TRANSPARENT && gridOk(r),
  4700: r => r.headerBg !== TRANSPARENT,
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
        const fits = h.titleBottom < h.introTop
          && h.introBottom <= h.stageBottom
          && h.fieldBottom <= h.stageBottom
          && h.stageHeight >= 640
        entry.hero.fits = fits
        if (!fits) failures++
      }
      await context.close()
    }

    // Scrub the pinned story at 1440x900 with normal motion; wait for the engine to settle at each stop.
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', e => errors.push(String(e)))
      await page.goto(base + '/', { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)
      report.scrub = {}
      for (const y of SCRUB_POSITIONS) {
        await page.evaluate((top) => {
          document.querySelector('.cinema-scroll').dataset.settled = 'false'
          window.scrollTo(0, top)
          // scrollTo fires no event when the position is unchanged (the first stop is 0); wake the engine anyway.
          window.dispatchEvent(new Event('scroll'))
        }, y)
        await page.waitForFunction(() => document.querySelector('.cinema-scroll')?.dataset.settled === 'true')
        await page.waitForTimeout(100)
        await page.screenshot({ path: join(OUT, `1440-scroll-${y}.png`) })
        const result = await page.evaluate(SCRUB_CHECK)
        result.ok = SCRUB_EXPECT[y](result)
        report.scrub[y] = result
        if (!result.ok) failures++
        if (y === 3700) {
          // Paint order, while this stop is on screen: a cream pixel inside every card
          // (elementFromPoint cannot see the pointer-events:none deck, so sample the pixels).
          const cardPixels = []
          for (const k of result.cards) {
            const px = await pixelAt(page, Math.round(k.l + (k.r - k.l) * 0.4), Math.round(k.t + (k.b - k.t) * 0.35))
            cardPixels.push({ px, ok: isPaper(px) })
          }
          report.scrub.cardPixels = cardPixels
          if (!cardPixels.every(c => c.ok)) failures++
        }
      }
      // Keyboard: the four cards are real links in order, focus is visible, and tabbing never scrolls the clipped stage.
      const focusable = await page.evaluate(() => ({
        tabbable: document.querySelectorAll('a.sight-card[href]').length,
        ariaHidden: document.querySelectorAll('.sight-card[aria-hidden="true"]').length,
        worldOverflow: getComputedStyle(document.querySelector('.world')).overflow,
        stageOverflow: getComputedStyle(document.querySelector('.stage')).overflow,
        order: [...document.querySelectorAll('a.sight-card')].map(a => a.dataset.issueNo),
      }))
      await page.focus('a.sight-card')
      const tabs = []
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press('Tab')
        tabs.push(await page.evaluate(() => {
          const el = document.activeElement
          return {
            focused: el?.dataset?.issueNo ?? String(el?.className ?? '').slice(0, 24),
            outline: el ? getComputedStyle(el).outlineStyle : null,
            worldScrollLeft: document.querySelector('.world').scrollLeft,
            stageScrollLeft: document.querySelector('.stage').scrollLeft,
          }
        }))
      }
      const keyboard = { ...focusable, tabs }
      keyboard.ok = focusable.tabbable === 4 && focusable.ariaHidden === 0
        && focusable.worldOverflow === 'clip' && focusable.stageOverflow === 'clip'
        && tabs.every((t, i) => t.focused === focusable.order[i + 1] && t.outline !== 'none' && t.worldScrollLeft === 0 && t.stageScrollLeft === 0)
      report.scrub.keyboard = keyboard
      if (!keyboard.ok) failures++
      report.scrub.errors = errors
      if (errors.length) failures++
      await context.close()
    }

    // Narrow viewport: once parted, the window halves must clear the screen, and the grid stacks in one column.
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
      const page = await context.newPage()
      await page.goto(base + '/', { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)
      report.narrow = {}
      for (const y of [1100, 3700]) {
        await page.evaluate((top) => {
          document.querySelector('.cinema-scroll').dataset.settled = 'false'
          window.scrollTo(0, top)
          window.dispatchEvent(new Event('scroll'))
        }, y)
        await page.waitForFunction(() => document.querySelector('.cinema-scroll')?.dataset.settled === 'true')
        await page.waitForTimeout(100)
        await page.screenshot({ path: join(OUT, `390-scroll-${y}.png`) })
        const r = await page.evaluate(() => {
          const box = el => el.getBoundingClientRect()
          const L = box(document.querySelector('.splitframe-left'))
          const R = box(document.querySelector('.splitframe-right'))
          return {
            leftContentRight: Math.round(L.left + L.width / 2),
            rightContentLeft: Math.round(R.left + R.width / 2),
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            cards: [...document.querySelectorAll('.sight-card')].map((c) => {
              const b = box(c)
              return { l: Math.round(b.left), t: Math.round(b.top), r: Math.round(b.right), b: Math.round(b.bottom) }
            }),
          }
        })
        r.halvesClear = r.leftContentRight <= 0 && r.rightContentLeft >= r.innerWidth
        const stacked = r.cards.length === 4
          && r.cards.every(k => k.l >= 0 && k.r <= r.innerWidth && k.t >= 0 && k.b <= r.innerHeight)
          && new Set(r.cards.map(k => k.l)).size === 1 && new Set(r.cards.map(k => k.t)).size === 4
        r.ok = r.halvesClear && (y !== 3700 || stacked)
        report.narrow[y] = r
        if (!r.ok) failures++
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
      // The pointer must not move any layer under reduced motion.
      await page.evaluate(() => {
        document.querySelector('.cinema-scroll').dataset.settled = 'false'
        window.scrollTo(0, 3700)
        window.dispatchEvent(new Event('scroll'))
      })
      await page.waitForFunction(() => document.querySelector('.cinema-scroll')?.dataset.settled === 'true')
      await page.evaluate(() => { document.querySelector('.cinema-scroll').dataset.settled = 'false' })
      await page.mouse.move(100, 100)
      await page.waitForFunction(() => document.querySelector('.cinema-scroll')?.dataset.settled === 'true')
      const pointer = await page.evaluate(() => {
        const cs = getComputedStyle(document.querySelector('.cinema-scroll'))
        return { backX: cs.getPropertyValue('--back-x').trim(), bridgeX: cs.getPropertyValue('--bridge-x').trim() }
      })
      report.reducedMotion.pointer = pointer
      if (pointer.backX !== '0px' || pointer.bridgeX !== 'calc(-50% + 0px)') failures++
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
