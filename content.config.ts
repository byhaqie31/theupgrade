import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    issues: defineCollection({
      type: 'page',
      source: 'issues/*.md',
      schema: z.object({
        issueNo: z.number(),
        title: z.string(),
        dek: z.string(),
        category: z.enum(['Airlines', 'Hotels', 'Strategy']),
        programmes: z.array(z.string()),
        readTime: z.number(),
        publishedAt: z.string(),
        thumb: z.string().optional(),
        quote: z.string().optional(),
        quoteSource: z.string().optional(),
        sample: z.boolean().default(false),
      }),
    }),
    programmes: defineCollection({
      type: 'data',
      source: 'programmes/*.yml',
      schema: z.object({
        id: z.string(),
        name: z.string(),
        kind: z.enum(['airline', 'hotel']),
        qualifyingUnit: z.enum(['nights', 'elite_points', 'miles', 'segments']),
        yearEnds: z.string(),
        effectiveFrom: z.string(),
        effectiveTo: z.string().optional(),
        tiers: z.array(z.object({
          id: z.string(),
          name: z.string(),
          threshold: z.number(),
          note: z.string().optional(),
        })),
        sourceUrl: z.string().url().optional(),
      }),
    }),
  },
})
