/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EventPlan, BudgetItem, TimelineTask, Vendor, VendorQuote } from '../types/plan';
import { EventDraft } from '../types';
import { formatINR } from '../utils/calculations';
import { formatDisplayDate, calculateDaysRemaining, isDateOverdue } from '../utils/dateCalculations';
import { evaluateTaskDependency } from '../utils/dependencyEngine';
import {
  Printer,
  X,
  FileText,
  Calendar,
  Users,
  IndianRupee,
  ShieldCheck,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Phone,
  Mail,
  User,
  History,
  Tag
} from 'lucide-react';

interface EventBriefModalProps {
  isOpen: boolean;
  plan: EventPlan;
  draft: EventDraft;
  onClose: () => void;
}

export const EventBriefModal: React.FC<EventBriefModalProps> = ({
  isOpen,
  plan,
  draft,
  onClose
}) => {
  const [includeCompletedTasks, setIncludeCompletedTasks] = useState<boolean>(false);
  const [includeVendorContacts, setIncludeVendorContacts] = useState<boolean>(true);
  const [includeReplanHistory, setIncludeReplanHistory] = useState<boolean>(true);

  if (!isOpen) return null;

  const eventDate = draft.eventDate || '';
  const daysRemaining = calculateDaysRemaining(eventDate);
  const totalBudget = plan.budgetSummary?.totalBudget || draft.maxBudget || 1000000;
  const projectedSpend = plan.budgetSummary?.projectedSpend || 0;
  const bufferReserve = plan.budgetSummary?.bufferReserve || 0;
  const deficitOrSurplus = totalBudget - projectedSpend;
  const isOverBudget = deficitOrSurplus < 0;

  const budgetItems: BudgetItem[] = plan.budgetItems || [];
  const paidSoFar = budgetItems.reduce((sum, item) => sum + (item.paidAmount || 0), 0);
  const totalAllocated = budgetItems.reduce((sum, item) => sum + (item.allocatedAmount || 0), 0);

  const tasks: TimelineTask[] = plan.timelineTasks || [];
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  // Group pending tasks by phase
  const tasksByPhase: Record<string, TimelineTask[]> = {};
  pendingTasks.forEach(task => {
    const phase = task.phase || 'General Execution';
    if (!tasksByPhase[phase]) tasksByPhase[phase] = [];
    tasksByPhase[phase].push(task);
  });

  const vendors: Vendor[] = plan.vendors || [];
  const quotes: VendorQuote[] = plan.quotes || [];
  const latestReplan = plan.replanHistory && plan.replanHistory.length > 0 ? plan.replanHistory[0] : null;

  // Unresolved matters & decisions
  const unconfirmedQuotes = quotes.filter(q => q.reviewStatus === 'pending_review');
  const overdueTasks = tasks.filter(t => t.status !== 'completed' && isDateOverdue(t.dueDate));
  const blockedTasks = tasks.filter(t => evaluateTaskDependency(t, tasks).isBlocked);
  const quotesWithTaxRisk = quotes.filter(q => q.extractedAnalysis?.taxAndTerms?.taxesIncluded === 'NOT_STATED');

  const generationDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const formatCostSource = (source?: string) => {
    switch (source) {
      case 'vendor_quote':
        return 'Vendor Quoted';
      case 'user_estimate':
        return 'User Estimate';
      case 'ai_estimate':
      default:
        return 'AI Estimate';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="brief-preview-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-900/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 w-full max-w-4xl h-[92vh] flex flex-col overflow-hidden">
        {/* Interactive Top Control Bar (Hidden when printed) */}
        <div className="no-print px-6 py-4 border-b border-zinc-200 bg-zinc-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-[#3730a3] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 id="brief-preview-title" className="text-base sm:text-lg font-bold text-zinc-900">
                Print-Ready Event Brief
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                Preview operations brief and save as PDF via your browser's print menu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#3730a3] hover:bg-[#2e2882] text-white text-xs font-bold shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl hover:bg-zinc-200 text-zinc-500 hover:text-zinc-700 flex items-center justify-center transition-colors"
              aria-label="Close brief preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Customization Options Bar (Hidden when printed) */}
        <div className="no-print px-6 py-2.5 bg-indigo-50/50 border-b border-indigo-100 flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-700 shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
            Document Options:
          </span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeCompletedTasks}
              onChange={e => setIncludeCompletedTasks(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-[#3730a3] focus:ring-indigo-500 border-zinc-300"
            />
            <span>Include completed tasks ({completedTasks.length})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeVendorContacts}
              onChange={e => setIncludeVendorContacts(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-[#3730a3] focus:ring-indigo-500 border-zinc-300"
            />
            <span>Include vendor phone &amp; email</span>
          </label>
          {latestReplan && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeReplanHistory}
                onChange={e => setIncludeReplanHistory(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-[#3730a3] focus:ring-indigo-500 border-zinc-300"
              />
              <span>Include recent replan summary</span>
            </label>
          )}
        </div>

        {/* Scrollable Document Container (Printable) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white" id="event-brief-container">
          <article id="event-brief-printable" className="max-w-3xl mx-auto space-y-8 text-zinc-900">
            
            {/* 1. COVER & EVENT SUMMARY */}
            <header className="border-b-2 border-zinc-900 pb-6 print-avoid-break">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#3730a3] text-white flex items-center justify-center font-bold text-sm font-['Fraunces',serif]">
                    U
                  </div>
                  <div>
                    <span className="font-['Fraunces',serif] text-lg font-bold tracking-tight text-zinc-900 block leading-none">
                      UtsavFlow
                    </span>
                    <span className="text-[10px] tracking-wider uppercase text-zinc-500 font-semibold">
                      Celebration Operations Brief
                    </span>
                  </div>
                </div>
                <div className="text-right text-xs text-zinc-500">
                  <p className="font-semibold text-zinc-700">Date Generated</p>
                  <p>{generationDate}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 mb-2">
                  {draft.occasionType || 'Celebration'} Operations Plan
                </div>
                <h1 className="font-['Fraunces',serif] text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
                  {draft.eventName || 'Grand Celebration'}
                </h1>
                {plan.summary && (
                  <p className="text-sm text-zinc-600 mt-2 leading-relaxed italic">
                    "{plan.summary}"
                  </p>
                )}
              </div>

              {/* 4 Summary Metadata Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-zinc-200 text-xs">
                <div>
                  <span className="text-zinc-500 block text-[11px] font-semibold uppercase">Event Date</span>
                  <span className="font-bold text-zinc-900 text-sm">{formatDisplayDate(eventDate)}</span>
                  <span className="text-zinc-500 text-[11px] block">
                    {daysRemaining >= 0 ? `${daysRemaining} days left` : 'Completed'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px] font-semibold uppercase">Location</span>
                  <span className="font-bold text-zinc-900 text-sm">
                    {draft.eventLocation || 'Location TBD'}
                  </span>
                  <span className="text-zinc-500 text-[11px] block">Venue &amp; City</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px] font-semibold uppercase">Headcount</span>
                  <span className="font-bold text-zinc-900 text-sm">{draft.totalGuests || 150} Guests</span>
                  <span className="text-zinc-500 text-[11px] block">Catering baseline</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px] font-semibold uppercase">Budget Cap</span>
                  <span className="font-bold text-zinc-900 text-sm">{formatINR(totalBudget)}</span>
                  <span className="text-zinc-500 text-[11px] block font-mono">
                    {draft.budgetFlexibility || 'Moderate'} flexibility
                  </span>
                </div>
              </div>
            </header>

            {/* 2. EVENT OBJECTIVES & REQUIREMENTS */}
            <section className="space-y-4 print-avoid-break">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#3730a3] border-b border-indigo-100 pb-1">
                2. Event Objectives &amp; Requirements
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Priorities */}
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                  <span className="font-bold text-zinc-900 block mb-2">Ranked Priorities</span>
                  {draft.priorities && draft.priorities.length > 0 ? (
                    <ol className="list-decimal list-inside space-y-1 text-zinc-700">
                      {draft.priorities.map((p, idx) => (
                        <li key={idx} className="font-medium">
                          {p}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-zinc-500 italic">No prioritized areas specified</p>
                  )}
                </div>

                {/* Must Haves */}
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                  <span className="font-bold text-zinc-900 block mb-2">Essential Must-Haves</span>
                  {draft.mustHaves && draft.mustHaves.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-zinc-700">
                      {draft.mustHaves.map((m, idx) => (
                        <li key={idx} className="font-medium">
                          {m}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-zinc-500 italic">None specified</p>
                  )}
                </div>
              </div>

              {/* Cultural & Accessibility Notes */}
              {(draft.culturalPreferences || draft.accessibilityRequirements || draft.thingsToAvoid) && (
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-2">
                  {draft.culturalPreferences && (
                    <div>
                      <span className="font-bold text-zinc-900">Cultural &amp; Ceremonial Traditions: </span>
                      <span className="text-zinc-700">{draft.culturalPreferences}</span>
                    </div>
                  )}
                  {draft.accessibilityRequirements && (
                    <div>
                      <span className="font-bold text-zinc-900">Accessibility &amp; Guest Comfort: </span>
                      <span className="text-zinc-700">{draft.accessibilityRequirements}</span>
                    </div>
                  )}
                  {draft.thingsToAvoid && (
                    <div>
                      <span className="font-bold text-zinc-900">Strictly Avoid: </span>
                      <span className="text-zinc-700">{draft.thingsToAvoid}</span>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* 3. BUDGET OVERVIEW & COST SOURCE LEDGER */}
            <section className="space-y-4 print-avoid-break">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#3730a3] border-b border-indigo-100 pb-1">
                3. Financial Budget &amp; Cost Provenance
              </h2>

              {/* Financial KPI Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50">
                  <span className="text-zinc-500 text-[11px] block font-semibold">Total Budget</span>
                  <span className="font-mono text-base font-bold text-zinc-900">{formatINR(totalBudget)}</span>
                </div>
                <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50">
                  <span className="text-zinc-500 text-[11px] block font-semibold">Projected Cost</span>
                  <span className="font-mono text-base font-bold text-[#3730a3]">{formatINR(projectedSpend)}</span>
                </div>
                <div className={`p-3 rounded-xl border ${isOverBudget ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <span className={`text-[11px] block font-semibold ${isOverBudget ? 'text-rose-800' : 'text-emerald-800'}`}>
                    {isOverBudget ? 'Budget Deficit' : 'Remaining Balance'}
                  </span>
                  <span className={`font-mono text-base font-bold ${isOverBudget ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {formatINR(Math.abs(deficitOrSurplus))}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50">
                  <span className="text-zinc-500 text-[11px] block font-semibold">Paid So Far</span>
                  <span className="font-mono text-base font-bold text-zinc-900">{formatINR(paidSoFar)}</span>
                </div>
              </div>

              {/* Budget Item Table */}
              <div className="border border-zinc-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100/70 border-b border-zinc-200 text-zinc-700 uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Item Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Allocated</th>
                      <th className="py-2.5 px-3 text-right">Projected</th>
                      <th className="py-2.5 px-3 text-right">Paid</th>
                      <th className="py-2.5 px-3">Cost Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {budgetItems.length > 0 ? (
                      budgetItems.map(item => (
                        <tr key={item.id} className="hover:bg-zinc-50/50">
                          <td className="py-2 px-3 font-semibold text-zinc-900">
                            {item.itemName}
                          </td>
                          <td className="py-2 px-3 text-zinc-600">{item.categoryName}</td>
                          <td className="py-2 px-3 text-right font-mono text-zinc-700">
                            {formatINR(item.allocatedAmount)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-zinc-900">
                            {formatINR(item.projectedCost)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-zinc-600">
                            {formatINR(item.paidAmount || 0)}
                          </td>
                          <td className="py-2 px-3">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                              {formatCostSource(item.costSource)}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-zinc-500 italic">
                          No budget line items recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-zinc-50 border-t border-zinc-200 font-bold text-zinc-900">
                    <tr>
                      <td colSpan={2} className="py-2.5 px-3">Totals</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatINR(totalAllocated)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#3730a3]">{formatINR(projectedSpend)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatINR(paidSoFar)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            {/* 4. PLANNING TIMELINE */}
            <section className="space-y-4 print-avoid-break">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#3730a3] border-b border-indigo-100 pb-1">
                4. Planning Timeline &amp; Key Deadlines
              </h2>

              {Object.keys(tasksByPhase).length > 0 ? (
                <div className="space-y-4 text-xs">
                  {Object.entries(tasksByPhase).map(([phase, phaseTasks]) => (
                    <div key={phase} className="border border-zinc-200 rounded-xl overflow-hidden print-avoid-break">
                      <div className="bg-zinc-100/80 px-3 py-2 font-bold text-zinc-800 text-xs border-b border-zinc-200 flex justify-between items-center">
                        <span>{phase}</span>
                        <span className="text-[11px] text-zinc-500 font-normal">
                          {phaseTasks.length} {phaseTasks.length === 1 ? 'task' : 'tasks'}
                        </span>
                      </div>
                      <div className="divide-y divide-zinc-100">
                        {phaseTasks.map(task => {
                          const dep = evaluateTaskDependency(task, tasks);
                          const isOver = isDateOverdue(task.dueDate);

                          return (
                            <div key={task.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-zinc-900">{task.title}</span>
                                  {isOver && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                      Overdue
                                    </span>
                                  )}
                                  {dep.isBlocked && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                      Blocked
                                    </span>
                                  )}
                                </div>
                                {task.description && (
                                  <p className="text-[11px] text-zinc-500 mt-0.5">{task.description}</p>
                                )}
                                {dep.isBlocked && dep.reason && (
                                  <p className="text-[10px] text-amber-700 mt-0.5 font-medium">
                                    ⚠ {dep.reason}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0 text-[11px]">
                                <span className="font-semibold text-zinc-700">
                                  {formatDisplayDate(task.dueDate)}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                  task.priority === 'high' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                  task.priority === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                  'bg-zinc-50 text-zinc-700 border border-zinc-200'
                                }`}>
                                  {task.priority}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">No outstanding planning tasks.</p>
              )}

              {/* Optional Completed Tasks Subsection */}
              {includeCompletedTasks && completedTasks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-200 print-avoid-break">
                  <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wide mb-2">
                    Completed Milestones ({completedTasks.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {completedTasks.map(t => (
                      <div key={t.id} className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                        <span className="font-medium text-zinc-800 line-through text-[11px]">{t.title}</span>
                        <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Done
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* 5. VENDOR ARRANGEMENTS */}
            <section className="space-y-4 print-avoid-break">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#3730a3] border-b border-indigo-100 pb-1">
                5. Vendor Directory &amp; Proposals
              </h2>

              {vendors.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {vendors.map(vendor => {
                    const vendorQuotes = quotes.filter(q => q.vendorId === vendor.id);

                    return (
                      <div key={vendor.id} className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-2 print-avoid-break">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-zinc-900 text-sm block">{vendor.name}</span>
                            <span className="text-[11px] text-zinc-500 font-medium">{vendor.category}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            vendor.status === 'booked' ? 'bg-emerald-100 text-emerald-800' :
                            vendor.status === 'quote_received' ? 'bg-indigo-100 text-indigo-800' :
                            vendor.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                            'bg-zinc-200 text-zinc-700'
                          }`}>
                            {vendor.status.replace('_', ' ')}
                          </span>
                        </div>

                        {includeVendorContacts && (vendor.contactPerson || vendor.phone || vendor.email) && (
                          <div className="pt-2 border-t border-zinc-200 text-[11px] text-zinc-600 space-y-1">
                            {vendor.contactPerson && (
                              <div className="flex items-center gap-1.5">
                                <User className="w-3 h-3 text-zinc-400" />
                                <span>{vendor.contactPerson}</span>
                              </div>
                            )}
                            {vendor.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-zinc-400" />
                                <span>{vendor.phone}</span>
                              </div>
                            )}
                            {vendor.email && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3 h-3 text-zinc-400" />
                                <span>{vendor.email}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {vendor.notes && (
                          <p className="text-[11px] text-zinc-500 pt-1 italic">
                            "{vendor.notes}"
                          </p>
                        )}

                        {vendorQuotes.length > 0 && (
                          <div className="pt-2 border-t border-zinc-200 text-[11px]">
                            <span className="text-zinc-500 font-semibold block mb-1">Quotation Record:</span>
                            {vendorQuotes.map(q => (
                              <div key={q.id} className="flex justify-between font-mono font-medium text-zinc-800">
                                <span>{q.title || 'Proposal'}</span>
                                <span>{formatINR(q.quotedTotal)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">No vendor records documented yet.</p>
              )}
            </section>

            {/* 6. IMPORTANT DECISIONS & UNRESOLVED MATTERS */}
            <section className="space-y-4 print-avoid-break">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#3730a3] border-b border-indigo-100 pb-1">
                6. Important Action Items &amp; Unresolved Matters
              </h2>

              <div className="space-y-2 text-xs">
                {isOverBudget && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Budget Deficit: {formatINR(Math.abs(deficitOrSurplus))}</span>
                      <span className="text-[11px] text-rose-700">
                        Projected spending exceeds total budget ceiling. Rebalance allocations in Budget Ledger or execute a Shock Replan.
                      </span>
                    </div>
                  </div>
                )}

                {overdueTasks.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">{overdueTasks.length} Overdue Planning Deadlines</span>
                      <span className="text-[11px] text-amber-700">
                        {overdueTasks.map(t => t.title).join(', ')} require urgent confirmation.
                      </span>
                    </div>
                  </div>
                )}

                {unconfirmedQuotes.length > 0 && (
                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 flex items-start gap-2">
                    <Tag className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">{unconfirmedQuotes.length} Vendor Proposals Awaiting Review</span>
                      <span className="text-[11px] text-indigo-700">
                        Quotes from {unconfirmedQuotes.map(q => q.vendorName).join(', ')} pending audit in Vendor Studio.
                      </span>
                    </div>
                  </div>
                )}

                {quotesWithTaxRisk.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">{quotesWithTaxRisk.length} Quotations with Unstated Tax Terms</span>
                      <span className="text-[11px] text-amber-700">
                        Audited proposals for {quotesWithTaxRisk.map(q => q.vendorName).join(', ')} have unstated 18% GST terms risking unexpected cost increases.
                      </span>
                    </div>
                  </div>
                )}

                {!isOverBudget && overdueTasks.length === 0 && unconfirmedQuotes.length === 0 && quotesWithTaxRisk.length === 0 && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium text-[11px]">
                      All current milestones are on track, budget is balanced, and no unresolved contract risks detected.
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* 7. RECENT REPLANNING CHANGES (OPTIONAL) */}
            {includeReplanHistory && latestReplan && (
              <section className="space-y-4 print-avoid-break">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#3730a3] border-b border-indigo-100 pb-1">
                  7. Recent Replanning Revision Summary
                </h2>

                <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900 text-sm">
                      Applied Strategy: {latestReplan.strategyTitle}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Applied {new Date(latestReplan.appliedAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <p className="text-zinc-600 text-[11px] leading-relaxed">
                    {latestReplan.summary}
                  </p>
                  <div className="pt-2 border-t border-zinc-200 flex flex-wrap gap-4 text-[11px]">
                    <div>
                      <span className="text-zinc-500 font-semibold">Budget Limit Shift: </span>
                      <span className="font-mono font-bold text-zinc-800">
                        {formatINR(latestReplan.previousConstraints.maxBudget)} → {formatINR(latestReplan.updatedConstraints.maxBudget)}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 font-semibold">Guest Headcount Shift: </span>
                      <span className="font-mono font-bold text-zinc-800">
                        {latestReplan.previousConstraints.totalGuests} → {latestReplan.updatedConstraints.totalGuests} guests
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400 italic pt-1">
                    Note: This section documents approved and committed plan revisions; abandoned simulations are not recorded.
                  </p>
                </div>
              </section>
            )}

            {/* Document Footer */}
            <footer className="pt-6 border-t border-zinc-300 text-center text-[10px] text-zinc-500 print-avoid-break space-y-1">
              <p>Generated by UtsavFlow — Intelligent Celebration Architecture</p>
              <p>All financial projections and planning deadlines are synchronized with live workspace models.</p>
            </footer>

          </article>
        </div>
      </div>
    </div>
  );
};
