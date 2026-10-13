/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, CheckSquare, ListFilter } from 'lucide-react';
import { LanguageCode } from '../../types/index.ts';

interface DataValidationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyValidation: (validation: { type: 'list' | 'number'; values?: string[]; min?: number; max?: number }) => void;
  lang: LanguageCode;
}

export const DataValidationDialog: React.FC<DataValidationDialogProps> = ({
  isOpen,
  onClose,
  onApplyValidation,
  lang,
}) => {
  const [valType, setValType] = useState<'list' | 'number'>('list');
  const [listValues, setListValues] = useState('معتمد, معلق, مرفوض');
  const [minVal, setMinVal] = useState('0');
  const [maxVal, setMaxVal] = useState('100000');

  if (!isOpen) return null;

  const handleApply = () => {
    if (valType === 'list') {
      const items = listValues.split(',').map(v => v.trim()).filter(Boolean);
      onApplyValidation({ type: 'list', values: items });
    } else {
      onApplyValidation({
        type: 'number',
        min: parseFloat(minVal) || 0,
        max: parseFloat(maxVal) || 100000,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold">
              {lang === 'ar' ? 'التحقق من صحة البيانات (Data Validation)' : 'Data Validation'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">
              {lang === 'ar' ? 'معيار التحقق:' : 'Validation Criteria:'}
            </label>
            <select
              value={valType}
              onChange={e => setValType(e.target.value as any)}
              className="w-full h-8 px-2 border border-slate-300 rounded focus:outline-emerald-600 bg-white"
            >
              <option value="list">{lang === 'ar' ? 'قائمة منسدلة (Dropdown List)' : 'Dropdown List'}</option>
              <option value="number">{lang === 'ar' ? 'نطاق رقمي محدد (Number Range)' : 'Number Range'}</option>
            </select>
          </div>

          {valType === 'list' ? (
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">
                {lang === 'ar' ? 'عناصر القائمة (مفصولة بفاصلة ,):' : 'List items (separated by comma):'}
              </label>
              <input
                type="text"
                value={listValues}
                onChange={e => setListValues(e.target.value)}
                placeholder="معتمد, قيد المراجعة, ملغي"
                className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-emerald-600"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">{lang === 'ar' ? 'الحد الأدنى:' : 'Minimum:'}</label>
                <input
                  type="number"
                  value={minVal}
                  onChange={e => setMinVal(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-emerald-600"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">{lang === 'ar' ? 'الحد الأقصى:' : 'Maximum:'}</label>
                <input
                  type="number"
                  value={maxVal}
                  onChange={e => setMaxVal(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-300 rounded focus:outline-emerald-600"
                />
              </div>
            </div>
          )}
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
            {lang === 'ar' ? 'تطبيق التحقق' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
};
