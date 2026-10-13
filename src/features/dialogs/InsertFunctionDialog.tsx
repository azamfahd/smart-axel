/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Sigma, Search } from 'lucide-react';
import { LanguageCode } from '../../types/index.ts';

interface InsertFunctionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFunction: (syntax: string) => void;
  lang: LanguageCode;
}

interface FunctionDoc {
  name: string;
  category: string;
  syntax: string;
  descAr: string;
  descEn: string;
}

const FUNCTIONS_LIST: FunctionDoc[] = [
  // Math & Trig
  { name: 'SUM', category: 'Math', syntax: '=SUM(A1:A10)', descAr: 'جمع كافة القيم الرقمية في النطاق المحدد.', descEn: 'Adds all the numbers in a range of cells.' },
  { name: 'ROUND', category: 'Math', syntax: '=ROUND(A1, 2)', descAr: 'تقريب الرقم إلى عدد محدد من المنازل العشرية.', descEn: 'Rounds a number to a specified number of digits.' },
  { name: 'ROUNDUP', category: 'Math', syntax: '=ROUNDUP(A1, 2)', descAr: 'تقريب الرقم لأعلى إلى عدد محدد من المنازل.', descEn: 'Rounds a number up, away from zero.' },
  { name: 'ROUNDDOWN', category: 'Math', syntax: '=ROUNDDOWN(A1, 2)', descAr: 'تقريب الرقم لأَسفل باتجاه الصفر.', descEn: 'Rounds a number down, toward zero.' },
  { name: 'ABS', category: 'Math', syntax: '=ABS(A1)', descAr: 'إرجاع القيمة المطلقة لرقم بدون إشارة.', descEn: 'Returns the absolute value of a number.' },
  { name: 'INT', category: 'Math', syntax: '=INT(A1)', descAr: 'تقريب الرقم لأقرب عدد صحيح أقل أو يساوي.', descEn: 'Rounds a number down to the nearest integer.' },
  { name: 'MOD', category: 'Math', syntax: '=MOD(A1, 3)', descAr: 'إرجاع باقي القسمة بعد قسمة رقم على مقسوم.', descEn: 'Returns the remainder from division.' },
  { name: 'SQRT', category: 'Math', syntax: '=SQRT(A1)', descAr: 'إرجاع الجذر التربيعي الموجب لرقم.', descEn: 'Returns a positive square root.' },
  { name: 'POWER', category: 'Math', syntax: '=POWER(A1, 2)', descAr: 'إرجاع نتيجة رفع رقم إلى قوة.', descEn: 'Returns the result of a number raised to a power.' },
  { name: 'LOG', category: 'Math', syntax: '=LOG(A1, 10)', descAr: 'إرجاع لوغاريتم رقم للأساس المحدد.', descEn: 'Returns the logarithm of a number to a specified base.' },
  { name: 'LN', category: 'Math', syntax: '=LN(A1)', descAr: 'إرجاع اللوغاريتم الطبيعي لرقم.', descEn: 'Returns the natural logarithm of a number.' },
  { name: 'EXP', category: 'Math', syntax: '=EXP(A1)', descAr: 'إرجاع القُسّي e مرفوعاً لقوة رقم.', descEn: 'Returns e raised to the power of a given number.' },
  { name: 'PI', category: 'Math', syntax: '=PI()', descAr: 'إرجاع قيمة الثابت ط (Pi) بدقة 15 منزلة.', descEn: 'Returns the constant Pi.' },

  // Statistical
  { name: 'AVERAGE', category: 'Statistical', syntax: '=AVERAGE(A1:A10)', descAr: 'حساب المتوسط الحسابي للأرقام في النطاق.', descEn: 'Returns the average (arithmetic mean) of the arguments.' },
  { name: 'COUNT', category: 'Statistical', syntax: '=COUNT(A1:A10)', descAr: 'عد الخلايا التي تحتوي على أرقام فقط.', descEn: 'Counts how many numbers are in the list of arguments.' },
  { name: 'COUNTA', category: 'Statistical', syntax: '=COUNTA(A1:A10)', descAr: 'عد كافة الخلايا غير الفارغة (نصوص وأرقام).', descEn: 'Counts the number of cells that are not empty.' },
  { name: 'MIN', category: 'Statistical', syntax: '=MIN(A1:A10)', descAr: 'إرجاع أصغر قيمة رقمية في النطاق.', descEn: 'Returns the smallest value in a set of values.' },
  { name: 'MAX', category: 'Statistical', syntax: '=MAX(A1:A10)', descAr: 'إرجاع أكبر قيمة رقمية في النطاق.', descEn: 'Returns the largest value in a set of values.' },
  { name: 'MEDIAN', category: 'Statistical', syntax: '=MEDIAN(A1:A10)', descAr: 'إرجاع الوسيط أو الرقم في منتصف الأرقام.', descEn: 'Returns the median of the given numbers.' },
  { name: 'STDEV', category: 'Statistical', syntax: '=STDEV(A1:A10)', descAr: 'حساب الانحراف المعياري بناءً على عينة.', descEn: 'Estimates standard deviation based on a sample.' },
  { name: 'VAR', category: 'Statistical', syntax: '=VAR(A1:A10)', descAr: 'تقدير التباين بناءً على عينة.', descEn: 'Estimates variance based on a sample.' },
  { name: 'SUMIF', category: 'Statistical', syntax: '=SUMIF(A1:A10, ">50", B1:B10)', descAr: 'جمع الخلايا التي تلبي شرطاً محدداً.', descEn: 'Adds the cells specified by a given criteria.' },
  { name: 'COUNTIF', category: 'Statistical', syntax: '=COUNTIF(A1:A10, "Completed")', descAr: 'عد الخلايا التي تلبي شرطاً محدداً.', descEn: 'Counts the number of cells that meet a criterion.' },
  { name: 'AVERAGEIF', category: 'Statistical', syntax: '=AVERAGEIF(A1:A10, ">50", B1:B10)', descAr: 'متوسط الخلايا التي تلبي شرطاً محدداً.', descEn: 'Returns the average of all the cells that meet a criteria.' },

  // Logical
  { name: 'IF', category: 'Logical', syntax: '=IF(A1>100, "High", "Low")', descAr: 'التحقق من شرط وإرجاع قيمة معينة عند تحقق الشرط.', descEn: 'Specifies a logical test to perform.' },
  { name: 'IFERROR', category: 'Logical', syntax: '=IFERROR(A1/B1, 0)', descAr: 'إرجاع قيمة بديلة إذا كانت الدالة خطأ.', descEn: 'Returns a value you specify if a formula evaluates to an error.' },
  { name: 'AND', category: 'Logical', syntax: '=AND(A1>0, B1>0)', descAr: 'التحقق مما إذا كانت جميع الشروط صحيحة.', descEn: 'Returns TRUE if all its arguments are TRUE.' },
  { name: 'OR', category: 'Logical', syntax: '=OR(A1>0, B1>0)', descAr: 'التحقق مما إذا كان أي شرط صحيحاً.', descEn: 'Returns TRUE if any argument is TRUE.' },
  { name: 'NOT', category: 'Logical', syntax: '=NOT(A1>0)', descAr: 'عكس قيمة الشرط المنطقي.', descEn: 'Reverses the logic of its argument.' },
  { name: 'TRUE', category: 'Logical', syntax: '=TRUE()', descAr: 'إرجاع القيمة المنطقية صحيح (True).', descEn: 'Returns the logical value TRUE.' },
  { name: 'FALSE', category: 'Logical', syntax: '=FALSE()', descAr: 'إرجاع القيمة المنطقية خطأ (False).', descEn: 'Returns the logical value FALSE.' },

  // Lookup & Reference
  { name: 'VLOOKUP', category: 'Lookup', syntax: '=VLOOKUP("Key", A1:D10, 2, FALSE)', descAr: 'البحث عن قيمة في العمود الأول واسترجاع قيمة مقابلة.', descEn: 'Looks for a value in the leftmost column of a table.' },
  { name: 'HLOOKUP', category: 'Lookup', syntax: '=HLOOKUP("Key", A1:D10, 2, FALSE)', descAr: 'البحث عن قيمة في الصف العلوي واسترجاع قيمة مقابلة.', descEn: 'Looks for a value in the top row of a table.' },
  { name: 'XLOOKUP', category: 'Lookup', syntax: '=XLOOKUP("Key", A1:A10, B1:B10)', descAr: 'دالة بحث مرنة في المصفوفات والنطاقات في أي اتجاه.', descEn: 'Searches a range or an array, and returns an item matching.' },
  { name: 'INDEX', category: 'Lookup', syntax: '=INDEX(A1:C10, 2, 3)', descAr: 'استرجاع قيمة خلية بتقاطع صف وعمود محددين.', descEn: 'Returns a value or reference of the cell at the intersection.' },
  { name: 'MATCH', category: 'Lookup', syntax: '=MATCH("Key", A1:A10, 0)', descAr: 'إرجاع الموضع النسبي لعنصر في نطاق محدد.', descEn: 'Returns the relative position of an item in an array.' },
  { name: 'CHOOSE', category: 'Lookup', syntax: '=CHOOSE(2, "A", "B", "C")', descAr: 'اختيار قيمة من قائمة خيارات بناءً على الفهرس.', descEn: 'Chooses a value or action from a list of values.' },

  // Text
  { name: 'CONCAT', category: 'Text', syntax: '=CONCAT(A1, " ", B1)', descAr: 'دمج سلسلتين نصيتين أو أكثر في نص واحد.', descEn: 'Combines the text from multiple ranges and/or strings.' },
  { name: 'TEXTJOIN', category: 'Text', syntax: '=TEXTJOIN(", ", TRUE, A1:A5)', descAr: 'دمج نصوص بفاصل محدد مع تجاهل الخلايا الفارغة.', descEn: 'Combines text from multiple ranges with delimiter.' },
  { name: 'TRIM', category: 'Text', syntax: '=TRIM(A1)', descAr: 'إزالة المسافات الزائدة البادئة واللاحقة والمكررة.', descEn: 'Removes all spaces from text except for single spaces.' },
  { name: 'LEN', category: 'Text', syntax: '=LEN(A1)', descAr: 'حساب عدد الأحرف في النص.', descEn: 'Returns the number of characters in a text string.' },
  { name: 'LEFT', category: 'Text', syntax: '=LEFT(A1, 5)', descAr: 'استخراج الأحرف الأولى من جهة اليسار.', descEn: 'Returns the leftmost characters from a text string.' },
  { name: 'RIGHT', category: 'Text', syntax: '=RIGHT(A1, 5)', descAr: 'استخراج الأحرف الأخيرة من جهة اليمين.', descEn: 'Returns the rightmost characters from a text string.' },
  { name: 'MID', category: 'Text', syntax: '=MID(A1, 2, 3)', descAr: 'استخراج عدد محدد من الأحرف من منتصف النص.', descEn: 'Returns a specific number of characters from a text string.' },
  { name: 'UPPER', category: 'Text', syntax: '=UPPER(A1)', descAr: 'تحويل الحروف الإنجليزية إلى أحرف كبيرة.', descEn: 'Converts text to uppercase.' },
  { name: 'LOWER', category: 'Text', syntax: '=LOWER(A1)', descAr: 'تحويل الحروف الإنجليزية إلى أحرف صغيرة.', descEn: 'Converts text to lowercase.' },
  { name: 'SUBSTITUTE', category: 'Text', syntax: '=SUBSTITUTE(A1, "old", "new")', descAr: 'استبدال نص قديم بنص جديد داخل السلسلة.', descEn: 'Substitutes new text for old text in a text string.' },
  { name: 'REPLACE', category: 'Text', syntax: '=REPLACE(A1, 1, 3, "New")', descAr: 'استبدال جزء من النص بأحرف جديدة.', descEn: 'Replaces characters within text.' },
  { name: 'FIND', category: 'Text', syntax: '=FIND("a", A1)', descAr: 'البحث عن موضع نص داخل نص آخر (حساس لحالة الأحرف).', descEn: 'Finds one text value within another.' },

  // Date & Time
  { name: 'TODAY', category: 'Date', syntax: '=TODAY()', descAr: 'إرجاع تاريخ اليوم الحالي بتنسيق قياسي.', descEn: 'Returns the current date.' },
  { name: 'NOW', category: 'Date', syntax: '=NOW()', descAr: 'إرجاع التاريخ والوقت الحالي.', descEn: 'Returns the current date and time.' },
  { name: 'DATE', category: 'Date', syntax: '=DATE(2026, 12, 31)', descAr: 'إنشاء تاريخ من أجزاء السنة والشهر واليوم.', descEn: 'Returns the sequential serial number that represents a particular date.' },
  { name: 'YEAR', category: 'Date', syntax: '=YEAR(A1)', descAr: 'استخراج سنة التاريخ.', descEn: 'Returns the year of a date.' },
  { name: 'MONTH', category: 'Date', syntax: '=MONTH(A1)', descAr: 'استخراج شهر التاريخ (1-12).', descEn: 'Returns the month of a date.' },
  { name: 'DAY', category: 'Date', syntax: '=DAY(A1)', descAr: 'استخراج يوم التاريخ (1-31).', descEn: 'Returns the day of a date.' },

  // Information & Financial
  { name: 'ISBLANK', category: 'Information', syntax: '=ISBLANK(A1)', descAr: 'التحقق مما إذا كانت الخلية فارغة.', descEn: 'Checks if a value is blank.' },
  { name: 'ISNUMBER', category: 'Information', syntax: '=ISNUMBER(A1)', descAr: 'التحقق مما إذا كانت القيمة رقماً.', descEn: 'Checks if a value is a number.' },
  { name: 'ISTEXT', category: 'Information', syntax: '=ISTEXT(A1)', descAr: 'التحقق مما إذا كانت القيمة نصاً.', descEn: 'Checks if a value is text.' },
  { name: 'PMT', category: 'Financial', syntax: '=PMT(0.05/12, 60, -10000)', descAr: 'حساب القسط الدوري لقرض أو استثمار.', descEn: 'Calculates the payment for a loan based on constant payments and a constant interest rate.' },

  // Dynamic Arrays (Microsoft 365)
  { name: 'FILTER', category: 'Dynamic Array', syntax: '=FILTER(A1:A10, B1:B10>50)', descAr: 'تصفية نطاق من البيانات بناءً على شرط معيين.', descEn: 'Filters a range of data based on criteria you define.' },
  { name: 'SORT', category: 'Dynamic Array', syntax: '=SORT(A1:A10, 1, 1)', descAr: 'فرز محتويات نطاق أو مصفوفة تصاعدياً أو تنازلياً.', descEn: 'Sorts the contents of a range or array.' },
  { name: 'UNIQUE', category: 'Dynamic Array', syntax: '=UNIQUE(A1:A10)', descAr: 'استخراج القوائم الفريدة بدون تكرار.', descEn: 'Returns a list of unique values from a list or range.' },
  { name: 'SEQUENCE', category: 'Dynamic Array', syntax: '=SEQUENCE(10, 1, 1, 1)', descAr: 'إنشاء تسلسل رقمي متتالي (أفقي أو عمودي).', descEn: 'Generates a list of sequential numbers.' },
  { name: 'XMATCH', category: 'Lookup', syntax: '=XMATCH("Key", A1:A10)', descAr: 'البحث عن قيمة وإرجاع موضعها النسبي بدقة عالية.', descEn: 'Searches for a specified item in an array and returns its relative position.' },
];

