/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize GoogleGenAI server client if GEMINI_API_KEY is available
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Backend API: DataAudit Agent reasoning endpoint
app.post('/api/audit-agent', async (req, res) => {
  try {
    const { query, sheetName, headers, sampleData } = req.body;

    if (!ai) {
      return res.status(200).json({
        reply: `(تم الرد محلياً) بخصوص سؤالك "${query}"، المحرك المحلي جاهز لفحص أوراق العمل وحساب المجاميع وكشف التكرارات والشذوذ بدقة متناهية.`,
      });
    }

    const systemInstruction = `
أنت وكيل ذكي خبير في تدقيق الحسابات والبيانات في برنامج DataAudit AI Pro (شبيه بـ Microsoft Excel).
مهمتك مساعدة المستخدم في فحص البيانات، وشرح الأخطاء المحاسبية والتكرارات، واقتراح صيغ Excel المناسبة.
أجب دائماً بلغة عربية احترافية، دقيقة، وموجزة.
إذا سأل المستخدم عن حساب، أوضح له الدالة المناسبة مثل SUM أو VLOOKUP أو AVERAGE.
بيانات ورقة العمل الحالية:
اسم الورقة: ${sheetName || 'الورقة الحالية'}
الأعمدة: ${JSON.stringify(headers || [])}
عينة من البيانات: ${JSON.stringify(sampleData || [])}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: query,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    res.json({ reply: response.text || 'تم فحص الطلب.' });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: error.message || 'Error communicating with AI engine.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DataAudit AI Pro server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
