/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Save,
  FolderOpen,
  FileDown,
  Printer,
  RotateCcw,
  RotateCw,
  Scissors,
  Copy,
  Clipboard,
  Paintbrush,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  WrapText,
  Merge,
  Sigma,
  ArrowUpDown,
  Filter,
  Search,
  Sparkles,
  ShieldAlert,
  BarChart3,
  PieChart,
  LineChart,
  Grid3X3,
  SlidersHorizontal,
  Bot,
  Plus,
  Table,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  HelpCircle,
  FileText,
  Cpu,
  GitCompare,
  CheckSquare,
  Database,
} from 'lucide-react';
import { LanguageCode, NumberFormatType, WorksheetData } from '../../types/index.ts';
import { getTranslation } from '../../core/i18n/translations.ts';

interface RibbonProps {
  lang: LanguageCode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onExportXLSX: () => void;
  onExportCSV: () => void;
  onPrint: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onFormatPainter: () => void;
  isFormatPainterActive: boolean;
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onToggleUnderline: () => void;
  onSetFontSize: (size: number) => void;
  onSetTextColor: (color: string) => void;
  onSetFillColor: (color: string) => void;
  onSetAlign: (align: 'left' | 'center' | 'right') => void;
  onToggleWrapText: () => void;
  onMergeCells: () => void;
  onSetNumberFormat: (format: NumberFormatType) => void;
  onAutoSum: () => void;
  onSort: (dir: 'asc' | 'desc') => void;
  onFilter: () => void;
  onOpenInsertChart: (type: 'column' | 'bar' | 'line' | 'pie') => void;
  onOpenInsertFunction: () => void;
  onRunAudit: () => void;
  onToggleAIChat: () => void;
  onFreezeTopRow: () => void;
  onUnfreeze: () => void;
  onSetZoom: (zoom: number) => void;
  currentZoom: number;
  onShowAuditReport: () => void;
  findingsCount?: number;
  onOpenBenchmark?: () => void;
  onOpenFindReplace?: () => void;
  onOpenDataValidation?: () => void;
  onOpenConditionalFormatting?: () => void;
  onOpenBackupManager?: () => void;
  onOpenCompareVersions?: () => void;
  onOpenPivotTable?: () => void;
  onOpenSqlConsole?: () => void;
}

