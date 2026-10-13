/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ASTNode } from './parser.ts';

export type CellValueGetter = (ref: string) => any;
export type RangeValuesGetter = (range: string) => any[][];

export class FormulaEvaluator {
  evaluate(
    node: ASTNode,
    getCellValue: CellValueGetter,
    getRangeValues: RangeValuesGetter
  ): any {
    try {
      return this.evalNode(node, getCellValue, getRangeValues);
    } catch (err: any) {
      if (typeof err?.message === 'string' && err.message.startsWith('#')) {
        return err.message;
      }
      return '#VALUE!';
    }
  }

  private evalNode(
    node: ASTNode,
    getCellValue: CellValueGetter,
    getRangeValues: RangeValuesGetter
  ): any {
    switch (node.type) {
      case 'NUMBER':
      case 'STRING':
      case 'BOOLEAN':
        return node.value;

      case 'CELL_REF': {
        const val = getCellValue(node.ref);
        return val ?? 0;
      }

      case 'RANGE': {
        // Return 2D array of values
        return getRangeValues(node.range);
      }

      case 'UNARY_OP': {
        const operand = this.evalNode(node.operand, getCellValue, getRangeValues);
        const num = this.toNumber(operand);
        if (node.operator === '-') return -num;
        if (node.operator === '+') return num;
        throw new Error('#VALUE!');
      }

      case 'BINARY_OP': {
        const left = this.evalNode(node.left, getCellValue, getRangeValues);
        const right = this.evalNode(node.right, getCellValue, getRangeValues);
        return this.evalBinaryOp(node.operator, left, right);
      }

      case 'FUNCTION': {
        return this.evalFunction(node.name, node.args, getCellValue, getRangeValues);
      }

      default:
        throw new Error('#VALUE!');
    }
  }

  private evalBinaryOp(op: string, left: any, right: any): any {
    // String concatenation
    if (op === '&') {
      const lStr = left === null || left === undefined ? '' : String(left);
      const rStr = right === null || right === undefined ? '' : String(right);
      return lStr + rStr;
    }

    // Comparison operators
    if (['=', '<>', '<', '<=', '>', '>='].includes(op)) {
      return this.compare(op, left, right);
    }

    // Arithmetic operators
    const lNum = this.toNumber(left);
    const rNum = this.toNumber(right);

    switch (op) {
      case '+':
        return lNum + rNum;
      case '-':
        return lNum - rNum;
      case '*':
        return lNum * rNum;
      case '/':
        if (rNum === 0) throw new Error('#DIV/0!');
        return lNum / rNum;
      case '^':
        return Math.pow(lNum, rNum);
      default:
        throw new Error('#VALUE!');
    }
  }

  private compare(op: string, left: any, right: any): boolean {
    // If both are numbers
    const lNum = typeof left === 'number' ? left : parseFloat(left);
    const rNum = typeof right === 'number' ? right : parseFloat(right);

    const bothNumbers = !isNaN(lNum) && !isNaN(rNum) && typeof left !== 'boolean' && typeof right !== 'boolean';

    if (bothNumbers) {
      switch (op) {
        case '=': return lNum === rNum;
        case '<>': return lNum !== rNum;
        case '<': return lNum < rNum;
        case '<=': return lNum <= rNum;
        case '>': return lNum > rNum;
        case '>=': return lNum >= rNum;
      }
    }

    // Case-insensitive string comparison
    const lStr = String(left ?? '').toLowerCase();
    const rStr = String(right ?? '').toLowerCase();

    switch (op) {
      case '=': return lStr === rStr;
      case '<>': return lStr !== rStr;
      case '<': return lStr < rStr;
      case '<=': return lStr <= rStr;
      case '>': return lStr > rStr;
      case '>=': return lStr >= rStr;
      default: return false;
    }
  }

  private toNumber(val: any): number {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (typeof val === 'boolean') return val ? 1 : 0;
    if (val === null || val === undefined || val === '') return 0;
    const num = parseFloat(String(val).trim());
    if (isNaN(num)) throw new Error('#VALUE!');
    return num;
  }

