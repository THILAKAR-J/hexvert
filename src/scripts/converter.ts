/**
 * Browser side of the converter. The page arrives fully rendered for its
 * example color; this script keeps every [data-out] element in step with what
 * the visitor types. User text only ever reaches the page through textContent.
 */
import { convert, shadeScale, type FormatKey, type Formats, type Color } from '../lib/color';
import { cssSnippet, tailwindSnippet } from '../lib/snippets';
import { swatchStyle } from '../lib/ui';

type Result = Formats & { color: Color };

const STORE_KEY = 'hexvert:last';
const FORMAT_KEYS: FormatKey[] = ['hex', 'rgb', 'hsl', 'hwb', 'oklch', 'oklab', 'p3', 'cmyk'];

function init(root: HTMLElement): void {
  const input = document.querySelector<HTMLInputElement>('#color-input');
  const picker = document.querySelector<HTMLInputElement>('#color-picker');
  if (!input || !picker) return;

  const persist = root.dataset.persist === 'true';
  const fallback = root.dataset.default || '#3B82F6';
  let current = convert(fallback) as Result;
  let values: Record<string, string> = {};
  let saveTimer = 0;

  const all = <T extends HTMLElement>(selector: string) => Array.from(document.querySelectorAll<T>(selector));
  const setText = (selector: string, text: string) => all(selector).forEach((el) => (el.textContent = text));
  const showStatus = (name: 'ok' | 'mapped' | 'bad' | 'empty') =>
    all('[data-status]').forEach((el) => (el.hidden = el.dataset.status !== name));

  function paint(result: Result): void {
    current = result;
    values = {
      ...Object.fromEntries(FORMAT_KEYS.map((k) => [k, result[k]])),
      css: cssSnippet(result),
      tw: tailwindSnippet(result),
    };
    for (const key of FORMAT_KEYS) setText(`[data-out="${key}"]`, result[key]);
    setText('[data-out="css"]', values.css);
    setText('[data-out="tw"]', values.tw);
    setText('[data-out="onWhite"]', `${result.onWhite}:1`);
    setText('[data-out="onBlack"]', `${result.onBlack}:1`);
    setText('[data-out="whiteGrade"]', result.whiteGrade);
    setText('[data-out="blackGrade"]', result.blackGrade);

    for (const decl of swatchStyle(result).split(';')) {
      const i = decl.indexOf(':');
      document.body.style.setProperty(decl.slice(0, i), decl.slice(i + 1));
    }
    picker!.value = result.solidHex;

    shadeScale(result).forEach((shade, i) => {
      const button = document.querySelector<HTMLElement>(`[data-shade="${i}"]`);
      if (!button) return;
      button.style.background = shade.hex;
      button.style.color = shade.ink;
      button.dataset.value = shade.hex;
      button.setAttribute('aria-label', `Use shade ${shade.step}, ${shade.hex}`);
      const label = button.querySelector('[data-shade-hex]');
      if (label) label.textContent = shade.hex;
    });

    if (result.color.mapped) {
      const hasWide = !!result.color.wide;
      setText('[data-wide]', result.color.wide ?? '');
      all('[data-wide-yes]').forEach((el) => (el.hidden = !hasWide));
      all('[data-wide-no]').forEach((el) => (el.hidden = hasWide));
      showStatus('mapped');
    } else {
      setText('[data-detected]', result.color.kind);
      showStatus('ok');
    }
  }

  let pending: string | null = null;
  function remember(text: string): void {
    pending = text;
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(flush, 300);
  }

  function flush(): void {
    window.clearTimeout(saveTimer);
    if (pending === null) return;
    const text = pending;
    pending = null;
    const t = text.trim();
    const hash = /^#[0-9a-f]{3,8}$/i.test(t) ? t.slice(1) : encodeURIComponent(t);
    try {
      history.replaceState(null, '', `${location.pathname}${location.search}#${hash}`);
    } catch {
      /* some embedded contexts forbid it; the tool still works */
    }
    if (persist) {
      try {
        localStorage.setItem(STORE_KEY, t);
      } catch {
        /* storage can be disabled; nothing depends on it */
      }
    }
  }

  /** Apply text typed or chosen by the visitor. */
  function apply(text: string, opts: { writeInput?: boolean; save?: boolean } = {}): boolean {
    if (opts.writeInput) input!.value = text;
    input!.classList.toggle('is-long', input!.value.length > 12);
    if (!text.trim()) {
      input!.removeAttribute('aria-invalid');
      showStatus('empty');
      return false;
    }
    const result = convert(text);
    if (!result) {
      input!.setAttribute('aria-invalid', 'true');
      showStatus('bad');
      return false;
    }
    input!.removeAttribute('aria-invalid');
    paint(result);
    if (opts.save !== false) remember(text);
    return true;
  }

  function fromHash(): string | null {
    if (location.hash.length < 2) return null;
    let raw = location.hash.slice(1);
    try {
      raw = decodeURIComponent(raw);
    } catch {
      return null;
    }
    if (/^[0-9a-f]+$/i.test(raw) && [3, 4, 6, 8].includes(raw.length)) return `#${raw.toUpperCase()}`;
    // only functional notations are accepted from a link, so section anchors such as #faq are left alone
    return /^[a-z-]+\(.*\)$/i.test(raw) && convert(raw) ? raw : null;
  }

  function announce(message: string): void {
    setText('[data-announce]', '');
    window.setTimeout(() => setText('[data-announce]', message), 30);
  }

  async function copy(button: HTMLElement): Promise<void> {
    const key = button.dataset.copy || '';
    const text = key === 'link' ? location.href : values[key];
    if (!text) return;
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      // older browsers and non-secure contexts
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      area.remove();
    }
    const original = button.dataset.label || button.textContent || 'Copy';
    button.dataset.label = original;
    button.textContent = ok ? 'Copied' : 'Press Ctrl+C';
    announce(ok ? 'Copied to clipboard' : 'Could not copy automatically');
    window.setTimeout(() => (button.textContent = original), 1600);
  }

  input.addEventListener('input', () => apply(input.value));
  picker.addEventListener('input', () => apply(picker.value.toUpperCase(), { writeInput: true }));

  document.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-copy], [data-preset], [data-shade]');
    if (!target) return;
    if (target.dataset.copy) {
      void copy(target);
    } else if (target.dataset.preset) {
      apply(target.dataset.preset, { writeInput: true });
    } else if (target.dataset.shade !== undefined) {
      const hex = target.dataset.value || target.querySelector('[data-shade-hex]')?.textContent || '';
      if (hex) apply(hex, { writeInput: true });
      document.querySelector('#tool')?.scrollIntoView({ block: 'start' });
    }
  });

  // save immediately when the visitor leaves, so a quick tab close keeps the last color
  window.addEventListener('pagehide', flush);

  window.addEventListener('hashchange', () => {
    const linked = fromHash();
    if (linked) apply(linked, { writeInput: true, save: false });
  });

  // Starting color: a shared link wins, then (on the home page) the last color used, then the page example.
  paint(current);
  const linked = fromHash();
  let stored: string | null = null;
  if (!linked && persist) {
    try {
      stored = localStorage.getItem(STORE_KEY);
    } catch {
      stored = null;
    }
  }
  const startWith = linked ?? (stored && convert(stored) ? stored : null);
  if (startWith) apply(startWith, { writeInput: true, save: false });
}

const root = document.querySelector<HTMLElement>('[data-converter]');
if (root) init(root);
