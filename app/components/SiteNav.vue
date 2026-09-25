<script setup lang="ts">
const { nav } = useAppConfig()

// Cream-on-transparent while the cinematic hero's stage sits under the bar, then the cream bar.
const underHero = useHeroUnderNav()
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b transition-[background-color,border-color,color] duration-300 ease-[ease]"
    :class="underHero
      ? 'border-transparent bg-transparent text-dark-cream'
      : 'border-ink/14 bg-paper/80 backdrop-blur-[14px]'"
  >
    <div class="wrap flex h-(--nav-h) items-center justify-between">
      <Wordmark :tone="underHero ? 'dark' : 'paper'" />

      <nav
        class="hidden gap-8 text-sm font-medium min-[900px]:flex"
        :class="underHero ? 'text-dark-cream/80' : 'text-ink/72'"
        aria-label="Primary"
      >
        <NuxtLink
          v-for="item in nav"
          :key="item.label"
          :to="item.to"
          :class="underHero ? 'hover:text-dark-cream' : 'hover:text-ink'"
        >
          {{ item.label }}<span
            v-if="item.soon"
            class="ml-1.5 align-[2px] font-mono text-[10px] tracking-[.12em]"
            :class="underHero ? 'text-amber-bright' : 'text-amber'"
          >Soon</span>
        </NuxtLink>
      </nav>

      <NuxtLink
        to="#subscribe"
        class="btn px-[18px] py-2.5 text-[13px]"
        :class="underHero && 'border-dark-cream bg-dark-cream text-ink hover:border-amber-bright hover:bg-amber-bright hover:text-ink'"
      >
        Subscribe
      </NuxtLink>
    </div>
  </header>
</template>
