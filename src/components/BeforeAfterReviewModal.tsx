/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EventPlan,
  TradeOffStrategy,
  ConstraintChangeRequest,
  DeterministicImpact
} from '../types/plan';
import { formatINR } from '../utils/calculations';
import {
  X,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Users,
  IndianRupee,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText
} from 'lucide-react';

interface BeforeAfterReviewModalProps {
  isOpen: boolean;
  strategy: TradeOffStrategy;
  request: ConstraintChangeRequest;
  impact: DeterministicImpact;
  plan: EventPlan;
  onApply: (strategy: TradeOffStrategy, request: ConstraintChangeRequest) => void;
  onBack: () => void;
  onClose: () => void;
}

export const BeforeAfterReviewModal: React.FC<BeforeAfterReviewModalProps> = ({
  isOpen,
  strategy,
  request,
  impact,
  plan,
  onApply,
  onBack,
  onClose
}) => {
  if (!isOpen) return null;

  const currentC = request.currentConstraints;
  const proposedC = request.proposedConstraints;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-zinc-200 max-w-3xl w-full overflow-hidden my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[#3730a3]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3730a3]">
                BEFORE &amp; AFTER REBALANCE AUDIT
              </span>
              <h2 id="review-modal-title" className="text-base font-bold text-zinc-900 font-['Fraunces',serif]">
                Review Proposed Changes: {strategy.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {/* Section A: Event Constraints Delta */}
          <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 space-y-3">
            <h3 className="font-bold text-zinc-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#3730a3]" />
              A. Core Event Constraints Comparison
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Budget */}
              <div className="p-3 bg-white rounded-lg border border-zinc-200">
                <span className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1">
                  <IndianRupee className="w-3 h-3 text-[#3730a3]" /> Total Budget Cap
                </span>
                <div className="flex items-center gap-1.5 mt-1 font-mono">
                  <span className="text-zinc-500 line-through">{formatINR(currentC.maxBudget)}</span>
                  <ArrowRight className="w-3 h-3 text-zinc-400" />
                  <span className="font-bold text-zinc-900">{formatINR(proposedC.maxBudget)}</span>
                </div>
                {impact.budgetDelta !== 0 && (
                  <span className={`text-[10px] font-semibold ${impact.budgetDelta < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {impact.budgetDelta < 0 ? `Reduction of ${formatINR(Math.abs(impact.budgetDelta))}` : `Increase of ${formatINR(impact.budgetDelta)}`}
                  </span>
                )}
              </div>

              {/* Guest Count */}
              <div className="p-3 bg-white rounded-lg border border-zinc-200">
                <span className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1">
                  <Users className="w-3 h-3 text-[#3730a3]" /> Guest Count
                </span>
                <div className="flex items-center gap-1.5 mt-1 font-mono">
                  <span className="text-zinc-500 line-through">{currentC.totalGuests}</span>
                  <ArrowRight className="w-3 h-3 text-zinc-400" />
                  <span className="font-bold text-zinc-900">{proposedC.totalGuests} Guests</span>
                </div>
                {proposedC.totalGuests !== currentC.totalGuests && (
                  <span className="text-[10px] font-semibold text-indigo-700">
                    {proposedC.totalGuests > currentC.totalGuests ? `+${proposedC.totalGuests - currentC.totalGuests} guests` : `${proposedC.totalGuests - currentC.totalGuests} guests`}
                  </span>
                )}
              </div>

              {/* Event Date */}
              <div className="p-3 bg-white rounded-lg border border-zinc-200">
                <span className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#3730a3]" /> Celebration Date
                </span>
                <div className="flex items-center gap-1.5 mt-1 font-mono">
                  <span className="text-zinc-500 line-through">{currentC.eventDate}</span>
                  <ArrowRight className="w-3 h-3 text-zinc-400" />
                  <span className="font-bold text-zinc-900">{proposedC.eventDate}</span>
                </div>
                {impact.daysShift !== 0 && (
                  <span className="text-[10px] font-semibold text-amber-700">
                    {impact.daysShift < 0 ? `${Math.abs(impact.daysShift)} days earlier` : `${impact.daysShift} days later`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section B: Budget & Category Line Adjustments */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-zinc-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-[#3730a3]" />
                B. Departmental Budget Adjustments
              </h3>
              <span className="text-[11px] font-mono text-zinc-500">
                {strategy.categoryAdjustments.length} categories modified
              </span>
            </div>

            <div className="border border-zinc-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Current Allocated</th>
                    <th className="py-2.5 px-3">Proposed Allocated</th>
                    <th className="py-2.5 px-3">Change / Strategy Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {strategy.categoryAdjustments.map((adj, i) => {
                    const diff = adj.proposedAllocated - adj.originalAllocated;
                    return (
                      <tr key={i} className="hover:bg-zinc-50/50">
                        <td className="py-2.5 px-3 font-semibold text-zinc-900">
                          {adj.categoryName}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-zinc-600">
                          {formatINR(adj.originalAllocated)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-zinc-900">
                          {formatINR(adj.proposedAllocated)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`font-mono font-bold mr-1.5 ${diff < 0 ? 'text-emerald-700' : 'text-zinc-700'}`}>
                            {diff < 0 ? `-${formatINR(Math.abs(diff))}` : `+${formatINR(diff)}`}
                          </span>
                          <span className="text-zinc-500">{adj.actionNotes}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section C: Vendor and Quotation Preservation */}
          <div className="space-y-3">
            <h3 className="font-bold text-zinc-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#3730a3]" />
              C. Vendor Records &amp; Quotation Continuity
            </h3>

            <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-200/60 space-y-2">
              <div className="flex items-center gap-2 text-indigo-900 font-bold">
                <ShieldCheck className="w-4 h-4 text-[#3730a3]" />
                Contract &amp; Quotation Integrity Guaranteed
              </div>
              <p className="text-zinc-600 leading-relaxed text-[11px]">
                Original vendor quotations, sticker prices, source transcripts, and booking states are <strong>strictly preserved</strong>.
                Applying this replan updates your projected spend calculations without rewriting any vendor&apos;s contractual offer.
              </p>

              {strategy.vendorImplications && strategy.vendorImplications.length > 0 && (
                <div className="pt-2 border-t border-indigo-200/40 space-y-1">
                  <span className="text-[10px] font-bold text-[#3730a3] uppercase">Action Items with Vendors:</span>
                  <ul className="space-y-0.5">
                    {strategy.vendorImplications.map((imp, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-zinc-700">
                        <span className="text-[#3730a3] font-bold">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Section D: Timeline Adjustments */}
          <div className="space-y-3">
            <h3 className="font-bold text-zinc-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#3730a3]" />
              D. Timeline Deadlines &amp; Task Preservation
            </h3>

            {strategy.timelineAdjustments.length === 0 ? (
              <p className="text-zinc-500 italic p-3 bg-zinc-50 rounded-lg">
                No milestone tasks require schedule shifts. Completed tasks remain completed.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-900 font-semibold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Completed tasks ({plan.timelineTasks?.filter(t => t.status === 'completed').length || 0}) remain 100% completed with notes intact.
                </div>

                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
                      <tr>
                        <th className="py-2 px-3">Task Title</th>
                        <th className="py-2 px-3">Current Deadline</th>
                        <th className="py-2 px-3">Proposed Deadline</th>
                        <th className="py-2 px-3">Rationale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {strategy.timelineAdjustments.map((t, i) => (
                        <tr key={i} className="hover:bg-zinc-50/50">
                          <td className="py-2 px-3 font-semibold text-zinc-900">{t.title}</td>
                          <td className="py-2 px-3 font-mono text-zinc-500 line-through">{t.originalDueDate}</td>
                          <td className="py-2 px-3 font-mono font-bold text-indigo-900">{t.proposedDueDate}</td>
                          <td className="py-2 px-3 text-zinc-600">{t.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Section E: Priorities & Compromises Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
            <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/60 space-y-2">
              <h4 className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Protected Priorities
              </h4>
              <ul className="space-y-1">
                {strategy.protectedPriorities.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-zinc-700">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/60 space-y-2">
              <h4 className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Proposed Compromises
              </h4>
              <ul className="space-y-1">
                {strategy.proposedCompromises.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-zinc-700">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-100 rounded-xl transition-colors"
          >
            ← Back to Strategy Comparison
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onApply(strategy, request)}
              className="px-5 py-2 text-xs font-bold text-white bg-[#3730a3] hover:bg-[#2e2882] rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Confirm &amp; Apply Changes to Workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
