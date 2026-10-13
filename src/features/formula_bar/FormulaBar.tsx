/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Code2 } from 'lucide-react';
import { coordsToRef, refToCoords } from '../../core/formula/cellUtils.ts';

import { WorksheetData } from '../../types/index.ts';

const AUTOCOMPLETE_FUNCTIONS = [
  { name: 'SUM', syntax: 'SUM(number1, [number2], ...)', desc: 'حساب مجموع القيم الرقمية' },
  { name: 'AVERAGE', syntax: 'AVERAGE(number1, [number2], ...)', desc: 'حساب المتوسط الحسابي' },
  { name: 'COUNT', syntax: 'COUNT(value1, [value2], ...)', desc: 'عد الخلايا الرقمية فقط' },
  { name: 'COUNTA', syntax: 'COUNTA(value1, [value2], ...)', desc: 'عد كافة الخلايا غير الفارغة' },
  { name: 'MIN', syntax: 'MIN(number1, [number2], ...)', desc: 'استخراج أصغر قيمة' },
  { name: 'MAX', syntax: 'MAX(number1, [number2], ...)', desc: 'استخراج أكبر قيمة' },
  { name: 'IF', syntax: 'IF(test, true_val, [false_val])', desc: 'التحقق المنطقي المشروط' },
  { name: 'IFS', syntax: 'IFS(cond1, val1, [cond2, val2], ...)', desc: 'فحص شروط متعددة' },
  { name: 'VLOOKUP', syntax: 'VLOOKUP(lookup, table, col_idx, [exact])', desc: 'البحث العمودي في الجدول' },
  { name: 'XLOOKUP', syntax: 'XLOOKUP(val, lookup_arr, return_arr)', desc: 'البحث المتقدم ثنائي الاتجاه' },
  { name: 'INDEX', syntax: 'INDEX(array, row_num, [col_num])', desc: 'قيمة الخلية في التقاطع' },
  { name: 'MATCH', syntax: 'MATCH(lookup, array, [match_type])', desc: 'الموضع النسبي للقيمة' },
  { name: 'CONCAT', syntax: 'CONCAT(text1, [text2], ...)', desc: 'دمج النصوص' },
  { name: 'TRIM', syntax: 'TRIM(text)', desc: 'إزالة المسافات الزائدة' },
  { name: 'ROUND', syntax: 'ROUND(num, digits)', desc: 'تقريب الأرقام العشرية' },
  { name: 'STDEV', syntax: 'STDEV(val1, [val2], ...)', desc: 'حساب الانحراف المعياري' },
  { name: 'MEDIAN', syntax: 'MEDIAN(val1, [val2], ...)', desc: 'حساب الوسيط الإحصائي' },
  { name: 'TODAY', syntax: 'TODAY()', desc: 'تاريخ اليوم الحالي' },
  { name: 'NOW', syntax: 'NOW()', desc: 'التاريخ والوقت الحالي' },
];

interface FormulaBarProps {
  selectedRange: { startRow: number; startCol: number; endRow: number; endCol: number };
  activeSheet: WorksheetData;
  cellValue: string;
  onCommitValue: (val: string) => void;
  onSelectCell: (row: number, col: number) => void;
  onOpenInsertFunction: () => void;
}

