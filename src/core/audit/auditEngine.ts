/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorksheetData, AuditFinding } from '../../types/index.ts';
import { coordsToRef } from '../formula/cellUtils.ts';
import { normalizeArabicText, stringSimilarity, detectInvisibleCharacters } from './arabicUtils.ts';

export class AuditEngine {
  /**
   * Runs all audit rules on a given worksheet
   */
  auditWorksheet(sheet: WorksheetData): AuditFinding[] {
    const findings: AuditFinding[] = [];

    // 1. Identify populated bounds and header row
    const rowKeys = Object.keys(sheet.cells).map(k => {
      const [r, c] = k.split(',').map(n => parseInt(n, 10));
      return { r, c, key: k };
    });

    if (rowKeys.length === 0) return findings;

    const maxRow = Math.max(...rowKeys.map(k => k.r));
    const maxCol = Math.max(...rowKeys.map(k => k.c));

    // Assume row 0 is headers if it has strings
    const headers: Record<number, string> = {};
    for (let c = 0; c <= maxCol; c++) {
      const cell = sheet.cells[`0,${c}`];
      if (cell && cell.rawValue !== null) {
        headers[c] = String(cell.rawValue).trim();
      }
    }

    // 2. Check for Invisible Characters & Unicode issues
    for (const { r, c } of rowKeys) {
      const cell = sheet.cells[`${r},${c}`];
      if (!cell || typeof cell.rawValue !== 'string') continue;

      const probe = detectInvisibleCharacters(cell.rawValue);
      if (probe.hasZeroWidth || probe.hasNonBreakingSpace || probe.hasControlChars || probe.hasTrailingWhitespace) {
        findings.push({
          id: `invis-${sheet.id}-${r}-${c}`,
          ruleId: 'RULE_INVISIBLE_UNICODE',
          ruleTitle: 'Invisible Unicode / Trailing Whitespace',
          ruleTitleAr: 'محارف خفية أو مسافات غير مرئية في النص',
          severity: probe.hasZeroWidth || probe.hasControlChars ? 'critical' : 'warning',
          sheetId: sheet.id,
          sheetName: sheet.name,
          row: r,
          col: c,
          cellRef: coordsToRef(r, c),
          currentValue: cell.rawValue,
          suggestedValue: probe.cleanedText,
          explanation: `Text contains hidden characters or trailing spaces (${probe.hasZeroWidth ? 'Zero-width space ' : ''}${probe.hasNonBreakingSpace ? 'NBSP ' : ''}) that can break formulas and filters.`,
          explanationAr: `النص يحتوي على محارف غير مرئية أو مسافات زائدة (${probe.hasZeroWidth ? 'مسافة صفرية ' : ''}${probe.hasNonBreakingSpace ? 'مسافة غير قابلة للكسر ' : ''}) قد تفسد نتائج البحث والمطابقة.`,
          status: 'pending',
        });
      }
    }

    // 3. Check for Exact & Normalized Arabic Duplicates (Row by Row)
    const rowSignatures: Map<string, { row: number; originalText: string }> = new Map();
    const arabicSignatures: Map<string, { row: number; originalText: string }> = new Map();

    for (let r = 1; r <= maxRow; r++) {
      const rowValues: string[] = [];
      let hasData = false;

      for (let c = 0; c <= maxCol; c++) {
        const cell = sheet.cells[`${r},${c}`];
        const val = cell ? String(cell.rawValue ?? '').trim() : '';
        if (val) hasData = true;
        rowValues.push(val);
      }

      if (!hasData) continue;

      const rawSig = rowValues.join('|');
      const arabicSig = rowValues.map(v => normalizeArabicText(v)).join('|');

      // Exact row duplicate
      if (rowSignatures.has(rawSig)) {
        const prev = rowSignatures.get(rawSig)!;
        findings.push({
          id: `dup-exact-${sheet.id}-${r}`,
          ruleId: 'RULE_EXACT_DUPLICATE',
          ruleTitle: 'Exact Duplicate Row',
          ruleTitleAr: 'سجل مكرر بالكامل (تطابق تام)',
          severity: 'critical',
          sheetId: sheet.id,
          sheetName: sheet.name,
          row: r,
          col: 0,
          cellRef: `A${r + 1}`,
          currentValue: `Row ${r + 1}`,
          suggestedValue: 'Remove or merge duplicate record',
          explanation: `Row ${r + 1} is an exact duplicate of Row ${prev.row + 1}.`,
          explanationAr: `الصف رقم ${r + 1} مطابق تماماً لسجل سابق في الصف رقم ${prev.row + 1}.`,
          status: 'pending',
        });
      } else {
        rowSignatures.set(rawSig, { row: r, originalText: rawSig });
      }

      // Normalized Arabic duplicate (different spelling but same meaning)
      if (!rowSignatures.has(rawSig) && arabicSignatures.has(arabicSig)) {
        const prev = arabicSignatures.get(arabicSig)!;
        findings.push({
          id: `dup-arabic-${sheet.id}-${r}`,
          ruleId: 'RULE_ARABIC_NORMALIZED_DUP',
          ruleTitle: 'Normalized Arabic Orthography Duplicate',
          ruleTitleAr: 'تكرار بعد التطبيع الإملائي العربي',
          severity: 'warning',
          sheetId: sheet.id,
          sheetName: sheet.name,
          row: r,
          col: 0,
          cellRef: `A${r + 1}`,
          currentValue: `Row ${r + 1}`,
          suggestedValue: 'Standardize spelling across records',
          explanation: `Row ${r + 1} matches Row ${prev.row + 1} after normalizing Arabic letters (Hamza, Taa Marboota, Tashkeel).`,
          explanationAr: `السجل في الصف ${r + 1} يتطابق مع الصف ${prev.row + 1} بعد توحيد الهمزات والياء والتاء المربوطة.`,
          status: 'pending',
        });
      } else {
        arabicSignatures.set(arabicSig, { row: r, originalText: rawSig });
      }
    }

    // 4. Column-Level Inspection (Fuzzy Text, Missing Values, Outliers)
    for (let c = 0; c <= maxCol; c++) {
      const colHeader = headers[c] || `Column ${c + 1}`;
      const textValues: { row: number; val: string }[] = [];
      const numValues: { row: number; val: number }[] = [];

      for (let r = 1; r <= maxRow; r++) {
        const cell = sheet.cells[`${r},${c}`];
        if (!cell || cell.rawValue === null || cell.rawValue === undefined || cell.rawValue === '') {
          // Check if other cells in row are populated -> Missing required field
          const hasSiblingData = [0, 1, 2].some(sc => sc !== c && sheet.cells[`${r},${sc}`]?.rawValue);
          if (hasSiblingData && r <= maxRow - 1) {
            findings.push({
              id: `missing-${sheet.id}-${r}-${c}`,
              ruleId: 'RULE_MISSING_VALUE',
              ruleTitle: 'Missing Value in Active Record',
              ruleTitleAr: 'حقل فارغ في سجل نشط',
              severity: 'info',
              sheetId: sheet.id,
              sheetName: sheet.name,
              row: r,
              col: c,
              cellRef: coordsToRef(r, c),
              currentValue: '(Empty)',
              suggestedValue: 'Fill required data',
              explanation: `Missing value for "${colHeader}" in Row ${r + 1}.`,
              explanationAr: `قيمة مفقودة لعمود "${colHeader}" في الصف ${r + 1}.`,
              status: 'pending',
            });
          }
          continue;
        }

        const raw = cell.rawValue;
        if (typeof raw === 'number') {
          numValues.push({ row: r, val: raw });
        } else if (typeof raw === 'string') {
          const num = parseFloat(raw);
          if (!isNaN(num) && /^-?\d+(\.\d+)?$/.test(raw.trim())) {
            numValues.push({ row: r, val: num });
          } else {
            textValues.push({ row: r, val: raw.trim() });
          }
        }
      }

      // A. Fuzzy string similarity within the column (e.g., vendor names, customer names)
      for (let i = 0; i < textValues.length; i++) {
        for (let j = i + 1; j < textValues.length; j++) {
          const t1 = textValues[i].val;
          const t2 = textValues[j].val;
          if (t1.toLowerCase() === t2.toLowerCase()) continue; // already caught
          if (t1.length > 3 && t2.length > 3) {
            const sim = stringSimilarity(normalizeArabicText(t1), normalizeArabicText(t2));
            if (sim >= 0.85 && sim < 1.0) {
              findings.push({
                id: `fuzzy-${sheet.id}-${textValues[i].row}-${textValues[j].row}-${c}`,
                ruleId: 'RULE_FUZZY_NAME_SIMILARITY',
                ruleTitle: 'Fuzzy Similar Entity Names',
                ruleTitleAr: 'تشابه ملحوظ في كتابة الأسماء أو الكيانات',
                severity: 'warning',
                sheetId: sheet.id,
                sheetName: sheet.name,
                row: textValues[j].row,
                col: c,
                cellRef: coordsToRef(textValues[j].row, c),
                currentValue: t2,
                suggestedValue: t1,
                explanation: `"${t2}" is ${(sim * 100).toFixed(0)}% similar to "${t1}" in Row ${textValues[i].row + 1}. Possible typo or split vendor profile.`,
                explanationAr: `الاسم "${t2}" يشبه بنسبة ${(sim * 100).toFixed(0)}% الاسم "${t1}" في الصف ${textValues[i].row + 1}. قد يشير إلى خطأ كتابي أو تكرار حساب المورد.`,
                status: 'pending',
              });
            }
          }
        }
      }

      // B. Statistical Outliers & Benford's Law in numeric columns
      if (numValues.length >= 4) {
        const nums = numValues.map(n => n.val);
        const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        const variance = nums.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / nums.length;
        const stdDev = Math.sqrt(variance);

        // Check Benford's Law for columns with >= 15 financial values
        if (numValues.length >= 15 && /(amount|expense|total|price|cost|سعر|مبلغ|إجمالي|مصروف|تكلفة)/i.test(colHeader)) {
          const positiveNums = nums.filter(v => v > 0);
          if (positiveNums.length >= 15) {
            const leadingDigits: Record<number, number> = { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 };
            for (const val of positiveNums) {
              const s = Math.abs(val).toString().replace('.', '').replace(/^0+/, '');
              if (s.length > 0) {
                const d = parseInt(s[0], 10);
                if (d >= 1 && d <= 9) {
                  leadingDigits[d] = (leadingDigits[d] || 0) + 1;
                }
              }
            }
            const totalDigits = Object.values(leadingDigits).reduce((a, b) => a + b, 0);
            if (totalDigits >= 15) {
              const benfordExpected: Record<number, number> = {
                1: 0.301, 2: 0.176, 3: 0.125, 4: 0.097, 5: 0.079,
                6: 0.067, 7: 0.058, 8: 0.051, 9: 0.046
              };
              let maxDiff = 0;
              for (let d = 1; d <= 9; d++) {
                const observedRatio = (leadingDigits[d] || 0) / totalDigits;
                const diff = Math.abs(observedRatio - benfordExpected[d]);
                if (diff > maxDiff) maxDiff = diff;
              }
              // If maximum frequency deviation exceeds 0.20, flag Benford anomaly on row 1
              if (maxDiff > 0.20) {
                findings.push({
                  id: `benford-${sheet.id}-${c}`,
                  ruleId: 'RULE_BENFORD_LAW_VIOLATION',
                  ruleTitle: 'Benford\'s Law Financial Distribution Anomaly',
                  ruleTitleAr: 'مخالفة قانون بنفورد الإحصائي لتوزيع الأرقام المالية',
                  severity: 'warning',
                  sheetId: sheet.id,
                  sheetName: sheet.name,
                  row: 1,
                  col: c,
                  cellRef: coordsToRef(1, c),
                  currentValue: `Max deviation ${(maxDiff * 100).toFixed(1)}%`,
                  suggestedValue: 'Verify ledger authenticity',
                  explanation: `Column "${colHeader}" leading digits deviate significantly from Benford's Law expectations, suggesting artificial or tampered figures.`,
                  explanationAr: `الأرقام في عمود "${colHeader}" تخالف التوزيع الطبيعي لقانون بنفورد، مما قد يشير إلى توليد أو تعديل غير طبيعي للأرقام.`,
                  status: 'pending',
                });
              }
            }
          }
        }

        // Check repeated disbursement frequency
        const valCounts = new Map<number, number>();
        for (const item of numValues) {
          if (item.val >= 100) {
            valCounts.set(item.val, (valCounts.get(item.val) || 0) + 1);
          }
        }

        for (const item of numValues) {
          // Check negative numbers where header suggests positive amount/price/quantity
          if (item.val < 0 && /(price|amount|qty|quantity|سعر|كمية|مبلغ|راتب|salary)/i.test(colHeader)) {
            findings.push({
              id: `neg-${sheet.id}-${item.row}-${c}`,
              ruleId: 'RULE_UNEXPECTED_NEGATIVE',
              ruleTitle: 'Unexpected Negative Amount / Quantity',
              ruleTitleAr: 'قيمة سالبة غير متوقعة في حقل مالي أو كمي',
              severity: 'critical',
              sheetId: sheet.id,
              sheetName: sheet.name,
              row: item.row,
              col: c,
              cellRef: coordsToRef(item.row, c),
              currentValue: item.val,
              suggestedValue: Math.abs(item.val),
              explanation: `Negative value (${item.val}) found in column "${colHeader}".`,
              explanationAr: `قيمة سالبة (${item.val}) في عمود "${colHeader}" يفترض أن تكون موجبة.`,
              status: 'pending',
            });
          }

          // Check Z-score outlier (|z| > 2.8)
          if (stdDev > 0) {
            const zScore = Math.abs((item.val - mean) / stdDev);
            if (zScore > 2.8) {
              findings.push({
                id: `zscore-${sheet.id}-${item.row}-${c}`,
                ruleId: 'RULE_STATISTICAL_OUTLIER',
                ruleTitle: 'Statistical Numerical Outlier (High Deviation)',
                ruleTitleAr: 'قيمة شاذة إحصائياً (انحراف معياري مرتفع)',
                severity: 'critical',
                sheetId: sheet.id,
                sheetName: sheet.name,
                row: item.row,
                col: c,
                cellRef: coordsToRef(item.row, c),
                currentValue: item.val,
                explanation: `Value ${item.val} deviates by ${zScore.toFixed(1)}σ from the column mean (${mean.toFixed(2)}).`,
                explanationAr: `القيمة ${item.val} تنحرف بمقدار ${zScore.toFixed(1)} ضعف الانحراف المعياري عن المتوسط (${mean.toFixed(2)}).`,
                status: 'pending',
              });
            }
          }

          // Check suspicious round disbursement spikes (e.g., exactly 10000, 50000, 100000)
          if (item.val >= 10000 && item.val % 5000 === 0 && /(amount|expense|payment|مبلغ|مصروف|دفعة)/i.test(colHeader)) {
            findings.push({
              id: `round-${sheet.id}-${item.row}-${c}`,
              ruleId: 'RULE_SUSPICIOUS_ROUND_NUMBER',
              ruleTitle: 'Suspicious Round Disbursement Figure',
              ruleTitleAr: 'مبلغ مالي دائري ضخم يستوجب التحقق المحاسبي',
              severity: 'warning',
              sheetId: sheet.id,
              sheetName: sheet.name,
              row: item.row,
              col: c,
              cellRef: coordsToRef(item.row, c),
              currentValue: item.val,
              explanation: `Disbursement amount ${item.val.toLocaleString()} is a suspicious round figure often associated with threshold circumvention.`,
              explanationAr: `المبلغ ${item.val.toLocaleString()} رقم دائري كبير يستدعي التحقق من فواتير الإثبات ومستندات الصرف المرفقة.`,
              status: 'pending',
            });
          }

          // Check repeated exact disbursements (appearing 3+ times)
          if (item.val >= 1000 && (valCounts.get(item.val) || 0) >= 3 && /(amount|expense|payment|مبلغ|مصروف|دفعة)/i.test(colHeader)) {
            findings.push({
              id: `repeat-${sheet.id}-${item.row}-${c}`,
              ruleId: 'RULE_REPEATED_DISBURSEMENT_PATTERN',
              ruleTitle: 'Suspiciously Repeated Payment Amount',
              ruleTitleAr: 'مبلغ مالي مكرر بطريقة مثيرة للريبة',
              severity: 'warning',
              sheetId: sheet.id,
              sheetName: sheet.name,
              row: item.row,
              col: c,
              cellRef: coordsToRef(item.row, c),
              currentValue: item.val,
              explanation: `Amount ${item.val.toLocaleString()} appears ${valCounts.get(item.val)} times in column "${colHeader}".`,
              explanationAr: `المبلغ ${item.val.toLocaleString()} تكرر ${valCounts.get(item.val)} مرات في عمود "${colHeader}".`,
              status: 'pending',
            });
          }
        }
      }
    }

    return findings;
  }
}
