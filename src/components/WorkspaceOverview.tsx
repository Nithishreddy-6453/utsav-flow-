/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { WorkspaceLayout } from './WorkspaceLayout';
import { useEvent } from '../context/EventContext';
import { calculateTimelineSummary } from '../utils/dependencyEngine';
import { calculateDaysRemaining, formatDisplayDate } from '../utils/dateCalculations';
import { formatINR } from '../utils/calculations';
import { EventBriefModal } from './EventBriefModal';
import { FileText } from 'lucide-react';

export const WorkspaceOverview: React.FC = () => {
  const { draft, plan, navigate, openReplan } = useEvent();
  const [isEventBriefOpen, setIsEventBriefOpen] = useState<boolean>(false);

  const tasks = plan.timelineTasks || [];
  const taskMetrics = useMemo(() => calculateTimelineSummary(tasks), [tasks]);
  const daysUntilEvent = calculateDaysRemaining(draft.eventDate);

  const nextActionTask = useMemo(() => {
    return tasks.find(t => t.status !== 'completed' && t.priority === 'high') ||
           tasks.find(t => t.status !== 'completed') ||
           tasks[0];
  }, [tasks]);

  return (
    <WorkspaceLayout activeTab="overview">
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] uppercase tracking-wider font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">Master Plan Overview ✦ AI Generated</span>
            <span className="text-zinc-400 text-xs">·</span>
            <span className="font-mono text-xs text-zinc-500 font-bold">v2.1</span>
          </div>
          <h1 className="font-['Fraunces',serif] text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
            {plan.eventName || draft.eventName || "Grand Celebration"}
          </h1>
          <div className="flex flex-wrap items-center gap-2.5 mt-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-zinc-200 text-zinc-800 text-xs font-semibold shadow-2xs">
              <span className="material-symbols-outlined text-[15px] text-zinc-500">event</span>
              <span>{formatDisplayDate(draft.eventDate)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-[#3730a3] text-xs font-bold shadow-2xs">
              <span className="material-symbols-outlined text-[15px]">timer</span>
              <span>
                {daysUntilEvent >= 0 ? `${daysUntilEvent} Days Countdown` : `${Math.abs(daysUntilEvent)} Days Passed`}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-zinc-200 text-zinc-800 text-xs font-semibold shadow-2xs">
              <span className="material-symbols-outlined text-[15px] text-zinc-500">groups</span>
              <span>{plan.guestSummary?.totalGuests || draft.totalGuests} Guests</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-zinc-200 text-zinc-800 text-xs font-semibold shadow-2xs">
              <span className="material-symbols-outlined text-[15px] text-zinc-500">account_balance_wallet</span>
              <span>{formatINR(plan.budgetSummary?.totalBudget || draft.maxBudget || 1000000)} Budget</span>
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0">
          <button
            type="button"
            onClick={() => setIsEventBriefOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold shadow-xs cursor-pointer transition-all"
          >
            <FileText className="w-4 h-4 text-[#3730a3]" />
            <span>Export Event Brief</span>
          </button>
          <button
            onClick={openReplan}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#3730a3] hover:bg-[#2e2882] text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span>Revise Plan &amp; Simulate Shock</span>
          </button>
          <button onClick={() => navigate('/events/new/review')} className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-semibold shadow-xs cursor-pointer transition-all" type="button">
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>Edit Wizard</span>
          </button>
        </div>
      </section>

      {/* AI Executive Summary Banner */}
      <section className="bg-gradient-to-r from-indigo-50 via-white to-amber-50 rounded-2xl p-6 border border-indigo-100 shadow-sm">
        <div className="flex items-center gap-2 text-[#3730a3] font-bold text-xs mb-2 uppercase tracking-wide">
          <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          <span>GenAI Celebration Synthesis</span>
        </div>
        <p className="text-zinc-800 text-sm sm:text-base font-semibold leading-relaxed">
          {plan.summary}
        </p>
      </section>

      {/* KPI Bento Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Budget Ceiling */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-zinc-600 mb-2">
              <span>Total Budget Ceiling</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-100 text-zinc-800 font-bold uppercase">{draft.budgetFlexibility}</span>
            </div>
            <div className="font-mono text-2xl font-bold text-zinc-900">{formatINR(plan.budgetSummary?.totalBudget || draft.maxBudget || 1000000)}</div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 text-xs text-zinc-600 flex justify-between font-medium">
            <span>Buffer Reserve (5%)</span>
            <span className="font-mono font-bold text-zinc-900">{formatINR(plan.budgetSummary?.bufferReserve || 50000)}</span>
          </div>
        </div>

        {/* KPI 2: Projected Spend */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-zinc-600 mb-2">
              <span>Projected Spend</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold">Optimized</span>
            </div>
            <div className="font-mono text-2xl font-bold text-[#3730a3]">{formatINR(plan.budgetSummary?.projectedSpend || 0)}</div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 text-xs text-zinc-600 flex justify-between font-medium">
            <span>Categories Tracked</span>
            <span className="font-mono font-bold text-zinc-900">{plan.budgetItems?.length || plan.budgetSummary?.categories?.length || 0} Line Items</span>
          </div>
        </div>

        {/* KPI 3: Task Progress (Synchronized with Timeline) */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-zinc-600 mb-2">
              <span>Milestone Tasks</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                taskMetrics.atRiskTasks > 0
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {taskMetrics.atRiskTasks > 0 ? `${taskMetrics.atRiskTasks} At Risk` : 'All On Track'}
              </span>
            </div>
            <div className="font-mono text-2xl font-bold text-zinc-900">
              {taskMetrics.completedTasks} <span className="text-zinc-400 font-normal text-sm">/ {taskMetrics.totalTasks}</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 text-xs text-zinc-600 flex justify-between font-medium">
            <span>Next Priority</span>
            <span className="font-bold text-amber-800 truncate max-w-[140px]">
              {nextActionTask?.title || 'All tasks completed'}
            </span>
          </div>
        </div>

        {/* KPI 4: Guest Cohorts */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-zinc-600 mb-2">
              <span>Guest Cohorts</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-50 text-[#3730a3] font-mono font-bold">Confirmed</span>
            </div>
            <div className="font-mono text-2xl font-bold text-zinc-900">{plan.guestSummary?.totalGuests || draft.totalGuests} <span className="text-zinc-600 font-normal text-sm">Guests</span></div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 text-xs text-zinc-600 flex justify-between font-medium">
            <span>Adults / Seniors / Kids</span>
            <span className="font-bold text-zinc-900">{plan.guestSummary?.adults} / {plan.guestSummary?.seniors} / {plan.guestSummary?.children}</span>
          </div>
        </div>
      </section>

      {/* Budget Category Allocation Breakdown */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
          <div>
            <h2 className="font-bold text-zinc-900 text-base">Budget Allocation Breakdown</h2>
            <p className="text-xs text-zinc-500 font-semibold">Allocated funds across priority categories</p>
          </div>
          <button onClick={() => navigate('/workspace/budget')} className="text-xs font-bold text-[#3730a3] hover:underline" type="button">
            View Full Ledger →
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plan.budgetSummary?.categories?.map(cat => (
            <div key={cat.categoryName} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-zinc-900 text-sm">{cat.categoryName}</span>
                  <span className="font-mono text-xs font-bold text-[#3730a3]">{formatINR(cat.allocated)}</span>
                </div>
                <p className="text-xs text-zinc-600">{cat.notes}</p>
              </div>
              <div className="text-[11px] font-mono font-semibold text-zinc-500 pt-2 border-t border-zinc-200 flex justify-between">
                <span>Committed Quote</span>
                <span className="text-zinc-800">{formatINR(cat.spent)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col gap-4 shadow-sm">
        <h2 className="text-base font-bold text-zinc-900">Workspace Management Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            type="button" 
            onClick={() => navigate('/workspace/budget')} 
            className="p-4 rounded-xl border border-zinc-200 hover:border-[#3730a3] cursor-pointer transition-all bg-zinc-50 hover:bg-indigo-50/40 text-left w-full focus:outline-hidden focus:ring-2 focus:ring-[#3730a3]"
            aria-label="Navigate to Budget Ledger"
          >
            <h3 className="font-bold text-sm text-[#3730a3]">Budget Ledger →</h3>
            <p className="text-xs text-zinc-600 mt-1">Manage categories, user quotes, and payment disbursements.</p>
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/workspace/timeline')} 
            className="p-4 rounded-xl border border-zinc-200 hover:border-[#3730a3] cursor-pointer transition-all bg-zinc-50 hover:bg-indigo-50/40 text-left w-full focus:outline-hidden focus:ring-2 focus:ring-[#3730a3]"
            aria-label="Navigate to Timeline Flow"
          >
            <h3 className="font-bold text-sm text-[#3730a3]">Timeline Flow →</h3>
            <p className="text-xs text-zinc-600 mt-1">Track milestone tasks, dependencies, and bottleneck alerts.</p>
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/workspace/vendors')} 
            className="p-4 rounded-xl border border-zinc-200 hover:border-[#3730a3] cursor-pointer transition-all bg-zinc-50 hover:bg-indigo-50/40 text-left w-full focus:outline-hidden focus:ring-2 focus:ring-[#3730a3]"
            aria-label="Navigate to Vendor Studio"
          >
            <h3 className="font-bold text-sm text-[#3730a3]">Vendor Studio →</h3>
            <p className="text-xs text-zinc-600 mt-1">Compare quotations, audit unstated GST, and book vendors.</p>
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/workspace/ideas')} 
            className="p-4 rounded-xl border border-zinc-200 hover:border-[#3730a3] cursor-pointer transition-all bg-zinc-50 hover:bg-indigo-50/40 text-left w-full focus:outline-hidden focus:ring-2 focus:ring-[#3730a3]"
            aria-label="Navigate to Ideas and Experience"
          >
            <h3 className="font-bold text-sm text-[#3730a3]">Ideas &amp; Experience →</h3>
            <p className="text-xs text-zinc-600 mt-1">Explore personalized concepts, menus, and styling tailored to your event.</p>
          </button>
        </div>
      </section>

      {/* Event Brief Preview & Print Modal */}
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
