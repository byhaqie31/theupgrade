<script setup lang="ts">
/**
 * Horizontal lockup from the logo system: the U-that-rises-into-an-arrow mark
 * beside live Satoshi 700 text. Proportions follow lockup-horizontal.svg
 * (mark box 56 / 44 = 1.27em, gap 18 / 44 = 0.41em, tracking -0.03em).
 * `tone="dark"` is for dark grounds only: amber-bright mark, cream text.
 */
withDefaults(defineProps<{
  size?: number
  tone?: 'paper' | 'dark'
}>(), {
  size: 21,
  tone: 'paper',
})

const { site } = useAppConfig()
</script>

<template>
  <NuxtLink
    to="/"
    class="inline-flex items-center gap-[0.41em] font-sans font-bold tracking-[-0.03em]"
    :class="tone === 'dark' ? 'text-dark-cream hover:text-dark-cream' : 'hover:text-ink'"
    :style="{ fontSize: `${size}px` }"
  >
    <svg
      class="size-[1.27em] shrink-0"
      :class="tone === 'dark' ? 'text-amber-bright' : 'text-amber'"
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      stroke-width="12"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M25 34 V58 A20 20 0 0 0 65 58 V22" />
      <path d="M52 35 L65 22 L78 35" />
    </svg>
    <span>{{ site.name }}</span>
  </NuxtLink>
</template>