export const FormulaBar: React.FC<FormulaBarProps> = ({
  selectedRange,
  activeSheet,
  cellValue,
  onCommitValue,
  onSelectCell,
  onOpenInsertFunction,
}) => {
  const minR = Math.min(selectedRange.startRow, selectedRange.endRow);
  const maxR = Math.max(selectedRange.startRow, selectedRange.endRow);
  const minC = Math.min(selectedRange.startCol, selectedRange.endCol);
  const maxC = Math.max(selectedRange.startCol, selectedRange.endCol);

  const startRef = coordsToRef(minR, minC);
  const endRef = coordsToRef(maxR, maxC);
  const rangeRefText = (minR === maxR && minC === maxC) ? startRef : `${startRef}:${endRef}`;

  const [nameBoxText, setNameBoxText] = useState(rangeRefText);
  const [editText, setEditText] = useState(cellValue);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNameBoxText(rangeRefText);
  }, [rangeRefText]);

  useEffect(() => {
    setEditText(cellValue);
  }, [cellValue]);

  // Compute live statistics of selected range
  let numericSum = 0;
  let numericCount = 0;
  let totalCount = 0;

  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      totalCount++;
      const cell = activeSheet?.cells[`${r},${c}`];
      if (cell && cell.rawValue !== null && cell.rawValue !== undefined) {
        const val = Number(cell.rawValue);
        if (!isNaN(val)) {
          numericSum += val;
          numericCount++;
        }
      }
    }
  }
  const numericAverage = numericCount > 0 ? numericSum / numericCount : 0;

  // Compute active function match
  const formulaMatch = editText.startsWith('=') ? editText.match(/[A-Za-z]+$/) : null;
  const activeToken = formulaMatch ? formulaMatch[0].toUpperCase() : '';
  const suggestions = (showSuggestions && activeToken.length >= 1)
    ? AUTOCOMPLETE_FUNCTIONS.filter(f => f.name.startsWith(activeToken)).slice(0, 5)
    : [];

  const handleNameBoxKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const coords = refToCoords(nameBoxText);
      if (coords) {
        onSelectCell(coords.row, coords.col);
      } else {
        setNameBoxText(rangeRefText);
      }
    }
  };

  const handleApplySuggestion = (fnName: string) => {
    if (!formulaMatch) return;
    const tokenStart = editText.length - activeToken.length;
    const newText = editText.slice(0, tokenStart) + `${fnName}(`;
    setEditText(newText);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && suggestions.length > 0) {
      e.preventDefault();
      handleApplySuggestion(suggestions[0].name);
    } else if (e.key === 'Enter') {
      setShowSuggestions(false);
      onCommitValue(editText);
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setEditText(cellValue);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center h-8 bg-white border-b border-slate-300 px-2 gap-1.5 text-xs select-none relative">
      {/* Name Box */}
      <input
        type="text"
        value={nameBoxText}
        onChange={e => setNameBoxText(e.target.value.toUpperCase())}
        onKeyDown={handleNameBoxKeyDown}
        className="w-16 h-6 px-1.5 font-mono text-center font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-emerald-600 uppercase"
        title="Cell Coordinate (Type to jump)"
      />

      <div className="h-4 w-[1px] bg-slate-300 mx-0.5" />

      {/* Action buttons (Cancel / Commit) */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => {
            setEditText(cellValue);
            setIsEditing(false);
            setShowSuggestions(false);
          }}
          disabled={!isEditing}
          className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30 rounded transition"
          title="Cancel (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            onCommitValue(editText);
            setIsEditing(false);
            setShowSuggestions(false);
          }}
          disabled={!isEditing}
          className="p-1 text-slate-400 hover:text-emerald-600 disabled:opacity-30 rounded transition"
          title="Commit (Enter)"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* fx Button */}
      <button
        onClick={onOpenInsertFunction}
        className="px-1.5 h-6 font-serif italic font-bold text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded transition"
        title="Insert Function fx"
      >
        fx
      </button>

      <div className="h-4 w-[1px] bg-slate-300 mx-0.5" />

      {/* Live Selection Statistics Badge */}
      {totalCount > 1 && (
        <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-700 bg-emerald-50/70 border border-emerald-200/60 px-2 py-0.5 rounded">
          {numericCount > 0 && (
            <>
              <span><strong className="text-emerald-900">المجموع:</strong> {numericSum.toLocaleString()}</span>
              <span><strong className="text-emerald-900">المتوسط:</strong> {numericAverage.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </>
          )}
          <span><strong className="text-emerald-900">العدد:</strong> {totalCount}</span>
        </div>
      )}

      {/* Formula & Value Expression Input */}
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          value={editText}
          onChange={e => {
            setEditText(e.target.value);
            setIsEditing(true);
            setShowSuggestions(e.target.value.startsWith('='));
          }}
          onFocus={() => {
            setIsEditing(true);
            if (editText.startsWith('=')) setShowSuggestions(true);
          }}
          onBlur={() => {
            // Delay closing to allow clicking suggestions
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          onKeyDown={handleInputKeyDown}
          className="w-full h-6 px-2 font-mono text-slate-900 bg-transparent focus:bg-white focus:border focus:border-emerald-600 rounded outline-none"
          placeholder="Enter value or formula starting with = (e.g. =SUM(E2:E10))"
        />

        {/* Formula Autocomplete Dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute left-0 top-7 w-72 bg-white border border-slate-300 rounded shadow-xl z-50 py-1 text-xs font-sans">
            <div className="px-2 py-0.5 text-[10px] text-slate-400 font-semibold border-b border-slate-100 flex items-center justify-between">
              <span>دوال مقترحة (اضغط Tab للاختيار)</span>
              <Code2 className="w-3 h-3 text-slate-400" />
            </div>
            {suggestions.map((fn, idx) => (
              <div
                key={fn.name}
                onMouseDown={() => handleApplySuggestion(fn.name)}
                className={`px-2.5 py-1.5 cursor-pointer hover:bg-emerald-50 transition flex flex-col gap-0.5 ${
                  idx === 0 ? 'bg-slate-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold font-mono text-emerald-800">{fn.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{fn.syntax}</span>
                </div>
                <div className="text-[11px] text-slate-500 truncate">{fn.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
