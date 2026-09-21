# Handoff: The Upgrade — Homepage

## Overview
Marketing homepage for **The Upgrade**, a fortnightly newsletter from Kuala Lumpur about airline/hotel elite status, loyalty strategy, and premium stays. The page's job is to earn email subscriptions. It also teases a future "Status Tracker" product.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, not production code to ship directly. The task is to **recreate this design in the target codebase's environment** using its established patterns. The planned target is **Nuxt 4 + Nuxt Content deployed on Cloudflare Pages**, built as a reusable newsletter-site template. If that stack changes, pick the most appropriate framework and implement there.

- `homepage-mockup-v2.html` — **the design to implement** (light, editorial direction)
- `homepage-mockup.html` — earlier dark direction, reference only. Do not implement.

## Fidelity
**High-fidelity.** Colors, typography, spacing, copy, and motion are final design intent. Recreate pixel-perfectly.

Placeholders that are NOT final:
- All photography is a CSS gradient placeholder (`.foto` class) with a `Foto · …` caption describing the intended shot. Replace with real photos; keep the aspect ratios and the scrim treatments.
- "RM X" values in the featured-issue maths table await real numbers.
- Issue headlines/deks are sample content; real issues will come from Nuxt Content.

## Design Tokens
Colors (CSS custom properties in the mockup):
- `--paper: #f5f0e6` page background (warm cream)
- `--paper-2: #ede6d7`, `--paper-3: #e4dbc8` tinted surfaces
- `--ink: #211b12` primary text; `--ink-70: rgba(33,27,18,.72)`; `--ink-45: rgba(33,27,18,.5)`
- `--line: rgba(33,27,18,.14)`; `--line-strong: rgba(33,27,18,.32)`
- `--amber: #b0782f` accent on light grounds; `--amber-bright: #e09a3e` accent on dark grounds only
- `--dark: #241d13` dark band background; `--dark-cream: #f6efe1` text on dark
- Card surfaces on light sections: `#fff`

Typography:
- Display + body: **Satoshi** (Fontshare; weights 300–700 + italics). Headings weight 500, `letter-spacing: -0.03em`, `line-height: 1.05`. Italic Satoshi (weight 400) for `em` accents in headings, quotes, taglines, signatures — always colored amber inside headings.
- Mono: **Geist Mono** (Google Fonts; 400/500) for eyebrows, labels, metadata, the maths table — 10–13px, `letter-spacing: .1–.16em`, uppercase.
- Body: 17px / 1.65, weight 400.
- Type scale is fluid via `clamp()`: h1 `clamp(2.6rem, 6.8vw, 5.6rem)`; section h2 `clamp(2rem, 4.6vw, 3.6rem)`; interlude `clamp(2.8rem, 8.5vw, 7.2rem)`.

Other:
- Layout: `--max: 1280px` container, gutter `clamp(16px, 4vw, 56px)`; section padding `clamp(64px, 9vw, 128px)`.
- Radii: 4px small, 6px cards/photos, 999px buttons and input fields.
- Card shadow: `0 24px 60px -40px rgba(60,40,15,.35)`; issue-card hover shadow `0 20px 44px -30px rgba(60,40,15,.4)`.
- Fixed full-page grain overlay: inline-SVG fractal noise at 3.5% opacity, `pointer-events: none`, z-index 50.
- `::selection` amber background, white text.

## Screens / Sections (top to bottom)

### 1. Notice bar
Dark (`--ink`) strip, Geist Mono 11px, centered: proposal disclaimer + amber Close button that removes the bar. **Production: omit or repurpose for announcements.**

### 2. Nav (sticky)
68px tall, sticky, blurred cream background `rgba(245,240,230,.8)` + `backdrop-filter: blur(14px)`, 1px bottom hairline. Left: wordmark — 26px amber circle containing a left-chevron (CSS-drawn) + "The Upgrade" Satoshi 700 21px. Center (≥900px only): links Issues / Status Tracker (with amber mono "Soon" superscript) / About, 14px weight 500 at `--ink-70`. Right: pill Subscribe button (ink fill, cream text; hover amber).

