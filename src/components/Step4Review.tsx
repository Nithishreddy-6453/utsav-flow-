/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useEvent } from '../context/EventContext';
import { WizardShell } from './WizardShell';
import { savePlan } from '../utils/storage';
import { generateFallbackPlan } from '../utils/fallbackPlan';

export const Step4Review: React.FC = () => {
  const { draft, navigate } = useEvent();
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(20);
  const [stageText, setStageText] = useState<string>('Allocating budget cap across priority tiers...');

  const handleGenerate = async () => {
    setIsSimulating(true);
    setProgress(25);
    setStageText('Connecting to secure Gemini AI Planning Engine...');

    try {
      const response = await fetch('/api/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft)
      });
      const data = await response.json();
      setProgress(75);
      setStageText('Auditing ceremonial vendor specifications & timeline...');

      if (data && data.success && data.plan) {
        savePlan(data.plan);
      } else {
        const fallback = generateFallbackPlan(draft);
        savePlan(fallback);
      }

      setTimeout(() => {
        setProgress(100);
        setStageText('Plan successfully synthesized! Launching dashboard...');
        setTimeout(() => {
          navigate('/workspace/overview');
        }, 700);
      }, 900);
    } catch (err) {
      console.warn('Network error calling plan generator, using robust local fallback:', err);
      const fallback = generateFallbackPlan(draft);
      savePlan(fallback);
      setProgress(100);
      setTimeout(() => {
        navigate('/workspace/overview');
      }, 800);
    }
  };

  return (
    <WizardShell currentStep={4}>
      {/* Subtle Celebratory Success Banner & Hero Header */}
      <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-rose-500/15 border border-amber-300/40 p-6 sm:p-8 shadow-sm">
        {/* Floating Celebratory Particle Sparkles */}
        <div className="absolute top-2 right-6 animate-bounce text-amber-500 text-lg select-none pointer-events-none">✨</div>
        <div className="absolute bottom-3 right-20 animate-pulse text-indigo-600 text-sm select-none pointer-events-none">✦</div>
        <div className="absolute top-6 left-1/3 animate-ping text-rose-500 text-xs select-none pointer-events-none">★</div>

        <div className="relative z-10">
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 inline-block mb-3 shadow-2xs">
            Step 4 of 4 · Pre-Flight Audit &amp; Success Ready
          </span>
          <h1 className="font-['Fraunces',serif] text-3xl sm:text-4xl text-zinc-900 tracking-tight font-bold">
            Your event, your way.
          </h1>
          <p className="text-zinc-700 text-base sm:text-lg mt-2 max-w-2xl font-semibold">
            All constraints verified successfully! Review your celebration parameters before generating your personalized operational plan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
        {/* Left Column */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Card 1: Overview & Capacity (Indigo Tint) */}
          <section className="bg-white/60 backdrop-blur-md border border-white/25 shadow-sm rounded-2xl p-6 bg-indigo-50/20 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-indigo-100 text-[#3730a3] font-mono font-bold flex items-center justify-center text-xs border border-indigo-200">01</span>
                <div>
                  <h2 className="font-bold text-zinc-900 text-base">Event Overview &amp; Capacity</h2>
                  <p className="text-xs text-zinc-500 font-semibold">Dates, location, budget envelope &amp; guest counts</p>
                </div>
              </div>
              <button onClick={() => navigate('/events/new/basic')} className="px-3.5 py-1.5 text-xs rounded-xl text-[#3730a3] hover:bg-indigo-100 font-bold inline-flex items-center gap-1 border border-indigo-200 cursor-pointer transition-all shadow-2xs bg-white" type="button">
                <span className="material-symbols-outlined text-[15px]">edit</span>
                <span>Edit Steps 1 &amp; 2</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-xl bg-white/90 border border-zinc-200 shadow-2xs">
                <span className="text-[11px] font-bold uppercase text-zinc-500 tracking-wider">Event Name</span>
                <div className="font-bold text-zinc-900 text-sm mt-0.5">{draft.eventName}</div>
                <div className="text-xs text-zinc-700 mt-1 font-semibold">{draft.eventLocation}</div>
              </div>
              <div className="p-4 rounded-xl bg-white/90 border border-zinc-200 shadow-2xs">
                <span className="text-[11px] font-bold uppercase text-zinc-500 tracking-wider">Date</span>
                <div className="font-bold text-zinc-900 text-sm mt-0.5">{draft.eventDate}</div>
                <div className="text-xs text-sky-800 mt-1 font-mono font-bold capitalize">Occasion: {draft.occasionType}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/90 border border-zinc-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 uppercase">Budget &amp; Cohort Breakdown</span>
                <span className="font-mono text-sm font-bold text-[#3730a3]">₹{draft.maxBudget?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="px-3 py-1.5 rounded-xl bg-white border border-zinc-300 shadow-2xs">{draft.totalGuests} Total Guests</span>
                <span className="px-3 py-1.5 rounded-xl bg-white border border-zinc-300 shadow-2xs">{draft.adultGuests} Adults</span>
                <span className="px-3 py-1.5 rounded-xl bg-white border border-zinc-300 shadow-2xs">{draft.childGuests} Children</span>
                <span className="px-3 py-1.5 rounded-xl bg-white border border-zinc-300 shadow-2xs">{draft.seniorGuests} Seniors</span>
              </div>
            </div>
          </section>

          {/* Card 2: Priorities (Amber Tint) */}
          <section className="bg-white/60 backdrop-blur-md border border-white/25 shadow-sm rounded-2xl p-6 bg-amber-50/20 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 font-mono font-bold flex items-center justify-center text-xs border border-amber-200">02</span>
                <div>
                  <h2 className="font-bold text-zinc-900 text-base">Priority Hierarchy</h2>
                  <p className="text-xs text-zinc-500 font-semibold">Ranked order for budget protection</p>
                </div>
              </div>
              <button onClick={() => navigate('/events/new/preferences')} className="px-3.5 py-1.5 text-xs rounded-xl text-[#3730a3] hover:bg-indigo-100 font-bold inline-flex items-center gap-1 border border-indigo-200 cursor-pointer transition-all shadow-2xs bg-white" type="button">
                <span className="material-symbols-outlined text-[15px]">edit</span>
                <span>Edit Step 3</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {draft.priorities?.map((p, idx) => (
                <div key={p} className="p-3 rounded-xl bg-white/90 border border-zinc-200 shadow-2xs flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-[#3730a3] text-white font-bold flex items-center justify-center text-[11px]">{idx + 1}</span>
                    <span className="text-zinc-900 font-bold">{p}</span>
                  </div>
                  {idx === 0 && <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-bold border border-amber-300">Highest Protection</span>}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Card 3: Must Haves & Exclusions (Emerald Tint) */}
          <section className="bg-white/60 backdrop-blur-md border border-white/25 shadow-sm rounded-2xl p-6 bg-emerald-50/20 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-900 font-mono font-bold flex items-center justify-center text-xs border border-emerald-200">03</span>
                <div>
                  <h2 className="font-bold text-zinc-900 text-base">Must-Haves &amp; Rules</h2>
                  <p className="text-xs text-zinc-500 font-semibold">Rigid operational boundaries</p>
                </div>
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <span className="text-[11px] uppercase font-bold text-zinc-600 tracking-wider">Must-Haves</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {draft.mustHaves?.map(m => (
                    <span key={m} className="px-3 py-1.5 rounded-xl bg-white border border-zinc-300 text-[#3730a3] text-xs font-bold shadow-2xs">✓ {m}</span>
                  ))}
                  {draft.customMustHaves?.map(c => (
                    <span key={c} className="px-3 py-1.5 rounded-xl bg-white border border-zinc-300 text-[#3730a3] text-xs font-bold shadow-2xs">✓ {c}</span>
                  ))}
                </div>
              </div>

              {draft.culturalPreferences && (
                <div className="p-3.5 rounded-xl bg-white/90 border border-zinc-200 text-xs font-medium text-zinc-800 shadow-2xs">
                  <strong className="font-bold text-zinc-900">Cultural:</strong> {draft.culturalPreferences}
                </div>
              )}
              {draft.accessibilityRequirements && (
                <div className="p-3.5 rounded-xl bg-white/90 border border-zinc-200 text-xs font-medium text-zinc-800 shadow-2xs">
                  <strong className="font-bold text-zinc-900">Accessibility:</strong> {draft.accessibilityRequirements}
                </div>
              )}
              {draft.thingsToAvoid && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-900 shadow-2xs">
                  <strong className="font-bold">Exclusions:</strong> {draft.thingsToAvoid}
                </div>
              )}
            </div>
          </section>

          {/* Card 4: Deliverables */}
          <section className="bg-gradient-to-br from-indigo-900 to-[#3730a3] rounded-2xl p-6 text-white shadow-lg space-y-3">
            <h2 className="font-bold text-lg text-white">Your Tailored Plan Deliverables</h2>
            <ul className="space-y-2 text-xs font-medium text-indigo-100">
              <li className="flex items-center gap-2">✓ Deterministic INR Budget Ledger</li>
              <li className="flex items-center gap-2">✓ Dependency-Aware Timeline &amp; Cascade</li>
              <li className="flex items-center gap-2">✓ Vendor Briefs &amp; Hidden Fee Audits</li>
              <li className="flex items-center gap-2">✓ Personalized Experience Concepts</li>
            </ul>
          </section>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <footer className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 py-4 px-6 flex items-center justify-between shadow-md">
        <button 
          onClick={() => navigate('/events/new/preferences')}
          className="px-5 py-3 rounded-xl border border-zinc-300 bg-white text-zinc-900 font-bold text-sm cursor-pointer hover:bg-zinc-100 transition-all shadow-xs"
          type="button"
        >
          Back to Priorities
        </button>
        <button 
          onClick={handleGenerate}
          disabled={isSimulating}
          className="px-8 py-3.5 rounded-xl bg-[#3730a3] text-white font-bold text-base shadow-lg hover:bg-[#312E81] flex items-center gap-2.5 cursor-pointer disabled:opacity-75 transition-all active:scale-[0.98]"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          <span>{isSimulating ? 'Synthesizing Plan...' : 'Generate My Event Plan ✦'}</span>
        </button>
      </footer>

      {/* Simulation Modal */}
      {isSimulating && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-zinc-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 mb-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3730a3] animate-spin text-[24px]">progress_activity</span>
                <h3 className="font-bold text-lg text-zinc-900">Synthesizing with Gemini AI...</h3>
              </div>
              <span className="font-mono text-xs font-bold text-zinc-500">~3s</span>
            </div>
            <div className="space-y-4 mb-2">
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-bold">
                  <span className="text-zinc-900">{stageText}</span>
                  <span className="font-mono text-[#3730a3]">{progress}%</span>
                </div>
                <div className="w-full bg-zinc-200 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-[#3730a3] h-2.5 rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </WizardShell>
  );
};
