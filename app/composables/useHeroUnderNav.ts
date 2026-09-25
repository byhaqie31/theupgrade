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