export const InsertFunctionDialog: React.FC<InsertFunctionDialogProps> = ({
  isOpen,
  onClose,
  onSelectFunction,
  lang,
}) => {
  const [search, setSearch] = useState('');
  const [selectedFunc, setSelectedFunc] = useState<FunctionDoc>(FUNCTIONS_LIST[0]);

  if (!isOpen) return null;

  const filtered = FUNCTIONS_LIST.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sigma className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold">
              {lang === 'ar' ? 'إدراج دالة حسابية (Insert Function fx)' : 'Insert Function (fx)'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={lang === 'ar' ? 'ابحث عن اسم الدالة (مثل: SUM, VLOOKUP, IF)...' : 'Search function name...'}
              className="w-full h-9 pl-9 pr-3 text-xs border border-slate-300 rounded-lg focus:outline-emerald-600"
            />
          </div>

          {/* Functions List */}
          <div className="h-44 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
            {filtered.map(fn => (
              <div
                key={fn.name}
                onClick={() => setSelectedFunc(fn)}
                className={`p-2 px-3 text-xs flex items-center justify-between cursor-pointer transition ${
                  selectedFunc.name === fn.name ? 'bg-purple-50 text-purple-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="font-mono">{fn.name}</span>
                <span className="text-[10px] text-slate-400 font-sans">{fn.category}</span>
              </div>
            ))}
          </div>

          {/* Selected Function Details */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
            <div className="font-mono font-bold text-slate-900">{selectedFunc.syntax}</div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {lang === 'ar' ? selectedFunc.descAr : selectedFunc.descEn}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-300 hover:bg-slate-100 rounded text-xs text-slate-700 transition"
          >
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={() => {
              onSelectFunction(selectedFunc.syntax);
              onClose();
            }}
            className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded text-xs font-semibold shadow-xs transition"
          >
            {lang === 'ar' ? 'إدراج الدالة' : 'Insert'}
          </button>
        </div>
      </div>
    </div>
  );
};