export const Ribbon: React.FC<RibbonProps> = ({
  lang,
  activeTab,
  setActiveTab,
  onNew,
  onOpen,
  onSave,
  onExportXLSX,
  onExportCSV,
  onPrint,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onCut,
  onCopy,
  onPaste,
  onFormatPainter,
  isFormatPainterActive,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onSetFontSize,
  onSetTextColor,
  onSetFillColor,
  onSetAlign,
  onToggleWrapText,
  onMergeCells,
  onSetNumberFormat,
  onAutoSum,
  onSort,
  onFilter,
  onOpenInsertChart,
  onOpenInsertFunction,
  onRunAudit,
  onToggleAIChat,
  onFreezeTopRow,
  onUnfreeze,
  onSetZoom,
  currentZoom,
  onShowAuditReport,
  findingsCount = 0,
  onOpenBenchmark,
  onOpenFindReplace,
  onOpenDataValidation,
  onOpenConditionalFormatting,
  onOpenBackupManager,
  onOpenCompareVersions,
  onOpenPivotTable,
  onOpenSqlConsole,
}) => {
  const t = getTranslation(lang);
  const [fontSize, setFontSize] = useState<number>(11);

  const tabs = [
    { id: 'file', label: t.file },
    { id: 'home', label: t.home },
    { id: 'insert', label: t.insert },
    { id: 'pageLayout', label: t.pageLayout },
    { id: 'formulas', label: t.formulas },
    { id: 'data', label: t.data },
    { id: 'review', label: t.review },
    { id: 'view', label: t.view },
    { id: 'developer', label: t.developer },
    { id: 'audit', label: t.smartAudit, badge: findingsCount > 0 ? findingsCount : undefined },
  ];

  return (
    <div className="bg-slate-50 border-b border-slate-300 select-none shadow-xs">
      {/* Ribbon Tab Bar */}
      <div className="flex items-center px-2 bg-slate-100 border-b border-slate-200 overflow-x-auto gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors rounded-t-sm flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-xs'
                : 'text-slate-700 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            {tab.id === 'audit' && <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />}
            {tab.label}
            {tab.badge !== undefined && (
              <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {tab.badge}
              </span>
            )}
          </button>
        ))}

        {/* AI Agent Quick Trigger Button */}
        <button
          onClick={onToggleAIChat}
          className="ml-auto mr-2 my-1 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-medium flex items-center gap-1.5 shadow-xs transition"
          title={t.aiTitle}
        >
          <Bot className="w-3.5 h-3.5 text-emerald-200" />
          <span>{t.aiAssistant}</span>
        </button>
      </div>

      {/* Ribbon Content Body */}
      <div className="h-24 px-3 py-1.5 overflow-x-auto flex items-center gap-4 bg-white text-slate-800 text-xs">
        {/* FILE TAB */}
        {activeTab === 'file' && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-1 px-2 border-r border-slate-200">
              <button onClick={onNew} className="p-2 hover:bg-slate-100 rounded flex flex-col items-center gap-1">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span className="text-[11px] font-medium">{t.newWorkbook}</span>
              </button>
            </div>
            <div className="flex flex-col items-center gap-1 px-2 border-r border-slate-200">
              <button onClick={onOpen} className="p-2 hover:bg-slate-100 rounded flex flex-col items-center gap-1">
                <FolderOpen className="w-5 h-5 text-blue-600" />
                <span className="text-[11px] font-medium">{t.openFile}</span>
              </button>
            </div>
            <div className="flex flex-col items-center gap-1 px-2 border-r border-slate-200">
              <button onClick={onSave} className="p-2 hover:bg-slate-100 rounded flex flex-col items-center gap-1">
                <Save className="w-5 h-5 text-emerald-700" />
                <span className="text-[11px] font-medium">{t.saveFile}</span>
              </button>
            </div>
            <div className="flex flex-col items-center gap-1 px-2 border-r border-slate-200">
              <button onClick={onExportXLSX} className="p-2 hover:bg-slate-100 rounded flex flex-col items-center gap-1">
                <FileDown className="w-5 h-5 text-emerald-600" />
                <span className="text-[11px] font-medium">{t.exportXlsx}</span>
              </button>
            </div>
            <div className="flex flex-col items-center gap-1 px-2 border-r border-slate-200">
              <button onClick={onExportCSV} className="p-2 hover:bg-slate-100 rounded flex flex-col items-center gap-1">
                <FileText className="w-5 h-5 text-slate-600" />
                <span className="text-[11px] font-medium">{t.exportCsv}</span>
              </button>
            </div>
            <div className="flex flex-col items-center gap-1 px-2 border-r border-slate-200">
              <button onClick={onPrint} className="p-2 hover:bg-slate-100 rounded flex flex-col items-center gap-1">
                <Printer className="w-5 h-5 text-slate-700" />
                <span className="text-[11px] font-medium">{t.printSheet}</span>
              </button>
            </div>
            <div className="flex flex-col items-center gap-1 px-2">
              <button onClick={onOpenBackupManager} className="p-2 hover:bg-slate-100 rounded flex flex-col items-center gap-1 text-emerald-800">
                <Save className="w-5 h-5 text-blue-600" />
                <span className="text-[11px] font-medium">{t.backupSheet}</span>
              </button>
            </div>
          </div>
        )}

        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div className="flex items-center gap-3">
            {/* Clipboard Group */}
            <div className="flex flex-col justify-between h-full pr-3 border-r border-slate-200">
              <div className="flex items-center gap-1">
                <button
                  onClick={onPaste}
                  className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-100 rounded transition"
                  title={t.paste}
                >
                  <Clipboard className="w-4 h-4 text-emerald-700" />
                  <span className="text-[10px] mt-0.5">{t.paste}</span>
                </button>
                <div className="flex flex-col gap-0.5">
                  <button onClick={onCut} className="p-1 hover:bg-slate-100 rounded" title={t.cut}>
                    <Scissors className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                  <button onClick={onCopy} className="p-1 hover:bg-slate-100 rounded" title={t.copy}>
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                </div>
                <button
                  onClick={onFormatPainter}
                  className={`p-1.5 rounded transition ${isFormatPainterActive ? 'bg-amber-100 text-amber-800' : 'hover:bg-slate-100 text-slate-600'}`}
                  title={t.formatPainter}
                >
                  <Paintbrush className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-[9px] text-slate-600 text-center font-medium mt-auto">{t.clipboard}</span>
            </div>

            {/* Font Group */}
            <div className="flex flex-col justify-between h-full pr-3 border-r border-slate-200">
              <div className="flex items-center gap-1.5">
                <select
                  value={fontSize}
                  onChange={e => {
                    const s = parseInt(e.target.value, 10);
                    setFontSize(s);
                    onSetFontSize(s);
                  }}
                  className="h-6 text-[11px] border border-slate-300 rounded px-1 bg-white focus:outline-emerald-600"
                >
                  {[9, 10, 11, 12, 14, 16, 18, 20, 24].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div className="flex items-center bg-slate-100 rounded p-0.5 gap-0.5">
                  <button onClick={onToggleBold} className="p-1 hover:bg-white rounded" title={t.bold}>
                    <Bold className="w-3.5 h-3.5 font-bold" />
                  </button>
                  <button onClick={onToggleItalic} className="p-1 hover:bg-white rounded" title={t.italic}>
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={onToggleUnderline} className="p-1 hover:bg-white rounded" title={t.underline}>
                    <Underline className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-1 ml-1">
                  <label className="cursor-pointer p-1 hover:bg-slate-100 rounded flex items-center" title={t.textColor}>
                    <span className="text-xs font-bold text-red-600 underline">A</span>
                    <input
                      type="color"
                      defaultValue="#000000"
                      onChange={e => onSetTextColor(e.target.value)}
                      className="w-0 h-0 opacity-0 absolute"
                    />
                  </label>
                  <label className="cursor-pointer p-1 hover:bg-slate-100 rounded flex items-center" title={t.fillColor}>
                    <div className="w-3.5 h-3.5 bg-yellow-300 border border-slate-400 rounded-xs" />
                    <input
                      type="color"
                      defaultValue="#FEF08A"
                      onChange={e => onSetFillColor(e.target.value)}
                      className="w-0 h-0 opacity-0 absolute"
                    />
                  </label>
                </div>
              </div>
              <span className="text-[9px] text-slate-600 text-center font-medium mt-auto">{t.font}</span>
            </div>

            {/* Alignment Group */}
            <div className="flex flex-col justify-between h-full pr-3 border-r border-slate-200">
              <div className="flex items-center gap-1">
                <button onClick={() => onSetAlign('left')} className="p-1 hover:bg-slate-100 rounded" title={t.alignLeft}>
                  <AlignLeft className="w-3.5 h-3.5 text-slate-700" />
                </button>
                <button onClick={() => onSetAlign('center')} className="p-1 hover:bg-slate-100 rounded" title={t.alignCenter}>
                  <AlignCenter className="w-3.5 h-3.5 text-slate-700" />
                </button>
                <button onClick={() => onSetAlign('right')} className="p-1 hover:bg-slate-100 rounded" title={t.alignRight}>
                  <AlignRight className="w-3.5 h-3.5 text-slate-700" />
                </button>
                <button onClick={onToggleWrapText} className="p-1 hover:bg-slate-100 rounded ml-1 flex items-center gap-1" title={t.wrapText}>
                  <WrapText className="w-3.5 h-3.5 text-slate-700" />
                </button>
                <button onClick={onMergeCells} className="p-1 hover:bg-slate-100 rounded flex items-center gap-1" title={t.mergeCenter}>
                  <Merge className="w-3.5 h-3.5 text-slate-700" />
                </button>
              </div>
              <span className="text-[9px] text-slate-600 text-center font-medium mt-auto">{t.alignment}</span>
            </div>

            {/* Numbers Format Group */}
            <div className="flex flex-col justify-between h-full pr-3 border-r border-slate-200">
              <div className="flex items-center gap-1">
                <select
                  onChange={e => onSetNumberFormat(e.target.value as NumberFormatType)}
                  className="h-6 text-[11px] border border-slate-300 rounded px-1.5 bg-white focus:outline-emerald-600"
                >
                  <option value="general">{t.formatGeneral}</option>
                  <option value="number">{t.formatNumber}</option>
                  <option value="currency">{t.formatCurrency}</option>
                  <option value="percent">{t.formatPercent}</option>
                  <option value="date">{t.formatDate}</option>
                  <option value="text">{t.formatText}</option>
                </select>
                <button
                  onClick={() => onSetNumberFormat('currency')}
                  className="px-1.5 py-0.5 border border-slate-300 rounded hover:bg-slate-100 font-mono text-xs font-semibold"
                  title={t.formatCurrency}
                >
                  $
                </button>
                <button
                  onClick={() => onSetNumberFormat('percent')}
                  className="px-1.5 py-0.5 border border-slate-300 rounded hover:bg-slate-100 font-mono text-xs font-semibold"
                  title={t.formatPercent}
                >
                  %
                </button>
                <button
                  onClick={onOpenConditionalFormatting}
                  className="px-2 py-0.5 bg-amber-50 border border-amber-300 text-amber-900 rounded hover:bg-amber-100 flex items-center gap-1 font-semibold text-[11px]"
                  title="التنسيق الشرطي (Conditional Formatting)"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>تنسيق شرطي</span>
                </button>
              </div>
              <span className="text-[9px] text-slate-600 text-center font-medium mt-auto">{t.numberFormat}</span>
            </div>

            {/* Editing Group */}
            <div className="flex flex-col justify-between h-full pr-3">
              <div className="flex items-center gap-1.5">
                <button onClick={onAutoSum} className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded font-medium text-xs">
                  <Sigma className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{t.autoSum}</span>
                </button>
                <button onClick={() => onSort('asc')} className="p-1 hover:bg-slate-100 rounded" title={t.sortAsc}>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-700" />
                </button>
                <button onClick={onFilter} className="p-1 hover:bg-slate-100 rounded" title={t.filter}>
                  <Filter className="w-3.5 h-3.5 text-slate-700" />
                </button>
                <button
                  onClick={onOpenFindReplace}
                  className="p-1 hover:bg-slate-100 rounded text-slate-700"
                  title={t.findReplace}
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-[9px] text-slate-600 text-center font-medium mt-auto">{t.editing}</span>
            </div>
          </div>
        )}

        {/* INSERT TAB */}
        {activeTab === 'insert' && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-1 px-2 border-r border-slate-200">
              <button onClick={() => onOpenInsertChart('column')} className="p-2 hover:bg-slate-100 rounded flex flex-col items-center gap-1">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                <span className="text-[11px] font-medium">{t.barChart}</span>
              </button>
            </div>
            <div className="flex flex-col items-center gap-1 px-2 border-r border-slate-200">
              <button onClick={() => onOpenInsertChart('line')} className="p-2 hover:bg-slate-100 rounded flex flex-col items-center gap-1">
                <LineChart className="w-5 h-5 text-blue-600" />
                <span className="text-[11px] font-medium">{t.lineChart}</span>
              </button>
            </div>
            <div className="flex flex-col items-center gap-1 px-2 border-r border-slate-200">
              <button onClick={() => onOpenInsertChart('pie')} className="p-2 hover:bg-slate-100 rounded flex flex-col items-center gap-1">
                <PieChart className="w-5 h-5 text-amber-600" />
                <span className="text-[11px] font-medium">{t.pieChart}</span>
              </button>
            </div>
            <div className="flex flex-col items-center gap-1 px-2">
              <button onClick={onOpenInsertFunction} className="p-2 hover:bg-slate-100 rounded flex flex-col items-center gap-1">
                <Sigma className="w-5 h-5 text-purple-600" />
                <span className="text-[11px] font-medium">{t.insertFunction}</span>
              </button>
            </div>
            {onOpenPivotTable && (
              <div className="flex flex-col items-center gap-1 px-2 border-r border-slate-200">
                <button onClick={onOpenPivotTable} className="p-2 hover:bg-slate-100 rounded flex flex-col items-center gap-1">
                  <Table className="w-5 h-5 text-emerald-700" />
                  <span className="text-[11px] font-medium">{lang === 'ar' ? 'جدول محوري' : 'Pivot Table'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* FORMULAS TAB */}
        {activeTab === 'formulas' && (
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenInsertFunction}
              className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded flex flex-col items-center gap-1"
            >
              <Sigma className="w-5 h-5 text-purple-700" />
              <span className="text-[11px] font-semibold">{t.insertFunction}</span>
            </button>
            <button
              onClick={onAutoSum}
              className="p-2 hover:bg-slate-100 rounded flex flex-col items-center gap-1"
            >
              <Sigma className="w-5 h-5 text-emerald-700" />
              <span className="text-[11px] font-medium">{t.autoSum}</span>
            </button>
            <div className="h-10 w-[1px] bg-slate-200 mx-1" />
            <div className="flex gap-2 text-slate-700 text-xs">
              <button onClick={onOpenInsertFunction} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded">SUM / IF / VLOOKUP</button>
              <button onClick={onOpenInsertFunction} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded">AVERAGE / COUNT</button>
              <button onClick={onOpenInsertFunction} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded">ROUND / DATE</button>
            </div>
          </div>
        )}

        {/* DATA TAB */}
        {activeTab === 'data' && (
          <div className="flex items-center gap-4">
            <button onClick={() => onSort('asc')} className="p-2 hover:bg-slate-100 rounded flex flex-col items-center gap-1">
              <ArrowUpDown className="w-5 h-5 text-slate-700" />
              <span className="text-[11px] font-medium">{t.sortAsc}</span>
            </button>
            <button onClick={() => onSort('desc')} className="p-2 hover:bg-slate-100 rounded flex flex-col items-center gap-1">
              <ArrowUpDown className="w-5 h-5 text-slate-700 rotate-180" />
              <span className="text-[11px] font-medium">{t.sortDesc}</span>
            </button>
            <button onClick={onFilter} className="p-2 hover:bg-slate-100 rounded flex flex-col items-center gap-1">
              <Filter className="w-5 h-5 text-slate-700" />
              <span className="text-[11px] font-medium">{t.filter}</span>
            </button>
            <button onClick={onRunAudit} className="p-2 hover:bg-amber-50 rounded flex flex-col items-center gap-1 text-amber-800">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span className="text-[11px] font-medium">{t.removeDuplicates}</span>
            </button>
            {onOpenDataValidation && (
              <button onClick={onOpenDataValidation} className="p-2 hover:bg-slate-100 rounded flex flex-col items-center gap-1 text-slate-700">
                <CheckSquare className="w-5 h-5 text-emerald-600" />
                <span className="text-[11px] font-medium">{t.dataValidation}</span>
              </button>
            )}
            {onOpenCompareVersions && (
              <button onClick={onOpenCompareVersions} className="p-2 hover:bg-indigo-50 rounded flex flex-col items-center gap-1 text-indigo-800">
                <GitCompare className="w-5 h-5 text-indigo-600" />
                <span className="text-[11px] font-medium">{t.compareVersions}</span>
              </button>
            )}
          </div>
        )}

        {/* VIEW TAB */}
        {activeTab === 'view' && (
          <div className="flex items-center gap-4">
            <button onClick={onFreezeTopRow} className="p-2 hover:bg-slate-100 rounded flex flex-col items-center gap-1">
              <Grid3X3 className="w-5 h-5 text-slate-700" />
              <span className="text-[11px] font-medium">{t.freezeTopRow}</span>
            </button>
            <button onClick={onUnfreeze} className="p-2 hover:bg-slate-100 rounded flex flex-col items-center gap-1">
              <SlidersHorizontal className="w-5 h-5 text-slate-700" />
              <span className="text-[11px] font-medium">{t.unfreeze}</span>
            </button>
            <div className="h-10 w-[1px] bg-slate-200 mx-1" />
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSetZoom(Math.max(50, currentZoom - 10))}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <ZoomOut className="w-4 h-4 text-slate-600" />
              </button>
              <span className="font-mono text-xs font-semibold">{currentZoom}%</span>
              <button
                onClick={() => onSetZoom(Math.min(200, currentZoom + 10))}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <ZoomIn className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}

        {/* SMART AUDIT TAB */}
        {activeTab === 'audit' && (
          <div className="flex items-center gap-4">
            <button
              onClick={onRunAudit}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded flex flex-col items-center gap-1 shadow-xs transition"
            >
              <ShieldAlert className="w-5 h-5 text-emerald-100" />
              <span className="text-[11px] font-semibold">{t.auditScan}</span>
            </button>
            <button
              onClick={onRunAudit}
              className="p-2 hover:bg-slate-100 rounded flex flex-col items-center gap-1 text-slate-700"
            >
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <span className="text-[11px] font-medium">{t.auditDuplicates}</span>
            </button>
            <button
              onClick={onRunAudit}
              className="p-2 hover:bg-slate-100 rounded flex flex-col items-center gap-1 text-slate-700"
            >
              <Sparkles className="w-5 h-5 text-amber-600" />
              <span className="text-[11px] font-medium">{t.auditUnicode}</span>
            </button>
            <button
              onClick={onShowAuditReport}
              className="p-2 hover:bg-slate-100 rounded flex flex-col items-center gap-1 text-slate-700"
            >
              <FileSpreadsheet className="w-5 h-5 text-purple-600" />
              <span className="text-[11px] font-medium">{t.auditSummary}</span>
            </button>
          </div>
        )}

        {/* PAGE LAYOUT TAB */}
        {activeTab === 'pageLayout' && (
          <div className="flex items-center gap-4 text-slate-700">
            <button onClick={onPrint} className="p-2 hover:bg-slate-100 rounded flex flex-col items-center gap-1">
              <Printer className="w-5 h-5 text-slate-600" />
              <span className="text-[11px] font-medium">{t.printSheet}</span>
            </button>
          </div>
        )}

        {/* REVIEW TAB */}
        {activeTab === 'review' && (
          <div className="flex items-center gap-4 text-slate-700">
            <button onClick={onShowAuditReport} className="p-2 hover:bg-slate-100 rounded flex flex-col items-center gap-1">
              <ShieldAlert className="w-5 h-5 text-emerald-600" />
              <span className="text-[11px] font-medium">{t.auditSummary}</span>
            </button>
            {onOpenCompareVersions && (
              <button onClick={onOpenCompareVersions} className="p-2 hover:bg-indigo-50 rounded flex flex-col items-center gap-1 text-indigo-800">
                <GitCompare className="w-5 h-5 text-indigo-600" />
                <span className="text-[11px] font-medium">{t.compareVersions}</span>
              </button>
            )}
          </div>
        )}

        {/* DEVELOPER TAB */}
        {activeTab === 'developer' && (
          <div className="flex items-center gap-3 text-slate-700 text-xs">
            <button
              onClick={onOpenBenchmark}
              className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 rounded flex flex-col items-center gap-1 font-semibold transition"
            >
              <Cpu className="w-5 h-5 text-emerald-700" />
              <span className="text-[11px]">{lang === 'ar' ? 'مختبر قياس الأداء والضغط' : 'Benchmark & Big Data Lab'}</span>
            </button>
            {onOpenSqlConsole && (
              <button
                onClick={onOpenSqlConsole}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700 rounded flex flex-col items-center gap-1 font-semibold transition"
              >
                <Database className="w-5 h-5 text-emerald-400" />
                <span className="text-[11px] text-white">{lang === 'ar' ? 'وحدة تحكم SQL' : 'SQL Console'}</span>
              </button>
            )}
            <div className="p-2 bg-slate-50 border border-slate-200 rounded flex flex-col gap-0.5">
              <span className="font-semibold text-slate-900">AST Formula Engine</span>
              <span className="text-slate-500 text-[10px]">Deterministic (No eval) - v1.0.0</span>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-200 rounded flex flex-col gap-0.5">
              <span className="font-semibold text-slate-900">DAG Cycle Guard</span>
              <span className="text-slate-500 text-[10px]">Active Recalculation Cache</span>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-200 rounded flex flex-col gap-0.5">
              <span className="font-semibold text-slate-900">Local AI & Arabic NLP</span>
              <span className="text-slate-500 text-[10px]">100% Offline Rule Engine</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
