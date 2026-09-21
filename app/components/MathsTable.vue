<script lang="ts">
export interface MathsRow {
  label: string
  value: string
}

// Sample figures from the design. "RM X" awaits real numbers.
// Phase 3 moves these into issue frontmatter and passes them down.
const SAMPLE_ROWS: MathsRow[] = [
  { label: 'Nights to Titanium', value: '75' },
  { label: 'Nights already booked', value: '68' },
  { label: 'Gap', value: '7 nights' },
  { label: 'Cost to close, cheapest', value: 'RM X' },
  { label: 'Suite upgrades, est. value', value: 'RM X' },
]
const SAMPLE_VERDICT = 'Worth it, if you close the gap in Malaysia and Thailand. Not worth it from Singapore rates.'
</script>

<script setup lang="ts">
withDefaults(defineProps<{
  rows?: MathsRow[]
  verdict?: string
}>(), {
  rows: () => SAMPLE_ROWS,
  verdict: SAMPLE_VERDICT,
})
</script>

<template>
  <div
    class="rounded-sm border border-ink/14 bg-paper p-[22px] font-mono text-[13px]"
    role="group"
    aria-label="Sample calculation"
  >
    <div
      v-for="row in rows"
      :key="row.label"
      class="flex justify-between gap-4 border-b border-ink/14 py-2.5 text-ink/72"
    >
      <span>{{ row.label }}</span>
      <b class="font-medium text-ink">{{ row.value }}</b>
    </div>
    <div class="mt-4 border-t border-ink/32 pt-4 font-sans text-base leading-[1.4] font-medium text-amber">
      {{ verdict }}
    </div>
  </div>
</template>
