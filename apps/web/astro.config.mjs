// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// Temporary canonical origin (free Vercel subdomain). When a custom domain is
// added, update this and add 301s — everything else derives from `site`.
const SITE = 'https://tactile-js.vercel.app';

export default defineConfig({
  site: SITE,
  integrations: [
    starlight({
      title: 'Tactile',
      description:
        'A modern, context-aware keyboard shortcut engine for the web. Layout-aware matching, when-expressions, and collision detection — framework-agnostic core with React hooks.',
      tagline: 'Keyboard shortcuts, done right.',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/tactile-js/tactile' },
        { icon: 'npm', label: 'npm', href: 'https://www.npmjs.com/package/@tactile-js/core' },
      ],
      editLink: {
        baseUrl: 'https://github.com/tactile-js/tactile/edit/main/apps/web/',
      },
      customCss: [
        '@fontsource-variable/geist/index.css',
        '@fontsource-variable/geist-mono/index.css',
        './src/styles/tokens.css',
        './src/styles/starlight-theme.css',
      ],
      expressiveCode: {
        themes: ['github-dark'],
        styleOverrides: {
          borderColor: 'rgba(255,255,255,0.08)',
          borderRadius: '0.5rem',
          codeBackground: '#0E1113',
          frames: {
            editorActiveTabBackground: '#121417',
            editorTabBarBackground: '#0C0E10',
            terminalBackground: '#0E1113',
            terminalTitlebarBackground: '#0C0E10',
          },
        },
      },
      sidebar: [
        { label: 'Getting started', items: [{ autogenerate: { directory: 'getting-started' } }] },
        { label: 'Core concepts', items: [{ autogenerate: { directory: 'concepts' } }] },
        { label: 'React', items: [{ autogenerate: { directory: 'react' } }] },
        { label: 'Comparisons', items: [{ autogenerate: { directory: 'comparisons' } }] },
      ],
      // Reuse Starlight's built-in sitemap-friendly head; we add extra SEO on the
      // bespoke landing/playground pages via our own <Seo> component.
    }),
    react(),
    sitemap(),
  ],
});
