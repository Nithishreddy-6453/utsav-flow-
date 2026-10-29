/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useEvent } from '../context/EventContext';
import { hasSavedPlan } from '../utils/storage';
import { calculateDaysRemaining, formatDisplayDate } from '../utils/dateCalculations';

export const LandingPage: React.FC = () => {
  const { draft, plan, navigate, loadPreset, clearAll } = useEvent();
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const savedExists = hasSavedPlan();

  const handleStartNew = () => {
    navigate('/events/new/basic');
  };

  const handleUsePreset = (key: string) => {
    loadPreset(key);
    navigate('/events/new/basic');
  };

  const handleResumeWorkspace = () => {
    navigate('/workspace/overview');
  };

  const handleResetData = () => {
    clearAll();
    setShowClearConfirm(false);
  };

  const daysUntil = draft.eventDate ? calculateDaysRemaining(draft.eventDate) : 0;
  const totalBudget = plan.budgetSummary?.totalBudget || draft.maxBudget || 1000000;
  const projectedSpend = plan.budgetSummary?.projectedSpend || 0;
  const spendPercent = totalBudget > 0 ? Math.min(100, Math.round((projectedSpend / totalBudget) * 100)) : 0;

  return (
    <div className="bg-[#FAF8F5] text-zinc-900 antialiased min-h-full flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-indigo-100 selection:text-indigo-900">
      {/* TOP NAVIGATION BAR */}
      <header className="w-full bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b border-zinc-200 shadow-xs">
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-rose-600 to-[#3730a3]"></div>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-20 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-[#3730a3] text-white flex items-center justify-center shadow-md relative overflow-hidden ring-2 ring-indigo-200 shrink-0">
              <span className="material-symbols-outlined text-[26px]">celebration</span>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-['Fraunces',serif] text-2xl font-bold text-[#1f108e] tracking-tight leading-none">UtsavFlow</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="material-symbols-outlined text-[13px] text-amber-700">auto_awesome</span>
                  MVP
                </span>
              </div>
              <span className="text-xs text-zinc-600 font-medium leading-tight mt-1">Plan with clarity. Celebrate with confidence.</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            {savedExists && (
              <button 
                onClick={handleResumeWorkspace}
                className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md font-bold text-xs sm:text-sm active:scale-[0.98] transition-all cursor-pointer"
                type="button"
                aria-label="Resume active workspace"
              >
                <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                <span>Resume: {plan.eventName || draft.eventName || 'Saved Event'}</span>
              </button>
            )}
            <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0"></span>
              <span>Local Storage Vault</span>
            </div>
            <button 
              onClick={handleStartNew}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3730a3] hover:bg-[#312E81] text-white shadow-md font-semibold text-xs sm:text-sm active:scale-[0.98] transition-all cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-amber-400">add_circle</span>
              <span>New Event</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE CONTENT CONTAINER */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col gap-10">
        {/* HERO SECTION */}
        <section className="relative rounded-2xl border border-zinc-200 overflow-hidden shadow-sm bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
            <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center gap-6 z-10 bg-white">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200 w-fit">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="tracking-wide uppercase text-[11px] font-bold">Event Execution Workspace · Zero Login Required</span>
              </div>
              <h1 className="font-['Fraunces',serif] text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 tracking-tight leading-[1.15]">
                Make your event happen—<br/>
                <span className="italic text-[#3730a3] font-normal">not just plan it.</span>
              </h1>
              <p className="text-zinc-600 text-base sm:text-lg leading-relaxed max-w-xl">
                Keep your budget in <span className="font-semibold text-zinc-900">INR (₹)</span> balanced, track connected tasks in real time, and adjust plans easily when guest counts, dates, or vendor quotes change—without losing your progress.
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-3 sm:gap-4">
                <button 
                  onClick={handleStartNew}
                  className="inline-flex flex-col items-start px-6 py-3.5 rounded-xl bg-[#3730a3] hover:bg-[#312E81] text-white active:scale-[0.99] transition-all shadow-md shadow-indigo-900/20 cursor-pointer" 
                  type="button"
                >
                  <span className="flex items-center gap-2 text-sm sm:text-base font-bold">
                    <span className="material-symbols-outlined text-[20px] text-amber-400">add_circle</span>
                    Create an event
                  </span>
                  <span className="text-[11px] text-indigo-200 font-normal">Opens guided setup wizard · Step 1 of 4</span>
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 pt-3 border-t border-zinc-100">
                <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0">lock</span>
                <span>Zero telemetry on guest lists or financial amounts. Data remains safely on this browser.</span>
              </div>
            </div>
            
            <div className="lg:col-span-5 relative min-h-[260px] lg:min-h-full overflow-hidden border-t lg:border-t-0 lg:border-l border-zinc-200 bg-gradient-to-br from-indigo-50 via-amber-50/50 to-orange-50/30 flex items-center justify-center p-8">
              <div className="relative z-10 text-center p-6 bg-white/95 backdrop-blur-md rounded-2xl border border-zinc-200 shadow-xl max-w-sm">
                <div className="w-14 h-14 rounded-2xl bg-[#3730a3] text-white flex items-center justify-center mx-auto mb-4 shadow-md">
                  <span className="material-symbols-outlined text-[30px] text-amber-400">celebration</span>
                </div>
                <h3 className="font-semibold text-lg text-zinc-900">Festive Precision Architecture</h3>
                <p className="text-xs text-zinc-600 mt-2">Designed for weddings, birthdays, and multi-generational community celebrations across India.</p>
              </div>
            </div>
          </div>
        </section>

        {/* RETURNING USER SECTION */}
        <section className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Continue planning</h2>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white text-zinc-700 border border-zinc-200 shadow-2xs inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-amber-600">database</span>
                Saved in Local Storage (No Account Needed)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {savedExists ? (
              <>
                {/* Active Saved Event Card */}
                <div className="bg-white rounded-2xl border-2 border-indigo-200 p-6 shadow-sm hover:border-[#3730a3] hover:shadow-md transition-all flex flex-col justify-between gap-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-[#3730a3] shrink-0 border border-indigo-200">
                        <span className="material-symbols-outlined text-[24px]">celebration</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-zinc-900">{plan.eventName || draft.eventName || 'Grand Celebration'}</h3>
                          <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">Active (Saved)</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-600 mt-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-zinc-400">calendar_today</span> 
                            {formatDisplayDate(draft.eventDate)}
                          </span>
                          <span className="text-zinc-300">•</span>
                          <span className="font-mono text-[#3730a3] font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {daysUntil >= 0 ? `T-${daysUntil} days` : `${Math.abs(daysUntil)} days ago`}
                          </span>
                          <span className="text-zinc-300">•</span>
                          <span className="inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-zinc-400">group</span> 
                            {plan.guestSummary?.totalGuests || draft.totalGuests || 150} Guests
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-zinc-600">Financial Cap &amp; Projected Cost</span>
                      <span className="font-mono font-bold text-zinc-900 text-sm">
                        ₹{projectedSpend.toLocaleString('en-IN')} / ₹{totalBudget.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-zinc-200 overflow-hidden flex shadow-inner">
                      <div className="bg-[#3730a3] h-full transition-all duration-300" style={{ width: `${spendPercent}%` }}></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                    <button 
                      type="button" 
                      onClick={() => setShowClearConfirm(true)} 
                      className="text-xs text-zinc-500 hover:text-rose-600 font-medium underline underline-offset-2 cursor-pointer transition-colors"
                    >
                      Reset &amp; Start New
                    </button>
                    <button 
                      onClick={handleResumeWorkspace}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3730a3] text-white text-sm font-bold hover:bg-[#312E81] active:scale-[0.98] transition-all shadow-xs cursor-pointer" 
                      type="button"
                    >
                      <span>Resume Workspace</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                </div>

                {/* Sample Preset Card */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between gap-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 shrink-0 border border-amber-200">
                        <span className="material-symbols-outlined text-[24px]">cake</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-zinc-900">Aarav's 1st Birthday Carnival</h3>
                          <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">Sample Preset</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-600 mt-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-zinc-400">calendar_today</span> 28 Mar 2026</span>
                          <span className="text-zinc-300">•</span>
                          <span className="font-mono text-zinc-700 font-bold bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">Birthday</span>
                          <span className="text-zinc-300">•</span>
                          <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-zinc-400">group</span> 45 Guests</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-zinc-600">Sample Budget Envelope</span>
                      <span className="font-mono font-bold text-zinc-900 text-sm">₹65,000 Cap</span>
                    </div>
                    <p className="text-xs text-zinc-500">Playful kids celebration with live dessert stalls, magic shows, and pastel styling.</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                    <span className="text-xs text-zinc-500 font-mono">Template: Birthday · v1.1</span>
                    <button 
                      onClick={() => handleUsePreset('birthday')}
                      className="inline-flex items-center gap-2 px-4.5 py-2 rounded-xl border border-zinc-300 bg-white text-zinc-900 text-sm font-bold hover:bg-zinc-100 active:scale-[0.98] transition-all shadow-xs cursor-pointer" 
                      type="button"
                    >
                      <span>Load Template into Wizard</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Preset 1 Card */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between gap-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-[#3730a3] shrink-0 border border-indigo-200">
                        <span className="material-symbols-outlined text-[24px]">favorite</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-zinc-900">Sharma &amp; Verma Wedding</h3>
                          <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-50 text-[#3730a3] border border-indigo-200">Recommended Preset</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-600 mt-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-zinc-400">calendar_today</span> 14 Nov 2026</span>
                          <span className="text-zinc-300">•</span>
                          <span className="font-mono text-[#3730a3] font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Wedding</span>
                          <span className="text-zinc-300">•</span>
                          <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-zinc-400">group</span> 200 Guests</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-zinc-600">Preset Budget Envelope</span>
                      <span className="font-mono font-bold text-zinc-900 text-sm">₹8,00,000 Cap</span>
                    </div>
                    <p className="text-xs text-zinc-500">Multi-day traditional celebration with high focus on catering &amp; decor.</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                    <span className="text-xs text-zinc-500 font-mono">Template: Wedding · v1.4</span>
                    <button 
                      onClick={() => handleUsePreset('wedding')}
                      className="inline-flex items-center gap-2 px-4.5 py-2 rounded-xl bg-[#3730a3] text-white text-sm font-bold hover:bg-[#312E81] active:scale-[0.98] transition-all shadow-xs cursor-pointer" 
                      type="button"
                    >
                      <span>Start With This Preset</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                </div>

                {/* Preset 2 Card */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between gap-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 shrink-0 border border-amber-200">
                        <span className="material-symbols-outlined text-[24px]">cake</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-zinc-900">Aarav's 1st Birthday Carnival</h3>
                          <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">Popular Preset</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-600 mt-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-zinc-400">calendar_today</span> 28 Mar 2026</span>
                          <span className="text-zinc-300">•</span>
                          <span className="font-mono text-zinc-700 font-bold bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">Birthday</span>
                          <span className="text-zinc-300">•</span>
                          <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-zinc-400">group</span> 45 Guests</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-zinc-600">Preset Budget Envelope</span>
                      <span className="font-mono font-bold text-zinc-900 text-sm">₹65,000 Cap</span>
                    </div>
                    <p className="text-xs text-zinc-500">Playful celebration with kid-friendly activities, magic show, and dessert stalls.</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                    <span className="text-xs text-zinc-500 font-mono">Template: Birthday · v1.1</span>
                    <button 
                      onClick={() => handleUsePreset('birthday')}
                      className="inline-flex items-center gap-2 px-4.5 py-2 rounded-xl border border-zinc-300 bg-white text-zinc-900 text-sm font-bold hover:bg-zinc-100 active:scale-[0.98] transition-all shadow-xs cursor-pointer" 
                      type="button"
                    >
                      <span>Start With This Preset</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* START WITH AN EXAMPLE PRESET */}
        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Start with an example preset</h2>
            <p className="text-xs sm:text-sm text-zinc-600">
              Prefills the setup wizard with sample constraints; you review inputs before generating calculations:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Preset 1 */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm flex flex-col justify-between gap-6 hover:border-[#3730a3] transition-all group">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">diversity_1</span>
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">Comprehensive</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 group-hover:text-[#3730a3] transition-colors">Grand Indian Wedding</h3>
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed">Multi-event ceremony with critical high-scale banquet logistics.</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs"><span className="text-zinc-600 font-medium">Budget Cap:</span><span className="font-mono font-bold text-zinc-900 text-sm">₹8,00,000</span></div>
                  <div className="flex items-center justify-between text-xs"><span className="text-zinc-600 font-medium">Guest Mix:</span><span className="font-mono text-zinc-800 font-medium">200 (140A · 30K · 30S)</span></div>
                </div>
              </div>
              <button 
                onClick={() => handleUsePreset('wedding')}
                className="w-full py-3 px-4 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#3730a3] text-[#3730a3] hover:bg-[#3730a3] hover:text-white transition-all text-sm font-bold active:scale-[0.98] cursor-pointer" 
                type="button"
              >
                Use Wedding Preset
                <span className="material-symbols-outlined text-[16px]">east</span>
              </button>
            </div>

            {/* Preset 2 */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm flex flex-col justify-between gap-6 hover:border-[#3730a3] transition-all group">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">dinner_dining</span>
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">Intimate</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 group-hover:text-[#3730a3] transition-colors">Milestone 50th Birthday Dinner</h3>
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed">Seated private dining experience with acoustic musical ensemble.</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs"><span className="text-zinc-600 font-medium">Budget Cap:</span><span className="font-mono font-bold text-zinc-900 text-sm">₹50,000</span></div>
                  <div className="flex items-center justify-between text-xs"><span className="text-zinc-600 font-medium">Guest Count:</span><span className="font-mono text-zinc-800 font-medium">35 Guests</span></div>
                </div>
              </div>
              <button 
                onClick={() => handleUsePreset('birthday')}
                className="w-full py-3 px-4 inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 text-zinc-900 hover:bg-zinc-50 transition-all text-sm font-bold active:scale-[0.98] cursor-pointer" 
                type="button"
              >
                Use Birthday Preset
                <span className="material-symbols-outlined text-[16px]">east</span>
              </button>
            </div>

            {/* Preset 3 */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm flex flex-col justify-between gap-6 hover:border-[#3730a3] transition-all group">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">groups</span>
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">Community</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 group-hover:text-[#3730a3] transition-colors">Community Cultural Utsav</h3>
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed">Multi-family collective gathering with distributed volunteer stages.</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs"><span className="text-zinc-600 font-medium">Budget Cap:</span><span className="font-mono font-bold text-zinc-900 text-sm">₹1,50,000</span></div>
                  <div className="flex items-center justify-between text-xs"><span className="text-zinc-600 font-medium">Guest Count:</span><span className="font-mono text-zinc-800 font-medium">150 Guests</span></div>
                </div>
              </div>
              <button 
                onClick={() => handleUsePreset('community')}
                className="w-full py-3 px-4 inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 text-zinc-900 hover:bg-zinc-50 transition-all text-sm font-bold active:scale-[0.98] cursor-pointer" 
                type="button"
              >
                Use Community Preset
                <span className="material-symbols-outlined text-[16px]">east</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-zinc-200 bg-white py-6 mt-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1f108e]">UtsavFlow</span>
            <span>— Festive Editorial Precision Framework.</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Offline Architecture</span>
            <span onClick={() => navigate('/workspace/budget')} className="cursor-pointer hover:text-zinc-900 font-medium">Ledger</span>
          </div>
        </div>
      </footer>

      {/* CLEAR DATA CONFIRMATION MODAL */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-zinc-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <span className="material-symbols-outlined text-[20px]">warning</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-zinc-900">Reset Local Storage Data?</h3>
                <p className="text-xs text-zinc-500">This will permanently clear your saved event plan and draft from browser storage.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetData}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors"
              >
                Yes, Reset &amp; Start Fresh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
