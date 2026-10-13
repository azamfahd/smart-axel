# Implementation Plan - Intelligent Data Audit & Smart Cleansing Engine in DataAudit AI Pro

We will implement advanced AI-powered data auditing, smart formula functions, anomaly detection, missing data imputation, tamper-proofing audit trails, and automated space/separator normalization for **DataAudit AI Pro**.

## Proposed Changes

### 1. Smart Formula Engine Extensions (`src/core/formula/evaluator.ts`)
Add dedicated smart cleansing and audit functions to the formula evaluator:
- `AI.CLEAN(range, [rules])`: Cleans spaces, normalizes delimiters, fixes common typos.
- `AI.DETECT_ANOMALIES(range, [threshold])`: Identifies statistical outliers (Z-score / IQR) and structural anomalies.
- `AI.IMPUTE_MISSING(range, [method])`: Fills blank cells using mean, median, trend, or LLM-backed local context.
- `AI.DETECT_TAMPER(cell_or_range)`: Verifies cell hash signature against audit trail.
- `AI.NORMALIZE_SPACES(text)`: Removes non-breaking spaces, double spaces, and hidden control characters.

### 2. Intelligent Data Audit & Cleansing Panel (`src/features/audit/SmartAuditPanel.tsx`)
Create a dedicated interactive sidebar/modal for data health checks:
- **Blank Space & Gap Analyzer**: Scan entire sheets for hidden blank spaces, null values, or formatting mismatches with 1-click auto-repair.
- **Outlier & Anomaly Inspector**: Visualize anomalies on the grid with color-coded highlights and automated correction suggestions.
- **Separator & Delimiter Normalizer**: Fix inconsistent decimal/thousand separators or text formatting across columns.
- **Tamper-Proof Audit Log Viewer**: Inspect checksum verification logs, previous values, timestamps, and author/source for any modified cell.

### 3. Local AI Agent Enhancements (`src/core/ai/localAgent.ts`)
Expand the Arabic local AI chat agent to handle direct commands:
- "فحص الأخطاء والفراغات في الجدول" (Scan errors and blanks in table)
- "كشف القيم الشاذة والتلاعب" (Detect outliers and tampering)
- "إصلاح الفراغات وإكمال البيانات ناقصة" (Repair blanks and impute missing data)

### 4. Integration with Grid & Excel Engine
- Add visual indicators (red/orange warning badges) on cells flagged by the smart audit engine.
- Right-click context menu options: "Smart Clean Cell", "Inspect Audit History", "Find Similar Anomalies".

## Verification Plan
- **Automated Tests**: Compile applet (`compile_applet`) and run linter (`lint_applet`).
- **Functional Testing**: Test new smart formulas in formula bar (`=AI.DETECT_ANOMALIES(A1:A100)`, `=AI.IMPUTE_MISSING(B1:B50)`). Verify audit trail logging when cells are edited.
