/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  EventPlan,
  ConstraintChangeRequest,
  ConstraintTriggerSource,
  TradeOffStrategy,
  DeterministicImpact
} from '../types/plan';
import { EventDraft } from '../types';
import { formatINR } from '../utils/calculations';
import {
  calculateDeterministicImpact,
  generateDeterministicAlternatives
} from '../utils/replanningEngine';
import { ReplanComparisonView } from './ReplanComparisonView';
import {
  X,
  Sparkles,
  Zap,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Users,
  IndianRupee,
  RefreshCw
} from 'lucide-react';

interface ReplanModalProps {
  isOpen: boolean;
  plan: EventPlan;
  draft: EventDraft;
  onApplyStrategy: (strategy: TradeOffStrategy, request: ConstraintChangeRequest) => void;
  onUndoLastReplan?: () => void;
  onClose: () => void;
  initialTrigger?: ConstraintTriggerSource;
}

export const ReplanModal: React.FC<ReplanModalProps> = ({
  isOpen,
  plan,
  draft,
  onApplyStrategy,
  onUndoLastReplan,
  onClose,
  initialTrigger = 'custom'
}) => {
  // Form input state
  const [budgetInput, setBudgetInput] = useState<string>('');
  const [guestsInput, setGuestsInput] = useState<string>('');
  const [dateInput, setDateInput] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [triggerSource, setTriggerSource] = useState<ConstraintTriggerSource>(initialTrigger);

  // Comparison view state
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState<boolean>(false);
  const [generatedStrategies, setGeneratedStrategies] = useState<TradeOffStrategy[]>([]);
  const [currentRequest, setCurrentRequest] = useState<ConstraintChangeRequest | null>(null);
  const [currentImpact, setCurrentImpact] = useState<DeterministicImpact | null>(null);
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);

  // Initialize from current plan and draft
  useEffect(() => {
    if (isOpen) {
      const currentBudget = plan.budgetSummary?.totalBudget || draft.maxBudget || 1000000;
      const currentGuests = plan.guestSummary?.totalGuests || draft.totalGuests || 150;
      const currentDate = draft.eventDate || '2026-11-20';

      setBudgetInput(String(currentBudget));
      setGuestsInput(String(currentGuests));
      setDateInput(currentDate);
      setInstructions('');
      setTriggerSource(initialTrigger);
      setIsComparing(false);
      setIsLoadingAlternatives(false);
      setGeneratedStrategies([]);
      setCurrentRequest(null);
      setCurrentImpact(null);
      setApiErrorMessage(null);
    }
  }, [isOpen, plan, draft, initialTrigger]);

  if (!isOpen) return null;

  const currentBudget = plan.budgetSummary?.totalBudget || draft.maxBudget || 1000000;
  const currentGuests = plan.guestSummary?.totalGuests || draft.totalGuests || 150;
  const currentDate = draft.eventDate || '2026-11-20';

  const proposedBudget = Math.max(10000, Number(budgetInput) || currentBudget);
  const proposedGuests = Math.max(1, Number(guestsInput) || currentGuests);
  const proposedDate = dateInput || currentDate;

  // Real-time live deterministic impact preview
  const liveRequest: ConstraintChangeRequest = {
    changeId: `change_preview_${Date.now()}`,
    basePlanVersion: plan.id,
    currentConstraints: {
      maxBudget: currentBudget,
      totalGuests: currentGuests,
      eventDate: currentDate,
      priorities: draft.priorities
    },
    proposedConstraints: {
      maxBudget: proposedBudget,
      totalGuests: proposedGuests,
      eventDate: proposedDate,
      priorities: draft.priorities
    },
    userInstructions: instructions,
    triggerSource,
    createdAt: new Date().toISOString()
  };

  const liveImpact = calculateDeterministicImpact(plan, liveRequest);

  // Preset Handlers (Never mutate saved state directly)
  const applyPresetCostOverrun20 = () => {
    setTriggerSource('cost_overrun');
    setInstructions('Simulate 20% cost surge across vendor materials and peak season rates.');
    // Keep budget same or lower by 10% to test overspend
    setBudgetInput(String(Math.round(currentBudget * 0.9)));
  };

  const applyPresetGuestSurge25 = () => {
    setTriggerSource('guest_surge');
    const surge = Math.round(currentGuests * 1.25);
    setGuestsInput(String(surge));
    setInstructions(`Guest count surge from ${currentGuests} to ${surge}. Protect main food quality and ensure seating capacity.`);
  };

  const applyPresetAdd50Guests = () => {
    setTriggerSource('guest_surge');
    setGuestsInput(String(currentGuests + 50));
    setInstructions(`Headcount increased by +50 guests. Check plate rates and venue room.`);
  };

  const applyPresetBudgetCut50k = () => {
    setTriggerSource('budget_cut');
    setBudgetInput(String(Math.max(50000, currentBudget - 50000)));
    setInstructions('Budget cut by ₹50,000. Absorb in decor, sound, and stationery while preserving catering.');
  };

  const applyPresetDateShiftEarlier = () => {
    setTriggerSource('date_shift');
    try {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 14);
      setDateInput(d.toISOString().split('T')[0]);
      setInstructions('Event moved two weeks earlier due to family convenience. Fast-track vendor contracts.');
    } catch {
      setDateInput(currentDate);
    }
  };

  const applyPresetVendorInflation = () => {
    setTriggerSource('vendor_quote_change');
    setInstructions('Catering quotation has risen significantly. Optimize live food stations and menu items to balance.');
  };

  // Submit to generate 3 trade-off strategies
  const handleGenerateAlternatives = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingAlternatives(true);
    setApiErrorMessage(null);

    const request: ConstraintChangeRequest = {
      changeId: `req_${Date.now()}`,
      basePlanVersion: plan.id,
      currentConstraints: {
        maxBudget: currentBudget,
        totalGuests: currentGuests,
        eventDate: currentDate,
        priorities: draft.priorities,
        mustHaves: draft.mustHaves
      },
      proposedConstraints: {
        maxBudget: proposedBudget,
        totalGuests: proposedGuests,
        eventDate: proposedDate,
        priorities: draft.priorities,
        mustHaves: draft.mustHaves
      },
      userInstructions: instructions.trim(),
      triggerSource,
      createdAt: new Date().toISOString()
    };

    const impact = calculateDeterministicImpact(plan, request);
    setCurrentRequest(request);
    setCurrentImpact(impact);

    try {
      const response = await fetch('/api/plan/rebalance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request,
          budgetSummary: plan.budgetSummary,
          budgetItems: plan.budgetItems,
          timelineTasks: plan.timelineTasks,
          deterministicImpact: impact
        })
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.strategies) && data.strategies.length === 3) {
        setGeneratedStrategies(data.strategies);
        setIsComparing(true);
      } else {
        // Fallback deterministic strategies
        const fallback = generateDeterministicAlternatives(plan, request, impact);
        setGeneratedStrategies(fallback);
        setIsComparing(true);
      }
    } catch (err) {
      console.warn('API trade-off request failed, using deterministic alternatives engine:', err);
      const fallback = generateDeterministicAlternatives(plan, request, impact);
      setGeneratedStrategies(fallback);
      setIsComparing(true);
    } finally {
      setIsLoadingAlternatives(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm overflow-y-auto">
        <div 
          className="bg-white rounded-2xl shadow-2xl border border-zinc-200 max-w-2xl w-full overflow-hidden my-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="replan-modal-title"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[#3730a3]">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3730a3]">
                  STATEFUL REPLANNING &amp; SHOCK SIMULATOR
                </span>
                <h2 id="replan-modal-title" className="text-base sm:text-lg font-bold text-zinc-900 font-['Fraunces',serif]">
                  Revise Event Constraints
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

          {/* Quick Scenario Shock Presets */}
          <div className="p-4 bg-gradient-to-r from-amber-50/70 to-indigo-50/70 border-b border-zinc-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                Quick Budget Shock &amp; Scenario Presets:
              </span>
              <span className="text-[10px] text-zinc-500 font-medium">Click to populate form fields</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={applyPresetBudgetCut50k}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-zinc-200 hover:border-[#3730a3] text-zinc-700 transition-all shadow-xs"
              >
                📉 Budget Cut (-₹50k)
              </button>
              <button
                type="button"
                onClick={applyPresetGuestSurge25}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-zinc-200 hover:border-[#3730a3] text-zinc-700 transition-all shadow-xs"
              >
                👥 Guest Surge (+25%)
              </button>
              <button
                type="button"
                onClick={applyPresetAdd50Guests}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-zinc-200 hover:border-[#3730a3] text-zinc-700 transition-all shadow-xs"
              >
                ➕ Add +50 Guests
              </button>
              <button
                type="button"
                onClick={applyPresetDateShiftEarlier}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-zinc-200 hover:border-[#3730a3] text-zinc-700 transition-all shadow-xs"
              >
                ⏳ Date Shift (-14 Days)
              </button>
              <button
                type="button"
                onClick={applyPresetCostOverrun20}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-zinc-200 hover:border-[#3730a3] text-zinc-700 transition-all shadow-xs"
              >
                ⚠️ Cost Overrun (+20%)
              </button>
              <button
                type="button"
                onClick={applyPresetVendorInflation}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-zinc-200 hover:border-[#3730a3] text-zinc-700 transition-all shadow-xs"
              >
                🍽 Catering Inflation
              </button>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleGenerateAlternatives} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Budget & Guests Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5 text-[#3730a3]" />
                    Total Budget Cap (₹)
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">Current: {formatINR(currentBudget)}</span>
                </label>
                <input
                  type="number"
                  min="10000"
                  step="1000"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#3730a3]" />
                    Expected Guest Count
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">Current: {currentGuests}</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={guestsInput}
                  onChange={(e) => setGuestsInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3]"
                  required
                />
              </div>
            </div>

            {/* Event Date & Trigger Source */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#3730a3]" />
                    Target Event Date
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">Current: {currentDate}</span>
                </label>
                <input
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Constraint Trigger Factor
                </label>
                <select
                  value={triggerSource}
                  onChange={(e) => setTriggerSource(e.target.value as ConstraintTriggerSource)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] bg-white font-medium"
                >
                  <option value="custom">Custom Constraint Change</option>
                  <option value="budget_cut">Budget Reduction / Fund Reallocation</option>
                  <option value="guest_surge">Guest Headcount Surge</option>
                  <option value="date_shift">Celebration Date Rescheduling</option>
                  <option value="cost_overrun">Vendor Price Overrun</option>
                  <option value="vendor_quote_change">New Quotation Input</option>
                </select>
              </div>
            </div>

            {/* Natural Language Strategic Guidance */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Strategic Guidance &amp; Trade-Off Rules (Optional)
              </label>
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Keep food quality and elderly guest comfort intact; absorb cuts in floral decoration and sound equipment."
                className="w-full p-2.5 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3]"
              />
            </div>

            {/* Live Deterministic Impact Preview Banner */}
            <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-zinc-500 font-bold uppercase text-[10px]">
                <span>Deterministic Financial Simulation</span>
                <span>Rule-based arithmetic</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-[11px] text-zinc-500">Proposed Budget:</span>
                  <div className="font-mono font-bold text-zinc-900">{formatINR(liveImpact.proposedBudgetLimit)}</div>
                </div>

                <div>
                  <span className="text-[11px] text-zinc-500">Recalculated Projected:</span>
                  <div className="font-mono font-bold text-zinc-900">{formatINR(liveImpact.proposedProjectedCost)}</div>
                </div>

                <div>
                  <span className="text-[11px] text-zinc-500">Projected Balance:</span>
                  <div className={`font-mono font-bold ${liveImpact.proposedDeficitOrSurplus < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {liveImpact.proposedDeficitOrSurplus < 0 ? `Deficit ${formatINR(Math.abs(liveImpact.proposedDeficitOrSurplus))}` : `Surplus ${formatINR(liveImpact.proposedDeficitOrSurplus)}`}
                  </div>
                </div>
              </div>

              {(liveImpact.daysShift !== 0 || liveImpact.affectedTaskCount > 0) && (
                <div className="pt-2 border-t border-zinc-200/60 text-[11px] text-zinc-600 flex items-center justify-between">
                  <span>Planning window: <strong>{liveImpact.proposedDaysRemaining} days</strong> ({liveImpact.daysShift < 0 ? `${Math.abs(liveImpact.daysShift)}d shorter` : `+${liveImpact.daysShift}d`})</span>
                  <span><strong>{liveImpact.affectedTaskCount} tasks</strong> deadline-shifted</span>
                </div>
              )}
            </div>

            {apiErrorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {apiErrorMessage}
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
              {plan.replanHistory && plan.replanHistory.length > 0 && onUndoLastReplan ? (
                <button
                  type="button"
                  onClick={onUndoLastReplan}
                  className="text-xs font-semibold text-rose-700 hover:text-rose-900 flex items-center gap-1 hover:underline"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Undo Last Replan ({plan.replanHistory[0].strategyTitle})
                </button>
              ) : (
                <span className="text-[11px] text-zinc-400">Editing form will not alter saved plan</span>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoadingAlternatives}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#3730a3] hover:bg-[#2e2882] rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  {isLoadingAlternatives ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Generating 3 Strategies...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Generate 3 Trade-Off Strategies
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Comparison View of the 3 strategies */}
      {isComparing && currentRequest && currentImpact && (
        <ReplanComparisonView
          isOpen={isComparing}
          strategies={generatedStrategies}
          request={currentRequest}
          impact={currentImpact}
          plan={plan}
          onApplyStrategy={(strat, req) => {
            setIsComparing(false);
            onApplyStrategy(strat, req);
            onClose();
          }}
          onBackToEdit={() => setIsComparing(false)}
          onClose={onClose}
        />
      )}
    </>
  );
};
