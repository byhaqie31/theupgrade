# The Upgrade · Cinematic hero · design spec

Date: 2026-09-24. Status: design approved in conversation; this file awaits Qie's review before
an implementation plan is written. Companion: `2026-09-24-cinematic-hero-source-spec.md`
(the "Mostar city" prompt, saved verbatim; the authority for every number reused here).

## 1. Purpose

Replace the static Phase 1 hero (`HeroStage.vue`) with a pinned, scroll-driven three-screen
story adapted from the Mostar cinematic scroll spec, integrated with the existing Nuxt 4 site.
The homepage's job is unchanged: earn a subscribe. The subscribe form stays on the first
screen. This opens Phase 2 for the hero only; section reveals, tracker scrub and Lenis remain
Phase 2 work for later.

## 2. Decisions taken with Qie (2026-09-24)

| Decision | Choice |
|---|---|
| Story length | Full source spec: stage pinned for 3700px of scroll, all timings verbatim |
| Scene assets | Placeholder SVG cutouts in `public/img/hero/` now; real cutouts swap in later keeping filenames |
| Header | `SiteNav` goes transparent while the stage sits under it, then returns to its cream bar |
| Slider content | The five newest issues from `useIssues()` |
| Hero title | "The Upgrade" in the source's 14rem treatment |
| Architecture | Approach A: one component, two composables, scoped CSS, custom properties on the section |
| Subscribe anchor | The nav Subscribe pill targets the subscribe band at the page bottom |
| Dependencies | None added |
| Git | Qie runs all git commands; nothing here is committed by the implementer |

## 3. Rules of adaptation

1. Every numeric value in the source spec's positioning (§5), media queries (§6), engine math
   (§7) and slider logic (§8) is reproduced verbatim unless it appears in §9 of this document.
2. Class names from the source are kept so the two documents can be diffed.
3. All custom properties live on `section.cinema-scroll`, not `:root`. They inherit to every
   descendant, so the source's `var()` reads work unchanged.
4. CSS is plain CSS inside `<style scoped>` in the component, not Tailwind classes. The values
   are exact and Tailwind's arbitrary-value canonicalisation would add noise.
5. Brand strings come from `app.config.ts`, per the Phase 1 architecture rule.
6. No new dependency. Tests use the Node 22 built-in test runner, which strips TypeScript types
   natively on the installed 22.22.

## 4. Files

New:

| File | Responsibility |
|---|---|
| `app/components/HeroCinema.vue` | The stage: DOM from §5, scoped CSS from the source §4–§6 with §9 deltas, wires the composables |
| `app/composables/useCinemaScroll.ts` | The engine: state, lerps, rAF guard, listeners, applies the per-frame map to the section, publishes `heroUnderNav` |
| `app/composables/useInfiniteSlider.ts` | Slider state and behaviour from source §8, over Vue-rendered cards |
| `app/composables/useHeroUnderNav.ts` | `useState<boolean>('hero-under-nav', () => false)` shared between the hero and `SiteNav` |
| `app/utils/cinema.ts` | Pure math: `clamp`, `smoothstep`, `lerp`, `segmentInOut`, `cinemaFrame()` |
| `tests/cinema.test.ts` | Node test runner assertions for `cinema.ts` against the acceptance numbers |
| `public/img/hero/sky.svg` … `closeup.svg` | Seven placeholder layers, §7 |

Edited:

| File | Change |
|---|---|
| `app/pages/index.vue` | `<HeroCinema :issues="all.slice(0, 5)" :issue-count="all.length" />` replaces `<HeroStage>`; adds `definePageMeta({ cinematicHero: true })` |
| `app/components/SiteNav.vue` | Transparent state driven by `useHeroUnderNav()`; height uses `--nav-h`; Subscribe pill `to="#subscribe"` still, and the id moves (below) |
| `app/components/SubscribeBand.vue` | Its `SubscribeForm` gets `id="subscribe"` so the nav pill lands on a form that is never faded out |
| `app/components/SubscribeForm.vue` | New optional prop `meta?: boolean` (default `true`); when `false` the mono meta row is not rendered. Nothing else changes |
| `app/app.config.ts` | New `hero` block, §6 |
| `app/assets/css/main.css` | `--nav-h: 68px` in `:root` |
| `scripts/verify.mjs` | Hero check rewritten for the stage; scrubbed screenshot checks added, §12 |

