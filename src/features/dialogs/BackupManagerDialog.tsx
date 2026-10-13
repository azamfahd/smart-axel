/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Clock, Download, Upload, Trash2, CheckCircle2 } from 'lucide-react';
import { WorkbookData, LanguageCode } from '../../types/index.ts';

interface BackupSnapshot {
  id: string;
  name: string;
  timestamp: string;
  sheetCount: number;
  cellCount: number;
  data: WorkbookData;
}

interface BackupManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentWorkbook: WorkbookData;
  onRestoreWorkbook: (wb: WorkbookData) => void;
  lang: LanguageCode;
}

export const BackupManagerDialog: React.FC<BackupManagerDialogProps> = ({
  isOpen,
  onClose,
  currentWorkbook,
  onRestoreWorkbook,
  lang,
}) => {
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>([]);
  const [snapshotName, setSnapshotName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Load snapshots from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('dataaudit_backups');
      if (stored) {
        setSnapshots(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const saveSnapshotsToStorage = (list: BackupSnapshot[]) => {
    setSnapshots(list);
    try {
      localStorage.setItem('dataaudit_backups', JSON.stringify(list));
    } catch {
      // ignore
    }
  };

  const handleCreateSnapshot = () => {
    const totalCells = currentWorkbook.sheets.reduce(
      (acc, s) => acc + Object.keys(s.cells).length,
      0
    );

    const newSnapshot: BackupSnapshot = {
      id: `snap-${Date.now()}`,
      name: snapshotName.trim() || `${lang === 'ar' ? 'نسخة احتياطية' : 'Snapshot'} ${snapshots.length + 1}`,
      timestamp: new Date().toLocaleString(),
      sheetCount: currentWorkbook.sheets.length,
      cellCount: totalCells,
      data: JSON.parse(JSON.stringify(currentWorkbook)),
    };

    const updated = [newSnapshot, ...snapshots];
    saveSnapshotsToStorage(updated);
    setSnapshotName('');
    setSuccessMsg(lang === 'ar' ? 'تم إنشاء نقطة الاستعادة بنجاح.' : 'Backup snapshot created successfully.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleRestore = (snap: BackupSnapshot) => {
    if (confirm(lang === 'ar' ? `هل أنت متأكد من استعادة النسخة "${snap.name}"؟` : `Restore snapshot "${snap.name}"?`)) {
      onRestoreWorkbook(snap.data);
      onClose();
    }
  };

  const handleDelete = (id: string) => {
    const updated = snapshots.filter(s => s.id !== id);
    saveSnapshotsToStorage(updated);
  };

  const handleDownloadJSON = (snap: BackupSnapshot) => {
    const jsonStr = JSON.stringify(snap.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${snap.name.replace(/\s+/g, '_')}_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold">
              {lang === 'ar' ? 'إدارة النسخ الاحتياطية ونقاط الاستعادة' : 'Local Backup & Version Snapshots'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Create Snapshot Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={snapshotName}
              onChange={e => setSnapshotName(e.target.value)}
              placeholder={lang === 'ar' ? 'اسم نقطة الاستعادة (اختياري)...' : 'Snapshot label (optional)...'}
              className="flex-1 h-9 px-3 border border-slate-300 rounded focus:outline-emerald-600 text-xs"
            />
            <button
              onClick={handleCreateSnapshot}
              className="px-4 h-9 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-semibold flex items-center gap-1.5 transition shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إنشاء نسخة' : 'Create'}</span>
            </button>
          </div>

          {successMsg && (
            <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded flex items-center gap-2 text-[11px] font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Snapshots List */}
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {snapshots.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-lg">
                {lang === 'ar' ? 'لا توجد نسخ احتياطية محفوظة حالياً.' : 'No snapshots saved yet.'}
              </div>
            ) : (
              snapshots.map(snap => (
                <div
                  key={snap.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between hover:border-slate-300 transition"
                >
                  <div>
                    <h4 className="font-semibold text-slate-900 text-xs">{snap.name}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {snap.timestamp} · {snap.sheetCount} {lang === 'ar' ? 'أوراق' : 'sheets'} · {snap.cellCount} {lang === 'ar' ? 'خلية' : 'cells'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDownloadJSON(snap)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded"
                      title="Download JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRestore(snap)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold flex items-center gap-1"
                      title="Restore"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{lang === 'ar' ? 'استعادة' : 'Restore'}</span>
                    </button>
                    <button
                      onClick={() => handleDelete(snap.id)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-white rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold transition"
          >
            {lang === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
