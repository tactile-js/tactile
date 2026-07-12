import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

/**
 * llms-full.txt — the complete documentation as one plain-markdown file, for
 * AI crawlers and retrieval systems (the llms.txt convention's "full" variant).
 */
export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL('https://tactile-js.vercel.app');
  const docs = await getCollection('docs');

  const header = [
    '# Tactile — complete documentation',
    '',
    '> Tactile is a modern, context-aware keyboard shortcut engine for JavaScript and React.',
    '> Layout-aware matching (event.key + event.code, never the deprecated keyCode),',
    '> VS Code-style `when` expressions, first-class collision detection, sequences,',
    '> runtime shortcut recording, and keymap introspection for help dialogs.',
    '> Packages: @tactile-js/core (framework-agnostic) and @tactile-js/react (hooks).',
    `> Website: ${base.href} · GitHub: https://github.com/tactile-js/tactile`,
    '',
    '---',
    '',
  ].join('\n');

  const sections = docs
    .map((entry) => {
      const url = new URL(`/${entry.id}/`, base).href;
      return [
        `# ${entry.data.title}`,
        '',
        `Source: ${url}`,
        entry.data.description ? `Summary: ${entry.data.description}` : '',
        '',
        entry.body ?? '',
        '',
        '---',
        '',
      ].join('\n');
    })
    .join('\n');

  return new Response(header + sections, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
