# The Upgrade · Claude Code handoff · Phase 1 of 3

Run Claude Code from `/Users/BHQIMBP16/Developer/theupgrade/` and paste everything below the line.

Phase 1 builds the repo, tokens, fonts, content schema and a static homepage. No motion, no live email provider. Phases 2 (motion) and 3 (subscribe route, article pages, deploy) come as separate prompts after Qie signs off on this one.

---

You are building the production repo for **The Upgrade**, a fortnightly newsletter site from Kuala Lumpur about airline and hotel elite status. The repo root is the current directory, `/Users/BHQIMBP16/Developer/theupgrade/`. The Nuxt app lives at the root. The folder `design_handoff_the_upgrade_homepage/` already exists here and is the design reference; leave it in place and do not modify it.

## Read first, in this order

1. `/Users/BHQIMBP16/Developer/theupgrade/design_handoff_the_upgrade_homepage/README.md` is the design spec. Every token, section, breakpoint and behaviour is defined there. Where this prompt and the README disagree on visuals, the README wins. Where they disagree on architecture or scope, this prompt wins.
2. `/Users/BHQIMBP16/Developer/theupgrade/design_handoff_the_upgrade_homepage/homepage-mockup-v2.html` is the design to implement. Open it and read the CSS and markup in full before writing any component. Recreate it at high fidelity.
3. `/Users/BHQIMBP16/Developer/theupgrade/design_handoff_the_upgrade_homepage/homepage-mockup.html` is a superseded dark direction. Do not implement it. Do not borrow from it.

## This phase, exactly

In scope:

- Nuxt 4 scaffold with the stack below
- Design tokens, fonts, global styles, grain overlay
- Nuxt Content collections for issues and programmes, with typed schemas and seed content
- The complete static homepage from the v2 mockup, every section, using placeholder gradients where the mockup has them
- The subscribe form as a component with pending, success and error UI states, driven by a stub composable
- Working `pnpm dev`, `pnpm build` and `pnpm generate`
- Responsive verification with screenshots

Out of scope, do not build even if it seems easy:

- GSAP, ScrollTrigger, Lenis, or any scroll or entrance animation. Do not install them. Sections render in their final state. The marquee may use its CSS keyframe animation since that is CSS, not JS.
- The real `/api/subscribe` route, Turnstile, Kit or Beehiiv
- Article pages, archive page, about page, RSS, OG images, sitemap
- Cloudflare deploy config, wrangler
- A mobile menu. Below 900px the nav is wordmark plus Subscribe, as designed.
- The notice bar from the mockup. Omit it.

## Stack, non-negotiable

- **Package manager:** pnpm
- **Framework:** Nuxt 4 with the `app/` directory. Vue 3 `<script setup lang="ts">`. TypeScript strict, `typeCheck: true`.
- **Content:** `@nuxt/content` v3. Collections defined in `content.config.ts` with Zod schemas.
- **Styling:** Tailwind v4, CSS-first, via `@tailwindcss/vite`. All tokens in `@theme` in `app/assets/css/main.css`. Add `@tailwindcss/typography` via `@plugin` for article prose later; install it now, do not style prose yet.
- **Fonts:** `@nuxt/fonts`. Satoshi from the Fontshare provider (weights 300, 400, 500, 700 plus italics 300, 400). Geist Mono from the Google provider (400, 500). Fonts are self-hosted at build by the module. No `<link>` to Fontshare or Google Fonts anywhere.
- **Images:** `@nuxt/image` with the default IPX provider. Photos will live in `public/img/`. There are none yet.
- **UI kit:** none. Do not install @nuxt/ui for this project. Every component is hand-written to match the mockup.
- **State:** none. No Pinia.
- **Do not add** any other module or dependency without a comment in the PR notes explaining why.

## Tokens

Put these in `@theme` as OKLCH. They are exact conversions of the README hex values. Keep the hex in a comment beside each.

