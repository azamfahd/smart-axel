/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, X, Edit2, ZoomIn, ZoomOut, CheckCircle2 } from 'lucide-react';
import { WorksheetData, LanguageCode } from '../../types/index.ts';
import { getTranslation } from '../../core/i18n/translations.ts';

interface SheetsBarProps {
  sheets: WorksheetData[];
  activeSheetId: string;
  onSelectSheet: (id: string) => void;
  onAddSheet: () => void;
  onRenameSheet: (id: string, newName: string) => void;
  onDeleteSheet: (id: string) => void;
  zoom: number;
  onSetZoom: (zoom: number) => void;
  lang: LanguageCode;
  totalCellsCount: number;
}

export const SheetsBar: React.FC<SheetsBarProps> = ({
  sheets,
  activeSheetId,
  onSelectSheet,
  onAddSheet,
  onRenameSheet,
  onDeleteSheet,
  zoom,
  onSetZoom,
  lang,
  totalCellsCount,
}) => {
  const t = getTranslation(lang);
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  const handleStartRename = (sheet: WorksheetData) => {
    setEditingSheetId(sheet.id);
    setRenameText(sheet.name);
  };

  const handleCommitRename = (id: string) => {
    if (renameText.trim()) {
      onRenameSheet(id, renameText.trim());
    }
    setEditingSheetId(null);
  };

  return (
    <div className="h-8 bg-slate-100 border-t border-slate-300 flex items-center justify-between px-2 text-xs select-none shadow-xs">
      {/* Sheets Tab List & Add Button */}
      <div className="flex items-center gap-1 overflow-x-auto flex-1 mr-4">
        {/* Add Sheet Button */}
        <button
          onClick={onAddSheet}
          className="p-1 hover:bg-slate-200 text-slate-700 rounded transition"
          title={t.addSheet}
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-slate-300 mx-1" />

        {/* Sheet Tabs */}
        {sheets.map(sheet => {
          const isActive = sheet.id === activeSheetId;
          const isRenaming = editingSheetId === sheet.id;

          return (
            <div
              key={sheet.id}
              onClick={() => onSelectSheet(sheet.id)}
              className={`px-3 py-1 flex items-center gap-2 rounded-t border-t-2 text-xs font-medium cursor-pointer transition-colors ${
                isActive
                  ? 'bg-white text-emerald-800 border-emerald-600 shadow-xs'
                  : 'bg-slate-200/80 text-slate-700 border-transparent hover:bg-slate-200'
              }`}
            >
              {isRenaming ? (
                <input
                  type="text"
                  autoFocus
                  value={renameText}
                  onChange={e => setRenameText(e.target.value)}
                  onBlur={() => handleCommitRename(sheet.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCommitRename(sheet.id);
                    if (e.key === 'Escape') setEditingSheetId(null);
                  }}
                  className="w-28 px-1 py-0.5 text-xs bg-white border border-emerald-600 outline-none rounded"
                />
              ) : (
                <span onDoubleClick={() => handleStartRename(sheet)}>{sheet.name}</span>
              )}

              {/* Quick actions for sheet */}
              {isActive && !isRenaming && (
                <div className="flex items-center gap-1 opacity-70 hover:opacity-100">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleStartRename(sheet);
                    }}
                    title={t.renameSheet}
                  >
                    <Edit2 className="w-2.5 h-2.5 text-slate-500 hover:text-emerald-700" />
                  </button>
                  {sheets.length > 1 && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onDeleteSheet(sheet.id);
                      }}
                      title={t.deleteSheet}
                    >
                      <X className="w-2.5 h-2.5 text-slate-500 hover:text-red-600" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Right Status & Zoom Controls */}
      <div className="flex items-center gap-3 text-slate-600 text-[11px] font-sans">
        <div className="flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{lang === 'ar' ? 'جاهز' : 'Ready'}</span>
          <span className="text-slate-400">({totalCellsCount} {lang === 'ar' ? 'خلية' : 'cells'})</span>
        </div>

        <div className="h-3 w-[1px] bg-slate-300" />

        {/* Zoom Slider / Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSetZoom(Math.max(50, zoom - 10))}
            className="p-0.5 hover:bg-slate-200 rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5 text-slate-600" />
          </button>
          <span className="w-8 text-center font-mono text-[11px] font-semibold">{zoom}%</span>
          <button
            onClick={() => onSetZoom(Math.min(200, zoom + 10))}
            className="p-0.5 hover:bg-slate-200 rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );
};
