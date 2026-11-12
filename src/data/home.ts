export const HOME_FAQ = [
  {
    q: 'Is the conversion exact?',
    a: 'Between HEX, RGB, HSL and HWB, yes: they describe the same set of colors, so only rounding differs, and every value converts back to the HEX you started with. OKLCH and Display P3 can describe colors outside that set; when one has to be mapped, the page says so. CMYK is always an estimate.',
  },
  {
    q: 'Does it handle transparency?',
    a: 'Yes. Type a 4 or 8-digit HEX code, or add an alpha value to an RGB, HSL or OKLCH color, and every result carries the same transparency.',
  },
  {
    q: 'Which format should I use in CSS?',
    a: 'HEX is fine for a fixed color. Use OKLCH when you build a scale of shades or adjust lightness, because its steps look even to the eye. Tailwind v4 defines its palette in OKLCH for the same reason.',
  },
  {
    q: 'Is my color sent anywhere?',
    a: 'No. The conversion runs in your browser and nothing is uploaded. The home page remembers your last color in your own browser so it is there next time.',
  },
  {
    q: 'What can I paste?',
    a: 'HEX with or without `#`, `rgb()`, `rgba()`, `hsl()`, `hwb()`, `oklch()`, `oklab()`, `color(display-p3 …)`, `cmyk()`, the 148 CSS color names, or just three numbers such as `255, 87, 51`.',
  },
  {
    q: 'Can I share a color?',
    a: 'Yes. The address bar updates as you type, so copying the link (or pressing the button above) shares the exact color.',
  },
];
