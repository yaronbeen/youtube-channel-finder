const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

/**
 * Extract unique email addresses from a text string.
 */
export function extractEmails(text: string | null | undefined): string[] {
  if (!text) return [];
  const matches = text.match(EMAIL_REGEX);
  if (!matches) return [];
  return [...new Set(matches.map((e) => e.toLowerCase()))];
}
