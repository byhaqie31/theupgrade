<script setup lang="ts">
const cards = [
  {
    num: '01',
    title: 'The verdict',
    body: 'One programme question, answered with the actual maths. Tier thresholds, earning rates, what changed this quarter and whether it matters to you.',
    example: '“Enrich 2026, explained without the marketing.”',
  },
  {
    num: '02',
    title: 'The stay',
    body: 'One hotel or one cabin, told as a story. What the status actually got us, what it did not, and whether we would go back on our own money.',
    example: '“Three nights on points in Langkawi. What the suite actually got us.”',
  },
  {
    num: '03',
    title: 'Your points',
    body: 'A reader sends their balances and a dream. We answer with a route, a cabin and a number. Anonymous, specific, and occasionally brutal.',
    example: '“124k KrisFlyer, two adults, wants Tokyo in J. Here is how.”',
  },
]
</script>

<template>
  <div class="grid gap-5 min-[820px]:grid-cols-3">
    <div
      v-for="card in cards"
      :key="card.num"
      class="flex min-h-[280px] flex-col gap-4 rounded-md border border-ink/14 bg-card p-[clamp(24px,3vw,40px)]"
    >
      <span class="font-mono text-[11px] tracking-[.14em] text-amber">{{ card.num }}</span>
      <h3 class="text-(length:--fs-format)">
        {{ card.title }}
      </h3>
      <p class="text-[15px] text-ink/72">
        {{ card.body }}
      </p>
      <p class="mt-auto border-t border-ink/14 pt-4 font-sans text-[15px] text-ink/72 italic">
        {{ card.example }}
      </p>
    </div>
  </div>
</template>
