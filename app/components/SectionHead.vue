<script setup lang="ts">
defineProps<{ intro: string }>()
</script>

<template>
  <div class="mb-[clamp(32px,5vw,64px)] grid gap-3.5 min-[900px]:grid-cols-2 min-[900px]:items-end">
    <h2 class="max-w-[18ch] text-(length:--fs-h2)">
      <slot />
    </h2>
    <p class="max-w-[52ch] text-ink/72 min-[900px]:justify-self-end">
      {{ intro }}
    </p>
  </div>
</template>
