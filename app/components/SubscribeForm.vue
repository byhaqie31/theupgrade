<script setup lang="ts">
const props = defineProps<{ variant: 'hero' | 'dark' }>()

const { subscribe } = useAppConfig()
const { status, submit } = useSubscribe()

const email = ref('')
const pending = computed(() => status.value === 'pending')
const meta = computed(() => props.variant === 'dark' ? subscribe.metaBand : subscribe.meta)

const ui = computed(() => props.variant === 'dark'
  ? {
      form: '',
      field: 'border-dark-cream/30 bg-dark-cream/7',
      input: 'text-dark-cream placeholder:text-dark-cream/45',
      button: 'bg-dark-cream text-ink hover:bg-amber-bright hover:text-ink',
      meta: 'justify-start text-dark-cream/50',
    }
  : {
      form: 'mx-auto mt-[34px] items-center',
      field: 'border-transparent bg-[rgba(255,252,245,.96)]',
      input: 'text-ink placeholder:text-ink/50',
      button: '',
      meta: 'justify-center text-[rgba(255,252,245,.75)]',
    })

function onSubmit() {
  submit(email.value)
}
</script>

<template>
  <form
    class="flex w-full max-w-[520px] flex-col gap-2.5"
    :class="ui.form"
    @submit.prevent="onSubmit"
  >
    <template v-if="status !== 'success'">
      <div
        class="flex w-full items-stretch rounded-pill border transition-colors duration-[250ms] focus-within:border-amber"
        :class="[ui.field, pending && 'opacity-70']"
      >
        <input
          v-model="email"
          type="email"
          name="email"
          autocomplete="email"
          :placeholder="subscribe.placeholder"
          aria-label="Email address"
          required
          :disabled="pending"
          class="w-0 min-w-0 flex-1 border-0 bg-transparent px-5 py-3.5 text-[15px] outline-0"
          :class="ui.input"
        >
        <button
          type="submit"
          class="btn m-1 border-0 disabled:cursor-wait"
          :class="ui.button"
          :disabled="pending"
          :aria-busy="pending"
        >
          {{ pending ? 'Sending' : 'Subscribe' }}
          <span
            class="arrow"
            aria-hidden="true"
          >→</span>
        </button>
      </div>

      <div
        class="meta flex flex-wrap gap-3.5 font-mono text-[11px] uppercase tracking-[.1em]"
        :class="ui.meta"
      >
        <span
          v-for="word in meta"
          :key="word"
        >{{ word }}</span>
      </div>

      <p
        v-if="status === 'error'"
        role="alert"
        class="font-sans text-[13px] text-amber-bright"
      >
        {{ subscribe.error }}
      </p>
    </template>

    <p
      v-else
      role="status"
      class="font-sans text-lg font-normal italic text-amber-bright"
    >
      {{ subscribe.thanks }}
    </p>
  </form>
</template>

<style scoped>
.meta span + span::before {
  content: "·";
  margin-right: 14px;
  color: var(--color-amber-bright);
}
</style>
