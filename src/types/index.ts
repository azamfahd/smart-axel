/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HorizontalAlign = 'left' | 'center' | 'right';
export type VerticalAlign = 'top' | 'middle' | 'bottom';
export type NumberFormatType = 'general' | 'number' | 'currency' | 'percent' | 'date' | 'text';

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  backgroundColor?: string;
  align?: HorizontalAlign;
  verticalAlign?: VerticalAlign;
  wrapText?: boolean;
  format?: NumberFormatType;
  decimalPlaces?: number;
  borderTop?: string;
  borderBottom?: string;
  borderLeft?: string;
  borderRight?: string;
}

export interface CellData {
  rawValue: string | number | boolean | null;
  formula?: string;
  displayValue?: string;
  style?: CellStyle;
  comment?: string;
  validation?: {
    type: 'list' | 'number' | 'date';
    values?: string[];
    min?: number;
    max?: number;
  };
}

export type CellMatrix = Record<string, CellData>; // key: "row,col" e.g. "0,0"

export interface MergedRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface WorksheetData {
  id: string;
  name: string;
  cells: CellMatrix;
  rowCount: number;
  colCount: number;
  colWidths: Record<number, number>;
  rowHeights: Record<number, number>;
  mergedCells: MergedRange[];
  freezeRows?: number;
  freezeCols?: number;
  hiddenRows?: number[];
  hiddenCols?: number[];
}

export interface WorkbookData {
  id: string;
  name: string;
  sheets: WorksheetData[];
  activeSheetId: string;
}

export interface CellCoord {
  row: number;
  col: number;
}

export interface SelectionRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditFinding {
  id: string;
  ruleId: string;
  ruleTitle: string;
  ruleTitleAr: string;
  severity: AuditSeverity;
  sheetId: string;
  sheetName: string;
  row: number;
  col: number;
  cellRef: string;
  currentValue: any;
  suggestedValue?: any;
  explanation: string;
  explanationAr: string;
  status: 'pending' | 'accepted' | 'rejected' | 'dismissed';
}

export interface AuditSummaryReport {
  timestamp: string;
  totalFindings: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  findings: AuditFinding[];
}

export interface HistoryAction {
  description: string;
  descriptionAr: string;
  undo: () => void;
  redo: () => void;
}

export type LanguageCode = 'ar' | 'en';
