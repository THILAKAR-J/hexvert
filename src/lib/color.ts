/**
 * Hexvert color engine.
 *
 * Everything is converted through linear-light sRGB. A parsed color keeps the
 * displayable sRGB value (r, g, b in 0..1) and, when the input was outside
 * sRGB, the fact that it was gamut-mapped.
 *
 * The maths follows CSS Color Module Level 4. Results are checked against the
 * Culori library in color.test.ts on every build.
 */
import { NAMED } from './named';

export type InputKind = 'HEX' | 'RGB' | 'HSL' | 'HWB' | 'OKLCH' | 'OKLab' | 'Display P3' | 'CMYK' | 'a CSS color name';

export interface Color {
  /** Displayable sRGB channels, 0..1 */
  r: number;
  g: number;
  b: number;
  /** Opacity, 0..1 */
  alpha: number;
  /** True when the input was outside sRGB and had to be gamut-mapped */
  mapped: boolean;
  /** The input as a Display P3 color when it fits inside P3, otherwise null. Only set for mapped colors. */
  wide: string | null;
  /** Which notation the input used */
  kind: InputKind;
}

export type FormatKey = 'hex' | 'rgb' | 'hsl' | 'hwb' | 'oklch' | 'oklab' | 'p3' | 'cmyk';

export interface Formats extends Record<FormatKey, string> {
  /** #rrggbb without alpha, lower case, for <input type="color"> */
  solidHex: string;
  /** CSS color including alpha, for painting the swatch */
  css: string;
  /** Black or white, whichever reads better on the swatch */
  ink: '#0B0C0E' | '#FFFFFF';
  onWhite: string;
  onBlack: string;
  whiteGrade: string;
  blackGrade: string;
  okL: number;
  okC: number;
  okH: number;
}

type Vec3 = [number, number, number];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/* ---------- transfer functions and matrices ---------- */

export function toLinear(c: number): number {
  const a = Math.abs(c);
  const v = a <= 0.04045 ? a / 12.92 : Math.pow((a + 0.055) / 1.055, 2.4);
  return c < 0 ? -v : v;
}

export function toGamma(c: number): number {
  const a = Math.abs(c);
  const v = a <= 0.0031308 ? 12.92 * a : 1.055 * Math.pow(a, 1 / 2.4) - 0.055;
  return c < 0 ? -v : v;
}