Deleted: `app/components/HeroStage.vue`.

## 5. DOM tree (adapted from source §3)

```
section.cinema-scroll#cinema        [aria-label="The Upgrade cinematic scroll story"]
└─ div.stage
   ├─ div.world
   │  ├─ img.scene-img.sky-img                       /img/hero/sky.svg
   │  ├─ div.back-stack
   │  │  ├─ img.scene-img.back-img.back-four         /img/hero/glow.svg
   │  │  ├─ section.sights-slider                    [aria-label="Recent issues"]
   │  │  │  └─ div.sights-track
   │  │  │     └─ 15 × article.sight-card            3 sets × 5 issues, [tabindex="0" role="button"]
   │  │  └─ img.scene-img.back-img.back-bazaar       /img/hero/horizon.svg
   │  ├─ div.sights-controls                         [aria-label="Slider controls"]
   │  │  ├─ button.sight-nav.sight-prev "←"          [aria-label="Previous issue"]
   │  │  └─ button.sight-nav.sight-next "→"          [aria-label="Next issue"]
   │  ├─ h1.hero-title                               hero.title
   │  ├─ img.scene-img.splitframe-img.splitframe-left    /img/hero/window-left.svg
   │  ├─ img.scene-img.splitframe-img.splitframe-right   /img/hero/window-right.svg
   │  ├─ img.scene-img.bridge-img                    /img/hero/wing.svg
   │  ├─ img.scene-img.frame-two-img                 /img/hero/closeup.svg
   │  └─ div.shade
   ├─ section.intro-copy                             [aria-label="The Upgrade overview"]
   │  ├─ p                                           hero.intro.lead + <em>hero.intro.em</em>
   │  ├─ SubscribeForm variant="hero" :meta="false"
   │  └─ div.hero-tags [aria-label="What you get"]   3 × span from subscribe.meta
   ├─ section.story-panel.story-panel-bridge         [aria-label=hero.panels.maths.heading]
   │  ├─ h2, p
   │  └─ dl.facts  2 × div > dt (count) + dd (label)
   └─ section.story-panel.story-panel-bazaar         [aria-label=hero.panels.letter.heading]
      ├─ h2, p
      └─ NuxtLink.note-button[to="#latest"]  span[aria-hidden] ↗ + span label
```

Differences from the source tree: no `header.site-header` (SiteNav covers it); the intro block
carries the form and pills; the note button is a link; cards are Vue-rendered.

Sight card internals keep the source order: `span.sight-kicker` (issue category, uppercase) →
`img.sight-pin` (`/brand/svg/mark-amber.svg`, `alt=""`) → `h3` (issue title, single line with
ellipsis as the source specifies) → `p` (dek, two-line clamp). `aria-label` is
`Open issue 007 card` (from `hero.slider.card`). `data-sight-index` is `set * 5 + i`. Clicking or pressing Enter or Space
selects and centres the card, exactly as the source. Navigation to the issue arrives with the
Phase 3 article routes; until then the cards do not navigate.

## 6. Content: the `hero` block in `app.config.ts`

