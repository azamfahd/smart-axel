/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, MonitorSmartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../core/pwa/usePWAInstall.ts';
import { LanguageCode } from '../../types/index.ts';

interface PWAInstallButtonProps {
  lang: LanguageCode;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ lang }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  // Desktop / Android Chromium flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-medium transition shadow-xs"
        title={lang === 'ar' ? 'تثبيت البرنامج على الجهاز (Windows / Android)' : 'Install App'}
      >
        <Download className="w-3.5 h-3.5" />
        <span>{lang === 'ar' ? 'تثبيت التطبيق' : 'Install App'}</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium transition"
        >
          <MonitorSmartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>{lang === 'ar' ? 'تثبيت iOS' : 'Install iOS'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl text-xs space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-slate-900">
                  {lang === 'ar' ? 'التثبيت على آيفون / آيباد' : 'Install on iPhone / iPad'}
                </h4>
                <button onClick={() => setShowIOSGuide(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {lang === 'ar' ? (
                  <>
                    1. اضغط على زر <strong>مشاركة (Share)</strong> في أسفل متصفح Safari.<br />
                    2. مرر للأسفل واختر <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.
                  </>
                ) : (
                  <>
                    1. Tap the <strong>Share</strong> button in Safari toolbar.<br />
                    2. Scroll down and tap <strong>Add to Home Screen</strong>.
                  </>
                )}
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-800"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