```css
@theme {
  --color-paper:        oklch(95.6% 0.014 84.6);  /* #f5f0e6 page */
  --color-paper-2:      oklch(92.6% 0.021 85.9);  /* #ede6d7 */
  --color-paper-3:      oklch(89.3% 0.027 85.7);  /* #e4dbc8 */
  --color-ink:          oklch(22.6% 0.019 77.6);  /* #211b12 text */
  --color-amber:        oklch(61.7% 0.112 69.8);  /* #b0782f accent on light */
  --color-amber-bright: oklch(73.9% 0.134 70.0);  /* #e09a3e accent on dark only */
  --color-dark:         oklch(23.6% 0.021 76.3);  /* #241d13 dark bands */
  --color-dark-cream:   oklch(95.4% 0.020 84.6);  /* #f6efe1 text on dark */
  --color-card:         #ffffff;

  --font-sans: "Satoshi", system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, monospace;

  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-pill: 999px;

  --shadow-card: 0 24px 60px -40px rgba(60, 40, 15, .35);
  --shadow-card-hover: 0 20px 44px -30px rgba(60, 40, 15, .4);
}
```

The alpha variants in the README (`--ink-70`, `--ink-45`, `--line`, `--line-strong`, the dark-band border and fill) are derived with Tailwind's opacity modifiers, for example `text-ink/70`, `border-ink/14`. Do not create separate tokens for them.

Fluid type sizes, section padding, gutter and container max come straight from the README and live as CSS custom properties in `:root`, not in `@theme`.

## Architecture rules

**One config file for the brand.** `app/app.config.ts` holds: site name, tagline, description, cadence line, the three meta words for the subscribe form, social links, author name, legal disclaimer text, studio credit line. Components read from `useAppConfig()`. No brand string is hardcoded in a component. This site will become a template; the config file is the seam.

**The data seam.** Components never call `queryCollection` directly. All content access goes through composables in `app/composables/`:

- `useIssues()` returns `{ featured, recent, all }` where `featured` is the newest issue and `recent` is the next four. Typed from the collection schema.
- `useProgrammes()` returns the programmes collection, typed.
- `useSubscribe()` returns `{ status, submit }` where `status` is `'idle' | 'pending' | 'success' | 'error'`. In this phase `submit` waits 600ms and resolves to success. Phase 3 replaces the internals with a call to `/api/subscribe`. The component contract does not change.

**No motion code.** Do not add `data-reveal` or `data-hero` attributes, `onMounted` animation hooks, or `<ClientOnly>` wrappers for animation. Phase 2 adds motion through a composable; the components should be plain now.

## Content collections

`content.config.ts`:

```ts
import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    issues: defineCollection({
      type: 'page',
      source: 'issues/*.md',
      schema: z.object({
        issueNo: z.number(),
        title: z.string(),
        dek: z.string(),
        category: z.enum(['Airlines', 'Hotels', 'Strategy']),
        programmes: z.array(z.string()),
        readTime: z.number(),
        publishedAt: z.string(),
        thumb: z.string().optional(),
        quote: z.string().optional(),
        quoteSource: z.string().optional(),
        sample: z.boolean().default(false),
      }),
    }),
    programmes: defineCollection({
      type: 'data',
      source: 'programmes/*.yml',
      schema: z.object({
        id: z.string(),
        name: z.string(),
        kind: z.enum(['airline', 'hotel']),
        qualifyingUnit: z.enum(['nights', 'elite_points', 'miles', 'segments']),
        yearEnds: z.string(),
        effectiveFrom: z.string(),
        effectiveTo: z.string().optional(),
        tiers: z.array(z.object({
          id: z.string(),
          name: z.string(),
          threshold: z.number(),
          note: z.string().optional(),
        })),
        sourceUrl: z.string().url().optional(),
      }),
    }),
  },
})
```

Seed content:

