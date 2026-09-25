# Cinematic Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static homepage hero with a pinned, scroll-driven three-screen story (title exit, window halves parting, two story panels, an infinite issue slider) whose motion engine follows the Mostar source spec verbatim, integrated with the existing Nuxt 4 site.

**Architecture:** One component, `HeroCinema.vue`, owns the stage DOM and its scoped CSS. `useCinemaScroll` runs the per-frame engine (scroll and pointer smoothing, rAF) and applies custom properties to the section element; the math itself lives in a pure module, `app/utils/cinema.ts`, so it is unit-tested under Node. `useInfiniteSlider` drives the three-set looping slider over Vue-rendered cards. A shared `useHeroUnderNav` state turns `SiteNav` transparent while the stage sits under it.

**Tech Stack:** Nuxt 4 (`app/` dir, `<script setup lang="ts">`, strict TS), Vue 3.5, Tailwind v4 (tokens only; the hero uses plain scoped CSS), Node 22.22 built-in test runner with native type stripping, playwright-core 1.62.1 for the existing `scripts/verify.mjs`.

**Spec:** `docs/superpowers/specs/2026-09-24-cinematic-hero-design.md` (design, decisions, delta table) and `docs/superpowers/specs/2026-09-24-cinematic-hero-source-spec.md` (the Mostar prompt, verbatim; the authority for every number).

## Global Constraints

- No git command that changes state. Qie runs git. Never `git add`, `git commit`, `git stash`, `git checkout`. Tasks end with a read-only checkpoint (`git status --short`).
- No new dependency. Do not run `pnpm add`. `package.json` gains one script only (`test`).
- Every numeric value from the source spec §4–§8 is reproduced verbatim except the 25 deltas in design spec §9.
- Custom properties live on `section.cinema-scroll`, never on `:root`. Class names are the source's.
- Brand strings live in `app/app.config.ts` and are read with `useAppConfig()`. No brand string inside a component.
- Fonts: Satoshi and Geist Mono only, already self-hosted by `@nuxt/fonts`. No `<link>` to any font host. No `Ogg`.
- Images: only `public/img/hero/*.svg` (new) and `public/brand/svg/mark-amber.svg` (existing). No remote URL from the source spec anywhere in the repo except the saved source-spec document.
- Style: no semicolons, single quotes, 2-space indent, trailing commas, as the existing files do. `pnpm lint` and `pnpm typecheck` must stay clean.
- pnpm 11 on this machine: never delete `pnpm-lock.yaml` or `node_modules`; running scripts is `pnpm <script>`.
- Do not modify anything under `design_handoff_the_upgrade_homepage/`.

## Review Focus

Input classes the spec implies that no acceptance number covers, most likely to bite first. Each has a test pinned in the owning task.

1. **Fewer than five issues, or none** (this site becomes a template). The slider must still loop with 3 × n cards and must not throw with zero cards. Pinned in Task 1 (`normalizeSightIndex` with `count` 1) and Task 3 (`onTransitionEnd` guard for `count` 0).
2. **Reload or back-navigation lands mid-story** (the browser restores `scrollY` at, say, 2300). The first frame must snap to the restored position, not lerp from 0 and fly the whole choreography past the reader. Pinned in Task 1 (`nextSmoothScroll` with `initialized` false).
3. **Invisible blocks must be unreachable.** At scroll 0 the slider cards, the two round buttons and the "Read the latest issue" pill are at opacity 0 or off screen; at 1100 the subscribe form is. Tab and clicks must not land on them. Pinned in Task 5 (scrub check at 0 asserts cards `visibility: hidden`, buttons `disabled`, note button `visibility: hidden`; at 1100 asserts the intro `visibility: hidden`).
4. **Viewport height changes** (rotation, URL bar, window resize) re-solve the slider's on-screen top. Pinned in Task 1 (`--sights-screen-top` at `innerHeight` 500, 900, 1400) and Task 3 (resize listener calls the slider `update` then `requestTick`).
5. **Pointer at the viewport edges** must produce finite, well-formed values (`-6px`, `calc(-50% + 9px)`), never `NaN` or `undefined`. Pinned in Task 1 (pointer `(0.5, -0.5)`).

---

### Task 1: Pure engine math with tests

**Files:**
- Create: `app/utils/cinema.ts`
- Create: `tests/cinema.test.ts`
- Modify: `package.json` (add the `test` script)

**Interfaces:**
- Consumes: nothing.
- Produces (all exported from `app/utils/cinema.ts`, also auto-imported by Nuxt because the file is in `app/utils/`):
  - `clamp(v: number, min = 0, max = 1): number`
  - `smoothstep(e0: number, e1: number, v: number): number`
  - `lerp(a: number, b: number, t: number): number`
  - `segmentInOut(s: number, a: number, b: number, c: number, d: number): Segment` where `Segment = { enter: number, exit: number, active: number }`
  - `nextSmoothScroll(current: number, target: number, initialized: boolean, reduceMotion: boolean): number`
  - `normalizeSightIndex(active: number, count: number): number | null`
  - `cinemaFrame(input: CinemaInput): CinemaFrame` with
    `CinemaInput = { scroll: number, mouseX: number, mouseY: number, innerHeight: number, reduceMotion: boolean }`,
    `CinemaVars = Record<string, string>`,
    `CinemaLive = { intro: boolean, panel2: boolean, panel3: boolean }`,
    `CinemaFrame = { vars: CinemaVars, controlsReady: boolean, live: CinemaLive }`

- [ ] **Step 1: Add the test script to `package.json`**

In `package.json`, inside `"scripts"`, add after the `"verify"` line:

```json
    "verify": "node scripts/verify.mjs",
    "test": "node --test 'tests/**/*.test.ts'"
```

(Node expands the quoted glob itself. A bare directory argument does not work on Node 22.)

- [ ] **Step 2: Write the failing tests**

