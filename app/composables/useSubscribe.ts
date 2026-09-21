export type SubscribeStatus = 'idle' | 'pending' | 'success' | 'error'

/**
 * Subscribe form state. One instance per form.
 * Phase 1: `submit` waits 600ms and resolves to success.
 * Phase 3: replace the body of `submit` with a POST to /api/subscribe.
 * The `{ status, submit }` contract does not change.
 */
export function useSubscribe() {
  const status = ref<SubscribeStatus>('idle')

  async function submit(email: string): Promise<void> {
    if (status.value === 'pending') return
    status.value = 'pending'
    try {
      // Phase 3: await $fetch('/api/subscribe', { method: 'POST', body: { email } })
      void email
      await new Promise(resolve => setTimeout(resolve, 600))
      status.value = 'success'
    }
    catch {
      status.value = 'error'
    }
  }

  return { status, submit }
}
