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

    const frame = cinemaFrame({ scroll: smoothScroll, mouseX, mouseY, innerWidth: window.innerWidth, innerHeight: window.innerHeight, reduceMotion: reduce })
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
