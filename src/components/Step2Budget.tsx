/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useEvent } from '../context/EventContext';
import { WizardShell } from './WizardShell';
import { BudgetFlexibility } from '../types';

export const Step2Budget: React.FC = () => {
  const { draft, updateDraft, navigate } = useEvent();

  const [maxBudget, setMaxBudget] = useState<number>(draft.maxBudget || 800000);
  const [budgetFlexibility, setBudgetFlexibility] = useState<BudgetFlexibility>(draft.budgetFlexibility || 'strict');
  const [totalGuests, setTotalGuests] = useState<number>(draft.totalGuests || 200);
  const [adults, setAdults] = useState<number>(draft.adultGuests || 140);
  const [children, setChildren] = useState<number>(draft.childGuests || 30);
  const [seniors, setSeniors] = useState<number>(draft.seniorGuests || 30);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const cohortSum = adults + children + seniors;
  const matchesTotal = cohortSum === totalGuests;

  const handleChipClick = (amount: number) => {
    setMaxBudget(amount);
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maxBudget || maxBudget <= 0) {
      setErrorMsg('Please enter a valid positive budget amount.');
      return;
    }
    if (!totalGuests || totalGuests <= 0) {
      setErrorMsg('Please enter a valid guest count.');
      return;
    }
    setErrorMsg('');
    updateDraft({
      maxBudget,
      budgetFlexibility,
      totalGuests,
      adultGuests: adults,
      childGuests: children,
      seniorGuests: seniors
    });
    navigate('/events/new/preferences');
  };

  return (
    <WizardShell currentStep={2}>
      <div className="mb-6">
        <h1 className="font-['Fraunces',serif] text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
          Let's set your budget &amp; guest count
        </h1>
        <p className="mt-1 text-zinc-600 text-sm sm:text-base max-w-2xl font-medium">
          We'll use these details to create a realistic plan that fits your celebration. Every rupee and seat can be fine-tuned later with audited transparency.
        </p>
      </div>

      {/* Summary Context Card */}
      <div className="mb-8 bg-white/60 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl p-4 sm:p-5 bg-indigo-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-[#3730a3] shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[22px]">celebration</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-bold text-zinc-900">{draft.eventName}</span>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-white text-zinc-800 border border-zinc-200 capitalize shadow-2xs">
                {draft.occasionType}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-zinc-700 font-semibold">
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">calendar_month</span> {draft.eventDate}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">location_on</span> {draft.eventLocation}
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => navigate('/events/new/basic')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 text-xs font-bold cursor-pointer transition-all shadow-2xs"
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">edit</span>
          <span>Edit Step 1</span>
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50/90 backdrop-blur-md border border-rose-200 text-rose-900 text-sm font-bold flex items-center gap-3 shadow-sm">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleContinue} className="space-y-6">
        {/* Section 01: Total Budget (Amber Tint) */}
        <section className="bg-white/60 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl p-5 sm:p-7 bg-amber-50/20 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-200 gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
                <span className="text-[#3730a3] font-mono">01.</span> What's your total budget?
              </h2>
              <p className="text-zinc-600 text-xs sm:text-sm mt-0.5 font-semibold">Enter your ceiling target. You can simulate variations and stress shocks anytime.</p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-white border border-zinc-200 text-zinc-800 text-xs font-mono font-bold shadow-2xs">
              ₹ Indian Rupee (INR)
            </span>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-900 mb-2" htmlFor="budget-input">
                Total Budget Amount (₹)
              </label>
              <div className="relative rounded-xl shadow-sm max-w-md">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-xl font-bold text-zinc-900">₹</span>
                </div>
                <input 
                  id="budget-input"
                  type="number"
                  min="10000"
                  step="10000"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(Number(e.target.value))}
                  className="block w-full pl-10 pr-16 py-3.5 text-xl font-bold text-zinc-900 bg-white/90 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3730a3] shadow-2xs"
                  placeholder="800000"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                  <span className="text-xs font-bold text-zinc-700 bg-white px-2 py-0.5 rounded border border-zinc-200">INR</span>
                </div>
              </div>
            </div>

            {/* Quick Chips */}
            <div>
              <span className="block text-xs font-bold text-zinc-700 mb-2.5">Quick selections:</span>
              <div className="flex flex-wrap items-center gap-2.5">
                {[500000, 800000, 1200000, 1500000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleChipClick(amt)}
                    className={`px-4 py-2 rounded-xl border text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer shadow-2xs ${maxBudget === amt ? 'border-2 border-[#3730a3] bg-indigo-50 text-[#3730a3]' : 'border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50'}`}
                  >
                    ₹ {amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget Governance Mode */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-900 mb-2.5">
                Select Budget Governance Mode
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${budgetFlexibility === 'strict' ? 'border-[#3730a3] bg-indigo-50/60 shadow-xs' : 'border-zinc-200 bg-white/90 hover:border-zinc-300'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-[#3730a3]">lock_clock</span> Strict budget
                    </span>
                    <input 
                      type="radio" 
                      name="budget_mode" 
                      checked={budgetFlexibility === 'strict'} 
                      onChange={() => setBudgetFlexibility('strict')}
                      className="text-[#3730a3] w-4 h-4"
                    />
                  </div>
                  <p className="text-xs text-zinc-600 font-medium">Stay strictly within the entered amount. No overruns allowed without explicit trade-offs.</p>
                </label>

                <label className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${budgetFlexibility === 'flexible' ? 'border-[#3730a3] bg-indigo-50/60 shadow-xs' : 'border-zinc-200 bg-white/90 hover:border-zinc-300'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-zinc-600">tune</span> Some flexibility
                    </span>
                    <input 
                      type="radio" 
                      name="budget_mode" 
                      checked={budgetFlexibility === 'flexible'} 
                      onChange={() => setBudgetFlexibility('flexible')}
                      className="text-[#3730a3] w-4 h-4"
                    />
                  </div>
                  <p className="text-xs text-zinc-600 font-medium">Allow optional upgrades and a 10–15% contingency buffer for premium experiences.</p>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Section 02: Guest Count & Cohorts (Emerald Tint) */}
        <section className="bg-white/60 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl p-5 sm:p-7 bg-emerald-50/20 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-200 gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
                <span className="text-[#3730a3] font-mono">02.</span> How many guests are you expecting?
              </h2>
              <p className="text-zinc-600 text-xs sm:text-sm mt-0.5 font-semibold">Catering and venue capacities scale directly with attendee sizing.</p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-white border border-zinc-200 text-zinc-800 text-xs font-bold shadow-2xs">
              Attendee Roster
            </span>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-900 mb-2" htmlFor="total-guests">
                Total Guest Count
              </label>
              <div className="flex items-center gap-3 max-w-xs">
                <input 
                  id="total-guests"
                  type="number"
                  min="1"
                  value={totalGuests}
                  onChange={(e) => setTotalGuests(Number(e.target.value))}
                  className="block w-full px-4 py-3 font-bold text-zinc-900 bg-white/90 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3730a3] shadow-2xs"
                />
                <span className="text-sm font-bold text-zinc-700 whitespace-nowrap">Guests</span>
              </div>
            </div>

            {/* Cohort Breakdown */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs sm:text-sm font-bold text-zinc-900">Guest Cohort Breakdown (Optional)</label>
                <span className="text-xs font-semibold text-zinc-500">Assists per-plate &amp; accessibility logic</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-xl border border-zinc-200 bg-white/80 shadow-2xs flex flex-col justify-between">
                  <span className="text-xs font-bold text-zinc-900">Adults (Ages 18–64)</span>
                  <input 
                    type="number" 
                    min="0"
                    value={adults}
                    onChange={(e) => setAdults(Number(e.target.value))}
                    className="my-2.5 px-3 py-2 text-center font-bold text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-xl"
                  />
                  <span className="text-xs font-semibold text-zinc-600">Full plate</span>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 bg-white/80 shadow-2xs flex flex-col justify-between">
                  <span className="text-xs font-bold text-zinc-900">Children (Under 18)</span>
                  <input 
                    type="number" 
                    min="0"
                    value={children}
                    onChange={(e) => setChildren(Number(e.target.value))}
                    className="my-2.5 px-3 py-2 text-center font-bold text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-xl"
                  />
                  <span className="text-xs font-semibold text-zinc-600">Special menu</span>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 bg-white/80 shadow-2xs flex flex-col justify-between">
                  <span className="text-xs font-bold text-zinc-900">Seniors (Ages 65+)</span>
                  <input 
                    type="number" 
                    min="0"
                    value={seniors}
                    onChange={(e) => setSeniors(Number(e.target.value))}
                    className="my-2.5 px-3 py-2 text-center font-bold text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-xl"
                  />
                  <span className="text-xs font-semibold text-zinc-600">Comfort &amp; mobility</span>
                </div>
              </div>
            </div>

            {/* Validation Feedback Box */}
            <div className={`p-4 rounded-xl border flex items-center justify-between flex-wrap gap-2 shadow-xs ${matchesTotal ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-amber-50 border-amber-300 text-amber-900'}`}>
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px]">
                  {matchesTotal ? 'check_circle' : 'warning'}
                </span>
                <span className="text-xs sm:text-sm font-bold">
                  {adults} Adults + {children} Children + {seniors} Seniors = {cohortSum} Guests
                </span>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${matchesTotal ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
                {matchesTotal ? 'Matches Total' : `Sum is ${cohortSum} (Total is ${totalGuests})`}
              </span>
            </div>
          </div>
        </section>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-4">
          <button 
            type="button" 
            onClick={() => navigate('/events/new/basic')}
            className="px-5 py-3 rounded-xl border border-zinc-300 bg-white text-zinc-900 text-sm font-bold cursor-pointer hover:bg-zinc-100 transition-all shadow-xs"
          >
            Back
          </button>
          <button 
            type="submit"
            className="px-8 py-3.5 rounded-xl bg-[#3730a3] text-white font-bold text-sm shadow-md hover:bg-[#312E81] flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <span>Continue to Priorities</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </form>
    </WizardShell>
  );
};
