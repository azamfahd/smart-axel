/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { LanguageCode } from '../../types/index.ts';

interface OfflineIndicatorProps {
  lang: LanguageCode;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ lang }) => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-10 left-4 z-50 flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs font-medium text-white shadow-xl">
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>
        {lang === 'ar'
          ? 'الوضع المحلي نشط — جميع الصيغ والتدقيق تعمل 100% دون إنترنت.'
          : 'Offline Mode Active — Core formulas & audit work 100% offline.'}
      </span>
    </div>
  );
};
