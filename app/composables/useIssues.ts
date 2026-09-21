import type { IssuesCollectionItem } from '@nuxt/content'

export type Issue = IssuesCollectionItem

/**
 * The only place the issues collection is queried.
 * `featured` is the newest issue, `recent` the four after it.
 */
export async function useIssues() {
  const { data } = await useAsyncData(
    'issues',
    () => queryCollection('issues').order('issueNo', 'DESC').all(),
    { default: () => [] as Issue[] },
  )

  const all = computed<Issue[]>(() => data.value ?? [])
  const featured = computed<Issue | null>(() => all.value[0] ?? null)
  const recent = computed<Issue[]>(() => all.value.slice(1, 5))

  return { featured, recent, all }
}