function linearToOklab([r, g, b]: Vec3): Vec3 {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToLinear([L, a, b]: Vec3): Vec3 {
  let l = L + 0.3963377774 * a + 0.2158037573 * b;
  let m = L - 0.1055613458 * a - 0.0638541728 * b;
  let s = L - 0.0894841775 * a - 1.291485548 * b;
  l = l * l * l;
  m = m * m * m;
  s = s * s * s;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/* linear sRGB <-> linear Display P3 */
function linearSrgbToP3([r, g, b]: Vec3): Vec3 {
  return [
    0.8224619687 * r + 0.1775380313 * g,
    0.0331941989 * r + 0.9668058011 * g,
    0.0170826307 * r + 0.0723974407 * g + 0.9105199286 * b,
  ];
}

function linearP3ToSrgb([r, g, b]: Vec3): Vec3 {
  return [
    1.2249401763 * r - 0.2249401763 * g,
    -0.0420569547 * r + 1.0420569547 * g,
    -0.0196375546 * r - 0.0786360456 * g + 1.0982736002 * b,
  ];
}

const GAMUT_EPS = 0.000075;
const inGamut = (v: Vec3) => v.every((x) => x >= -GAMUT_EPS && x <= 1 + GAMUT_EPS);

/**
 * CSS Color 4 gamut mapping: hold lightness and hue, reduce chroma in OKLCH
 * until the color fits sRGB, accepting a clipped color once it is within one
 * just-noticeable difference of the unclipped one.
 */
function gamutMapToSrgb(L: number, C: number, hRad: number): Vec3 {
  if (L >= 1) return [1, 1, 1];
  if (L <= 0) return [0, 0, 0];
  const at = (c: number): Vec3 => oklabToLinear([L, c * Math.cos(hRad), c * Math.sin(hRad)]);
  const clip = (v: Vec3): Vec3 => [clamp01(v[0]), clamp01(v[1]), clamp01(v[2])];
  const deltaE = (c: number, clipped: Vec3) => {
    const p = linearToOklab(clipped);
    const a = c * Math.cos(hRad);
    const b = c * Math.sin(hRad);
    return Math.hypot(p[0] - L, p[1] - a, p[2] - b);
  };
  const JND = 0.02;
  const EPS = 0.0001;
  let current = at(C);
  if (inGamut(current)) return clip(current);
  let clipped = clip(current);
  if (deltaE(C, clipped) < JND) return clipped;
  let lo = 0;
  let hi = C;
  let loInGamut = true;
  while (hi - lo > EPS) {
    const mid = (lo + hi) / 2;
    current = at(mid);
    if (loInGamut && inGamut(current)) {
      lo = mid;
      continue;
    }
    clipped = clip(current);
    const e = deltaE(mid, clipped);
    if (e < JND) {
      if (JND - e < EPS) break;
      loInGamut = false;
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return clipped;
}

/* ---------- parsing ---------- */

function hslToRgb(h: number, s: number, l: number): Vec3 {
  h = ((h % 360) + 360) % 360;
  s = clamp01(s);
  l = clamp01(l);
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)];
}

/** A number or percentage. `scale` is what 100% means. "none" is 0. */
function num(token: string, scale: number): number {
  if (token === 'none') return 0;
  if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?%?$/.test(token)) return NaN;
  return token.endsWith('%') ? (parseFloat(token) / 100) * scale : parseFloat(token);
}

/** A hue in degrees. Accepts deg, grad, rad and turn. */
function hue(token: string): number {
  if (token === 'none') return 0;
  const m = token.match(/^([+-]?(?:\d+\.?\d*|\.\d+))(deg|grad|rad|turn)?$/);
  if (!m) return NaN;
  const v = parseFloat(m[1]);
  switch (m[2]) {
    case 'grad':
      return v * 0.9;
    case 'rad':
      return (v * 180) / Math.PI;
    case 'turn':
      return v * 360;
    default:
      return v;
  }
}

function alphaOf(token: string | undefined): number {
  if (token === undefined) return 1;
  const a = num(token, 1);
  return Number.isNaN(a) ? NaN : clamp01(a);
}

/** How far (OKLab distance) a color may sit outside sRGB before we call it out of gamut. Covers rounding in pasted values. */
const NEAR_GAMUT = 0.0008;

function fromLinear(lin: Vec3, alpha: number, kind: InputKind, knownLab?: Vec3): Color {
  const direct = (v: Vec3, mapped: boolean, wide: string | null): Color => ({
    r: clamp01(toGamma(v[0])),
    g: clamp01(toGamma(v[1])),
    b: clamp01(toGamma(v[2])),
    alpha,
    mapped,
    wide,
    kind,
  });
  if (inGamut(lin)) return direct(lin, false, null);
  const lab = knownLab ?? linearToOklab(lin);
  // A value that is outside sRGB only by rounding is clipped, not reported as out of gamut.
  const clipped: Vec3 = [clamp01(lin[0]), clamp01(lin[1]), clamp01(lin[2])];
  const near = linearToOklab(clipped);
  if (Math.hypot(near[0] - lab[0], near[1] - lab[1], near[2] - lab[2]) < NEAR_GAMUT) return direct(clipped, false, null);
  const C = Math.hypot(lab[1], lab[2]);
  const h = Math.atan2(lab[2], lab[1]);
  const mapped = gamutMapToSrgb(lab[0], C, h);
  const p3 = linearSrgbToP3(lin);
  const wide = inGamut(p3)
    ? `color(display-p3 ${trim(clamp01(toGamma(p3[0])), 4)} ${trim(clamp01(toGamma(p3[1])), 4)} ${trim(clamp01(toGamma(p3[2])), 4)})`
    : null;
  return direct(mapped, true, wide);
}

const srgb = (r: number, g: number, b: number, alpha: number, kind: InputKind): Color => ({
  r: clamp01(r),
  g: clamp01(g),
  b: clamp01(b),
  alpha,
  mapped: false,
  wide: null,
  kind,
});

/**
 * Parse any supported color notation. Returns null when the text is not a color.
 *
 * Accepts: #rgb, #rgba, #rrggbb, #rrggbbaa (the # is optional); rgb()/rgba()
 * with commas or spaces, numbers or percentages; hsl()/hsla(); hwb(); oklch();
 * oklab(); color(display-p3 ...); cmyk()/device-cmyk(); CSS color names;
 * and a bare "r, g, b" triple.
 */
export function parseColor(raw: string): Color | null {
  const t = String(raw ?? '').trim().toLowerCase().replace(/;+$/, '').trim();
  if (!t || t.length > 120) return null;

  if (t === 'transparent') return srgb(0, 0, 0, 0, 'a CSS color name');
  if (Object.prototype.hasOwnProperty.call(NAMED, t)) {
    const n = NAMED[t];
    return srgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1, 'a CSS color name');
  }

  const hex = t.match(/^#?([0-9a-f]+)$/);
  if (hex && [3, 4, 6, 8].includes(hex[1].length)) {
    let h = hex[1];
    if (h.length <= 4) h = h.split('').map((c) => c + c).join('');
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return srgb(parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255, a, 'HEX');
  }

  const fn = t.match(/^([a-z-]+)\(\s*([^()]*?)\s*\)$/);
  let name = fn ? fn[1] : '';
  let body = fn ? fn[2] : t;

  let space = '';
  if (name === 'color') {
    const m = body.match(/^([a-z0-9-]+)\s+(.*)$/);
    if (!m) return null;
    space = m[1];
    body = m[2];
  }

  const parts = body.replace(/\//g, ' ').split(/[\s,]+/).filter(Boolean);
  if (!fn) {
    // a bare "255, 87, 51" or "255 87 51 0.5" is read as RGB
    if (parts.length < 3 || parts.length > 4 || !parts.every((p) => /^(\d+\.?\d*|\.\d+)%?$/.test(p))) return null;
    name = 'rgb';
  }

  const isCmyk = name === 'cmyk' || name === 'device-cmyk';
  const want = isCmyk ? 4 : 3;
  if (parts.length < want || parts.length > want + 1) return null;
  const alpha = alphaOf(parts[want]);
  if (Number.isNaN(alpha)) return null;

  switch (name) {
    case 'rgb':
    case 'rgba': {
      const c = parts.slice(0, 3).map((p) => num(p, 255) / 255);
      if (c.some(Number.isNaN)) return null;
      return srgb(c[0], c[1], c[2], alpha, 'RGB');
    }
    case 'hsl':
    case 'hsla': {
      const h = hue(parts[0]);
      const s = num(parts[1], 100) / 100;
      const l = num(parts[2], 100) / 100;
      if ([h, s, l].some(Number.isNaN)) return null;
      const [r, g, b] = hslToRgb(h, s, l);
      return srgb(r, g, b, alpha, 'HSL');
    }
    case 'hwb': {
      const h = hue(parts[0]);
      let w = clamp01(num(parts[1], 100) / 100);
      let k = clamp01(num(parts[2], 100) / 100);
      if ([h, w, k].some(Number.isNaN)) return null;
      if (w + k >= 1) {
        const grey = w / (w + k);
        return srgb(grey, grey, grey, alpha, 'HWB');
      }
      const [r, g, b] = hslToRgb(h, 1, 0.5).map((v) => v * (1 - w - k) + w);
      return srgb(r, g, b, alpha, 'HWB');
    }
    case 'oklch': {
      const L = clamp01(num(parts[0], 1));
      const C = Math.max(0, num(parts[1], 0.4));
      const h = hue(parts[2]);
      if ([L, C, h].some(Number.isNaN)) return null;
      const rad = (h * Math.PI) / 180;
      const lab: Vec3 = [L, C * Math.cos(rad), C * Math.sin(rad)];
      return fromLinear(oklabToLinear(lab), alpha, 'OKLCH', lab);
    }
    case 'oklab': {
      const L = clamp01(num(parts[0], 1));
      const a = num(parts[1], 0.4);
      const b = num(parts[2], 0.4);
      if ([L, a, b].some(Number.isNaN)) return null;
      return fromLinear(oklabToLinear([L, a, b]), alpha, 'OKLab', [L, a, b]);
    }
    case 'color': {
      if (space !== 'display-p3' && space !== 'srgb') return null;
      const c = parts.slice(0, 3).map((p) => clamp01(num(p, 1)));
      if (c.some(Number.isNaN)) return null;
      if (space === 'srgb') return srgb(c[0], c[1], c[2], alpha, 'RGB');
      const lin = linearP3ToSrgb([toLinear(c[0]), toLinear(c[1]), toLinear(c[2])]);
      return fromLinear(lin, alpha, 'Display P3');
    }
    case 'cmyk':
    case 'device-cmyk': {
      // bare numbers above 1 are read as percentages: cmyk(0, 66, 80, 0)
      const raw4 = parts.slice(0, 4).map((p) => num(p, 1));
      if (raw4.some(Number.isNaN)) return null;
      const bare = parts.slice(0, 4).every((p) => !p.endsWith('%')) && raw4.some((v) => v > 1);
      const [c, m, y, k] = raw4.map((v) => clamp01(bare ? v / 100 : v));
      return srgb((1 - c) * (1 - k), (1 - m) * (1 - k), (1 - y) * (1 - k), alpha, 'CMYK');
    }
    default:
      return null;
  }
}

/* ---------- formatting ---------- */

/** Fixed decimals with trailing zeros removed. */
export function trim(v: number, decimals: number): string {
  let s = v.toFixed(decimals);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s === '-0' ? '0' : s;
}

const hex2 = (v: number) => v.toString(16).padStart(2, '0');

function grade(ratio: number): string {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA for large text only';
  return 'Fails AA';
}

/** WCAG 2 relative luminance of an 8-bit sRGB color. */
function luminance(r: number, g: number, b: number): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** Every output notation for a parsed color. */
export function formatColor(color: Color): Formats {
  const R = Math.round(color.r * 255);
  const G = Math.round(color.g * 255);
  const B = Math.round(color.b * 255);
  const r = R / 255;
  const g = G / 255;
  const b = B / 255;
  const al = color.alpha;
  const opaque = al >= 1;
  const aSlash = opaque ? '' : ` / ${trim(al, 2)}`;
  const aComma = opaque ? '' : `, ${trim(al, 2)}`;

  const solidHex = `#${hex2(R)}${hex2(G)}${hex2(B)}`;
  const hex = (solidHex + (opaque ? '' : hex2(Math.round(al * 255)))).toUpperCase();

  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  let h = 0;
  if (d > 0) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const light = (mx + mn) / 2;
  const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * light - 1));

  const lin: Vec3 = [toLinear(r), toLinear(g), toLinear(b)];
  const lab = linearToOklab(lin);
  let chroma = Math.hypot(lab[1], lab[2]);
  let okH = (Math.atan2(lab[2], lab[1]) * 180) / Math.PI;
  if (okH < 0) okH += 360;
  if (chroma < 0.0002) {
    chroma = 0;
    okH = 0;
  }
  const labA = chroma === 0 ? 0 : lab[1];
  const labB = chroma === 0 ? 0 : lab[2];
  const p3 = linearSrgbToP3(lin).map((v) => clamp01(toGamma(v)));

  const k = 1 - mx;
  const cy = k === 1 ? 0 : (1 - r - k) / (1 - k);
  const mg = k === 1 ? 0 : (1 - g - k) / (1 - k);
  const ye = k === 1 ? 0 : (1 - b - k) / (1 - k);

  const lum = luminance(r, g, b);
  const onWhite = 1.05 / (lum + 0.05);
  const onBlack = (lum + 0.05) / 0.05;

  // The swatch is painted over the page background (#FBFBFA), so pick the ink for the blended color.
  const blend = (c: number) => c * al + (251 / 255) * (1 - al);
  const shownLum = luminance(blend(r), blend(g), blend(b));
  const ink = (shownLum + 0.05) / 0.05 >= 1.05 / (shownLum + 0.05) ? '#0B0C0E' : '#FFFFFF';

  return {
    hex,
    rgb: `${opaque ? 'rgb' : 'rgba'}(${R}, ${G}, ${B}${aComma})`,
    hsl: `${opaque ? 'hsl' : 'hsla'}(${trim(h, 1)}, ${trim(sat * 100, 1)}%, ${trim(light * 100, 1)}%${aComma})`,
    hwb: `hwb(${trim(h, 1)} ${trim(mn * 100, 1)}% ${trim((1 - mx) * 100, 1)}%${aSlash})`,
    oklch: `oklch(${trim(lab[0] * 100, 2)}% ${trim(chroma, 5)} ${trim(okH, 2)}${aSlash})`,
    oklab: `oklab(${trim(lab[0] * 100, 2)}% ${trim(labA, 5)} ${trim(labB, 5)}${aSlash})`,
    p3: `color(display-p3 ${trim(p3[0], 4)} ${trim(p3[1], 4)} ${trim(p3[2], 4)}${aSlash})`,
    cmyk: `cmyk(${trim(cy * 100, 0)}%, ${trim(mg * 100, 0)}%, ${trim(ye * 100, 0)}%, ${trim(k * 100, 0)}%)`,
    solidHex,
    css: `rgb(${R} ${G} ${B} / ${trim(al, 3)})`,
    ink,
    onWhite: trim(Math.floor(onWhite * 100) / 100, 2),
    onBlack: trim(Math.floor(onBlack * 100) / 100, 2),
    whiteGrade: grade(onWhite),
    blackGrade: grade(onBlack),
    okL: lab[0],
    okC: chroma,
    okH,
  };
}

