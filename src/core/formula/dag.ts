/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ASTNode } from './parser.ts';
import { parseRange } from './cellUtils.ts';

export class DependencyGraph {
  // key: cellKey (e.g. "Sheet1!0,0"), value: Set of cells that depend on it
  private dependents: Map<string, Set<string>> = new Map();
  // key: cellKey, value: Set of cells that it depends on
  private precedents: Map<string, Set<string>> = new Map();

  /**
   * Registers dependencies for a formula cell
   */
  registerCell(sheetId: string, row: number, col: number, ast: ASTNode): boolean {
    const targetKey = `${sheetId}!${row},${col}`;

    // Clear old precedents
    const oldPrecedents = this.precedents.get(targetKey);
    if (oldPrecedents) {
      for (const prec of oldPrecedents) {
        this.dependents.get(prec)?.delete(targetKey);
      }
    }

    const newPrecedents = new Set<string>();
    this.extractReferences(ast, sheetId, newPrecedents);
    this.precedents.set(targetKey, newPrecedents);

    for (const prec of newPrecedents) {
      if (!this.dependents.has(prec)) {
        this.dependents.set(prec, new Set());
      }
      this.dependents.get(prec)!.add(targetKey);
    }

    // Check for circular reference
    return this.hasCycle(targetKey);
  }

  unregisterCell(sheetId: string, row: number, col: number) {
    const targetKey = `${sheetId}!${row},${col}`;
    const precs = this.precedents.get(targetKey);
    if (precs) {
      for (const prec of precs) {
        this.dependents.get(prec)?.delete(targetKey);
      }
    }
    this.precedents.delete(targetKey);
  }

  /**
   * Returns topologically ordered list of all cells that must be recalculated when target cell changes
   */
  getAffectedCells(sheetId: string, row: number, col: number): string[] {
    const startKey = `${sheetId}!${row},${col}`;
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (key: string) => {
      if (visited.has(key)) return;
      visited.add(key);
      const deps = this.dependents.get(key);
      if (deps) {
        for (const dep of deps) {
          visit(dep);
        }
      }
      if (key !== startKey) {
        order.push(key);
      }
    };

    visit(startKey);
    return order.reverse();
  }

  private hasCycle(startKey: string): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const check = (key: string): boolean => {
      visited.add(key);
      recStack.add(key);

      const precs = this.precedents.get(key);
      if (precs) {
        for (const p of precs) {
          if (!visited.has(p)) {
            if (check(p)) return true;
          } else if (recStack.has(p)) {
            return true;
          }
        }
      }

      recStack.delete(key);
      return false;
    };

    return check(startKey);
  }

  private extractReferences(node: ASTNode, currentSheetId: string, refs: Set<string>) {
    switch (node.type) {
      case 'CELL_REF': {
        const parsed = parseRange(node.ref);
        if (parsed) {
          const sheet = parsed.sheet || currentSheetId;
          refs.add(`${sheet}!${parsed.startRow},${parsed.startCol}`);
        }
        break;
      }
      case 'RANGE': {
        const parsed = parseRange(node.range);
        if (parsed) {
          const sheet = parsed.sheet || currentSheetId;
          for (let r = parsed.startRow; r <= parsed.endRow; r++) {
            for (let c = parsed.startCol; c <= parsed.endCol; c++) {
              refs.add(`${sheet}!${r},${c}`);
            }
          }
        }
        break;
      }
      case 'FUNCTION': {
        for (const arg of node.args) {
          this.extractReferences(arg, currentSheetId, refs);
        }
        break;
      }
      case 'BINARY_OP': {
        this.extractReferences(node.left, currentSheetId, refs);
        this.extractReferences(node.right, currentSheetId, refs);
        break;
      }
      case 'UNARY_OP': {
        this.extractReferences(node.operand, currentSheetId, refs);
        break;
      }
    }
  }
}
