<script setup lang="ts">
import type { Issue } from '~/composables/useIssues'

defineProps<{
  issues: Issue[]
  total: number
}>()

// Distinct placeholder gradients, cycled by position until real thumbs exist.
const THUMBS = [
  'linear-gradient(160deg, #d8e2e8, #e8c9a8 50%, #c47c58)',
  'linear-gradient(160deg, #d4e4e0, #a8c4b8 55%, #5f8d7a)',
  'linear-gradient(160deg, #f0e4d0, #e0b47c 55%, #b97c3e)',
  'linear-gradient(160deg, #dee4ea, #b3c2d3 55%, #7d8fa3)',
]
</script>

<template>
  <div>
    <div class="grid gap-5 min-[720px]:grid-cols-2 min-[1100px]:grid-cols-4">
      <IssueCard
        v-for="(issue, i) in issues"
        :key="issue.id"
        :issue="issue"
        :gradient="THUMBS[i % THUMBS.length]!"
      />
    </div>
    <div class="mt-7 flex flex-wrap items-center justify-between gap-4">
      <span class="eyebrow text-ink/50">{{ countWord(total) }} issues and counting</span>
      <NuxtLink
        to="/archive"
        class="btn btn-ghost"
      >
        Browse the archive
        <span
          class="arrow"
          aria-hidden="true"
        >→</span>
      </NuxtLink>
    </div>
  </div>
</template>