export const SHADE_STEPS: ReadonlyArray<readonly [string, number]> = [
  ['50', 0.97],
  ['100', 0.93],
  ['200', 0.87],
  ['300', 0.79],
  ['400', 0.7],
  ['500', 0.61],
  ['600', 0.52],
  ['700', 0.44],
  ['800', 0.36],
  ['900', 0.28],
  ['950', 0.2],
];

export interface Shade {
  step: string;
  hex: string;
  ink: '#0B0C0E' | '#FFFFFF';
}

/** Eleven shades with the same hue and chroma, stepped in OKLCH lightness and gamut-mapped. */
export function shadeScale(f: Pick<Formats, 'okC' | 'okH'>): Shade[] {
  const rad = (f.okH * Math.PI) / 180;
  return SHADE_STEPS.map(([step, L]) => {
    const lin = gamutMapToSrgb(L, f.okC, rad);
    const [R, G, B] = lin.map((v) => Math.round(clamp01(toGamma(v)) * 255));
    return { step, hex: `#${hex2(R)}${hex2(G)}${hex2(B)}`.toUpperCase(), ink: L > 0.6 ? '#0B0C0E' : '#FFFFFF' };
  });
}

/** Convenience: parse and format in one step. Returns null for text that is not a color. */
export function convert(input: string): (Formats & { color: Color }) | null {
  const color = parseColor(input);
  return color ? { ...formatColor(color), color } : null;
}
