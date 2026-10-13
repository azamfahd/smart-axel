/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkbookData, WorksheetData, CellMatrix } from '../../types/index.ts';

export function createInitialWorkbook(): WorkbookData {
  const ledgerCells: CellMatrix = {};
  const payrollCells: CellMatrix = {};
  const summaryCells: CellMatrix = {};

  // ==========================================
  // Sheet 1: General Ledger & Expense Audit
  // ==========================================
  const ledgerHeaders = [
    'رقم القيد',
    'التاريخ',
    'المورد / المستفيد',
    'بيان المعاملة',
    'المبلغ الأساسي',
    'ضريبة 15%',
    'الإجمالي النهائي',
    'مركز التكلفة',
  ];

  ledgerHeaders.forEach((h, col) => {
    ledgerCells[`0,${col}`] = {
      rawValue: h,
      style: {
        bold: true,
        backgroundColor: '#1E293B',
        textColor: '#FFFFFF',
        align: 'center',
        fontSize: 13,
      },
    };
  });

  const ledgerRows = [
    ['TX-1001', '2026-01-05', 'شركة الأمل للتوريدات', 'شراء خوادم وتجهيزات شبكية', 12500, '=E2*0.15', '=E2+F2', 'تقنية المعلومات'],
    ['TX-1002', '2026-01-08', 'مؤسسة الرياض للخدمات', 'خدمات صيانة ونظافة شهرية', 4200, '=E3*0.15', '=E3+F3', 'الخدمات المساندة'],
    ['TX-1003', '2026-01-12', 'شركة التقنية\u200B الحديثة', 'اشتراكات برمجية سحابية', 8900, '=E4*0.15', '=E4+F4', 'تقنية المعلومات'], // Has Zero-Width Space \u200B
    ['TX-1004', '2026-01-15', 'شركة الامل للتوريدات', 'تجهيز كابلات وشاشات إضافية', 3400, '=E5*0.15', '=E5+F5', 'تقنية المعلومات'], // Normalized Arabic duplicate of الأمل
    ['TX-1005', '2026-01-18', 'مكتب الاستشارات القانونية', 'أتعاب تدقيق واستشارات عقود', 15000, '=E6*0.15', '=E6+F6', 'الإدارة القانونية'],
    ['TX-1006', '2026-01-20', 'مؤسسة الرياض للخدمات', 'خدمات صيانة ونظافة شهرية', 4200, '=E7*0.15', '=E7+F7', 'الخدمات المساندة'], // Exact duplicate payment
    ['TX-1007', '2026-01-22', 'توريدات الفهد للمكاتب', 'أثاث مكتبي ومقاعد إدارية', 6800, '=E8*0.15', '=E8+F8', 'الإدارة العامة'],
    ['TX-1008', '2026-01-25', 'مجموعة المدى للمقاولات', 'دفعة خاصة تجهيز قاعات التدريب', 50000, '=E9*0.15', '=E9+F9', 'المشاريع'], // Statistical outlier & round amount
    ['TX-1009', '2026-01-28', 'شركة التوزيع السريع', 'رسوم شحن وتسليم طرود', -450, '=E10*0.15', '=E10+F10', 'اللوجستيات'], // Negative amount anomaly
    ['TX-1010', '2026-02-01', 'مؤسسة نور للدعاية', 'حملة إعلانية رقمية', 7500, '=E11*0.15', '=E11+F11', 'التسويق'],
    ['TX-1011', '2026-02-04', 'شركة الأمل للتوريدات', 'قطع غيار إلكترونية', 2100, '=E12*0.15', '=E12+F12', 'تقنية المعلومات'],
  ];

  ledgerRows.forEach((row, rIdx) => {
    const rowNum = rIdx + 1;
    row.forEach((val, cIdx) => {
      const isFormula = typeof val === 'string' && val.startsWith('=');
      const isAmount = cIdx === 4 || cIdx === 5 || cIdx === 6;

      ledgerCells[`${rowNum},${cIdx}`] = {
        rawValue: isFormula ? 0 : val,
        formula: isFormula ? val : undefined,
        style: {
          align: cIdx === 0 ? 'center' : isAmount ? 'right' : 'left',
          format: isAmount ? 'currency' : cIdx === 1 ? 'date' : 'general',
          backgroundColor: rowNum % 2 === 0 ? '#F8FAFC' : '#FFFFFF',
        },
      };
    });
  });

  // Ledger Summary Row
  const totalRowNum = ledgerRows.length + 1;
  ledgerCells[`${totalRowNum},3`] = {
    rawValue: 'الإجمالي العام للمصروفات',
    style: { bold: true, align: 'right', backgroundColor: '#E2E8F0' },
  };
  ledgerCells[`${totalRowNum},4`] = {
    rawValue: 0,
    formula: `=SUM(E2:E${totalRowNum})`,
    style: { bold: true, align: 'right', format: 'currency', backgroundColor: '#E2E8F0' },
  };
  ledgerCells[`${totalRowNum},5`] = {
    rawValue: 0,
    formula: `=SUM(F2:F${totalRowNum})`,
    style: { bold: true, align: 'right', format: 'currency', backgroundColor: '#E2E8F0' },
  };
  ledgerCells[`${totalRowNum},6`] = {
    rawValue: 0,
    formula: `=SUM(G2:G${totalRowNum})`,
    style: { bold: true, align: 'right', format: 'currency', backgroundColor: '#E2E8F0' },
  };

  // ==========================================
  // Sheet 2: Payroll & HR Audit
  // ==========================================
  const payrollHeaders = [
    'الرقم الوظيفي',
    'اسم الموظف',
    'القسم',
    'الراتب الأساسي',
    'بدل السكن (25%)',
    'المكافأة',
    'صافي الراتب',
  ];

  payrollHeaders.forEach((h, col) => {
    payrollCells[`0,${col}`] = {
      rawValue: h,
      style: {
        bold: true,
        backgroundColor: '#0F766E',
        textColor: '#FFFFFF',
        align: 'center',
        fontSize: 13,
      },
    };
  });

  const payrollRows = [
    ['EMP-101', 'أحمد محمود العتيبي', 'المالية', 12000, '=D2*0.25', 1500, '=D2+E2+F2'],
    ['EMP-102', 'فاطمة خالد الدوسري', 'الموارد البشرية', 11500, '=D3*0.25', 2000, '=D3+E3+F3'],
    ['EMP-103', 'عبدالله عمر السعيد', 'تقنية المعلومات', 14500, '=D4*0.25', 0, '=D4+E4+F4'],
    ['EMP-104', 'سارة محمد القحطاني', 'التسويق', 9800, '=D5*0.25', 1200, '=D5+E5+F5'],
    ['EMP-102', 'فاطمه خالد الدوسري', 'الموارد البشرية', 11500, '=D6*0.25', 2000, '=D6+E6+F6'], // Duplicate Employee ID & spelling diff (ه vs ة)
    ['EMP-105', 'خالد إبراهيم المنصور', '', 13000, '=D7*0.25', 1000, '=D7+E7+F7'], // Missing Department
    ['EMP-106', 'ريم صالح الغامدي', 'خدمة العملاء', 8500, '=D8*0.25', 800, '=D8+E8+F8'],
  ];

  payrollRows.forEach((row, rIdx) => {
    const rowNum = rIdx + 1;
    row.forEach((val, cIdx) => {
      const isFormula = typeof val === 'string' && val.startsWith('=');
      const isSalary = cIdx >= 3;

      payrollCells[`${rowNum},${cIdx}`] = {
        rawValue: isFormula ? 0 : val,
        formula: isFormula ? val : undefined,
        style: {
          align: cIdx === 0 ? 'center' : isSalary ? 'right' : 'left',
          format: isSalary ? 'currency' : 'general',
          backgroundColor: rowNum % 2 === 0 ? '#F0FDFA' : '#FFFFFF',
        },
      };
    });
  });

  // Payroll Summary Row
  const payTotalRowNum = payrollRows.length + 1;
  payrollCells[`${payTotalRowNum},2`] = {
    rawValue: 'إجمالي الرواتب الشهرية',
    style: { bold: true, align: 'right', backgroundColor: '#CCFBF1' },
  };
  payrollCells[`${payTotalRowNum},3`] = {
    rawValue: 0,
    formula: `=SUM(D2:D${payTotalRowNum})`,
    style: { bold: true, align: 'right', format: 'currency', backgroundColor: '#CCFBF1' },
  };
  payrollCells[`${payTotalRowNum},6`] = {
    rawValue: 0,
    formula: `=SUM(G2:G${payTotalRowNum})`,
    style: { bold: true, align: 'right', format: 'currency', backgroundColor: '#CCFBF1' },
  };

  // ==========================================
  // Sheet 3: Audit Overview Dashboard
  // ==========================================
  summaryCells['0,0'] = {
    rawValue: 'تقرير ملخص التدقيق والرقابة المالية الذكية',
    style: { bold: true, fontSize: 16, textColor: '#0F172A', align: 'right' },
  };
  summaryCells['2,0'] = { rawValue: 'مؤشر الرقابة', style: { bold: true, backgroundColor: '#E2E8F0' } };
  summaryCells['2,1'] = { rawValue: 'القيمة / الإجمالي', style: { bold: true, backgroundColor: '#E2E8F0' } };
  summaryCells['2,2'] = { rawValue: 'ملاحظة التدقيق', style: { bold: true, backgroundColor: '#E2E8F0' } };

  summaryCells['3,0'] = { rawValue: 'عدد السجلات المفحوصة' };
  summaryCells['3,1'] = { rawValue: 18, style: { align: 'center', bold: true } };
  summaryCells['3,2'] = { rawValue: 'جاهزة للتدقيق الفوري' };

  summaryCells['4,0'] = { rawValue: 'حالات التكرار المشتبه بها' };
  summaryCells['4,1'] = { rawValue: 3, style: { align: 'center', bold: true, textColor: '#DC2626' } };
  summaryCells['4,2'] = { rawValue: 'تشمل تطابق فواتير وتكرار رقم موظف' };

  summaryCells['5,0'] = { rawValue: 'اختلافات إملائية وتطبيع عربي' };
  summaryCells['5,1'] = { rawValue: 2, style: { align: 'center', bold: true, textColor: '#D97706' } };
  summaryCells['5,2'] = { rawValue: 'تعدد صيغ الهمزات والتاء المربوطة' };

  summaryCells['6,0'] = { rawValue: 'محارف خفية ومسافات يونيكود' };
  summaryCells['6,1'] = { rawValue: 1, style: { align: 'center', bold: true, textColor: '#DC2626' } };
  summaryCells['6,2'] = { rawValue: 'مسافة بعرض صفري في اسم مورد' };

  summaryCells['7,0'] = { rawValue: 'قيم شاذة وانحرافات إحصائية' };
  summaryCells['7,1'] = { rawValue: 2, style: { align: 'center', bold: true, textColor: '#DC2626' } };
  summaryCells['7,2'] = { rawValue: 'مبلغ دائري 50,000 ومبلغ سالب -450' };

  const sheets: WorksheetData[] = [
    {
      id: 'sheet-ledger',
      name: 'دفتر الأستاذ والمدفوعات',
      cells: ledgerCells,
      rowCount: 50,
      colCount: 16,
      colWidths: { 0: 100, 1: 110, 2: 210, 3: 240, 4: 130, 5: 120, 6: 140, 7: 150 },
      rowHeights: {},
      mergedCells: [],
      freezeRows: 1,
    },
    {
      id: 'sheet-payroll',
      name: 'سجل الرواتب والمكافآت',
      cells: payrollCells,
      rowCount: 40,
      colCount: 12,
      colWidths: { 0: 110, 1: 190, 2: 150, 3: 130, 4: 130, 5: 110, 6: 140 },
      rowHeights: {},
      mergedCells: [],
      freezeRows: 1,
    },
    {
      id: 'sheet-summary',
      name: 'ملخص التدقيق والرقابة',
      cells: summaryCells,
      rowCount: 30,
      colCount: 10,
      colWidths: { 0: 240, 1: 150, 2: 280 },
      rowHeights: {},
      mergedCells: [],
    },
  ];

  return {
    id: 'workbook-audit-demo',
    name: 'سجل_التدقيق_المالي_2026.xlsx',
    sheets,
    activeSheetId: 'sheet-ledger',
  };
}
