/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Normalizes Arabic text by unifying Alef variants, Yaa/Alef Maqsura, Taa Marboota, and removing Tashkeel
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';

  let normalized = String(text);

  // 1. Remove Tashkeel (diacritics: Fatha, Damma, Kasra, Sukun, Tanween, Shadda)
  // Range: \u064B to \u0652, plus \u0670
  normalized = normalized.replace(/[\u064B-\u0652\u0670]/g, '');

  // 2. Remove Tatweel / Kashida (\u0640)
  normalized = normalized.replace(/\u0640/g, '');

  // 3. Unify Alef variants: أ, إ, آ, ٱ -> ا
  normalized = normalized.replace(/[أإآٱ]/g, 'ا');

  // 4. Unify Yaa variants: ى, ئ -> ي
  normalized = normalized.replace(/[ىئ]/g, 'ي');

  // 5. Unify Taa Marboota: ة -> ه
  normalized = normalized.replace(/ة/g, 'ه');

  // 6. Unify Waw with Hamza: ؤ -> و
  normalized = normalized.replace(/ؤ/g, 'و');

  // 7. Trim and collapse multiple whitespaces
  normalized = normalized.trim().replace(/\s+/g, ' ');

  return normalized.toLowerCase();
}

/**
 * Computes Levenshtein Distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const s1 = a || '';
  const s2 = b || '';
  const m = s1.length;
  const n = s2.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Calculates string similarity ratio between 0 and 1
 */
export function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(a, b);
  return 1 - dist / maxLen;
}

/**
 * Detects invisible, zero-width, non-breaking, or control characters in a string
 */
export function detectInvisibleCharacters(str: string): {
  hasZeroWidth: boolean;
  hasNonBreakingSpace: boolean;
  hasControlChars: boolean;
  hasTrailingWhitespace: boolean;
  hasMultipleSpaces: boolean;
  cleanedText: string;
} {
  if (typeof str !== 'string') {
    return {
      hasZeroWidth: false,
      hasNonBreakingSpace: false,
      hasControlChars: false,
      hasTrailingWhitespace: false,
      hasMultipleSpaces: false,
      cleanedText: str,
    };
  }

  const hasZeroWidth = /[\u200B-\u200D\uFEFF]/.test(str);
  const hasNonBreakingSpace = /\u00A0/.test(str);
  const hasControlChars = /[\u0000-\u001F\u007F-\u009F]/.test(str);
  const hasTrailingWhitespace = /^\s+|\s+$/.test(str);
  const hasMultipleSpaces = / {2,}/.test(str);

  // Clean version: remove invisible characters, replace NBSP with standard space, trim
  let cleaned = str
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();

  return {
    hasZeroWidth,
    hasNonBreakingSpace,
    hasControlChars,
    hasTrailingWhitespace,
    hasMultipleSpaces,
    cleanedText: cleaned,
  };
}
