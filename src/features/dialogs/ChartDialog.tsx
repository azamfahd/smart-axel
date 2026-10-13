/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, BarChart3, LineChart, PieChart } from 'lucide-react';
import { WorksheetData, SelectionRange, LanguageCode } from '../../types/index.ts';
import { coordsToRef } from '../../core/formula/cellUtils.ts';

interface ChartDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'column' | 'bar' | 'line' | 'pie';
  sheet: WorksheetData;
  selection: SelectionRange;
  lang: LanguageCode;
}

export const ChartDialog: React.FC<ChartDialogProps> = ({
  isOpen,
  onClose,
  type,
  sheet,
  selection,
  lang,
}) => {
  if (!isOpen) return null;

  // Extract labels and numbers from selection or first columns
  const minR = Math.min(selection.startRow, selection.endRow);
  const maxR = Math.max(selection.startRow, selection.endRow);
  const minC = Math.min(selection.startCol, selection.endCol);
  const maxC = Math.max(selection.startCol, selection.endCol);

  const dataPoints: { label: string; value: number }[] = [];

  for (let r = minR; r <= maxR; r++) {
    const labelCell = sheet.cells[`${r},${minC}`];
    const valueCell = sheet.cells[`${r},${minC === maxC ? minC : minC + 1}`];

    const label = labelCell ? String(labelCell.rawValue) : `Row ${r + 1}`;
    let val = 0;
    if (valueCell && typeof valueCell.rawValue === 'number') {
      val = valueCell.rawValue;
    } else if (valueCell && typeof valueCell.rawValue === 'string') {
      const parsed = parseFloat(valueCell.rawValue);
      if (!isNaN(parsed)) val = parsed;
    }

    if (val !== 0) {
      dataPoints.push({ label, value: val });
    }
  }

  // Fallback sample data if selection was empty or header-only
  const chartData = dataPoints.length >= 2 ? dataPoints : [
    { label: 'تقنية المعلومات', value: 24800 },
    { label: 'الخدمات المساندة', value: 8400 },
    { label: 'الإدارة القانونية', value: 15000 },
    { label: 'المشاريع', value: 50000 },
    { label: 'التسويق', value: 7500 },
  ];

  const maxValue = Math.max(...chartData.map(d => d.value), 1);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            {type === 'pie' ? <PieChart className="w-5 h-5 text-amber-400" /> : type === 'line' ? <LineChart className="w-5 h-5 text-blue-400" /> : <BarChart3 className="w-5 h-5 text-emerald-400" />}
            <h3 className="text-sm font-bold">
              {lang === 'ar' ? 'مخطط البيانات التفاعلي' : 'Interactive Data Chart'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chart Viewport */}
        <div className="p-6">
          <div className="mb-4 text-xs text-slate-500 font-mono">
            {lang === 'ar' ? 'نطاق البيانات المصدر:' : 'Data Range:'} {sheet.name}!{coordsToRef(minR, minC)}:{coordsToRef(maxR, maxC)}
          </div>

          {/* SVG Renderers */}
          {type === 'pie' ? (
            <div className="flex flex-col items-center">
              <svg viewBox="0 0 100 100" className="w-48 h-48 transform -rotate-90">
                {(() => {
                  const total = chartData.reduce((acc, d) => acc + d.value, 0) || 1;
                  let cumulativePercent = 0;
                  const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

                  return chartData.map((d, idx) => {
                    const percent = d.value / total;
                    const startAngle = cumulativePercent * 2 * Math.PI;
                    cumulativePercent += percent;
                    const endAngle = cumulativePercent * 2 * Math.PI;

                    const x1 = 50 + 40 * Math.cos(startAngle);
                    const y1 = 50 + 40 * Math.sin(startAngle);
                    const x2 = 50 + 40 * Math.cos(endAngle);
                    const y2 = 50 + 40 * Math.sin(endAngle);

                    const largeArcFlag = percent > 0.5 ? 1 : 0;
                    const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                    return (
                      <path
                        key={idx}
                        d={pathData}
                        fill={colors[idx % colors.length]}
                        stroke="#FFFFFF"
                        strokeWidth="1"
                      />
                    );
                  });
                })()}
              </svg>

              {/* Pie Legend */}
              <div className="flex flex-wrap gap-3 justify-center mt-4 text-xs">
                {chartData.map((d, idx) => {
                  const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
                  return (
                    <div key={idx} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                      <span className="text-slate-700">{d.label}: {d.value.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Bar / Column / Line Chart */
            <div className="space-y-3">
              {chartData.map((d, idx) => {
                const percent = Math.min(100, Math.round((d.value / maxValue) * 100));
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>{d.label}</span>
                      <span className="font-mono">{d.value.toLocaleString()}</span>
                    </div>
                    <div className="h-5 bg-slate-100 rounded-md overflow-hidden flex">
                      <div
                        style={{ width: `${percent}%` }}
                        className="bg-emerald-600 rounded-md transition-all duration-500 hover:bg-emerald-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold transition"
          >
            {lang === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
