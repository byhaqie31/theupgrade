<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 21 })

const { site } = useAppConfig()
</script>

<template>
  <NuxtLink
    to="/"
    class="inline-flex items-center gap-3 font-sans font-bold tracking-[-0.02em] hover:text-ink"
    :style="{ fontSize: `${size}px` }"
  >
    <svg
      class="size-[26px] shrink-0 text-amber"
      viewBox="0 0 26 26"
      width="26"
      height="26"
      fill="none"
      stroke="currentColor"
      stroke-width="1"
      aria-hidden="true"
    >
      <circle
        cx="13"
        cy="13"
        r="12.5"
      />
      <polyline points="11.5 6.6 5.1 13 11.5 19.4" />
    </svg>
    <span>{{ site.name }}</span>
  </NuxtLink>
</template>
