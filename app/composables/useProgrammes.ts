import type { ProgrammesCollectionItem } from '@nuxt/content'

export type Programme = ProgrammesCollectionItem
export type Tier = Programme['tiers'][number]

/**
 * Nuxt Content owns the `id` column and overwrites the `id` written in the
 * YAML with its own content id ("programmes/programmes/marriott-bonvoy.yml").
 * The file stem ("programmes/marriott-bonvoy") is the stable handle, so
 * lookups match on the stem's last segment as well as on `id`.
 */
export function programmeSlug(programme: Pick<Programme, 'id' | 'stem'>): string {
  return programme.stem.split('/').pop() ?? programme.id
}

/** The only place the programmes collection is queried. */
export async function useProgrammes() {
  const { data } = await useAsyncData(
    'programmes',
    () => queryCollection('programmes').order('name', 'ASC').all(),
    { default: () => [] as Programme[] },
  )

  const programmes = computed<Programme[]>(() => data.value ?? [])

  /** Look a programme up by slug, e.g. "marriott-bonvoy". */
  const byId = (id: string) => computed<Programme | null>(
    () => programmes.value.find(p => p.id === id || programmeSlug(p) === id) ?? null,
  )

  return { programmes, byId }
}
