/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, X, Trash2, ArrowRight } from 'lucide-react';
import { LanguageCode } from '../../types/index.ts';
import { getTranslation } from '../../core/i18n/translations.ts';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  actionHint?: string;
}

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lang: LanguageCode;
  onSendQuery: (query: string) => Promise<string>;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  lang,
  onSendQuery,
}) => {
  const t = getTranslation(lang);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'agent',
      text:
        lang === 'ar'
          ? 'مرحباً بك! أنا وكيل DataAudit الذكي للتدقيق. يمكنني فحص ورقة العمل، واكتشاف التكرارات، وتحليل القيم الشاذة، وحساب المجاميع بدقة متناهية.'
          : 'Welcome! I am the DataAudit Intelligent Agent. I can audit worksheets, detect duplicates, flag anomalies, and compute aggregates directly.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const quickPromptsAr = [
    'افحص الورقة الحالية واعرض الأخطاء',
    'اعرض التكرارات المشتبه بها',
    'احسب إجمالي المصروفات',
    'كشف المحارف الخفية ومسافات اليونيكود',
    'كشف القيم الشاذة والمبالغ الدائرية',
  ];

  const quickPromptsEn = [
    'Audit current sheet and show errors',
    'Find suspicious duplicate records',
    'Calculate total expenses',
    'Check invisible Unicode & whitespace',
    'Detect statistical outliers & round payments',
  ];

  const quickPrompts = lang === 'ar' ? quickPromptsAr : quickPromptsEn;

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const reply = await onSendQuery(query);
      const agentMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'agent',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, agentMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'agent',
        text: lang === 'ar' ? 'تعذر إتمام المعالجة، يرجى المحاولة مجدداً.' : 'Could not complete the query. Please retry.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-88 md:w-96 bg-white border-l border-slate-300 shadow-2xl z-50 flex flex-col select-none">
      {/* Header */}
      <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="text-sm font-bold">{t.aiTitle}</h2>
            <p className="text-[10px] text-emerald-300">{t.aiStatusLocal}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMessages([messages[0]])}
            className="p-1 text-slate-400 hover:text-white rounded"
            title={t.clearChat}
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
        {messages.map(msg => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-2.5 text-xs shadow-xs leading-relaxed ${
                  isUser
                    ? 'bg-emerald-700 text-white rounded-br-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
                <span
                  className={`text-[9px] block mt-1 ${
                    isUser ? 'text-emerald-200 text-right' : 'text-slate-400 text-left'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg max-w-[80%] text-xs text-slate-600">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
            <span>{lang === 'ar' ? 'جارٍ التدقيق والتحليل...' : 'Analyzing and auditing sheet...'}</span>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Quick Prompt Suggestions */}
      <div className="p-2 bg-white border-t border-slate-200 overflow-x-auto flex gap-1.5 scrollbar-none">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 rounded-full text-[11px] whitespace-nowrap transition text-slate-700"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={t.aiPlaceholder}
          className="flex-1 h-9 px-3 text-xs border border-slate-300 rounded-lg focus:outline-emerald-600 bg-slate-50 focus:bg-white"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          className="h-9 px-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg flex items-center justify-center transition shadow-xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