### 3. Hero — one full-bleed stage
Photo block inset `clamp(8px,1.2vw,16px)` from viewport edges, `border-radius: 6px`, `min-height: clamp(620px, 94vh, 860px)`. Layers, back to front:
- `.foto-inner` gradient placeholder (real photo: window seat at golden hour), inset `-12% 0` for parallax headroom
- decorative "wing" shape (delete when real photo lands)
- scrim: vertical gradient `rgba(36,29,19,.12) → .3 @45% → rgba(30,23,14,.78)`
- top-left: italic tagline "Your seat on the left side of the curtain", white, `clamp(1.1rem,2vw,1.5rem)`
- top-right: photo credit tag
- bottom-center content, max 880px, centered: amber-bright eyebrow "Issue 007 · Fortnightly from Kuala Lumpur"; h1 in 3 masked lines "Status, strategy, / and the stays / *worth the miles.*" (last line italic amber-bright), white with soft text-shadow; lede paragraph `rgba(255,252,245,.88)` max 52ch; subscribe form.

### 4. Subscribe form (used twice: hero + dark band)
Pill field (input + Subscribe button inside, button inset 4px), mono uppercase meta row "Free · Fortnightly · No affiliate spam" with amber dot separators. On submit: hide field+meta, show italic amber thanks line "Nice. The next issue lands in your inbox." Hero variant: near-white field `rgba(255,252,245,.96)`, centered. Dark-band variant: translucent field `rgba(246,239,225,.07)` with `rgba(246,239,225,.3)` border, cream button, meta left-aligned, "Leave any time" instead of "No affiliate spam". **Production: wire to email provider (Beehiiv or Kit — TBD).**

### 5. Programme marquee
Hairline top/bottom borders, 18px padding. Infinite leftward loop (46s linear, duplicated content, `translateX(-50%)`): mono 12px uppercase programme names (Enrich, KrisFlyer, Marriott Bonvoy, Hilton Honors, Accor ALL, World of Hyatt, Asia Miles, IHG One Rewards) separated by amber ✦. `aria-hidden`. Static under reduced-motion.

### 6. Featured issue
Section head: h2 "The latest *letter*" left, intro paragraph right-aligned (2-col ≥900px). Card: white, 1px hairline, 6px radius, large soft shadow.
- Top row (1.1fr/.9fr ≥900px): left — amber eyebrow "Issue 007 · The verdict", h3 headline, dek at `--ink-70`, mono meta row (12 min read · Marriott Bonvoy · Hotels), ghost pill button "Read the issue →". Right — **maths table**: cream panel, Geist Mono 13px, label/value rows with hairline dividers, then a Satoshi 16px amber verdict paragraph above a strong hairline.
- Bottom row (1/1): photo placeholder (min 280px) | large italic pull-quote `clamp(1.25rem,2vw,1.6rem)` + mono attribution.

### 7. Status journey (dark band #1)
Background `--dark`, text `--dark-cream`. 2-col ≥980px. Left: amber-bright eyebrow "Status Tracker · Coming soon", h2 "Know exactly *where you stand.*", two ledes at 72% cream. Right: **tracker card** — 1px `rgba(246,239,225,.16)` border, `rgba(246,239,225,.05)` fill:
- head row: "Marriott Bonvoy · Sample profile" (amber-bright) vs "Year ends 31 Dec" (muted)
- big count `clamp(2.6rem,5.6vw,4.2rem)` "54 elite nights" (number animates 0→54)
- sub line: Confirmed +14 · Projected 68 · Target 75 (values cream/amber-bright, weight 500)
- tier bar: 1px track, amber-bright fill to **72%**; 5 stops (Member 0, Silver 13, Gold 33, Platinum 66, Titanium 100) as 7px dots + mono labels; passed stops fill amber-bright; Titanium labeled amber-bright as target
- note row above-hairline: recommendation text + amber-bright outlined "Recommendation" pill

### 8. Format
Section head "Every issue, *three things.*" + "Short enough to read in the lounge. Useful enough to change a booking." 3 white cards (grid ≥820px, min-height 280px): mono amber number (01/02/03), h3 (The verdict / The stay / Your points), body 15px, italic example line pinned to bottom above a hairline.