- Seven issues in `content/issues/`, numbered 001 to 007, all with `sample: true`. Use the headlines, deks, categories and programmes from the v2 mockup for 003 to 007. Invent plausible placeholders for 001 and 002 in the same voice. Issue 007 carries the pull quote from the mockup's featured card. Each file body is two or three short placeholder paragraphs; do not write real articles.
- One programme, `content/programmes/marriott-bonvoy.yml`: Silver 10, Gold 25, Platinum 50, Titanium 75, Ambassador 100 nights, `qualifyingUnit: nights`, `yearEnds: "12-31"`, `effectiveFrom: "2026-01-01"`. Add a `note` on Ambassador that it also requires annual qualifying spend, amount to be confirmed by Qie. Add empty-but-valid stubs for `enrich.yml`, `krisflyer.yml`, `hilton-honors.yml` with `tiers: []` and a top-of-file comment `# TODO Qie: fill from programme T&C`.

The homepage tracker card is a sample profile. Its numbers (54 current, +14 confirmed, 68 projected, 75 target) stay hardcoded in a `sampleProfile` object inside `TrackerCard.vue` for now, but the tier names and thresholds must come from `useProgrammes()` for Marriott Bonvoy, positioned on the bar as `threshold / topThreshold * 100`. The bar fill is `54 / 75`.

## Components

Build these in `app/components/`, one file each, names exact:

`SiteNav.vue`, `Wordmark.vue` (inline SVG, not CSS shapes: 26px amber circle with a left chevron), `HeroStage.vue`, `SubscribeForm.vue` (prop `variant: 'hero' | 'dark'`), `ProgrammeMarquee.vue`, `SectionHead.vue`, `FeaturedIssue.vue`, `MathsTable.vue`, `TrackerCard.vue`, `FormatCards.vue`, `Interlude.vue`, `IssueCard.vue`, `IssueGrid.vue`, `AboutBlock.vue`, `SubscribeBand.vue`, `SiteFooter.vue`, `Foto.vue` (gradient placeholder with the mono caption, props `gradient` and `caption`; later swapped for `<NuxtImg>`).

`app/pages/index.vue` composes them in the README's section order, sections 2 to 13, skipping the notice bar.

`app/layouts/default.vue` holds nav, `<slot />`, footer and the fixed grain overlay.

## Fidelity checks

Match the v2 mockup on: type sizes and clamps, weights, letter-spacing, line-heights, colours, spacing, radii, shadows, hairlines, border opacities, the hero scrim gradient, the photo inset and min-height, the pill field construction with the button inset 4px, the marquee speed and separator, the maths table layout, the tier bar geometry, the card hover lift. Open the mockup in a browser next to your build and compare section by section.

## Verification, before you report

1. `pnpm typecheck` clean. `pnpm lint` clean if ESLint is configured; configure `@nuxt/eslint` if not.
2. `pnpm generate` completes.
3. With Playwright (use the project's installed Chromium, do not download another) screenshot `/` at 390×844, 820×1180 and 1440×900, plus full-page at 390 and 1440. Save to `.verify/` and add `.verify/` to `.gitignore`.
4. Per-element overflow check at each width: walk `document.querySelectorAll('body *')`, flag anything whose `getBoundingClientRect().right` exceeds `innerWidth + 1`, ignoring descendants of `.marquee` and of elements with `overflow: hidden`. Zero flags.
5. At 390 the hero headline, lede and subscribe field are all visible without scrolling below the hero's own min-height.
6. `prefers-reduced-motion: reduce` renders identically, since there is no motion yet. Confirm the marquee is static under it.
7. Look at every screenshot yourself and fix anything that does not match the mockup before reporting.

## Git

Do not run any git command. No init, no add, no commit, no branch, no push. Qie handles git. Leave the working tree ready for him to review.

## Report format

When done, reply with:

- File tree of `app/`, `content/`, `server/` (if any)
- The dependency list with one line per non-obvious choice
- The screenshot paths
- Anything in the README you could not match and why
- Anything you assumed
- Nothing else. Do not start phase 2.

**Hard stop here.** Phase 2 (motion) begins only when Qie says so.
