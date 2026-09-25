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
  innerWidth: number
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

export function cinemaFrame({ scroll, mouseX, mouseY, innerWidth, innerHeight, reduceMotion }: CinemaInput): CinemaFrame {
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
  // Reduced motion: the pointer moves nothing. Source §9 says parallax is bypassed, but its --mx/--my
  // were never read by the CSS, so the layer terms use these instead (design spec delta 27).
  const mx = reduceMotion ? 0 : mouseX
  const my = reduceMotion ? 0 : mouseY
  // Horizontal counterpart of sightsParentTop (delta 31): the back stack spans -3vw..103vw and is scaled
  // about its centre, which shifts the slider origin; solve `left` so the active card, after the track's
  // -18vw, lands at the controls' 48px.
  const stackLeft = innerWidth / 2 - 0.53 * innerWidth * backScale
  const sightsParentLeft = (48 + 0.18 * innerWidth - stackLeft) / backScale

  const vars: CinemaVars = {
    '--mx': mx.toFixed(4),
    '--my': my.toFixed(4),

    '--back-opacity': String(1 - frame2.active * 0.06),
    '--back-x': `${mx * -12}px`,
    '--back-y': `${my * -4}px`,
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

    '--bridge-x': `calc(-50% + ${mx * 18}px)`,
    '--bridge-y': `${my * 8 + sharedHeroY - frame2.exit * 760}px`,
    '--bridge-bottom': `${5 - frame2.enter * 13}vh`,
    '--bridge-width': `${67.2 + frame2.enter * 37.8}vw`,
    '--bridge-scale': String(1.02 + sharedHeroScale + frame2.exit * 0.46),
    // Delta 32: fade the foreground over its exit; a bottom-anchored photo cannot clear the stage by transform alone.
    '--bridge-opacity': String(1 - frame2.exit),

    '--split-left-x': `calc(-50% + ${-splitDrift * 46}vw + ${mx * 22}px)`,
    '--split-left-y': `${my * 10 + sharedHeroY - splitDrift * 180}px`,
    '--split-left-scale': String(1 + sharedHeroScale + frame2.enter * 0.74),
    '--split-right-x': `calc(-50% + ${splitDrift * 46}vw + ${mx * 22}px)`,
    '--split-right-y': `${my * 10 + sharedHeroY - splitDrift * 180}px`,
    '--split-right-scale': String(1 + sharedHeroScale + frame2.enter * 0.74),

    '--frame2-opacity': String(frame2Opacity),
    '--frame2-x': `calc(-50% + ${mx * 10}px)`,
    '--frame2-y': `calc(-50% + ${my * 8 - frame2.exit * 150}px)`,
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
    '--sights-left': `${sightsParentLeft}px`,
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
