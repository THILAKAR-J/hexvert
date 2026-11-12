import { describe, expect, it } from 'vitest';
import { converter, formatHex, parse, toGamut, colorsNamed } from 'culori';
import { convert, formatColor, parseColor, shadeScale } from './color';

/** Small seeded generator so every build tests the same colors. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SAMPLE = 5000;
const rand = mulberry32(20261111);
const randomHexes = Array.from({ length: SAMPLE }, () => {
  const n = Math.floor(rand() * 0x1000000);
  return '#' + n.toString(16).padStart(6, '0');
});
// corners and greys are where conversions usually break
const edgeHexes = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff', '#808080', '#010101', '#fefefe', '#7f7f7f'];
const hexes = [...edgeHexes, ...randomHexes];

const numbers = (s: string) => (s.match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? []).map(Number);
const must = (input: string) => {
  const result = convert(input);
  if (!result) throw new Error(`could not parse ${input}`);
  return result;
};

describe('agreement with the Culori reference', () => {
  const toOklch = converter('oklch');
  const toOklab = converter('oklab');
  const toP3 = converter('p3');
  const toHsl = converter('hsl');
  const toHwb = converter('hwb');

  it(`matches OKLCH and OKLab for ${hexes.length} colors`, () => {
    for (const hex of hexes) {
      const ours = must(hex);
      const lch = toOklch(hex)!;
      const lab = toOklab(hex)!;
      expect(Math.abs(ours.okL - lch.l), hex).toBeLessThan(1e-6);
      expect(Math.abs(ours.okC - lch.c), hex).toBeLessThan(1e-3);
      if (lch.c > 0.02) {
        let dh = Math.abs(ours.okH - (lch.h ?? 0));
        dh = Math.min(dh, 360 - dh);
        expect(dh, hex).toBeLessThan(0.01);
      }
      const [, a, b] = numbers(ours.oklab);
      expect(Math.abs(a - lab.a), hex).toBeLessThan(1e-3);
      expect(Math.abs(b - lab.b), hex).toBeLessThan(1e-3);
    }
  });

  it(`matches Display P3 for ${hexes.length} colors`, () => {
    for (const hex of hexes) {
      // "color(display-p3 r g b)": the 3 in "p3" is the first number, so skip it
      const [, r, g, b] = numbers(must(hex).p3);
      const ref = toP3(hex)!;
      expect(Math.abs(r - ref.r), hex).toBeLessThan(1e-4);
      expect(Math.abs(g - ref.g), hex).toBeLessThan(1e-4);
      expect(Math.abs(b - ref.b), hex).toBeLessThan(1e-4);
    }
  });

  it(`matches HSL and HWB for ${hexes.length} colors`, () => {
    for (const hex of hexes) {
      const ours = must(hex);
      const hsl = toHsl(hex)!;
      const [h, s, l] = numbers(ours.hsl);
      expect(Math.abs(s - hsl.s * 100), hex).toBeLessThan(0.051);
      expect(Math.abs(l - hsl.l * 100), hex).toBeLessThan(0.051);
      if (hsl.s > 0.02 && hsl.h !== undefined) {
        let dh = Math.abs(h - hsl.h);
        dh = Math.min(dh, 360 - dh);
        expect(dh, hex).toBeLessThan(0.051);
      }
      const hwb = toHwb(hex)!;
      const [, w, k] = numbers(ours.hwb);
      expect(Math.abs(w - hwb.w * 100), hex).toBeLessThan(0.051);
      expect(Math.abs(k - hwb.b * 100), hex).toBeLessThan(0.051);
    }
  });

  it('knows all 148 CSS named colors', () => {
    const names = Object.keys(colorsNamed);
    expect(names.length).toBe(148);
    for (const name of names) {
      expect(must(name).solidHex, name).toBe(formatHex(parse(name)));
    }
  });
});

describe('round trips', () => {
  for (const key of ['rgb', 'hsl', 'hwb', 'oklch', 'oklab', 'p3'] as const) {
    it(`${key} output parses back to the starting HEX for ${hexes.length} colors`, () => {
      for (const hex of hexes) {
        const out = must(hex)[key];
        expect(must(out).solidHex, `${hex} via ${out}`).toBe(hex);
      }
    });
  }

  it('keeps alpha through every notation', () => {
    const start = must('#3b82f680');
    expect(start.hex).toBe('#3B82F680');
    for (const key of ['rgb', 'hsl', 'hwb', 'oklch', 'oklab', 'p3'] as const) {
      expect(must(start[key]).hex, key).toBe('#3B82F680');
    }
  });
});

describe('gamut mapping', () => {
  const map = toGamut('rgb', 'oklch');

  it('agrees with Culori on colors outside sRGB', () => {
    // Both implement the CSS Color 4 chroma-reduction search, which stops within a tolerance,
    // so a channel can differ by a step or two near zero. Most results must be identical.
    const r = mulberry32(7);
    const total = 2000;
    let checked = 0;
    let identical = 0;
    let worst = 0;
    while (checked < total) {
      const text = `oklch(${(0.15 + r() * 0.8).toFixed(4)} ${(0.05 + r() * 0.35).toFixed(4)} ${(r() * 360).toFixed(2)})`;
      const ours = must(text);
      if (!ours.color.mapped) continue;
      checked++;
      const a = numbers(ours.rgb);
      const b = numbers(must(formatHex(map(text))).rgb);
      const diff = Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
      if (diff === 0) identical++;
      worst = Math.max(worst, diff);
    }
    expect(worst).toBeLessThanOrEqual(2);
    expect(identical / total).toBeGreaterThan(0.95);
  });

  it('flags mapped colors and leaves in-gamut colors alone', () => {
    expect(must('oklch(70% 0.25 150)').color.mapped).toBe(true);
    expect(must('oklch(70% 0.1 150)').color.mapped).toBe(false);
    expect(must('#3b82f6').color.mapped).toBe(false);
  });

  it('maps Tailwind v4 blue-500 to the HEX Tailwind documents', () => {
    expect(must('oklch(62.3% 0.214 259.815)').hex).toBe('#2B7FFF');
  });

  it('reports the Display P3 value when the color fits inside P3', () => {
    const c = must('color(display-p3 0 1 0)');
    expect(c.color.mapped).toBe(true);
    expect(c.color.wide).toBe('color(display-p3 0 1 0)');
    expect(must('oklch(70% 0.4 150)').color.wide).toBeNull();
  });

  it('handles lightness at and beyond the ends', () => {
    expect(must('oklch(100% 0.3 20)').hex).toBe('#FFFFFF');
    expect(must('oklch(0% 0.3 20)').hex).toBe('#000000');
  });
});

describe('parsing', () => {
  const cases: Array<[string, string]> = [
    ['#3B82F6', '#3B82F6'],
    ['3b82f6', '#3B82F6'],
    ['#F80', '#FF8800'],
    ['#f808', '#FF880088'],
    ['#3B82F680', '#3B82F680'],
    ['rgb(59, 130, 246)', '#3B82F6'],
    ['rgb(59 130 246)', '#3B82F6'],
    ['RGB(59,130,246)', '#3B82F6'],
    ['rgba(59, 130, 246, 0.5)', '#3B82F680'],
    ['rgb(59 130 246 / 50%)', '#3B82F680'],
    ['rgb(100%, 50%, 0%)', '#FF8000'],
    ['59, 130, 246', '#3B82F6'],
    ['59 130 246', '#3B82F6'],
    ['hsl(0, 100%, 50%)', '#FF0000'],
    ['hsl(120deg 100% 50%)', '#00FF00'],
    ['hsl(0.5turn 100% 50%)', '#00FFFF'],
    ['hsl(240 100 50)', '#0000FF'],
    ['hsla(0, 100%, 50%, 0.5)', '#FF000080'],
    ['hsl(370, 100%, 50%)', must('hsl(10, 100%, 50%)').hex],
    ['hwb(0 0% 0%)', '#FF0000'],
    ['hwb(0 50% 50%)', '#808080'],
    ['hwb(120 0% 50%)', '#008000'],
    ['oklch(0.628 0.2577 29.23)', '#FF0000'],
    ['oklch(62.8% 0.2577 29.23deg)', '#FF0000'],
    ['oklab(100% 0 0)', '#FFFFFF'],
    ['color(display-p3 1 1 1)', '#FFFFFF'],
    ['color(srgb 1 0 0)', '#FF0000'],
    ['cmyk(0%, 100%, 100%, 0%)', '#FF0000'],
    ['cmyk(0, 66, 80, 0)', '#FF5733'],
    ['device-cmyk(0 1 1 0)', '#FF0000'],
    ['rebeccapurple', '#663399'],
    ['RebeccaPurple', '#663399'],
    ['transparent', '#00000000'],
    ['  #fff;  ', '#FFFFFF'],
  ];
  for (const [input, expected] of cases) {
    it(`reads ${input}`, () => expect(must(input).hex).toBe(expected));
  }

  const rejects = ['', 'banana', '#12', '#12345', '#gggggg', 'rgb(1, 2)', 'rgb(a, b, c)', 'hsl(10, 20)', 'oklch(1 2)', 'color(rec2020 1 0 0)', 'rgb(var(--x))', '12', '1, 2', 'rgb(1 2 3 4 5)', 'x'.repeat(200)];
  for (const input of rejects) {
    it(`rejects ${JSON.stringify(input.slice(0, 24))}`, () => expect(parseColor(input)).toBeNull());
  }

  it('reports the notation that was typed', () => {
    expect(must('#fff').color.kind).toBe('HEX');
    expect(must('1, 2, 3').color.kind).toBe('RGB');
    expect(must('hsl(1 2% 3%)').color.kind).toBe('HSL');
    expect(must('oklch(50% 0.1 10)').color.kind).toBe('OKLCH');
    expect(must('red').color.kind).toBe('a CSS color name');
  });
});

describe('formatting', () => {
  it('formats a known color in every notation', () => {
    const f = must('#3B82F6');
    expect(f.rgb).toBe('rgb(59, 130, 246)');
    expect(f.hsl).toBe('hsl(217.2, 91.2%, 59.8%)');
    expect(f.cmyk).toBe('cmyk(76%, 47%, 0%, 4%)');
    expect(f.oklch.startsWith('oklch(62.3')).toBe(true);
  });

  it('never prints NaN or a stray hue for greys', () => {
    for (const hex of ['#000000', '#ffffff', '#808080', '#123123'.replace('123123', '777777')]) {
      const f = must(hex);
      for (const key of ['rgb', 'hsl', 'hwb', 'oklch', 'oklab', 'p3', 'cmyk'] as const) expect(f[key], key).not.toMatch(/NaN|Infinity/);
      expect(f.oklch.endsWith(' 0 0)')).toBe(true);
      expect(f.hsl.startsWith('hsl(0, 0%')).toBe(true);
    }
  });

  it('computes WCAG contrast and never rounds a failing ratio up', () => {
    expect(must('#ffffff').onBlack).toBe('21');
    expect(must('#000000').onWhite).toBe('21');
    expect(must('#777777').onWhite).toBe('4.47');
    expect(must('#777777').whiteGrade).toBe('AA for large text only');
    expect(must('#767676').whiteGrade).toBe('AA');
  });

  it('picks readable ink, including for transparent colors', () => {
    expect(must('#000000').ink).toBe('#FFFFFF');
    expect(must('#ffffff').ink).toBe('#0B0C0E');
    expect(must('#00000010').ink).toBe('#0B0C0E');
  });

  it('builds an eleven-step shade scale that gets darker', () => {
    const shades = shadeScale(formatColor(parseColor('#3B82F6')!));
    expect(shades).toHaveLength(11);
    const lightness = shades.map((s) => must(s.hex).okL);
    for (let i = 1; i < lightness.length; i++) expect(lightness[i]).toBeLessThan(lightness[i - 1]);
  });
});
