<script setup lang="ts">
const { site, author } = useAppConfig()
</script>

<template>
  <section
    id="about"
    class="section pt-0!"
  >
    <div class="wrap grid gap-9 min-[900px]:grid-cols-[.8fr_1.2fr] min-[900px]:items-center min-[900px]:gap-[72px] [&>*]:min-w-0">
      <Foto
        class="aspect-[4/5] max-w-[380px] rounded-md"
        caption="Foto · you, ideally in a lounge"
      />
      <div>
        <p class="eyebrow">
          Who writes this
        </p>
        <h2 class="mt-3.5 mb-[22px] text-(length:--fs-about)">
          Written from seat 1A, <em>mostly.</em>
        </h2>
        <p class="max-w-[56ch] text-ink/72">
          I am {{ author.name }}, {{ author.role }} who reads programme terms so you do not have to. I chase status the way some people chase watches, and I have made most of the expensive mistakes already.
        </p>
        <p class="mt-4 max-w-[56ch] text-ink/72">
          {{ site.name }} is independent. No airline or hotel pays for a mention, and when a link earns a commission it says so. The stays are paid for with my own money or my own points, and the verdicts are mine.
        </p>
        <p class="mt-[26px] font-sans text-xl font-medium text-amber italic">
          {{ author.name }}
        </p>
      </div>
    </div>
  </section>
</template>
