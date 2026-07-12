import { getCollection } from 'astro:content';
import { OGImageRoute } from 'astro-og-canvas';

/**
 * Build-time Open Graph images for every docs page: /og/<docs-id>.png.
 * (The default slug mapper appends .png to each page key.) The matching
 * og:image meta is injected by the Head override.
 */
const docs = await getCollection('docs');

const pages = Object.fromEntries(
  docs.map(({ id, data }) => [id, { title: data.title, description: data.description ?? '' }]),
);

const route = await OGImageRoute({
  pages,
  getImageOptions: (_path, page: (typeof pages)[string]) => ({
    title: page.title,
    description: page.description,
    bgGradient: [[10, 11, 12]],
    border: { color: [44, 143, 102], width: 14, side: 'inline-start' },
    padding: 72,
    font: {
      title: {
        size: 60,
        lineHeight: 1.15,
        weight: 'SemiBold',
        color: [72, 213, 151],
      },
      description: {
        size: 28,
        lineHeight: 1.5,
        color: [200, 206, 203],
      },
    },
  }),
});

export const getStaticPaths = route.getStaticPaths;
export const GET = route.GET;
