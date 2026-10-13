/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Printer, ShieldCheck, AlertTriangle } from 'lucide-react';
import { AuditFinding, LanguageCode, WorkbookData } from '../../types/index.ts';

interface AuditReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workbook: WorkbookData;
  findings: AuditFinding[];
  lang: LanguageCode;
}

export const AuditReportDialog: React.FC<AuditReportDialogProps> = ({
  isOpen,
  onClose,
  workbook,
  findings,
  lang,
}) => {
  if (!isOpen) return null;

  const critical = findings.filter(f => f.severity === 'critical');
  const warning = findings.filter(f => f.severity === 'warning');
  const info = findings.filter(f => f.severity === 'info');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold">
                {lang === 'ar' ? 'تقرير التدقيق الجنائي وجودة البيانات' : 'Forensic & Data Quality Audit Report'}
              </h3>
              <p className="text-xs text-slate-400">{workbook.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'ar' ? 'طباعة التقرير' : 'Print Report'}</span>
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-white text-slate-800 text-xs">
          {/* Executive Overview Header */}
          <div className="border-b border-slate-300 pb-4">
            <h1 className="text-xl font-bold text-slate-900 mb-1">
              {lang === 'ar' ? 'تقرير التدقيق الداخلي وفحص جودة البيانات' : 'Internal Audit & Data Quality Findings Report'}
            </h1>
            <div className="text-xs text-slate-500 flex justify-between font-mono">
              <span>{lang === 'ar' ? 'المصنف:' : 'Workbook:'} {workbook.name}</span>
              <span>{lang === 'ar' ? 'تاريخ التوليد:' : 'Generated:'} {new Date().toLocaleString()}</span>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <span className="block text-[11px] text-slate-500 font-medium">{lang === 'ar' ? 'إجمالي الملاحظات' : 'Total Findings'}</span>
              <span className="text-xl font-bold text-slate-800 font-mono">{findings.length}</span>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
              <span className="block text-[11px] text-red-600 font-medium">{lang === 'ar' ? 'أخطاء حرجة' : 'Critical Errors'}</span>
              <span className="text-xl font-bold text-red-600 font-mono">{critical.length}</span>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
              <span className="block text-[11px] text-amber-600 font-medium">{lang === 'ar' ? 'تحذيرات اشتباه' : 'Suspicious Warnings'}</span>
              <span className="text-xl font-bold text-amber-600 font-mono">{warning.length}</span>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <span className="block text-[11px] text-blue-600 font-medium">{lang === 'ar' ? 'ملاحظات تنظيمية' : 'Informational'}</span>
              <span className="text-xl font-bold text-blue-600 font-mono">{info.length}</span>
            </div>
          </div>

          {/* Detailed Findings Table */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 mb-2">
              {lang === 'ar' ? 'تفاصيل الملاحظات المكتشفة' : 'Detailed Observations'}
            </h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                  <tr>
                    <th className="p-2.5">{lang === 'ar' ? 'الخلية / الورقة' : 'Cell / Sheet'}</th>
                    <th className="p-2.5">{lang === 'ar' ? 'نوع المشكلة' : 'Rule Violation'}</th>
                    <th className="p-2.5">{lang === 'ar' ? 'الخطورة' : 'Severity'}</th>
                    <th className="p-2.5">{lang === 'ar' ? 'القيمة المرصودة' : 'Current Value'}</th>
                    <th className="p-2.5">{lang === 'ar' ? 'الشرح والسبب' : 'Explanation'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {findings.map(f => (
                    <tr key={f.id} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-mono font-semibold text-slate-900">
                        {f.sheetName}!{f.cellRef}
                      </td>
                      <td className="p-2.5 font-medium text-slate-800">
                        {lang === 'ar' ? f.ruleTitleAr : f.ruleTitle}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            f.severity === 'critical'
                              ? 'bg-red-100 text-red-800'
                              : f.severity === 'warning'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {f.severity}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-slate-600">
                        {String(f.currentValue)}
                      </td>
                      <td className="p-2.5 text-slate-600 leading-relaxed">
                        {lang === 'ar' ? f.explanationAr : f.explanation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end print:hidden">
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
