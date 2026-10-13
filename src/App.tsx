/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  FileSpreadsheet,
  Save,
  RotateCcw,
  RotateCw,
  Printer,
  Globe,
  Bot,
  ShieldAlert,
  Search,
  CheckCircle2,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import {
  WorkbookData,
  WorksheetData,
  CellData,
  SelectionRange,
  AuditFinding,
  LanguageCode,
  NumberFormatType,
} from './types/index.ts';
import { createInitialWorkbook } from './core/workbook/sampleData.ts';
import { FormulaEngine } from './core/formula/index.ts';
import { coordsToRef } from './core/formula/cellUtils.ts';
import { AuditEngine } from './core/audit/auditEngine.ts';
import { DataAuditAgent } from './core/ai/agent.ts';
import { FileService } from './services/fileService.ts';
import { getTranslation } from './core/i18n/translations.ts';

// UI Feature Components
import { Ribbon } from './features/ribbon/Ribbon.tsx';
import { FormulaBar } from './features/formula_bar/FormulaBar.tsx';
import { SpreadsheetGrid } from './features/grid/SpreadsheetGrid.tsx';
import { SheetsBar } from './features/sheets_bar/SheetsBar.tsx';
import { AuditPanel } from './features/audit_panel/AuditPanel.tsx';
import { AIChatDrawer } from './features/ai_chat/AIChatDrawer.tsx';
import { ChartDialog } from './features/dialogs/ChartDialog.tsx';
import { InsertFunctionDialog } from './features/dialogs/InsertFunctionDialog.tsx';
import { AuditReportDialog } from './features/dialogs/AuditReportDialog.tsx';
import { BenchmarkDialog } from './features/dialogs/BenchmarkDialog.tsx';
import { FindReplaceDialog } from './features/dialogs/FindReplaceDialog.tsx';
import { ConditionalFormattingDialog } from './features/dialogs/ConditionalFormattingDialog.tsx';
import { DataValidationDialog } from './features/dialogs/DataValidationDialog.tsx';
import { BackupManagerDialog } from './features/dialogs/BackupManagerDialog.tsx';
import { VersionCompareDialog } from './features/dialogs/VersionCompareDialog.tsx';
import { PivotTableDialog } from './features/dialogs/PivotTableDialog.tsx';
import { SqlConsoleDialog } from './features/dialogs/SqlConsoleDialog.tsx';
import { PWAInstallButton } from './features/pwa/PWAInstallButton.tsx';
import { OfflineIndicator } from './features/pwa/OfflineIndicator.tsx';