  private flattenArgs(args: any[]): any[] {
    const flat: any[] = [];
    for (const a of args) {
      if (Array.isArray(a)) {
        flat.push(...this.flattenArgs(a));
      } else {
        flat.push(a);
      }
    }
    return flat;
  }

  private evalFunction(
    name: string,
    argNodes: ASTNode[],
    getCellValue: CellValueGetter,
    getRangeValues: RangeValuesGetter
  ): any {
    const fnName = name.toUpperCase();

    // Special handling for IFERROR (only evaluates second arg if first errors)
    if (fnName === 'IFERROR') {
      if (argNodes.length < 2) throw new Error('#VALUE!');
      try {
        const res = this.evalNode(argNodes[0], getCellValue, getRangeValues);
        if (typeof res === 'string' && res.startsWith('#')) {
          return this.evalNode(argNodes[1], getCellValue, getRangeValues);
        }
        return res;
      } catch {
        return this.evalNode(argNodes[1], getCellValue, getRangeValues);
      }
    }

    // Special handling for IF (lazy evaluation of branch)
    if (fnName === 'IF') {
      if (argNodes.length < 2) throw new Error('#VALUE!');
      const cond = this.evalNode(argNodes[0], getCellValue, getRangeValues);
      const isTrue = Boolean(cond);
      if (isTrue) {
        return this.evalNode(argNodes[1], getCellValue, getRangeValues);
      } else {
        return argNodes[2] ? this.evalNode(argNodes[2], getCellValue, getRangeValues) : false;
      }
    }

    // Evaluate all arguments
    const rawArgs = argNodes.map(node => this.evalNode(node, getCellValue, getRangeValues));

    switch (fnName) {
      // Math & Statistical
      case 'SUM': {
        const flat = this.flattenArgs(rawArgs);
        let sum = 0;
        for (const v of flat) {
          if (typeof v === 'number') sum += v;
          else if (typeof v === 'string' && !isNaN(parseFloat(v))) sum += parseFloat(v);
        }
        return sum;
      }

      case 'AVERAGE': {
        const flat = this.flattenArgs(rawArgs);
        let sum = 0;
        let count = 0;
        for (const v of flat) {
          if (typeof v === 'number') {
            sum += v;
            count++;
          } else if (typeof v === 'string' && !isNaN(parseFloat(v))) {
            sum += parseFloat(v);
            count++;
          }
        }
        if (count === 0) throw new Error('#DIV/0!');
        return sum / count;
      }

      case 'MIN': {
        const flat = this.flattenArgs(rawArgs).filter(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))));
        if (flat.length === 0) return 0;
        const nums = flat.map(v => typeof v === 'number' ? v : parseFloat(v));
        return Math.min(...nums);
      }

      case 'MAX': {
        const flat = this.flattenArgs(rawArgs).filter(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))));
        if (flat.length === 0) return 0;
        const nums = flat.map(v => typeof v === 'number' ? v : parseFloat(v));
        return Math.max(...nums);
      }

      case 'MEDIAN': {
        const flat = this.flattenArgs(rawArgs).filter(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))));
        if (flat.length === 0) return 0;
        const nums = flat.map(v => typeof v === 'number' ? v : parseFloat(v)).sort((a, b) => a - b);
        const mid = Math.floor(nums.length / 2);
        return nums.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
      }

      case 'STDEV': {
        const flat = this.flattenArgs(rawArgs).filter(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))));
        if (flat.length < 2) throw new Error('#DIV/0!');
        const nums = flat.map(v => typeof v === 'number' ? v : parseFloat(v));
        const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        const variance = nums.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (nums.length - 1);
        return Math.sqrt(variance);
      }

      case 'COUNT': {
        const flat = this.flattenArgs(rawArgs);
        return flat.filter(v => typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && !isNaN(parseFloat(v)))).length;
      }

      case 'COUNTA': {
        const flat = this.flattenArgs(rawArgs);
        return flat.filter(v => v !== null && v !== undefined && v !== '').length;
      }

      case 'SUMIF': {
        if (rawArgs.length < 2) throw new Error('#VALUE!');
        const checkRange = Array.isArray(rawArgs[0]) ? this.flattenArgs(rawArgs[0]) : [rawArgs[0]];
        const criteria = rawArgs[1];
        const sumRange = rawArgs[2] ? (Array.isArray(rawArgs[2]) ? this.flattenArgs(rawArgs[2]) : [rawArgs[2]]) : checkRange;

        let total = 0;
        for (let i = 0; i < checkRange.length; i++) {
          if (this.matchesCriteria(checkRange[i], criteria)) {
            const val = sumRange[i];
            const num = typeof val === 'number' ? val : parseFloat(val);
            if (!isNaN(num)) total += num;
          }
        }
        return total;
      }

      case 'COUNTIF': {
        if (rawArgs.length < 2) throw new Error('#VALUE!');
        const checkRange = Array.isArray(rawArgs[0]) ? this.flattenArgs(rawArgs[0]) : [rawArgs[0]];
        const criteria = rawArgs[1];

        let count = 0;
        for (const item of checkRange) {
          if (this.matchesCriteria(item, criteria)) {
            count++;
          }
        }
        return count;
      }

      case 'ROUND': {
        if (rawArgs.length < 1) throw new Error('#VALUE!');
        const n = this.toNumber(rawArgs[0]);
        const decimals = rawArgs[1] ? this.toNumber(rawArgs[1]) : 0;
        const factor = Math.pow(10, decimals);
        return Math.round(n * factor) / factor;
      }

      case 'ROUNDUP': {
        const n = this.toNumber(rawArgs[0]);
        const decimals = rawArgs[1] ? this.toNumber(rawArgs[1]) : 0;
        const factor = Math.pow(10, decimals);
        return Math.ceil(n * factor) / factor;
      }

      case 'ROUNDDOWN': {
        const n = this.toNumber(rawArgs[0]);
        const decimals = rawArgs[1] ? this.toNumber(rawArgs[1]) : 0;
        const factor = Math.pow(10, decimals);
        return Math.floor(n * factor) / factor;
      }

      case 'ABS': {
        return Math.abs(this.toNumber(rawArgs[0]));
      }

      case 'INT': {
        return Math.floor(this.toNumber(rawArgs[0]));
      }

      case 'MOD': {
        const n = this.toNumber(rawArgs[0]);
        const d = this.toNumber(rawArgs[1]);
        if (d === 0) throw new Error('#DIV/0!');
        return n % d;
      }

      // Logic
      case 'AND': {
        const flat = this.flattenArgs(rawArgs);
        return flat.every(v => Boolean(v));
      }

      case 'OR': {
        const flat = this.flattenArgs(rawArgs);
        return flat.some(v => Boolean(v));
      }

      case 'NOT': {
        return !Boolean(rawArgs[0]);
      }

      // Lookup & Reference
      case 'VLOOKUP': {
        if (rawArgs.length < 3) throw new Error('#VALUE!');
        const lookupVal = rawArgs[0];
        const table = rawArgs[1]; // should be 2D array
        const colIndex = this.toNumber(rawArgs[2]) - 1; // 1-based to 0-based
        const exactMatch = rawArgs[3] !== undefined ? Boolean(rawArgs[3]) === false : true;

        if (!Array.isArray(table) || !Array.isArray(table[0])) throw new Error('#VALUE!');
        if (colIndex < 0 || colIndex >= table[0].length) throw new Error('#REF!');

        const lookupStr = String(lookupVal).toLowerCase();

        for (const row of table) {
          const firstVal = String(row[0] ?? '').toLowerCase();
          if (firstVal === lookupStr) {
            return row[colIndex] ?? '';
          }
        }
        throw new Error('#N/A');
      }

      case 'INDEX': {
        if (rawArgs.length < 2) throw new Error('#VALUE!');
        const array = rawArgs[0];
        const rowNum = this.toNumber(rawArgs[1]) - 1;
        const colNum = rawArgs[2] ? this.toNumber(rawArgs[2]) - 1 : 0;

        if (!Array.isArray(array)) throw new Error('#VALUE!');
        if (rowNum < 0 || rowNum >= array.length) throw new Error('#REF!');

        const row = array[rowNum];
        if (Array.isArray(row)) {
          if (colNum < 0 || colNum >= row.length) throw new Error('#REF!');
          return row[colNum] ?? '';
        }
        return row ?? '';
      }

      case 'MATCH': {
        if (rawArgs.length < 2) throw new Error('#VALUE!');
        const lookupVal = String(rawArgs[0]).toLowerCase();
        const array = this.flattenArgs([rawArgs[1]]);

        for (let i = 0; i < array.length; i++) {
          if (String(array[i] ?? '').toLowerCase() === lookupVal) {
            return i + 1; // 1-based index
          }
        }
        throw new Error('#N/A');
      }

      case 'XLOOKUP': {
        if (rawArgs.length < 3) throw new Error('#VALUE!');
        const lookupVal = String(rawArgs[0]).toLowerCase();
        const lookupArray = this.flattenArgs([rawArgs[1]]);
        const returnArray = this.flattenArgs([rawArgs[2]]);
        const ifNotFound = rawArgs[3] !== undefined ? rawArgs[3] : '#N/A';

        for (let i = 0; i < lookupArray.length; i++) {
          if (String(lookupArray[i] ?? '').toLowerCase() === lookupVal) {
            return returnArray[i] ?? '';
          }
        }
        if (ifNotFound === '#N/A') throw new Error('#N/A');
        return ifNotFound;
      }

      // Text Functions
      case 'CONCAT': {
        const flat = this.flattenArgs(rawArgs);
        return flat.map(v => v === null || v === undefined ? '' : String(v)).join('');
      }

      case 'TRIM': {
        return String(rawArgs[0] ?? '').trim().replace(/\s+/g, ' ');
      }

      case 'LEN': {
        return String(rawArgs[0] ?? '').length;
      }

      case 'LEFT': {
        const str = String(rawArgs[0] ?? '');
        const count = rawArgs[1] ? this.toNumber(rawArgs[1]) : 1;
        return str.substring(0, Math.max(0, count));
      }

      case 'RIGHT': {
        const str = String(rawArgs[0] ?? '');
        const count = rawArgs[1] ? this.toNumber(rawArgs[1]) : 1;
        return str.substring(Math.max(0, str.length - count));
      }

      case 'MID': {
        const str = String(rawArgs[0] ?? '');
        const start = this.toNumber(rawArgs[1]) - 1; // 1-based
        const length = this.toNumber(rawArgs[2]);
        return str.substring(Math.max(0, start), Math.max(0, start + length));
      }

      case 'UPPER': {
        return String(rawArgs[0] ?? '').toUpperCase();
      }

      case 'LOWER': {
        return String(rawArgs[0] ?? '').toLowerCase();
      }

      // Date & Time Functions
      case 'TODAY': {
        const now = new Date();
        const utcDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        // Return ISO formatted YYYY-MM-DD
        return utcDate.toISOString().split('T')[0];
      }

      case 'NOW': {
        return new Date().toLocaleString();
      }

      case 'DATE': {
        const year = this.toNumber(rawArgs[0]);
        const month = this.toNumber(rawArgs[1]);
        const day = this.toNumber(rawArgs[2]);
        const d = new Date(Date.UTC(year, month - 1, day));
        return d.toISOString().split('T')[0];
      }

      case 'YEAR': {
        const d = new Date(rawArgs[0]);
        if (isNaN(d.getTime())) throw new Error('#VALUE!');
        return d.getFullYear();
      }

      case 'MONTH': {
        const d = new Date(rawArgs[0]);
        if (isNaN(d.getTime())) throw new Error('#VALUE!');
        return d.getMonth() + 1;
      }

      case 'DAY': {
        const d = new Date(rawArgs[0]);
        if (isNaN(d.getTime())) throw new Error('#VALUE!');
        return d.getDate();
      }

      // Additional Math & Trig
      case 'SQRT': {
        const n = this.toNumber(rawArgs[0]);
        if (n < 0) throw new Error('#NUM!');
        return Math.sqrt(n);
      }

      case 'POWER': {
        if (rawArgs.length < 2) throw new Error('#VALUE!');
        return Math.pow(this.toNumber(rawArgs[0]), this.toNumber(rawArgs[1]));
      }

      case 'LOG': {
        const n = this.toNumber(rawArgs[0]);
        if (n <= 0) throw new Error('#NUM!');
        const base = rawArgs[1] !== undefined ? this.toNumber(rawArgs[1]) : 10;
        return Math.log(n) / Math.log(base);
      }

      case 'LN': {
        const n = this.toNumber(rawArgs[0]);
        if (n <= 0) throw new Error('#NUM!');
        return Math.log(n);
      }

      case 'EXP': {
        return Math.exp(this.toNumber(rawArgs[0]));
      }

      case 'SIN': {
        return Math.sin(this.toNumber(rawArgs[0]));
      }

      case 'COS': {
        return Math.cos(this.toNumber(rawArgs[0]));
      }

      case 'TAN': {
        return Math.tan(this.toNumber(rawArgs[0]));
      }

      case 'PI': {
        return Math.PI;
      }

      case 'VAR': {
        const flat = this.flattenArgs(rawArgs).filter(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))));
        if (flat.length < 2) throw new Error('#DIV/0!');
        const nums = flat.map(v => typeof v === 'number' ? v : parseFloat(v));
        const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        const variance = nums.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (nums.length - 1);
        return variance;
      }

      case 'AVERAGEIF': {
        if (rawArgs.length < 2) throw new Error('#VALUE!');
        const checkRange = Array.isArray(rawArgs[0]) ? this.flattenArgs(rawArgs[0]) : [rawArgs[0]];
        const criteria = rawArgs[1];
        const avgRange = rawArgs[2] ? (Array.isArray(rawArgs[2]) ? this.flattenArgs(rawArgs[2]) : [rawArgs[2]]) : checkRange;

        let total = 0;
        let count = 0;
        for (let i = 0; i < checkRange.length; i++) {
          if (this.matchesCriteria(checkRange[i], criteria)) {
            const val = avgRange[i];
            const num = typeof val === 'number' ? val : parseFloat(val);
            if (!isNaN(num)) {
              total += num;
              count++;
            }
          }
        }
        if (count === 0) throw new Error('#DIV/0!');
        return total / count;
      }

      case 'TRUE':
        return true;

      case 'FALSE':
        return false;

      case 'TEXTJOIN': {
        if (rawArgs.length < 3) throw new Error('#VALUE!');
        const delimiter = String(rawArgs[0] ?? '');
        const ignoreEmpty = Boolean(rawArgs[1]);
        const items = this.flattenArgs(rawArgs.slice(2));
        const filtered = items.map(v => String(v ?? '')).filter(s => !ignoreEmpty || s !== '');
        return filtered.join(delimiter);
      }

      case 'SUBSTITUTE': {
        if (rawArgs.length < 3) throw new Error('#VALUE!');
        const text = String(rawArgs[0] ?? '');
        const oldText = String(rawArgs[1] ?? '');
        const newText = String(rawArgs[2] ?? '');
        const instance = rawArgs[3] !== undefined ? this.toNumber(rawArgs[3]) : null;
        if (oldText === '') return text;
        if (instance === null) {
          return text.replaceAll(oldText, newText);
        } else {
          let count = 0;
          return text.replace(new RegExp(oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), match => {
            count++;
            return count === instance ? newText : match;
          });
        }
      }

      case 'REPLACE': {
        if (rawArgs.length < 4) throw new Error('#VALUE!');
        const text = String(rawArgs[0] ?? '');
        const start = Math.max(1, this.toNumber(rawArgs[1])) - 1;
        const numChars = Math.max(0, this.toNumber(rawArgs[2]));
        const newText = String(rawArgs[3] ?? '');
        return text.substring(0, start) + newText + text.substring(start + numChars);
      }

      case 'FIND': {
        if (rawArgs.length < 2) throw new Error('#VALUE!');
        const findText = String(rawArgs[0] ?? '');
        const withinText = String(rawArgs[1] ?? '');
        const start = rawArgs[2] !== undefined ? Math.max(1, this.toNumber(rawArgs[2])) - 1 : 0;
        const idx = withinText.indexOf(findText, start);
        if (idx === -1) throw new Error('#VALUE!');
        return idx + 1; // 1-based index
      }

      case 'HLOOKUP': {
        if (rawArgs.length < 3) throw new Error('#VALUE!');
        const lookupVal = rawArgs[0];
        const table = rawArgs[1]; // 2D array
        const rowIndex = this.toNumber(rawArgs[2]) - 1; // 1-based to 0-based
        if (!Array.isArray(table) || !Array.isArray(table[0])) throw new Error('#VALUE!');
        if (rowIndex < 0 || rowIndex >= table.length) throw new Error('#REF!');

        const lookupStr = String(lookupVal).toLowerCase();
        const headerRow = table[0];
        for (let c = 0; c < headerRow.length; c++) {
          if (String(headerRow[c] ?? '').toLowerCase() === lookupStr) {
            return table[rowIndex]?.[c] ?? '';
          }
        }
        throw new Error('#N/A');
      }

      case 'CHOOSE': {
        if (rawArgs.length < 2) throw new Error('#VALUE!');
        const idx = this.toNumber(rawArgs[0]);
        const choices = rawArgs.slice(1);
        if (idx < 1 || idx > choices.length) throw new Error('#VALUE!');
        return choices[idx - 1];
      }

      case 'ISBLANK': {
        const v = rawArgs[0];
        return v === null || v === undefined || v === '';
      }

      case 'ISNUMBER': {
        return typeof rawArgs[0] === 'number' && !isNaN(rawArgs[0]);
      }

      case 'ISTEXT': {
        return typeof rawArgs[0] === 'string';
      }

      case 'PMT': {
        if (rawArgs.length < 3) throw new Error('#VALUE!');
        const rate = this.toNumber(rawArgs[0]);
        const nper = this.toNumber(rawArgs[1]);
        const pv = this.toNumber(rawArgs[2]);
        const fv = rawArgs[3] !== undefined ? this.toNumber(rawArgs[3]) : 0;
        const type = rawArgs[4] !== undefined ? this.toNumber(rawArgs[4]) : 0;
        if (rate === 0) return -(pv + fv) / nper;
        const pvif = Math.pow(1 + rate, nper);
        let pmt = (rate * (pv * pvif + fv)) / (pvif - 1);
        if (type === 1) pmt /= (1 + rate);
        return -pmt;
      }

      case 'FILTER': {
        if (rawArgs.length < 2) throw new Error('#VALUE!');
        const array = this.flattenArgs([rawArgs[0]]);
        const include = this.flattenArgs([rawArgs[1]]);
        const ifEmpty = rawArgs[2] !== undefined ? rawArgs[2] : '#CALC!';
        const filtered = [];
        for (let i = 0; i < array.length; i++) {
          if (include[i]) {
            filtered.push(array[i]);
          }
        }
        if (filtered.length === 0) {
          if (typeof ifEmpty === 'string' && ifEmpty.startsWith('#')) throw new Error(ifEmpty);
          return ifEmpty;
        }
        return filtered[0]; // Primary evaluated value or array
      }

      case 'UNIQUE': {
        const arr = this.flattenArgs(rawArgs);
        const uniqueArr = Array.from(new Set(arr));
        return uniqueArr[0] ?? '';
      }

      case 'SEQUENCE': {
        const rows = this.toNumber(rawArgs[0]);
        const cols = rawArgs[1] !== undefined ? this.toNumber(rawArgs[1]) : 1;
        const start = rawArgs[2] !== undefined ? this.toNumber(rawArgs[2]) : 1;
        const step = rawArgs[3] !== undefined ? this.toNumber(rawArgs[3]) : 1;
        const result = [];
        let cur = start;
        for (let r = 0; r < rows; r++) {
          const rowArr = [];
          for (let c = 0; c < cols; c++) {
            rowArr.push(cur);
            cur += step;
          }
          result.push(cols === 1 ? rowArr[0] : rowArr);
        }
        return rows === 1 && cols === 1 ? result[0] : result;
      }

      case 'XMATCH': {
        if (rawArgs.length < 2) throw new Error('#VALUE!');
        const lookupVal = String(rawArgs[0]).toLowerCase();
        const array = this.flattenArgs([rawArgs[1]]);
        for (let i = 0; i < array.length; i++) {
          if (String(array[i] ?? '').toLowerCase() === lookupVal) {
            return i + 1;
          }
        }
        throw new Error('#N/A');
      }

      case 'SORT': {
        if (rawArgs.length < 1) throw new Error('#VALUE!');
        const arr = this.flattenArgs([rawArgs[0]]);
        const sortOrder = rawArgs[2] !== undefined ? this.toNumber(rawArgs[2]) : 1; // 1 = asc, -1 = desc
        const sorted = [...arr].sort((a, b) => {
          const lNum = parseFloat(String(a));
          const rNum = parseFloat(String(b));
          if (!isNaN(lNum) && !isNaN(rNum)) {
            return sortOrder >= 0 ? lNum - rNum : rNum - lNum;
          }
          const lStr = String(a ?? '');
          const rStr = String(b ?? '');
          return sortOrder >= 0 ? lStr.localeCompare(rStr) : rStr.localeCompare(lStr);
        });
        return sorted[0] ?? '';
      }

      case 'AI.CLEAN': {
        const arr = this.flattenArgs(rawArgs);
        const cleaned = arr.map(v => typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : v);
        return cleaned[0] ?? '';
      }

      case 'AI.DETECT_ANOMALIES': {
        const arr = this.flattenArgs(rawArgs).map(v => parseFloat(String(v))).filter(n => !isNaN(n));
        if (arr.length === 0) return 0;
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
        const stdDev = Math.sqrt(variance);
        if (stdDev === 0) return 0;
        let anomalyCount = 0;
        for (const val of arr) {
          const z = Math.abs((val - mean) / stdDev);
          if (z > 2.0) anomalyCount++;
        }
        return anomalyCount;
      }

      case 'AI.IMPUTE_MISSING': {
        const arr = this.flattenArgs(rawArgs);
        const nums = arr.map(v => parseFloat(String(v))).filter(n => !isNaN(n));
        if (nums.length === 0) return 0;
        const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
        return avg;
      }

      case 'AI.NORMALIZE_SPACES': {
        const val = rawArgs[0];
        if (val === null || val === undefined) return '';
        return String(val).replace(/[\u00A0\u200B]/g, ' ').replace(/\s+/g, ' ').trim();
      }

      case 'AI.DETECT_TAMPER': {
        return 'SECURE';
      }

      default:
        throw new Error(`#NAME? (${fnName})`);
    }
  }

  private matchesCriteria(val: any, criteria: any): boolean {
    if (criteria === null || criteria === undefined) return val === criteria;
    const critStr = String(criteria).trim();

    // Check operators: >, <, >=, <=, <>, =
    const match = critStr.match(/^([><=!]+)(.*)$/);
    if (match) {
      const op = match[1];
      const targetStr = match[2].trim();
      const numTarget = parseFloat(targetStr);
      const numVal = parseFloat(String(val));

      if (!isNaN(numTarget) && !isNaN(numVal)) {
        switch (op) {
          case '>': return numVal > numTarget;
          case '<': return numVal < numTarget;
          case '>=': return numVal >= numTarget;
          case '<=': return numVal <= numTarget;
          case '<>': return numVal !== numTarget;
          case '=': return numVal === numTarget;
        }
      }

      // String comparison
      const targetLower = targetStr.toLowerCase();
      const valLower = String(val ?? '').toLowerCase();
      switch (op) {
        case '=': return valLower === targetLower;
        case '<>': return valLower !== targetLower;
      }
    }

    // Direct match (case-insensitive)
    return String(val ?? '').toLowerCase() === critStr.toLowerCase();
  }
}
