import { describe, expect, it } from 'vitest';
import { convert } from '../lib/color';
import { PAIRS } from './pairs';

// The pages quote specific conversions. These tests stop the copy drifting from what the tool outputs.
describe('conversion page copy', () => {
  for (const pair of PAIRS) {
    it(`${pair.slug}: the headline example is what the tool returns`, () => {
      const result = convert(pair.example);
      expect(result, pair.example).not.toBeNull();
      expect(result![pair.to]).toBe(pair.expected);
      expect(pair.worked.result).toContain(pair.expected);
    });

    it(`${pair.slug}: every conversion quoted in the copy is correct`, () => {
      for (const [input, key, expected] of pair.checks) {
        const result = convert(input);
        expect(result, input).not.toBeNull();
        expect(result![key], `${input} as ${key}`).toBe(expected);
      }
    });

    it(`${pair.slug}: title and description fit search results`, () => {
      expect(pair.title.length).toBeLessThanOrEqual(60);
      expect(pair.description.length).toBeLessThanOrEqual(155);
      expect(pair.description.length).toBeGreaterThanOrEqual(110);
    });
  }

  it('has no duplicate titles, descriptions or slugs', () => {
    for (const field of ['slug', 'title', 'description', 'lead'] as const) {
      const values = PAIRS.map((p) => p[field]);
      expect(new Set(values).size, field).toBe(values.length);
    }
  });
});
