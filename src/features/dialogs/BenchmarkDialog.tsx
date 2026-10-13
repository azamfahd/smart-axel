/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Play, Cpu, CheckCircle2, Gauge, Zap } from 'lucide-react';
import { WorksheetData, LanguageCode, CellMatrix } from '../../types/index.ts';
import { AuditEngine } from '../../core/audit/auditEngine.ts';
import { FormulaEngine } from '../../core/formula/index.ts';
import { coordsToRef } from '../../core/formula/cellUtils.ts';

interface BenchmarkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lang: LanguageCode;
}

interface BenchmarkResult {
  recordCount: number;
  cellCount: number;
  generateTimeMs: number;
  auditScanTimeMs: number;
  findingsDetected: number;
  recalcTimeMs: number;
}

export const BenchmarkDialog: React.FC<BenchmarkDialogProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [progressText, setProgressText] = useState('');

  if (!isOpen) return null;

  const runBenchmark = async (targetRows: number) => {
    setIsRunning(true);
    setProgressText(lang === 'ar' ? `جارٍ تجهيز واختبار ${targetRows.toLocaleString()} سجل...` : `Generating & testing ${targetRows.toLocaleString()} records...`);

    // Allow UI to render progress
    await new Promise(r => setTimeout(r, 50));

    const auditEngine = new AuditEngine();
    const formulaEngine = new FormulaEngine();

    const t0 = performance.now();
    const cells: CellMatrix = {};
    const colCount = 10;

    // Headers
    const headers = ['ID', 'Date', 'Vendor', 'Category', 'Amount', 'Tax', 'Total', 'Code', 'Status', 'Notes'];
    headers.forEach((h, c) => {
      cells[`0,${c}`] = { rawValue: h };
    });

    for (let r = 1; r <= targetRows; r++) {
      const isDupe = r % 100 === 0;
      const vendorName = isDupe ? 'شركة الأمل للتوريدات' : `مورد رقم ${r}`;
      const amount = 1000 + (r % 500);

      cells[`${r},0`] = { rawValue: `TX-${10000 + r}` };
      cells[`${r},1`] = { rawValue: '2026-02-15' };
      cells[`${r},2`] = { rawValue: vendorName };
      cells[`${r},3`] = { rawValue: 'مصروفات تشغيلية' };
      cells[`${r},4`] = { rawValue: amount };
      cells[`${r},5`] = { rawValue: amount * 0.15, formula: `=E${r + 1}*0.15` };
      cells[`${r},6`] = { rawValue: amount * 1.15, formula: `=E${r + 1}+F${r + 1}` };
      cells[`${r},7`] = { rawValue: `CODE-${r % 20}` };
      cells[`${r},8`] = { rawValue: 'معتمد' };
      cells[`${r},9`] = { rawValue: r === 50 ? 'ملاحظة بها مسافة\u200B خفية' : 'لا توجد ملاحظات' };
    }

    const t1 = performance.now();
    const generateTimeMs = Math.round(t1 - t0);

    // 2. Measure Audit Scan Time
    setProgressText(lang === 'ar' ? `جارٍ تشغيل فحص التدقيق الشامل على ${targetRows.toLocaleString()} سجل...` : `Running full audit scan on ${targetRows.toLocaleString()} records...`);
    await new Promise(r => setTimeout(r, 50));

    const mockSheet: WorksheetData = {
      id: `benchmark-${targetRows}`,
      name: `Benchmark-${targetRows}`,
      cells,
      rowCount: targetRows + 1,
      colCount,
      colWidths: {},
      rowHeights: {},
      mergedCells: [],
    };

    const tAudit0 = performance.now();
    const findings = auditEngine.auditWorksheet(mockSheet);
    const tAudit1 = performance.now();
    const auditScanTimeMs = Math.round(tAudit1 - tAudit0);

    // 3. Measure Formula Recalculation
    const tRecalc0 = performance.now();
    let recalcCount = 0;
    for (let r = 1; r <= Math.min(targetRows, 200); r++) {
      formulaEngine.evaluateFormula(`=E${r + 1}*0.15`, mockSheet.id, {
        id: 'bench',
        name: 'bench',
        sheets: [mockSheet],
        activeSheetId: mockSheet.id,
      });
      recalcCount++;
    }
    const tRecalc1 = performance.now();
    const recalcTimeMs = Math.round(tRecalc1 - tRecalc0);

    setResults(prev => [
      ...prev,
      {
        recordCount: targetRows,
        cellCount: targetRows * colCount,
        generateTimeMs,
        auditScanTimeMs,
        findingsDetected: findings.length,
        recalcTimeMs,
      },
    ]);

    setIsRunning(false);
    setProgressText('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold">
              {lang === 'ar' ? 'مختبر اختبارات الأداء الحقيقية والبيانات الضخمة' : 'Real-Time Performance & Big Data Benchmark Lab'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          <p className="text-slate-600 leading-relaxed">
            {lang === 'ar'
              ? 'تتيح هذه الأداة توليد بيانات حقيقية ضخمة في الذاكرة وقياس سرعة محرك التدقيق ومحرك الصيغ عبر دقة performance.now() بالمللي ثانية.'
              : 'This utility generates real in-memory datasets and measures audit and formula engine throughput via performance.now().'}
          </p>

          {/* Test Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => runBenchmark(1000)}
              disabled={isRunning}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 rounded-lg font-semibold flex items-center gap-2 transition"
            >
              <Zap className="w-4 h-4 text-amber-600" />
              <span>1,000 {lang === 'ar' ? 'سجل (10,000 خلية)' : 'records'}</span>
            </button>
            <button
              onClick={() => runBenchmark(5000)}
              disabled={isRunning}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 rounded-lg font-semibold flex items-center gap-2 transition"
            >
              <Gauge className="w-4 h-4 text-blue-600" />
              <span>5,000 {lang === 'ar' ? 'سجل (50,000 خلية)' : 'records'}</span>
            </button>
            <button
              onClick={() => runBenchmark(10000)}
              disabled={isRunning}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-2 shadow-xs transition"
            >
              <Play className="w-4 h-4" />
              <span>10,000 {lang === 'ar' ? 'سجل (100,000 خلية)' : 'records'}</span>
            </button>
          </div>

          {/* Progress Indicator */}
          {isRunning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-center gap-2 font-medium">
              <span className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <span>{progressText}</span>
            </div>
          )}

          {/* Benchmark Results Table */}
          {results.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                  <tr>
                    <th className="p-2.5">{lang === 'ar' ? 'عدد السجلات' : 'Records'}</th>
                    <th className="p-2.5">{lang === 'ar' ? 'إجمالي الخلايا' : 'Total Cells'}</th>
                    <th className="p-2.5">{lang === 'ar' ? 'زمن التوليد' : 'Gen Time'}</th>
                    <th className="p-2.5">{lang === 'ar' ? 'زمن فحص التدقيق' : 'Audit Scan'}</th>
                    <th className="p-2.5">{lang === 'ar' ? 'الملاحظات المكتشفة' : 'Findings'}</th>
                    <th className="p-2.5">{lang === 'ar' ? 'حساب الصيغ' : 'Formula Recalc'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {results.map((res, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">{res.recordCount.toLocaleString()}</td>
                      <td className="p-2.5 text-slate-600">{res.cellCount.toLocaleString()}</td>
                      <td className="p-2.5 text-slate-600">{res.generateTimeMs} ms</td>
                      <td className="p-2.5 font-semibold text-emerald-700">{res.auditScanTimeMs} ms</td>
                      <td className="p-2.5 text-amber-700">{res.findingsDetected}</td>
                      <td className="p-2.5 text-blue-700">{res.recalcTimeMs} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
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
