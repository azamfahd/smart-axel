/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { WorksheetData } from '../../types/index.ts';
import { Table, BarChart3, Filter, X, ArrowRight, Download } from 'lucide-react';

interface PivotTableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeSheet: WorksheetData;
  onInsertAsNewSheet: (pivotName: string, data: any[][]) => void;
}

export const PivotTableDialog: React.FC<PivotTableDialogProps> = ({
  isOpen,
  onClose,
  activeSheet,
  onInsertAsNewSheet,
}) => {
  if (!isOpen) return null;

  // Extract headers from row 0 or row 1
  const headers = useMemo(() => {
    const h: string[] = [];
    for (let c = 0; c < activeSheet.colCount; c++) {
      const cell = activeSheet.cells[`0_${c}`] || activeSheet.cells[`1_${c}`];
      h.push(cell?.rawValue !== undefined && cell?.rawValue !== null ? String(cell.rawValue) : `Column ${c + 1}`);
    }
    return h;
  }, [activeSheet]);

  const [rowField, setRowField] = useState<number>(0);
  const [valField, setValField] = useState<number>(1 < activeSheet.colCount ? 1 : 0);
  const [aggFunc, setAggFunc] = useState<'SUM' | 'AVERAGE' | 'COUNT' | 'MIN' | 'MAX'>('SUM');

  // Compute pivot data
  const pivotResult = useMemo(() => {
    const groups: Record<string, number[]> = {};
    const startRow = activeSheet.cells[`0_0`] ? 0 : 1; // skip header if row 0 is header

    for (let r = startRow; r < activeSheet.rowCount; r++) {
      const rowKeyCell = activeSheet.cells[`${r}_${rowField}`];
      const valCell = activeSheet.cells[`${r}_${valField}`];

      const key = rowKeyCell?.rawValue !== undefined && rowKeyCell?.rawValue !== null && rowKeyCell?.rawValue !== '' ? String(rowKeyCell.rawValue) : '(Blank)';
      const rawNum = parseFloat(String(valCell?.rawValue ?? '0'));
      const num = isNaN(rawNum) ? 0 : rawNum;

      if (!groups[key]) groups[key] = [];
      groups[key].push(num);
    }

    const rows: { key: string; result: number; count: number }[] = [];
    for (const [key, nums] of Object.entries(groups)) {
      let res = 0;
      if (aggFunc === 'SUM') res = nums.reduce((a, b) => a + b, 0);
      else if (aggFunc === 'AVERAGE') res = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
      else if (aggFunc === 'COUNT') res = nums.length;
      else if (aggFunc === 'MIN') res = nums.length ? Math.min(...nums) : 0;
      else if (aggFunc === 'MAX') res = nums.length ? Math.max(...nums) : 0;

      rows.push({ key, result: Number(res.toFixed(2)), count: nums.length });
    }

    return rows;
  }, [activeSheet, rowField, valField, aggFunc]);

  const handleCreateSheet = () => {
    const tableData: any[][] = [
      [headers[rowField] || `Field ${rowField + 1}`, `${aggFunc} of ${headers[valField] || `Field ${valField + 1}`}`, 'Count'],
      ...pivotResult.map(p => [p.key, p.result, p.count])
    ];
    onInsertAsNewSheet(`Pivot_${headers[rowField] || 'Table'}`, tableData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Table className="w-6 h-6" />
            <h2 className="text-lg font-bold">منشئ الجداول المحورية (Pivot Table Builder)</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-emerald-800 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto">
          {/* Controls */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800">حقول الجدول المحوري</h3>
            
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">حقل الصفوف (Rows):</label>
              <select
                value={rowField}
                onChange={e => setRowField(Number(e.target.value))}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white"
              >
                {headers.map((h, i) => (
                  <option key={i} value={i}>{h} (عمود {i + 1})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">حقل القيم (Values):</label>
              <select
                value={valField}
                onChange={e => setValField(Number(e.target.value))}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white"
              >
                {headers.map((h, i) => (
                  <option key={i} value={i}>{h} (عمود {i + 1})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">الدالة الإحصائية (Aggregation):</label>
              <select
                value={aggFunc}
                onChange={e => setAggFunc(e.target.value as any)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white"
              >
                <option value="SUM">مجموع (SUM)</option>
                <option value="AVERAGE">متوسط (AVERAGE)</option>
                <option value="COUNT">عدد (COUNT)</option>
                <option value="MIN">أقل قيمة (MIN)</option>
                <option value="MAX">أكبر قيمة (MAX)</option>
              </select>
            </div>
          </div>

          {/* Preview Table */}
          <div className="md:col-span-2 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 font-medium text-xs text-slate-700 flex justify-between items-center">
              <span>معاينة الجدول المحوري الناتج</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{pivotResult.length} صفوف</span>
            </div>
            <div className="flex-1 overflow-auto max-h-64 p-2">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-2 font-semibold text-slate-700">{headers[rowField]}</th>
                    <th className="p-2 font-semibold text-slate-700">{aggFunc} ({headers[valField]})</th>
                    <th className="p-2 font-semibold text-slate-700">العدد</th>
                  </tr>
                </thead>
                <tbody>
                  {pivotResult.map((p, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-2 font-medium text-slate-900">{p.key}</td>
                      <td className="p-2 text-emerald-600 font-semibold">{p.result.toLocaleString()}</td>
                      <td className="p-2 text-slate-500">{p.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition"
          >
            إلغاء
          </button>
          <button
            onClick={handleCreateSheet}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>إدراج كورقة عمل جديدة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
