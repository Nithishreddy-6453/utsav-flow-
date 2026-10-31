/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useEvent } from '../context/EventContext';
import { WizardShell } from './WizardShell';

export const Step3Preferences: React.FC = () => {
  const { draft, updateDraft, navigate } = useEvent();

  const [priorities, setPriorities] = useState<string[]>(
    draft.priorities?.length > 0 ? draft.priorities : [
      'Food & Catering',
      'Guest Comfort & Hospitality',
      'Photography & Film',
      'Venue & Atmosphere',
      'Decoration & Florals'
    ]
  );

  const [mustHaves, setMustHaves] = useState<string[]>(
    draft.mustHaves?.length > 0 ? draft.mustHaves : ['Pure Veg / Jain', 'Live Shehnai / Acoustic', 'Kids\' Play Area', 'Wheelchair Access', 'Indoor AC Fallback']
  );

  const [customTags, setCustomTags] = useState<string[]>(
    draft.customMustHaves?.length > 0 ? draft.customMustHaves : ['Wheelchair ramp to stage', 'No plastic water bottles']
  );
  const [newTagInput, setNewTagInput] = useState<string>('');

  const [culturalPrefs, setCulturalPrefs] = useState<string>(
    draft.culturalPreferences || 'Traditional Odia rituals (Baula Patani, Hastaganthi); ventilated havan mandap.'
  );
  const [accessibilityPrefs, setAccessibilityPrefs] = useState<string>(
    draft.accessibilityRequirements || '25 seniors need cushioned ground-floor seating near mandap.'
  );
  const [thingsToAvoid, setThingsToAvoid] = useState<string>(
    draft.thingsToAvoid || 'No loud DJ after 10:30 PM; no thermocol/plastics.'
  );

  const handleMovePriority = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= priorities.length) return;
    const updated = [...priorities];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    setPriorities(updated);
  };

  const handleMustHaveToggle = (item: string) => {
    if (mustHaves.includes(item)) {
      setMustHaves(mustHaves.filter(m => m !== item));
    } else {
      setMustHaves([...mustHaves, item]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      if (!customTags.includes(newTagInput.trim())) {
        setCustomTags([...customTags, newTagInput.trim()]);
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setCustomTags(customTags.filter(t => t !== tag));
  };

  // Real-time synchronization of in-progress wizard draft to localStorage
  React.useEffect(() => {
    updateDraft({
      priorities,
      mustHaves,
      customMustHaves: customTags,
      culturalPreferences: culturalPrefs,
      accessibilityRequirements: accessibilityPrefs,
      thingsToAvoid
    });
  }, [priorities, mustHaves, customTags, culturalPrefs, accessibilityPrefs, thingsToAvoid, updateDraft]);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    updateDraft({
      priorities,
      mustHaves,
      customMustHaves: customTags,
      culturalPreferences: culturalPrefs,
      accessibilityRequirements: accessibilityPrefs,
      thingsToAvoid
    });
    navigate('/events/new/review');
  };

  return (
    <WizardShell currentStep={3}>
      <div className="mb-6">
        <h1 className="font-['Fraunces',serif] text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
          What matters most to you?
        </h1>
        <p className="mt-1 text-zinc-600 text-sm sm:text-base max-w-2xl font-medium">
          Rank your top priorities and must-haves to protect what counts most.
        </p>
      </div>

      <form onSubmit={handleContinue} className="space-y-6">
        {/* Section 01: Rank Priorities (Indigo Tint) */}
        <section className="bg-white/60 backdrop-blur-md border border-white/25 shadow-sm rounded-2xl p-5 sm:p-7 bg-indigo-50/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-200 gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
                <span className="text-[#3730a3] font-mono">01.</span> Rank your priorities
              </h2>
              <p className="text-zinc-600 text-xs sm:text-sm mt-0.5 font-semibold">Use up/down controls to reorder. Top categories receive highest budget protection.</p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-white border border-zinc-200 text-sky-900 text-xs font-bold shadow-2xs">
              Protected in budget
            </span>
          </div>

          <div className="space-y-3">
            {priorities.map((item, index) => (
              <div key={item} className="flex items-center justify-between p-3.5 rounded-xl bg-white/90 border border-zinc-200 shadow-2xs hover:border-zinc-300 transition-all">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#3730a3] text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
                    #{index + 1}
                  </span>
                  <span className="font-bold text-sm text-zinc-900">{item}</span>
                  {index === 0 && <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">Highest Protection</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <button 
                    type="button" 
                    onClick={() => handleMovePriority(index, 'up')}
                    disabled={index === 0}
                    className="w-8 h-8 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-900 flex items-center justify-center disabled:opacity-40 cursor-pointer shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[18px]">keyboard_arrow_up</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleMovePriority(index, 'down')}
                    disabled={index === priorities.length - 1}
                    className="w-8 h-8 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-900 flex items-center justify-center disabled:opacity-40 cursor-pointer shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 02: Must-Haves (Amber Tint) */}
        <section className="bg-white/60 backdrop-blur-md border border-white/25 shadow-sm rounded-2xl p-5 sm:p-7 bg-amber-50/20 space-y-4">
          <div className="pb-4 border-b border-zinc-200">
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
              <span className="text-[#3730a3] font-mono">02.</span> What are your must-haves?
            </h2>
            <p className="text-zinc-600 text-xs sm:text-sm mt-0.5 font-semibold">Select non-negotiables. The planner treats these as fixed hard constraints.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {['Pure Veg / Jain', 'Live Shehnai / Acoustic', 'Kids\' Play Area', 'Wheelchair Access', 'Indoor AC Fallback', 'Drone & Video'].map(item => {
              const checked = mustHaves.includes(item);
              return (
                <label key={item} className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${checked ? 'border-[#3730a3] bg-indigo-50/60 shadow-2xs' : 'border-zinc-200 bg-white/90 hover:border-zinc-300'}`}>
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[20px] text-[#3730a3]">check_circle</span>
                    <span className="text-xs sm:text-sm font-bold text-zinc-900">{item}</span>
                  </div>
                  <input 
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleMustHaveToggle(item)}
                    className="h-4 w-4 rounded text-[#3730a3]"
                  />
                </label>
              );
            })}
          </div>

          {/* Custom Tags */}
          <div className="mt-4 pt-4 border-t border-zinc-200 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-zinc-700 mr-1">Custom tags:</span>
            {customTags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-zinc-300 text-zinc-900 text-xs font-bold shadow-2xs">
                <span>{tag}</span>
                <button type="button" onClick={() => handleRemoveTag(tag)} className="text-zinc-400 hover:text-rose-600">
                  <span className="material-symbols-outlined text-[15px]">close</span>
                </button>
              </span>
            ))}
            <input 
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={handleAddCustomTag}
              placeholder="+ Type custom tag & press Enter..."
              className="w-56 bg-white border border-zinc-300 py-2 px-3 text-xs font-semibold rounded-xl text-zinc-900 placeholder:text-zinc-400 outline-none shadow-2xs"
            />
          </div>
        </section>

        {/* Section 03: Guest Experience & Preferences (Emerald Tint) */}
        <section className="bg-white/60 backdrop-blur-md border border-white/25 shadow-sm rounded-2xl p-5 sm:p-7 bg-emerald-50/20 space-y-4">
          <div className="pb-4 border-b border-zinc-200">
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
              <span className="text-[#3730a3] font-mono">03.</span> Guest experience &amp; preferences
            </h2>
            <p className="text-zinc-600 text-xs sm:text-sm mt-0.5 font-semibold">Specific nuances for vendor briefs, seating arrangements, and ceremony cues.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-zinc-900">Cultural &amp; Ritual Nuances (Optional)</label>
              <input 
                type="text" 
                value={culturalPrefs}
                onChange={(e) => setCulturalPrefs(e.target.value)}
                className="w-full h-11 rounded-xl border border-zinc-300 bg-white/90 px-3.5 text-sm font-semibold text-zinc-900 focus:ring-2 focus:ring-[#3730a3] outline-none shadow-2xs"
                placeholder="Key ritual requirements..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-zinc-900">Accessibility &amp; Senior Comfort (Optional)</label>
              <input 
                type="text" 
                value={accessibilityPrefs}
                onChange={(e) => setAccessibilityPrefs(e.target.value)}
                className="w-full h-11 rounded-xl border border-zinc-300 bg-white/90 px-3.5 text-sm font-semibold text-zinc-900 focus:ring-2 focus:ring-[#3730a3] outline-none shadow-2xs"
                placeholder="Special guest assistance..."
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 mb-1">
                <label className="block text-xs sm:text-sm font-bold text-zinc-900">Things to Avoid or Exclude (Optional)</label>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">Negative Rules</span>
              </div>
              <input 
                type="text" 
                value={thingsToAvoid}
                onChange={(e) => setThingsToAvoid(e.target.value)}
                className="w-full h-11 rounded-xl border border-zinc-300 bg-white/90 px-3.5 text-sm font-semibold text-zinc-900 focus:ring-2 focus:ring-[#3730a3] outline-none shadow-2xs"
                placeholder="Restrictions, blacklists, limits..."
              />
            </div>
          </div>
        </section>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-4">
          <button 
            type="button" 
            onClick={() => navigate('/events/new/budget')}
            className="px-5 py-3 rounded-xl border border-zinc-300 bg-white text-zinc-900 text-sm font-bold cursor-pointer hover:bg-zinc-100 transition-all shadow-xs"
          >
            Back
          </button>
          <button 
            type="submit"
            className="px-8 py-3.5 rounded-xl bg-[#3730a3] text-white font-bold text-sm shadow-md hover:bg-[#312E81] flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <span>Continue to Review</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </form>
    </WizardShell>
  );
};