```ts
hero: {
  title: 'The Upgrade',
  intro: { lead: 'Status, strategy, and the stays', em: 'worth the miles.' },
  tagsLabel: 'What you get',
  panels: {
    // Named, not an array, so each panel keeps its own type (facts vs cta).
    maths: {
      heading: 'The maths first, then the moment.',
      body: 'A letter for people who chase elite status from KUL and want the maths and the moment. Which tier is worth it, which stays justify it, and what to do with the points you already have.',
      facts: [
        { of: 'issues', label: 'issues and counting' },
        { of: 'programmes', label: 'programmes covered' },
      ],
    },
    letter: {
      heading: 'Fortnightly from Kuala Lumpur.',
      body: 'A fortnightly letter from Kuala Lumpur on elite status, loyalty strategy and the hotels and cabins that justify the chase.',
      cta: { label: 'Read the latest issue', to: '#latest' },
    },
  },
  slider: { label: 'Recent issues', prev: 'Previous issue', next: 'Next issue', card: 'Open issue {no} card' },
},
```

Fact values are resolved by the component: `issues` → `formatIssueNo(issueCount)` ("007"),
`programmes` → `String(programmes.length).padStart(2, '0')` ("08"). The three pills read
`subscribe.meta` ("Free", "Fortnightly", "No affiliate spam"). The intro `em` is italic
`amber-bright`, matching the site's heading-accent rule.

## 7. Layers (photographs since 2026-09-25)

