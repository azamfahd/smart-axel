/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkbookData, WorksheetData, AuditFinding } from '../../types/index.ts';
import { AuditEngine } from '../audit/auditEngine.ts';
import { normalizeArabicText } from '../audit/arabicUtils.ts';
import { coordsToRef } from '../formula/cellUtils.ts';

export interface AgentResponse {
  messageAr: string;
  messageEn: string;
  targetCells?: { row: number; col: number; sheetId: string }[];
  findings?: AuditFinding[];
  actionType?: 'audit' | 'highlight' | 'calculate' | 'filter' | 'info' | 'insert_formula';
  calculatedValue?: number | string;
  formulaToInsert?: { row: number; col: number; formula: string };
}

export class DataAuditAgent {
  private auditEngine = new AuditEngine();

  /**
   * Processes a user query using the local deterministic engine first
   */
  async processQuery(
    query: string,
    workbook: WorkbookData,
    activeSheet: WorksheetData,
    selectedRange?: { startRow: number; startCol: number; endRow: number; endCol: number }
  ): Promise<AgentResponse> {
    const cleanQuery = query.trim().toLowerCase();
    const normalizedAr = normalizeArabicText(query);

    // 1. Full Audit / Error Check
    if (
      normalizedAr.includes('افحص') ||
      normalizedAr.includes('تدقيق') ||
      normalizedAr.includes('اخطاء') ||
      cleanQuery.includes('audit') ||
      cleanQuery.includes('check error') ||
      cleanQuery.includes('scan')
    ) {
      const findings = this.auditEngine.auditWorksheet(activeSheet);
      const crit = findings.filter(f => f.severity === 'critical').length;
      const warn = findings.filter(f => f.severity === 'warning').length;

      return {
        actionType: 'audit',
        findings,
        messageAr: `تم فحص ورقة "${activeSheet.name}" بنجاح. عثر المحرك على ${findings.length} ملاحظة (${crit} حرجة، ${warn} تحذيرات). يمكنك استعراض بطاقات المعالجة أدناه وتطبيق التصحيحات بأمان.`,
        messageEn: `Scanned sheet "${activeSheet.name}" successfully. Detected ${findings.length} findings (${crit} critical, ${warn} warnings). Review remediation cards below.`,
        targetCells: findings.map(f => ({ row: f.row, col: f.col, sheetId: f.sheetId })),
      };
    }

    // 2. Duplicate Detection
    if (
      normalizedAr.includes('تكرار') ||
      normalizedAr.includes('مكرر') ||
      cleanQuery.includes('duplicate') ||
      cleanQuery.includes('dups')
    ) {
      const findings = this.auditEngine.auditWorksheet(activeSheet)
        .filter(f => f.ruleId.includes('DUP'));

      return {
        actionType: 'highlight',
        findings,
        messageAr: `تم الكشف عن ${findings.length} حالات تكرار (تشمل تطابقاً تاماً وتطبيعاً إملائياً). تم تحديد الصفوف المعنية باللون التحذيري للمراجعة.`,
        messageEn: `Found ${findings.length} duplicate instances (including exact and orthographic variations). Flagged rows for review.`,
        targetCells: findings.map(f => ({ row: f.row, col: f.col, sheetId: f.sheetId })),
      };
    }

    // 3. Invisible Unicode / Whitespace Probe
    if (
      normalizedAr.includes('خفي') ||
      normalizedAr.includes('مساف') ||
      normalizedAr.includes('يونيكود') ||
      cleanQuery.includes('invisible') ||
      cleanQuery.includes('unicode') ||
      cleanQuery.includes('whitespace')
    ) {
      const findings = this.auditEngine.auditWorksheet(activeSheet)
        .filter(f => f.ruleId === 'RULE_INVISIBLE_UNICODE');

      return {
        actionType: 'highlight',
        findings,
        messageAr: `عثر المحرك على ${findings.length} خلية تحتوي على محارف غير مرئية أو مسافات بعرض صفري (Zero-Width Space). تم تجهيز بدائل نظيفة بنقرة واحدة.`,
        messageEn: `Found ${findings.length} cells with hidden characters or zero-width spaces. Clean replacements ready for review.`,
        targetCells: findings.map(f => ({ row: f.row, col: f.col, sheetId: f.sheetId })),
      };
    }

    // 4. Statistical Outliers & Fraud Flags
    if (
      normalizedAr.includes('شاذ') ||
      normalizedAr.includes('تلاعب') ||
      normalizedAr.includes('مشبوه') ||
      normalizedAr.includes('انحراف') ||
      cleanQuery.includes('outlier') ||
      cleanQuery.includes('anomaly') ||
      cleanQuery.includes('suspicious') ||
      cleanQuery.includes('fraud')
    ) {
      const findings = this.auditEngine.auditWorksheet(activeSheet)
        .filter(f => f.ruleId === 'RULE_STATISTICAL_OUTLIER' || f.ruleId === 'RULE_SUSPICIOUS_ROUND_NUMBER' || f.ruleId === 'RULE_UNEXPECTED_NEGATIVE');

      return {
        actionType: 'highlight',
        findings,
        messageAr: `تم اكتشاف ${findings.length} مؤشرات شذوذ إحصائي ومبالغ دائرية ضخمة تخرج عن المعدل الطبيعي وتستدعي تدقيق مستندات الصرف المرفقة.`,
        messageEn: `Identified ${findings.length} statistical anomaly indicators (high Z-score, round disbursement spikes) requiring audit documentation check.`,
        targetCells: findings.map(f => ({ row: f.row, col: f.col, sheetId: f.sheetId })),
      };
    }

    const wantsFormula = normalizedAr.includes('اضف دالة') || normalizedAr.includes('اكتب صيغة') || normalizedAr.includes('ضع') || cleanQuery.includes('formula') || cleanQuery.includes('insert');

    // 5. Total / Sum calculation request
    if (
      normalizedAr.includes('اجمالي') ||
      normalizedAr.includes('مجموع') ||
      normalizedAr.includes('كم حاصل') ||
      cleanQuery.includes('total') ||
      cleanQuery.includes('sum')
    ) {
      const matched = this.calculateColumnAggregate(activeSheet, normalizedAr, 'sum', selectedRange);
      if (matched) {
        let formulaToInsert: { row: number; col: number; formula: string } | undefined = undefined;
        if (wantsFormula && matched.cells.length > 0) {
          const lastCell = matched.cells[matched.cells.length - 1];
          const targetRow = lastCell.row + 1;
          const colRef = coordsToRef(0, lastCell.col).replace(/[0-9]/g, '');
          const startRef = `${colRef}${matched.cells[0].row}`;
          const endRef = `${colRef}${lastCell.row}`;
          formulaToInsert = {
            row: targetRow,
            col: lastCell.col,
            formula: `=SUM(${startRef}:${endRef})`,
          };
        }

        return {
          actionType: wantsFormula && formulaToInsert ? 'insert_formula' : 'calculate',
          calculatedValue: matched.value,
          formulaToInsert,
          messageAr: `إجمالي عمود "${matched.headerName}" يبلغ ${matched.value.toLocaleString()} (عبر ${matched.count} صفوف).${formulaToInsert ? ' تم إدراج صيغة المجموع تلقائياً في الخلية السفلية.' : ''}`,
          messageEn: `The total for "${matched.headerName}" is ${matched.value.toLocaleString()} (across ${matched.count} rows).${formulaToInsert ? ' Inserted SUM formula automatically.' : ''}`,
          targetCells: matched.cells,
        };
      }
    }

    // 6. Average calculation request
    if (
      normalizedAr.includes('متوسط') ||
      normalizedAr.includes('معدل') ||
      cleanQuery.includes('average') ||
      cleanQuery.includes('mean')
    ) {
      const matched = this.calculateColumnAggregate(activeSheet, normalizedAr, 'avg', selectedRange);
      if (matched) {
        let formulaToInsert: { row: number; col: number; formula: string } | undefined = undefined;
        if (wantsFormula && matched.cells.length > 0) {
          const lastCell = matched.cells[matched.cells.length - 1];
          const targetRow = lastCell.row + 1;
          const colRef = coordsToRef(0, lastCell.col).replace(/[0-9]/g, '');
          const startRef = `${colRef}${matched.cells[0].row}`;
          const endRef = `${colRef}${lastCell.row}`;
          formulaToInsert = {
            row: targetRow,
            col: lastCell.col,
            formula: `=AVERAGE(${startRef}:${endRef})`,
          };
        }

        return {
          actionType: wantsFormula && formulaToInsert ? 'insert_formula' : 'calculate',
          calculatedValue: matched.value,
          formulaToInsert,
          messageAr: `متوسط قيم عمود "${matched.headerName}" يبلغ ${matched.value.toLocaleString()} (عبر ${matched.count} صفوف).${formulaToInsert ? ' تم إدراج صيغة المتوسط تلقائياً.' : ''}`,
          messageEn: `The average for "${matched.headerName}" is ${matched.value.toLocaleString()} (across ${matched.count} rows).${formulaToInsert ? ' Inserted AVERAGE formula automatically.' : ''}`,
          targetCells: matched.cells,
        };
      }
    }

    // 7. Count calculation request
    if (
      normalizedAr.includes('عد') ||
      normalizedAr.includes('عدد') ||
      cleanQuery.includes('count')
    ) {
      const matched = this.calculateColumnAggregate(activeSheet, normalizedAr, 'count', selectedRange);
      if (matched) {
        return {
          actionType: 'calculate',
          calculatedValue: matched.count,
          messageAr: `عدد القيم الصالحة في عمود "${matched.headerName}" هو ${matched.count}.`,
          messageEn: `The count of valid entries in "${matched.headerName}" is ${matched.count}.`,
          targetCells: matched.cells,
        };
      }
    }

    // 8. Min / Max calculation request
    if (
      normalizedAr.includes('اقل') ||
      normalizedAr.includes('أدنى') ||
      normalizedAr.includes('اصغر') ||
      cleanQuery.includes('min')
    ) {
      const matched = this.calculateColumnAggregate(activeSheet, normalizedAr, 'min', selectedRange);
      if (matched) {
        return {
          actionType: 'calculate',
          calculatedValue: matched.value,
          messageAr: `الحد الأدنى (أقل قيمة) في عمود "${matched.headerName}" هو ${matched.value.toLocaleString()}.`,
          messageEn: `The minimum value in "${matched.headerName}" is ${matched.value.toLocaleString()}.`,
          targetCells: matched.cells,
        };
      }
    }

    if (
      normalizedAr.includes('اعلى') ||
      normalizedAr.includes('أكبر') ||
      normalizedAr.includes('اقصى') ||
      cleanQuery.includes('max')
    ) {
      const matched = this.calculateColumnAggregate(activeSheet, normalizedAr, 'max', selectedRange);
      if (matched) {
        return {
          actionType: 'calculate',
          calculatedValue: matched.value,
          messageAr: `الحد الأقصى (أكبر قيمة) في عمود "${matched.headerName}" هو ${matched.value.toLocaleString()}.`,
          messageEn: `The maximum value in "${matched.headerName}" is ${matched.value.toLocaleString()}.`,
          targetCells: matched.cells,
        };
      }
    }

    // Try server-side Gemini proxy if available for open-ended queries
    try {
      const serverRes = await fetch('/api/audit-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          sheetName: activeSheet.name,
          headers: this.getSheetHeaders(activeSheet),
          sampleData: this.getSampleDataSnippet(activeSheet),
        }),
      });

      if (serverRes.ok) {
        const data = await serverRes.json();
        if (data && data.reply) {
          return {
            actionType: 'info',
            messageAr: data.reply,
            messageEn: data.reply,
          };
        }
      }
    } catch {
      // Offline fallback
    }

    // Fallback standard helpful response
    return {
      actionType: 'info',
      messageAr: `أهلاً بك! أنا وكيل DataAudit الذكي. يمكنك طلبي لفحص الملف، أو حساب الإجماليات والمتوسطات والحدين الأدنى والأقصى لأي عمود أو نطاق محدد، أو الكشف عن القيم الشاذة والمحارف الخفية والتكرارات بدقة تامة.`,
      messageEn: `Welcome! I am the DataAudit Agent. You can ask me to audit the worksheet, compute sums, averages, min/max for any selected column or range, or detect anomalies and duplicates instantly.`,
    };
  }

  private calculateColumnAggregate(
    sheet: WorksheetData,
    query: string,
    type: 'sum' | 'avg' | 'count' | 'min' | 'max',
    selectedRange?: { startRow: number; startCol: number; endRow: number; endCol: number }
  ): { headerName: string; value: number; count: number; cells: { row: number; col: number; sheetId: string }[] } | null {
    let targetCol = -1;
    let startRow = 1;
    let endRow = sheet.rowCount;

    if (selectedRange && (selectedRange.endRow > selectedRange.startRow || selectedRange.endCol > selectedRange.startCol)) {
      targetCol = selectedRange.startCol;
      startRow = selectedRange.startRow;
      endRow = selectedRange.endRow;
    } else if (selectedRange) {
      targetCol = selectedRange.startCol;
    }

    const keys = Object.keys(sheet.cells).map(k => {
      const [r, c] = k.split(',').map(n => parseInt(n, 10));
      return { r, c };
    });

    if (keys.length === 0) return null;
    const maxR = Math.max(...keys.map(k => k.r));
    const maxC = Math.max(...keys.map(k => k.c));

    let bestHeader = '';

    if (targetCol === -1) {
      for (let c = 0; c <= maxC; c++) {
        const headerCell = sheet.cells[`0,${c}`];
        const hText = headerCell ? String(headerCell.rawValue) : '';
        const hNorm = normalizeArabicText(hText);

        if (hNorm && query.includes(hNorm)) {
          targetCol = c;
          bestHeader = hText;
          break;
        }

        if (!bestHeader && /(مبلغ|راتب|مصروف|اجمالي|amount|salary|total|price)/i.test(hText)) {
          targetCol = c;
          bestHeader = hText;
        }
      }
    }

    if (targetCol === -1) {
      for (let c = 0; c <= maxC; c++) {
        let numCount = 0;
        for (let r = 1; r <= Math.min(maxR, 5); r++) {
          const val = sheet.cells[`${r},${c}`]?.rawValue;
          if (typeof val === 'number') numCount++;
        }
        if (numCount >= 2) {
          targetCol = c;
          bestHeader = sheet.cells[`0,${c}`]?.rawValue ? String(sheet.cells[`0,${c}`]?.rawValue) : `Column ${coordsToRef(0, c)}`;
          break;
        }
      }
    }

    if (targetCol === -1) targetCol = 1;
    if (!bestHeader) {
      bestHeader = sheet.cells[`0,${targetCol}`]?.rawValue ? String(sheet.cells[`0,${targetCol}`]?.rawValue) : coordsToRef(0, targetCol);
    }

    const values: number[] = [];
    const cells: { row: number; col: number; sheetId: string }[] = [];

    for (let r = Math.max(1, startRow); r <= Math.min(maxR, endRow); r++) {
      const cell = sheet.cells[`${r},${targetCol}`];
      if (cell && cell.rawValue !== null && cell.rawValue !== undefined) {
        const num = typeof cell.rawValue === 'number' ? cell.rawValue : parseFloat(String(cell.rawValue));
        if (!isNaN(num)) {
          values.push(num);
          cells.push({ row: r, col: targetCol, sheetId: sheet.id });
        }
      }
    }

    if (values.length === 0) return null;

    let computedVal = 0;
    if (type === 'sum') {
      computedVal = values.reduce((a, b) => a + b, 0);
    } else if (type === 'avg') {
      computedVal = values.reduce((a, b) => a + b, 0) / values.length;
    } else if (type === 'count') {
      computedVal = values.length;
    } else if (type === 'min') {
      computedVal = Math.min(...values);
    } else if (type === 'max') {
      computedVal = Math.max(...values);
    }

    return {
      headerName: bestHeader || 'المبلغ',
      value: computedVal,
      count: values.length,
      cells,
    };
  }

  private getSheetHeaders(sheet: WorksheetData): string[] {
    const headers: string[] = [];
    for (let c = 0; c < sheet.colCount; c++) {
      const cell = sheet.cells[`0,${c}`];
      if (cell && cell.rawValue) headers.push(String(cell.rawValue));
    }
    return headers;
  }

  private getSampleDataSnippet(sheet: WorksheetData): any[] {
    const rows: any[] = [];
    for (let r = 0; r < Math.min(sheet.rowCount, 8); r++) {
      const rowData: Record<string, any> = {};
      for (let c = 0; c < Math.min(sheet.colCount, 8); c++) {
        const cell = sheet.cells[`${r},${c}`];
        if (cell && cell.rawValue !== null) {
          rowData[coordsToRef(r, c)] = cell.rawValue;
        }
      }
      rows.push(rowData);
    }
    return rows;
  }
}
