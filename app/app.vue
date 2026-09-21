<script setup lang="ts">
const { site } = useAppConfig()

useSeoMeta({
  title: `${site.name} · ${site.title}`,
  description: site.description,
  ogTitle: `${site.name} · ${site.title}`,
  ogDescription: site.description,
  ogType: 'website',
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
