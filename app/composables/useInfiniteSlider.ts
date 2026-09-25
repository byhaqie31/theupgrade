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

  /** Source §8 normalize: jump one set back into the middle when a slide ended outside it. */
  function settle() {
    if (count === 0) return
    const next = normalizeSightIndex(active.value, count)
    if (next !== null) void jump(next)
  }

  /**
   * With `transition: none` (reduced motion, or mid-jump) no transitionend will ever
   * arrive, so normalise right away or the track runs off its three sets.
   */
  function settleIfInstant() {
    const el = track.value
    if (!el) return
    const duration = Number.parseFloat(getComputedStyle(el).transitionDuration) || 0
    if (duration === 0) settle()
  }

  function move(dir: 1 | -1) {
    active.value += dir
    update()
    settleIfInstant()
  }

  function select(index: number) {
    if (!Number.isFinite(index)) return
    active.value = index
    update()
    settleIfInstant()
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
    if (event.target !== track.value) return
    settle()
  }

  onMounted(update)

  return { active, jumping, move, select, update, onTransitionEnd }
}
