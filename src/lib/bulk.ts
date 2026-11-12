import { convert, type FormatKey } from './color';

export type BulkTarget = Extract<FormatKey, 'oklch' | 'hex' | 'rgb' | 'hsl'>;

export interface BulkChange {
  line: number;
  before: string;
  after: string;
  mapped: boolean;
}

export interface BulkResult {
  output: string;
  changes: BulkChange[];
  /** Colors found but left alone because they already use the target notation */
  unchanged: number;
}

// Functional notations, then HEX. HEX must not be part of a longer word or URL fragment.
const FUNCTIONS = /\b(?:rgba?|hsla?|hwb|oklch|oklab|color)\(\s*[^()]*?\)/gi;
const HEX = /(?<![\w#&-])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![\w-])/gi;

const notationOf = (token: string): string => {
  const t = token.trim().toLowerCase();
  if (t.startsWith('#')) return 'hex';
  const m = t.match(/^([a-z]+)/);
  return m ? m[1].replace(/a$/, '') : '';
};

/** True when a "#abc" is really a CSS selector, e.g. "#add {" or "#bad, .x" or "#face:hover". */
function looksLikeSelector(text: string, end: number): boolean {
  const rest = text.slice(end, end + 80);
  return /^\s*(?:\{|[.:>+~\[]|,\s*[#.\w\[*:][^;{}]*\{)/.test(rest);
}

/** Convert every color in a block of text, leaving everything else exactly as it was. */
export function convertText(text: string, target: BulkTarget): BulkResult {
  const found: Array<{ start: number; end: number; token: string }> = [];
  for (const re of [FUNCTIONS, HEX]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const start = m.index;
      const end = start + m[0].length;
      if (found.some((f) => start < f.end && end > f.start)) continue;
      if (m[0].startsWith('#') && looksLikeSelector(text, end)) continue;
      found.push({ start, end, token: m[0] });
    }
  }
  found.sort((a, b) => a.start - b.start);

  const changes: BulkChange[] = [];
  let unchanged = 0;
  let out = '';
  let last = 0;
  for (const f of found) {
    const result = convert(f.token);
    if (!result) continue;
    if (notationOf(f.token) === (target === 'hex' ? 'hex' : target)) {
      unchanged++;
      continue;
    }
    const after = result[target];
    out += text.slice(last, f.start) + after;
    last = f.end;
    const line = text.slice(0, f.start).split('\n').length;
    changes.push({ line, before: f.token, after, mapped: result.color.mapped });
  }
  out += text.slice(last);
  return { output: out, changes, unchanged };
}