Create `tests/cinema.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { CinemaInput } from '../app/utils/cinema.ts'
import {
  cinemaFrame,
  clamp,
  lerp,
  nextSmoothScroll,
  normalizeSightIndex,
  segmentInOut,
  smoothstep,
} from '../app/utils/cinema.ts'

/** Frame at a scroll offset, pointer at rest, 900px viewport, motion allowed. */
function at(scroll: number, extra: Partial<CinemaInput> = {}) {
  return cinemaFrame({ scroll, mouseX: 0, mouseY: 0, innerHeight: 900, reduceMotion: false, ...extra })
}

function near(actual: string | number | undefined, expected: number, eps = 1e-6) {
  const n = typeof actual === 'number' ? actual : Number.parseFloat(String(actual))
  assert.ok(Math.abs(n - expected) <= eps, `${actual} is not within ${eps} of ${expected}`)
}

test('helpers follow the source spec §7', () => {
  assert.equal(clamp(1.5), 1)
  assert.equal(clamp(-1), 0)
  assert.equal(clamp(5, 0, 10), 5)
  assert.equal(smoothstep(0, 10, 0), 0)
  assert.equal(smoothstep(0, 10, 5), 0.5)
  assert.equal(smoothstep(0, 10, 10), 1)
  near(lerp(0, 10, 0.14), 1.4)

  const mid = segmentInOut(1100, 560, 900, 1300, 1620)
  assert.deepEqual(mid, { enter: 1, exit: 0, active: 1 })
  const done = segmentInOut(1620, 560, 900, 1300, 1620)
  assert.deepEqual(done, { enter: 1, exit: 1, active: 0 })
  const entering = segmentInOut(700, 560, 900, 1300, 1620)
  near(entering.enter, 0.369020, 1e-5)
  assert.equal(entering.exit, 0)
  assert.equal(entering.active, entering.enter)
})

test('normalizeSightIndex loops the three card sets (source §8)', () => {
  assert.equal(normalizeSightIndex(5, 5), null)
  assert.equal(normalizeSightIndex(9, 5), null)
  assert.equal(normalizeSightIndex(10, 5), 5)
  assert.equal(normalizeSightIndex(14, 5), 9)
  assert.equal(normalizeSightIndex(4, 5), 9)
  assert.equal(normalizeSightIndex(0, 5), 5)
  // Review focus 1: a single issue still loops.
  assert.equal(normalizeSightIndex(3, 1), 2)
  assert.equal(normalizeSightIndex(0, 1), 1)
  assert.equal(normalizeSightIndex(1, 1), null)
})

test('nextSmoothScroll snaps on the first frame and under reduced motion (review focus 2)', () => {
  assert.equal(nextSmoothScroll(0, 2300, false, false), 2300)
  near(nextSmoothScroll(0, 2300, true, false), 322)
  assert.equal(nextSmoothScroll(2299.95, 2300, true, false), 2300)
  assert.equal(nextSmoothScroll(0, 2300, true, true), 2300)
})

test('scroll 0 is the source :root default state', () => {
  const { vars, controlsReady, live } = at(0)
  assert.equal(vars['--title-opacity'], '1')
  assert.equal(vars['--title-y'], '0px')
  assert.equal(vars['--intro-copy-opacity'], '1')
  assert.equal(vars['--frame2-opacity'], '0')
  assert.equal(vars['--sights-visibility'], 'hidden')
  assert.equal(vars['--sights-enter-x'], '420vw')
  assert.equal(vars['--bridge-width'], '67.2vw')
  assert.equal(vars['--back-scale'], '0.76')
  assert.equal(vars['--shade-z'], '0')
  assert.equal(vars['--shade-opacity'], '1')
  assert.equal(vars['--sights-y'], '0px')
  assert.equal(vars['--mx'], '0.0000')
  assert.equal(vars['--split-left-x'], 'calc(-50% + 0vw + 0px)')
  assert.equal(vars['--sights-screen-top'], '121px')
  near(vars['--sights-top'], -125)
  assert.equal(controlsReady, false)
  assert.deepEqual(live, { intro: true, panel2: false, panel3: false })
})

test('scroll 650: title has risen 210px, scaled to 0.92 and faded; intro sank 90px', () => {
  const { vars, live } = at(650)
  assert.equal(vars['--title-y'], '-210px')
  near(vars['--title-scale'], 0.92)
  assert.equal(vars['--title-opacity'], '0')
  assert.equal(vars['--intro-copy-y'], '90px')
  assert.equal(vars['--intro-copy-opacity'], '0')
  assert.equal(live.intro, false)
})

test('scroll 1100: frame two fully in, wing widened, haze up, panel two in', () => {
  const { vars, live } = at(1100)
  assert.equal(vars['--frame2-opacity'], '1')
  near(vars['--bridge-width'], 105)
  assert.ok(vars['--bridge-width']?.endsWith('vw'))
  near(vars['--bridge-bottom'], -8)
  assert.equal(vars['--blur-px'], '14px')
  near(vars['--back-brightness'], 0.745)
  near(vars['--shade-top-alpha'], 0.465)
  near(vars['--shade-mid-alpha'], 0.42)
  near(vars['--shade-bottom-alpha'], 0.51)
  assert.equal(vars['--shade-z'], '2')
  assert.equal(vars['--split-left-x'], 'calc(-50% + -46vw + 0px)')
  assert.equal(vars['--split-right-x'], 'calc(-50% + 46vw + 0px)')
  near(vars['--split-left-scale'], 1.833704)
  near(vars['--split-right-scale'], 1.833704)
  near(vars['--back-scale'], 1.021481)
  assert.equal(vars['--panel2-opacity'], '1')
  assert.deepEqual(live, { intro: false, panel2: true, panel3: false })
})

test('scroll 1620: wing launched, frame two lifted, panel two gone', () => {
  const { vars } = at(1620)
  near(vars['--bridge-y'], -804.4)
  near(vars['--bridge-scale'], 1.618)
  assert.equal(vars['--frame2-y'], 'calc(-50% + -150px)')
  assert.equal(vars['--panel2-opacity'], '0')
  assert.equal(vars['--frame2-opacity'], '0')
})

test('scroll 2300: panel three in, cloud deck saturated, frame two out', () => {
  const { vars, live } = at(2300)
  assert.equal(vars['--panel3-opacity'], '1')
  near(vars['--bazaar-saturation'], 1.18)
  assert.equal(vars['--frame2-opacity'], '0')
  assert.deepEqual(live, { intro: false, panel2: false, panel3: true })
})

test('scroll 3560: slider fully in and counter-scaled by 1 / backScale', () => {
  const { vars } = at(3560)
  assert.equal(vars['--sights-enter-x'], '0vw')
  assert.equal(vars['--sights-visibility'], 'visible')
  near(vars['--back-scale'], 1.3)
  near(vars['--sights-scale'], 1 / 1.3, 1e-9)
})

test('controls become ready only past 0.98 of their segment', () => {
  assert.equal(at(3600).controlsReady, false)
  const done = at(3660)
  assert.equal(done.controlsReady, true)
  assert.equal(done.vars['--sights-controls-opacity'], '1')
})

test('pointer drives the parallax vars; reduced motion zeroes --mx/--my only', () => {
  const moved = at(0, { mouseX: 0.3, mouseY: -0.2 })
  assert.equal(moved.vars['--mx'], '0.3000')
  assert.equal(moved.vars['--my'], '-0.2000')
  near(moved.vars['--back-x'], -3.6, 1e-9)
  near(moved.vars['--back-y'], 0.8, 1e-9)

  const reduced = at(0, { mouseX: 0.3, mouseY: -0.2, reduceMotion: true })
  assert.equal(reduced.vars['--mx'], '0.0000')
  assert.equal(reduced.vars['--my'], '0.0000')
  near(reduced.vars['--back-x'], -3.6, 1e-9)

  // Review focus 5: viewport edges stay finite and well formed.
  const edge = at(0, { mouseX: 0.5, mouseY: -0.5 })
  assert.equal(edge.vars['--back-x'], '-6px')
  assert.equal(edge.vars['--bridge-x'], 'calc(-50% + 9px)')
  assert.equal(edge.vars['--split-left-x'], 'calc(-50% + 0vw + 11px)')
  for (const value of Object.values(edge.vars)) {
    assert.ok(!/NaN|undefined/.test(value), `bad var value ${value}`)
  }
})

test('sights screen top clamps with viewport height (review focus 4)', () => {
  assert.equal(at(0, { innerHeight: 500 }).vars['--sights-screen-top'], '62px')
  assert.equal(at(0, { innerHeight: 900 }).vars['--sights-screen-top'], '121px')
  assert.equal(at(0, { innerHeight: 1400 }).vars['--sights-screen-top'], '170px')
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm test`
Expected: FAIL. The first line of output reports the module `../app/utils/cinema.ts` cannot be found (`ERR_MODULE_NOT_FOUND`).

- [ ] **Step 4: Write the implementation**

Create `app/utils/cinema.ts`:

```ts
/**
 * Pure math for the cinematic hero. No DOM and no Nuxt imports, so
 * `tests/cinema.test.ts` runs it under Node's test runner.
 *
 * Every constant comes from docs/superpowers/specs/2026-09-24-cinematic-hero-source-spec.md §7–§8.
 * useCinemaScroll owns the smoothing state and applies `vars` to the section.
 */

export function clamp(v: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, v))
}

export function smoothstep(e0: number, e1: number, v: number): number {
  const x = clamp((v - e0) / (e1 - e0))
  return x * x * (3 - 2 * x)
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export interface Segment {
  enter: number
  exit: number
  active: number
}

export function segmentInOut(s: number, a: number, b: number, c: number, d: number): Segment {
  const enter = smoothstep(a, b, s)
  const exit = smoothstep(c, d, s)
  return { enter, exit, active: enter * (1 - exit) }
}

/**
 * One step of the scroll smoothing (source §7 `update()`): snap on the first
 * frame and under reduced motion, otherwise lerp 0.14 and snap inside 0.08px.
 */
export function nextSmoothScroll(current: number, target: number, initialized: boolean, reduceMotion: boolean): number {
  const next = (!initialized || reduceMotion) ? target : lerp(current, target, 0.14)
  return Math.abs(next - target) < 0.08 ? target : next
}

/**
 * Source §8 `normalizeSightSlider`: after a transition ends, the index to jump
 * to without animation so the three-set track loops, or null to stay put.
 */
export function normalizeSightIndex(active: number, count: number): number | null {
  if (active >= count * 2) return active - count
  if (active < count) return active + count
  return null
}

export interface CinemaInput {
  /** Smoothed scroll distance into the section, 0..3700. */
  scroll: number
  /** Smoothed pointer, -0.5..0.5 from the viewport centre. */
  mouseX: number
  mouseY: number
  innerHeight: number
  reduceMotion: boolean
}

export type CinemaVars = Record<string, string>

export interface CinemaLive {
  intro: boolean
  panel2: boolean
  panel3: boolean
}

export interface CinemaFrame {
  vars: CinemaVars
  /** Source: `sightsControlsEnter > 0.98`. */
  controlsReady: boolean
  /** Block opacity above 0.02: the block may take clicks and focus. */
  live: CinemaLive
}

export function cinemaFrame({ scroll, mouseX, mouseY, innerHeight, reduceMotion }: CinemaInput): CinemaFrame {
  const frame2 = segmentInOut(scroll, 560, 900, 1300, 1620)
  const frame3 = segmentInOut(scroll, 1760, 2140, 2540, 2700)
  const progress = clamp(scroll / 2700)
  const introExit = smoothstep(90, 650, scroll)
  const sightsEnterRaw = smoothstep(2760, 3560, scroll)
  const sightsEnter = Math.pow(sightsEnterRaw, 1.55)
  const sightsControlsEnter = smoothstep(3360, 3660, scroll)
  const blurActive = clamp(frame2.active + frame3.active)
  const frame2Opacity = frame2.active * (1 - frame3.enter)
  const splitDrift = Math.pow(frame2.enter, 1.5)
  const panel2Opacity = frame2.active * (1 - frame2.exit)
  const panel3Opacity = frame3.active * (1 - frame3.exit)
  const backScale = 0.76 + progress * 0.2 + frame2.enter * 0.18 + frame3.enter * 0.16
  const sharedHeroY = progress * -74
  const sharedHeroScale = progress * 0.23
  const sightsScreenTop = Math.min(220, Math.max(112, innerHeight * 0.19)) - 50
  const sightsParentTop = innerHeight - (innerHeight - sightsScreenTop) / backScale
  const introOpacity = 1 - introExit

  const vars: CinemaVars = {
    '--mx': (reduceMotion ? 0 : mouseX).toFixed(4),
    '--my': (reduceMotion ? 0 : mouseY).toFixed(4),

    '--back-opacity': String(1 - frame2.active * 0.06),
    '--back-x': `${mouseX * -12}px`,
    '--back-y': `${mouseY * -4}px`,
    '--back-scale': String(backScale),
    '--four-y': `${10 + progress * 10}vh`,
    '--four-scale': String(0.78 + progress * 0.16),
    '--bazaar-y': `${20 - progress * 8}vh`,
    '--blur-px': `${blurActive * 14}px`,
    '--back-brightness': String(1 - blurActive * 0.255),
    '--bazaar-blur-px': `${frame2.active * 14}px`,
    '--bazaar-brightness': String(1 - frame2.active * 0.255 - frame3.active * 0.06),
    '--bazaar-saturation': String(1 + frame3.active * 0.18),
    '--shade-opacity': '1',
    '--shade-z': frame2.active > 0.02 ? '2' : '0',
    '--shade-top-alpha': String(blurActive * 0.465),
    '--shade-mid-alpha': String(blurActive * 0.42),
    '--shade-bottom-alpha': String(blurActive * 0.51),

    '--title-y': `${introExit * -210}px`,
    '--title-scale': String(1 - introExit * 0.08),
    '--title-opacity': String(introOpacity),

    '--bridge-x': `calc(-50% + ${mouseX * 18}px)`,
    '--bridge-y': `${mouseY * 8 + sharedHeroY - frame2.exit * 760}px`,
    '--bridge-bottom': `${5 - frame2.enter * 13}vh`,
    '--bridge-width': `${67.2 + frame2.enter * 37.8}vw`,
    '--bridge-scale': String(1.02 + sharedHeroScale + frame2.exit * 0.46),

    '--split-left-x': `calc(-50% + ${-splitDrift * 46}vw + ${mouseX * 22}px)`,
    '--split-left-y': `${mouseY * 10 + sharedHeroY - splitDrift * 180}px`,
    '--split-left-scale': String(1 + sharedHeroScale + frame2.enter * 0.74),
    '--split-right-x': `calc(-50% + ${splitDrift * 46}vw + ${mouseX * 22}px)`,
    '--split-right-y': `${mouseY * 10 + sharedHeroY - splitDrift * 180}px`,
    '--split-right-scale': String(1 + sharedHeroScale + frame2.enter * 0.74),

    '--frame2-opacity': String(frame2Opacity),
    '--frame2-x': `calc(-50% + ${mouseX * 10}px)`,
    '--frame2-y': `calc(-50% + ${mouseY * 8 - frame2.exit * 150}px)`,
    '--frame2-scale': String(1.06 + frame2.enter * 0.08 + frame2.exit * 0.08),

    '--intro-copy-y': `${introExit * 90}px`,
    '--intro-copy-opacity': String(introOpacity),
    '--panel2-opacity': String(panel2Opacity),
    '--panel2-y': `calc(-50% + ${-frame2.exit * 86 + (1 - frame2.enter) * 58}px)`,
    '--panel3-opacity': String(panel3Opacity),
    '--panel3-y': `calc(-50% + ${-frame3.exit * 86 + (1 - frame3.enter) * 58}px)`,

    '--sights-opacity': String(sightsEnter),
    '--sights-controls-opacity': String(sightsControlsEnter),
    '--sights-visibility': sightsEnter > 0.01 ? 'visible' : 'hidden',
    '--sights-y': '0px',
    '--sights-enter-x': `${(1 - sightsEnter) * 420}vw`,
    '--sights-scale': String(1 / backScale),
    '--sights-top': `${sightsParentTop}px`,
    '--sights-screen-top': `${sightsScreenTop}px`,
  }

  return {
    vars,
    controlsReady: sightsControlsEnter > 0.98,
    live: {
      intro: introOpacity > 0.02,
      panel2: panel2Opacity > 0.02,
      panel3: panel3Opacity > 0.02,
    },
  }
}
```

