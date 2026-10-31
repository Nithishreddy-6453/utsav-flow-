/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EventPlan,
  TradeOffStrategy,
  ConstraintChangeRequest,
  DeterministicImpact
} from '../types/plan';
import { formatINR } from '../utils/calculations';
import { BeforeAfterReviewModal } from './BeforeAfterReviewModal';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Layers,
  Calendar,
  X,
  FileCheck
} from 'lucide-react';

interface ReplanComparisonViewProps {
  isOpen: boolean;
  strategies: TradeOffStrategy[];
  request: ConstraintChangeRequest;
  impact: DeterministicImpact;
  plan: EventPlan;
  onApplyStrategy: (strategy: TradeOffStrategy, request: ConstraintChangeRequest) => void;
  onBackToEdit: () => void;
  onClose: () => void;
}

export const ReplanComparisonView: React.FC<ReplanComparisonViewProps> = ({
  isOpen,
  strategies,
  request,
  impact,
  plan,
  onApplyStrategy,
  onBackToEdit,
  onClose
}) => {
  const [selectedStrategyForReview, setSelectedStrategyForReview] = useState<TradeOffStrategy | null>(null);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm overflow-y-auto">
        <div 
          className="bg-white rounded-2xl shadow-2xl border border-zinc-200 max-w-5xl w-full overflow-hidden my-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="comparison-title"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[#3730a3]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3730a3]">
                  CONSTRAINT-AWARE REPLANNING ENGINE
                </span>
                <h2 id="comparison-title" className="text-base sm:text-lg font-bold text-zinc-900 font-['Fraunces',serif]">
                  Compare 3 Trade-Off Strategies
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onBackToEdit}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-xl transition-colors"
              >
                Edit Constraints
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scenario Context Banner */}
          <div className="px-6 py-3 bg-indigo-50/60 border-b border-indigo-100/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4 text-zinc-700">
              <span>
                <strong>Target Budget:</strong> <span className="font-mono font-bold text-zinc-900">{formatINR(impact.proposedBudgetLimit)}</span>
              </span>
              <span>
                <strong>Guests:</strong> <span className="font-mono font-bold text-zinc-900">{request.proposedConstraints.totalGuests}</span>
              </span>
              <span>
                <strong>Date:</strong> <span className="font-mono font-bold text-zinc-900">{request.proposedConstraints.eventDate}</span>
                {impact.daysShift !== 0 && (
                  <span className="ml-1 text-[11px] text-amber-800 font-medium">
                    ({impact.daysShift < 0 ? `${Math.abs(impact.daysShift)}d earlier` : `+${impact.daysShift}d`})
                  </span>
                )}
              </span>
            </div>

            <div className="text-[11px] text-zinc-600 font-medium">
              Baseline Projected Spend before adjustment: <span className="font-mono font-bold text-rose-700">{formatINR(impact.proposedProjectedCost)}</span>
            </div>
          </div>

          {/* 3 Strategy Cards */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5 max-h-[70vh] overflow-y-auto">
            {strategies.map((strat, idx) => {
              const isOverBudget = !strat.satisfiesBudget;
              const isRecommended = idx === 0;

              return (
                <div
                  key={strat.id}
                  className={`bg-white rounded-2xl border ${
                    isRecommended
                      ? 'border-[#3730a3] ring-2 ring-[#3730a3]/10 shadow-md'
                      : 'border-zinc-200 shadow-sm'
                  } flex flex-col justify-between overflow-hidden transition-all`}
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-zinc-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3730a3]">
                        {strat.strategyType.replace('_', ' ')}
                      </span>
                      {isRecommended && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-[#3730a3] border border-indigo-200">
                          Recommended
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-zinc-900 font-['Fraunces',serif]">
                      {strat.title}
                    </h3>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      {strat.summary}
                    </p>

                    {/* Financial KPI Glance */}
                    <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Projected Spend:</span>
                        <span className="font-mono font-bold text-zinc-900 text-sm">
                          {formatINR(strat.proposedProjectedCost)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-500 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3 text-emerald-600" /> Net Savings:
                        </span>
                        <span className="font-mono font-bold text-emerald-700">
                          {formatINR(strat.netSavings)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-zinc-200/60 text-[11px]">
                        <span className="text-zinc-500">Budget Status:</span>
                        {isOverBudget ? (
                          <span className="font-mono font-bold text-rose-700">
                            Deficit {formatINR(Math.abs(strat.projectedDeficitOrSurplus))}
                          </span>
                        ) : (
                          <span className="font-mono font-bold text-emerald-700">
                            Surplus {formatINR(strat.projectedDeficitOrSurplus)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4 flex-1 text-xs">
                    {/* Protected Priorities */}
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1 mb-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Protected Priorities
                      </span>
                      <ul className="space-y-1 text-zinc-700">
                        {strat.protectedPriorities.slice(0, 3).map((p, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Proposed Compromises */}
                    <div>
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1 mb-1.5">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Key Compromises
                      </span>
                      <ul className="space-y-1 text-zinc-700">
                        {strat.proposedCompromises.slice(0, 3).map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-amber-600 font-bold">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Operational Impacts count */}
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-[#3730a3]" />
                        {strat.categoryAdjustments.length} Category Adjustments
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#3730a3]" />
                        {strat.timelineAdjustments.length} Task Deadlines
                      </span>
                    </div>
                  </div>

                  {/* Card Action */}
                  <div className="p-4 border-t border-zinc-100 bg-zinc-50/70">
                    <button
                      type="button"
                      onClick={() => setSelectedStrategyForReview(strat)}
                      className={`w-full py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                        isRecommended
                          ? 'bg-[#3730a3] hover:bg-[#2e2882] text-white shadow-sm'
                          : 'bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300'
                      }`}
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      Review &amp; Apply Changes
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500">
            <span>
              All 3 strategies preserve completed tasks, original vendor quotations, and booking statuses.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-900"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>

      {/* Before / After Detail Modal */}
      {selectedStrategyForReview && (
        <BeforeAfterReviewModal
          isOpen={Boolean(selectedStrategyForReview)}
          strategy={selectedStrategyForReview}
          request={request}
          impact={impact}
          plan={plan}
          onApply={(strat, req) => {
            setSelectedStrategyForReview(null);
            onApplyStrategy(strat, req);
          }}
          onBack={() => setSelectedStrategyForReview(null)}
          onClose={onClose}
        />
      )}
    </>
  );
};
