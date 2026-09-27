# The Upgrade · project brief and handover

**Purpose of this file:** everything decided so far, in one place, so a new Claude project can pick up where this conversation ended. Read this first. The other docs in `theupgrade/` hold the detail.

**Owner:** Qie (Ahmad Baihaqie Mohd Yusri), Axel Nova Ventures, Kuala Lumpur.
**Last updated:** 25 Sep 2026.

---

## 1. What The Upgrade is

A fortnightly newsletter from Kuala Lumpur about airline and hotel elite status, loyalty strategy and the stays that justify the chase. Free, no affiliate spam. A future product, the **Status Tracker**, tells readers exactly where they stand on each programme and what to do next.

**Tagline:** Status, strategy, and the stays worth the miles.
**Closing line:** Upgrade on purpose.
**Angle:** where taste meets strategy. Every issue pairs a numbers-backed verdict with a cinematic stay. Not a deal blog (BolehMiles, Refined Points already do that), not a lifestyle feed (Instagram and TikTok do that better).

**Why a newsletter first:** in this niche the audience comes before the product. Nobody connects their Bonvoy account to an app from a stranger. They subscribe to someone whose judgement they've watched for six months. The newsletter also produces the programme rules data the tracker needs, and it makes Axel Nova credible to hospitality clients.

## 2. Origin and the big decision already made

The project began as **EliteStatus.my**, a loyalty-account aggregator built on AwardWallet's Web Parsing API. That direction was rejected because:

- AwardWallet's API requires passing the user's loyalty username and password to a US third party. That makes "we never store your passwords" a false claim, breaches every programme's T&C, exposes users to account lockout, and creates PDPA cross-border transfer obligations.
- The intelligence layer ("you need 7 more nights, prioritise Marriott") needs four inputs: current tier, current count, thresholds, upcoming trips. Three are manual entry. The fourth is Gmail. The aggregator was convenience, not capability.

**Locked:** manual entry plus Gmail import, a data-driven and date-versioned rules engine, no credential aggregator. EliteStatus survives only as the internal engine name.

## 3. Every issue, three things

1. **The verdict.** One programme question answered with the maths. "Enrich 2026, explained without the marketing."
2. **The stay.** One hotel or one cabin, first-person. What status actually got you, what it didn't, would you return on your own money. Must be Qie's own stay and photos.
3. **Your points.** A reader's balances and a dream, answered with a route, a cabin and a number.

Plus a recurring **"Seen on TikTok"** slot (see content-partnership.md): a partner's post, embedded and credited, with The Upgrade's strategy layer underneath.

Cadence: fortnightly. Metrics that matter: replies, clicks, forwards. Not open rate.

## 4. Brand

- **Name:** The Upgrade. Chosen over the earlier working name Turn Left because Turn Left is airline-coded and half the content is hotels. "Upgrade" is the one payoff both airlines and hotels give elites.
- **Domain:** theupgrade.my, still to be checked on MYNIC by Qie. Also check theupgrade.com to know the neighbour.
- **Adjacent brand:** Upgraded Points (US). Different name, same space. Never use the word "Upgraded" in copy.
- **Logo:** a U that rises into an arrow. One continuous stroke, right arm climbs past the left and ends in an up chevron. Files in `design_handoff_the_upgrade_homepage/logo/` on Qie's Mac: 13 SVGs (mark, badge, horizontal and stacked lockups in every colourway) and badge PNGs at 512, 180, 32. Wordmark is live Satoshi 700 text in the SVGs, to be outlined in Figma before print or avatars.
- **Design direction (v2, light editorial, implemented):** warm cream paper, ink text, single amber accent, dark bands. Satoshi for display and body, Geist Mono for labels. Full tokens in `design-direction.md` and in the handoff README on Qie's Mac.
- **Earlier v1 dark direction ("Cabin at dusk")** is superseded. Reference only.

## 5. Stack, locked

| Layer | Pick |
|---|---|
| Framework | Nuxt 4, `app/` dir, TypeScript strict |
| Content | Nuxt Content v3. `issues` collection (markdown) and `programmes` collection (yml with tier thresholds and effective dates) |
| Styling | Tailwind v4 CSS-first, OKLCH tokens in `@theme`, `@tailwindcss/typography` for prose |
| Fonts | `@nuxt/fonts`: Satoshi via Fontshare provider, Geist Mono via Google. Self-hosted at build |
| Motion | GSAP 3.13 + ScrollTrigger + Lenis, homepage only, in `useHomeMotion()`, reduced-motion respected |
| Images | `@nuxt/image` with IPX at prerender. Own photography |
| Email | Kit (recommended) or Beehiiv, reached only through `/api/subscribe`. Cloudflare Turnstile on the form |
| Hosting | Cloudflare Workers with static assets, all routes prerendered except `/api/*` |
| Analytics | Cloudflare Web Analytics, cookieless |
| SEO | nuxt-og-image, sitemap, robots, RSS via Nitro route |