Note on `-0`: `introExit * -210` is `-0` at scroll 0, and a template literal renders `-0` as `0`, so the var is `0px`, which the test expects.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm test`
Expected: `# pass 12`, `# fail 0`. If a `near()` assertion fails by a rounding hair (for example `105.00000000000001`), the implementation is right and the tolerance is what the test uses; do not "fix" the formula.

- [ ] **Step 6: Lint and typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: both exit 0. `nuxt typecheck` covers `app/utils/cinema.ts`; `tests/` is linted but not part of the Nuxt tsconfig, which is fine.

- [ ] **Step 7: Checkpoint (no git write)**

Run: `git status --short`
Expected: exactly `M package.json`, `?? app/utils/cinema.ts`, `?? tests/`, plus the two `?? docs/superpowers/...` entries that already exist.

---

### Task 2: Placeholder scene layers

**Files:**
- Create: `public/img/hero/sky.svg`, `public/img/hero/glow.svg`, `public/img/hero/horizon.svg`, `public/img/hero/window-left.svg`, `public/img/hero/window-right.svg`, `public/img/hero/wing.svg`, `public/img/hero/closeup.svg`

**Interfaces:**
- Consumes: nothing.
- Produces: seven files at the paths `HeroCinema.vue` (Task 4) references as `/img/hero/<name>.svg`. Only the aspect ratios matter to layout: sky 16:9, glow 16:9, horizon 3:1, window halves 2240×1400, wing 2140×900, closeup 2160×1400.

Each caption is `ui-monospace` at 12px, letter-spaced, uppercase, ink at 55% on light layers and cream at 70% on dark ones, mirroring the `.foto-tag` convention from Phase 1. `glow.svg` has no caption because it is screen-blended.

- [ ] **Step 1: Create the sky**

`public/img/hero/sky.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0.17" y2="1">
      <stop offset="0" stop-color="#cfe0e8"/>
      <stop offset="0.4" stop-color="#f0d9b8"/>
      <stop offset="0.72" stop-color="#e8a862"/>
      <stop offset="1" stop-color="#b06a48"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.6" cy="0.3" r="0.55">
      <stop offset="0" stop-color="#fffaeb" stop-opacity="0.6"/>
      <stop offset="0.7" stop-color="#fffaeb" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#sky)"/>
  <rect width="1920" height="1080" fill="url(#glow)"/>
  <text x="1880" y="1044" text-anchor="end" font-family="ui-monospace, Menlo, monospace" font-size="12" letter-spacing="1.4" fill="#211b12" fill-opacity="0.55">FOTO · SKY · WINDOW SEAT, GOLDEN HOUR</text>
</svg>
```

- [ ] **Step 2: Create the glow**

`public/img/hero/glow.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <defs>
    <radialGradient id="sun" cx="0.72" cy="0.32" r="0.28">
      <stop offset="0" stop-color="#fff3d6" stop-opacity="0.95"/>
      <stop offset="0.45" stop-color="#f2c98a" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#e09a3e" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff3d6" stop-opacity="0"/>
      <stop offset="1" stop-color="#f0d9b8" stop-opacity="0.55"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#sun)"/>
  <ellipse cx="520" cy="760" rx="620" ry="120" fill="#fbead2" fill-opacity="0.5"/>
  <ellipse cx="1380" cy="820" rx="700" ry="140" fill="#fbead2" fill-opacity="0.45"/>
  <rect y="600" width="1920" height="480" fill="url(#haze)"/>
</svg>
```

- [ ] **Step 3: Create the horizon**

`public/img/hero/horizon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2400 800" width="2400" height="800">
  <defs>
    <linearGradient id="deck" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ede6d7" stop-opacity="0"/>
      <stop offset="0.22" stop-color="#ede6d7" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#e4dbc8"/>
    </linearGradient>
  </defs>
  <path d="M0 420 C300 340 520 470 800 400 S1300 300 1600 390 S2150 330 2400 400 V800 H0 Z" fill="url(#deck)"/>
  <ellipse cx="700" cy="470" rx="380" ry="60" fill="#f5f0e6" fill-opacity="0.8"/>
  <ellipse cx="1750" cy="450" rx="420" ry="70" fill="#f5f0e6" fill-opacity="0.8"/>
  <text x="2360" y="764" text-anchor="end" font-family="ui-monospace, Menlo, monospace" font-size="12" letter-spacing="1.4" fill="#211b12" fill-opacity="0.55">FOTO · CLOUD DECK</text>
</svg>
```

- [ ] **Step 4: Create the two window halves**

Both files draw the same rounded window surround (outer rounded rect minus inner opening, `fill-rule="evenodd"`) and clip to one half. The opening runs x 160–2080 and y 90–1270 so the title at `top: 19vh` sits inside it.

`public/img/hero/window-left.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2240 1400" width="2240" height="1400">
  <defs>
    <linearGradient id="frame" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4d3d2e"/>
      <stop offset="1" stop-color="#8a715a"/>
    </linearGradient>
    <clipPath id="half"><rect x="0" y="0" width="1120" height="1400"/></clipPath>
  </defs>
  <g clip-path="url(#half)">
    <path fill="url(#frame)" fill-rule="evenodd" d="M300 0 H1940 A260 260 0 0 1 2200 260 V1140 A260 260 0 0 1 1940 1400 H300 A260 260 0 0 1 40 1140 V260 A260 260 0 0 1 300 0 Z M320 90 H1920 A160 160 0 0 1 2080 250 V1110 A160 160 0 0 1 1920 1270 H320 A160 160 0 0 1 160 1110 V250 A160 160 0 0 1 320 90 Z"/>
    <path fill="none" stroke="#a58b6d" stroke-opacity="0.5" stroke-width="6" d="M320 90 H1920 A160 160 0 0 1 2080 250 V1110 A160 160 0 0 1 1920 1270 H320 A160 160 0 0 1 160 1110 V250 A160 160 0 0 1 320 90 Z"/>
    <text x="80" y="1352" font-family="ui-monospace, Menlo, monospace" font-size="12" letter-spacing="1.4" fill="#f6efe1" fill-opacity="0.7">FOTO · WINDOW FRAME L</text>
  </g>
</svg>
```

