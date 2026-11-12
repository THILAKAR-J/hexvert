import type { Formats } from './color';

/** Ready-to-paste code for the current color. Shared by the server render and the browser script. */
export function cssSnippet(f: Pick<Formats, 'hex' | 'oklch'>): string {
  return `:root {\n  --brand: ${f.hex};\n  --brand-oklch: ${f.oklch};\n}`;
}

export function tailwindSnippet(f: Pick<Formats, 'oklch'>): string {
  return `@theme {\n  --color-brand-500: ${f.oklch};\n}`;
}
