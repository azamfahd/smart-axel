/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LanguageCode } from '../../types/index.ts';

export const translations = {
  ar: {
    appTitle: 'DataAudit AI Pro',
    appSubtitle: 'برنامج جداول بيانات متوافق مع Excel ومزود بوكيل ذكاء اصطناعي محلي للتدقيق',
    file: 'ملف',
    home: 'الصفحة الرئيسية',
    insert: 'إدراج',
    pageLayout: 'تخطيط الصفحة',
    formulas: 'الصيغ',
    data: 'البيانات',
    review: 'مراجعة',
    view: 'عرض',
    developer: 'المطور',
    smartAudit: 'تدقيق ذكي',
    aiAssistant: 'مساعد الذكاء',

    // File tab
    newWorkbook: 'مصنف جديد',
    openFile: 'فتح ملف (XLSX / CSV)',
    saveFile: 'حفظ المصنف',
    exportXlsx: 'تصدير بتنسيق Excel (.xlsx)',
    exportCsv: 'تصدير بتنسيق CSV',
    printSheet: 'طباعة ورقة العمل',
    backupSheet: 'نسخ احتياطي محلي',
    restoreBackup: 'استعادة نسخة احتياطية',
    workbookInfo: 'خصائص المصنف',

    // Home - Clipboard
    clipboard: 'الحافظة',
    cut: 'قص',
    copy: 'نسخ',
    paste: 'لصق',
    formatPainter: 'نسخ التنسيق',

    // Home - Font
    font: 'الخط',
    bold: 'غامق',
    italic: 'مائل',
    underline: 'تسطير',
    fontSize: 'حجم الخط',
    textColor: 'لون النص',
    fillColor: 'لون التعبئة',
    borders: 'الحدود',

    // Home - Alignment
    alignment: 'المحاذاة',
    alignLeft: 'محاذاة لليسار',
    alignCenter: 'توسيط',
    alignRight: 'محاذاة لليمين',
    wrapText: 'التفاف النص',
    mergeCenter: 'دمج وتوسيط',

    // Home - Numbers
    numberFormat: 'الرقم',
    formatGeneral: 'عام',
    formatNumber: 'رقم عشري',
    formatCurrency: 'عملة (ريال / $)',
    formatPercent: 'نسبة مئوية (%)',
    formatDate: 'تاريخ',
    formatText: 'نص',
    increaseDecimals: 'زيادة المنازل العشرية',
    decreaseDecimals: 'تقليل المنازل العشرية',

    // Home - Editing
    editing: 'تحرير',
    autoSum: 'جمع تلقائي',
    clearAll: 'مسح الكل',
    clearFormat: 'مسح التنسيقات',
    sortFilter: 'فرز وتصفية',
    sortAsc: 'فرز تصاعدي (أ إلى ي)',
    sortDesc: 'فرز تنازلي (ي إلى أ)',
    filter: 'تصفية تلقائية',
    findReplace: 'بحث واستبدال',

    // Insert
    table: 'جدول',
    chart: 'مخطط بياني',
    barChart: 'أعمدة بيانية',
    lineChart: 'رسم خطي',
    pieChart: 'مخطط دائري',
    note: 'ملاحظة خلية',

    // Page Layout
    orientation: 'الاتجاه',
    portrait: 'عمودي',
    landscape: 'أفقي',
    gridlines: 'خطوط الشبكة',
    showGrid: 'إظهار الخطوط',
    hideGrid: 'إخفاء الخطوط',

    // Formulas
    insertFunction: 'إدراج دالة fx',
    financial: 'مالية',
    logical: 'منطقية',
    textFn: 'نصية',
    lookupRef: 'بحث ومراجع',
    mathTrig: 'رياضيات',

    // Data
    removeDuplicates: 'إزالة التكرارات',
    dataValidation: 'التحقق من صحة البيانات',
    textToColumns: 'تحويل النص إلى أعمدة',
    compareVersions: 'مقارنة الملفات والإصدارات',

    // View
    freezePanes: 'تجميد الأجزاء',
    freezeTopRow: 'تجميد الصف العلوي',
    unfreeze: 'إلغاء التجميد',
    zoom: 'التكبير والتصغير',

    // Audit Tab & Panel
    auditScan: 'فحص تدقيق شامل',
    auditDuplicates: 'كشف التكرارات',
    auditUnicode: 'فحص المحارف الخفية',
    auditOutliers: 'كشف القيم الشاذة',
    auditSummary: 'تقرير التدقيق',
    criticalIssues: 'أخطاء حرجة',
    warningIssues: 'تحذيرات تدقيق',
    infoIssues: 'ملاحظات تنظيمية',
    applyFix: 'تطبيق التصحيح',
    skipFinding: 'تخطي',
    batchApply: 'معالجة الكل المعتمدة',
    undo: 'تراجع (Ctrl+Z)',
    redo: 'إعادة (Ctrl+Y)',

    // AI Agent
    aiPlaceholder: 'اسأل الوكيل بالعربية (مثال: احسب إجمالي المصروفات، اعرض التكرارات، افحص الأخطاء)...',
    send: 'إرسال',
    aiTitle: 'وكيل التدقيق الذكي (DataAudit Agent)',
    aiStatusLocal: 'المحرك المحلي نشط (100% دون إنترنت)',
    aiStatusOnline: 'الوضع السحابي متصل (Gemini AI)',
    clearChat: 'مسح المحادثة',

    // Sheets bar
    addSheet: 'إضافة ورقة عمل جديدة',
    deleteSheet: 'حذف الورقة',
    renameSheet: 'إعادة تسمية',
    duplicateSheet: 'نسخ الورقة',
  },
  en: {
    appTitle: 'DataAudit AI Pro',
    appSubtitle: 'Excel-Compatible Professional Spreadsheet with Local Audit AI Agent',
    file: 'File',
    home: 'Home',
    insert: 'Insert',
    pageLayout: 'Page Layout',
    formulas: 'Formulas',
    data: 'Data',
    review: 'Review',
    view: 'View',
    developer: 'Developer',
    smartAudit: 'Smart Audit',
    aiAssistant: 'AI Agent',

    // File tab
    newWorkbook: 'New Workbook',
    openFile: 'Open File (XLSX / CSV)',
    saveFile: 'Save Workbook',
    exportXlsx: 'Export Excel (.xlsx)',
    exportCsv: 'Export CSV',
    printSheet: 'Print Sheet',
    backupSheet: 'Local Backup',
    restoreBackup: 'Restore Backup',
    workbookInfo: 'Workbook Properties',

    // Home - Clipboard
    clipboard: 'Clipboard',
    cut: 'Cut',
    copy: 'Copy',
    paste: 'Paste',
    formatPainter: 'Format Painter',

    // Home - Font
    font: 'Font',
    bold: 'Bold',
    italic: 'Italic',
    underline: 'Underline',
    fontSize: 'Font Size',
    textColor: 'Text Color',
    fillColor: 'Fill Color',
    borders: 'Borders',

    // Home - Alignment
    alignment: 'Alignment',
    alignLeft: 'Align Left',
    alignCenter: 'Align Center',
    alignRight: 'Align Right',
    wrapText: 'Wrap Text',
    mergeCenter: 'Merge & Center',

    // Home - Numbers
    numberFormat: 'Number',
    formatGeneral: 'General',
    formatNumber: 'Decimal Number',
    formatCurrency: 'Currency ($)',
    formatPercent: 'Percentage (%)',
    formatDate: 'Date',
    formatText: 'Text',
    increaseDecimals: 'Increase Decimals',
    decreaseDecimals: 'Decrease Decimals',

    // Home - Editing
    editing: 'Editing',
    autoSum: 'AutoSum',
    clearAll: 'Clear All',
    clearFormat: 'Clear Formats',
    sortFilter: 'Sort & Filter',
    sortAsc: 'Sort A to Z',
    sortDesc: 'Sort Z to A',
    filter: 'AutoFilter',
    findReplace: 'Find & Replace',

    // Insert
    table: 'Table',
    chart: 'Chart',
    barChart: 'Column Chart',
    lineChart: 'Line Chart',
    pieChart: 'Pie Chart',
    note: 'Cell Note',

    // Page Layout
    orientation: 'Orientation',
    portrait: 'Portrait',
    landscape: 'Landscape',
    gridlines: 'Gridlines',
    showGrid: 'Show Gridlines',
    hideGrid: 'Hide Gridlines',

    // Formulas
    insertFunction: 'Insert Function fx',
    financial: 'Financial',
    logical: 'Logical',
    textFn: 'Text',
    lookupRef: 'Lookup & Reference',
    mathTrig: 'Math & Trig',

    // Data
    removeDuplicates: 'Remove Duplicates',
    dataValidation: 'Data Validation',
    textToColumns: 'Text to Columns',
    compareVersions: 'Compare Files & Versions',

    // View
    freezePanes: 'Freeze Panes',
    freezeTopRow: 'Freeze Top Row',
    unfreeze: 'Unfreeze Panes',
    zoom: 'Zoom',

    // Audit Tab & Panel
    auditScan: 'Full Audit Scan',
    auditDuplicates: 'Find Duplicates',
    auditUnicode: 'Inspect Unicode & Invisible',
    auditOutliers: 'Detect Outliers',
    auditSummary: 'Audit Summary',
    criticalIssues: 'Critical Errors',
    warningIssues: 'Audit Warnings',
    infoIssues: 'Informational',
    applyFix: 'Apply Fix',
    skipFinding: 'Skip',
    batchApply: 'Batch Remediate All',
    undo: 'Undo (Ctrl+Z)',
    redo: 'Redo (Ctrl+Y)',

    // AI Agent
    aiPlaceholder: 'Ask Agent in Arabic or English (e.g., Total expenses, Find duplicates, Audit sheet)...',
    send: 'Send',
    aiTitle: 'DataAudit Agent (Local AI)',
    aiStatusLocal: 'Local Engine Active (100% Offline)',
    aiStatusOnline: 'Online Cloud Connected (Gemini AI)',
    clearChat: 'Clear Chat',

    // Sheets bar
    addSheet: 'Add New Sheet',
    deleteSheet: 'Delete Sheet',
    renameSheet: 'Rename Sheet',
    duplicateSheet: 'Duplicate Sheet',
  },
};

export function getTranslation(lang: LanguageCode) {
  return translations[lang] || translations.ar;
}
