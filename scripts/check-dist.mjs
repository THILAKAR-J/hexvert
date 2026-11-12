// Post-build checks on the generated site. Fails the build (exit 1) on any SEO or link problem.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const SITE = 'https://hexvert.com';
const errors = [];
const fail = (file, msg) => errors.push(`${file}: ${msg}`);

const htmlFiles = readdirSync(DIST).filter((f) => f.endsWith('.html'));
const pathOf = (file) => (file === 'index.html' ? '/' : '/' + file.replace(/\.html$/, ''));
const attr = (html, re) => (html.match(re) || [])[1];
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

/** Does a site-relative URL resolve to a file in dist? */
function resolves(url) {
  const clean = url.split('#')[0].split('?')[0];
  if (clean === '' || clean === '/') return true;
  const p = join(DIST, decodeURIComponent(clean));
  if (existsSync(p) && statSync(p).isFile()) return true;
  return existsSync(p + '.html');
}

const titles = new Map();
const descriptions = new Map();
const indexable = new Set();

for (const file of htmlFiles) {
  const html = readFileSync(join(DIST, file), 'utf8');
  const path = pathOf(file);
  const title = decode(attr(html, /<title>([^<]*)<\/title>/) || '');
  const description = decode(attr(html, /<meta name="description" content="([^"]*)"/) || '');
  const canonical = attr(html, /<link rel="canonical" href="([^"]*)"/);
  const robots = attr(html, /<meta name="robots" content="([^"]*)"/) || '';
  const noindex = robots.includes('noindex');

  if (!title) fail(file, 'missing <title>');
  else if (title.length > 60) fail(file, `title is ${title.length} characters (max 60)`);
  if (!description) fail(file, 'missing meta description');
  else if (description.length > 160 || description.length < 70) fail(file, `description is ${description.length} characters (want 70 to 160)`);
  if (titles.has(title)) fail(file, `duplicate title with ${titles.get(title)}`);
  titles.set(title, file);
  if (descriptions.has(description)) fail(file, `duplicate description with ${descriptions.get(description)}`);
  descriptions.set(description, file);

  const expectedCanonical = SITE + path;
  if (canonical !== expectedCanonical) fail(file, `canonical is ${canonical}, expected ${expectedCanonical}`);
  if (!noindex) indexable.add(path);
  if (file === '404.html' && !noindex) fail(file, '404 page must be noindex');

  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) fail(file, `has ${h1s} <h1> elements`);
  if (!/<html lang="en"/.test(html)) fail(file, 'missing lang on <html>');
  if (!/<meta name="viewport"/.test(html)) fail(file, 'missing viewport');

  const og = attr(html, /<meta property="og:image" content="([^"]*)"/);
  if (!og || !og.startsWith(SITE) || !resolves(og.slice(SITE.length))) fail(file, `og:image missing or not found: ${og}`);

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
    } catch {
      fail(file, 'invalid JSON-LD');
    }
  }

  for (const m of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
    const url = m[1];
    if (url.startsWith('mailto:') || url.startsWith('#') || url.startsWith('data:')) continue;
    if (/^https?:\/\//.test(url)) {
      if (url.startsWith(SITE) && !resolves(url.slice(SITE.length))) fail(file, `broken absolute link ${url}`);
      continue;
    }
    if (url.startsWith('/') && !resolves(url)) fail(file, `broken link ${url}`);
    if (!url.startsWith('/')) fail(file, `relative link ${url} (use site-relative paths)`);
  }

  for (const bad of [/lorem ipsum/i, /\bniram\b/i, /\bundefined\b/, /\bNaN\b/, /\[object Object\]/, /TODO/]) {
    const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
    if (bad.test(text)) fail(file, `contains ${bad}`);
  }
}

// Sitemap: every indexable page listed, nothing else.
const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
const listed = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].slice(SITE.length) || '/'));
for (const p of indexable) if (!listed.has(p)) fail('sitemap.xml', `missing indexable page ${p}`);
for (const p of listed) if (!indexable.has(p)) fail('sitemap.xml', `lists ${p}, which is missing or noindex`);

const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
if (!robots.includes(`Sitemap: ${SITE}/sitemap.xml`)) fail('robots.txt', 'does not point at the sitemap');
if (/Disallow:\s*\/\s*$/m.test(robots)) fail('robots.txt', 'blocks the whole site');

for (const required of ['_headers', '_redirects', 'favicon.svg', 'site.webmanifest', '404.html']) {
  if (!existsSync(join(DIST, required))) fail('dist', `missing ${required}`);
}

if (errors.length) {
  console.error(`\n${errors.length} problem(s) found in the built site:\n` + errors.map((e) => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log(`check-dist: ${htmlFiles.length} pages, ${listed.size} in sitemap, all checks passed.`);
