<script lang="ts">
/**
 * Sample profile shown on the homepage. The numbers are illustrative.
 * Tier names and thresholds are read from the programmes collection.
 */
const sampleProfile = {
  programmeId: 'marriott-bonvoy',
  current: 54,
  confirmed: 14,
  projected: 68,
  target: 75,
  recommendation: 'Seven nights short. Prioritise Marriott through November, then move the rest back to Hilton.',
}

const UNIT_LABEL: Record<string, string> = {
  nights: 'elite nights',
  elite_points: 'elite points',
  miles: 'miles',
  segments: 'segments',
}
</script>

<script setup lang="ts">
const { byId } = await useProgrammes()
const programme = byId(sampleProfile.programmeId)

const topThreshold = sampleProfile.target
const fill = (sampleProfile.current / topThreshold) * 100

const unit = computed(() => UNIT_LABEL[programme.value?.qualifyingUnit ?? 'nights'] ?? 'elite nights')
const yearEnd = computed(() => formatYearEnd(programme.value?.yearEnds ?? '12-31'))

const stops = computed(() => {
  const tiers = programme.value?.tiers ?? []
  return [{ id: 'member', name: 'Member', threshold: 0 }, ...tiers]
    .filter(tier => tier.threshold <= topThreshold)
    .map((tier) => {
      const pct = (tier.threshold / topThreshold) * 100
      return {
        ...tier,
        pct,
        on: pct <= fill,
        target: tier.threshold === topThreshold,
      }
    })
})

function anchor(pct: number) {
  if (pct <= 0) return 'translate-x-0'
  if (pct >= 100) return '-translate-x-full'
  return '-translate-x-1/2'
}

function labelTone(stop: { on: boolean, target: boolean }) {
  if (stop.target) return 'text-amber-bright'
  if (stop.on) return 'text-dark-cream'
  return ''
}
</script>

<template>
  <div class="@container rounded-md border border-dark-cream/16 bg-dark-cream/5 p-[clamp(22px,3vw,36px)]">
    <div class="flex flex-wrap items-baseline justify-between gap-3">
      <span class="eyebrow text-amber-bright">{{ programme?.name }} · Sample profile</span>
      <span class="eyebrow text-dark-cream/50">Year ends {{ yearEnd }}</span>
    </div>

    <div class="mt-[22px] mb-1.5 font-sans text-(length:--fs-count) leading-none font-medium tracking-[-0.03em]">
      <span>{{ sampleProfile.current }}</span><small class="ml-2.5 font-mono text-xs uppercase tracking-[.12em] text-dark-cream/50">{{ unit }}</small>
    </div>
    <p class="text-[15px] text-dark-cream/72">
      Confirmed <b class="font-medium text-dark-cream">+{{ sampleProfile.confirmed }}</b>
      · Projected <b class="font-medium text-dark-cream">{{ sampleProfile.projected }}</b>
      · Target <b class="font-medium text-amber-bright">{{ sampleProfile.target }}</b>
    </p>

    <div class="mt-[30px]">
      <div class="relative h-px bg-dark-cream/30">
        <div
          class="absolute top-0 left-0 h-full bg-amber-bright"
          :style="{ width: `${fill}%` }"
        />
        <i
          v-for="stop in stops"
          :key="stop.id"
          class="absolute top-1/2 size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full border"
          :class="stop.on ? 'border-amber-bright bg-amber-bright' : 'border-dark-cream/40 bg-dark'"
          :style="{ left: `${stop.pct}%` }"
        />
      </div>
      <div class="relative mt-[11px] h-[17px] font-mono text-[10px] uppercase tracking-[.1em] text-dark-cream/50">
        <!-- Stops sit at threshold / target. On a narrow card the base label would run into Silver, so it hides. -->
        <span
          v-for="stop in stops"
          :key="stop.id"
          class="absolute top-0 whitespace-nowrap"
          :class="[anchor(stop.pct), labelTone(stop), stop.threshold === 0 && '@max-[520px]:hidden']"
          :style="{ left: `${stop.pct}%` }"
        >{{ stop.name }}</span>
      </div>
    </div>

    <div class="mt-[26px] flex flex-wrap items-center justify-between gap-3 border-t border-dark-cream/16 pt-[18px]">
      <p class="max-w-[34ch] text-sm text-dark-cream/72">
        {{ sampleProfile.recommendation }}
      </p>
      <span class="rounded-pill border border-amber-bright/50 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[.12em] text-amber-bright">Recommendation</span>
    </div>
  </div>
</template>
