/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Scissors,
  Copy,
  Clipboard,
  Plus,
  Trash2,
  Edit3,
  Sparkles,
} from 'lucide-react';
import {
  WorksheetData,
  CellData,
  SelectionRange,
  AuditFinding,
  LanguageCode,
} from '../../types/index.ts';
import {
  colIndexToLetter,
  coordsToRef,
  formatCellValue,
  adjustFormulaReferences,
} from '../../core/formula/cellUtils.ts';

interface SpreadsheetGridProps {
  sheet: WorksheetData;
  activeSheetId: string;
  selectedRange: SelectionRange;
  onSelectRange: (range: SelectionRange) => void;
  onUpdateCell: (row: number, col: number, rawVal: any, formula?: string) => void;
  onBatchUpdateCells: (updates: { row: number; col: number; val: any; formula?: string }[]) => void;
  auditFindings: AuditFinding[];
  onSelectFinding: (finding: AuditFinding) => void;
  zoom: number;
  direction: 'rtl' | 'ltr';
  lang: LanguageCode;
  onResizeCol: (col: number, width: number) => void;
  onResizeRow?: (row: number, height: number) => void;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onInsertRow?: (rowIndex: number) => void;
  onDeleteRow?: (rowIndex: number) => void;
  onInsertCol?: (colIndex: number) => void;
  onDeleteCol?: (colIndex: number) => void;
  onAskAIAboutCell?: (row: number, col: number) => void;
}

