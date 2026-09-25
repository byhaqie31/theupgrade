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
    controlsReady: document.querySelector('.sights-controls').classList.contains('is-ready'),
    controlsDisabled: [...document.querySelectorAll('.sight-nav')].every(b => b.disabled),
    cardsHidden: [...document.querySelectorAll('.sight-card')].every(hidden),
    introHidden: hidden(document.querySelector('.intro-copy')),
    noteHidden: hidden(document.querySelector('.note-button')),
    headerBg: getComputedStyle(header).backgroundColor,
    activeCard: document.querySelector('.sight-card.is-active')?.dataset.sightIndex ?? null,
  }
}

const TRANSPARENT = 'rgba(0, 0, 0, 0)'
const SCRUB_EXPECT = {
  0: r => r.titleOpacity === 1 && r.sightsVisibility === 'hidden' && r.headerBg === TRANSPARENT && r.bridgeOpacity === 1 && r.imagesDecoded
    && r.cardsHidden && r.controlsDisabled && r.noteHidden && r.introHidden === false,
  1100: r => r.titleOpacity === 0 && r.frame2 >= 0.99 && r.panel2 >= 0.99 && r.introHidden,
  2300: r => r.panel3 >= 0.99 && r.frame2 <= 0.01 && r.noteHidden === false && r.bridgeOpacity === 0,
  3700: r => r.sightsVisibility === 'visible' && r.sightsEnterX === '0vw' && r.controlsReady
    && r.headerBg === TRANSPARENT && r.activeCard === '5',
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
      }
      // One slider step: the next card becomes active after the 640ms slide.
      await page.click('.sight-next')
      await page.waitForTimeout(800)
      const afterNext = await page.evaluate(SCRUB_CHECK)
      report.scrub.afterNext = { activeCard: afterNext.activeCard, ok: afterNext.activeCard === '6' }
      if (!report.scrub.afterNext.ok) failures++
      // The active card must sit on screen at the controls' left edge (48px), and selecting a card brings it there.
      // The back stack (slider included) drifts up to 6px with the pointer by design, so park the pointer at the centre first.
      const centrePointer = async () => {
        await page.evaluate(() => { document.querySelector('.cinema-scroll').dataset.settled = 'false' })
        await page.mouse.move(720, 450)
        await page.waitForFunction(() => document.querySelector('.cinema-scroll')?.dataset.settled === 'true')
      }
      await centrePointer()
      const landing = await page.evaluate(() => {
        const el = document.querySelector('.sight-card.is-active')
        const r = el.getBoundingClientRect()
        return { index: el.dataset.sightIndex, left: Math.round(r.left), right: Math.round(r.right), innerWidth: window.innerWidth }
      })
      landing.ok = Math.abs(landing.left - 48) <= 1 && landing.right <= landing.innerWidth
      report.scrub.landing = landing
      if (!landing.ok) failures++
      await page.click('.sight-card[data-sight-index="7"]')
      await page.waitForTimeout(800)
      await centrePointer()
      const selected = await page.evaluate(() => {
        const el = document.querySelector('.sight-card[data-sight-index="7"]')
        return { active: el.classList.contains('is-active'), left: Math.round(el.getBoundingClientRect().left) }
      })
      selected.ok = selected.active && Math.abs(selected.left - 48) <= 1
      report.scrub.selected = selected
      if (!selected.ok) failures++
      // Keyboard: only the middle set is tabbable, focus is visible, and tabbing never scrolls the clipped stage.
      const focusable = await page.evaluate(() => ({
        tabbable: document.querySelectorAll('.sight-card[tabindex="0"]').length,
        ariaHidden: document.querySelectorAll('.sight-card[aria-hidden="true"]').length,
        worldOverflow: getComputedStyle(document.querySelector('.world')).overflow,
        stageOverflow: getComputedStyle(document.querySelector('.stage')).overflow,
      }))
      await page.focus('.sight-card[data-sight-index="5"]')
      const tabs = []
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab')
        tabs.push(await page.evaluate(() => {
          const el = document.activeElement
          return {
            focused: el?.dataset?.sightIndex ?? String(el?.className ?? '').slice(0, 24),
            outline: el ? getComputedStyle(el).outlineStyle : null,
            worldScrollLeft: document.querySelector('.world').scrollLeft,
            stageScrollLeft: document.querySelector('.stage').scrollLeft,
          }
        }))
      }
      const keyboard = { ...focusable, tabs }
      keyboard.ok = focusable.tabbable === 5 && focusable.ariaHidden === 10
        && focusable.worldOverflow === 'clip' && focusable.stageOverflow === 'clip'
        && tabs.slice(0, 4).every((t, i) => t.focused === String(6 + i) && t.outline !== 'none' && t.worldScrollLeft === 0 && t.stageScrollLeft === 0)
        && tabs[4].focused !== '10'
      report.scrub.keyboard = keyboard
      if (!keyboard.ok) failures++
      report.scrub.errors = errors
      if (errors.length) failures++
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
      // With transitions off the loop must still normalise (no transitionend arrives): 6 × next from 5 lands on 6.
      await page.evaluate(() => {
        document.querySelector('.cinema-scroll').dataset.settled = 'false'
        window.scrollTo(0, 3700)
        window.dispatchEvent(new Event('scroll'))
      })
      await page.waitForFunction(() => document.querySelector('.cinema-scroll')?.dataset.settled === 'true')
      for (let i = 0; i < 6; i++) {
        await page.click('.sight-next')
        await page.waitForTimeout(80)
      }
      await page.waitForTimeout(300)
      const loop = await page.evaluate(() => document.querySelector('.sight-card.is-active')?.dataset.sightIndex ?? null)
      report.reducedMotion.loopAfterSixNext = loop
      if (loop !== '6') failures++
      // And the pointer must not move any layer.
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
