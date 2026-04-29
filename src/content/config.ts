import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    category: z.string(),
    image: z.string().optional(),
    readTime: z.number().default(5),
    author: z.object({
      name: z.string(),
      role: z.string().default(''),
      bio: z.string().default(''),
    }).or(z.string().transform((s) => ({ name: s, role: '', bio: '' }))),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = {
  blog: blogCollection,
};