export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  sheet,
  activeSheetId,
  selectedRange,
  onSelectRange,
  onUpdateCell,
  onBatchUpdateCells,
  auditFindings,
  onSelectFinding,
  zoom,
  direction,
  lang,
  onResizeCol,
  onResizeRow,
  onCut,
  onCopy,
  onPaste,
  onInsertRow,
  onDeleteRow,
  onInsertCol,
  onDeleteCol,
  onAskAIAboutCell,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editText, setEditText] = useState('');
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [isDraggingColHeader, setIsDraggingColHeader] = useState(false);
  const [isDraggingRowHeader, setIsDraggingRowHeader] = useState(false);
  const [isDraggingFillHandle, setIsDraggingFillHandle] = useState(false);
  const [fillEndCoord, setFillEndCoord] = useState<{ row: number; col: number } | null>(null);

  // Column & row resizing state
  const [resizingCol, setResizingCol] = useState<{ col: number; startX: number; startWidth: number } | null>(null);
  const [resizingRow, setResizingRow] = useState<{ row: number; startY: number; startHeight: number } | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; row: number; col: number } | null>(null);

  // Findings Map for instant cell lookup
  const findingsMap = useRef<Map<string, AuditFinding>>(new Map());
  useEffect(() => {
    const map = new Map<string, AuditFinding>();
    auditFindings.forEach(f => {
      if (f.sheetId === sheet.id) {
        map.set(`${f.row},${f.col}`, f);
      }
    });
    findingsMap.current = map;
  }, [auditFindings, sheet.id]);

  const defaultColWidth = 110;
  const defaultRowHeight = 26;

  const getColWidth = useCallback((c: number) => {
    return sheet.colWidths[c] || defaultColWidth;
  }, [sheet.colWidths]);

  const getRowHeight = useCallback((r: number) => {
    return sheet.rowHeights[r] || defaultRowHeight;
  }, [sheet.rowHeights]);

  // Handle cell click / selection
  const handleCellMouseDown = (row: number, col: number, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    if (editingCell) {
      const ref = coordsToRef(row, col);
      setEditText(prev => prev + ref);
      e.stopPropagation();
      return;
    }
    setEditingCell(null);
    setIsDraggingSelection(true);
    onSelectRange({ startRow: row, startCol: col, endRow: row, endCol: col });
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    if (isDraggingSelection) {
      onSelectRange({
        startRow: selectedRange.startRow,
        startCol: selectedRange.startCol,
        endRow: row,
        endCol: col,
      });
    } else if (isDraggingFillHandle) {
      setFillEndCoord({ row, col });
    }
  };

  // Mouse up to end dragging
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDraggingSelection) {
        setIsDraggingSelection(false);
      }
      if (isDraggingColHeader) {
        setIsDraggingColHeader(false);
      }
      if (isDraggingRowHeader) {
        setIsDraggingRowHeader(false);
      }
      if (isDraggingFillHandle && fillEndCoord) {
        executeFillHandle(fillEndCoord);
        setIsDraggingFillHandle(false);
        setFillEndCoord(null);
      }
      if (resizingCol) {
        setResizingCol(null);
      }
      if (resizingRow) {
        setResizingRow(null);
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDraggingSelection, isDraggingColHeader, isDraggingRowHeader, isDraggingFillHandle, fillEndCoord, resizingCol, resizingRow]);

  // Comprehensive drag tracking and smooth auto-scrolling for mouse and touch
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);
  const isAnyDragging = isDraggingSelection || isDraggingFillHandle || isDraggingColHeader || isDraggingRowHeader;

  useEffect(() => {
    const handleTouchEnd = () => {
      if (isDraggingSelection) setIsDraggingSelection(false);
      if (isDraggingColHeader) setIsDraggingColHeader(false);
      if (isDraggingRowHeader) setIsDraggingRowHeader(false);
      if (isDraggingFillHandle && fillEndCoord) {
        executeFillHandle(fillEndCoord);
        setIsDraggingFillHandle(false);
        setFillEndCoord(null);
      }
    };

    window.addEventListener('touchend', handleTouchEnd);
    return () => window.removeEventListener('touchend', handleTouchEnd);
  }, [isDraggingSelection, isDraggingColHeader, isDraggingRowHeader, isDraggingFillHandle, fillEndCoord]);

  useEffect(() => {
    if (!isAnyDragging) {
      mousePosRef.current = null;
      return;
    }

    const updateDragTargetFromPoint = (x: number, y: number) => {
      const targetEl = document.elementFromPoint(x, y);
      if (!targetEl) return;
      const cellEl = targetEl.closest('[data-grid-cell]');
      if (cellEl) {
        const rStr = (cellEl as HTMLElement).dataset.row;
        const cStr = (cellEl as HTMLElement).dataset.col;
        if (rStr !== undefined && cStr !== undefined) {
          const r = parseInt(rStr, 10);
          const c = parseInt(cStr, 10);
          if (isDraggingSelection) {
            onSelectRange({
              startRow: selectedRange.startRow,
              startCol: selectedRange.startCol,
              endRow: r,
              endCol: c,
            });
          } else if (isDraggingFillHandle) {
            setFillEndCoord({ row: r, col: c });
          }
        }
      } else {
        const colHeaderEl = targetEl.closest('[data-col-header]');
        if (colHeaderEl && isDraggingColHeader) {
          const cStr = (colHeaderEl as HTMLElement).dataset.col;
          if (cStr !== undefined) {
            const c = parseInt(cStr, 10);
            onSelectRange({
              startRow: 0,
              startCol: selectedRange.startCol,
              endRow: sheet.rowCount - 1,
              endCol: c,
            });
          }
        }
        const rowHeaderEl = targetEl.closest('[data-row-header]');
        if (rowHeaderEl && isDraggingRowHeader) {
          const rStr = (rowHeaderEl as HTMLElement).dataset.row;
          if (rStr !== undefined) {
            const r = parseInt(rStr, 10);
            onSelectRange({
              startRow: selectedRange.startRow,
              startCol: 0,
              endRow: r,
              endCol: sheet.colCount - 1,
            });
          }
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
      updateDragTargetFromPoint(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!e.touches || e.touches.length === 0) return;
      const touch = e.touches[0];
      mousePosRef.current = { x: touch.clientX, y: touch.clientY };
      updateDragTargetFromPoint(touch.clientX, touch.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    let animationFrameId: number;
    const scrollStep = () => {
      if (containerRef.current && mousePosRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const { x, y } = mousePosRef.current;
        const threshold = 50;
        let scrolled = false;

        if (x < rect.left + threshold) {
          const speed = Math.min(30, (rect.left + threshold - x) * 0.6);
          containerRef.current.scrollLeft -= speed;
          scrolled = true;
        } else if (x > rect.right - threshold) {
          const speed = Math.min(30, (x - (rect.right - threshold)) * 0.6);
          containerRef.current.scrollLeft += speed;
          scrolled = true;
        }

        if (y < rect.top + threshold) {
          const speed = Math.min(30, (rect.top + threshold - y) * 0.6);
          containerRef.current.scrollTop -= speed;
          scrolled = true;
        } else if (y > rect.bottom - threshold) {
          const speed = Math.min(30, (y - (rect.bottom - threshold)) * 0.6);
          containerRef.current.scrollTop += speed;
          scrolled = true;
        }

        if (scrolled) {
          updateDragTargetFromPoint(x, y);
        }
      }
      animationFrameId = requestAnimationFrame(scrollStep);
    };

    animationFrameId = requestAnimationFrame(scrollStep);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isAnyDragging, isDraggingSelection, isDraggingFillHandle, isDraggingColHeader, isDraggingRowHeader, selectedRange, onSelectRange, sheet.rowCount, sheet.colCount]);

  // Execute fill handle (auto-fill & relative formula dragging in all 4 directions)
  const executeFillHandle = (target: { row: number; col: number }) => {
    const minR = Math.min(selectedRange.startRow, selectedRange.endRow);
    const maxR = Math.max(selectedRange.startRow, selectedRange.endRow);
    const minC = Math.min(selectedRange.startCol, selectedRange.endCol);
    const maxC = Math.max(selectedRange.startCol, selectedRange.endCol);

    const updates: { row: number; col: number; val: any; formula?: string }[] = [];

    // Dragging downwards
    if (target.row > maxR) {
      const sourceRowCount = maxR - minR + 1;
      for (let r = maxR + 1; r <= target.row; r++) {
        const offset = r - maxR;
        const sourceR = minR + ((r - maxR - 1) % sourceRowCount);
        for (let c = minC; c <= maxC; c++) {
          const sourceCell = sheet.cells[`${sourceR},${c}`];
          if (sourceCell) {
            if (sourceCell.formula) {
              const adjustedFormula = adjustFormulaReferences(sourceCell.formula, offset, 0);
              updates.push({ row: r, col: c, val: sourceCell.rawValue, formula: adjustedFormula });
            } else {
              let newVal = sourceCell.rawValue;
              if (typeof sourceCell.rawValue === 'number') {
                newVal = sourceCell.rawValue + offset;
              }
              updates.push({ row: r, col: c, val: newVal });
            }
          }
        }
      }
    }
    // Dragging upwards
    else if (target.row < minR) {
      const sourceRowCount = maxR - minR + 1;
      for (let r = target.row; r < minR; r++) {
        const offset = r - minR;
        const sourceR = maxR - ((minR - 1 - r) % sourceRowCount);
        for (let c = minC; c <= maxC; c++) {
          const sourceCell = sheet.cells[`${sourceR},${c}`];
          if (sourceCell) {
            if (sourceCell.formula) {
              const adjustedFormula = adjustFormulaReferences(sourceCell.formula, offset, 0);
              updates.push({ row: r, col: c, val: sourceCell.rawValue, formula: adjustedFormula });
            } else {
              let newVal = sourceCell.rawValue;
              if (typeof sourceCell.rawValue === 'number') {
                newVal = sourceCell.rawValue + offset;
              }
              updates.push({ row: r, col: c, val: newVal });
            }
          }
        }
      }
    }
    // Dragging rightwards
    else if (target.col > maxC) {
      const sourceColCount = maxC - minC + 1;
      for (let c = maxC + 1; c <= target.col; c++) {
        const offset = c - maxC;
        const sourceC = minC + ((c - maxC - 1) % sourceColCount);
        for (let r = minR; r <= maxR; r++) {
          const sourceCell = sheet.cells[`${r},${sourceC}`];
          if (sourceCell) {
            if (sourceCell.formula) {
              const adjustedFormula = adjustFormulaReferences(sourceCell.formula, 0, offset);
              updates.push({ row: r, col: c, val: sourceCell.rawValue, formula: adjustedFormula });
            } else {
              let newVal = sourceCell.rawValue;
              if (typeof sourceCell.rawValue === 'number') {
                newVal = sourceCell.rawValue + offset;
              }
              updates.push({ row: r, col: c, val: newVal });
            }
          }
        }
      }
    }
    // Dragging leftwards
    else if (target.col < minC) {
      const sourceColCount = maxC - minC + 1;
      for (let c = target.col; c < minC; c++) {
        const offset = c - minC;
        const sourceC = maxC - ((minC - 1 - c) % sourceColCount);
        for (let r = minR; r <= maxR; r++) {
          const sourceCell = sheet.cells[`${r},${sourceC}`];
          if (sourceCell) {
            if (sourceCell.formula) {
              const adjustedFormula = adjustFormulaReferences(sourceCell.formula, 0, offset);
              updates.push({ row: r, col: c, val: sourceCell.rawValue, formula: adjustedFormula });
            } else {
              let newVal = sourceCell.rawValue;
              if (typeof sourceCell.rawValue === 'number') {
                newVal = sourceCell.rawValue + offset;
              }
              updates.push({ row: r, col: c, val: newVal });
            }
          }
        }
      }
    }

    if (updates.length > 0) {
      onBatchUpdateCells(updates);
    }
  };

  // Double click to start inline edit
  const handleCellDoubleClick = (row: number, col: number) => {
    const cell = sheet.cells[`${row},${col}`];
    const initialText = cell ? (cell.formula || (cell.rawValue !== null ? String(cell.rawValue) : '')) : '';
    setEditingCell({ row, col });
    setEditText(initialText);
  };

  const commitEdit = () => {
    if (!editingCell) return;
    const { row, col } = editingCell;
    const trimmed = editText.trim();

    if (trimmed.startsWith('=')) {
      onUpdateCell(row, col, 0, trimmed);
    } else {
      const num = parseFloat(trimmed);
      const isNum = !isNaN(num) && /^-?\d+(\.\d+)?$/.test(trimmed);
      onUpdateCell(row, col, isNum ? num : trimmed === '' ? null : trimmed);
    }

    setEditingCell(null);
  };

  // Keyboard navigation & direct typing
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editingCell) {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit();
        // Move selection down
        const nextR = Math.min(sheet.rowCount - 1, editingCell.row + 1);
        onSelectRange({ startRow: nextR, startCol: editingCell.col, endRow: nextR, endCol: editingCell.col });
      } else if (e.key === 'Tab') {
        e.preventDefault();
        commitEdit();
        // Move selection right/left
        const nextC = Math.min(sheet.colCount - 1, editingCell.col + 1);
        onSelectRange({ startRow: editingCell.row, startCol: nextC, endRow: editingCell.row, endCol: nextC });
      } else if (e.key === 'Escape') {
        setEditingCell(null);
      }
      return;
    }

    const minR = Math.min(selectedRange.startRow, selectedRange.endRow);
    const minC = Math.min(selectedRange.startCol, selectedRange.endCol);

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (minR > 0) onSelectRange({ startRow: minR - 1, startCol: minC, endRow: minR - 1, endCol: minC });
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (minR < sheet.rowCount - 1) onSelectRange({ startRow: minR + 1, startCol: minC, endRow: minR + 1, endCol: minC });
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (minC > 0) onSelectRange({ startRow: minR, startCol: minC - 1, endRow: minR, endCol: minC - 1 });
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (minC < sheet.colCount - 1) onSelectRange({ startRow: minR, startCol: minC + 1, endRow: minR, endCol: minC + 1 });
        break;
      case 'Enter':
      case 'F2':
        e.preventDefault();
        handleCellDoubleClick(minR, minC);
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        onUpdateCell(minR, minC, null);
        break;
      default:
        // Start typing directly if printable key
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          setEditingCell({ row: minR, col: minC });
          setEditText(e.key);
        }
        break;
    }
  };

  // Column & row resizing mouse & touch drag
  const handleColResizeMouseDown = (col: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingCol({ col, startX: e.clientX, startWidth: getColWidth(col) });
  };

  const handleColResizeTouchStart = (col: number, e: React.TouchEvent) => {
    e.stopPropagation();
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    setResizingCol({ col, startX: touch.clientX, startWidth: getColWidth(col) });
  };

  const handleRowResizeMouseDown = (row: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingRow({ row, startY: e.clientY, startHeight: getRowHeight(row) });
  };

  const handleRowResizeTouchStart = (row: number, e: React.TouchEvent) => {
    e.stopPropagation();
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    setResizingRow({ row, startY: touch.clientY, startHeight: getRowHeight(row) });
  };

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (resizingCol) {
        const delta = direction === 'rtl' ? resizingCol.startX - clientX : clientX - resizingCol.startX;
        const newWidth = Math.max(35, resizingCol.startWidth + delta);
        onResizeCol(resizingCol.col, newWidth);
      }
      if (resizingRow && onResizeRow) {
        const delta = clientY - resizingRow.startY;
        const newHeight = Math.max(18, resizingRow.startHeight + delta);
        onResizeRow(resizingRow.row, newHeight);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!e.touches || e.touches.length === 0) return;
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleEnd = () => {
      setResizingCol(null);
      setResizingRow(null);
    };

    if (resizingCol || resizingRow) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [resizingCol, resizingRow, direction, onResizeCol, onResizeRow]);

  // Context Menu
  const handleContextMenu = (row: number, col: number, e: React.MouseEvent) => {
    e.preventDefault();
    onSelectRange({ startRow: row, startCol: col, endRow: row, endCol: col });
    setContextMenu({ x: e.clientX, y: e.clientY, row, col });
  };

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  // Selection bounding box calculation
  const selMinR = Math.min(selectedRange.startRow, selectedRange.endRow);
  const selMaxR = Math.max(selectedRange.startRow, selectedRange.endRow);
  const selMinC = Math.min(selectedRange.startCol, selectedRange.endCol);
  const selMaxC = Math.max(selectedRange.startCol, selectedRange.endCol);

  const visibleRowCount = Math.min(sheet.rowCount, 60);
  const visibleColCount = Math.min(sheet.colCount, 26);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="flex-1 overflow-auto bg-slate-200 outline-none select-none relative focus:ring-0"
      style={{
        transform: `scale(${zoom / 100})`,
        transformOrigin: direction === 'rtl' ? 'top right' : 'top left',
      }}
    >
      {resizingCol && (
        <div className="sticky top-2 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs px-3 py-1 rounded shadow-lg font-mono pointer-events-none">
          عرض العمود {colIndexToLetter(resizingCol.col)}: {getColWidth(resizingCol.col)} بكسل
        </div>
      )}
      {resizingRow && (
        <div className="sticky top-2 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs px-3 py-1 rounded shadow-lg font-mono pointer-events-none">
          ارتفاع الصف {resizingRow.row + 1}: {getRowHeight(resizingRow.row)} بكسل
        </div>
      )}
      <div className="inline-block min-w-full bg-white shadow-xs">
        {/* Top Header Row (Column Letters: A, B, C...) */}
        <div className="flex sticky top-0 z-20 bg-slate-100 border-b border-slate-300 font-semibold text-slate-700 text-xs">
          {/* Top-Left Corner Cell */}
          <div className="w-12 h-6 flex-shrink-0 bg-slate-200 border-r border-slate-300 flex items-center justify-center font-mono text-[10px] text-slate-500">
            ◢
          </div>

          {/* Column Headers */}
          {Array.from({ length: visibleColCount }).map((_, c) => {
            const width = getColWidth(c);
            const isColSelected = selMinC <= c && c <= selMaxC;

            return (
              <div
                key={`header-${c}`}
                data-col-header=""
                data-col={c}
                style={{ width }}
                onMouseDown={e => {
                  if (e.button !== 0) return;
                  setIsDraggingColHeader(true);
                  onSelectRange({ startRow: 0, startCol: c, endRow: sheet.rowCount - 1, endCol: c });
                }}
                onMouseEnter={() => {
                  if (isDraggingColHeader) {
                    onSelectRange({
                      startRow: 0,
                      startCol: selectedRange.startCol,
                      endRow: sheet.rowCount - 1,
                      endCol: c,
                    });
                  }
                }}
                className={`h-6 flex-shrink-0 border-r border-slate-300 flex items-center justify-center relative cursor-pointer font-mono text-[11px] transition-colors ${
                  isColSelected ? 'bg-emerald-100 text-emerald-900 font-bold' : 'hover:bg-slate-200/80'
                }`}
              >
                <span>{colIndexToLetter(c)}</span>

                {/* Resize Handle */}
                <div
                  onMouseDown={e => handleColResizeMouseDown(c, e)}
                  onTouchStart={e => handleColResizeTouchStart(c, e)}
                  onDoubleClick={() => onResizeCol(c, defaultColWidth)}
                  className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-emerald-500 active:bg-emerald-600 z-10"
                  title="سحب لتغيير عرض العمود (مزدوج لإعادة الضبط)"
                />
              </div>
            );
          })}
        </div>

        {/* Data Grid Rows */}
        {Array.from({ length: visibleRowCount }).map((_, r) => {
          const height = getRowHeight(r);
          const isRowSelected = selMinR <= r && r <= selMaxR;

          return (
            <div key={`row-${r}`} className="flex border-b border-slate-200/80">
              {/* Row Number Header */}
              <div
                key={`row-header-${r}`}
                data-row-header=""
                data-row={r}
                style={{ height }}
                onMouseDown={e => {
                  if (e.button !== 0) return;
                  setIsDraggingRowHeader(true);
                  onSelectRange({ startRow: r, startCol: 0, endRow: r, endCol: sheet.colCount - 1 });
                }}
                onMouseEnter={() => {
                  if (isDraggingRowHeader) {
                    onSelectRange({
                      startRow: selectedRange.startRow,
                      startCol: 0,
                      endRow: r,
                      endCol: sheet.colCount - 1,
                    });
                  }
                }}
                className={`w-12 flex-shrink-0 sticky left-0 z-10 border-r border-slate-300 flex items-center justify-center font-mono text-[11px] cursor-pointer transition-colors relative ${
                  isRowSelected ? 'bg-emerald-100 text-emerald-900 font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{r + 1}</span>
                <div
                  onMouseDown={e => handleRowResizeMouseDown(r, e)}
                  onTouchStart={e => handleRowResizeTouchStart(r, e)}
                  onDoubleClick={() => onResizeRow && onResizeRow(r, defaultRowHeight)}
                  className="absolute left-0 right-0 bottom-0 h-2 cursor-row-resize hover:bg-emerald-500 active:bg-emerald-600 z-10"
                  title="سحب لتغيير ارتفاع الصف (مزدوج لإعادة الضبط)"
                />
              </div>

              {/* Data Cells */}
              {Array.from({ length: visibleColCount }).map((_, c) => {
                const fillMinR = isDraggingFillHandle && fillEndCoord ? Math.min(selMinR, fillEndCoord.row) : selMinR;
                const fillMaxR = isDraggingFillHandle && fillEndCoord ? Math.max(selMaxR, fillEndCoord.row) : selMaxR;
                const fillMinC = isDraggingFillHandle && fillEndCoord ? Math.min(selMinC, fillEndCoord.col) : selMinC;
                const fillMaxC = isDraggingFillHandle && fillEndCoord ? Math.max(selMaxC, fillEndCoord.col) : selMaxC;

                const isFillPreview = isDraggingFillHandle && fillEndCoord &&
                  r >= fillMinR && r <= fillMaxR && c >= fillMinC && c <= fillMaxC &&
                  !(r >= selMinR && r <= selMaxR && c >= selMinC && c <= selMaxC);

                const width = getColWidth(c);
                const cell = sheet.cells[`${r},${c}`];
                const isSelected = selMinR <= r && r <= selMaxR && selMinC <= c && c <= selMaxC;
                const isPrimary = r === selectedRange.startRow && c === selectedRange.startCol;
                const isEditing = editingCell?.row === r && editingCell?.col === c;

                // Finding badge
                const finding = findingsMap.current.get(`${r},${c}`);

                // Visual styling
                const bold = cell?.style?.bold;
                const italic = cell?.style?.italic;
                const underline = cell?.style?.underline;
                const textColor = cell?.style?.textColor || '#0F172A';
                const bgColor = isFillPreview ? '#DCFCE7' : isSelected ? '#E0F2FE' : cell?.style?.backgroundColor || '#FFFFFF';
                const align = cell?.style?.align || (typeof cell?.rawValue === 'number' ? 'right' : 'left');

                const displayVal = cell
                  ? formatCellValue(cell.rawValue, cell.style?.format, cell.style?.decimalPlaces)
                  : '';

                return (
                  <div
                    key={`cell-${r}-${c}`}
                    data-grid-cell=""
                    data-row={r}
                    data-col={c}
                    style={{
                      width,
                      height,
                      backgroundColor: bgColor,
                      color: textColor,
                      textAlign: align,
                    }}
                    onMouseDown={e => handleCellMouseDown(r, c, e)}
                    onTouchStart={e => {
                      if (editingCell && (editingCell.row !== r || editingCell.col !== c)) {
                        commitEdit();
                      }
                      setEditingCell(null);
                      setIsDraggingSelection(true);
                      onSelectRange({ startRow: r, startCol: c, endRow: r, endCol: c });
                    }}
                    onMouseEnter={() => handleCellMouseEnter(r, c)}
                    onDoubleClick={() => handleCellDoubleClick(r, c)}
                    onContextMenu={e => handleContextMenu(r, c, e)}
                    className={`flex-shrink-0 border-r border-slate-200 px-1.5 flex items-center text-xs overflow-hidden text-ellipsis whitespace-nowrap relative select-none ${
                      isPrimary ? 'ring-2 ring-emerald-600 z-10' : isSelected ? 'bg-emerald-50/50' : ''
                    } ${isFillPreview ? 'border border-dashed border-emerald-500 bg-emerald-100/60' : ''} ${bold ? 'font-bold' : ''} ${italic ? 'italic' : ''} ${underline ? 'underline' : ''}`}
                  >
                    {/* Inline Editor */}
                    {isEditing ? (
                      <input
                        type="text"
                        autoFocus
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onBlur={commitEdit}
                        className="w-full h-full bg-white outline-none border border-emerald-600 px-1 font-mono text-xs z-30"
                      />
                    ) : (
                      <span className="w-full overflow-hidden text-ellipsis font-sans tabular-nums">
                        {displayVal}
                      </span>
                    )}

                    {/* Audit Indicator Flag */}
                    {finding && !isEditing && (
                      <div
                        onClick={e => {
                          e.stopPropagation();
                          onSelectFinding(finding);
                        }}
                        className={`absolute top-0 right-0 w-2.5 h-2.5 cursor-pointer z-10 ${
                          finding.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                        }`}
                        style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
                        title={`${finding.ruleTitle}: ${finding.explanation}`}
                      />
                    )}

                    {/* Fill Handle on Primary Bottom-Right Cell */}
                    {isSelected && r === selMaxR && c === selMaxC && !isEditing && (
                      <div
                        onMouseDown={e => {
                          e.stopPropagation();
                          setIsDraggingFillHandle(true);
                        }}
                        onTouchStart={e => {
                          e.stopPropagation();
                          setIsDraggingFillHandle(true);
                        }}
                        className="absolute bottom-[-4px] right-[-4px] w-3.5 h-3.5 bg-emerald-700 border border-white cursor-crosshair z-20 rounded-xs shadow-xs"
                        title="Auto Fill / Drag Formula"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Context Menu Modal */}
      {contextMenu && (
        <div
          style={{
            top: Math.min(contextMenu.y, window.innerHeight - 340),
            left: Math.min(contextMenu.x, window.innerWidth - 250),
          }}
          className="fixed bg-white border border-slate-300 rounded-lg shadow-xl py-1 z-50 text-xs w-56 text-slate-700 divide-y divide-slate-100"
        >
          <div className="py-1">
            <button
              onClick={() => {
                if (onCut) onCut();
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Scissors className="w-3.5 h-3.5 text-slate-500" />
                {lang === 'ar' ? 'قص' : 'Cut'}
              </span>
              <span className="text-[10px] text-slate-400">Ctrl+X</span>
            </button>
            <button
              onClick={() => {
                if (onCopy) onCopy();
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                {lang === 'ar' ? 'نسخ' : 'Copy'}
              </span>
              <span className="text-[10px] text-slate-400">Ctrl+C</span>
            </button>
            <button
              onClick={() => {
                if (onPaste) onPaste();
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Clipboard className="w-3.5 h-3.5 text-slate-500" />
                {lang === 'ar' ? 'لصق' : 'Paste'}
              </span>
              <span className="text-[10px] text-slate-400">Ctrl+V</span>
            </button>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                handleCellDoubleClick(contextMenu.row, contextMenu.col);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                {lang === 'ar' ? 'تحرير الخلية' : 'Edit Cell'}
              </span>
              <span className="text-[10px] text-slate-400">F2</span>
            </button>
            <button
              onClick={() => {
                onUpdateCell(contextMenu.row, contextMenu.col, null);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-rose-600 flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5" />
                {lang === 'ar' ? 'مسح المحتوى' : 'Clear Contents'}
              </span>
              <span className="text-[10px] text-slate-400">Del</span>
            </button>
          </div>

          <div className="py-1">
            {onInsertRow && (
              <button
                onClick={() => {
                  onInsertRow(contextMenu.row);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>{lang === 'ar' ? 'إدراج صف أعلاه' : 'Insert Row Above'}</span>
              </button>
            )}
            {onDeleteRow && (
              <button
                onClick={() => {
                  onDeleteRow(contextMenu.row);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-600"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{lang === 'ar' ? 'حذف هذا الصف' : 'Delete Row'}</span>
              </button>
            )}
            {onInsertCol && (
              <button
                onClick={() => {
                  onInsertCol(contextMenu.col);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>{lang === 'ar' ? 'إدراج عمود' : 'Insert Column'}</span>
              </button>
            )}
            {onDeleteCol && (
              <button
                onClick={() => {
                  onDeleteCol(contextMenu.col);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-600"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{lang === 'ar' ? 'حذف هذا العمود' : 'Delete Column'}</span>
              </button>
            )}
          </div>

          {onAskAIAboutCell && (
            <div className="py-1">
              <button
                onClick={() => {
                  onAskAIAboutCell(contextMenu.row, contextMenu.col);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-purple-50 flex items-center gap-2 text-purple-700 font-medium"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>{lang === 'ar' ? 'تحليل بالذكاء الاصطناعي' : 'Audit with AI'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
