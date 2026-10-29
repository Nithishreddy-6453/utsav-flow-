/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EventPlan } from '../types/plan';
import { EventDraft } from '../types';
import {
  CalendarExportScope,
  CalendarExportOptions,
  downloadICSFile,
  generateICSFilename
} from '../utils/calendarExport';
import {
  Calendar,
  CheckCircle2,
  Download,
  X,
  Clock,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

interface ExportCalendarModalProps {
  isOpen: boolean;
  plan: EventPlan;
  draft: EventDraft;
  onClose: () => void;
}

export const ExportCalendarModal: React.FC<ExportCalendarModalProps> = ({
  isOpen,
  plan,
  draft,
  onClose
}) => {
  const [scope, setScope] = useState<CalendarExportScope>('all');
  const [includeCompletedTasks, setIncludeCompletedTasks] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [downloadResult, setDownloadResult] = useState<{ filename: string; count: number } | null>(null);

  if (!isOpen) return null;

  const tasks = plan.timelineTasks || [];
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const pendingCount = tasks.filter(t => t.status !== 'completed').length;

  const calculateExportItemCount = () => {
    let count = 0;
    if (scope === 'all' || scope === 'event_only') {
      if (draft.eventDate) count += 1;
    }
    if (scope === 'all' || scope === 'tasks_only') {
      count += includeCompletedTasks ? tasks.length : pendingCount;
    }
    return count;
  };

  const handleExport = () => {
    const options: CalendarExportOptions = {
      scope,
      includeCompletedTasks
    };

    const res = downloadICSFile(plan, draft, options);
    if (res.success) {
      setIsSuccess(true);
      setDownloadResult({
        filename: res.filename,
        count: res.eventCount
      });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-export-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-[#3730a3] flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 id="calendar-export-title" className="text-lg font-bold text-zinc-900">
                Export Calendar (.ics)
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                Add celebration milestones and deadlines to your personal calendar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 flex items-center justify-center transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Scope Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
              Select Export Scope
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  scope === 'all'
                    ? 'border-[#3730a3] bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold text-zinc-900">Event & Tasks</span>
                  <Layers className={`w-3.5 h-3.5 ${scope === 'all' ? 'text-[#3730a3]' : 'text-zinc-400'}`} />
                </div>
                <p className="text-[11px] text-zinc-500 leading-tight">
                  Both celebration day and all planning tasks
                </p>
              </button>

              <button
                type="button"
                onClick={() => setScope('tasks_only')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  scope === 'tasks_only'
                    ? 'border-[#3730a3] bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold text-zinc-900">Tasks Only</span>
                  <Clock className={`w-3.5 h-3.5 ${scope === 'tasks_only' ? 'text-[#3730a3]' : 'text-zinc-400'}`} />
                </div>
                <p className="text-[11px] text-zinc-500 leading-tight">
                  Milestone deadlines and vendor follow-ups
                </p>
              </button>

              <button
                type="button"
                onClick={() => setScope('event_only')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  scope === 'event_only'
                    ? 'border-[#3730a3] bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold text-zinc-900">Event Only</span>
                  <Sparkles className={`w-3.5 h-3.5 ${scope === 'event_only' ? 'text-[#3730a3]' : 'text-zinc-400'}`} />
                </div>
                <p className="text-[11px] text-zinc-500 leading-tight">
                  Single all-day entry on the celebration date
                </p>
              </button>
            </div>
          </div>

          {/* Options Checkbox */}
          {scope !== 'event_only' && (
            <div className="pt-2">
              <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 cursor-pointer hover:bg-zinc-100/50 transition-colors">
                <input
                  type="checkbox"
                  checked={includeCompletedTasks}
                  onChange={e => setIncludeCompletedTasks(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#3730a3] focus:ring-indigo-500 border-zinc-300 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-zinc-900 block">
                    Include completed tasks ({completedCount} tasks)
                  </span>
                  <span className="text-zinc-500 text-[11px]">
                    By default, only active upcoming and in-progress tasks are exported. Check this to export your complete archived history.
                  </span>
                </div>
              </label>
            </div>
          )}

          {/* Calculated Output Summary Banner */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-semibold">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                {calculateExportItemCount()} {calculateExportItemCount() === 1 ? 'entry' : 'entries'} ready for export
              </span>
            </div>
            <span className="font-mono text-zinc-500 text-[11px]">
              {generateICSFilename(draft.eventName)}
            </span>
          </div>

          {/* Success Banner if exported */}
          {isSuccess && downloadResult && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">Calendar file downloaded successfully!</p>
                <p className="text-emerald-700 text-[11px] mt-0.5">
                  Saved as <span className="font-mono font-semibold">{downloadResult.filename}</span> ({downloadResult.count} calendar items). Open with Google Calendar, Outlook, or Apple Calendar.
                </p>
              </div>
            </div>
          )}

          {/* Instructions note */}
          <div className="text-[11px] text-zinc-500 leading-relaxed border-t border-zinc-100 pt-3">
            <span className="font-semibold text-zinc-700">Supported Applications: </span>
            Google Calendar, Apple Calendar (iOS/macOS), Microsoft Outlook, Mozilla Thunderbird, and all standard RFC 5545 calendar apps.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/60 rounded-xl transition-colors"
          >
            {isSuccess ? 'Done' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="px-5 py-2.5 rounded-xl bg-[#3730a3] hover:bg-[#2e2882] text-white text-xs font-bold shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isSuccess ? 'Download Again' : 'Download .ics Calendar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
