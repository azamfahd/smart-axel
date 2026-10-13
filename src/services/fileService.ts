/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { WorkbookData, WorksheetData, CellMatrix } from '../types/index.ts';
import { coordsToRef, refToCoords } from '../core/formula/cellUtils.ts';

export class FileService {
  /**
   * Imports an XLSX or CSV file from user input
   */
  static async importFile(file: File): Promise<WorkbookData> {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, {
      type: 'array',
      cellFormula: true,
      cellStyles: true,
      cellDates: true,
    });

    const sheets: WorksheetData[] = [];

    wb.SheetNames.forEach((sheetName, index) => {
      const sheet = wb.Sheets[sheetName];
      const cells: CellMatrix = {};
      const ref = sheet['!ref'] || 'A1:Z50';
      const range = XLSX.utils.decode_range(ref);

      const rowCount = Math.max(range.e.r + 1, 40);
      const colCount = Math.max(range.e.c + 1, 15);
      const colWidths: Record<number, number> = {};

      if (sheet['!cols']) {
        sheet['!cols'].forEach((c, idx) => {
          if (c && c.wpx) colWidths[idx] = c.wpx;
          else if (c && c.wch) colWidths[idx] = c.wch * 9;
        });
      }

      // Populate cells
      for (let r = 0; r <= range.e.r; r++) {
        for (let c = 0; c <= range.e.c; c++) {
          const cellCoord = XLSX.utils.encode_cell({ r, c });
          const rawCell = sheet[cellCoord];

          if (rawCell) {
            let formula: string | undefined = undefined;
            if (rawCell.f) {
              formula = rawCell.f.startsWith('=') ? rawCell.f : `=${rawCell.f}`;
            }

            let val: any = rawCell.v;
            if (rawCell.t === 'd' && rawCell.v instanceof Date) {
              val = rawCell.v.toISOString().split('T')[0];
            }

            cells[`${r},${c}`] = {
              rawValue: val ?? null,
              formula,
              style: {
                format: rawCell.t === 'n' ? 'number' : rawCell.t === 'd' ? 'date' : 'general',
              },
            };
          }
        }
      }

      sheets.push({
        id: `sheet-${index}-${Date.now()}`,
        name: sheetName,
        cells,
        rowCount,
        colCount,
        colWidths,
        rowHeights: {},
        mergedCells: [],
        freezeRows: 1,
      });
    });

    return {
      id: `wb-${Date.now()}`,
      name: file.name,
      sheets: sheets.length > 0 ? sheets : [
        {
          id: 'sheet-empty',
          name: 'Sheet1',
          cells: {},
          rowCount: 50,
          colCount: 20,
          colWidths: {},
          rowHeights: {},
          mergedCells: [],
        },
      ],
      activeSheetId: sheets[0]?.id || 'sheet-empty',
    };
  }

  /**
   * Exports the entire workbook to a native XLSX file
   */
  static exportWorkbookToXLSX(workbook: WorkbookData, filename?: string): void {
    const wb = XLSX.utils.book_new();

    workbook.sheets.forEach(sheet => {
      const wsData: any[][] = [];

      // Find max populated bounds
      const keys = Object.keys(sheet.cells).map(k => {
        const [r, c] = k.split(',').map(n => parseInt(n, 10));
        return { r, c };
      });

      const maxR = keys.length > 0 ? Math.max(...keys.map(k => k.r)) : 0;
      const maxC = keys.length > 0 ? Math.max(...keys.map(k => k.c)) : 0;

      for (let r = 0; r <= maxR; r++) {
        const rowArr: any[] = [];
        for (let c = 0; c <= maxC; c++) {
          const cell = sheet.cells[`${r},${c}`];
          if (cell) {
            if (cell.formula) {
              const formulaClean = cell.formula.startsWith('=') ? cell.formula.substring(1) : cell.formula;
              rowArr.push({ f: formulaClean, v: cell.rawValue });
            } else {
              rowArr.push(cell.rawValue);
            }
          } else {
            rowArr.push(null);
          }
        }
        wsData.push(rowArr);
      }

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths
      const cols: XLSX.ColInfo[] = [];
      for (let c = 0; c <= maxC; c++) {
        const w = sheet.colWidths[c];
        cols.push({ wpx: w ? w : 110 });
      }
      ws['!cols'] = cols;

      XLSX.utils.book_append_sheet(wb, ws, sheet.name.substring(0, 31)); // Excel 31-char limit
    });

    const outName = filename || workbook.name || 'DataAudit_Workbook.xlsx';
    XLSX.writeFile(wb, outName.endsWith('.xlsx') ? outName : `${outName}.xlsx`);
  }

  /**
   * Exports an individual worksheet to CSV with protection against formula injection
   */
  static exportSheetToCSV(sheet: WorksheetData, filename?: string): void {
    const keys = Object.keys(sheet.cells).map(k => {
      const [r, c] = k.split(',').map(n => parseInt(n, 10));
      return { r, c };
    });

    const maxR = keys.length > 0 ? Math.max(...keys.map(k => k.r)) : 0;
    const maxC = keys.length > 0 ? Math.max(...keys.map(k => k.c)) : 0;

    const rows: string[] = [];

    for (let r = 0; r <= maxR; r++) {
      const rowVals: string[] = [];
      for (let c = 0; c <= maxC; c++) {
        const cell = sheet.cells[`${r},${c}`];
        let valStr = cell && cell.rawValue !== null && cell.rawValue !== undefined ? String(cell.rawValue) : '';

        // Anti-CSV Formula Injection: escape dangerous leading chars (=, +, -, @)
        if (/^[=+\-@\t\r]/.test(valStr)) {
          valStr = `'${valStr}`;
        }

        // Quote if contains comma, quote, or newline
        if (/[",\n\r]/.test(valStr)) {
          valStr = `"${valStr.replace(/"/g, '""')}"`;
        }

        rowVals.push(valStr);
      }
      rows.push(rowVals.join(','));
    }

    const csvContent = rows.join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // UTF-8 BOM
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (filename || `${sheet.name}.csv`).replace(/[^\w\.\-\u0600-\u06FF]/g, '_');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
