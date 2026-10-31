/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { TimelineTask, TaskPriority, TaskStatus } from '../types/plan';
import { TimelineTaskFormSchema } from '../schemas/timeline';
import { detectCycle } from '../utils/dependencyEngine';

interface AddTaskModalProps {
  isOpen: boolean;
  existingTasks: TimelineTask[];
  eventDate: string;
  onSave: (task: TimelineTask) => void;
  onClose: () => void;
}

const PHASES = [
  'Initial Planning',
  'Venue & Vendor Bookings',
  'Final Preparations',
  'Event Day'
];

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  existingTasks,
  eventDate,
  onSave,
  onClose
}) => {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [phase, setPhase] = useState<string>('Venue & Vendor Bookings');
  const [dueDate, setDueDate] = useState<string>('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setPhase('Venue & Vendor Bookings');
      setDueDate(eventDate || new Date().toISOString().split('T')[0]);
      setPriority('medium');
      setSelectedDependencies([]);
      setNotes('');
      setErrors({});
      setIsSubmitting(false);

      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, eventDate]);

  if (!isOpen) return null;

  const toggleDependency = (id: string) => {
    setSelectedDependencies(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      phase,
      dueDate,
      priority,
      dependencyIds: selectedDependencies,
      notes: notes.trim()
    };

    const result = TimelineTaskFormSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        const path = issue.path[0] as string;
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // Check potential dependency cycle
    const tempId = `task_temp_${Date.now()}`;
    const hypotheticalTask: TimelineTask = {
      id: tempId,
      title: title.trim(),
      description: description.trim(),
      phase,
      dueDate,
      priority,
      status: 'pending',
      dependencyIds: selectedDependencies,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const cycle = detectCycle([...existingTasks, hypotheticalTask]);
    if (cycle) {
      setErrors({ dependencies: `Adding these dependencies causes a cycle: ${cycle.join(' → ')}` });
      return;
    }

    setIsSubmitting(true);

    try {
      const newTask: TimelineTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: title.trim(),
        description: description.trim(),
        phase,
        dueDate,
        priority,
        status: 'pending' as TaskStatus,
        dependencyIds: selectedDependencies,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      onSave(newTask);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create task.';
      setErrors({ form: msg });
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-task-title"
    >
      <div className="relative w-full max-w-[620px] bg-white rounded-2xl shadow-2xl border border-[#E6E1DA] overflow-hidden flex flex-col max-h-[90vh] my-auto">
        <header className="flex items-start justify-between px-6 py-5 border-b border-[#E6E1DA] bg-white">
          <div>
            <h2 id="add-task-title" className="font-['Fraunces',serif] text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
              Add New Milestone Task
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Define operational deadlines, priority, and prerequisite dependencies.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
            type="button"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </header>

        <form id="add-task-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {errors.form && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errors.form}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="task-title" className="block font-bold text-zinc-800 mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              ref={titleInputRef}
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sign contract with Wedding Lawns"
              className="w-full h-10 px-3 rounded-lg border border-[#C8C1B6] bg-white text-zinc-900 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3730a3]"
            />
            {errors.title && <p className="text-rose-600 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-desc" className="block font-bold text-zinc-800 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="task-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Review noise curfews, sound permits, and generator requirements."
              className="w-full p-2.5 rounded-lg border border-[#C8C1B6] bg-white text-zinc-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#3730a3]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phase */}
            <div>
              <label htmlFor="task-phase" className="block font-bold text-zinc-800 mb-1">
                Planning Phase <span className="text-rose-500">*</span>
              </label>
              <select
                id="task-phase"
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#C8C1B6] bg-white text-zinc-900 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3730a3]"
              >
                {PHASES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="task-due-date" className="block font-bold text-zinc-800 mb-1">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#C8C1B6] bg-white text-zinc-900 font-mono text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#3730a3]"
              />
              {errors.dueDate && <p className="text-rose-600 text-xs mt-1">{errors.dueDate}</p>}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block font-bold text-zinc-800 mb-1.5">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['high', 'medium', 'low'] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-2 px-3 rounded-lg font-bold text-xs uppercase tracking-wider border cursor-pointer transition-all ${
                    priority === p
                      ? p === 'high' 
                        ? 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-400'
                        : p === 'medium'
                        ? 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-400'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Prerequisites (Dependencies) */}
          <div>
            <label className="block font-bold text-zinc-800 mb-1">
              Prerequisites (Must be completed before this task)
            </label>
            <p className="text-xs text-zinc-500 mb-2">
              Select existing tasks that block this task from starting.
            </p>
            {errors.dependencies && (
              <p className="text-rose-600 text-xs mb-2 font-bold">{errors.dependencies}</p>
            )}
            <div className="max-h-40 overflow-y-auto custom-scroll border border-zinc-200 rounded-xl p-2.5 bg-zinc-50 space-y-1.5">
              {existingTasks.length === 0 ? (
                <p className="text-zinc-400 text-xs italic">No existing tasks available to depend on.</p>
              ) : (
                existingTasks.map(t => (
                  <label 
                    key={t.id}
                    className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer text-xs font-medium border transition-colors ${
                      selectedDependencies.includes(t.id)
                        ? 'bg-indigo-50/80 border-[#C7D2FE] text-[#3730a3]'
                        : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDependencies.includes(t.id)}
                      onChange={() => toggleDependency(t.id)}
                      className="accent-[#3730a3] rounded"
                    />
                    <div className="truncate flex-1">
                      <span className="font-bold">{t.title}</span>
                      <span className="text-zinc-400 text-[11px] ml-1.5">({t.phase})</span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="task-notes" className="block font-bold text-zinc-800 mb-1">
              Internal Notes (Optional)
            </label>
            <textarea
              id="task-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Contact person: Ramesh (+91 98765 43210)"
              className="w-full p-2.5 rounded-lg border border-[#C8C1B6] bg-white text-zinc-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#3730a3]"
            />
          </div>
        </form>

        <footer className="px-6 py-4 bg-[#F3EFEA] border-t border-[#E6E1DA] flex items-center justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-[#C8C1B6] bg-white hover:bg-zinc-100 text-zinc-800 text-xs sm:text-sm font-bold cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="add-task-form"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-lg bg-[#3730a3] hover:bg-[#312E81] text-white text-xs sm:text-sm font-bold shadow-sm active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                <span>Adding...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">add_task</span>
                <span>Add Task</span>
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};
