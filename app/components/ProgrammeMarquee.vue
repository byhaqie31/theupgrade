<script setup lang="ts">
const { programmes } = useAppConfig()

// Duplicated once so the -50% keyframe loops without a seam.
const track = [...programmes, ...programmes]
</script>

<template>
  <div
    class="marquee overflow-hidden border-y border-ink/14 py-[18px]"
    aria-hidden="true"
  >
    <div class="flex w-max animate-marquee motion-reduce:animate-none">
      <span
        v-for="(name, i) in track"
        :key="i"
        class="mr-12 whitespace-nowrap font-mono text-xs uppercase tracking-[.14em] text-ink/50"
      ><i class="mr-12 not-italic text-amber">✦</i>{{ name }}</span>
    </div>
  </div>
</template>
