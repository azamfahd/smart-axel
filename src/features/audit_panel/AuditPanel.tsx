/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  Check,
  X,
  Sparkles,
  ExternalLink,
  CheckCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { AuditFinding, LanguageCode } from '../../types/index.ts';
import { getTranslation } from '../../core/i18n/translations.ts';

interface AuditPanelProps {
  findings: AuditFinding[];
  onApplyFix: (finding: AuditFinding) => void;
  onSkipFinding: (finding: AuditFinding) => void;
  onBatchApplyAll: () => void;
  onSelectCell: (sheetId: string, row: number, col: number) => void;
  lang: LanguageCode;
  onClose: () => void;
}

export const AuditPanel: React.FC<AuditPanelProps> = ({
  findings,
  onApplyFix,
  onSkipFinding,
  onBatchApplyAll,
  onSelectCell,
  lang,
  onClose,
}) => {
  const t = getTranslation(lang);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const pendingFindings = findings.filter(f => f.status === 'pending');
  const filteredFindings = pendingFindings.filter(f => {
    if (filterSeverity === 'all') return true;
    return f.severity === filterSeverity;
  });

  const criticalCount = pendingFindings.filter(f => f.severity === 'critical').length;
  const warningCount = pendingFindings.filter(f => f.severity === 'warning').length;
  const infoCount = pendingFindings.filter(f => f.severity === 'info').length;

  return (
    <div className="w-84 md:w-96 bg-white border-l border-slate-200 flex flex-col h-full shadow-lg z-30 select-none">
      {/* Panel Header */}
      <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-bold">{t.smartAudit}</h2>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Summary KPI Counters */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border-b border-slate-200 text-center">
        <button
          onClick={() => setFilterSeverity('critical')}
          className={`p-2 rounded border transition ${
            filterSeverity === 'critical' ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-lg font-bold text-red-600 font-mono">{criticalCount}</div>
          <div className="text-[10px] text-slate-600 font-medium">{t.criticalIssues}</div>
        </button>
        <button
          onClick={() => setFilterSeverity('warning')}
          className={`p-2 rounded border transition ${
            filterSeverity === 'warning' ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-lg font-bold text-amber-600 font-mono">{warningCount}</div>
          <div className="text-[10px] text-slate-600 font-medium">{t.warningIssues}</div>
        </button>
        <button
          onClick={() => setFilterSeverity('all')}
          className={`p-2 rounded border transition ${
            filterSeverity === 'all' ? 'bg-slate-200 border-slate-400' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-lg font-bold text-slate-700 font-mono">{pendingFindings.length}</div>
          <div className="text-[10px] text-slate-600 font-medium">{lang === 'ar' ? 'الإجمالي' : 'Total'}</div>
        </button>
      </div>

      {/* Batch Remediate Action Bar */}
      {pendingFindings.length > 0 && (
        <div className="p-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
          <span className="text-xs text-emerald-900 font-medium">
            {lang === 'ar' ? 'معالجة آمنة خاضعة للمراجعة' : 'Safe Human-in-the-Loop Fixes'}
          </span>
          <button
            onClick={onBatchApplyAll}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-xs transition"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>{t.batchApply}</span>
          </button>
        </div>
      )}

      {/* Findings Scrollable Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredFindings.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-center p-4">
            <Check className="w-8 h-8 text-emerald-500 mb-2" />
            <p className="text-xs font-medium text-slate-600">
              {lang === 'ar' ? 'لا توجد ملاحظات غير معالجة في هذا التصنيف' : 'No pending findings in this category'}
            </p>
          </div>
        ) : (
          filteredFindings.map(finding => {
            const isCritical = finding.severity === 'critical';
            const title = lang === 'ar' ? finding.ruleTitleAr : finding.ruleTitle;
            const explanation = lang === 'ar' ? finding.explanationAr : finding.explanation;

            return (
              <div
                key={finding.id}
                className={`p-3 rounded-lg border text-xs shadow-xs transition-all ${
                  isCritical ? 'bg-red-50/40 border-red-200' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Finding Header */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {isCritical ? (
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    )}
                    <span className="font-semibold text-slate-900 leading-tight">{title}</span>
                  </div>
                  <button
                    onClick={() => onSelectCell(finding.sheetId, finding.row, finding.col)}
                    className="flex items-center gap-0.5 text-[10px] text-blue-600 hover:underline font-mono"
                    title="Jump to Cell"
                  >
                    <span>{finding.cellRef}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </div>

                {/* Explanation Prose */}
                <p className="text-slate-600 text-[11px] mb-2 leading-relaxed">{explanation}</p>

                {/* Diff Preview Box */}
                {finding.suggestedValue !== undefined && (
                  <div className="bg-slate-50 border border-slate-200 rounded p-2 mb-2 font-mono text-[11px]">
                    <div className="flex items-center justify-between text-red-600 mb-1">
                      <span className="text-[10px] text-slate-500">{lang === 'ar' ? 'القيمة الحالية:' : 'Current:'}</span>
                      <span className="line-through">{String(finding.currentValue)}</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-700 font-bold">
                      <span className="text-[10px] text-slate-500">{lang === 'ar' ? 'التصحيح المقترح:' : 'Proposed:'}</span>
                      <span>{String(finding.suggestedValue)}</span>
                    </div>
                  </div>
                )}

                {/* Remediation Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => onSkipFinding(finding)}
                    className="px-2 py-1 text-slate-500 hover:bg-slate-100 rounded text-[11px] transition"
                  >
                    {t.skipFinding}
                  </button>
                  {finding.suggestedValue !== undefined && (
                    <button
                      onClick={() => onApplyFix(finding)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-xs transition"
                    >
                      <Check className="w-3 h-3" />
                      <span>{t.applyFix}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