### 9. Interlude
Centered display moment: "Take the upgrade / *on purpose.*" at `clamp(2.8rem,8.5vw,7.2rem)`, italic amber second line; mono sub-line "The letter for deliberate travellers". Followed by a full-width hairline rule inside the container.

### 10. Archive
Section head "Previous *issues*" + "Everything is free to read. Subscribers get it first." 4 issue cards (1 col → 2 ≥720px → 4 ≥1100px): white card, 4:3 gradient thumb (each a distinct gradient), mono key row (Issue no. | category), h3 1.45rem, dek 14px, amber "Read →" pinned to bottom. Hover: lift `-4px` + shadow. Foot row: muted eyebrow "Seven issues and counting" + ghost "Browse the archive →".

### 11. About
2-col (.8fr/1.2fr ≥900px): 4:5 portrait placeholder (max 380px) | eyebrow "Who writes this", h2 "Written from seat 1A, *mostly.*", two paragraphs (independence disclosure), italic amber signature "Qie" 20px. Section has `padding-top: 0`.

### 12. Subscribe band (dark band #2)
Same dark treatment as §7. Left: eyebrow "Join the list", h2 "Linger over *the good seats.*" Right: dark subscribe form variant.

### 13. Footer
Cream. Row: small wordmark | links (Issues, Status Tracker, About, Privacy, Terms). Below hairline: legal disclaimer 12px max 78ch (non-affiliation, not financial advice). Mono studio line: "© 2026 The Upgrade · Designed by Qie / Axel Nova Ventures · Simple, effortless, human."

## Interactions & Behavior
Motion stack in the mockup: **GSAP 3.13 + ScrollTrigger + Lenis 1.3.4** smooth scroll (`lerp: 0.1`), Lenis driven by GSAP ticker. Reuse or match with equivalents.

1. **Hero entrance** (page load, ~2s total, `power3` easing): photo fades in while clip-path opens from `inset(12% 6% round 12px)` to full (1.4s `power3.inOut`); h1 lines slide up from `yPercent: 110` inside `overflow: hidden` masks, stagger 0.09s; remaining `[data-hero]` elements fade/rise (y: 18→0), stagger 0.1s.
2. **Hero parallax**: inner photo `yPercent: 12` scrubbed over hero scroll.
3. **Section reveals**: every `[data-reveal]` fades/rises (y: 32→0, 1s, `power3.out`) at `top 88%`, once.
4. **Tracker scrub**: as tracker enters (`top 80%` → `top 30%`, scrub 0.6): fill width 0→72%, count 0→54, stops toggle `.on` as fill passes them.
5. **Hovers**: buttons ink→amber fill with arrow `translateX(4px)`; ghost buttons darken border; nav/footer links → amber; issue cards lift; subscribe field border → amber on focus-within.
6. **Reduced motion**: skip all GSAP/Lenis; render final state (count 54, fill 72%, stops ≤72 on); marquee static.
7. **Subscribe submit**: prevent default, swap to thanks message (see §4).

## State Management
Static marketing page — no app state. Needed in production:
- Subscribe form: pending/success/error against the email provider API (Beehiiv or Kit)
- Notice bar dismissal (if kept): localStorage flag
- Issue cards/featured issue: rendered from Nuxt Content collection (issue number, category, title, dek, thumb, read time)

## Responsive
Fluid throughout (`clamp()` everywhere). Breakpoints: 720px (archive 2-col), 820px (format 3-col), 900px (nav links appear; section heads, featured top, about go 2-col), 980px (journey & band 2-col), 1100px (archive 4-col). Below 900px nav shows only wordmark + Subscribe — **a mobile menu was not designed; add one if more links are needed.**

## Assets
- Fonts: Satoshi via Fontshare CDN, Geist Mono via Google Fonts — consider self-hosting in production.
- No image assets; every visual is a gradient placeholder awaiting owner photography (hero window-seat shot, featured-stay suite, 4 issue thumbs, portrait).
- Wordmark is pure CSS (circle + chevron); consider converting to SVG.
- Grain overlay is an inline SVG data URI (in the mockup's `body::before`).

## Files
- `homepage-mockup-v2.html` — implement this
- `homepage-mockup.html` — superseded dark direction, reference only
