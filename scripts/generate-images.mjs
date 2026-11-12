// Builds the 1200x630 share images in public/og from SVG templates.
// Run with `npm run og` after changing page titles. Needs rsvg-convert installed.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const pages = [
  { file: 'default', title: 'Color converter', sub: 'HEX · RGB · HSL · OKLCH · Display P3 · CMYK', color: '#3B82F6', ink: '#FFFFFF' },
  { file: 'hex-to-rgb', title: 'HEX to RGB', sub: '#3B82F6 → rgb(59, 130, 246)', color: '#3B82F6', ink: '#FFFFFF' },
  { file: 'rgb-to-hex', title: 'RGB to HEX', sub: 'rgb(255, 87, 51) → #FF5733', color: '#FF5733', ink: '#0B0C0E' },
  { file: 'hex-to-hsl', title: 'HEX to HSL', sub: '#3B82F6 → hsl(217.2, 91.2%, 59.8%)', color: '#3B82F6', ink: '#FFFFFF' },
  { file: 'hsl-to-hex', title: 'HSL to HEX', sub: 'hsl(11, 100%, 60%) → #FF5833', color: '#FF5833', ink: '#0B0C0E' },
  { file: 'hex-to-oklch', title: 'HEX to OKLCH', sub: 'For Tailwind v4 and modern CSS', color: '#3B82F6', ink: '#FFFFFF' },
  { file: 'oklch-to-hex', title: 'OKLCH to HEX', sub: 'With a gamut check', color: '#6FB07D', ink: '#0B0C0E' },
  { file: 'rgb-to-hsl', title: 'RGB to HSL', sub: 'rgb(255, 87, 51) → hsl(10.6, 100%, 60%)', color: '#FF5733', ink: '#0B0C0E' },
  { file: 'rgb-to-cmyk', title: 'RGB to CMYK', sub: 'An honest print estimate', color: '#FF5733', ink: '#0B0C0E' },
  { file: 'bulk', title: 'Convert a whole file', sub: 'Every color in your CSS, in one go', color: '#17181A', ink: '#FFFFFF' },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
mkdirSync('public/og', { recursive: true });
const dir = join(tmpdir(), 'hexvert-og');
mkdirSync(dir, { recursive: true });

for (const p of pages) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${p.color}"/>
  <rect y="470" width="1200" height="160" fill="#FBFBFA"/>
  <g fill="${p.ink}" font-family="Inter, DejaVu Sans, sans-serif">
    <text x="72" y="118" font-size="40" font-weight="700" letter-spacing="-1">hexvert</text>
    <text x="72" y="300" font-size="104" font-weight="700" letter-spacing="-4">${esc(p.title)}</text>
    <text x="72" y="380" font-size="40" font-family="DejaVu Sans Mono, monospace">${esc(p.sub)}</text>
  </g>
  <text x="72" y="562" font-family="Inter, DejaVu Sans, sans-serif" font-size="34" fill="#17181A">Free · Private · Every value tested on each release</text>
</svg>`;
  const src = join(dir, `${p.file}.svg`);
  writeFileSync(src, svg);
  execFileSync('rsvg-convert', ['-w', '1200', '-h', '630', src, '-o', `public/og/${p.file}.png`]);
}
rmSync(dir, { recursive: true, force: true });
console.log(`wrote ${pages.length} images to public/og`);
