<script setup lang="ts">
definePageMeta({ cinematicHero: true })

const { featured, recent, all } = await useIssues()
</script>

<template>
  <div>
    <HeroCinema
      :issues="all.slice(0, 5)"
      :issue-count="all.length"
    />

    <ProgrammeMarquee />

    <section
      id="latest"
      class="section"
    >
      <div class="wrap">
        <SectionHead intro="Every issue pairs a verdict you can act on with a stay you would actually want. The numbers first, then the feeling.">
          The latest <em>letter</em>
        </SectionHead>
        <FeaturedIssue
          v-if="featured"
          :issue="featured"
        />
      </div>
    </section>

    <section
      id="journey"
      class="section bg-dark text-dark-cream"
    >
      <div class="wrap grid gap-10 min-[980px]:grid-cols-2 min-[980px]:items-center min-[980px]:gap-[72px] [&>*]:min-w-0">
        <div>
          <p class="eyebrow text-amber-bright">
            Status Tracker · Coming soon
          </p>
          <h2 class="mt-3.5 text-(length:--fs-journey) [&_em]:text-amber-bright">
            Know exactly <em>where you stand.</em>
          </h2>
          <p class="mt-5 max-w-[44ch] text-dark-cream/72">
            Enter your tiers once. Forward your confirmations. The Upgrade projects your year, tells you which programme deserves your next seven nights, and flags the deadline before it passes.
          </p>
          <p class="mt-3.5 max-w-[44ch] text-[15px] text-dark-cream/72">
            No passwords. No account scraping. Your data stays yours.
          </p>
        </div>
        <TrackerCard />
      </div>
    </section>

    <section
      id="format"
      class="section"
    >
      <div class="wrap">
        <SectionHead intro="Short enough to read in the lounge. Useful enough to change a booking.">
          Every issue, <em>three things.</em>
        </SectionHead>
        <FormatCards />
      </div>
    </section>

    <Interlude />

    <section
      id="issues"
      class="section"
    >
      <div class="wrap">
        <SectionHead intro="Everything is free to read. Subscribers get it first.">
          Previous <em>issues</em>
        </SectionHead>
        <IssueGrid
          :issues="recent"
          :total="all.length"
        />
      </div>
    </section>

    <AboutBlock />

    <SubscribeBand />
  </div>
</template>
