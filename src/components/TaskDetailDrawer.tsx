/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TimelineTask, TaskPriority, TaskStatus } from '../types/plan';
import { evaluateTaskDependency, getDownstreamTasks } from '../utils/dependencyEngine';
import { formatDisplayDate, isDateOverdue, calculateDaysRemaining } from '../utils/dateCalculations';

interface TaskDetailDrawerProps {
  isOpen: boolean;
  task: TimelineTask | null;
  allTasks: TimelineTask[];
  onUpdateTask: (updatedTask: TimelineTask) => void;
  onDeleteTask: (taskId: string) => void;
  onClose: () => void;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  isOpen,
  task,
  allTasks,
  onUpdateTask,
  onDeleteTask,
  onClose
}) => {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [phase, setPhase] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [notes, setNotes] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [overrideCompleteConfirm, setOverrideCompleteConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPhase(task.phase);
      setDueDate(task.dueDate);
      setPriority(task.priority);
      setStatus(task.status);
      setNotes(task.notes || '');
      setShowDeleteConfirm(false);
      setOverrideCompleteConfirm(false);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const depStatus = evaluateTaskDependency(task, allTasks);
  const downstream = getDownstreamTasks(task.id, allTasks);
  const isOverdue = isDateOverdue(task.dueDate) && task.status !== 'completed';
  const daysLeft = calculateDaysRemaining(task.dueDate);

  const handleSave = () => {
    const updated: TimelineTask = {
      ...task,
      title: title.trim(),
      description: description.trim(),
      phase,
      dueDate,
      priority,
      status,
      notes: notes.trim() || undefined,
      updatedAt: new Date().toISOString()
    };
    onUpdateTask(updated);
    onClose();
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (newStatus === 'completed' && depStatus.isBlocked) {
      // Show confirmation prompt before overriding incomplete prerequisites
      setOverrideCompleteConfirm(true);
      return;
    }
    setStatus(newStatus);
    const updated: TimelineTask = {
      ...task,
      title: title.trim(),
      description: description.trim(),
      phase,
      dueDate,
      priority,
      status: newStatus,
      notes: notes.trim() || undefined,
      updatedAt: new Date().toISOString()
    };
    onUpdateTask(updated);
  };

  const handleConfirmOverrideComplete = () => {
    setStatus('completed');
    setOverrideCompleteConfirm(false);
    const updated: TimelineTask = {
      ...task,
      title: title.trim(),
      description: description.trim(),
      phase,
      dueDate,
      priority,
      status: 'completed',
      notes: notes.trim() || undefined,
      updatedAt: new Date().toISOString()
    };
    onUpdateTask(updated);
  };

  const handleDelete = () => {
    onDeleteTask(task.id);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-detail-title"
    >
      <div className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-[#E6E1DA] flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
        {/* HEADER */}
        <header className="p-6 border-b border-[#E6E1DA] bg-white flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 bg-[#F3EFEA] px-2 py-0.5 rounded border border-[#E6E1DA]">
                {task.phase}
              </span>
              {task.status === 'completed' ? (
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Completed
                </span>
              ) : task.status === 'delayed' ? (
                <span className="text-[11px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Delayed
                </span>
              ) : depStatus.isBlocked ? (
                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Blocked
                </span>
              ) : isOverdue ? (
                <span className="text-[11px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Overdue
                </span>
              ) : (
                <span className="text-[11px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  On Track
                </span>
              )}
            </div>
            <h2 id="task-detail-title" className="font-['Fraunces',serif] text-xl font-bold text-zinc-900 tracking-tight">
              Task Details
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
            type="button"
            aria-label="Close drawer"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </header>

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm custom-scroll flex-1">
          {/* Override Complete Warning */}
          {overrideCompleteConfirm && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-xs">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                <span>Unresolved Prerequisites!</span>
              </div>
              <p className="text-xs">
                This task has prerequisite dependencies that are still incomplete:
                <strong className="block mt-1">
                  {depStatus.unresolvedPrerequisites.map(p => `• ${p.title}`).join(', ')}
                </strong>
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmOverrideComplete}
                  className="px-3 py-1.5 rounded-lg bg-amber-700 text-white font-bold text-xs hover:bg-amber-800 cursor-pointer"
                >
                  Confirm &amp; Mark Completed
                </button>
                <button
                  type="button"
                  onClick={() => setOverrideCompleteConfirm(false)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-zinc-700 font-bold text-xs hover:bg-zinc-100 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Quick Action Status Bar */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Change Status</span>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-zinc-100 rounded-xl border border-zinc-200">
              {(['pending', 'in_progress', 'completed', 'delayed'] as TaskStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleStatusChange(st)}
                  className={`py-2 px-1 text-[11px] font-bold rounded-lg capitalize transition-all cursor-pointer text-center ${
                    status === st
                      ? st === 'completed'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : st === 'delayed'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : st === 'in_progress'
                        ? 'bg-[#3730a3] text-white shadow-xs'
                        : 'bg-white text-zinc-900 shadow-xs border border-zinc-200'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/50'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Title & Description Fields */}
          <div className="space-y-3">
            <div>
              <label htmlFor="edit-task-title" className="block font-bold text-zinc-800 mb-1">
                Task Title
              </label>
              <input
                id="edit-task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#C8C1B6] bg-white text-zinc-900 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#3730a3]"
              />
            </div>
            <div>
              <label htmlFor="edit-task-desc" className="block font-bold text-zinc-800 mb-1">
                Description
              </label>
              <textarea
                id="edit-task-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[#C8C1B6] bg-white text-zinc-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#3730a3]"
              />
            </div>
          </div>

          {/* Schedule & Priority */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-200">
            <div>
              <label htmlFor="edit-task-due" className="block font-bold text-zinc-800 mb-1">
                Due Date
              </label>
              <input
                id="edit-task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-[#C8C1B6] bg-white font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#3730a3]"
              />
              <span className="text-[11px] text-zinc-500 mt-1 block">
                {daysLeft >= 0 ? `${daysLeft} days remaining` : `${Math.abs(daysLeft)} days overdue`}
              </span>
            </div>

            <div>
              <label htmlFor="edit-task-priority" className="block font-bold text-zinc-800 mb-1">
                Priority
              </label>
              <select
                id="edit-task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full h-9 px-2.5 rounded-lg border border-[#C8C1B6] bg-white text-xs font-bold capitalize focus:outline-none focus:ring-2 focus:ring-[#3730a3]"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Prerequisite Dependencies Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Prerequisites ({task.dependencyIds?.length || 0})
              </span>
              {depStatus.isBlocked && (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Blocking this task
                </span>
              )}
            </div>

            {depStatus.reason && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[17px] text-amber-700">hourglass_top</span>
                <span>{depStatus.reason}</span>
              </div>
            )}

            {task.dependencyIds && task.dependencyIds.length > 0 ? (
              <div className="space-y-1.5">
                {task.dependencyIds.map(depId => {
                  const prereq = allTasks.find(t => t.id === depId);
                  if (!prereq) return null;
                  const isDone = prereq.status === 'completed';
                  return (
                    <div key={depId} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-zinc-200 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className={`material-symbols-outlined text-[16px] ${
                          isDone ? 'text-emerald-600' : 'text-amber-500'
                        }`}>
                          {isDone ? 'check_circle' : 'pending'}
                        </span>
                        <span className={`truncate font-medium ${isDone ? 'line-through text-zinc-400' : 'text-zinc-800 font-bold'}`}>
                          {prereq.title}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-zinc-500 shrink-0">
                        {formatDisplayDate(prereq.dueDate)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 italic">No prerequisites required. Task can proceed anytime.</p>
            )}
          </div>

          {/* Downstream Impact */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
              Downstream Cascade Impact ({downstream.length})
            </span>
            {downstream.length > 0 ? (
              <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                <p className="text-xs text-zinc-600">
                  Delaying or stalling this task will directly delay the following downstream steps:
                </p>
                <div className="space-y-1">
                  {downstream.map(d => (
                    <div key={d.id} className="text-xs font-bold text-[#3730a3] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">subdirectory_arrow_right</span>
                      <span>{d.title} ({d.phase})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-400 italic">No other tasks currently depend on this task.</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="edit-task-notes" className="block font-bold text-zinc-800 mb-1">
              Internal Notes
            </label>
            <textarea
              id="edit-task-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add contact info, contract terms, or special instructions."
              className="w-full p-2.5 rounded-lg border border-[#C8C1B6] bg-white text-zinc-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#3730a3]"
            />
          </div>
        </div>

        {/* FOOTER */}
        <footer className="p-6 bg-[#F3EFEA] border-t border-[#E6E1DA] flex items-center justify-between gap-3">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-rose-700">Delete task?</span>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-zinc-300 text-zinc-700 text-xs font-bold cursor-pointer"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[17px]">delete</span>
              <span>Delete</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-[#C8C1B6] bg-white hover:bg-zinc-100 text-zinc-800 text-xs sm:text-sm font-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-lg bg-[#3730a3] hover:bg-[#312E81] text-white text-xs sm:text-sm font-bold shadow-sm active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>Save Changes</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
