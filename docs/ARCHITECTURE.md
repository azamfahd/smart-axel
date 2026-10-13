# المعمارية التقنية للنظام (ARCHITECTURE.md)
## DataAudit AI Pro Architecture Specification

---

## 1. النظرة العامة المعمارية (Architectural Overview)
يعتمد التطبيق على معمارية متعددة الطبقات (Clean Layered Architecture) تفصل بين:
1. **طبقة العرض والواجهة (Presentation Layer)**: مبنية على React 19 مع Tailwind CSS ومكونات تفاعلية مستوحاة من Excel Ribbon وشبكة خلايا افتراضية (Virtualized Grid Engine).
2. **طبقة نموذج البيانات والمصنف (Workbook Domain Engine)**: إدارة هيكلية المصنف (Workbook)، أوراق العمل (Worksheets)، الخلايا (Cells)، والنطاقات (Ranges)، وسجل التراجع والإعادة (History Stack).
3. **محرك الصيغ الحسابية (Formula Calculation Engine)**: معالج لغوي (Lexer)، محلل تعبيرات (AST Parser)، ومخطط بياني للتبعيات (Dependency DAG Evaluator).
4. **محرك التدقيق الجنائي للبيانات (Data Audit & Forensic Engine)**: خط أنابيب قواعد (Rule Pipeline) للكشف عن التكرارات، التلاعب، الشذوذ الإحصائي، وتطبيع النصوص العربية واليونيكود.
5. **وكيل الذكاء الاصطناعي الهجين (DataAudit Agent)**:
   - مسار محلي فوري (Local Rule & NLP Parser) للاستعلامات والعمليات الحسابية والفرز والتصفية بدون إنترنت.
   - مسار خادم Gemini 3.8 Flash اختياري للمحادثة التحليلية المتقدمة واقتراح صيغ الحساب المعقدة.
6. **طبقة التخزين والاستيراد/التصدير (I/O & Persistence Layer)**: قراءة وحفظ ملفات `XLSX` و`CSV` محلياً عبر `SheetJS`، وتخزين محلي مؤقت في `IndexedDB` / `localStorage`.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Presentation UI (React 19)                      │
│  ┌───────────────┐ ┌────────────────┐ ┌───────────────┐ ┌────────────┐ │
│  │ Excel Ribbon  │ │  Formula Bar   │ │  Sheet Grid   │ │ Audit Chat │ │
│  │  Tabs & Tools │ │ & Name Box fx  │ │  Virtual View │ │ & Findings │ │
│  └───────────────┘ └────────────────┘ └───────────────┘ └────────────┘ │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Events & Actions
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Workbook Domain State & History                    │
│  - Active Workbook / Sheet List / Cell Value & Format Dictionaries     │
│  - Undo / Redo Command History Stack                                   │
└──────────────┬───────────────────────────────┬─────────────────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌───────────────────────────────────────┐
│   Formula Engine (Core)      │ │     Data Audit Engine (Core)          │
│ - Lexer & Tokenizer          │ │ - Exact & Fuzzy Duplicate Matcher     │
│ - AST Expression Parser      │ │ - Arabic Orthography Normalizer       │
│ - Dependency Recalc DAG      │ │ - Invisible Unicode Character Probe   │
│ - 30+ Excel Built-in Funcs   │ │ - Statistical Outliers (Z-score, IQR) │
│ - Circular Reference Guard   │ │ - Suspicious Anomaly & Fraud Flags    │
└──────────────┬───────────────┘ └─────────────────┬─────────────────────┘
               │                                   │
               ▼                                   ▼
┌──────────────────────────────┐ ┌───────────────────────────────────────┐
│     Import / Export (I/O)    │ │      Local & Hybrid AI Assistant      │
│ - XLSX Parser & Serializer   │ │ - Natural Language Intent Classifier  │
│ - CSV Sanitizer (Anti-Inject)│ │ - Local Query & Aggregation Runner    │
│ - PDF Printable Exporter     │ │ - Optional Gemini 3.8 Flash Proxy     │
└──────────────────────────────┘ └───────────────────────────────────────┘
```

---

## 2. بنية المجلدات المستهدفة (Directory Structure)
```
/
├── docs/                      # التوثيق الشامل ومصفوفات التوافق
├── src/
│   ├── core/                  # المحركات المستقلة غير المرتبطة بواجهة المستخدم
│   │   ├── formula/           # محرك الصيغ (Lexer, Parser, Functions, DAG)
│   │   ├── audit/             # محرك التدقيق (تكرارات، يونيكود، شذوذ، تلاعب)
│   │   ├── workbook/          # نماذج المصنف والخلية والتنسيقات والحافظة
│   │   └── i18n/              # الترجمة ثنائية اللغة (عربي / إنجليزي) والـ RTL
│   ├── features/              # المكونات الوظيفية لواجهة المستخدم
│   │   ├── ribbon/            # شريط الأدوات الرئيسي بكل تبويباته الـ 10
│   │   ├── formula_bar/       # شريط الصيغ ومربع الاسم
│   │   ├── grid/              # شبكة الخلايا وعناوين الصفوف والأعمدة
│   │   ├── sheets_bar/        # شريط تبويبات أوراق العمل وأزرار التحكم
│   │   ├── audit_panel/       # اللوحة الجانبية لنتائج الفحص وبطاقات المعالجة
│   │   ├── ai_chat/           # واجهة المحادثة التفاعلية مع الوكيل
│   │   ├── dialogs/           # النوافذ المنبثقة (فتح ملف، فرز، تصدير، استبدال)
│   │   └── charts/            # عارض المخططات البيانية (أعمدة، خطوط، دوائر)
│   ├── services/              # خدمات الاستيراد/التصدير وAPI الخادم
│   └── types/                 # تعريفات TypeScript لكافة هياكل البيانات
├── server.ts                  # خادم Express المحلي ونقطة الاتصال بوكيل الذكاء الاصطناعي
└── metadata.json              # بيانات التطبيق وصلاحياته
```

---

## 3. مبادئ الأداء والأمان (Performance & Security Tenets)
1. **التحليل في الذاكرة (In-Memory Processing)**: لا يتم استدعاء أي خادم لإجراء الفحوصات أو الصيغ أو التدقيق.
2. **الافتراضية المتقدمة (Virtualization)**: لا يتم تصيير عناصر DOM لآلاف الخلايا دفعة واحدة؛ بل تُصيَّر الخلايا المرئية في نطاق الرؤية الحالي فقط مع هامش تمرير سلس (Overscan Buffer).
3. **فصل القيمة عن التنسيق**: الخلية تخزن القيمة الخام `rawValue` والصيغة الأصلية `formula` ونمط العرض `format` والقيمة المحسوبة `displayValue` لضمان عدم تلف البيانات عند تغيير أسلوب التنسيق.
4. **حماية الرموز والصيغ في CSV**: تعقيم الرموز الحسابية البادئة (`=`, `@`, `+`, `-`) عند التصدير لمنع هجمات CSV Injection.
