import type { Formats } from './color';

/** Inline custom properties that paint the hero in the current color. Used by the server render and the browser script. */
export function swatchStyle(f: Pick<Formats, 'css' | 'ink'>): string {
  const line = f.ink === '#FFFFFF' ? 'rgba(255, 255, 255, 0.55)' : 'rgba(11, 12, 14, 0.5)';
  return `--swatch:${f.css};--ink:${f.ink};--ink-line:${line}`;
}
