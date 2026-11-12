import type { APIRoute } from 'astro';
import { SITE } from '../data/site';
import { PAIRS } from '../data/pairs';

// lastmod is the date the page content last really changed. Update it only when the content changes.
const PAGES: Array<[string, string]> = [
  ['/', '2026-11-12'],
  ...PAIRS.map((p): [string, string] => [`/${p.slug}`, p.updated]),
  ['/bulk', '2026-11-12'],
  ['/accuracy', '2026-11-12'],
  ['/about', '2026-11-12'],
  ['/privacy', '2026-11-12'],
  ['/terms', '2026-11-12'],
];

export const GET: APIRoute = () => {
  const urls = PAGES.map(([path, lastmod]) => `  <url>\n    <loc>${SITE.url}${path}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