`public/img/hero/window-right.svg` is identical except the clip rect and the caption:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2240 1400" width="2240" height="1400">
  <defs>
    <linearGradient id="frame" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4d3d2e"/>
      <stop offset="1" stop-color="#8a715a"/>
    </linearGradient>
    <clipPath id="half"><rect x="1120" y="0" width="1120" height="1400"/></clipPath>
  </defs>
  <g clip-path="url(#half)">
    <path fill="url(#frame)" fill-rule="evenodd" d="M300 0 H1940 A260 260 0 0 1 2200 260 V1140 A260 260 0 0 1 1940 1400 H300 A260 260 0 0 1 40 1140 V260 A260 260 0 0 1 300 0 Z M320 90 H1920 A160 160 0 0 1 2080 250 V1110 A160 160 0 0 1 1920 1270 H320 A160 160 0 0 1 160 1110 V250 A160 160 0 0 1 320 90 Z"/>
    <path fill="none" stroke="#a58b6d" stroke-opacity="0.5" stroke-width="6" d="M320 90 H1920 A160 160 0 0 1 2080 250 V1110 A160 160 0 0 1 1920 1270 H320 A160 160 0 0 1 160 1110 V250 A160 160 0 0 1 320 90 Z"/>
    <text x="2160" y="1352" text-anchor="end" font-family="ui-monospace, Menlo, monospace" font-size="12" letter-spacing="1.4" fill="#f6efe1" fill-opacity="0.7">FOTO · WINDOW FRAME R</text>
  </g>
</svg>
```

- [ ] **Step 5: Create the wing and the close-up**

`public/img/hero/wing.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2140 900" width="2140" height="900">
  <defs>
    <linearGradient id="wing" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8a715a"/>
      <stop offset="1" stop-color="#4d3d2e"/>
    </linearGradient>
  </defs>
  <polygon points="800,900 1500,760 2140,520 2140,900" fill="url(#wing)" fill-opacity="0.9"/>
  <text x="2100" y="870" text-anchor="end" font-family="ui-monospace, Menlo, monospace" font-size="12" letter-spacing="1.4" fill="#f6efe1" fill-opacity="0.7">FOTO · WING</text>
</svg>
```

`public/img/hero/closeup.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2160 1400" width="2160" height="1400">
  <defs>
    <linearGradient id="suite" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="#ede6d7"/>
      <stop offset="0.55" stop-color="#b0782f"/>
      <stop offset="1" stop-color="#3a2a1a"/>
    </linearGradient>
    <radialGradient id="window" cx="0.28" cy="0.3" r="0.4">
      <stop offset="0" stop-color="#fff8e8" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#fff8e8" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="2160" height="1400" fill="url(#suite)"/>
  <rect width="2160" height="1400" fill="url(#window)"/>
  <text x="2120" y="1364" text-anchor="end" font-family="ui-monospace, Menlo, monospace" font-size="12" letter-spacing="1.4" fill="#f6efe1" fill-opacity="0.7">FOTO · THE STAY, LATE LIGHT</text>
</svg>
```

- [ ] **Step 6: Validate the files are well-formed and the right size**

Run:

```bash
for f in public/img/hero/*.svg; do xmllint --noout "$f" && echo "ok $f"; done
grep -c 'viewBox' public/img/hero/*.svg
```

Expected: seven `ok` lines and no parser errors; every file has one `viewBox`.

- [ ] **Step 7: Checkpoint (no git write)**

Run: `git status --short public/`
Expected: `?? public/img/hero/` only.

---

### Task 3: Composables

**Files:**
- Create: `app/composables/useHeroUnderNav.ts`
- Create: `app/composables/useInfiniteSlider.ts`
- Create: `app/composables/useCinemaScroll.ts`

**Interfaces:**
- Consumes from Task 1: `cinemaFrame`, `nextSmoothScroll`, `lerp`, `clamp`, `normalizeSightIndex`, type `CinemaLive`.
- Produces:
  - `useHeroUnderNav(): Ref<boolean>` (Nuxt `useState`, key `'hero-under-nav'`)
  - `useInfiniteSlider(track: Ref<HTMLElement | null>, count: number): { active: Ref<number>, jumping: Ref<boolean>, move(dir: 1 | -1): void, select(index: number): void, update(): void, onTransitionEnd(event: TransitionEvent): void }`
  - `useCinemaScroll(section: Ref<HTMLElement | null>, options: { onResize: () => void }): { controlsReady: Ref<boolean>, live: Ref<CinemaLive> }`

- [ ] **Step 1: Create `useHeroUnderNav`**

`app/composables/useHeroUnderNav.ts`:

```ts
/**
 * True while the cinematic hero's stage sits under the site nav, which then
 * renders transparent (SiteNav reads this; HeroCinema and useCinemaScroll write it).
 *
 * The default comes from the route meta because during SSR the layout renders
 * SiteNav before the page's hero runs its setup. index.vue declares
 * `definePageMeta({ cinematicHero: true })`, so server HTML and the first
 * client frame agree and there is no hydration flash.
 */
export function useHeroUnderNav() {
  return useState<boolean>('hero-under-nav', () => useRoute().meta.cinematicHero === true)
}
```

- [ ] **Step 2: Create `useInfiniteSlider`**

`app/composables/useInfiniteSlider.ts`:

```ts
import { normalizeSightIndex } from '~/utils/cinema'

/**
 * Source spec §8 over Vue-rendered cards. HeroCinema renders three identical
 * sets of `count` cards inside `track`; this keeps `active` in the middle set
 * by jumping one set without a transition whenever a slide ends outside it.
 */
export function useInfiniteSlider(track: Ref<HTMLElement | null>, count: number) {
  const active = ref(count) // first card of the middle set
  const jumping = ref(false)

  function update() {
    const el = track.value
    const first = el?.querySelector<HTMLElement>('.sight-card')
    if (!el || !first) return
    const cardWidth = first.offsetWidth
    const gap = Number.parseFloat(getComputedStyle(el).columnGap || '0') || 0
    el.style.setProperty('--sights-shift', `${-(cardWidth + gap) * active.value}px`)
  }

  function move(dir: 1 | -1) {
    active.value += dir
    update()
  }

  function select(index: number) {
    if (!Number.isFinite(index)) return
    active.value = index
    update()
  }

  async function jump(index: number) {
    jumping.value = true
    // Wait for `.is-jumping` (transition: none) to reach the DOM before moving the track.
    await nextTick()
    active.value = index
    update()
    requestAnimationFrame(() => requestAnimationFrame(() => {
      jumping.value = false
    }))
  }

  function onTransitionEnd(event: TransitionEvent) {
    if (event.target !== track.value || count === 0) return
    const next = normalizeSightIndex(active.value, count)
    if (next !== null) void jump(next)
  }

  onMounted(update)

  return { active, jumping, move, select, update, onTransitionEnd }
}
```

- [ ] **Step 3: Create `useCinemaScroll`**

`app/composables/useCinemaScroll.ts`:

```ts
import type { CinemaLive } from '~/utils/cinema'
import { cinemaFrame, clamp, lerp, nextSmoothScroll } from '~/utils/cinema'

/**
 * The per-frame engine from the source spec §7. Owns scroll and pointer
 * smoothing and the rAF guard, and writes every custom property onto the
 * section element (not :root). Also publishes whether the stage still sits
 * under the nav, and a `data-settled` flag the verify script waits on.
 */
