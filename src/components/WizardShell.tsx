/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useEvent } from '../context/EventContext';

interface WizardShellProps {
  currentStep: number; // 1, 2, 3, or 4
  children: React.ReactNode;
}

export const WizardShell: React.FC<WizardShellProps> = ({ currentStep, children }) => {
  const { draft, navigate } = useEvent();
  const [savedToast, setSavedToast] = React.useState<boolean>(false);

  const handleSaveAndExit = () => {
    setSavedToast(true);
    setTimeout(() => {
      navigate('/');
    }, 700);
  };

  const percentage = currentStep * 25;

  return (
    <div className="bg-[#FAF8F5] text-zinc-900 antialiased min-h-screen flex flex-col selection:bg-indigo-100 selection:text-indigo-900 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification */}
      {savedToast && (
        <div className="fixed top-6 right-6 z-50 bg-zinc-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-2 border border-zinc-700">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
          <span>Draft saved to local storage! Returning home...</span>
        </div>
      )}

      {/* PERSISTENT TOP HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200 shadow-xs">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-[#3730a3] text-white flex items-center justify-center font-bold text-lg shadow-md relative overflow-hidden ring-2 ring-indigo-200">
              <span className="material-symbols-outlined text-[24px]">celebration</span>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex flex-col">
              <span className="font-['Fraunces',serif] text-xl font-bold text-[#1f108e] tracking-tight leading-none">UtsavFlow</span>
              <span className="text-[11px] text-zinc-600 font-bold">Celebration Workspace</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-emerald-900 bg-emerald-50 border border-emerald-200 font-bold text-xs px-3.5 py-1.5 rounded-full shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>Draft auto-saved</span>
            </div>
            <button 
              onClick={handleSaveAndExit}
              className="h-10 px-4 rounded-xl border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 text-xs sm:text-sm font-bold transition-colors shadow-xs cursor-pointer"
              type="button"
            >
              Save &amp; exit
            </button>
          </div>
        </div>
      </header>

      {/* WORKSPACE CONTAINER */}
      <main className="max-w-[1040px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* VISUAL PROGRESS BAR & STEP INDICATOR COMPONENT */}
        <section aria-label="Setup progress" className="mb-8 bg-white/70 backdrop-blur-md border border-white/30 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-50 text-[#3730a3] text-xs font-bold border border-indigo-200 shadow-2xs">
              <span className="material-symbols-outlined text-[16px]">
                {currentStep === 1 ? 'explore' : currentStep === 2 ? 'account_balance_wallet' : currentStep === 3 ? 'military_tech' : 'verified'}
              </span>
              <span>Step {currentStep} of 4: {currentStep === 1 ? 'Basic Details' : currentStep === 2 ? 'Financial Envelope & Guests' : currentStep === 3 ? 'Priorities & Preferences' : 'Review & Generate Plan'}</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-zinc-700">
              <span>{percentage}% Complete</span>
              <span className="text-zinc-300">·</span>
              <span className="text-indigo-700">{100 - percentage}% Remaining</span>
            </div>
          </div>

          {/* Animated Visual Progress Bar */}
          <div className="w-full h-3 bg-zinc-200 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-[#3730a3] via-indigo-600 to-amber-500 rounded-full transition-all duration-500 ease-out shadow-xs"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>

          {/* 4-Step Track Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
            {/* Step 1 */}
            <div 
              onClick={() => navigate('/events/new/basic')}
              className={`rounded-xl p-3.5 border transition-all cursor-pointer shadow-2xs ${currentStep === 1 ? 'bg-indigo-50/80 border-2 border-[#3730a3] shadow-xs' : 'bg-white border-zinc-200 hover:border-zinc-300'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${currentStep > 1 ? 'text-emerald-700' : currentStep === 1 ? 'text-[#3730a3]' : 'text-zinc-500'}`}>
                  {currentStep > 1 ? '✓ Step 1: Basic' : 'Step 1: Basic Details'}
                </span>
                <span className="font-mono text-xs font-bold text-zinc-600">{currentStep > 1 ? 'Done' : currentStep === 1 ? 'Active' : ''}</span>
              </div>
              <p className="text-xs text-zinc-600 font-semibold truncate">{draft.eventName || 'Untitled Event'}</p>
            </div>

            {/* Step 2 */}
            <div 
              onClick={() => currentStep > 1 && navigate('/events/new/budget')}
              className={`rounded-xl p-3.5 border transition-all ${currentStep === 2 ? 'bg-indigo-50/80 border-2 border-[#3730a3] shadow-xs cursor-pointer' : currentStep > 2 ? 'bg-white border-zinc-200 hover:border-zinc-300 cursor-pointer shadow-2xs' : 'bg-zinc-100 border-zinc-200 opacity-75'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${currentStep > 2 ? 'text-emerald-700' : currentStep === 2 ? 'text-[#3730a3]' : 'text-zinc-500'}`}>
                  {currentStep > 2 ? '✓ Step 2: Budget' : 'Step 2: Budget & Guests'}
                </span>
                <span className="font-mono text-xs font-bold text-zinc-600">{currentStep > 2 ? 'Done' : currentStep === 2 ? 'Active' : 'Locked'}</span>
              </div>
              <p className="text-xs text-zinc-600 font-semibold truncate">₹{draft.maxBudget?.toLocaleString('en-IN') || '8,00,000'} · {draft.totalGuests} Guests</p>
            </div>

            {/* Step 3 */}
            <div 
              onClick={() => currentStep > 2 && navigate('/events/new/preferences')}
              className={`rounded-xl p-3.5 border transition-all ${currentStep === 3 ? 'bg-indigo-50/80 border-2 border-[#3730a3] shadow-xs cursor-pointer' : currentStep > 3 ? 'bg-white border-zinc-200 hover:border-zinc-300 cursor-pointer shadow-2xs' : 'bg-zinc-100 border-zinc-200 opacity-75'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${currentStep > 3 ? 'text-emerald-700' : currentStep === 3 ? 'text-[#3730a3]' : 'text-zinc-500'}`}>
                  {currentStep > 3 ? '✓ Step 3: Priorities' : 'Step 3: Priorities'}
                </span>
                <span className="font-mono text-xs font-bold text-zinc-600">{currentStep > 3 ? 'Done' : currentStep === 3 ? 'Active' : 'Locked'}</span>
              </div>
              <p className="text-xs text-zinc-600 font-semibold truncate">{draft.priorities[0] || 'Food & Catering'} #1</p>
            </div>

            {/* Step 4 */}
            <div 
              onClick={() => currentStep > 3 && navigate('/events/new/review')}
              className={`rounded-xl p-3.5 border transition-all shadow-2xs ${currentStep === 4 ? 'bg-indigo-50/80 border-2 border-[#3730a3] shadow-xs' : 'bg-zinc-100 border-zinc-200 opacity-75'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${currentStep === 4 ? 'text-[#3730a3]' : 'text-zinc-500'}`}>Step 4: Review</span>
                <span className="font-mono text-xs font-bold text-zinc-600">{currentStep === 4 ? 'Active' : 'Locked'}</span>
              </div>
              <p className="text-xs text-zinc-600 font-semibold truncate">Pre-flight Audit</p>
            </div>
          </div>
        </section>

        {children}
      </main>
    </div>
  );
};
