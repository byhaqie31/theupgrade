<script setup lang="ts">
defineProps<{ issueNo: number }>()

const { site } = useAppConfig()
</script>

<template>
  <section class="relative">
    <div class="relative mx-(--hero-inset) flex min-h-(--hero-min) items-end justify-center overflow-hidden rounded-md px-(--gutter) pt-[clamp(96px,14vh,160px)] pb-[clamp(48px,7vh,80px)]">
      <!-- Placeholder photo. Real shot: window seat at golden hour. Inset -12% leaves parallax headroom for Phase 2. -->
      <div
        class="foto-inner absolute inset-x-0 -inset-y-[12%]"
        aria-hidden="true"
      />
      <!-- Decorative wing. Delete when the real photo lands. -->
      <div
        class="wing absolute"
        aria-hidden="true"
      />
      <div
        class="scrim absolute inset-0 z-[1]"
        aria-hidden="true"
      />

      <p class="absolute top-[clamp(20px,4vw,44px)] left-[clamp(20px,4vw,56px)] z-[2] font-sans text-(length:--fs-tagline) font-normal text-white italic [text-shadow:0_1px_24px_rgba(60,30,10,.5)]">
        {{ site.tagline }}
      </p>
      <span class="foto-tag top-[clamp(20px,4vw,46px)] right-4 bottom-auto left-auto">Foto · swap with your own window seat, golden hour</span>

      <div class="relative z-[2] w-[min(100%,880px)] text-center text-dark-cream">
        <p class="eyebrow block text-amber-bright">
          Issue {{ formatIssueNo(issueNo) }} · {{ site.cadence }}
        </p>
        <h1
          class="mx-auto mt-[22px] max-w-[16ch] text-(length:--fs-h1) text-white [text-shadow:0_2px_32px_rgba(40,25,10,.35)] [&_em]:text-amber-bright"
          aria-label="Status, strategy, and the stays worth the miles."
        >
          <span class="block">Status, strategy,</span>
          <span class="block">and the stays</span>
          <span class="block"><em>worth the miles.</em></span>
        </h1>
        <p class="mx-auto mt-[26px] max-w-[52ch] text-(length:--fs-lede) text-[rgba(255,252,245,.88)] [text-shadow:0_1px_16px_rgba(40,25,10,.35)]">
          A letter for people who chase elite status from KUL and want the maths and the moment. Which tier is worth it, which stays justify it, and what to do with the points you already have.
        </p>
        <SubscribeForm
          id="subscribe"
          variant="hero"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.foto-inner {
  background: linear-gradient(170deg, #cfe0e8 0%, #f0d9b8 40%, #e8a862 72%, #b06a48 100%);
}
.foto-inner::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(65% 50% at 60% 30%, rgba(255, 250, 235, .6), transparent 70%);
}
.wing {
  right: -6%;
  bottom: 10%;
  width: 54%;
  height: 26%;
  background: linear-gradient(90deg, #8a715a, #4d3d2e);
  clip-path: polygon(0 100%, 100% 40%, 100% 100%);
  opacity: .55;
}
.scrim {
  background: linear-gradient(180deg, rgba(36, 29, 19, .12) 0%, rgba(36, 29, 19, .3) 45%, rgba(30, 23, 14, .78) 100%);
}
</style>
