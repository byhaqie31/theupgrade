<script setup lang="ts">
import type { Issue } from '~/composables/useIssues'

defineProps<{ issue: Issue }>()
</script>

<template>
  <article class="overflow-hidden rounded-md border border-ink/14 bg-card shadow-card">
    <div class="grid gap-7 p-(--pad-card) min-[900px]:grid-cols-[1.1fr_.9fr] min-[900px]:gap-14 [&>*]:min-w-0">
      <div>
        <p class="eyebrow">
          Issue {{ formatIssueNo(issue.issueNo) }} · The verdict
        </p>
        <h3 class="mt-3.5 mb-[18px] text-(length:--fs-featured)">
          {{ issue.title }}
        </h3>
        <p class="max-w-[48ch] text-ink/72">
          {{ issue.dek }}
        </p>
        <div class="mt-[26px] flex flex-wrap gap-[18px] font-mono text-[11px] uppercase tracking-[.12em] text-ink/50">
          <span>{{ issue.readTime }} min read</span>
          <span
            v-for="programme in issue.programmes"
            :key="programme"
          >{{ programme }}</span>
          <span>{{ issue.category }}</span>
        </div>
        <NuxtLink
          :to="issue.path"
          class="btn btn-ghost mt-[26px]"
        >
          Read the issue
          <span
            class="arrow"
            aria-hidden="true"
          >→</span>
        </NuxtLink>
      </div>

      <MathsTable />
    </div>

    <div class="grid border-t border-ink/14 min-[900px]:grid-cols-2">
      <Foto
        class="min-h-[280px]"
        caption="Foto · the suite, your own photo"
      />
      <div
        v-if="issue.quote"
        class="flex flex-col justify-center gap-[18px] p-(--pad-card)"
      >
        <p class="font-sans text-(length:--fs-quote) leading-[1.4] font-normal tracking-[-0.01em] italic">
          “{{ issue.quote }}”
        </p>
        <small class="font-mono text-[11px] uppercase tracking-[.12em] text-ink/50">
          {{ issue.quoteSource }} · Issue {{ formatIssueNo(issue.issueNo) }}
        </small>
      </div>
    </div>
  </article>
</template>
