// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // Component names (Foto, Wordmark, Interlude) are fixed by the design handoff.
    'vue/multi-word-component-names': 'off',
  },
})
