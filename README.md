# Hexvert

A free, private color converter: HEX, RGB, HSL, HWB, OKLCH, OKLab, Display P3 and CMYK.
Live at **https://hexvert.com**.

Static site built with [Astro](https://astro.build). All conversion runs in the browser; there is no server and no database.

## Branches

| Branch | Purpose | Deploys to |
| --- | --- | --- |
| `dev` | Work in progress and review | `https://dev.hexvert.pages.dev` (preview, not indexed by search engines) |
| `main` | Live site | `https://hexvert.com` |

Workflow: commit to `dev` → check the preview → open a pull request from `dev` into `main` → merge to go live.
CI runs the type check, all tests and the site checks on every push and pull request.

## Commands

```sh
npm ci            # install exactly what package-lock.json lists
npm run dev       # local server at http://localhost:4321
npm test          # color engine and page-copy tests
npm run check     # TypeScript and Astro type check
npm run build     # tests + build + post-build SEO and link checks (output in dist/)
npm run og        # regenerate share images in public/og (needs rsvg-convert)
```

`npm run build` fails if any of these break:

- A conversion disagrees with the Culori reference library (5,012 colors), or a value does not round-trip.
- A number quoted in page copy (`src/data/pairs.ts`) differs from what the converter outputs.
- A page has a missing or over-long title or description, a duplicate title, a wrong canonical, more or less than one `<h1>`, a broken internal link, or invalid structured data.
- The sitemap lists a page that is missing or noindex, or misses an indexable page.

## Where things are

| Path | What it is |
| --- | --- |
| `src/lib/color.ts` | The color engine (parse, convert, gamut-map, format) |
| `src/lib/bulk.ts` | Finds and converts every color in a block of text |
| `src/data/pairs.ts` | Content for each conversion page, with the values it quotes |
| `src/pages/` | Pages, plus `sitemap.xml` and `robots.txt` |
| `src/scripts/converter.ts` | Browser script that keeps the page in step with the input |
| `public/_headers`, `public/_redirects` | Cloudflare Pages security, caching and redirect rules |
| `scripts/check-dist.mjs` | Post-build SEO and link checks |

### Adding a conversion page

1. Add an entry to `PAIRS` in `src/data/pairs.ts`, including the `checks` for every value its copy quotes.
2. Add its share image to `scripts/generate-images.mjs` and run `npm run og`.
3. `npm run build`. The page, sitemap entry and links appear automatically.

Publish new pages in small batches (see the strategy doc), and only change `lastmod` dates when content really changes.

## Cloudflare Pages setup (one time)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → choose `THILAKAR-J/hexvert`.
2. Project name `hexvert`. Production branch `main`. Framework preset **Astro**.
   Build command `npm run build`, output directory `dist`. Node version comes from `.nvmrc`.
3. **Settings → Builds → Branch control**: production `main`; preview deployments **Custom branches** → include `dev`.
4. Add the domain: **Custom domains** → `hexvert.com`, then `www.hexvert.com`.
   Cloudflare will ask you to add the domain to your account and change the nameservers at Hostinger to the two it shows.
5. Redirect `www` to the bare domain: **Rules → Redirect Rules** → hostname equals `www.hexvert.com` → dynamic redirect to `concat("https://hexvert.com", http.request.uri.path)`, status 301, preserve query string.
6. **SSL/TLS**: mode **Full (strict)**, **Always Use HTTPS** on.
7. Optional, recommended: **Settings → Access policy** on preview deployments so only you can open `dev`.

Then in Google Search Console add the domain property `hexvert.com` (DNS verification in Cloudflare) and submit `https://hexvert.com/sitemap.xml`.

## Email

The site lists `hello@hexvert.com`. Set it up with Cloudflare **Email Routing** (free) to forward to your inbox before launch.
