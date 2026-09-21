<script setup lang="ts">
const { nav } = useAppConfig()
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-ink/14 bg-paper/80 backdrop-blur-[14px]">
    <div class="wrap flex h-[68px] items-center justify-between">
      <Wordmark />

      <nav
        class="hidden gap-8 text-sm font-medium text-ink/72 min-[900px]:flex"
        aria-label="Primary"
      >
        <NuxtLink
          v-for="item in nav"
          :key="item.label"
          :to="item.to"
          class="hover:text-ink"
        >
          {{ item.label }}<span
            v-if="item.soon"
            class="ml-1.5 align-[2px] font-mono text-[10px] tracking-[.12em] text-amber"
          >Soon</span>
        </NuxtLink>
      </nav>

      <NuxtLink
        to="#subscribe"
        class="btn px-[18px] py-2.5 text-[13px]"
      >
        Subscribe
      </NuxtLink>
    </div>
  </header>
</template>
