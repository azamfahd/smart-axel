/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Search, Replace, Check } from 'lucide-react';
import { WorksheetData, LanguageCode } from '../../types/index.ts';
import { coordsToRef } from '../../core/formula/cellUtils.ts';

interface FindReplaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sheet: WorksheetData;
  onSelectCell: (row: number, col: number) => void;
  onUpdateCell: (row: number, col: number, val: any) => void;
  lang: LanguageCode;
}

export const FindReplaceDialog: React.FC<FindReplaceDialogProps> = ({
  isOpen,
  onClose,
  sheet,
  onSelectCell,
  onUpdateCell,
  lang,
}) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [matchEntireCell, setMatchEntireCell] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [matchCount, setMatchCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const findMatches = () => {
    if (!findText) return [];

    const matches: { r: number; c: number; val: string }[] = [];
    Object.keys(sheet.cells).forEach(key => {
      const [rStr, cStr] = key.split(',');
      const r = parseInt(rStr, 10);
      const c = parseInt(cStr, 10);
      const cell = sheet.cells[key];
      if (cell && cell.rawValue !== null && cell.rawValue !== undefined) {
        const valStr = String(cell.rawValue);
        const searchTarget = matchCase ? valStr : valStr.toLowerCase();
        const query = matchCase ? findText : findText.toLowerCase();

        const isMatch = matchEntireCell ? searchTarget === query : searchTarget.includes(query);
        if (isMatch) {
          matches.push({ r, c, val: valStr });
        }
      }
    });

    return matches;
  };

  const handleFindNext = () => {
    const matches = findMatches();
    setMatchCount(matches.length);

    if (matches.length === 0) {
      setStatusMessage(lang === 'ar' ? 'لم يتم العثور على أي تطابق.' : 'No matches found.');
      return;
    }

    const first = matches[0];
    onSelectCell(first.r, first.c);
    setStatusMessage(
      lang === 'ar'
        ? `تم العثور على ${matches.length} نتيجة. تم الانتقال إلى ${coordsToRef(first.r, first.c)}`
        : `Found ${matches.length} matches. Jumped to ${coordsToRef(first.r, first.c)}`
    );
  };

  const handleReplaceCurrent = () => {
    const matches = findMatches();
    if (matches.length === 0) {
      setStatusMessage(lang === 'ar' ? 'لا يوجد نص للاستبدال.' : 'No match to replace.');
      return;
    }

    const target = matches[0];
    let newVal: string;

    if (matchEntireCell) {
      newVal = replaceText;
    } else {
      const regex = new RegExp(findText, matchCase ? 'g' : 'gi');
      newVal = target.val.replace(regex, replaceText);
    }

    onUpdateCell(target.r, target.c, newVal);
    setStatusMessage(lang === 'ar' ? `تم استبدال القيمة في الخلية ${coordsToRef(target.r, target.c)}` : `Replaced value in ${coordsToRef(target.r, target.c)}`);
  };

  const handleReplaceAll = () => {
    const matches = findMatches();
    if (matches.length === 0) {
      setStatusMessage(lang === 'ar' ? 'لم يتم العثور على نتائج للاستبدال.' : 'No matches to replace.');
      return;
    }

    matches.forEach(m => {
      let newVal: string;
      if (matchEntireCell) {
        newVal = replaceText;
      } else {
        const regex = new RegExp(findText, matchCase ? 'g' : 'gi');
        newVal = m.val.replace(regex, replaceText);
      }
      onUpdateCell(m.r, m.c, newVal);
    });

    setStatusMessage(lang === 'ar' ? `تم استبدال ${matches.length} خلية بنجاح.` : `Replaced all ${matches.length} instances.`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold">
              {lang === 'ar' ? 'بحث واستبدال (Find & Replace)' : 'Find and Replace'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Find Input */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">
              {lang === 'ar' ? 'البحث عن:' : 'Find what:'}
            </label>
            <input
              type="text"
              autoFocus
              value={findText}
              onChange={e => setFindText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFindNext()}
              className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-emerald-600 font-mono text-xs"
              placeholder={lang === 'ar' ? 'اكتب النص أو القيمة للبحث...' : 'Enter search text...'}
            />
          </div>

          {/* Replace Input */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">
              {lang === 'ar' ? 'استبدال بـ:' : 'Replace with:'}
            </label>
            <input
              type="text"
              value={replaceText}
              onChange={e => setReplaceText(e.target.value)}
              className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-emerald-600 font-mono text-xs"
              placeholder={lang === 'ar' ? 'اكتب القيمة البديلة...' : 'Enter replacement text...'}
            />
          </div>

          {/* Options Checkboxes */}
          <div className="flex items-center gap-4 text-[11px] text-slate-600">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={e => setMatchCase(e.target.checked)}
                className="rounded text-emerald-600"
              />
              <span>{lang === 'ar' ? 'مطابقة حالة الأحرف' : 'Match case'}</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={matchEntireCell}
                onChange={e => setMatchEntireCell(e.target.checked)}
                className="rounded text-emerald-600"
              />
              <span>{lang === 'ar' ? 'مطابقة كامل الخلية' : 'Entire cell'}</span>
            </label>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className="p-2 bg-slate-100 rounded text-slate-700 font-medium text-[11px]">
              {statusMessage}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={handleReplaceAll}
            disabled={!findText}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded text-xs font-semibold transition"
          >
            {lang === 'ar' ? 'استبدال الكل' : 'Replace All'}
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleReplaceCurrent}
              disabled={!findText}
              className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 disabled:opacity-50 rounded text-xs text-slate-700 font-medium transition"
            >
              {lang === 'ar' ? 'استبدال' : 'Replace'}
            </button>
            <button
              onClick={handleFindNext}
              disabled={!findText}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-xs transition"
            >
              {lang === 'ar' ? 'بحث عن التالي' : 'Find Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
