<script setup lang="ts">
import type { Issue } from '~/composables/useIssues'

defineProps<{
  issue: Issue
  gradient: string
}>()
</script>

<template>
  <NuxtLink
    :to="issue.path"
    class="flex min-h-[340px] flex-col gap-3.5 rounded-md border border-ink/14 bg-card px-4 pt-4 pb-[22px] transition-[transform,box-shadow] duration-[350ms] ease-[ease] hover:-translate-y-1 hover:text-ink hover:shadow-card-hover"
  >
    <Foto
      class="aspect-[4/3] rounded-sm [--tag-x:12px] [--tag-y:10px]"
      :gradient="gradient"
      caption="Foto"
    />
    <div class="flex justify-between font-mono text-[10px] uppercase tracking-[.12em] text-ink/50">
      <span>Issue {{ formatIssueNo(issue.issueNo) }}</span>
      <span>{{ issue.category }}</span>
    </div>
    <h3 class="text-[1.45rem] leading-[1.15]">
      {{ issue.title }}
    </h3>
    <p class="text-sm text-ink/72">
      {{ issue.dek }}
    </p>
    <span class="mt-auto inline-flex items-center gap-2 text-[13px] font-medium text-amber">
      Read <span aria-hidden="true">→</span>
    </span>
  </NuxtLink>
</template>
