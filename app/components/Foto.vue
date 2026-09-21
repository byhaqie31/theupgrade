<script setup lang="ts">
/**
 * Gradient placeholder for photography that does not exist yet.
 * Later swapped for <NuxtImg>. Layered backgrounds are allowed in `gradient`.
 */
withDefaults(defineProps<{
  gradient?: string
  caption?: string
}>(), {
  gradient: 'radial-gradient(70% 55% at 65% 28%, rgba(255, 248, 230, .55), transparent 70%), linear-gradient(165deg, #cfe0e8 0%, #f0d9b8 45%, #e8a862 78%, #b06a48 100%)',
  caption: 'Foto',
})
</script>

<template>
  <div
    class="relative overflow-hidden"
    :style="{ background: gradient }"
  >
    <span class="foto-tag">{{ caption }}</span>
  </div>
</template>
