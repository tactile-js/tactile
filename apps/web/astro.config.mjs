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
      // Custom docs shell: no desktop header (brand/search/theme live in the
      // sidebar), collapsible sidebar rail, and a light/dark switch instead of
      // the three-way dropdown.
      components: {
        Header: './src/components/starlight/Header.astro',
        Sidebar: './src/components/starlight/Sidebar.astro',
        ThemeSelect: './src/components/starlight/ThemeSwitch.astro',
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
      // Groups are collapsed by default (Starlight auto-expands the group that
      // contains the current page, so context is never lost).
      sidebar: [
        {
          label: 'Getting started',
          collapsed: true,
          items: [{ autogenerate: { directory: 'getting-started' } }],
        },
        { label: 'Core API', collapsed: true, items: [{ autogenerate: { directory: 'core' } }] },
        {
          label: 'Core concepts',
          collapsed: true,
          items: [{ autogenerate: { directory: 'concepts' } }],
        },
        { label: 'Guides', collapsed: true, items: [{ autogenerate: { directory: 'guides' } }] },
        { label: 'React', collapsed: true, items: [{ autogenerate: { directory: 'react' } }] },
        {
          label: 'Comparisons',
          collapsed: true,
          items: [{ autogenerate: { directory: 'comparisons' } }],
        },
        {
          label: 'Resources',
          collapsed: true,
          items: [
            { label: 'Playground', link: '/playground/' },
            { label: 'Launch blog post', link: '/blog/introducing-tactile/' },
          ],
        },
      ],
      // Reuse Starlight's built-in sitemap-friendly head; we add extra SEO on the
      // bespoke landing/playground pages via our own <Seo> component.
    }),
    react(),
    sitemap(),
  ],
});
