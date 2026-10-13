/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  GitCompare,
  ArrowRightLeft,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Search,
  ExternalLink,
} from 'lucide-react';
import { WorkbookData, WorksheetData, LanguageCode } from '../../types/index.ts';
import { coordsToRef, formatCellValue } from '../../core/formula/cellUtils.ts';
import { FileService } from '../../services/fileService.ts';

interface VersionCompareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentWorkbook: WorkbookData;
  activeSheet: WorksheetData;
  onSelectCell: (row: number, col: number) => void;
  onApplyCellPatch?: (row: number, col: number, value: any, formula?: string) => void;
  lang: LanguageCode;
}

interface CellDiffItem {
  row: number;
  col: number;
  cellRef: string;
  valA: any;
  valB: any;
  formulaA?: string;
  formulaB?: string;
  diffType: 'modified' | 'added' | 'removed' | 'formulaChanged';
}

export const VersionCompareDialog: React.FC<VersionCompareDialogProps> = ({
  isOpen,
  onClose,
  currentWorkbook,
  activeSheet,
  onSelectCell,
  onApplyCellPatch,
  lang,
}) => {
  const [compareMode, setCompareMode] = useState<'sheet' | 'file'>('sheet');
  const [targetSheetId, setTargetSheetId] = useState<string>(() => {
    const other = currentWorkbook.sheets.find(s => s.id !== activeSheet.id);
    return other ? other.id : activeSheet.id;
  });
  const [uploadedWorkbook, setUploadedWorkbook] = useState<WorkbookData | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Target sheet for comparison
  const targetSheet = useMemo(() => {
    if (compareMode === 'sheet') {
      return currentWorkbook.sheets.find(s => s.id === targetSheetId) || activeSheet;
    } else {
      return uploadedWorkbook?.sheets[0] || null;
    }
  }, [compareMode, targetSheetId, currentWorkbook.sheets, activeSheet, uploadedWorkbook]);

  // Compute differences
  const diffs = useMemo<CellDiffItem[]>(() => {
    if (!targetSheet) return [];

    const result: CellDiffItem[] = [];
    const allKeys = new Set([
      ...Object.keys(activeSheet.cells),
      ...Object.keys(targetSheet.cells),
    ]);

    allKeys.forEach(key => {
      const cellA = activeSheet.cells[key];
      const cellB = targetSheet.cells[key];
      const [rStr, cStr] = key.split(',');
      const r = parseInt(rStr, 10);
      const c = parseInt(cStr, 10);
      const cellRef = coordsToRef(r, c);

      const valA = cellA ? cellA.rawValue : null;
      const valB = cellB ? cellB.rawValue : null;
      const formulaA = cellA?.formula;
      const formulaB = cellB?.formula;

      const hasValA = valA !== null && valA !== undefined && valA !== '';
      const hasValB = valB !== null && valB !== undefined && valB !== '';

      if (!hasValA && hasValB) {
        result.push({
          row: r,
          col: c,
          cellRef,
          valA: null,
          valB,
          formulaA,
          formulaB,
          diffType: 'removed',
        });
      } else if (hasValA && !hasValB) {
        result.push({
          row: r,
          col: c,
          cellRef,
          valA,
          valB: null,
          formulaA,
          formulaB,
          diffType: 'added',
        });
      } else if (hasValA && hasValB) {
        if (formulaA !== formulaB) {
          result.push({
            row: r,
            col: c,
            cellRef,
            valA,
            valB,
            formulaA,
            formulaB,
            diffType: 'formulaChanged',
          });
        } else if (String(valA) !== String(valB)) {
          result.push({
            row: r,
            col: c,
            cellRef,
            valA,
            valB,
            formulaA,
            formulaB,
            diffType: 'modified',
          });
        }
      }
    });

    // Sort by row then col
    return result.sort((a, b) => a.row - b.row || a.col - b.col);
  }, [activeSheet, targetSheet]);

  const filteredDiffs = useMemo(() => {
    return diffs.filter(d => {
      if (filterType !== 'all' && d.diffType !== filterType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const refMatch = d.cellRef.toLowerCase().includes(q);
        const aMatch = String(d.valA ?? '').toLowerCase().includes(q);
        const bMatch = String(d.valB ?? '').toLowerCase().includes(q);
        if (!refMatch && !aMatch && !bMatch) return false;
      }
      return true;
    });
  }, [diffs, filterType, searchQuery]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const wb = await FileService.importFile(file);
      setUploadedWorkbook(wb);
    } catch (err: any) {
      alert(`خطأ في قراءة ملف المقارنة: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold">
              {lang === 'ar'
                ? 'نظام مقارنة الملفات والإصدارات (Version & File Diff)'
                : 'Version & File Comparison'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source and Target Selection Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">
                {lang === 'ar' ? 'الإصدار أ (الورقة الحالية):' : 'Version A (Current):'}
              </span>
              <span className="px-2.5 py-1 bg-white border border-slate-300 rounded font-medium text-emerald-700">
                {activeSheet.name}
              </span>
            </div>

            <ArrowRightLeft className="w-4 h-4 text-slate-400" />

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">
                {lang === 'ar' ? 'المقارنة مع:' : 'Compare with:'}
              </span>
              <select
                value={compareMode}
                onChange={e => setCompareMode(e.target.value as any)}
                className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-medium"
              >
                <option value="sheet">
                  {lang === 'ar' ? 'ورقة عمل أخرى بالمصنف' : 'Another Sheet in Workbook'}
                </option>
                <option value="file">
                  {lang === 'ar' ? 'ملف XLSX خارجي للمقارنة' : 'External XLSX File'}
                </option>
              </select>

              {compareMode === 'sheet' ? (
                <select
                  value={targetSheetId}
                  onChange={e => setTargetSheetId(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                >
                  {currentWorkbook.sheets.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.id === activeSheet.id ? '(نفس الورقة)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <label className="cursor-pointer px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded flex items-center gap-1.5 transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {uploadedWorkbook ? uploadedWorkbook.name : lang === 'ar' ? 'رفع ملف XLSX' : 'Upload XLSX'}
                  </span>
                  <input
                    type="file"
                    accept=".xlsx, .csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-slate-200 text-slate-800 rounded font-bold">
              {diffs.length} {lang === 'ar' ? 'فروقات مكتشفة' : 'Diffs Found'}
            </span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-slate-500 mr-2">{lang === 'ar' ? 'تصفية الفروق:' : 'Filter:'}</span>
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-1 rounded ${filterType === 'all' ? 'bg-slate-800 text-white font-bold' : 'hover:bg-slate-100 text-slate-700'}`}
            >
              {lang === 'ar' ? 'الكل' : 'All'} ({diffs.length})
            </button>
            <button
              onClick={() => setFilterType('modified')}
              className={`px-2 py-1 rounded ${filterType === 'modified' ? 'bg-amber-600 text-white font-bold' : 'hover:bg-amber-50 text-amber-800'}`}
            >
              {lang === 'ar' ? 'قيم معدلة' : 'Modified'} (
              {diffs.filter(d => d.diffType === 'modified').length})
            </button>
            <button
              onClick={() => setFilterType('formulaChanged')}
              className={`px-2 py-1 rounded ${filterType === 'formulaChanged' ? 'bg-purple-600 text-white font-bold' : 'hover:bg-purple-50 text-purple-800'}`}
            >
              {lang === 'ar' ? 'صيغ متغيرة' : 'Formulas'} (
              {diffs.filter(d => d.diffType === 'formulaChanged').length})
            </button>
            <button
              onClick={() => setFilterType('added')}
              className={`px-2 py-1 rounded ${filterType === 'added' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-emerald-50 text-emerald-800'}`}
            >
              {lang === 'ar' ? 'بيانات مضافة' : 'Added'} (
              {diffs.filter(d => d.diffType === 'added').length})
            </button>
            <button
              onClick={() => setFilterType('removed')}
              className={`px-2 py-1 rounded ${filterType === 'removed' ? 'bg-red-600 text-white font-bold' : 'hover:bg-red-50 text-red-800'}`}
            >
              {lang === 'ar' ? 'بيانات محذوفة' : 'Removed'} (
              {diffs.filter(d => d.diffType === 'removed').length})
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder={lang === 'ar' ? 'بحث في الفروق...' : 'Search diffs...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-7 pr-2 py-1 border border-slate-300 rounded text-xs w-44 focus:outline-emerald-600"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
          </div>
        </div>

        {/* Diff Table List */}
        <div className="flex-1 overflow-y-auto p-4">
          {diffs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2" />
              <h4 className="font-bold text-slate-800">
                {lang === 'ar' ? 'تطابق تام بين الورقتين' : 'Perfect Match! No differences found.'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                {lang === 'ar'
                  ? 'جميع الخلايا والصيغ الحسابية متطابقة تماماً بين المصدر والهدف.'
                  : 'All cell values, formulas, and references are identical.'}
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 text-center w-16">{lang === 'ar' ? 'الخلية' : 'Cell'}</th>
                    <th className="p-2.5 w-24 text-center">{lang === 'ar' ? 'النوع' : 'Type'}</th>
                    <th className="p-2.5 w-1/3 bg-blue-50/50">
                      {lang === 'ar' ? 'القيمة في الإصدار أ (الحالي)' : 'Version A (Current)'}
                    </th>
                    <th className="p-2.5 w-1/3 bg-amber-50/50">
                      {lang === 'ar' ? 'القيمة في الإصدار ب (المقارن)' : 'Version B (Target)'}
                    </th>
                    <th className="p-2.5 text-center w-28">{lang === 'ar' ? 'الإجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDiffs.map((d, idx) => {
                    const badgeStyles = {
                      modified: 'bg-amber-100 text-amber-800 border-amber-300',
                      formulaChanged: 'bg-purple-100 text-purple-800 border-purple-300',
                      added: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                      removed: 'bg-red-100 text-red-800 border-red-300',
                    }[d.diffType];

                    const badgeLabel = {
                      modified: lang === 'ar' ? 'قيمة معدلة' : 'Modified',
                      formulaChanged: lang === 'ar' ? 'صيغة متغيرة' : 'Formula Diff',
                      added: lang === 'ar' ? 'مضافة في أ' : 'Added in A',
                      removed: lang === 'ar' ? 'محذوفة من أ' : 'Missing in A',
                    }[d.diffType];

                    return (
                      <tr key={`diff-${idx}`} className="hover:bg-slate-50 transition">
                        <td className="p-2.5 text-center font-mono font-bold text-slate-800">
                          {d.cellRef}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeStyles}`}>
                            {badgeLabel}
                          </span>
                        </td>
                        <td className="p-2.5 bg-blue-50/20 font-mono text-slate-800">
                          <div>{String(d.valA ?? '—')}</div>
                          {d.formulaA && (
                            <div className="text-[10px] text-blue-700 font-semibold">{d.formulaA}</div>
                          )}
                        </td>
                        <td className="p-2.5 bg-amber-50/20 font-mono text-slate-800">
                          <div>{String(d.valB ?? '—')}</div>
                          {d.formulaB && (
                            <div className="text-[10px] text-amber-700 font-semibold">{d.formulaB}</div>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                onSelectCell(d.row, d.col);
                                onClose();
                              }}
                              className="p-1 hover:bg-slate-200 rounded text-slate-600"
                              title={lang === 'ar' ? 'انتقال إلى الخلية' : 'Jump to Cell'}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            {onApplyCellPatch && d.valB !== null && (
                              <button
                                onClick={() => onApplyCellPatch(d.row, d.col, d.valB, d.formulaB)}
                                className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold"
                                title={lang === 'ar' ? 'استعادة قيمة الإصدار ب' : 'Apply B'}
                              >
                                {lang === 'ar' ? 'استعادة' : 'Apply'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500">
            {lang === 'ar'
              ? 'مقارنة فورية للقيم والصيغ الحسابية دون إرسال أي بيانات لخوادم خارجية'
              : 'Deterministic in-memory diffing without external server requests.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded font-medium transition"
          >
            {lang === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