export function useCinemaScroll(section: Ref<HTMLElement | null>, options: { onResize: () => void }) {
  const controlsReady = ref(false)
  const live = ref<CinemaLive>({ intro: true, panel2: false, panel3: false })
  const underNav = useHeroUnderNav()

  let targetMouseX = 0
  let targetMouseY = 0
  let mouseX = 0
  let mouseY = 0
  let targetScroll = 0
  let smoothScroll = 0
  let initialized = false
  let rafPending = false
  let rafId = 0
  let navH = 68
  let reduceMotion: MediaQueryList | null = null

  function getScrollDistance(el: HTMLElement) {
    return clamp(-el.getBoundingClientRect().top, 0, el.offsetHeight - window.innerHeight)
  }

  function update() {
    rafPending = false
    const el = section.value
    if (!el) return
    const reduce = reduceMotion?.matches ?? false

    targetScroll = getScrollDistance(el)
    smoothScroll = nextSmoothScroll(smoothScroll, targetScroll, initialized, reduce)
    initialized = true

    mouseX = lerp(mouseX, targetMouseX, 0.12)
    mouseY = lerp(mouseY, targetMouseY, 0.12)

    const frame = cinemaFrame({ scroll: smoothScroll, mouseX, mouseY, innerHeight: window.innerHeight, reduceMotion: reduce })
    for (const [name, value] of Object.entries(frame.vars)) el.style.setProperty(name, value)

    if (controlsReady.value !== frame.controlsReady) controlsReady.value = frame.controlsReady
    const l = live.value
    if (l.intro !== frame.live.intro || l.panel2 !== frame.live.panel2 || l.panel3 !== frame.live.panel3) {
      live.value = frame.live
    }

    const under = el.getBoundingClientRect().bottom > navH
    if (underNav.value !== under) underNav.value = under

    const moving = Math.abs(smoothScroll - targetScroll) > 0.08
      || Math.abs(mouseX - targetMouseX) > 0.001
      || Math.abs(mouseY - targetMouseY) > 0.001
    if (moving) requestTick()
    else el.dataset.settled = 'true'
  }

  function requestTick() {
    if (rafPending) return
    rafPending = true
    if (section.value) section.value.dataset.settled = 'false'
    rafId = requestAnimationFrame(update)
  }

  const onScroll = () => requestTick()
  const onResize = () => {
    options.onResize()
    requestTick()
  }
  const onPointerMove = (event: PointerEvent) => {
    targetMouseX = event.clientX / window.innerWidth - 0.5
    targetMouseY = event.clientY / window.innerHeight - 0.5
    requestTick()
  }

  onMounted(() => {
    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    navH = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 68
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    requestTick()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('pointermove', onPointerMove)
    cancelAnimationFrame(rafId)
    rafPending = false
  })

  return { controlsReady, live }
}
```

- [ ] **Step 4: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: both exit 0. The composables are unused until Task 4; that is not a lint error.

- [ ] **Step 5: Checkpoint (no git write)**

Run: `git status --short app/composables/`
Expected: three `??` lines for the new files.

---

### Task 4: Config, form prop, nav height token, band anchor, and the HeroCinema component

**Files:**
- Modify: `app/app.config.ts`
- Modify: `app/components/SubscribeForm.vue`
- Modify: `app/assets/css/main.css`
- Modify: `app/components/SubscribeBand.vue`
- Create: `app/components/HeroCinema.vue`
- Modify: `app/pages/index.vue`
- Delete: `app/components/HeroStage.vue`

**Interfaces:**
- Consumes: Task 1 `formatIssueNo` (existing util) and `cinema.ts`; Task 3 composables; `Issue` type from `app/composables/useIssues.ts`.
- Produces: `HeroCinema` props `{ issues: Issue[], issueCount: number }`; `SubscribeForm` prop `meta?: boolean` (default `true`); `hero` block in app config; `--nav-h` custom property on `:root`; `#subscribe` now on the band's form.

- [ ] **Step 1: Add the `hero` block to `app/app.config.ts`**

Insert after the `subscribe: { ... },` object and before `// Programmes covered, in marquee order.`:

```ts
  // Cinematic hero. Panels are named, not an array, so each keeps its own shape.
  hero: {
    title: 'The Upgrade',
    intro: { lead: 'Status, strategy, and the stays', em: 'worth the miles.' },
    tagsLabel: 'What you get',
    panels: {
      maths: {
        heading: 'The maths first, then the moment.',
        body: 'A letter for people who chase elite status from KUL and want the maths and the moment. Which tier is worth it, which stays justify it, and what to do with the points you already have.',
        facts: [
          { of: 'issues', label: 'issues and counting' },
          { of: 'programmes', label: 'programmes covered' },
        ] as { of: 'issues' | 'programmes', label: string }[],
      },
      letter: {
        heading: 'Fortnightly from Kuala Lumpur.',
        body: 'A fortnightly letter from Kuala Lumpur on elite status, loyalty strategy and the hotels and cabins that justify the chase.',
        cta: { label: 'Read the latest issue', to: '#latest' },
      },
    },
    slider: {
      label: 'Recent issues',
      prev: 'Previous issue',
      next: 'Next issue',
      card: 'Open issue {no} card',
    },
  },
```

- [ ] **Step 2: Add the `meta` prop to `SubscribeForm.vue`**

Replace the first line of the script:

```ts
const props = defineProps<{ variant: 'hero' | 'dark' }>()
```

with:

```ts
const props = withDefaults(defineProps<{
  variant: 'hero' | 'dark'
  /** Render the mono "Free · Fortnightly · …" row. The cinematic hero shows those words as pills instead. */
  meta?: boolean
}>(), { meta: true })
```

Then wrap the meta row: change

```vue
      <div
        class="meta flex flex-wrap gap-3.5 font-mono text-[11px] uppercase tracking-[.1em]"
        :class="ui.meta"
      >
```

to

```vue
      <div
        v-if="props.meta"
        class="meta flex flex-wrap gap-3.5 font-mono text-[11px] uppercase tracking-[.1em]"
        :class="ui.meta"
      >
```

- [ ] **Step 3: Add `--nav-h` to `main.css`**

In the `:root { ... }` block (the one holding `--gutter`), add as the first line:

```css
  --nav-h: 68px;
```

- [ ] **Step 4: Move the `#subscribe` anchor to the band**

In `app/components/SubscribeBand.vue` change `<SubscribeForm variant="dark" />` to:

```vue
      <SubscribeForm
        id="subscribe"
        variant="dark"
      />
```