The seven slots are filled with free-licence photographs from Wikimedia Commons, composited
locally with Pillow into the same slots (`public/img/hero/`, credits in `CREDITS.md` there). The
first build used the SVG placeholders described in the table below; the table's geometry (window
opening, wing placement) still holds for the photographic versions. Current files: `sky.jpg`
(2400×1350, "Summer above the clouds", CC0), `glow.webp` (the sun from "Sunset on plane", blurred,
radial alpha), `horizon.webp` (2400×800, warm-tinted band from "Above the Clouds", alpha fade at the
top), `window-left.webp` / `window-right.webp` (the surround ring filled with a desaturated,
warm-toned Airbus A350 cabin photo, CC BY 4.0), `wing.webp` (2140×900, the wing from "Sunset on
plane" cut by a traced polygon, bottom-anchored like the source's bridge) and `closeup.jpg`
(2160×1400, a resort suite, CC0). Qie's own photography replaces any of them by filename.

### 7.1 Original placeholder table

All in `public/img/hero/`, SVG, transparent unless stated, drawn in the token palette. Each
carries a mono `FOTO · …` caption in `ui-monospace` at 10–12px, uppercase, tracked, as the
Phase 1 placeholders do, so the swap targets are obvious. Sizes are the `viewBox`; the CSS
sizes them, so only the aspect ratio matters.

| File | Source role | viewBox | Content |
|---|---|---|---|
| `sky.svg` | sky | 1920×1080 | Opaque. 170° gradient `#7fb4d4 → #b9d3e2 → #f0d9b8 → #d98c4a → #7a3f24` (the source's stage blue at the top for cream-title contrast, dusk below), plus a soft radial cream highlight. Caption "FOTO · SKY · WINDOW SEAT, GOLDEN HOUR" |
| `glow.svg` | back "four" glow | 1920×1080 | Soft radial sun in cream at upper right, two faint low cloud ellipses and a light bottom haze. No caption (the layer is screen-blended at 0.72) |
| `horizon.svg` | bazaar mid-back | 2400×800 | Dusk cloud deck across the bottom 55%, `#b8845a → #6b4630` with a soft top edge and lighter cloud ellipses, so the intro block and panel three sit on a darker ground. Caption "FOTO · CLOUD DECK" |
| `window-left.svg` | splitframe left | 2240×1400 | Left half of an aircraft window surround: dark warm gradient `#4d3d2e → #8a715a`, opening from x 14% to 86% and y 26% to 88% with 160-unit corner radius (narrow enough that the bands show inside a 1440px viewport when the layer is 118vw wide). Right half of the file is empty. Caption "FOTO · WINDOW FRAME L" |
| `window-right.svg` | splitframe right | 2240×1400 | Mirror of the left file. Caption "FOTO · WINDOW FRAME R" |
| `wing.svg` | bridge foreground | 2140×900 | The wing polygon in the right 62% and the top half (y 20–50%) of the image, gradient `#8a715a → #4d3d2e`, opacity 0.9. It sits high because a bottom-anchored shape can never clear the stage after the source's −760px launch and 1.676 scale. Caption "FOTO · WING" |
| `closeup.svg` | frame-two close-up | 2160×1400 | Opaque. Suite-at-late-light gradient `paper-2 → amber → #3a2a1a` with a soft window highlight. Caption "FOTO · THE STAY, LATE LIGHT" |
| pin | sight-card icons | existing | `/brand/svg/mark-amber.svg`, already in the repo |

The window opening is sized so the title at `top: 19vh` sits inside it and the bands stay on
screen; the halves part to ∓46vw exactly as the source's splitframes do and reveal `closeup.svg` behind.

## 8. Engine

### 8.1 `app/utils/cinema.ts` (pure, no Nuxt imports)

Exports `clamp`, `smoothstep`, `lerp`, `segmentInOut` as in source §7, plus two more pure
pieces of the source's logic so they can be unit-tested: `nextSmoothScroll(current, target,
initialized, reduceMotion)` (one step of the scroll lerp with its first-frame and reduced-motion
snap) and `normalizeSightIndex(active, count): number | null` (source §8 normalisation). And:

```ts
export interface CinemaInput {
  scroll: number        // smoothScroll
  mouseX: number        // smoothed pointer, -0.5..0.5
  mouseY: number
  innerWidth: number
  innerHeight: number
  reduceMotion: boolean
}
export type CinemaVars = Record<string, string>   // '--title-y' → '-210px', …
export interface CinemaFrame {
  vars: CinemaVars
  controlsReady: boolean                                   // sightsControlsEnter > 0.98
  live: { intro: boolean, panel2: boolean, panel3: boolean } // opacity > 0.02
}
export function cinemaFrame(input: CinemaInput): CinemaFrame
```

`cinemaFrame` computes every derived value and every custom property from source §7 with the
same formulas and the same `toFixed` precision (`--mx`/`--my` at 4 decimals; the others as
the source writes them), plus one extra, `--sights-left` (delta 31). Under `reduceMotion` every
pointer term uses 0 (delta 27). `controlsReady` is `sightsControlsEnter > 0.98`. `live` flags are
true while the block's computed opacity exceeds 0.02; the component binds them as `.is-live`
(§9 delta 24). The variable names are the source's, including `--sights-opacity` even though
the CSS does not read it.

### 8.2 `useCinemaScroll(section, options)`

```ts
useCinemaScroll(section: Ref<HTMLElement | null>, options: { onResize: () => void })
  : { controlsReady: Ref<boolean>, live: Ref<CinemaFrame['live']> }
```

- Client only: everything registers in `onMounted` and is removed in `onBeforeUnmount`,
  including a pending `requestAnimationFrame`.
- State and `update()` follow source §7: `targetScroll` from `getScrollDistance()`, scroll lerp
  0.14 with the 0.08 snap, pointer lerp 0.12, `initialized` and `rafPending` guards, the
  re-request conditions, `requestTick()`.
- `reduceMotion` is `matchMedia('(prefers-reduced-motion: reduce)')`, read each frame.
- Applies `frame.vars` with `section.style.setProperty` and sets `controlsReady` and `live`.
- Sets `data-settled` on the section: `"false"` whenever a frame is requested, `"true"` when
  `update()` ends without re-requesting one. `verify.mjs` waits on it; nothing else reads it.
- Listeners: `scroll` passive → `requestTick`; `resize` → `options.onResize(); requestTick()`;
  `pointermove` passive → target pointer from `clientX / innerWidth - 0.5` and
  `clientY / innerHeight - 0.5`, then `requestTick`.
- Publishes `heroUnderNav`: each frame, `section.getBoundingClientRect().bottom > navH`, where
  `navH` is `--nav-h` read from the root computed style once on mount (68). Written only when
  the value changes.

### 8.3 `useHeroUnderNav()`

`useState<boolean>('hero-under-nav', () => useRoute().meta.cinematicHero === true)`.

The default matters: during SSR the layout's `SiteNav` renders before the page's hero runs its
`setup`, so the initial value cannot come from the hero. It comes from the route meta that
`index.vue` declares with `definePageMeta({ cinematicHero: true })`, which is in the route
table before anything renders. Server HTML and the first client frame therefore agree, with no
hydration mismatch. `HeroCinema` sets the state `false` in `onBeforeUnmount`, and the engine
updates it live (§8.2). Other pages never touch it and get the cream bar.

### 8.4 SSR

The scroll-zero state is the default custom-property block on `.cinema-scroll` (source §4),
so the prerendered HTML matches the first client frame: title and intro visible, frame two at
opacity 0, slider `visibility: hidden`, controls at opacity 0.

## 9. Deltas from the source spec (exhaustive)

| # | Source | The Upgrade | Why |
|---|---|---|---|
| 1 | Custom properties on `:root` | On `section.cinema-scroll` | No site-wide leakage |
| 2 | `html { scroll-behavior: smooth }`, `body { overflow-x: clip }`, `#0b1110` backgrounds | Not applied; site keeps `auto` and `overflow-x: hidden` | Site globals win. `overflow-x: hidden` on `body` propagates to the viewport, so `position: sticky` still works |
| 3 | `header.site-header` inside the stage | Removed; `SiteNav` transparent state, §10 | One header |
| 4 | `Ogg Medium` (title, h2, dt) | `Satoshi` 500 | Licensed face, site rule |
| 5 | `.hero-title`, `.story-panel h2`, `.facts dt` tracking 0 | `-0.03em` | Site's heading rule; Satoshi wants it, Ogg did not |
| 6 | `.sight-card h3` weight 800 | 700 | Heaviest Satoshi |
| 7 | Text `#fdf1e1` on scene | `var(--color-dark-cream)` | Token |
| 8 | Cards, pills, note button, sight-nav `#fdf1e1`; text `#000`/`#111411` | `var(--color-paper)` and `var(--color-ink)` | Tokens |
| 9 | Stage `#7fb4d4`, world `#79b7dd` | `#cfe0e8` both | Sky-1 stop; only visible before the sky image paints |
| 10 | `--blur-tint: 74, 181, 224` | `176, 120, 47` (`#b0782f`, the amber token) | Golden-hour haze; cream text stays legible |
| 11 | Card shadow `rgba(2, 47, 64, .12)` | `rgba(60, 40, 15, .12)` | Warm hue, same geometry and alpha |
| 12 | Intro: `p` + three tag spans | `p` + `SubscribeForm` + three tag spans | Conversion stays on screen one |
| 13 | `SubscribeForm` meta row | Hidden via `:meta="false"` | The pills carry the same three words |
| 14 | `button.note-button` | `NuxtLink.note-button` to `#latest` | It is a link |
| 15 | Panel and card copy | §5 and §6 | Brand |
| 16 | Pins: three remote PNGs | `/brand/svg/mark-amber.svg` | In repo |
| 17 | `setupSightSlider` clones with `cloneNode` | Vue `v-for` renders the three sets | Declarative listeners |
| 18 | `.is-ready`, `.is-active`, `.is-jumping` via `classList` | Bound `:class` from refs | Same classes, Vue-owned |
| 19 | `.sight-nav` buttons | Also `:disabled="!controlsReady"` | Invisible buttons must not take keyboard focus |
| 20 | Section starts below the nav | `.cinema-scroll { margin-top: calc(-1 * var(--nav-h)) }` | Stage fills the viewport from the first pixel under the transparent nav |
| 21 | Font stack `Inter, Satoshi, …` on `:root` | Inherits the site's `--font-sans` | Token |
| 22 | Document head, favicon, `main.site-shell` | Not applicable | Site owns these |
| 23 | `.sights-slider` `aria-label` and card `aria-label`s | From `hero.slider` | Brand |
| 24 | Intro and story panels stay in the DOM at opacity 0 | `.is-live` bound from `frame.live`; `.intro-copy:not(.is-live), .story-panel:not(.is-live) { visibility: hidden }` | At opacity 0 the source's subscribe form and note button still take clicks and keyboard focus at the centre of the screen; `visibility` removes them from hit testing and the tab order, with no visual change |
| 25 | Nothing | `data-settled` on the section, §8.2 | Deterministic wait for the verify script |
| 26 | Nothing | `.scene-img { max-width: none }` | Tailwind preflight caps `img` at `max-width: 100%`, which would clip the 112vw–190vw layers to the stage width |
| 27 | Reduced motion zeroes `--mx`/`--my` only; the layer terms still read the pointer | Every pointer term uses 0 under reduced motion | Source §9 promises parallax is bypassed, but nothing reads `--mx`/`--my`; reduced-motion users were still getting eased parallax |
| 28 | Loop normalisation only on `transitionend` | Also normalise immediately when the track's computed transition duration is 0 | Under `prefers-reduced-motion` (`transition: none`) no `transitionend` fires and ten clicks ran the track off its three sets |
| 29 | All 15 cards `tabindex="0"`; `.stage`/`.world` `overflow: hidden` | Sets 0 and 2 get `tabindex="-1"` and `aria-hidden="true"`; `.stage` and `.world` use `overflow: clip` | Off-screen clones were tab stops, screen readers heard 15 cards for 5 issues, and focusing a clone scrolled the hidden-overflow stage sideways |
| 30 | `.sight-card:focus-visible { outline: none }` | `outline: 2px solid var(--color-amber); outline-offset: 3px` | Keyboard users need a visible focus ring (WCAG 2.4.7) |
| 32 | The foreground layer only translates and scales on exit | `--bridge-opacity: 1 − frame2.exit` on `.bridge-img` | A bottom-anchored photograph (the source's own geometry) cannot clear the stage by transform alone at 1440×900, so the wing faded out over the same exit segment leaves no remnant behind panel three or the slider |
| 31 | `.sights-slider { left: 0; right: 0 }` | `left: var(--sights-left); right: auto; width: 100vw`, with `--sights-left = (48 + 0.18·W − stackLeft) / backScale`, `stackLeft = W/2 − 0.53·W·backScale` | The source solves the slider's vertical position against the scaled back stack but not the horizontal; the active card landed fully off-screen left and selecting a card slid it away. Now the active card sits at the controls' 48px |

Everything else, including `.stage { height: 100vh; min-height: 620px }`, the `will-change`
lists, `mix-blend-mode: screen`, the `!important` on frame two, all `z-index`es, every
`transform-origin`, every media query value and every engine constant, is verbatim.

## 10. `SiteNav` transparent state

`const underHero = useHeroUnderNav()`. When true the header is `bg-transparent
border-transparent backdrop-blur-none`, the wordmark is `tone="dark"`, links are
`text-dark-cream/80 hover:text-dark-cream`, the `Soon` superscript is `amber-bright`, and the
Subscribe pill is `bg-dark-cream text-ink border-dark-cream hover:bg-amber-bright`. When false
the header is exactly what it is today. `transition: background-color, border-color, color
300ms ease`. `z-40` and `sticky top-0` are unchanged; the height becomes `h-(--nav-h)`.

The pill keeps `to="#subscribe"`. The id moves from the hero form to the band form.

## 11. Slider (`useInfiniteSlider`)

```ts
useInfiniteSlider(track: Ref<HTMLElement | null>, count: number)
  : { active: Ref<number>, jumping: Ref<boolean>, move(dir: 1 | -1): void,
      select(index: number): void, update(): void, onTransitionEnd(event: TransitionEvent): void }
```

- `active` starts at `count` (middle set).
- `update()` reads the first card's `offsetWidth` and the track's computed `columnGap`, sets
  `--sights-shift` to `-(cardWidth + gap) * active` px on the track.
- `move`, `select`, `jump` and `normalize` follow source §8. `jumping` is set true, `active`
  and shift updated, then cleared after two `requestAnimationFrame`s.
- The component binds `.is-active` to `index === active` and `.is-jumping` to `jumping`, and
  calls `onTransitionEnd` from the track's `@transitionend`. The handler ignores events whose
  target is not the track itself and does nothing when `count` is 0. `move` and `select` also
  normalise immediately when the track's computed transition duration is 0 (delta 28). `jump` awaits `nextTick`
  after setting `jumping` so `transition: none` is in the DOM before the track moves. `update()` also runs on mount and
  is the `onResize` callback handed to `useCinemaScroll`.

## 12. Verification

### 12.1 `tests/cinema.test.ts` (run with `node --test tests/`)

Pins `cinemaFrame` against the source's acceptance numbers, with `innerHeight: 900`,
pointer at 0, `reduceMotion: false` unless stated:

| scroll | Expect |
|---|---|
| 0 | `--title-opacity` 1, `--title-y` `0px`, `--intro-copy-opacity` 1, `--frame2-opacity` 0, `--sights-visibility` `hidden`, `--sights-enter-x` `420vw`, `--bridge-width` `67.2vw`, `--back-scale` 0.76, `--shade-z` `0` |
| 650 | `--title-y` `-210px`, `--title-scale` 0.92, `--title-opacity` 0, `--intro-copy-y` `90px` |
| 1100 | `--frame2-opacity` 1, `--bridge-width` `105vw`, `--bridge-bottom` `-8vh`, `--blur-px` `14px`, `--back-brightness` 0.745, `--shade-top-alpha` 0.465, `--shade-z` `2`, `--split-left-x` `calc(-50% + -46vw + 0px)`, `--split-right-x` `calc(-50% + 46vw + 0px)`, `--split-left-scale` 1.833704 ± 1e-6 (progress 0.407407 × 0.23 + 0.74), `--back-scale` 1.021481 ± 1e-6, `--panel2-opacity` 1, `live.intro` false, `live.panel2` true |
| 1620 | `--bridge-y` `-804.4px` ± 1e-6 (progress 0.6 × −74 − 760), `--bridge-scale` 1.618 ± 1e-6, `--frame2-y` `calc(-50% + -150px)`, `--panel2-opacity` 0, `--frame2-opacity` 0 |
| 2300 | `--panel3-opacity` 1, `--bazaar-saturation` 1.18, `--frame2-opacity` 0, `live.panel3` true, `live.panel2` false |
| 3560 | `--sights-enter-x` `0vw`, `--sights-visibility` `visible`, `--back-scale` 1.3, `--sights-scale` parses to 1 / 1.3 ± 1e-9 |
| 3660 | `--sights-controls-opacity` 1, `controlsReady` true; at 3600 `controlsReady` false |
| any, pointer (0.3, -0.2), reduce | `--mx` `0.0000`, `--my` `0.0000`, `--back-x` `0px`, `--bridge-x` `calc(-50% + 0px)`, `--split-left-x` `calc(-50% + 0vw + 0px)` (delta 27) |
| 3560, innerWidth 1440 / 390 | `--sights-left` 445.6615 / 147.623 ± 1e-3 (delta 31) |
| 0 / 1100 / 1620 | `--bridge-opacity` `1` / `1` / `0` (delta 32) |
| any, pointer (0.3, -0.2) | `--mx` `0.3000`, `--my` `-0.2000`, `--back-x` parses to −3.6 ± 1e-9, `--back-y` parses to 0.8 ± 1e-9 |

Plus `segmentInOut` unit checks (enter/exit/active at the boundaries) and the
`sightsScreenTop` clamp at `innerHeight` 500, 900 and 1400.

### 12.2 `scripts/verify.mjs`

- `HERO_CHECK` finds `.cinema-scroll .stage`, `.hero-title`, `.intro-copy` and the intro form's
  input. At 390 it asserts: title bottom < intro top, intro bottom ≤ stage bottom, form field
  bottom ≤ stage bottom, stage height ≥ 640. `withinMinHeight` is dropped.
- New scrub group at 1440×900 (normal motion): for each of scroll 0, 1100, 2300, 3700 and 4700,
  `window.scrollTo` then `waitForFunction` for `.cinema-scroll[data-settled="true"]`,
  screenshot to `1440-scroll-{n}.png`, read the custom properties from
  `getComputedStyle(section)` and the header's computed `background-color` (transparent is
  `rgba(0, 0, 0, 0)`; cream is anything else) and assert:
  0 → title opacity 1, slider hidden, header transparent;
  1100 → title opacity 0, frame two ≥ 0.99, panel two ≥ 0.99;
  2300 → panel three ≥ 0.99, frame two ≤ 0.01;
  3700 → slider visible, enter-x `0vw`, controls have `is-ready`, nav still transparent;
  4700 → nav has the cream fill (the stage has left the nav).
  Also at 3700: the active card's left edge is 48px and it is on screen; clicking card 7 brings it to
  48px; exactly 5 cards are tabbable and 10 are `aria-hidden`; `.stage`/`.world` compute to
  `overflow: clip`; tabbing from card 5 through 9 shows a focus outline and never scrolls the stage.
  At 0 every `img.scene-img` has decoded (`naturalWidth > 0`) and `--bridge-opacity` is 1; at 2300 it is 0.
  Under reduced motion: six `next` clicks from 5 land on 6 (the loop normalised without
  `transitionend`), and a pointer move leaves `--back-x` at `0px`.
- The reduced-motion group is unchanged and must still pass: at rest with no pointer movement
  the page is static for one second.
- Image loading is covered by the existing console-error capture; a missing layer file fails
  the run.
- Commands: `pnpm typecheck`, `pnpm lint`, `node --test tests/`, `pnpm generate && pnpm verify`.

## 13. Acceptance criteria (source §9, in The Upgrade's terms)

1. 0–650px: "The Upgrade" rises 210px, scales to 0.92 and fades; the intro line, form and
   pills sink 90px and fade. Sky, back stack, wing and window halves drift with the pointer.
2. 560–1620px: the wing widens 67.2vw → 105vw and lifts, then launches up 760px and scales
   +0.46 on exit. The window halves part to ∓46vw, rise 180px, scale +0.74. The close-up fades
   in behind. Blur to 14px, brightness −25.5%, amber haze to 0.465 / 0.42 / 0.51. Panel one
   fades in at top 60%, sliding +58px → −86px.
3. 1760–2700px: the cloud deck gains +0.18 saturation while panel one exits; panel two fades
   in at top 29% with the same slide and its "Read the latest issue" pill.
4. 2760–3560px: the issue slider flies in from 420vw, counter-scaled by 1 / backScale, top
   solved so cards sit at `clamp(innerHeight × 0.19, 112, 220) − 50` px on screen.
5. 3360–3660px: the ← → buttons fade in at left 48px and become interactive past 0.98. Prev,
   next and card clicks slide the track with the 640ms curve and loop seamlessly.
6. `SiteNav` is transparent while the stage sits under it and cream after.
7. Under `prefers-reduced-motion`: values snap, pointer vars are 0, transitions off, the story
   still scrubs.

## 14. Out of scope

Section reveals, tracker scrub, Lenis and GSAP (Phase 2 proper). Article routes and card
navigation, real photography, the mobile menu (Phase 3 and later). Any git command.

## 15. Assumptions and notes for Qie

- The stage uses `100vh` as the source does. On mobile browsers with a collapsing URL bar,
  `innerHeight` and `100vh` differ briefly; this is the source's behaviour and is kept.
- The page's `h1` becomes "The Upgrade"; the headline "Status, strategy, and the stays worth
  the miles." moves to the intro paragraph. The `<title>` already carries both.
- Issue titles longer than a card truncate with an ellipsis on one line, as the source
  specifies for card headings.
- Panel copy in §6 is a proposal. Edit the `hero` block in `app.config.ts` at any time; the
  component reads it.
