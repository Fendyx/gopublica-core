/**
 * Transliterate a single Cyrillic character to its Latin equivalent.
 * Covers Ukrainian, Russian, and Belarusian ranges.
 */
function transliterateChar(ch: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g',
    д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z',
    и: 'y', і: 'i', ї: 'i', й: 'i',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
    п: 'p', р: 'r', с: 's', т: 't', у: 'u',
    ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
    щ: 'shch', ь: '', ю: 'iu', я: 'ia',
    // Russian / Belarusian extras
    ё: 'yo', э: 'e', ъ: '',
  };
  return map[ch] ?? ch;
}

/**
 * Convert a title string into a valid URL-friendly slug.
 *
 * - Transliterates Cyrillic (Ukrainian / Russian) to Latin
 * - Lowercases
 * - Replaces spaces & underscores with hyphens
 * - Strips everything except `[a-z0-9-]`
 * - Collapses multiple hyphens
 * - Trims leading/trailing hyphens
 */
export function slugify(input: string): string {
  if (!input) return '';

  // Transliterate character-by-character
  const transliterated = [...input]
    .map((ch) => {
      const lower = ch.toLowerCase();
      // Latin chars pass through
      if (/[a-z0-9]/.test(lower)) return lower;
      // Spaces / underscores → placeholder
      if (/[\s_]/.test(ch)) return '-';
      // Cyrillic → Latin
      if (/[\u0400-\u04FF]/.test(lower)) return transliterateChar(lower);
      // Everything else is dropped
      return '';
    })
    .join('');

  return transliterated
    .replace(/-+/g, '-')     // collapse multiple hyphens
    .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
    .toLowerCase();
}
