import type { FormatKey } from '../lib/color';

/**
 * Conversion pages. Copy uses `backticks` for code.
 *
 * Every `example` / `expected` pair, and every claim listed in `checks`, is
 * verified against the engine in pairs.test.ts, so the pages cannot drift from
 * what the tool really outputs.
 */
export interface Pair {
  slug: string;
  from: FormatKey;
  to: FormatKey;
  fromName: string;
  toName: string;
  title: string;
  description: string;
  lead: string;
  inputLabel: string;
  example: string;
  expected: string;
  stepsHeading: string;
  steps: string[];
  worked: { intro: string; lines: string[]; result: string };
  mistakes: Array<{ title: string; body: string }>;
  faqs: Array<{ q: string; a: string }>;
  /** [input, key, expected output] triples quoted in the copy above */
  checks: Array<[string, FormatKey, string]>;
  updated: string;
}

export const PAIRS: Pair[] = [
  {
    slug: 'hex-to-rgb',
    from: 'hex',
    to: 'rgb',
    fromName: 'HEX',
    toName: 'RGB',
    title: 'HEX to RGB Converter (with Alpha) - Hexvert',
    description:
      'Convert HEX to RGB instantly. Handles 3, 4, 6 and 8-digit codes with transparency, and shows HSL, OKLCH and CMYK alongside. Free, runs in your browser.',
    lead: 'Paste a HEX code and get its RGB value. Short codes, codes with transparency and codes without the # all work.',
    inputLabel: 'Type or paste a HEX color',
    example: '#3B82F6',
    expected: 'rgb(59, 130, 246)',
    stepsHeading: 'How to convert HEX to RGB by hand',
    steps: [
      'Remove the `#` and split the six digits into three pairs: red, green and blue.',
      'Turn each pair into a decimal number: multiply the first digit by 16 and add the second. The letters A to F stand for 10 to 15.',
      'Write the three numbers as `rgb(red, green, blue)`.',
    ],
    worked: {
      intro: 'For `#3B82F6`:',
      lines: ['`3B` is 3 × 16 + 11 = 59', '`82` is 8 × 16 + 2 = 130', '`F6` is 15 × 16 + 6 = 246'],
      result: 'So `#3B82F6` is `rgb(59, 130, 246)`.',
    },
    mistakes: [
      {
        title: 'Reading a 3-digit code wrongly',
        body: '`#F80` is short for `#FF8800`. Each digit is doubled, not padded with a zero, so it is `rgb(255, 136, 0)`.',
      },
      {
        title: 'Treating the alpha pair as a color',
        body: 'In an 8-digit code the last pair is opacity. `#3B82F680` ends in `80`, which is 128 out of 255, or about 50%. The result is `rgba(59, 130, 246, 0.5)`.',
      },
      {
        title: 'Expecting the color to change',
        body: 'HEX and RGB hold the same three numbers in different bases. Converting never changes the color.',
      },
    ],
    faqs: [
      {
        q: 'What is the RGB value of #FFFFFF?',
        a: '`#FFFFFF` is `rgb(255, 255, 255)`, pure white. `#000000` is `rgb(0, 0, 0)`, pure black.',
      },
      { q: 'Does the case of the letters matter?', a: 'No. `#3b82f6` and `#3B82F6` are the same color.' },
      { q: 'Can I paste a code without the #?', a: 'Yes. `3B82F6` is read the same way as `#3B82F6`.' },
    ],
    checks: [
      ['#F80', 'hex', '#FF8800'],
      ['#F80', 'rgb', 'rgb(255, 136, 0)'],
      ['#3B82F680', 'rgb', 'rgba(59, 130, 246, 0.5)'],
      ['#FFFFFF', 'rgb', 'rgb(255, 255, 255)'],
      ['#000000', 'rgb', 'rgb(0, 0, 0)'],
      ['3B82F6', 'hex', '#3B82F6'],
    ],
    updated: '2026-11-11',
  },
  {
    slug: 'rgb-to-hex',
    from: 'rgb',
    to: 'hex',
    fromName: 'RGB',
    toName: 'HEX',
    title: 'RGB to HEX Converter (RGBA Supported) - Hexvert',
    description:
      'Convert RGB to HEX instantly. Accepts rgb() and rgba(), commas or spaces, numbers or percentages, and returns a 6 or 8-digit HEX code. Free and private.',
    lead: 'Paste an RGB color and get its HEX code. You can type `rgb(255, 87, 51)`, plain `255 87 51`, or percentages.',
    inputLabel: 'Type or paste an RGB color',
    example: 'rgb(255, 87, 51)',
    expected: '#FF5733',
    stepsHeading: 'How to convert RGB to HEX by hand',
    steps: [
      'Take each channel, a whole number from 0 to 255.',
      'Divide it by 16. The quotient is the first HEX digit and the remainder is the second. Write 10 to 15 as A to F.',
      'Join the three pairs after a `#`.',
    ],
    worked: {
      intro: 'For `rgb(255, 87, 51)`:',
      lines: ['255 is 15 × 16 + 15, which is `FF`', '87 is 5 × 16 + 7, which is `57`', '51 is 3 × 16 + 3, which is `33`'],
      result: 'So `rgb(255, 87, 51)` is `#FF5733`.',
    },
    mistakes: [
      {
        title: 'Dropping the leading zero',
        body: 'A channel below 16 still needs two digits. 10 becomes `0A`, not `A`, so `rgb(10, 10, 10)` is `#0A0A0A`.',
      },
      {
        title: 'Forgetting to scale percentages',
        body: '`rgb(100%, 50%, 0%)` must be scaled to 0 to 255 first. 50% is 127.5, which rounds to 128, or `80`. The result is `#FF8000`.',
      },
      {
        title: 'Losing the transparency',
        body: '`rgba(255, 87, 51, 0.5)` needs a fourth pair. 0.5 × 255 rounds to 128, which is `80`, giving `#FF573380`.',
      },
    ],
    faqs: [
      {
        q: 'What is rgb(0, 0, 0) in HEX?',
        a: '`#000000`, black. White, `rgb(255, 255, 255)`, is `#FFFFFF`.',
      },
      {
        q: 'Can every RGB color be written as HEX?',
        a: 'Yes, as long as each channel is a whole number from 0 to 255. Fractions are rounded to the nearest whole number first.',
      },
      {
        q: 'Do I need to type rgb( ) around the numbers?',
        a: 'No. `255, 87, 51` on its own is read as RGB.',
      },
    ],
    checks: [
      ['rgb(10, 10, 10)', 'hex', '#0A0A0A'],
      ['rgb(100%, 50%, 0%)', 'hex', '#FF8000'],
      ['rgba(255, 87, 51, 0.5)', 'hex', '#FF573380'],
      ['rgb(0, 0, 0)', 'hex', '#000000'],
      ['rgb(255, 255, 255)', 'hex', '#FFFFFF'],
      ['255, 87, 51', 'hex', '#FF5733'],
      ['255 87 51', 'hex', '#FF5733'],
    ],
    updated: '2026-11-11',
  },
  {
    slug: 'hex-to-hsl',
    from: 'hex',
    to: 'hsl',
    fromName: 'HEX',
    toName: 'HSL',
    title: 'HEX to HSL Converter with Worked Example - Hexvert',
    description:
      'Convert HEX to HSL instantly and see how hue, saturation and lightness are worked out. Supports transparency. Free, runs in your browser.',
    lead: 'Paste a HEX code and get hue, saturation and lightness. HSL is handy when you want a lighter or darker version of the same color.',
    inputLabel: 'Type or paste a HEX color',
    example: '#3B82F6',
    expected: 'hsl(217.2, 91.2%, 59.8%)',
    stepsHeading: 'How HEX becomes HSL',
    steps: [
      'Convert the HEX code to RGB and divide each channel by 255, so every value is between 0 and 1.',
      'Find the largest and the smallest of the three. Lightness is their average.',
      'Saturation is their difference divided by 1 − |2 × lightness − 1|. If the difference is zero the color is grey and saturation is 0.',
      'Hue depends on which channel is largest. With d as the difference: red gives 60 × (((G − B) ÷ d) mod 6), green gives 60 × ((B − R) ÷ d + 2) and blue gives 60 × ((R − G) ÷ d + 4).',
    ],
    worked: {
      intro: 'For `#3B82F6`, which is `rgb(59, 130, 246)`:',
      lines: [
        'The channels are 0.231, 0.510 and 0.965. The largest is 0.965 and the smallest is 0.231.',
        'Lightness is (0.965 + 0.231) ÷ 2 = 0.598, or 59.8%.',
        'Saturation is 0.733 ÷ (1 − 0.196) = 0.912, or 91.2%.',
        'Blue is largest, so hue is 60 × ((0.231 − 0.510) ÷ 0.733 + 4) = 217.2°.',
      ],
      result: 'So `#3B82F6` is `hsl(217.2, 91.2%, 59.8%)`.',
    },
    mistakes: [
      {
        title: 'Rounding too early',
        body: '`hsl(217, 91%, 60%)` looks tidier, but it converts back to `#3C83F6`, not `#3B82F6`. We keep one decimal so the round trip is exact.',
      },
      {
        title: 'Expecting a hue for grey',
        body: 'Greys have no hue. `#808080` is `hsl(0, 0%, 50.2%)`; the 0 is a placeholder, not red.',
      },
      {
        title: 'Reading lightness as brightness',
        body: 'HSL lightness is arithmetic, not what the eye sees. Pure yellow and pure blue are both 50% light in HSL but look very different. Use OKLCH when perceived lightness matters.',
      },
    ],
    faqs: [
      {
        q: 'Why does my HSL value have decimals?',
        a: 'Whole-number HSL cannot describe every HEX color exactly. One decimal place is enough to convert back to the same HEX code.',
      },
      {
        q: 'Is HSL the same as HSV or HSB?',
        a: 'No. They share hue, but HSV and HSB measure the other two properties differently, so the numbers are not interchangeable.',
      },
    ],
    checks: [
      ['#3B82F6', 'rgb', 'rgb(59, 130, 246)'],
      ['hsl(217, 91%, 60%)', 'hex', '#3C83F6'],
      ['#808080', 'hsl', 'hsl(0, 0%, 50.2%)'],
      ['#FFFF00', 'hsl', 'hsl(60, 100%, 50%)'],
      ['#0000FF', 'hsl', 'hsl(240, 100%, 50%)'],
    ],
    updated: '2026-11-11',
  },
  {
    slug: 'hsl-to-hex',
    from: 'hsl',
    to: 'hex',
    fromName: 'HSL',
    toName: 'HEX',
    title: 'HSL to HEX Converter (HSLA Supported) - Hexvert',
    description:
      'Convert HSL to HEX instantly. Accepts hsl() and hsla(), degrees or turns, with or without percent signs, and returns a 6 or 8-digit HEX code. Free.',
    lead: 'Paste an HSL color and get its HEX code. Commas or spaces both work, and the hue can be in degrees or turns.',
    inputLabel: 'Type or paste an HSL color',
    example: 'hsl(11, 100%, 60%)',
    expected: '#FF5833',
    stepsHeading: 'How HSL becomes HEX',
    steps: [
      'Write saturation and lightness as decimals between 0 and 1.',
      'Work out the chroma: C = (1 − |2 × lightness − 1|) × saturation.',
      'Work out the middle component, X = C × (1 − |(hue ÷ 60) mod 2 − 1|), and the amount added to every channel, m = lightness − C ÷ 2.',
      'Give C, X and 0 to red, green and blue according to the 60° sector the hue falls in. Add m to each, multiply by 255 and write each as two HEX digits.',
    ],
    worked: {
      intro: 'For `hsl(11, 100%, 60%)`:',
      lines: [
        'C = (1 − |1.2 − 1|) × 1 = 0.8',
        'X = 0.8 × (1 − |0.183 − 1|) = 0.147, and m = 0.6 − 0.4 = 0.2',
        'Hue 11° is in the first sector, so red, green and blue are C, X and 0: 0.8, 0.147 and 0',
        'Adding m gives 1, 0.347 and 0.2, which are 255, 88 and 51',
      ],
      result: 'So `hsl(11, 100%, 60%)` is `#FF5833`.',
    },
    mistakes: [
      {
        title: 'Mixing up the units',
        body: 'Hue is an angle; saturation and lightness are percentages. `hsl(11, 1, 0.6)` means 1% and 0.6%, which is almost black, not `hsl(11, 100%, 60%)`.',
      },
      {
        title: 'Forgetting that hue wraps',
        body: 'Hue goes round a circle, so 370° is the same as 10° and −30° is the same as 330°.',
      },
      {
        title: 'Expecting color at zero saturation',
        body: 'With 0% saturation the hue is ignored and the result is a grey set only by lightness.',
      },
    ],
    faqs: [
      {
        q: 'What is hsl(0, 100%, 50%) in HEX?',
        a: '`#FF0000`, pure red. Green is `hsl(120, 100%, 50%)` or `#00FF00`, and blue is `hsl(240, 100%, 50%)` or `#0000FF`.',
      },
      {
        q: 'Can two HSL values give the same HEX code?',
        a: 'Yes. HEX has 256 steps per channel, so nearby HSL values often round to the same code.',
      },
    ],
    checks: [
      ['hsl(11, 100%, 60%)', 'rgb', 'rgb(255, 88, 51)'],
      ['hsl(11, 1, 0.6)', 'hex', '#020202'],
      ['hsl(370, 100%, 50%)', 'hex', '#FF2B00'],
      ['hsl(10, 100%, 50%)', 'hex', '#FF2B00'],
      ['hsl(-30, 100%, 50%)', 'hex', '#FF0080'],
      ['hsl(330, 100%, 50%)', 'hex', '#FF0080'],
      ['hsl(0, 100%, 50%)', 'hex', '#FF0000'],
      ['hsl(120, 100%, 50%)', 'hex', '#00FF00'],
      ['hsl(240, 100%, 50%)', 'hex', '#0000FF'],
      ['hsl(200, 0%, 40%)', 'hex', '#666666'],
    ],
    updated: '2026-11-11',
  },
  {
    slug: 'hex-to-oklch',
    from: 'hex',
    to: 'oklch',
    fromName: 'HEX',
    toName: 'OKLCH',
    title: 'HEX to OKLCH Converter for Tailwind v4 and CSS - Hexvert',
    description:
      'Turn any HEX color into OKLCH for Tailwind v4 or modern CSS. Copy a ready @theme line, check contrast and see the P3 value. Free and private.',
    lead: 'Paste a HEX code and get the OKLCH value, ready for Tailwind v4 or modern CSS.',
    inputLabel: 'Type or paste a HEX color',
    example: '#3B82F6',
    expected: 'oklch(62.31% 0.18801 259.81)',
    stepsHeading: 'How HEX becomes OKLCH',
    steps: [
      'Convert the HEX code to RGB and scale each channel to between 0 and 1.',
      'Undo the sRGB gamma curve so the values measure light linearly.',
      'Apply the two OKLab matrices with a cube root between them. That gives lightness L and two color axes, a and b.',
      'Chroma is √(a² + b²) and hue is the angle of the point (a, b). Lightness, chroma and hue together are OKLCH.',
    ],
    worked: {
      intro: 'For `#3B82F6`:',
      lines: [
        'RGB is 59, 130, 246.',
        'In OKLab that is L 62.31%, a −0.03325 and b −0.18505.',
        'Chroma is √(0.03325² + 0.18505²) = 0.18801, and the hue angle is 259.81°.',
      ],
      result: 'So `#3B82F6` is `oklch(62.31% 0.18801 259.81)`. In a Tailwind v4 theme that is `--color-brand-500: oklch(62.31% 0.18801 259.81);`.',
    },
    mistakes: [
      {
        title: 'Writing lightness with the wrong unit',
        body: 'Lightness is either a percentage or a number from 0 to 1. `62.31%` and `0.6231` mean the same; `0.6231%` is almost black.',
      },
      {
        title: 'Treating chroma like a percentage',
        body: 'Chroma has no fixed top. For colors a HEX code can hold it tops out near 0.32, so 0.19 is already a vivid blue.',
      },
      {
        title: 'Assuming Tailwind names kept their colors',
        body: 'Tailwind v4 retuned its palette. `blue-500` was `#3B82F6` in v3 and is `oklch(62.3% 0.214 259.815)` in v4, whose nearest HEX is `#2B7FFF`. Convert your own HEX values if you need the old colors.',
      },
    ],
    faqs: [
      {
        q: 'Do I still need a HEX fallback?',
        a: 'Current versions of Chrome, Edge, Safari and Firefox all understand `oklch()`. Add a HEX line before it only if you support browsers older than mid-2023.',
      },
      {
        q: 'Why are there so many decimals?',
        a: 'With fewer decimals some colors would not convert back to the same HEX code. This precision is the shortest that passed our round-trip tests.',
      },
    ],
    checks: [
      ['#3B82F6', 'oklab', 'oklab(62.31% -0.03325 -0.18505)'],
      ['oklch(0.6231 0.18801 259.81)', 'hex', '#3B82F6'],
      ['oklch(62.3% 0.214 259.815)', 'hex', '#2B7FFF'],
    ],
    updated: '2026-11-11',
  },
  {
    slug: 'oklch-to-hex',
    from: 'oklch',
    to: 'hex',
    fromName: 'OKLCH',
    toName: 'HEX',
    title: 'OKLCH to HEX Converter with Gamut Check - Hexvert',
    description:
      'Convert OKLCH to HEX the way browsers do. Colors outside sRGB are mapped as CSS Color 4 specifies and clearly flagged. Free, runs in your browser.',
    lead: 'Paste an OKLCH color and get its HEX code. If the color is too vivid for HEX, you get the closest match and a clear warning.',
    inputLabel: 'Type or paste an OKLCH color',
    example: 'oklch(70% 0.1 150)',
    expected: '#6FB07D',
    stepsHeading: 'How OKLCH becomes HEX',
    steps: [
      'Turn chroma and hue into the two OKLab axes: a = chroma × cos(hue) and b = chroma × sin(hue).',
      'Apply the OKLab matrices in reverse, cubing where the forward conversion takes a cube root, to get linear RGB.',
      'Apply the sRGB gamma curve, multiply by 255 and round.',
      'If any channel falls below 0 or above 255, the color is outside sRGB. Reduce the chroma until it fits, keeping lightness and hue.',
    ],
    worked: {
      intro: 'For `oklch(70% 0.1 150)`:',
      lines: [
        'a = 0.1 × cos(150°) = −0.0866 and b = 0.1 × sin(150°) = 0.05',
        'That converts to RGB 111, 176, 125, with every channel inside 0 to 255',
        '111, 176 and 125 are `6F`, `B0` and `7D`',
      ],
      result: 'So `oklch(70% 0.1 150)` is `#6FB07D`.',
    },
    mistakes: [
      {
        title: 'Clipping instead of mapping',
        body: 'Cutting each channel off at 0 and 255 changes the color more than it needs to. `oklch(70% 0.25 150)` maps to `#00C248`, which keeps the lightness and hue you asked for as closely as HEX allows.',
      },
      {
        title: 'Expecting every OKLCH color to have a HEX code',
        body: 'OKLCH can describe colors that only wide-gamut screens show. Tailwind v4 `blue-500`, `oklch(62.3% 0.214 259.815)`, is one of them; `#2B7FFF` is its nearest HEX.',
      },
      {
        title: 'Dropping the alpha',
        body: '`oklch(70% 0.1 150 / 0.5)` needs an 8-digit code: `#6FB07D80`.',
      },
    ],
    faqs: [
      {
        q: 'What does the gamut warning mean?',
        a: 'The color you typed cannot be shown exactly on a standard sRGB screen or written as HEX. We show the nearest color that can, found the way the CSS Color 4 specification describes.',
      },
      {
        q: 'Will the HEX look identical to the OKLCH?',
        a: 'Yes when there is no warning. With a warning, the HEX is slightly less vivid than the original.',
      },
    ],
    checks: [
      ['oklch(70% 0.1 150)', 'rgb', 'rgb(111, 176, 125)'],
      ['oklch(70% 0.25 150)', 'hex', '#00C248'],
      ['oklch(62.3% 0.214 259.815)', 'hex', '#2B7FFF'],
      ['oklch(70% 0.1 150 / 0.5)', 'hex', '#6FB07D80'],
    ],
    updated: '2026-11-11',
  },
  {
    slug: 'rgb-to-hsl',
    from: 'rgb',
    to: 'hsl',
    fromName: 'RGB',
    toName: 'HSL',
    title: 'RGB to HSL Converter with Formula - Hexvert',
    description:
      'Convert RGB to HSL instantly and follow the formula step by step. Accepts rgb() and rgba() in any CSS syntax. Free, runs in your browser.',
    lead: 'Paste an RGB color and get hue, saturation and lightness, with the formula laid out below.',
    inputLabel: 'Type or paste an RGB color',
    example: 'rgb(255, 87, 51)',
    expected: 'hsl(10.6, 100%, 60%)',
    stepsHeading: 'The RGB to HSL formula',
    steps: [
      'Divide red, green and blue by 255.',
      'Call the largest value max and the smallest min. Lightness is (max + min) ÷ 2.',
      'If max equals min the color is grey: saturation and hue are both 0. Otherwise saturation is (max − min) ÷ (1 − |2 × lightness − 1|).',
      'For hue, use whichever channel is largest. Red: 60 × (((G − B) ÷ (max − min)) mod 6). Green: 60 × ((B − R) ÷ (max − min) + 2). Blue: 60 × ((R − G) ÷ (max − min) + 4).',
    ],
    worked: {
      intro: 'For `rgb(255, 87, 51)`:',
      lines: [
        'The channels are 1, 0.341 and 0.2, so max is 1 and min is 0.2.',
        'Lightness is (1 + 0.2) ÷ 2 = 0.6, or 60%.',
        'Saturation is 0.8 ÷ (1 − 0.2) = 1, or 100%.',
        'Red is largest, so hue is 60 × ((0.341 − 0.2) ÷ 0.8) = 10.6°.',
      ],
      result: 'So `rgb(255, 87, 51)` is `hsl(10.6, 100%, 60%)`.',
    },
    mistakes: [
      {
        title: 'Skipping the divide by 255',
        body: 'The formula works on values from 0 to 1. Putting 255, 87 and 51 straight in gives nonsense.',
      },
      {
        title: 'Leaving a negative hue',
        body: 'When red is largest and blue is greater than green, the formula gives a negative angle. Add 360 to bring it back onto the circle: `rgb(255, 0, 128)` is `hsl(329.9, 100%, 50%)`.',
      },
      {
        title: 'Comparing lightness across hues',
        body: 'Two colors with the same HSL lightness can look very different in brightness. That is a limit of HSL, not an error in the conversion.',
      },
    ],
    faqs: [
      {
        q: 'What is rgb(255, 0, 0) in HSL?',
        a: '`hsl(0, 100%, 50%)`. Pure green is `hsl(120, 100%, 50%)` and pure blue is `hsl(240, 100%, 50%)`.',
      },
      {
        q: 'Does converting RGB to HSL lose anything?',
        a: 'Not if you keep the decimals. Rounding HSL to whole numbers can shift a channel by one step when you convert back.',
      },
    ],
    checks: [
      ['rgb(255, 0, 128)', 'hsl', 'hsl(329.9, 100%, 50%)'],
      ['rgb(255, 0, 0)', 'hsl', 'hsl(0, 100%, 50%)'],
      ['rgb(0, 255, 0)', 'hsl', 'hsl(120, 100%, 50%)'],
      ['rgb(0, 0, 255)', 'hsl', 'hsl(240, 100%, 50%)'],
    ],
    updated: '2026-11-11',
  },
  {
    slug: 'rgb-to-cmyk',
    from: 'rgb',
    to: 'cmyk',
    fromName: 'RGB',
    toName: 'CMYK',
    title: 'RGB to CMYK Converter for Print Estimates - Hexvert',
    description:
      'Convert RGB to CMYK with the standard formula and see each step. An honest estimate for print planning; check a proof before you print. Free.',
    lead: 'Paste an RGB color and get a CMYK estimate. Use it to plan; a real print job needs a proof.',
    inputLabel: 'Type or paste an RGB color',
    example: 'rgb(255, 87, 51)',
    expected: 'cmyk(0%, 66%, 80%, 0%)',
    stepsHeading: 'The RGB to CMYK formula',
    steps: [
      'Divide red, green and blue by 255.',
      'Black is 1 minus the largest of the three: K = 1 − max.',
      'Cyan is (1 − R − K) ÷ (1 − K), magenta is (1 − G − K) ÷ (1 − K) and yellow is (1 − B − K) ÷ (1 − K).',
      'Multiply each by 100 to get percentages. If K is 1 the color is black and the other three are 0.',
    ],
    worked: {
      intro: 'For `rgb(255, 87, 51)`:',
      lines: [
        'The channels are 1, 0.341 and 0.2.',
        'K = 1 − 1 = 0.',
        'Cyan is (1 − 1) ÷ 1 = 0, magenta is (1 − 0.341) ÷ 1 = 0.659 and yellow is (1 − 0.2) ÷ 1 = 0.8.',
      ],
      result: 'So `rgb(255, 87, 51)` is about `cmyk(0%, 66%, 80%, 0%)`.',
    },
    mistakes: [
      {
        title: 'Treating the result as press-ready',
        body: 'This formula knows nothing about ink, paper or the press. Print shops convert with a color profile and their numbers will differ. Send RGB, or ask which profile to use.',
      },
      {
        title: 'Expecting screen colors on paper',
        body: 'Bright RGB colors such as pure green or electric blue cannot be printed with four inks. They come out duller, whatever the numbers say.',
      },
      {
        title: 'Using black ink alone for large areas',
        body: '`rgb(0, 0, 0)` converts to `cmyk(0%, 0%, 0%, 100%)`. Printers often add other inks for a deeper black, so ask before filling a large area.',
      },
    ],
    faqs: [
      {
        q: 'Why does another tool give different CMYK numbers?',
        a: 'Tools that apply a print profile, such as design software, account for real inks. Formula-based tools like this one agree with each other but not with profile-based ones.',
      },
      {
        q: 'Can I convert CMYK back to RGB?',
        a: 'Yes, with the reverse formula: red is 255 × (1 − C) × (1 − K), and likewise for green and blue. Type `cmyk(0%, 66%, 80%, 0%)` into the box above and you get `#FF5733` back.',
      },
    ],
    checks: [
      ['rgb(0, 0, 0)', 'cmyk', 'cmyk(0%, 0%, 0%, 100%)'],
      ['cmyk(0%, 66%, 80%, 0%)', 'hex', '#FF5733'],
    ],
    updated: '2026-11-11',
  },
];

export const pairBySlug = (slug: string) => PAIRS.find((p) => p.slug === slug);
export const pairLabel = (p: Pair) => `${p.fromName} to ${p.toName}`;
