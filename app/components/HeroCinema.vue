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
// Only the middle set is reachable by keyboard and assistive tech; sets 0 and 2 are visual clones.
const cards = [0, 1, 2].flatMap(set => props.issues.map((issue, i) => ({
  issue,
  set,
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
          src="/img/hero/sky.jpg"
          alt=""
        >

        <div class="back-stack">
          <img
            class="scene-img back-img back-four"
            src="/img/hero/glow.webp"
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
                :tabindex="card.set === 1 ? 0 : -1"
                :aria-hidden="card.set === 1 ? undefined : 'true'"
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
            src="/img/hero/horizon.webp"
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
          src="/img/hero/window-left.webp"
          alt=""
        >
        <img
          class="scene-img splitframe-img splitframe-right"
          src="/img/hero/window-right.webp"
          alt=""
        >
        <img
          class="scene-img bridge-img"
          src="/img/hero/wing.webp"
          alt=""
        >
        <img
          class="scene-img frame-two-img"
          src="/img/hero/closeup.jpg"
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
  --bridge-opacity: 1;
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
  --sights-left: 0px;
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
  overflow: clip; /* not a scroll container: focusing an off-screen card must not drag the stage (delta 29) */
  isolation: isolate;
  background: #7fb4d4;
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
  overflow: clip;
  background: #7fb4d4;
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
  left: var(--sights-left); /* solved per frame, like top (delta 31) */
  right: auto;
  width: 100vw;
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

.sight-card.is-active {
  outline: none;
}

.sight-card:focus-visible {
  outline: 2px solid var(--color-amber); /* the source removed the ring; keyboard users need one (delta 30) */
  outline-offset: 3px;
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
  opacity: var(--bridge-opacity); /* delta 32 */
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
