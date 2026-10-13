/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FormulaParser } from './parser.ts';
import { FormulaEvaluator } from './evaluator.ts';
import { DependencyGraph } from './dag.ts';
import { parseRange, coordsToRef } from './cellUtils.ts';
import { WorkbookData } from '../../types/index.ts';

export class FormulaEngine {
  private parser = new FormulaParser();
  private evaluator = new FormulaEvaluator();
  private dag = new DependencyGraph();

  /**
   * Evaluates a formula string in the context of the workbook and active sheet
   */
  evaluateFormula(formula: string, sheetId: string, workbook: WorkbookData): any {
    if (!formula.startsWith('=')) return formula;

    try {
      const ast = this.parser.parse(formula);

      const getCellValue = (ref: string): any => {
        const parsed = parseRange(ref);
        if (!parsed) return '#REF!';
        const targetSheetId = parsed.sheet ? (workbook.sheets.find(s => s.name === parsed.sheet || s.id === parsed.sheet)?.id || sheetId) : sheetId;
        const sheet = workbook.sheets.find(s => s.id === targetSheetId);
        if (!sheet) return '#REF!';

        const cell = sheet.cells[`${parsed.startRow},${parsed.startCol}`];
        if (!cell) return null;

        // If it's a formula, return rawValue (already evaluated) or evaluate
        return cell.rawValue;
      };

      const getRangeValues = (rangeStr: string): any[][] => {
        const parsed = parseRange(rangeStr);
        if (!parsed) return [['#REF!']];
        const targetSheetId = parsed.sheet ? (workbook.sheets.find(s => s.name === parsed.sheet || s.id === parsed.sheet)?.id || sheetId) : sheetId;
        const sheet = workbook.sheets.find(s => s.id === targetSheetId);
        if (!sheet) return [['#REF!']];

        const matrix: any[][] = [];
        for (let r = parsed.startRow; r <= parsed.endRow; r++) {
          const rowVals: any[] = [];
          for (let c = parsed.startCol; c <= parsed.endCol; c++) {
            const cell = sheet.cells[`${r},${c}`];
            rowVals.push(cell ? cell.rawValue : null);
          }
          matrix.push(rowVals);
        }
        return matrix;
      };

      return this.evaluator.evaluate(ast, getCellValue, getRangeValues);
    } catch (err: any) {
      if (typeof err?.message === 'string' && err.message.startsWith('#')) {
        return err.message;
      }
      return '#VALUE!';
    }
  }

  /**
   * Registers a cell formula in the dependency graph, returning true if cyclic
   */
  registerFormula(sheetId: string, row: number, col: number, formula: string): boolean {
    if (!formula.startsWith('=')) {
      this.dag.unregisterCell(sheetId, row, col);
      return false;
    }
    try {
      const ast = this.parser.parse(formula);
      return this.dag.registerCell(sheetId, row, col, ast);
    } catch {
      return false;
    }
  }

  /**
   * Recalculates all dependent cells when a cell is updated
   */
  recalculateDependents(
    sheetId: string,
    row: number,
    col: number,
    workbook: WorkbookData
  ): { sheetId: string; row: number; col: number; newValue: any }[] {
    const affected = this.dag.getAffectedCells(sheetId, row, col);
    const updates: { sheetId: string; row: number; col: number; newValue: any }[] = [];

    for (const key of affected) {
      const [sId, coord] = key.split('!');
      const [rStr, cStr] = coord.split(',');
      const r = parseInt(rStr, 10);
      const c = parseInt(cStr, 10);

      const targetSheet = workbook.sheets.find(s => s.id === sId);
      if (!targetSheet) continue;

      const cell = targetSheet.cells[`${r},${c}`];
      if (cell && cell.formula) {
        const newVal = this.evaluateFormula(cell.formula, sId, workbook);
        cell.rawValue = newVal;
        updates.push({ sheetId: sId, row: r, col: c, newValue: newVal });
      }
    }

    return updates;
  }
}

export * from './cellUtils.ts';
export * from './tokenizer.ts';
export * from './parser.ts';
export * from './evaluator.ts';
export * from './dag.ts';
