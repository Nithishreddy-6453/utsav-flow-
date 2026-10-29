/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { WorkspaceLayout } from './WorkspaceLayout';
import { useEvent } from '../context/EventContext';
import { TimelineTask, TaskStatus } from '../types/plan';
import { persistTimelineTask, removeTimelineTask, updateTaskStatus } from '../utils/storage';
import { 
  evaluateTaskDependency, 
  calculateTimelineSummary 
} from '../utils/dependencyEngine';
import { 
  formatDisplayDate, 
  calculateDaysRemaining, 
  isDateOverdue 
} from '../utils/dateCalculations';
import { AddTaskModal } from './AddTaskModal';
import { TaskDetailDrawer } from './TaskDetailDrawer';
import { ExportCalendarModal } from './ExportCalendarModal';
import { EventBriefModal } from './EventBriefModal';
import { Calendar, FileText } from 'lucide-react';

export const TimelineView: React.FC = () => {
  const { draft, plan, setPlan, openReplan } = useEvent();

  // Modal and Drawer states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isExportCalendarOpen, setIsExportCalendarOpen] = useState<boolean>(false);
  const [isEventBriefOpen, setIsEventBriefOpen] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<TimelineTask | null>(null);

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');

  // Collapsible phases
  const [collapsedPhases, setCollapsedPhases] = useState<Record<string, boolean>>({});

  const tasks = plan.timelineTasks || [];
  const eventDate = draft.eventDate || '2026-11-20';
  const daysUntilEvent = calculateDaysRemaining(eventDate);

  // Metrics from dependency engine
  const metrics = useMemo(() => calculateTimelineSummary(tasks), [tasks]);

  // Group tasks by Phase
  const phases = useMemo(() => {
    const list: string[] = [];
    tasks.forEach(t => {
      if (!list.includes(t.phase)) {
        list.push(t.phase);
      }
    });
    // Ensure default ordering
    const preferredOrder = [
      'Initial Planning',
      'Venue & Vendor Bookings',
      'Final Preparations',
      'Event Day'
    ];
    return list.sort((a, b) => {
      const idxA = preferredOrder.indexOf(a);
      const idxB = preferredOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search
      const matchesSearch = 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;

      // Phase filter
      if (phaseFilter !== 'all' && task.phase !== phaseFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const depStatus = evaluateTaskDependency(task, tasks);
        if (statusFilter === 'blocked') {
          return depStatus.isBlocked;
        }
        if (statusFilter === 'delayed') {
          return task.status === 'delayed';
        }
        if (statusFilter === 'completed') {
          return task.status === 'completed';
        }
        if (statusFilter === 'in_progress') {
          return task.status === 'in_progress';
        }
        if (statusFilter === 'pending') {
          return task.status === 'pending';
        }
      }

      return true;
    });
  }, [tasks, searchQuery, phaseFilter, statusFilter]);

  const togglePhaseCollapse = (phaseName: string) => {
    setCollapsedPhases(prev => ({
      ...prev,
      [phaseName]: !prev[phaseName]
    }));
  };

  const handleToggleComplete = (task: TimelineTask, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    const depStatus = evaluateTaskDependency(task, tasks);

    if (newStatus === 'completed' && depStatus.isBlocked) {
      setSelectedTask(task);
      return;
    }

    const updatedPlan = updateTaskStatus(task.id, newStatus, draft);
    setPlan({ ...updatedPlan });
  };

  const handleSaveTask = (taskToSave: TimelineTask) => {
    const updatedPlan = persistTimelineTask(taskToSave, draft);
    setPlan({ ...updatedPlan });
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedPlan = removeTimelineTask(taskId, draft);
    setPlan({ ...updatedPlan });
  };

  return (
    <WorkspaceLayout activeTab="timeline">
      {/* 1. PAGE HEADER */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
            <span>{draft.eventName || 'Grand Celebration'}</span>
            <span className="text-zinc-300">·</span>
            <span className="text-[#3730a3]">{formatDisplayDate(eventDate)}</span>
            <span className="text-zinc-300">·</span>
            <span className="text-zinc-600 font-mono">
              {daysUntilEvent >= 0 ? `${daysUntilEvent} Days Remaining` : `${Math.abs(daysUntilEvent)} Days Passed`}
            </span>
          </div>
          <h1 className="font-['Fraunces',serif] text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
            Timeline
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1 max-w-2xl font-medium">
            Your event tasks, deadlines and dependencies, organized in one clear plan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button 
            onClick={() => setIsExportCalendarOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 font-bold text-xs sm:text-sm shadow-xs active:scale-[0.98] transition-all cursor-pointer" 
            type="button"
          >
            <Calendar className="w-4 h-4 text-[#3730a3]" />
            <span>Export Calendar</span>
          </button>
          <button 
            onClick={() => setIsEventBriefOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 font-bold text-xs sm:text-sm shadow-xs active:scale-[0.98] transition-all cursor-pointer" 
            type="button"
          >
            <FileText className="w-4 h-4 text-[#3730a3]" />
            <span>Event Brief</span>
          </button>
          <button 
            onClick={openReplan}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-[#3730a3] font-bold text-xs sm:text-sm shadow-xs active:scale-[0.98] transition-all cursor-pointer" 
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            <span>Date Shift / Replan</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#3730a3] hover:bg-[#312E81] text-white font-bold text-xs sm:text-sm shadow-md active:scale-[0.98] transition-all cursor-pointer" 
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add_task</span>
            <span>+ Add Task</span>
          </button>
        </div>
      </section>

      {/* 2. THREE SUMMARY CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Completed Tasks */}
        <div className="p-5 rounded-2xl bg-white border border-[#E6E1DA] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Completed Tasks</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {metrics.progressPercent}% Finished
            </span>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-bold text-zinc-900 tracking-tight">
              {metrics.completedTasks} <span className="text-zinc-400 font-normal text-sm">/ {metrics.totalTasks}</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1 font-medium">Verified deliverables</p>
          </div>
        </div>

        {/* Card 2: Upcoming Tasks */}
        <div className="p-5 rounded-2xl bg-white border border-[#E6E1DA] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Upcoming Tasks</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
              On Track
            </span>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-bold text-[#3730a3] tracking-tight">
              {metrics.upcomingTasks} <span className="text-zinc-400 font-normal text-sm">Active</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1 font-medium">Unblocked future actions</p>
          </div>
        </div>

        {/* Card 3: At-Risk Tasks */}
        <div className="p-5 rounded-2xl bg-white border border-[#E6E1DA] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">At-Risk Tasks</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              metrics.atRiskTasks > 0 
                ? 'bg-rose-50 text-rose-800 border-rose-200' 
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              {metrics.atRiskTasks > 0 ? 'Action Required' : 'All Clear'}
            </span>
          </div>
          <div className="mt-3">
            <div className={`font-mono text-2xl font-bold tracking-tight ${
              metrics.atRiskTasks > 0 ? 'text-rose-600' : 'text-zinc-900'
            }`}>
              {metrics.atRiskTasks} <span className="text-zinc-400 font-normal text-sm">Bottlenecks</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1 font-medium">Overdue, delayed, or blocked</p>
          </div>
        </div>
      </section>

      {/* 3. EVENT SCHEDULE SUMMARY & PROGRESS BAR */}
      <section className="p-5 rounded-2xl bg-white border border-[#E6E1DA] shadow-xs flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-zinc-900">Celebration Schedule Progress</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F3EFEA] text-zinc-700 border border-[#E6E1DA]">
              {daysUntilEvent >= 0 ? `${daysUntilEvent} Days Countdown` : 'Event Passed'}
            </span>
          </div>
          <div className="font-mono text-xs sm:text-sm font-bold text-zinc-900">
            {metrics.completedTasks} of {metrics.totalTasks} Tasks Completed
            <span className="ml-1 text-[#3730a3] font-bold">({metrics.progressPercent}%)</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-zinc-100 overflow-hidden relative border border-zinc-200">
          <div 
            className="h-full bg-[#3730a3] rounded-full transition-all duration-500" 
            style={{ width: `${metrics.progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs font-medium text-zinc-600">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[17px] text-sky-600">calendar_month</span>
            <span>Target Celebration Date: <strong>{formatDisplayDate(eventDate)}</strong></span>
          </div>
          <span className="text-zinc-400 font-mono text-[11px] hidden sm:inline">
            Dependency Cascade Active
          </span>
        </div>
      </section>

      {/* 4. FILTERS & SEARCH */}
      <section className="p-5 rounded-2xl bg-white border border-[#E6E1DA] shadow-xs flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-zinc-900">Milestone Tasks</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F3EFEA] text-zinc-700 border border-[#E6E1DA]">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[17px] text-zinc-400">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title or description..."
                className="w-full h-9 pl-8 pr-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 font-medium placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#3730a3] focus:bg-white text-xs"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[15px]">close</span>
                </button>
              )}
            </div>

            {/* Status Tabs */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3730a3]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="delayed">Delayed</option>
              <option value="blocked">Blocked</option>
            </select>

            {/* Phase Filter */}
            <select
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3730a3]"
            >
              <option value="all">All Phases</option>
              {phases.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 5. TASKS GROUPED BY PHASE */}
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center rounded-xl bg-zinc-50 border border-dashed border-zinc-200">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-[#3730a3] flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[24px]">event_busy</span>
            </div>
            <h3 className="text-base font-bold text-zinc-900">
              {tasks.length === 0 ? 'No tasks in timeline yet' : 'No matching tasks found'}
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-4">
              {tasks.length === 0
                ? 'Create milestone tasks with deadlines and dependencies to orchestrate your event.'
                : 'Try adjusting your search query or filters to find specific tasks.'}
            </p>
            {tasks.length === 0 ? (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#3730a3] text-white text-xs font-bold shadow-sm hover:bg-[#312E81] cursor-pointer transition-colors"
              >
                + Add Task
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setPhaseFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-white border border-zinc-300 text-zinc-700 text-xs font-bold hover:bg-zinc-100 cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {phases.map(phaseName => {
              const phaseTasks = filteredTasks.filter(t => t.phase === phaseName);
              if (phaseTasks.length === 0) return null;

              const isCollapsed = !!collapsedPhases[phaseName];
              const phaseCompleted = phaseTasks.filter(t => t.status === 'completed').length;

              return (
                <div key={phaseName} className="rounded-2xl border border-[#E6E1DA] overflow-hidden bg-white shadow-2xs">
                  {/* Phase Header */}
                  <div 
                    onClick={() => togglePhaseCollapse(phaseName)}
                    className="p-4 bg-[#F3EFEA]/80 border-b border-[#E6E1DA] flex items-center justify-between cursor-pointer hover:bg-[#F3EFEA] transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-zinc-500 text-[20px] transition-transform duration-200" style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                        expand_more
                      </span>
                      <div>
                        <h3 className="font-bold text-sm text-zinc-900">{phaseName}</h3>
                        <span className="text-[11px] text-zinc-500 font-medium">
                          {phaseCompleted} of {phaseTasks.length} tasks completed
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-zinc-600 bg-white px-2 py-0.5 rounded border border-[#E6E1DA]">
                        {phaseTasks.length} {phaseTasks.length === 1 ? 'Task' : 'Tasks'}
                      </span>
                    </div>
                  </div>

                  {/* Phase Task Rows */}
                  {!isCollapsed && (
                    <div className="p-3 sm:p-4 divide-y divide-zinc-100 space-y-2">
                      {phaseTasks.map(task => {
                        const depStatus = evaluateTaskDependency(task, tasks);
                        const isOverdue = isDateOverdue(task.dueDate) && task.status !== 'completed';
                        const isDone = task.status === 'completed';

                        return (
                          <div
                            key={task.id}
                            onClick={() => setSelectedTask(task)}
                            className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 group ${
                              isDone 
                                ? 'bg-zinc-50/50 border-zinc-200 opacity-80' 
                                : depStatus.isBlocked 
                                ? 'bg-amber-50/20 border-amber-200 hover:border-amber-300' 
                                : isOverdue 
                                ? 'bg-rose-50/20 border-rose-200 hover:border-rose-300' 
                                : 'bg-white border-[#E6E1DA] hover:border-[#3730a3] hover:shadow-xs'
                            }`}
                          >
                            {/* Left: Checkbox + Title + Description */}
                            <div className="flex items-start gap-3.5 flex-1 min-w-0">
                              <button
                                type="button"
                                onClick={(e) => handleToggleComplete(task, e)}
                                className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                                  isDone 
                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs' 
                                    : 'border-zinc-300 hover:border-[#3730a3] bg-white text-transparent hover:text-zinc-300'
                                }`}
                                aria-label={isDone ? 'Mark task incomplete' : 'Mark task complete'}
                              >
                                <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                              </button>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className={`text-sm font-bold truncate ${
                                    isDone ? 'line-through text-zinc-400' : 'text-zinc-900 group-hover:text-[#3730a3]'
                                  }`}>
                                    {task.title}
                                  </h4>
                                  {/* Priority Badge */}
                                  <span className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    task.priority === 'high' 
                                      ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                                      : task.priority === 'medium' 
                                      ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                                      : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                                  }`}>
                                    {task.priority}
                                  </span>
                                </div>

                                {task.description && (
                                  <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                                    {task.description}
                                  </p>
                                )}

                                {/* Dependency / Overdue warnings */}
                                {depStatus.reason && !isDone && (
                                  <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-medium">
                                    <span className="material-symbols-outlined text-[14px] text-amber-700">lock</span>
                                    <span>{depStatus.reason}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right: Due Date + Status + Action Chevron */}
                            <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100">
                              <div className="text-right">
                                <span className={`font-mono text-xs font-bold block ${
                                  isOverdue ? 'text-rose-600' : 'text-zinc-800'
                                }`}>
                                  {formatDisplayDate(task.dueDate)}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-medium">
                                  {isDone ? 'Completed' : isOverdue ? 'Overdue deadline' : 'Target date'}
                                </span>
                              </div>

                              {/* Status Tag */}
                              <div className="min-w-[90px] text-center">
                                {isDone ? (
                                  <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    Completed
                                  </span>
                                ) : task.status === 'delayed' ? (
                                  <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                    Delayed
                                  </span>
                                ) : depStatus.isBlocked ? (
                                  <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                    Blocked
                                  </span>
                                ) : (
                                  <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                                    {task.status.replace('_', ' ')}
                                  </span>
                                )}
                              </div>

                              <span className="material-symbols-outlined text-zinc-400 group-hover:text-[#3730a3] group-hover:translate-x-0.5 transition-all text-[20px]">
                                chevron_right
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 6. ADD TASK MODAL */}
      <AddTaskModal
        isOpen={isAddModalOpen}
        existingTasks={tasks}
        eventDate={eventDate}
        onSave={handleSaveTask}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* 7. TASK DETAIL DRAWER */}
      <TaskDetailDrawer
        isOpen={!!selectedTask}
        task={selectedTask}
        allTasks={tasks}
        onUpdateTask={handleSaveTask}
        onDeleteTask={handleDeleteTask}
        onClose={() => setSelectedTask(null)}
      />

      {/* 9. EXPORT CALENDAR MODAL */}
      {isExportCalendarOpen && (
        <ExportCalendarModal
          isOpen={isExportCalendarOpen}
          plan={plan}
          draft={draft}
          onClose={() => setIsExportCalendarOpen(false)}
        />
      )}

      {/* 10. EVENT BRIEF PREVIEW & PRINT MODAL */}
      {isEventBriefOpen && (
        <EventBriefModal
          isOpen={isEventBriefOpen}
          plan={plan}
          draft={draft}
          onClose={() => setIsEventBriefOpen(false)}
        />
      )}
    </WorkspaceLayout>
  );
};
