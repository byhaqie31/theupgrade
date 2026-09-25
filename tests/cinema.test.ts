import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { CinemaInput } from '../app/utils/cinema.ts'
import {
  cinemaFrame,
  clamp,
  lerp,
  nextSmoothScroll,
  segmentInOut,
  smoothstep,
} from '../app/utils/cinema.ts'

/** Frame at a scroll offset, pointer at rest, 900px viewport, motion allowed. */
function at(scroll: number, extra: Partial<CinemaInput> = {}) {
  return cinemaFrame({ scroll, mouseX: 0, mouseY: 0, innerWidth: 1440, innerHeight: 900, reduceMotion: false, ...extra })
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

test('nextSmoothScroll snaps on the first frame and under reduced motion (review focus 2)', () => {
  assert.equal(nextSmoothScroll(0, 2300, false, false), 2300)
  near(nextSmoothScroll(0, 2300, true, false), 322)
  assert.equal(nextSmoothScroll(2299.95, 2300, true, false), 2300)
  assert.equal(nextSmoothScroll(0, 2300, true, true), 2300)
})

test('scroll 0 is the source :root default state', () => {
  const { vars, live } = at(0)
  assert.equal(vars['--title-opacity'], '1')
  assert.equal(vars['--title-y'], '0px')
  assert.equal(vars['--intro-copy-opacity'], '1')
  assert.equal(vars['--frame2-opacity'], '0')
  assert.equal(vars['--sights-visibility'], 'hidden')
  assert.equal(vars['--sights-enter-x'], '420vw')
  assert.equal(vars['--bridge-width'], '67.2vw')
  assert.equal(vars['--bridge-opacity'], '1')
  assert.equal(vars['--back-scale'], '0.76')
  assert.equal(vars['--shade-z'], '0')
  assert.equal(vars['--shade-opacity'], '1')
  assert.equal(vars['--sights-y'], '0px')
  assert.equal(vars['--mx'], '0.0000')
  assert.equal(vars['--split-left-x'], 'calc(-50% + 0vw + 0px)')
  assert.equal(vars['--sights-screen-top'], '121px')
  near(vars['--sights-top'], -125)
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
  assert.equal(vars['--bridge-opacity'], '1')
  assert.deepEqual(live, { intro: false, panel2: true, panel3: false })
})

test('scroll 1620: wing launched, frame two lifted, panel two gone', () => {
  const { vars } = at(1620)
  near(vars['--bridge-y'], -804.4)
  near(vars['--bridge-scale'], 1.618)
  assert.equal(vars['--frame2-y'], 'calc(-50% + -150px)')
  // Delta 32: the wing fades over its exit so a bottom-anchored photo leaves no remnant behind panel three.
  assert.equal(vars['--bridge-opacity'], '0')
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

test('pointer drives the parallax vars; reduced motion zeroes --mx/--my only', () => {
  const moved = at(0, { mouseX: 0.3, mouseY: -0.2 })
  assert.equal(moved.vars['--mx'], '0.3000')
  assert.equal(moved.vars['--my'], '-0.2000')
  near(moved.vars['--back-x'], -3.6, 1e-9)
  near(moved.vars['--back-y'], 0.8, 1e-9)

  // Under reduced motion the pointer moves nothing (source §9: parallax bypassed).
  const reduced = at(0, { mouseX: 0.3, mouseY: -0.2, reduceMotion: true })
  assert.equal(reduced.vars['--mx'], '0.0000')
  assert.equal(reduced.vars['--my'], '0.0000')
  assert.equal(reduced.vars['--back-x'], '0px')
  assert.equal(reduced.vars['--back-y'], '0px')
  assert.equal(reduced.vars['--bridge-x'], 'calc(-50% + 0px)')
  assert.equal(reduced.vars['--split-left-x'], 'calc(-50% + 0vw + 0px)')
  assert.equal(reduced.vars['--frame2-x'], 'calc(-50% + 0px)')

  // Review focus 5: viewport edges stay finite and well formed.
  const edge = at(0, { mouseX: 0.5, mouseY: -0.5 })
  assert.equal(edge.vars['--back-x'], '-6px')
  assert.equal(edge.vars['--bridge-x'], 'calc(-50% + 9px)')
  assert.equal(edge.vars['--split-left-x'], 'calc(-50% + 0vw + 11px)')
  for (const value of Object.values(edge.vars)) {
    assert.ok(!/NaN|undefined/.test(value), `bad var value ${value}`)
  }
})

test('sights left cancels the scaled back stack so the grid block starts at screen x = 0', () => {
  // stackLeft = W/2 - 0.53·W·backScale; left = -stackLeft / backScale, backScale 1.3 at 3560.
  near(at(3560, { innerWidth: 1440 }).vars['--sights-left'], 209.3538, 1e-3)
  near(at(3560, { innerWidth: 390 }).vars['--sights-left'], 56.7000, 1e-3)
  assert.ok(at(3560).vars['--sights-left']?.endsWith('px'))
  assert.equal(at(3560).vars['--sights-controls-opacity'], undefined)
})

test('window halves part 118vw below 1100px wide so they clear a phone screen (delta 35)', () => {
  assert.equal(at(1100, { innerWidth: 390 }).vars['--split-left-x'], 'calc(-50% + -118vw + 0px)')
  assert.equal(at(1100, { innerWidth: 390 }).vars['--split-right-x'], 'calc(-50% + 118vw + 0px)')
  assert.equal(at(1100, { innerWidth: 1440 }).vars['--split-left-x'], 'calc(-50% + -46vw + 0px)')
})

test('sights screen top clamps with viewport height (review focus 4)', () => {
  assert.equal(at(0, { innerHeight: 500 }).vars['--sights-screen-top'], '62px')
  assert.equal(at(0, { innerHeight: 900 }).vars['--sights-screen-top'], '121px')
  assert.equal(at(0, { innerHeight: 1400 }).vars['--sights-screen-top'], '170px')
})
