<script setup lang="ts">
const { site, footerLinks, legal } = useAppConfig()
</script>

<template>
  <footer class="pt-10 pb-12">
    <div class="wrap">
      <div class="flex flex-wrap items-center justify-between gap-5 text-[13px] text-ink/50">
        <Wordmark :size="18" />
        <div class="flex flex-wrap gap-[22px]">
          <NuxtLink
            v-for="link in footerLinks"
            :key="link.label"
            :to="link.to"
            class="hover:text-ink"
          >
            {{ link.label }}
          </NuxtLink>
        </div>
      </div>
      <p class="mt-[26px] max-w-[78ch] border-t border-ink/14 pt-[22px] text-xs leading-[1.6] text-ink/50">
        {{ legal.disclaimer }}
      </p>
      <p class="mt-3.5 font-mono text-[10px] uppercase tracking-[.12em] text-ink/50">
        © {{ legal.since }} {{ site.name }} · {{ legal.studio }}
      </p>
    </div>
  </footer>
</template>
