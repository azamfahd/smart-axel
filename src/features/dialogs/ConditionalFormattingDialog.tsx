/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Sparkles, Palette } from 'lucide-react';
import { LanguageCode } from '../../types/index.ts';

interface ConditionalFormattingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyRule: (rule: {
    type: 'greaterThan' | 'lessThan' | 'equal' | 'duplicate';
    value: string;
    style: { backgroundColor: string; textColor: string };
  }) => void;
  lang: LanguageCode;
}

export const ConditionalFormattingDialog: React.FC<ConditionalFormattingDialogProps> = ({
  isOpen,
  onClose,
  onApplyRule,
  lang,
}) => {
  const [ruleType, setRuleType] = useState<'greaterThan' | 'lessThan' | 'equal' | 'duplicate'>('greaterThan');
  const [ruleValue, setRuleValue] = useState('10000');
  const [presetColor, setPresetColor] = useState<'red' | 'yellow' | 'green'>('red');

  if (!isOpen) return null;

  const colorPresets = {
    red: { backgroundColor: '#FEE2E2', textColor: '#991B1B' },
    yellow: { backgroundColor: '#FEF3C7', textColor: '#92400E' },
    green: { backgroundColor: '#DCFCE7', textColor: '#166534' },
  };

  const handleApply = () => {
    onApplyRule({
      type: ruleType,
      value: ruleValue,
      style: colorPresets[presetColor],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold">
              {lang === 'ar' ? 'التنسيق الشرطي (Conditional Formatting)' : 'Conditional Formatting'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">
              {lang === 'ar' ? 'نوع القاعدة الشرطية:' : 'Rule Condition:'}
            </label>
            <select
              value={ruleType}
              onChange={e => setRuleType(e.target.value as any)}
              className="w-full h-8 px-2 border border-slate-300 rounded focus:outline-emerald-600 bg-white"
            >
              <option value="greaterThan">{lang === 'ar' ? 'أكبر من (Greater than)' : 'Greater than'}</option>
              <option value="lessThan">{lang === 'ar' ? 'أصغر من (Less than)' : 'Less than'}</option>
              <option value="equal">{lang === 'ar' ? 'يساوي (Equal to)' : 'Equal to'}</option>
              <option value="duplicate">{lang === 'ar' ? 'القيم المكررة (Duplicate Values)' : 'Duplicate Values'}</option>
            </select>
          </div>

          {ruleType !== 'duplicate' && (
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">
                {lang === 'ar' ? 'القيمة المقارنة:' : 'Comparison Value:'}
              </label>
              <input
                type="text"
                value={ruleValue}
                onChange={e => setRuleValue(e.target.value)}
                className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-emerald-600"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">
              {lang === 'ar' ? 'نمط التلوين والتمييز:' : 'Highlight Style:'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPresetColor('red')}
                className={`p-2 rounded border text-center font-semibold text-[11px] transition ${
                  presetColor === 'red' ? 'ring-2 ring-red-600' : ''
                }`}
                style={{ backgroundColor: colorPresets.red.backgroundColor, color: colorPresets.red.textColor }}
              >
                {lang === 'ar' ? 'تعبئة حمراء فاتحة' : 'Light Red'}
              </button>
              <button
                type="button"
                onClick={() => setPresetColor('yellow')}
                className={`p-2 rounded border text-center font-semibold text-[11px] transition ${
                  presetColor === 'yellow' ? 'ring-2 ring-amber-600' : ''
                }`}
                style={{ backgroundColor: colorPresets.yellow.backgroundColor, color: colorPresets.yellow.textColor }}
              >
                {lang === 'ar' ? 'تعبئة صفراء' : 'Light Yellow'}
              </button>
              <button
                type="button"
                onClick={() => setPresetColor('green')}
                className={`p-2 rounded border text-center font-semibold text-[11px] transition ${
                  presetColor === 'green' ? 'ring-2 ring-emerald-600' : ''
                }`}
                style={{ backgroundColor: colorPresets.green.backgroundColor, color: colorPresets.green.textColor }}
              >
                {lang === 'ar' ? 'تعبئة خضراء' : 'Light Green'}
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-300 hover:bg-slate-100 rounded text-xs text-slate-700 transition"
          >
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold shadow-xs transition"
          >
            {lang === 'ar' ? 'تطبيق التنسيق الشرطي' : 'Apply Formatting'}
          </button>
        </div>
      </div>
    </div>
  );
};