(The `id` falls through to the form's root element.)

- [ ] **Step 5: Create `app/components/HeroCinema.vue`, script and template**

```vue
<script setup lang="ts">
import type { Issue } from '~/composables/useIssues'

const props = defineProps<{
  /** Newest first; the slider shows these in three looping sets. */
  issues: Issue[]
  /** Total issue count for the "issues and counting" fact. */
  issueCount: number
}>()

const { site, hero, subscribe, programmes } = useAppConfig()

// SiteNav goes transparent while this stage sits under it. The route meta seeds
// the SSR value; the engine keeps it current; leaving the page resets it.
const underNav = useHeroUnderNav()
underNav.value = true
onBeforeUnmount(() => {
  underNav.value = false
})

const section = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)

const count = props.issues.length
// Three identical sets so the track loops without a seam (source spec §8).
const cards = [0, 1, 2].flatMap(set => props.issues.map((issue, i) => ({
  issue,
  index: set * count + i,
  key: `${set}-${issue.issueNo}`,
})))

const { active, jumping, move, select, update, onTransitionEnd } = useInfiniteSlider(track, count)
const { controlsReady, live } = useCinemaScroll(section, { onResize: update })

const facts = hero.panels.maths.facts.map(fact => ({
  ...fact,
  value: fact.of === 'issues'
    ? formatIssueNo(props.issueCount)
    : String(programmes.length).padStart(2, '0'),
}))

const storyLabel = `${site.name} cinematic scroll story`
const overviewLabel = `${site.name} overview`

function cardLabel(issue: Issue) {
  return hero.slider.card.replace('{no}', formatIssueNo(issue.issueNo))
}
</script>

<template>
  <section
    id="cinema"
    ref="section"
    class="cinema-scroll"
    :aria-label="storyLabel"
    data-settled="false"
  >
    <div class="stage">
      <div class="world">
        <img
          class="scene-img sky-img"
          src="/img/hero/sky.svg"
          alt=""
        >

        <div class="back-stack">
          <img
            class="scene-img back-img back-four"
            src="/img/hero/glow.svg"
            alt=""
          >

          <section
            class="sights-slider"
            :aria-label="hero.slider.label"
          >
            <div
              ref="track"
              class="sights-track"
              :class="{ 'is-jumping': jumping }"
              @transitionend="onTransitionEnd"
            >
              <article
                v-for="card in cards"
                :key="card.key"
                class="sight-card"
                :class="{ 'is-active': card.index === active }"
                :data-sight-index="card.index"
                tabindex="0"
                role="button"
                :aria-label="cardLabel(card.issue)"
                @click="select(card.index)"
                @keydown.enter.prevent="select(card.index)"
                @keydown.space.prevent="select(card.index)"
              >
                <span class="sight-kicker">{{ card.issue.category }}</span>
                <img
                  class="sight-pin"
                  src="/brand/svg/mark-amber.svg"
                  alt=""
                >
                <h3>{{ card.issue.title }}</h3>
                <p>{{ card.issue.dek }}</p>
              </article>
            </div>
          </section>

          <img
            class="scene-img back-img back-bazaar"
            src="/img/hero/horizon.svg"
            alt=""
          >
        </div>

        <div
          class="sights-controls"
          :class="{ 'is-ready': controlsReady }"
          aria-label="Slider controls"
        >
          <button
            type="button"
            class="sight-nav sight-prev"
            :aria-label="hero.slider.prev"
            :disabled="!controlsReady"
            @click="move(-1)"
          >
            ←
          </button>
          <button
            type="button"
            class="sight-nav sight-next"
            :aria-label="hero.slider.next"
            :disabled="!controlsReady"
            @click="move(1)"
          >
            →
          </button>
        </div>

        <h1 class="hero-title">
          {{ hero.title }}
        </h1>

        <img
          class="scene-img splitframe-img splitframe-left"
          src="/img/hero/window-left.svg"
          alt=""
        >
        <img
          class="scene-img splitframe-img splitframe-right"
          src="/img/hero/window-right.svg"
          alt=""
        >
        <img
          class="scene-img bridge-img"
          src="/img/hero/wing.svg"
          alt=""
        >
        <img
          class="scene-img frame-two-img"
          src="/img/hero/closeup.svg"
          alt=""
        >
        <div class="shade" />
      </div>

      <section
        class="intro-copy"
        :class="{ 'is-live': live.intro }"
        :aria-label="overviewLabel"
      >
        <p>{{ hero.intro.lead }} <em>{{ hero.intro.em }}</em></p>
        <SubscribeForm
          variant="hero"
          :meta="false"
        />
        <div
          class="hero-tags"
          :aria-label="hero.tagsLabel"
        >
          <span
            v-for="word in subscribe.meta"
            :key="word"
          >{{ word }}</span>
        </div>
      </section>

      <section
        class="story-panel story-panel-bridge"
        :class="{ 'is-live': live.panel2 }"
        :aria-label="hero.panels.maths.heading"
      >
        <h2>{{ hero.panels.maths.heading }}</h2>
        <p>{{ hero.panels.maths.body }}</p>
        <dl class="facts">
          <div
            v-for="fact in facts"
            :key="fact.of"
          >
            <dt>{{ fact.value }}</dt>
            <dd>{{ fact.label }}</dd>
          </div>
        </dl>
      </section>

      <section
        class="story-panel story-panel-bazaar"
        :class="{ 'is-live': live.panel3 }"
        :aria-label="hero.panels.letter.heading"
      >
        <h2>{{ hero.panels.letter.heading }}</h2>
        <p>{{ hero.panels.letter.body }}</p>
        <NuxtLink
          class="note-button"
          :to="hero.panels.letter.cta.to"
          :tabindex="live.panel3 ? undefined : -1"
        >
          <span aria-hidden="true">↗</span>
          <span>{{ hero.panels.letter.cta.label }}</span>
        </NuxtLink>
      </section>
    </div>
  </section>
</template>
```

The `<style scoped>` block is Step 6, appended to the same file.

- [ ] **Step 6: Append the scoped CSS to `HeroCinema.vue`**

Append after `</template>`:

```vue
<style scoped>
/* ── Custom properties: source spec §4, scoped to the section (delta 1). ── */
.cinema-scroll {
  --mx: 0;
  --my: 0;
  --back-opacity: 1;
  --back-x: 0px;
  --back-y: 0px;
  --back-scale: 0.76;
  --four-y: 10vh;
  --four-scale: 0.78;
  --bazaar-y: 20vh;
  --blur-px: 0px;
  --back-brightness: 1;
  --bazaar-blur-px: 0px;
  --bazaar-brightness: 1;
  --bazaar-saturation: 1;
  --shade-opacity: 1;
  --shade-z: 2;
  --shade-top-alpha: 0;
  --shade-mid-alpha: 0;
  --shade-bottom-alpha: 0;
  --blur-tint: 176, 120, 47; /* #b0782f amber; the source's blue 74,181,224 (delta 10) */
  --title-y: 0px;
  --title-scale: 1;
  --title-opacity: 1;
  --bridge-x: -50%;
  --bridge-y: 0px;
  --bridge-bottom: 5vh;
  --bridge-width: 67.2vw;
  --bridge-scale: 1.02;
  --split-left-x: -50%;
  --split-left-y: 0px;
  --split-left-scale: 1;
  --split-right-x: -50%;
  --split-right-y: 0px;
  --split-right-scale: 1;
  --frame2-opacity: 0;
  --frame2-x: -50%;
  --frame2-y: -50%;
  --frame2-scale: 1.06;
  --intro-copy-y: 0px;
  --intro-copy-opacity: 1;
  --panel2-opacity: 0;
  --panel2-y: calc(-50% + 58px);
  --panel3-opacity: 0;
  --panel3-y: calc(-50% + 58px);
  --sights-opacity: 0;
  --sights-controls-opacity: 0;
  --sights-y: 0px;
  --sights-enter-x: 420vw;
  --sights-visibility: hidden;
  --sights-shift: 0px;
  --sights-scale: 1;
  --sights-top: clamp(112px, 19vh, 220px);
  --sights-screen-top: clamp(112px, 19vh, 220px);
  --shadow: rgba(0, 0, 0, 0.32);

  position: relative;
  height: calc(100vh + 3700px);
  margin-top: calc(-1 * var(--nav-h)); /* stage starts under the transparent nav (delta 20) */
  color: var(--color-dark-cream);
  letter-spacing: 0;
}

/* ── Scroll rig ── */
.stage {
  position: sticky;
  top: 0;
  height: 100vh;
  min-height: 620px;
  overflow: hidden;
  isolation: isolate;
  background: #cfe0e8;
}

.world,
.back-stack,
.sky-img,
.shade,
.scene-img,
.sights-slider,
.sights-controls,
.hero-title,
.intro-copy,
.story-panel {
  position: absolute;
}

.world {
  inset: 0;
  overflow: hidden;
  background: #cfe0e8;
}

/* ── Scene images ── */
.scene-img {
  display: block;
  max-width: none; /* Tailwind preflight caps img at 100%; the layers are wider than the stage */
  user-select: none;
  -webkit-user-drag: none;
  will-change: transform, opacity, filter;
  pointer-events: none;
}

.sky-img {
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: none;
  filter: blur(var(--blur-px)) brightness(var(--back-brightness));
}

.back-stack {
  top: 0;
  bottom: 0;
  left: -3vw;
  right: -3vw;
  z-index: 1;
  opacity: var(--back-opacity);
  transform: translate3d(var(--back-x), var(--back-y), 0) scale(var(--back-scale));
  transform-origin: 50% 100%;
  will-change: transform, filter, opacity;
}

.back-img {
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(var(--blur-px)) brightness(var(--back-brightness));
}

.back-bazaar,
.back-four {
  top: auto;
  bottom: 0;
  left: 48%;
  right: auto;
  width: 112%;
  height: auto;
  object-fit: contain;
}

.back-bazaar {
  z-index: 3;
  opacity: 1;
  filter: blur(var(--bazaar-blur-px)) brightness(var(--bazaar-brightness)) saturate(var(--bazaar-saturation));
  transform: translate3d(-50%, var(--bazaar-y), 0) scale(0.86);
}

.back-four {
  z-index: 1;
  opacity: 0.72;
  mix-blend-mode: screen;
  transform: translate3d(-50%, calc(var(--four-y) - 110px), 0) scale(var(--four-scale));
}

/* ── Slider ── */
.sights-slider {
  left: 0;
  right: 0;
  top: var(--sights-top);
  z-index: 2;
  padding: 0;
  opacity: 1; /* the fade is visibility + X translate, not opacity */
  visibility: var(--sights-visibility);
  transform: translate3d(var(--sights-enter-x), var(--sights-y), 0) scale(var(--sights-scale));
  transform-origin: 0 0;
  pointer-events: auto;
  will-change: transform;
}

.sights-track {
  display: flex;
  gap: clamp(16px, 1.15vw, 24px);
  align-items: stretch;
  transform: translate3d(calc(var(--sights-shift) - 18vw), 0, 0);
  transition: transform 640ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.sights-track.is-jumping {
  transition: none;
}

.sight-card {
  position: relative;
  flex: 0 0 clamp(360px, 19.4vw, 430px);
  height: 220px;
  padding: 24px;
  overflow: hidden;
  border: 1px solid color-mix(in oklab, var(--color-paper) 42%, transparent);
  border-radius: 24px;
  color: var(--color-ink);
  background: var(--color-paper);
  box-shadow: 0 18px 52px rgba(60, 40, 15, 0.12);
  backdrop-filter: none;
  cursor: pointer;
  pointer-events: auto;
  user-select: none;
}

.sight-card::before,
.sight-card::after {
  content: none;
}

.sight-card:focus-visible,
.sight-card.is-active {
  outline: none;
}

.sight-kicker,
.sight-card h3,
.sight-card p {
  position: relative;
  z-index: 1;
  text-shadow: none;
}

.sight-kicker {
  display: block;
  margin-bottom: 56px;
  color: var(--color-ink);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.05;
  text-transform: uppercase;
}

.sight-pin {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 67.2px;
  height: 67.2px;
  pointer-events: none;
}

.sight-card h3 {
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: calc(24px + (16px * 1.16 * 2) + 12px);
  max-width: calc(100% - 76px);
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-sans);
  font-size: 24px;
  font-weight: 700; /* the source's 800; Satoshi tops out at 700 (delta 6) */
  line-height: 0.95;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sight-card p {
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 24px;
  max-width: 100%;
  margin: 12px 0 0;
  color: var(--color-ink);
  font-size: 16px;
  font-weight: 400;
  line-height: 1.16;
  display: -webkit-box;
  max-height: calc(2em * 1.16);
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.sights-controls {
  left: 48px;
  right: auto;
  top: calc(var(--sights-screen-top) + 220px + 16px);
  z-index: 5;
  display: flex;
  justify-content: flex-start;
  gap: 14px;
  opacity: var(--sights-controls-opacity);
  transform: translate3d(0, var(--sights-y), 0);
  pointer-events: none;
  will-change: transform, opacity;
}

.sights-controls.is-ready {
  pointer-events: auto;
}

.sight-nav {
  width: 54px;
  height: 54px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  color: var(--color-ink);
  background: color-mix(in oklab, var(--color-paper) 94%, transparent);
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.2);
  font: inherit;
  cursor: pointer;
}

/* ── Title and foreground layers ── */
.hero-title {
  left: 50%;
  top: clamp(122px, 19vh, 205px);
  z-index: 3;
  width: min(94vw, 1780px);
  margin: 0;
  color: var(--color-dark-cream);
  font-family: var(--font-sans);
  font-size: 14rem;
  font-weight: 500;
  letter-spacing: -0.03em; /* site heading tracking for Satoshi (delta 5) */
  line-height: 0.78;
  text-align: center;
  text-shadow: none;
  transform: translate3d(-50%, var(--title-y), 0) scale(var(--title-scale));
  opacity: var(--title-opacity);
  will-change: transform, opacity;
}

.bridge-img {
  left: 50%;
  bottom: var(--bridge-bottom);
  z-index: 4;
  width: min(var(--bridge-width), 2140px);
  height: auto;
  transform: translate3d(var(--bridge-x), var(--bridge-y), 0) scale(var(--bridge-scale));
  transform-origin: 50% 48%;
}

.splitframe-img {
  left: 50%;
  bottom: -2vh;
  z-index: 6;
  width: min(118vw, 2240px);
  height: auto;
  pointer-events: none;
}

.splitframe-left {
  transform: translate3d(var(--split-left-x), var(--split-left-y), 0) scale(var(--split-left-scale));
  transform-origin: 21% 52%;
}

.splitframe-right {
  transform: translate3d(var(--split-right-x), var(--split-right-y), 0) scale(var(--split-right-scale));
  transform-origin: 79% 52%;
}

.frame-two-img {
  filter: none !important;
  backdrop-filter: none;
  left: 50%;
  top: 50%;
  z-index: 5;
  width: min(122vw, 2160px);
  height: auto;
  opacity: var(--frame2-opacity);
  transform: translate3d(var(--frame2-x), var(--frame2-y), 0) scale(var(--frame2-scale));
  transform-origin: 50% 48%;
}

.shade {
  inset: 0;
  z-index: var(--shade-z);
  pointer-events: none;
  opacity: var(--shade-opacity);
  background: linear-gradient(
    180deg,
    rgba(var(--blur-tint), var(--shade-top-alpha)) 0%,
    rgba(var(--blur-tint), var(--shade-mid-alpha)) 48%,
    rgba(var(--blur-tint), var(--shade-bottom-alpha)) 100%
  );
}

/* ── Intro copy ── */
.intro-copy {
  left: 50%;
  bottom: clamp(56px, 28vh, 400px);
  z-index: 9;
  width: min(560px, calc(100vw - 40px));
  text-align: center;
  transform: translate3d(-50%, var(--intro-copy-y), 0);
  opacity: var(--intro-copy-opacity);
  will-change: transform, opacity;
}

.intro-copy p {
  margin: 0 auto;
  max-width: 560px;
  color: var(--color-dark-cream);
  font-size: 1.18rem;
  font-weight: 500;
  line-height: 1.18;
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.42);
}

.intro-copy p em {
  font-style: italic;
  font-weight: 400;
  color: var(--color-amber-bright);
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 26px;
}

.hero-tags span {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 25px;
  color: var(--color-ink);
  border-radius: 999px;
  background: var(--color-paper);
  font-size: 0.98rem;
  font-weight: 500;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
}

/* ── Story panels ── */
.story-panel {
  left: 50%;
  top: 45%;
  z-index: 10;
  width: min(760px, calc(100vw - 42px));
  text-align: center;
  pointer-events: none;
  transform: translate3d(-50%, -50%, 0);
  will-change: transform, opacity;
}

.story-panel h2 {
  margin: 0;
  color: var(--color-dark-cream);
  font-family: var(--font-sans);
  font-size: 4.75rem;
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 0.95;
  text-shadow: 0 16px 38px var(--shadow);
}

.story-panel p {
  width: min(520px, 100%);
  margin: 26px auto 0;
  color: var(--color-dark-cream);
  font-size: 1.14rem;
  font-weight: 500;
  line-height: 1.18;
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.42);
}

.story-panel-bridge {
  top: 60%;
  opacity: var(--panel2-opacity);
  transform: translate3d(-50%, var(--panel2-y), 0);
}

.story-panel-bazaar {
  top: 29%;
  opacity: var(--panel3-opacity);
  transform: translate3d(-50%, var(--panel3-y), 0);
}

.facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 86px;
  width: min(470px, 100%);
  margin: 72px auto 0;
}

.facts dt {
  color: var(--color-dark-cream);
  font-family: var(--font-sans);
  font-size: 4.2rem;
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 0.9;
  text-shadow: 0 14px 34px var(--shadow);
}

.facts dd {
  margin: 18px 0 0;
  color: var(--color-dark-cream);
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.14;
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.42);
}

.note-button {
  min-height: 50px;
  margin-top: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 28px;
  border-radius: 999px;
  color: var(--color-ink);
  background: var(--color-paper);
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.18);
  pointer-events: auto;
  cursor: pointer;
}

.note-button span:first-child {
  font-size: 1.25rem;
  line-height: 1;
}

/* Blocks at opacity 0 must not take clicks or focus (delta 24). */
.intro-copy:not(.is-live),
.story-panel:not(.is-live) {
  visibility: hidden;
}

/* ── Media queries: source spec §6, minus the removed in-stage header ── */
@media (max-width: 1500px) {
  .hero-title { font-size: 11rem; }
  .story-panel h2 { font-size: 4.1rem; }
}

@media (max-width: 1100px) {
  .hero-title { top: 15vh; font-size: 7.5rem; }
  .bridge-img { width: 138vw; }
  .frame-two-img { width: 132vw; }
  .story-panel h2 { font-size: 3.2rem; }
  .facts { gap: 34px; margin-top: 44px; }
  .facts dt { font-size: 3.2rem; }
  .sight-card { flex-basis: clamp(320px, 40vw, 390px); min-height: 178px; }
}

@media (max-width: 640px) {
  .stage { min-height: 640px; }
  .hero-title { top: 16vh; font-size: 4.5rem; }
  .bridge-img { bottom: 2vh; width: 190vw; }
  .frame-two-img { width: 176vw; }
  .intro-copy { bottom: 42px; }
  .intro-copy p, .story-panel p { font-size: 1rem; }
  .hero-tags { gap: 8px; }
  .hero-tags span { min-height: 38px; padding: 0 16px; font-size: 0.88rem; }
  .story-panel { top: 42%; }
  .story-panel-bazaar { top: 26%; }
  .story-panel h2 { font-size: 2.45rem; }
  .facts { gap: 18px; margin-top: 34px; }
  .facts dt { font-size: 2.5rem; }
  .sights-slider { padding: 0; }
  .sights-track { gap: 12px; transform: translate3d(calc(var(--sights-shift) - 18vw), 0, 0); }
  .sight-card { flex-basis: min(82vw, 330px); height: 220px; padding: 24px; border-radius: 24px; }
  .sights-controls { top: calc(var(--sights-screen-top) + 236px); }
  .sight-card h3 { max-width: 78%; }
  .sight-card p { max-width: 100%; margin-top: 10px; }
  .sight-kicker { margin-bottom: 56px; }
  .sight-pin { top: 24px; right: 24px; width: 57.6px; height: 57.6px; }
}

@media (prefers-reduced-motion: reduce) {
  .scene-img,
  .back-stack,
  .hero-title,
  .intro-copy,
  .story-panel,
  .sights-track,
  .sights-slider {
    transition: none;
  }
}
</style>
```

- [ ] **Step 7: Swap the hero into `app/pages/index.vue` and delete `HeroStage.vue`**

Replace the script block of `app/pages/index.vue` with:

```vue
<script setup lang="ts">
definePageMeta({ cinematicHero: true })

const { featured, recent, all } = await useIssues()
</script>
```

Replace `<HeroStage :issue-no="featured?.issueNo ?? 0" />` with:

```vue
    <HeroCinema
      :issues="all.slice(0, 5)"
      :issue-count="all.length"
    />
```

Then delete the old component:

```bash
rm app/components/HeroStage.vue
grep -rn "HeroStage" app/ scripts/ || echo "no references left"
```

Expected: `no references left`. (`featured` is still used by the featured-issue section below; leave it.)

- [ ] **Step 8: Typecheck, lint, generate**

Run: `pnpm typecheck && pnpm lint && pnpm generate`
Expected: all exit 0 and `.output/public/index.html` is regenerated. If typecheck complains that `hero.panels.maths.facts` is not iterable, the `as { of: ..., label: string }[]` assertion from Step 1 is missing.

- [ ] **Step 9: Confirm the prerendered HTML carries the scroll-zero state**

Run:

```bash
grep -o 'class="[^"]*cinema-scroll[^"]*"' .output/public/index.html | head -1
grep -c 'class="sight-card' .output/public/index.html
grep -o 'intro-copy[^"]*is-live' .output/public/index.html | head -1
grep -c 'src="/img/hero/' .output/public/index.html
grep -c 'figma.site\|cloudfront.net' .output/public/index.html
```

Expected, in order: one `cinema-scroll` class, `15` cards, one `intro-copy is-live` match, `7` hero image references, `0` remote asset hosts.

- [ ] **Step 10: Checkpoint (no git write)**

Run: `git status --short app/`
Expected: `M app/app.config.ts`, `M app/assets/css/main.css`, `M app/components/SubscribeBand.vue`, `M app/components/SubscribeForm.vue`, `D app/components/HeroStage.vue`, `M app/pages/index.vue`, `?? app/components/HeroCinema.vue`, plus the three `??` composables and `?? app/utils/cinema.ts`.

---

### Task 5: Verify script for the new hero (written before the nav change so it fails on the nav checks first)

**Files:**
- Modify: `scripts/verify.mjs`

**Interfaces:**
- Consumes: the DOM from Task 4 (`.cinema-scroll[data-settled]`, `.stage`, `.hero-title`, `.intro-copy`, `.sights-controls.is-ready`, `.sight-card.is-active[data-sight-index]`, `.note-button`), and the header element from `SiteNav`.
- Produces: `report.viewports['390x844'].hero` with the new fields and `report.scrub` with one entry per scroll position.

- [ ] **Step 1: Replace `HERO_CHECK`**

Replace the whole `const HERO_CHECK = () => { ... }` function with:

```js
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
```

And replace the block that consumes it inside the viewport loop:

```js
      if (entry.hero) {
        const h = entry.hero
        const fits = h.h1Bottom <= h.heroBottom && h.ledeBottom <= h.heroBottom && h.fieldBottom <= h.heroBottom
        const withinMin = h.heroHeight <= Math.ceil(h.heroMinHeight) + 1
        entry.hero.fits = fits
        entry.hero.withinMinHeight = withinMin
        if (!fits || !withinMin) failures++
      }
```

with:

```js
      if (entry.hero) {
        const h = entry.hero
        const fits = h.titleBottom < h.introTop
          && h.introBottom <= h.stageBottom
          && h.fieldBottom <= h.stageBottom
          && h.stageHeight >= 640
        entry.hero.fits = fits
        if (!fits) failures++
      }
```

- [ ] **Step 2: Add the scrub checks**

Add these two constants after `FONT_CHECK`:

```js
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
  0: r => r.titleOpacity === 1 && r.sightsVisibility === 'hidden' && r.headerBg === TRANSPARENT
    && r.cardsHidden && r.controlsDisabled && r.noteHidden && r.introHidden === false,
  1100: r => r.titleOpacity === 0 && r.frame2 >= 0.99 && r.panel2 >= 0.99 && r.introHidden,
  2300: r => r.panel3 >= 0.99 && r.frame2 <= 0.01 && r.noteHidden === false,
  3700: r => r.sightsVisibility === 'visible' && r.sightsEnterX === '0vw' && r.controlsReady
    && r.headerBg === TRANSPARENT && r.activeCard === '5',
  4700: r => r.headerBg !== TRANSPARENT,
}
```

Then add this block inside `main()`'s `try`, after the viewport loop and before the reduced-motion block:

```js
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
      report.scrub.errors = errors
      if (errors.length) failures++
      await context.close()
    }
```

- [ ] **Step 3: Update the header comment of the script**

Replace lines 3 and 4 of the comment (`2. flags any element...` through `4. confirms...`) so the list reads:

```js
 *   1. screenshots / at 390x844, 820x1180, 1440x900 (+ full page at 390 and 1440)
 *   2. flags any element whose right edge passes the viewport width
 *   3. checks at 390 that the cinematic hero's title sits above the intro block and the intro fits the stage
 *   4. scrubs the pinned story at 1440x900 (0, 1100, 2300, 3700, 4700) and asserts the engine state and nav
 *   5. confirms the page is static under prefers-reduced-motion (marquee included)
```

- [ ] **Step 4: Run it and read the result honestly**

Run: `pnpm verify`
Expected: `VERIFY FAILED (1 check group(s))` where the only failures are `report.scrub[0].ok === false` and `report.scrub[3700].ok === false` because `headerBg` is still the cream bar (SiteNav is unchanged until Task 6). Every other group passes: no overflow, no console errors, `hero.fits === true` at 390, `scrub[1100]`, `scrub[2300]`, `scrub[4700]` and `afterNext` ok, reduced motion static.

If `hero.fits` fails, print `report.viewports['390x844'].hero` and fix the layout, not the check. If the wait for `data-settled` times out, the engine never settled: look for a `pageerror` in `report.scrub.errors` first.

- [ ] **Step 5: Look at the screenshots**

Open `.verify/1440-scroll-0.png`, `-1100.png`, `-2300.png`, `-3700.png` and `.verify/390x844.png` and compare with design spec §13:
- 0: "The Upgrade" inside the window opening, wing at the bottom, intro line, cream form, three pills, transparent nav is NOT expected yet (Task 6).
- 1100: window halves parted to the edges, close-up visible, amber haze, "The maths first, then the moment." with `007` and `08`.
- 2300: "Fortnightly from Kuala Lumpur." with the "Read the latest issue" pill.
- 3700: five issue cards in a row near the top, two round buttons under them at the left.
Fix anything that does not match before moving on.

- [ ] **Step 6: Checkpoint (no git write)**

Run: `git status --short scripts/`
Expected: `M scripts/verify.mjs`.

---

### Task 6: SiteNav transparent state

**Files:**
- Modify: `app/components/SiteNav.vue`

**Interfaces:**
- Consumes: `useHeroUnderNav()` from Task 3; `Wordmark` prop `tone: 'paper' | 'dark'` (existing); `--nav-h` from Task 4.
- Produces: the header's computed `background-color` is `rgba(0, 0, 0, 0)` while the state is true.

- [ ] **Step 1: Rewrite `SiteNav.vue`**

```vue
<script setup lang="ts">
const { nav } = useAppConfig()

// Cream-on-transparent while the cinematic hero's stage sits under the bar, then the cream bar.
const underHero = useHeroUnderNav()
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b transition-[background-color,border-color,color] duration-300 ease-[ease]"
    :class="underHero
      ? 'border-transparent bg-transparent text-dark-cream'
      : 'border-ink/14 bg-paper/80 backdrop-blur-[14px]'"
  >
    <div class="wrap flex h-(--nav-h) items-center justify-between">
      <Wordmark :tone="underHero ? 'dark' : 'paper'" />

      <nav
        class="hidden gap-8 text-sm font-medium min-[900px]:flex"
        :class="underHero ? 'text-dark-cream/80' : 'text-ink/72'"
        aria-label="Primary"
      >
        <NuxtLink
          v-for="item in nav"
          :key="item.label"
          :to="item.to"
          :class="underHero ? 'hover:text-dark-cream' : 'hover:text-ink'"
        >
          {{ item.label }}<span
            v-if="item.soon"
            class="ml-1.5 align-[2px] font-mono text-[10px] tracking-[.12em]"
            :class="underHero ? 'text-amber-bright' : 'text-amber'"
          >Soon</span>
        </NuxtLink>
      </nav>

      <NuxtLink
        to="#subscribe"
        class="btn px-[18px] py-2.5 text-[13px]"
        :class="underHero && 'border-dark-cream bg-dark-cream text-ink hover:border-amber-bright hover:bg-amber-bright hover:text-ink'"
      >
        Subscribe
      </NuxtLink>
    </div>
  </header>
</template>
```

- [ ] **Step 2: Typecheck, lint, generate, verify**

Run: `pnpm typecheck && pnpm lint && pnpm generate && pnpm verify`
Expected: `VERIFY OK`. In `.verify/report.json`, `scrub[0].headerBg` and `scrub[3700].headerBg` are `rgba(0, 0, 0, 0)` and `scrub[4700].headerBg` is not.

- [ ] **Step 3: Confirm no hydration mismatch**

Run (dev server, then a headless check with the machine's Chromium):

```bash
pnpm dev --port 3123 > /tmp/theupgrade-dev.log 2>&1 &
DEV_PID=$!
sleep 12
node -e "
const { chromium } = require('playwright-core')
;(async () => {
  const b = await chromium.launch({ headless: true })
  const p = await b.newPage()
  const warnings = []
  p.on('console', m => { if (/hydration/i.test(m.text())) warnings.push(m.text()) })
  await p.goto('http://127.0.0.1:3123/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(1500)
  console.log(warnings.length ? warnings : 'no hydration warnings')
  await b.close()
})()
"
kill $DEV_PID
```

Expected: `no hydration warnings`. If a warning names `header` or `cinema-scroll`, the route meta default in `useHeroUnderNav` is not being read; check `definePageMeta` is in `index.vue`.

- [ ] **Step 4: Look at the final screenshots**

Open `.verify/1440-scroll-0.png` and `.verify/1440-scroll-3700.png`: the nav is cream text on the sky with the wordmark's amber-bright mark and a cream Subscribe pill. Open `.verify/1440-scroll-4700.png`: the cream bar is back over the marquee. Open `.verify/390x844.png`: nav, title, intro, form and pills all inside the first screen with no horizontal overflow.

- [ ] **Step 5: Final checkpoint (no git write)**

Run: `git status --short && git diff --stat`
Expected: the full change set for Qie to review:

```
 M app/app.config.ts
 M app/assets/css/main.css
 M app/components/SiteNav.vue
 M app/components/SubscribeBand.vue
 M app/components/SubscribeForm.vue
 D app/components/HeroStage.vue
 M app/pages/index.vue
 M package.json
 M scripts/verify.mjs
?? app/components/HeroCinema.vue
?? app/composables/useCinemaScroll.ts
?? app/composables/useHeroUnderNav.ts
?? app/composables/useInfiniteSlider.ts
?? app/utils/cinema.ts
?? docs/superpowers/
?? public/img/hero/
?? tests/
```

Report to Qie: the file list above, the `pnpm test` summary line, `VERIFY OK`, the screenshot paths, and anything assumed. Do not commit.