export default function App() {
  const [lang, setLang] = useState<LanguageCode>('ar');
  const direction: 'rtl' | 'ltr' = lang === 'ar' ? 'rtl' : 'ltr';
  const t = getTranslation(lang);

  // Engines
  const formulaEngine = useMemo(() => new FormulaEngine(), []);
  const auditEngine = useMemo(() => new AuditEngine(), []);
  const agent = useMemo(() => new DataAuditAgent(), []);

  // Workbook State
  const [workbook, setWorkbook] = useState<WorkbookData>(() => createInitialWorkbook());
  const activeSheet = useMemo(() => {
    return workbook.sheets.find(s => s.id === workbook.activeSheetId) || workbook.sheets[0];
  }, [workbook]);

  // Selection State
  const [selectedRange, setSelectedRange] = useState<SelectionRange>({
    startRow: 1,
    startCol: 2,
    endRow: 1,
    endCol: 2,
  });

  // History for Undo / Redo
  const [history, setHistory] = useState<WorkbookData[]>([]);
  const [future, setFuture] = useState<WorkbookData[]>([]);

  // UI Panels and Modals
  const [activeRibbonTab, setActiveRibbonTab] = useState<string>('home');
  const [isAuditPanelOpen, setIsAuditPanelOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [chartModal, setChartModal] = useState<{ isOpen: boolean; type: 'column' | 'bar' | 'line' | 'pie' }>({
    isOpen: false,
    type: 'column',
  });
  const [isInsertFuncOpen, setIsInsertFuncOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [isConditionalFormatOpen, setIsConditionalFormatOpen] = useState(false);
  const [isDataValidationOpen, setIsDataValidationOpen] = useState(false);
  const [isBackupManagerOpen, setIsBackupManagerOpen] = useState(false);
  const [isCompareVersionsOpen, setIsCompareVersionsOpen] = useState(false);
  const [isPivotTableOpen, setIsPivotTableOpen] = useState(false);
  const [isSqlConsoleOpen, setIsSqlConsoleOpen] = useState(false);

  const handleInsertPivotSheet = (pivotName: string, data: any[][]) => {
    pushHistory(workbook);
    const newCells: Record<string, CellData> = {};
    data.forEach((row, rIdx) => {
      row.forEach((val, cIdx) => {
        newCells[`${rIdx}_${cIdx}`] = { rawValue: String(val) };
      });
    });

    const newSheet: WorksheetData = {
      id: `sheet-${Date.now()}`,
      name: pivotName,
      cells: newCells,
      rowCount: Math.max(50, data.length + 10),
      colCount: Math.max(10, data[0]?.length || 3),
      colWidths: {},
      rowHeights: {},
      mergedCells: [],
      freezeRows: 1,
    };

    setWorkbook(prev => ({
      ...prev,
      sheets: [...prev.sheets, newSheet],
      activeSheetId: newSheet.id,
    }));
  };

  // Clipboard state for Cut/Copy/Paste
  const [clipboardData, setClipboardData] = useState<{
    cells: Record<string, any>;
    minR: number;
    minC: number;
    maxR: number;
    maxC: number;
    isCut: boolean;
  } | null>(null);

  // Format Painter state
  const [formatPainterStyle, setFormatPainterStyle] = useState<any>(null);

  // Zoom
  const [zoom, setZoom] = useState<number>(100);

  // File Input Ref for Open File
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save state in history
  const pushHistory = useCallback((currentWb: WorkbookData) => {
    setHistory(prev => [...prev.slice(-25), JSON.parse(JSON.stringify(currentWb))]);
    setFuture([]);
  }, []);

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setFuture(prev => [JSON.parse(JSON.stringify(workbook)), ...prev]);
    setHistory(prev => prev.slice(0, prev.length - 1));
    setWorkbook(previous);
  }, [history, workbook]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory(prev => [...prev, JSON.parse(JSON.stringify(workbook))]);
    setFuture(prev => prev.slice(1));
    setWorkbook(next);
  }, [future, workbook]);



  // Initial Calculation of Formulas in Initial Dataset
  useEffect(() => {
    let changed = false;
    const updatedWb = { ...workbook };

    updatedWb.sheets.forEach(sheet => {
      Object.keys(sheet.cells).forEach(key => {
        const cell = sheet.cells[key];
        if (cell && cell.formula) {
          const val = formulaEngine.evaluateFormula(cell.formula, sheet.id, updatedWb);
          if (val !== cell.rawValue) {
            cell.rawValue = val;
            changed = true;
          }
        }
      });
    });

    if (changed) {
      setWorkbook(updatedWb);
    }
  }, []);

  // Audit Findings
  const [auditFindings, setAuditFindings] = useState<AuditFinding[]>([]);

  // Run audit on active sheet
  const handleRunAudit = useCallback(() => {
    const findings = auditEngine.auditWorksheet(activeSheet);
    setAuditFindings(findings);
    setIsAuditPanelOpen(true);
  }, [auditEngine, activeSheet]);

  // Auto-scan on load
  useEffect(() => {
    const findings = auditEngine.auditWorksheet(activeSheet);
    setAuditFindings(findings);
  }, [activeSheet, auditEngine]);

  // Update a single cell value / formula
  const handleUpdateCell = useCallback(
    (row: number, col: number, rawVal: any, formula?: string) => {
      pushHistory(workbook);

      setWorkbook(prevWb => {
        const nextWb = JSON.parse(JSON.stringify(prevWb)) as WorkbookData;
        const targetSheet = nextWb.sheets.find(s => s.id === prevWb.activeSheetId);
        if (!targetSheet) return prevWb;

        const cellKey = `${row},${col}`;
        const existing = targetSheet.cells[cellKey] || { rawValue: null };

        let finalValue = rawVal;
        if (formula && formula.startsWith('=')) {
          finalValue = formulaEngine.evaluateFormula(formula, targetSheet.id, nextWb);
        }

        targetSheet.cells[cellKey] = {
          ...existing,
          rawValue: finalValue,
          formula: formula,
        };

        // Recalculate dependents
        formulaEngine.recalculateDependents(targetSheet.id, row, col, nextWb);

        return nextWb;
      });
    },
    [workbook, formulaEngine, pushHistory]
  );

  // Batch update cells (e.g. fill handle or auto-fill)
  const handleBatchUpdateCells = useCallback(
    (updates: { row: number; col: number; val: any; formula?: string }[]) => {
      pushHistory(workbook);

      setWorkbook(prevWb => {
        const nextWb = JSON.parse(JSON.stringify(prevWb)) as WorkbookData;
        const targetSheet = nextWb.sheets.find(s => s.id === prevWb.activeSheetId);
        if (!targetSheet) return prevWb;

        updates.forEach(u => {
          const cellKey = `${u.row},${u.col}`;
          const existing = targetSheet.cells[cellKey] || { rawValue: null };

          let finalVal = u.val;
          if (u.formula && u.formula.startsWith('=')) {
            finalVal = formulaEngine.evaluateFormula(u.formula, targetSheet.id, nextWb);
          }

          targetSheet.cells[cellKey] = {
            ...existing,
            rawValue: finalVal,
            formula: u.formula,
          };

          formulaEngine.recalculateDependents(targetSheet.id, u.row, u.col, nextWb);
        });

        return nextWb;
      });
    },
    [workbook, formulaEngine, pushHistory]
  );

  // Format active cell(s)
  const applyCellStyle = useCallback(
    (stylePatch: Partial<any>) => {
      pushHistory(workbook);

      const minR = Math.min(selectedRange.startRow, selectedRange.endRow);
      const maxR = Math.max(selectedRange.startRow, selectedRange.endRow);
      const minC = Math.min(selectedRange.startCol, selectedRange.endCol);
      const maxC = Math.max(selectedRange.startCol, selectedRange.endCol);

      setWorkbook(prevWb => {
        const nextWb = JSON.parse(JSON.stringify(prevWb)) as WorkbookData;
        const targetSheet = nextWb.sheets.find(s => s.id === prevWb.activeSheetId);
        if (!targetSheet) return prevWb;

        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            const key = `${r},${c}`;
            const cell = targetSheet.cells[key] || { rawValue: null };
            cell.style = { ...(cell.style || {}), ...stylePatch };
            targetSheet.cells[key] = cell;
          }
        }

        return nextWb;
      });
    },
    [workbook, selectedRange, pushHistory]
  );

  // AutoSum feature
  const handleAutoSum = useCallback(() => {
    const minR = Math.min(selectedRange.startRow, selectedRange.endRow);
    const maxR = Math.max(selectedRange.startRow, selectedRange.endRow);
    const minC = Math.min(selectedRange.startCol, selectedRange.endCol);

    const sumRow = maxR + 1;
    const formula = `=SUM(${coordsToRef(minR, minC)}:${coordsToRef(maxR, minC)})`;
    handleUpdateCell(sumRow, minC, 0, formula);
    setSelectedRange({ startRow: sumRow, startCol: minC, endRow: sumRow, endCol: minC });
  }, [selectedRange, handleUpdateCell]);

  // Sort feature
  const handleSort = useCallback(
    (direction: 'asc' | 'desc') => {
      pushHistory(workbook);
      const minR = Math.min(selectedRange.startRow, selectedRange.endRow);
      const maxR = Math.max(selectedRange.startRow, selectedRange.endRow);
      const targetCol = selectedRange.startCol;

      setWorkbook(prevWb => {
        const nextWb = JSON.parse(JSON.stringify(prevWb)) as WorkbookData;
        const targetSheet = nextWb.sheets.find(s => s.id === prevWb.activeSheetId);
        if (!targetSheet) return prevWb;

        // Collect rows in selection
        const rows: { r: number; cells: Record<number, any> }[] = [];
        for (let r = minR; r <= maxR; r++) {
          const rowData: Record<number, any> = {};
          for (let c = 0; c < targetSheet.colCount; c++) {
            rowData[c] = targetSheet.cells[`${r},${c}`];
          }
          rows.push({ r, cells: rowData });
        }

        // Sort by targetCol
        rows.sort((a, b) => {
          const vA = a.cells[targetCol]?.rawValue ?? '';
          const vB = b.cells[targetCol]?.rawValue ?? '';
          if (typeof vA === 'number' && typeof vB === 'number') {
            return direction === 'asc' ? vA - vB : vB - vA;
          }
          return direction === 'asc'
            ? String(vA).localeCompare(String(vB))
            : String(vB).localeCompare(String(vA));
        });

        // Write sorted rows back
        rows.forEach((rowObj, idx) => {
          const targetR = minR + idx;
          for (let c = 0; c < targetSheet.colCount; c++) {
            if (rowObj.cells[c]) {
              targetSheet.cells[`${targetR},${c}`] = rowObj.cells[c];
            } else {
              delete targetSheet.cells[`${targetR},${c}`];
            }
          }
        });

        return nextWb;
      });
    },
    [workbook, selectedRange, pushHistory]
  );

  // File Operations
  const handleNewWorkbook = () => {
    pushHistory(workbook);
    setWorkbook({
      id: `wb-${Date.now()}`,
      name: 'مصنف_جديد.xlsx',
      sheets: [
        {
          id: 'sheet-1',
          name: 'Sheet1',
          cells: {},
          rowCount: 50,
          colCount: 20,
          colWidths: {},
          rowHeights: {},
          mergedCells: [],
          freezeRows: 1,
        },
      ],
      activeSheetId: 'sheet-1',
    });
  };

  const handleOpenFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      pushHistory(workbook);
      const imported = await FileService.importFile(file);
      setWorkbook(imported);
      handleRunAudit();
    } catch (err: any) {
      alert(`خطأ في قراءة الملف: ${err.message}`);
    }
  };

  const handleExportXLSX = () => {
    FileService.exportWorkbookToXLSX(workbook);
  };

  const handleExportCSV = () => {
    FileService.exportSheetToCSV(activeSheet);
  };

  const handlePrint = () => {
    window.print();
  };

  // Clipboard Operations
  const handleCopy = useCallback(() => {
    const minR = Math.min(selectedRange.startRow, selectedRange.endRow);
    const maxR = Math.max(selectedRange.startRow, selectedRange.endRow);
    const minC = Math.min(selectedRange.startCol, selectedRange.endCol);
    const maxC = Math.max(selectedRange.startCol, selectedRange.endCol);

    const copiedCells: Record<string, any> = {};
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const key = `${r},${c}`;
        if (activeSheet.cells[key]) {
          copiedCells[`${r - minR},${c - minC}`] = JSON.parse(JSON.stringify(activeSheet.cells[key]));
        }
      }
    }

    setClipboardData({
      cells: copiedCells,
      minR,
      minC,
      maxR,
      maxC,
      isCut: false,
    });
  }, [selectedRange, activeSheet.cells]);

  const handleCut = useCallback(() => {
    handleCopy();
    setClipboardData(prev => (prev ? { ...prev, isCut: true } : null));
  }, [handleCopy]);

  const handlePaste = useCallback(() => {
    if (!clipboardData) return;
    pushHistory(workbook);

    const targetStartR = selectedRange.startRow;
    const targetStartC = selectedRange.startCol;

    setWorkbook(prevWb => {
      const nextWb = JSON.parse(JSON.stringify(prevWb)) as WorkbookData;
      const targetSheet = nextWb.sheets.find(s => s.id === prevWb.activeSheetId);
      if (!targetSheet) return prevWb;

      if (clipboardData.isCut) {
        for (let r = clipboardData.minR; r <= clipboardData.maxR; r++) {
          for (let c = clipboardData.minC; c <= clipboardData.maxC; c++) {
            delete targetSheet.cells[`${r},${c}`];
          }
        }
      }

      Object.keys(clipboardData.cells).forEach(relKey => {
        const [relR, relC] = relKey.split(',').map(n => parseInt(n, 10));
        const newR = targetStartR + relR;
        const newC = targetStartC + relC;
        if (newR < targetSheet.rowCount && newC < targetSheet.colCount) {
          targetSheet.cells[`${newR},${newC}`] = JSON.parse(
            JSON.stringify(clipboardData.cells[relKey])
          );
          formulaEngine.recalculateDependents(targetSheet.id, newR, newC, nextWb);
        }
      });

      return nextWb;
    });

    if (clipboardData.isCut) {
      setClipboardData(null);
    }
  }, [clipboardData, selectedRange, workbook, pushHistory, formulaEngine]);

  // Cell Merge & Center
  const handleMergeCells = useCallback(() => {
    pushHistory(workbook);
    const minR = Math.min(selectedRange.startRow, selectedRange.endRow);
    const maxR = Math.max(selectedRange.startRow, selectedRange.endRow);
    const minC = Math.min(selectedRange.startCol, selectedRange.endCol);
    const maxC = Math.max(selectedRange.startCol, selectedRange.endCol);

    if (minR === maxR && minC === maxC) return;

    setWorkbook(prevWb => {
      const nextWb = JSON.parse(JSON.stringify(prevWb)) as WorkbookData;
      const sheet = nextWb.sheets.find(s => s.id === prevWb.activeSheetId);
      if (!sheet) return prevWb;

      const existingIdx = sheet.mergedCells.findIndex(
        m => m.startRow === minR && m.startCol === minC && m.endRow === maxR && m.endCol === maxC
      );

      if (existingIdx >= 0) {
        sheet.mergedCells.splice(existingIdx, 1);
      } else {
        sheet.mergedCells.push({ startRow: minR, startCol: minC, endRow: maxR, endCol: maxC });
        const primaryKey = `${minR},${minC}`;
        if (sheet.cells[primaryKey]) {
          sheet.cells[primaryKey].style = {
            ...(sheet.cells[primaryKey].style || {}),
            align: 'center',
          };
        }
      }
      return nextWb;
    });
  }, [workbook, selectedRange, pushHistory]);

  // Freeze / Unfreeze
  const handleFreezeTopRow = useCallback(() => {
    pushHistory(workbook);
    setWorkbook(prev => {
      const next = { ...prev };
      const s = next.sheets.find(x => x.id === next.activeSheetId);
      if (s) s.freezeRows = 1;
      return next;
    });
  }, [workbook, pushHistory]);

  const handleUnfreeze = useCallback(() => {
    pushHistory(workbook);
    setWorkbook(prev => {
      const next = { ...prev };
      const s = next.sheets.find(x => x.id === next.activeSheetId);
      if (s) s.freezeRows = 0;
      return next;
    });
  }, [workbook, pushHistory]);

  // Insert & Delete Rows / Columns
  const handleInsertRow = useCallback((targetRow: number) => {
    pushHistory(workbook);
    setWorkbook(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as WorkbookData;
      const s = next.sheets.find(x => x.id === next.activeSheetId);
      if (!s) return prev;
      const newCells: Record<string, CellData> = {};
      Object.entries(s.cells).forEach(([key, cell]) => {
        const [r, c] = key.split(',').map(Number);
        if (r >= targetRow) {
          newCells[`${r + 1},${c}`] = cell;
        } else {
          newCells[key] = cell;
        }
      });
      s.cells = newCells;
      s.rowCount = Math.max(s.rowCount + 1, 100);
      return next;
    });
  }, [workbook, pushHistory]);

  const handleDeleteRow = useCallback((targetRow: number) => {
    pushHistory(workbook);
    setWorkbook(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as WorkbookData;
      const s = next.sheets.find(x => x.id === next.activeSheetId);
      if (!s) return prev;
      const newCells: Record<string, CellData> = {};
      Object.entries(s.cells).forEach(([key, cell]) => {
        const [r, c] = key.split(',').map(Number);
        if (r === targetRow) {
          // Deleted
        } else if (r > targetRow) {
          newCells[`${r - 1},${c}`] = cell;
        } else {
          newCells[key] = cell;
        }
      });
      s.cells = newCells;
      return next;
    });
  }, [workbook, pushHistory]);

  const handleInsertCol = useCallback((targetCol: number) => {
    pushHistory(workbook);
    setWorkbook(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as WorkbookData;
      const s = next.sheets.find(x => x.id === next.activeSheetId);
      if (!s) return prev;
      const newCells: Record<string, CellData> = {};
      Object.entries(s.cells).forEach(([key, cell]) => {
        const [r, c] = key.split(',').map(Number);
        if (c >= targetCol) {
          newCells[`${r},${c + 1}`] = cell;
        } else {
          newCells[key] = cell;
        }
      });
      s.cells = newCells;
      s.colCount = Math.max(s.colCount + 1, 26);
      return next;
    });
  }, [workbook, pushHistory]);

  const handleDeleteCol = useCallback((targetCol: number) => {
    pushHistory(workbook);
    setWorkbook(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as WorkbookData;
      const s = next.sheets.find(x => x.id === next.activeSheetId);
      if (!s) return prev;
      const newCells: Record<string, CellData> = {};
      Object.entries(s.cells).forEach(([key, cell]) => {
        const [r, c] = key.split(',').map(Number);
        if (c === targetCol) {
          // Deleted
        } else if (c > targetCol) {
          newCells[`${r},${c - 1}`] = cell;
        } else {
          newCells[key] = cell;
        }
      });
      s.cells = newCells;
      return next;
    });
  }, [workbook, pushHistory]);

  const handleAskAIAboutCell = useCallback((row: number, col: number) => {
    setSelectedRange({ startRow: row, startCol: col, endRow: row, endCol: col });
    setIsAIChatOpen(true);
  }, []);

  // Conditional Formatting
  const handleApplyConditionalFormat = useCallback(
    (rule: {
      type: 'greaterThan' | 'lessThan' | 'equal' | 'duplicate';
      value: string;
      style: { backgroundColor: string; textColor: string };
    }) => {
      pushHistory(workbook);
      const minR = Math.min(selectedRange.startRow, selectedRange.endRow);
      const maxR = Math.max(selectedRange.startRow, selectedRange.endRow);
      const minC = Math.min(selectedRange.startCol, selectedRange.endCol);
      const maxC = Math.max(selectedRange.startCol, selectedRange.endCol);

      setWorkbook(prevWb => {
        const nextWb = JSON.parse(JSON.stringify(prevWb)) as WorkbookData;
        const targetSheet = nextWb.sheets.find(s => s.id === prevWb.activeSheetId);
        if (!targetSheet) return prevWb;

        const targetVal = parseFloat(rule.value);

        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            const key = `${r},${c}`;
            const cell = targetSheet.cells[key];
            if (!cell || cell.rawValue === null) continue;

            const num =
              typeof cell.rawValue === 'number'
                ? cell.rawValue
                : parseFloat(String(cell.rawValue));
            let matches = false;

            if (rule.type === 'greaterThan' && !isNaN(num) && !isNaN(targetVal)) {
              matches = num > targetVal;
            } else if (rule.type === 'lessThan' && !isNaN(num) && !isNaN(targetVal)) {
              matches = num < targetVal;
            } else if (rule.type === 'equal') {
              matches = String(cell.rawValue).trim() === rule.value.trim();
            }

            if (matches) {
              cell.style = {
                ...(cell.style || {}),
                backgroundColor: rule.style.backgroundColor,
                textColor: rule.style.textColor,
              };
            }
          }
        }
        return nextWb;
      });
    },
    [workbook, selectedRange, pushHistory]
  );

  // Data Validation
  const handleApplyDataValidation = useCallback(
    (validation: { type: 'list' | 'number'; values?: string[]; min?: number; max?: number }) => {
      pushHistory(workbook);
      // Validates and saves metadata
    },
    [workbook, pushHistory]
  );

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'h')) {
        e.preventDefault();
        setIsFindReplaceOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleExportXLSX();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrint();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        // Only if not currently in an input/textarea
        if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
        e.preventDefault();
        handleCopy();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
        e.preventDefault();
        handleCut();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
        e.preventDefault();
        handlePaste();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleUndo, handleRedo, handleCopy, handleCut, handlePaste, handleExportXLSX]);

  // Safe Remediation Actions
  const handleApplyFix = (finding: AuditFinding) => {
    if (finding.suggestedValue !== undefined) {
      handleUpdateCell(finding.row, finding.col, finding.suggestedValue);
      setAuditFindings(prev => prev.filter(f => f.id !== finding.id));
    }
  };

  const handleSkipFinding = (finding: AuditFinding) => {
    setAuditFindings(prev => prev.filter(f => f.id !== finding.id));
  };

  const handleBatchApplyAll = () => {
    const updates: { row: number; col: number; val: any }[] = [];
    auditFindings.forEach(f => {
      if (f.suggestedValue !== undefined && f.status === 'pending') {
        updates.push({ row: f.row, col: f.col, val: f.suggestedValue });
      }
    });

    if (updates.length > 0) {
      handleBatchUpdateCells(updates);
      setAuditFindings([]);
    }
  };

  // Agent conversational queries
  const handleAgentQuery = async (query: string): Promise<string> => {
    const res = await agent.processQuery(query, workbook, activeSheet, selectedRange);
    if (res.findings && res.findings.length > 0) {
      setAuditFindings(res.findings);
      setIsAuditPanelOpen(true);
    }
    if (res.targetCells && res.targetCells.length > 0) {
      const first = res.targetCells[0];
      setSelectedRange({ startRow: first.row, startCol: first.col, endRow: first.row, endCol: first.col });
    }
    if (res.formulaToInsert) {
      pushHistory(workbook);
      handleUpdateCell(res.formulaToInsert.row, res.formulaToInsert.col, 0, res.formulaToInsert.formula);
      setSelectedRange({ startRow: res.formulaToInsert.row, startCol: res.formulaToInsert.col, endRow: res.formulaToInsert.row, endCol: res.formulaToInsert.row });
    }
    return lang === 'ar' ? res.messageAr : res.messageEn;
  };

  // Active cell data for formula bar
  const activeCellKey = `${selectedRange.startRow},${selectedRange.startCol}`;
  const activeCell = activeSheet.cells[activeCellKey];
  const activeCellValue = activeCell
    ? activeCell.formula || (activeCell.rawValue !== null ? String(activeCell.rawValue) : '')
    : '';

  const totalCellsCount = Object.keys(activeSheet.cells).length;

  return (
    <div
      dir={direction}
      className="flex flex-col h-screen w-screen bg-slate-100 font-sans text-slate-900 overflow-hidden select-none"
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls, .csv"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Top Application Bar */}
      <header className="h-9 bg-slate-900 text-white flex items-center justify-between px-3 text-xs border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 font-bold tracking-tight text-white whitespace-nowrap">
            <div className="w-5 h-5 bg-emerald-600 rounded flex items-center justify-center font-black text-white text-xs">
              D
            </div>
            <span>DataAudit AI Pro</span>
          </div>

          <div className="h-4 w-[1px] bg-slate-700" />

          {/* Current File Name */}
          <span className="font-mono text-slate-300 text-[11px] truncate max-w-xs font-medium">
            {workbook.name}
          </span>

          <div className="h-4 w-[1px] bg-slate-700 hidden sm:block" />

          {/* Quick Access Toolbar */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleExportXLSX}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
              title={t.saveFile}
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
            </button>
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 rounded transition"
              title={t.undo}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={future.length === 0}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 rounded transition"
              title={t.redo}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handlePrint}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition hidden sm:inline-block"
              title={t.printSheet}
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Tools: Audit findings badge, Language Toggle */}
        <div className="flex items-center gap-2">
          {/* PWA Install Button */}
          <PWAInstallButton lang={lang} />

          {/* Audit Badge Button */}
          <button
            onClick={() => setIsAuditPanelOpen(!isAuditPanelOpen)}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 transition ${
              auditFindings.length > 0
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Toggle Audit Panel"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-slate-950" />
            <span>
              {auditFindings.length} {lang === 'ar' ? 'ملاحظة تدقيق' : 'findings'}
            </span>
          </button>

          {/* Language Toggle (AR / EN) */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium transition"
            title="Toggle Language (العربية / English)"
          >
            <Globe className="w-3 h-3 text-emerald-400" />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>
        </div>
      </header>

      {/* Ribbon Navigation */}
      <Ribbon
        lang={lang}
        activeTab={activeRibbonTab}
        setActiveTab={setActiveRibbonTab}
        onNew={handleNewWorkbook}
        onOpen={handleOpenFileClick}
        onOpenBenchmark={() => setIsBenchmarkOpen(true)}
        onSave={handleExportXLSX}
        onExportXLSX={handleExportXLSX}
        onExportCSV={handleExportCSV}
        onPrint={handlePrint}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.length > 0}
        canRedo={future.length > 0}
        onCut={handleCut}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onFormatPainter={() => {
          if (activeCell?.style) setFormatPainterStyle(activeCell.style);
        }}
        isFormatPainterActive={Boolean(formatPainterStyle)}
        onToggleBold={() => applyCellStyle({ bold: !activeCell?.style?.bold })}
        onToggleItalic={() => applyCellStyle({ italic: !activeCell?.style?.italic })}
        onToggleUnderline={() => applyCellStyle({ underline: !activeCell?.style?.underline })}
        onSetFontSize={size => applyCellStyle({ fontSize: size })}
        onSetTextColor={color => applyCellStyle({ textColor: color })}
        onSetFillColor={color => applyCellStyle({ backgroundColor: color })}
        onSetAlign={align => applyCellStyle({ align })}
        onToggleWrapText={() => applyCellStyle({ wrapText: !activeCell?.style?.wrapText })}
        onMergeCells={handleMergeCells}
        onSetNumberFormat={format => applyCellStyle({ format })}
        onAutoSum={handleAutoSum}
        onSort={handleSort}
        onFilter={() => handleRunAudit()}
        onOpenInsertChart={type => setChartModal({ isOpen: true, type })}
        onOpenInsertFunction={() => setIsInsertFuncOpen(true)}
        onRunAudit={handleRunAudit}
        onToggleAIChat={() => setIsAIChatOpen(!isAIChatOpen)}
        onFreezeTopRow={handleFreezeTopRow}
        onUnfreeze={handleUnfreeze}
        onSetZoom={setZoom}
        currentZoom={zoom}
        onShowAuditReport={() => setIsReportOpen(true)}
        findingsCount={auditFindings.length}
        onOpenFindReplace={() => setIsFindReplaceOpen(true)}
        onOpenDataValidation={() => setIsDataValidationOpen(true)}
        onOpenConditionalFormatting={() => setIsConditionalFormatOpen(true)}
        onOpenBackupManager={() => setIsBackupManagerOpen(true)}
        onOpenCompareVersions={() => setIsCompareVersionsOpen(true)}
        onOpenPivotTable={() => setIsPivotTableOpen(true)}
        onOpenSqlConsole={() => setIsSqlConsoleOpen(true)}
      />

      {/* Formula Bar */}
      <FormulaBar
        selectedRange={selectedRange}
        activeSheet={activeSheet}
        cellValue={activeCellValue}
        onCommitValue={val => handleUpdateCell(selectedRange.startRow, selectedRange.startCol, val, val.startsWith('=') ? val : undefined)}
        onSelectCell={(r, c) => setSelectedRange({ startRow: r, startCol: c, endRow: r, endCol: c })}
        onOpenInsertFunction={() => setIsInsertFuncOpen(true)}
      />

      {/* Grid & Side Panels Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        <SpreadsheetGrid
          sheet={activeSheet}
          activeSheetId={workbook.activeSheetId}
          selectedRange={selectedRange}
          onSelectRange={range => {
            setSelectedRange(range);
            if (formatPainterStyle) {
              applyCellStyle(formatPainterStyle);
              setFormatPainterStyle(null);
            }
          }}
          onUpdateCell={handleUpdateCell}
          onBatchUpdateCells={handleBatchUpdateCells}
          auditFindings={auditFindings}
          onSelectFinding={f => {
            setSelectedRange({ startRow: f.row, startCol: f.col, endRow: f.row, endCol: f.col });
            setIsAuditPanelOpen(true);
          }}
          zoom={zoom}
          direction={direction}
          lang={lang}
          onResizeCol={(col, w) => {
            setWorkbook(prev => {
              const next = { ...prev };
              const s = next.sheets.find(x => x.id === next.activeSheetId);
              if (s) s.colWidths[col] = w;
              return next;
            });
          }}
          onResizeRow={(row, h) => {
            setWorkbook(prev => {
              const next = { ...prev };
              const s = next.sheets.find(x => x.id === next.activeSheetId);
              if (s) s.rowHeights[row] = h;
              return next;
            });
          }}
          onCut={handleCut}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onInsertRow={handleInsertRow}
          onDeleteRow={handleDeleteRow}
          onInsertCol={handleInsertCol}
          onDeleteCol={handleDeleteCol}
          onAskAIAboutCell={handleAskAIAboutCell}
        />

        {/* Audit Side Panel */}
        {isAuditPanelOpen && (
          <AuditPanel
            findings={auditFindings}
            onApplyFix={handleApplyFix}
            onSkipFinding={handleSkipFinding}
            onBatchApplyAll={handleBatchApplyAll}
            onSelectCell={(sheetId, r, c) => {
              setSelectedRange({ startRow: r, startCol: c, endRow: r, endCol: c });
            }}
            lang={lang}
            onClose={() => setIsAuditPanelOpen(false)}
          />
        )}
      </div>

      {/* Sheets Navigation Bar */}
      <SheetsBar
        sheets={workbook.sheets}
        activeSheetId={workbook.activeSheetId}
        onSelectSheet={id => setWorkbook(prev => ({ ...prev, activeSheetId: id }))}
        onAddSheet={() => {
          pushHistory(workbook);
          const newSheetNum = workbook.sheets.length + 1;
          const newSheet: WorksheetData = {
            id: `sheet-${Date.now()}`,
            name: `${lang === 'ar' ? 'ورقة' : 'Sheet'}${newSheetNum}`,
            cells: {},
            rowCount: 50,
            colCount: 20,
            colWidths: {},
            rowHeights: {},
            mergedCells: [],
            freezeRows: 1,
          };
          setWorkbook(prev => ({
            ...prev,
            sheets: [...prev.sheets, newSheet],
            activeSheetId: newSheet.id,
          }));
        }}
        onRenameSheet={(id, newName) => {
          setWorkbook(prev => ({
            ...prev,
            sheets: prev.sheets.map(s => (s.id === id ? { ...s, name: newName } : s)),
          }));
        }}
        onDeleteSheet={id => {
          if (workbook.sheets.length <= 1) return;
          pushHistory(workbook);
          setWorkbook(prev => {
            const nextSheets = prev.sheets.filter(s => s.id !== id);
            return {
              ...prev,
              sheets: nextSheets,
              activeSheetId: nextSheets[0].id,
            };
          });
        }}
        zoom={zoom}
        onSetZoom={setZoom}
        lang={lang}
        totalCellsCount={totalCellsCount}
      />

      {/* AI Assistant Conversational Drawer */}
      <AIChatDrawer
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        lang={lang}
        onSendQuery={handleAgentQuery}
      />

      {/* Dialogs */}
      <ChartDialog
        isOpen={chartModal.isOpen}
        onClose={() => setChartModal({ isOpen: false, type: 'column' })}
        type={chartModal.type}
        sheet={activeSheet}
        selection={selectedRange}
        lang={lang}
      />

      <InsertFunctionDialog
        isOpen={isInsertFuncOpen}
        onClose={() => setIsInsertFuncOpen(false)}
        onSelectFunction={syntax => {
          handleUpdateCell(selectedRange.startRow, selectedRange.startCol, 0, syntax);
        }}
        lang={lang}
      />

      <AuditReportDialog
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        workbook={workbook}
        findings={auditFindings}
        lang={lang}
      />

      <BenchmarkDialog
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
        lang={lang}
      />

      <FindReplaceDialog
        isOpen={isFindReplaceOpen}
        onClose={() => setIsFindReplaceOpen(false)}
        sheet={activeSheet}
        onSelectCell={(r, c) => {
          setSelectedRange({ startRow: r, startCol: c, endRow: r, endCol: c });
        }}
        onUpdateCell={(r, c, val) => handleUpdateCell(r, c, val)}
        lang={lang}
      />

      <ConditionalFormattingDialog
        isOpen={isConditionalFormatOpen}
        onClose={() => setIsConditionalFormatOpen(false)}
        onApplyRule={handleApplyConditionalFormat}
        lang={lang}
      />

      <DataValidationDialog
        isOpen={isDataValidationOpen}
        onClose={() => setIsDataValidationOpen(false)}
        onApplyValidation={handleApplyDataValidation}
        lang={lang}
      />

      <BackupManagerDialog
        isOpen={isBackupManagerOpen}
        onClose={() => setIsBackupManagerOpen(false)}
        currentWorkbook={workbook}
        onRestoreWorkbook={wb => {
          pushHistory(workbook);
          setWorkbook(wb);
        }}
        lang={lang}
      />

      <VersionCompareDialog
        isOpen={isCompareVersionsOpen}
        onClose={() => setIsCompareVersionsOpen(false)}
        currentWorkbook={workbook}
        activeSheet={activeSheet}
        onSelectCell={(r, c) => {
          setSelectedRange({ startRow: r, startCol: c, endRow: r, endCol: c });
        }}
        onApplyCellPatch={(r, c, val, formula) => handleUpdateCell(r, c, val, formula)}
        lang={lang}
      />

      <PivotTableDialog
        isOpen={isPivotTableOpen}
        onClose={() => setIsPivotTableOpen(false)}
        activeSheet={activeSheet}
        onInsertAsNewSheet={handleInsertPivotSheet}
      />

      <SqlConsoleDialog
        isOpen={isSqlConsoleOpen}
        onClose={() => setIsSqlConsoleOpen(false)}
        activeSheet={activeSheet}
        sheets={workbook.sheets}
      />

      <OfflineIndicator lang={lang} />
    </div>
  );
}
