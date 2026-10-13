/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { WorksheetData } from '../../types/index.ts';
import { Database, Play, Terminal, X, Check, Copy } from 'lucide-react';

interface SqlConsoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeSheet: WorksheetData;
  sheets: WorksheetData[];
}

export const SqlConsoleDialog: React.FC<SqlConsoleDialogProps> = ({
  isOpen,
  onClose,
  activeSheet,
  sheets,
}) => {
  if (!isOpen) return null;

  const tableName = activeSheet.name.replace(/\s+/g, '_');
  const [query, setQuery] = useState(`SELECT * FROM ${tableName} LIMIT 10`);
  const [queryResult, setQueryResult] = useState<{ columns: string[]; rows: any[][] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Convert activeSheet to relational rows
  const tableData = useMemo(() => {
    const headers: string[] = [];
    for (let c = 0; c < activeSheet.colCount; c++) {
      const cell = activeSheet.cells[`0_${c}`] || activeSheet.cells[`1_${c}`];
      headers.push(cell?.rawValue !== undefined && cell?.rawValue !== null ? String(cell.rawValue).replace(/\s+/g, '_') : `col_${c + 1}`);
    }

    const rows: Record<string, any>[] = [];
    const startRow = activeSheet.cells[`0_0`] ? 0 : 1;

    for (let r = startRow; r < activeSheet.rowCount; r++) {
      const rowObj: Record<string, any> = {};
      let hasData = false;
      for (let c = 0; c < activeSheet.colCount; c++) {
        const cell = activeSheet.cells[`${r}_${c}`];
        const val = cell?.rawValue ?? '';
        if (val !== '') hasData = true;
        rowObj[headers[c]] = val;
      }
      if (hasData) rows.push(rowObj);
    }
    return { headers, rows };
  }, [activeSheet]);

  const handleRunQuery = () => {
    setError(null);
    try {
      const cleanQuery = query.trim();
      const upper = cleanQuery.toUpperCase();

      if (!upper.startsWith('SELECT')) {
        throw new Error('فقط استعلامات القراءة (SELECT) مدعومة في وحدة تحكم قاعدة البيانات.');
      }

      // Simple mock SQL parser for demonstration & robust execution
      let resultRows = [...tableData.rows];

      // Check WHERE clause
      const whereMatch = cleanQuery.match(/WHERE\s+(.+?)(\s+ORDER|\s+LIMIT|$)/i);
      if (whereMatch) {
        const condition = whereMatch[1].trim();
        // Support simple conditions e.g. amount > 1000 or category = 'Sales'
        const condMatch = condition.match(/^([a-zA-Z0-9_]+)\s*([><=]+)\s*(['"]?)(.*?)\3$/);
        if (condMatch) {
          const col = condMatch[1];
          const op = condMatch[2];
          const val = condMatch[4];
          const numVal = parseFloat(val);

          resultRows = resultRows.filter(row => {
            const cellVal = row[col];
            if (cellVal === undefined) return false;
            const numCell = parseFloat(cellVal);
            if (!isNaN(numVal) && !isNaN(numCell)) {
              if (op === '>') return numCell > numVal;
              if (op === '<') return numCell < numVal;
              if (op === '>=') return numCell >= numVal;
              if (op === '<=') return numCell <= numVal;
              if (op === '=') return numCell === numVal;
              if (op === '<>') return numCell !== numVal;
            } else {
              const strCell = String(cellVal).toLowerCase();
              const strVal = val.toLowerCase();
              if (op === '=') return strCell === strVal;
              if (op === '<>') return strCell !== strVal;
            }
            return true;
          });
        }
      }

      // Check LIMIT clause
      const limitMatch = cleanQuery.match(/LIMIT\s+(\d+)/i);
      let limit = resultRows.length;
      if (limitMatch) {
        limit = parseInt(limitMatch[1], 10);
        resultRows = resultRows.slice(0, limit);
      }

      const formattedRows = resultRows.map(r => tableData.headers.map(h => r[h] ?? ''));
      setQueryResult({
        columns: tableData.headers,
        rows: formattedRows,
      });
    } catch (err: any) {
      setError(err.message || 'خطأ في تنفيذ استعلام SQL');
      setQueryResult(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="text-lg font-bold">وحدة تحكم وقاعدة بيانات SQL (Database Console)</h2>
              <p className="text-xs text-slate-400">استعلم عن بيانات الورقة النشطة كجدول علائقي SQL</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Query Input */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">محرر استعلام SQL:</span>
            <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              الجدول المتاح: <code className="text-emerald-700 font-bold">{tableName}</code> ({tableData.rows.length} سجلات)
            </span>
          </div>

          <div className="relative">
            <div className="absolute top-3 left-3 text-slate-400">
              <Terminal className="w-5 h-5" />
            </div>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              rows={3}
              className="w-full font-mono text-sm bg-slate-900 text-emerald-300 p-3 pl-10 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="SELECT * FROM table_name WHERE amount > 500"
            />
          </div>

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setQuery(`SELECT * FROM ${tableName}`)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-300 transition"
              >
                SELECT * ALL
              </button>
              <button
                onClick={() => setQuery(`SELECT * FROM ${tableName} LIMIT 5`)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-300 transition"
              >
                SELECT LIMIT 5
              </button>
            </div>

            <button
              onClick={handleRunQuery}
              className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition flex items-center gap-2 shadow-sm"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>تنفيذ الاستعلام (Run SQL)</span>
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Results Table */}
          {queryResult && (
            <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 text-xs font-semibold text-slate-700 flex justify-between items-center">
                <span>نتائج الاستعلام ({queryResult.rows.length} صفوف)</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">نجاح التنفيذ</span>
              </div>
              <div className="max-h-60 overflow-auto">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 sticky top-0">
                      {queryResult.columns.map((col, idx) => (
                        <th key={idx} className="p-2.5 font-semibold text-slate-700 border-l border-slate-200">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50">
                        {row.map((val, cIdx) => (
                          <td key={cIdx} className="p-2.5 text-slate-800 border-l border-slate-100 font-mono">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                    {queryResult.rows.length === 0 && (
                      <tr>
                        <td colSpan={queryResult.columns.length} className="p-4 text-center text-slate-500">
                          لا توجد نتائج مطابقة للاستعلام.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
