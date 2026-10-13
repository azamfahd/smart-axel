/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NumberFormatType } from '../../types/index.ts';

/**
 * Converts a 0-indexed column number to an Excel column letter (0 -> "A", 25 -> "Z", 26 -> "AA")
 */
export function colIndexToLetter(col: number): string {
  let letter = '';
  let temp = col;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

/**
 * Converts an Excel column letter to a 0-indexed column number ("A" -> 0, "Z" -> 25, "AA" -> 26)
 */
export function letterToColIndex(letter: string): number {
  const clean = letter.toUpperCase();
  let col = 0;
  for (let i = 0; i < clean.length; i++) {
    col = col * 26 + (clean.charCodeAt(i) - 64);
  }
  return col - 1;
}

/**
 * Converts 0-indexed row and column coordinates to an Excel reference ("A1")
 */
export function coordsToRef(row: number, col: number): string {
  return `${colIndexToLetter(col)}${row + 1}`;
}

/**
 * Parses an Excel reference into coordinates, with support for absolute flags ($A$1) and sheet names
 */
export function refToCoords(ref: string): {
  row: number;
  col: number;
  colAbsolute: boolean;
  rowAbsolute: boolean;
  sheet?: string;
} | null {
  const clean = ref.trim();
  let sheetName: string | undefined;
  let cellPart = clean;

  if (clean.includes('!')) {
    const parts = clean.split('!');
    sheetName = parts[0].replace(/^'|'$/g, '');
    cellPart = parts[1];
  }

  const match = cellPart.match(/^(\$?)([A-Za-z]+)(\$?)([0-9]+)$/);
  if (!match) return null;

  const colAbsolute = match[1] === '$';
  const colLetter = match[2];
  const rowAbsolute = match[3] === '$';
  const rowNum = parseInt(match[4], 10);

  return {
    row: rowNum - 1,
    col: letterToColIndex(colLetter),
    colAbsolute,
    rowAbsolute,
    sheet: sheetName,
  };
}

/**
 * Parses an Excel range string ("A1:C10" or "Sheet1!B2:D5") into bounding coordinates
 */
export function parseRange(rangeStr: string): {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  sheet?: string;
} | null {
  const clean = rangeStr.trim();
  let sheet: string | undefined;
  let innerRange = clean;

  if (clean.includes('!')) {
    const parts = clean.split('!');
    sheet = parts[0].replace(/^'|'$/g, '');
    innerRange = parts[1];
  }

  const parts = innerRange.split(':');
  if (parts.length === 1) {
    const c = refToCoords(parts[0]);
    if (!c) return null;
    return {
      startRow: c.row,
      startCol: c.col,
      endRow: c.row,
      endCol: c.col,
      sheet: c.sheet || sheet,
    };
  }

  const c1 = refToCoords(parts[0]);
  const c2 = refToCoords(parts[1]);
  if (!c1 || !c2) return null;

  return {
    startRow: Math.min(c1.row, c2.row),
    startCol: Math.min(c1.col, c2.col),
    endRow: Math.max(c1.row, c2.row),
    endCol: Math.max(c1.col, c2.col),
    sheet: c1.sheet || c2.sheet || sheet,
  };
}

/**
 * Formats a raw cell value according to its display format
 */
export function formatCellValue(
  value: any,
  format: NumberFormatType = 'general',
  decimals: number = 2
): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'string' && value.startsWith('#')) return value; // Error code like #DIV/0!

  const num = typeof value === 'number' ? value : parseFloat(value);
  const isNumeric = !isNaN(num) && typeof value !== 'boolean';

  if (!isNumeric) {
    return String(value);
  }

  switch (format) {
    case 'number':
      return num.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

    case 'currency':
      return num.toLocaleString(undefined, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

    case 'percent':
      return (num * 100).toFixed(decimals) + '%';

    case 'date':
      if (typeof value === 'number') {
        // Excel serial date number (days since 1899-12-30)
        const date = new Date(Math.round((value - 25569) * 86400 * 1000));
        return isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
      }
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString();

    case 'text':
      return String(value);

    case 'general':
    default:
      if (Number.isInteger(num)) return num.toString();
      // Round long floats neatly
      return Math.abs(num) < 1e12 ? parseFloat(num.toFixed(8)).toString() : num.toString();
  }
}

/**
 * Adjusts relative cell references in a formula when copied or auto-filled
 */
export function adjustFormulaReferences(
  formula: string,
  rowOffset: number,
  colOffset: number
): string {
  if (!formula.startsWith('=')) return formula;

  // Regex to match cell references: Sheet1!$A$1, $A$1, A1, etc.
  const regex = /('?[^'!]+'?!|)(\$?)([A-Za-z]+)(\$?)([0-9]+)/g;

  return formula.replace(
    regex,
    (match, sheetPrefix, colDollar, colLetter, rowDollar, rowNumStr) => {
      // Do not adjust if function name (like SUM, AVERAGE) followed by open paren
      const colAbsolute = colDollar === '$';
      const rowAbsolute = rowDollar === '$';

      let colIdx = letterToColIndex(colLetter);
      let rowIdx = parseInt(rowNumStr, 10) - 1;

      if (!colAbsolute) {
        colIdx = Math.max(0, colIdx + colOffset);
      }
      if (!rowAbsolute) {
        rowIdx = Math.max(0, rowIdx + rowOffset);
      }

      const newColLetter = colIndexToLetter(colIdx);
      const newRowNum = rowIdx + 1;

      const finalCol = (colAbsolute ? '$' : '') + newColLetter;
      const finalRow = (rowAbsolute ? '$' : '') + newRowNum;

      return `${sheetPrefix}${finalCol}${finalRow}`;
    }
  );
}