Architecture rules: brand in `app/app.config.ts` only; components never call `queryCollection`, all data through composables (`useIssues`, `useProgrammes`, `useSubscribe`); a `scripts/issue-to-email.ts` renders each markdown issue into a branded email and pushes a Kit draft so every issue is written once. The Status Tracker is a separate app later at `app.theupgrade.my`.

**Build phases:**
1. Scaffold, tokens, fonts, content schema, static homepage. Prompt written: `claude-code-handoff-phase-1.md`. Not yet run.
2. Motion.
3. Subscribe route, Turnstile, email provider, article and archive pages, OG images, deploy.

Each phase has a hard stop. Qie handles all git.

**Files on Qie's Mac:** `/Users/BHQIMBP16/Developer/theupgrade/` is the repo root. `design_handoff_the_upgrade_homepage/` holds `README.md` (the design spec), `homepage-mockup-v2.html` (implement this), `homepage-mockup.html` (superseded), `CLAUDE-CODE-PROMPT-PHASE-1.md`, and `logo/`.

## 6. Legal rules, summary

Full reasoning in this conversation's history; the rules that came out of it:

- No credential-based aggregation, ever. Manual entry plus Gmail OAuth only.
- PDPA as amended (in force 2025): Qie is a data controller. Appoint a DPO and notify the Commissioner, breach notification, data portability, processors carry direct liability. Incorporate a Sdn Bhd but note criminal liability is personal.
- Gmail restricted scope needs CASA assessment, annual, and Limited Use rules: no training on user email, no human reading of it except narrow cases. Design for synthetic test fixtures.
- Programme names as text only, no logos or brand colours. Persistent "not affiliated with or endorsed by any loyalty programme" line.
- Never phrase output as a guarantee of status. "Verify with the programme" in the UI, not only the terms.
- One paid session with a Malaysian tech lawyer before launch, roughly RM3 to 8k, to review privacy policy, terms and transfer position.

## 7. Monetisation, summary

Detail and milestone reviews in `monetisation-projection.md`. Ranked by trust cost then timing:

1. Axel Nova hospitality clients found through the letter, from day one
2. Paid strategy sessions, RM300 to 500 an hour, from about 200 subscribers
3. Selected affiliate (Wise, Airalo, Agoda, lounge access), disclosed inline
4. Paid tier at 2 to 3k free subscribers, RM15 to 25 a month
5. Status Tracker subscription when built
6. Sponsorship only at about 10k engaged

**Irreversible decision:** no comped stays in year one. After that, only as a labelled "Sponsored stay, honest verdict" format with no hotel approval. Written into the About copy as a promise.

## 8. Content partnership

Detail in `content-partnership.md`. Hazman Loka Kirana (TikTok, Malaysian premium hotels) offered photos at RM8 each or free in exchange for vendor promotion. Rules: only his own shoots, written licence, credit, never in "The stay". Split the relationship: The Upgrade licenses photos, Axel Nova refers photography work. He is also an Axel Nova portfolio-site lead. Four questions open before any proposal, starting with whether the photos are his own.

## 9. Open questions, all of them

| Question | Blocks |
|---|---|
| theupgrade.my available on MYNIC? | Brand, everything downstream |
| Kit or Beehiiv? | Phase 3 |
| Three to five issues drafted? | Launch |
| Own photography for hero, featured stay, portrait? | Launch |
| Hazman: photos his own? reach? referral? portfolio site? | Content partnership proposal |
| Revenue product or brand asset? | Whether Gmail's CASA cost belongs in V1 |
| Hours per week this may take from client work? | Everything |

## 10. Next actions, in order

1. Check the domain. If taken, decide the fallback before anything else moves.
2. Ask Hazman the ownership question.
3. Run phase 1 in Claude Code from the repo root. Review screenshots. Say "phase 2" to get the motion prompt.
4. Draft three issues in markdown while phase 1 builds.
5. Decide Kit vs Beehiiv before phase 3.
6. Book the lawyer session before launch.

---

## Suggested project instructions for the new Claude project

Paste this into the new project's custom instructions, alongside the Axel Nova house rules:

> This project is **The Upgrade**, Qie's own newsletter and future Status Tracker product. Read `PROJECT-BRIEF.md` first in every session. Decisions in it are locked unless Qie reopens them. Default mode is discussion, not production; the same gates apply as the Axel Nova project ("lock it", "mockup first", "handoff prompt", "generate proposal"). Build prompts are one phase at a time with a hard stop. Git is Qie's. The Upgrade's editorial independence is non-negotiable: third-party posts and photos supply the picture and the subject, never the verdict; no comped stays in year one; programme names as text only; never a guarantee of status. Sentence case, no em dashes, direct with Qie, push back early.
