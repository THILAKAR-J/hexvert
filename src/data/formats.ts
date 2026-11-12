import type { FormatKey } from '../lib/color';

export const FORMAT_ROWS: ReadonlyArray<{ key: FormatKey; label: string; note: string }> = [
  { key: 'hex', label: 'HEX', note: 'Web and design tools' },
  { key: 'rgb', label: 'RGB', note: 'Works in every browser and app' },
  { key: 'hsl', label: 'HSL', note: 'Hue, saturation, lightness' },
  { key: 'hwb', label: 'HWB', note: 'Hue, whiteness, blackness' },
  { key: 'oklch', label: 'OKLCH', note: 'Tailwind v4 and modern CSS' },
  { key: 'oklab', label: 'OKLab', note: 'Perceptual mixing' },
  { key: 'p3', label: 'Display P3', note: 'Wide-gamut screens' },
  { key: 'cmyk', label: 'CMYK', note: 'Estimate only, no print profile' },
];

export const PRESETS: ReadonlyArray<{ name: string; value: string }> = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Orange', value: '#FF5733' },
  { name: 'Green', value: '#10B981' },
  { name: 'Violet', value: '#7C3AED' },
  { name: 'Ink', value: '#111827' },
  { name: 'Vivid green (outside sRGB)', value: 'oklch(70% 0.25 150)' },
];

/** Ten familiar colors used for the sample tables on conversion pages. */
export const SAMPLE_COLORS: ReadonlyArray<{ name: string; hex: string }> = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Lime', hex: '#00FF00' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Cyan', hex: '#00FFFF' },
  { name: 'Magenta', hex: '#FF00FF' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Orange', hex: '#FFA500' },
];
