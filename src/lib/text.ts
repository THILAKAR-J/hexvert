const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Site copy uses `backticks` for code. This turns them into <code> after escaping everything else. */
export function inline(text: string): string {
  return escapeHtml(text).replace(/`([^`]+)`/g, '<code>$1</code>');
}

/** The same copy as plain text, for structured data. */
export function plain(text: string): string {
  return text.replace(/`/g, '');
}
