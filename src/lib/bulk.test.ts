import { describe, expect, it } from 'vitest';
import { convertText } from './bulk';

describe('bulk converter', () => {
  it('converts colors and leaves the rest of the file alone', () => {
    const input = '.card {\n  background: #1E293B;\n  border: 1px solid rgb(245, 158, 11);\n  color: #F8FAFC;\n}\n';
    const r = convertText(input, 'oklch');
    expect(r.changes).toHaveLength(3);
    expect(r.output).toBe(
      '.card {\n  background: oklch(27.95% 0.03685 260.03);\n  border: 1px solid oklch(76.86% 0.16466 70.08);\n  color: oklch(98.42% 0.00341 247.86);\n}\n',
    );
    expect(r.changes[1].line).toBe(3);
  });

  it('does not touch ID selectors that happen to look like HEX', () => {
    const input = '#add { color: #add; }\n#bad, .x { color: red; }\n#face:hover { color: #fff }';
    const r = convertText(input, 'rgb');
    expect(r.output).toBe('#add { color: rgb(170, 221, 221); }\n#bad, .x { color: red; }\n#face:hover { color: rgb(255, 255, 255) }');
  });

  it('ignores HEX-like text inside words, URLs and entities', () => {
    const input = 'url(/img/#abc123-x.png) a#bcd &#123; issue#123';
    expect(convertText(input, 'rgb').changes).toHaveLength(0);
  });

  it('keeps transparency and flags gamut-mapped colors', () => {
    const r = convertText('a: #3B82F680; b: oklch(70% 0.25 150);', 'hex');
    expect(r.output).toBe('a: #3B82F680; b: #00C248;');
    expect(r.unchanged).toBe(1);
    expect(r.changes[0].mapped).toBe(true);
  });

  it('works on JSON token files', () => {
    const r = convertText('{"brand": {"500": "#3b82f6"}}', 'hsl');
    expect(r.output).toBe('{"brand": {"500": "hsl(217.2, 91.2%, 59.8%)"}}');
  });
});
