import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-22',

  modules: ['@nuxt/content', '@nuxt/fonts', '@nuxt/image', '@nuxt/eslint'],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  typescript: {
    strict: true,
    typeCheck: true,
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },

  fonts: {
    // Fonts are downloaded at build time and served from /_fonts. No third-party <link>.
    families: [
      // Satoshi italic 500 is used by the About signature, so italics cover 300-700.
      { name: 'Satoshi', provider: 'fontshare', weights: [300, 400, 500, 700], styles: ['normal', 'italic'] },
      { name: 'Geist Mono', provider: 'google', weights: [400, 500], styles: ['normal'] },
    ],
    defaults: {
      subsets: ['latin'],
    },
  },

  nitro: {
    prerender: {
      routes: ['/'],
      // Issue, archive and legal links point at routes that arrive in Phase 3.
      // Crawling them now would fail `nuxt generate` on 404s. Re-enable then.
      crawlLinks: false,
    },
  },
})
