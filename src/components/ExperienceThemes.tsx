/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WorkspaceLayout } from './WorkspaceLayout';
import { useEvent } from '../context/EventContext';
import { toggleSaveIdea, updatePlanIdeas } from '../utils/storage';
import { PersonalizedIdea } from '../types/plan';
import { generateDeterministicIdeas } from '../utils/ideaEngine';
import { IdeaDetailModal } from './IdeaDetailModal';

export const ExperienceThemes: React.FC = () => {
  const { draft, plan, setPlan } = useEvent();
  const [activeCategory, setActiveCategory] = useState<string>('For You');
  const [selectedIdeaForModal, setSelectedIdeaForModal] = useState<PersonalizedIdea | null>(null);
  const [selectedIdeaForRefine, setSelectedIdeaForRefine] = useState<PersonalizedIdea | null>(null);
  const [refinementInput, setRefinementInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Initialize or synchronize personalized ideas
  useEffect(() => {
    if (!plan.personalizedIdeas || plan.personalizedIdeas.length === 0) {
      const generated = generateDeterministicIdeas(draft);
      const updatedPlan = updatePlanIdeas(generated, draft);
      setPlan(updatedPlan);
    }
  }, [draft, plan.personalizedIdeas]);

  const allIdeas = plan.personalizedIdeas || [];
  const savedIdeaIds = new Set<string>(plan.savedIdeaIds || []);

  // Filter ideas based on active category
  const filteredIdeas = allIdeas.filter(idea => {
    if (activeCategory === 'Saved') {
      return savedIdeaIds.has(idea.id) || Boolean(idea.isSaved);
    }
    if (activeCategory === 'For You') {
      return true;
    }
    return idea.category.toLowerCase() === activeCategory.toLowerCase();
  });

  const handleToggleSave = (idea: PersonalizedIdea) => {
    const result = toggleSaveIdea(idea, draft);
    setPlan(result.plan);
    setFeedbackMessage(result.isSaved ? `Saved "${idea.title}" to shortlist.` : `Removed "${idea.title}" from shortlist.`);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleRegenerateIdeas = async () => {
    setIsGenerating(true);
    setFeedbackMessage('Synthesizing personalized celebration concepts...');
    try {
      const res = await fetch('/api/ideas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.ideas)) {
        const updated = updatePlanIdeas(data.ideas, draft);
        setPlan(updated);
        setFeedbackMessage('Ideas refreshed successfully.');
      } else {
        const fallback = generateDeterministicIdeas(draft);
        const updated = updatePlanIdeas(fallback, draft);
        setPlan(updated);
        setFeedbackMessage('Ideas synchronized with current constraints.');
      }
    } catch (err) {
      console.warn('API generation failed, using deterministic ideas:', err);
      const fallback = generateDeterministicIdeas(draft);
      const updated = updatePlanIdeas(fallback, draft);
      setPlan(updated);
      setFeedbackMessage('Ideas synchronized with local engine.');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
  };

  const handleRefineSubmit = async (promptOverride?: string) => {
    const promptToUse = promptOverride || refinementInput;
    if (!promptToUse.trim()) return;

    setIsRefining(true);
    setFeedbackMessage('Crafting customized celebration alternatives...');
    try {
      const res = await fetch('/api/ideas/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft,
          idea: selectedIdeaForRefine || undefined,
          refinementPrompt: promptToUse
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.ideas) && data.ideas.length > 0) {
        // Prepend refined ideas to existing list
        const updated = updatePlanIdeas([...data.ideas, ...allIdeas], draft);
        setPlan(updated);
        setFeedbackMessage(`Generated ${data.ideas.length} tailored alternatives.`);
        setActiveCategory('For You');
      } else {
        setFeedbackMessage('Could not refine with current input, please try another directive.');
      }
    } catch (err) {
      console.warn('Refinement request failed:', err);
      setFeedbackMessage('Refinement error. Fallback alternatives generated.');
    } finally {
      setIsRefining(false);
      setRefinementInput('');
      setSelectedIdeaForRefine(null);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  const getBudgetBadgeColor = (impact: string) => {
    switch (impact) {
      case 'Likely low impact':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Potentially moderate impact':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Potentially high impact':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  const categories = [
    { key: 'For You', label: 'For You' },
    { key: 'Decor', label: 'Decor' },
    { key: 'Food', label: 'Food' },
    { key: 'Activities', label: 'Activities' },
    { key: 'Guest Comfort', label: 'Guest Comfort' },
    { key: 'Saved', label: `Saved (${savedIdeaIds.size})` }
  ];

  return (
    <WorkspaceLayout activeTab="ideas">
      {/* Toast Feedback Notification */}
      {feedbackMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200 border border-zinc-700">
          <span className="material-symbols-outlined text-[18px] text-amber-400">info</span>
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <span className="font-mono text-xs font-semibold text-[#3730a3] uppercase tracking-wider">
            EXPERIENCE &amp; THEMES
          </span>
          <h1 className="font-['Fraunces',serif] text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight mt-1">
            Ideas &amp; Experience
          </h1>
          <p className="text-sm font-medium text-zinc-800 mt-1">
            Make it feel like yours. Discover curated concepts, thoughtful hospitality details, and creative styling tailored to your ₹{draft.maxBudget?.toLocaleString('en-IN')} cap &amp; {draft.totalGuests} guests.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setActiveCategory('Saved')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer ${
              activeCategory === 'Saved'
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-white hover:bg-zinc-100 text-zinc-800 border-zinc-300'
            }`}
          >
            <span className="material-symbols-outlined text-[17px] text-amber-600">bookmark</span>
            <span>View Saved Ideas ({savedIdeaIds.size})</span>
          </button>

          <button
            onClick={handleRegenerateIdeas}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#3730a3] hover:bg-[#2e2882] text-white shadow-xs cursor-pointer transition-colors disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[17px] ${isGenerating ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{isGenerating ? 'Curating...' : 'Refresh Ideas'}</span>
          </button>
        </div>
      </div>

      {/* DYNAMIC EVENT CONTEXT PANEL */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#3730a3]">tune</span>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-700">Grounded Celebration Context</span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Read-Only Inspiration Layer
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-zinc-500 font-medium block">Occasion &amp; Vibe</span>
            <span className="font-bold text-zinc-900 truncate block mt-0.5 capitalize">
              {draft.occasionType} · {draft.eventStyle?.slice(0, 2).join(', ') || 'Festive'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-zinc-500 font-medium block">Guest Composition</span>
            <span className="font-bold text-zinc-900 truncate block mt-0.5">
              {draft.totalGuests} Total ({draft.seniorGuests || 0} Seniors, {draft.childGuests || 0} Kids)
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-zinc-500 font-medium block">Budget Envelope</span>
            <span className="font-bold text-zinc-900 truncate block mt-0.5">
              ₹{draft.maxBudget?.toLocaleString('en-IN')} ({draft.budgetFlexibility || 'moderate'})
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-zinc-500 font-medium block">Top Priority</span>
            <span className="font-bold text-[#3730a3] truncate block mt-0.5">
              {draft.priorities && draft.priorities.length > 0 ? draft.priorities[0] : 'Guest Experience'}
            </span>
          </div>
        </div>

        {/* Priority & Accessibility Highlights */}
        {(draft.accessibilityRequirements || draft.thingsToAvoid || (draft.priorities && draft.priorities.length > 1)) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            {draft.accessibilityRequirements && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-[#3730a3] font-semibold">
                <span className="material-symbols-outlined text-[14px]">accessible</span>
                <span>Accessibility: {draft.accessibilityRequirements}</span>
              </span>
            )}
            {draft.thingsToAvoid && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-semibold">
                <span className="material-symbols-outlined text-[14px]">do_not_disturb_on</span>
                <span>Avoids: {draft.thingsToAvoid}</span>
              </span>
            )}
            {draft.mustHaves && draft.mustHaves.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
                <span className="material-symbols-outlined text-[14px]">stars</span>
                <span>Must Have: {draft.mustHaves[0]}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* NATURAL LANGUAGE REFINEMENT SECTION */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-pink-50/30 border border-indigo-100 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#3730a3] text-[20px]">auto_fix_high</span>
              <span>Make an idea your own.</span>
            </h2>
            <p className="text-xs text-zinc-700 mt-0.5">
              Adjust any concept to better match your family&apos;s preferences, budget limits, or guest needs.
            </p>
          </div>

          {selectedIdeaForRefine && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-indigo-200 text-xs font-semibold text-[#3730a3] shadow-2xs">
              <span className="truncate max-w-[200px]">Refining: {selectedIdeaForRefine.title}</span>
              <button 
                onClick={() => setSelectedIdeaForRefine(null)}
                aria-label="Clear selected idea"
                className="hover:text-rose-600 text-zinc-400 cursor-pointer ml-1"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          )}
        </div>

        {/* Input & Action */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={refinementInput}
            onChange={(e) => setRefinementInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleRefineSubmit();
              }
            }}
            placeholder="e.g., 'Make it more affordable for 150 guests', 'Prioritize elder seating and noise comfort', 'Focus on local street chaat'..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-zinc-300 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#3730a3] focus:border-transparent shadow-2xs font-normal"
          />
          <button
            onClick={() => handleRefineSubmit()}
            disabled={isRefining || !refinementInput.trim()}
            className="px-5 py-2.5 rounded-xl bg-[#3730a3] hover:bg-[#2e2882] text-white text-xs sm:text-sm font-bold shadow-xs cursor-pointer transition-colors disabled:opacity-50 shrink-0 flex items-center justify-center gap-2"
          >
            <span className={`material-symbols-outlined text-[18px] ${isRefining ? 'animate-spin' : ''}`}>
              {isRefining ? 'sync' : 'auto_awesome'}
            </span>
            <span>{isRefining ? 'Generating...' : 'Generate Alternatives'}</span>
          </button>
        </div>

        {/* Suggestion Prompt Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-zinc-500 uppercase mr-1">Quick prompts:</span>
          {[
            'Make simpler / affordable',
            'Elderly comfort & accessibility',
            'Prioritize food over decor',
            'Eco-friendly / zero plastic'
          ].map((promptText, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setRefinementInput(promptText);
                handleRefineSubmit(promptText);
              }}
              className="px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-zinc-700 hover:text-zinc-900 border border-zinc-200 text-xs font-medium cursor-pointer transition-colors shadow-2xs hover:border-[#3730a3]"
            >
              + {promptText}
            </button>
          ))}
        </div>
      </div>

      {/* CATEGORY NAVIGATION TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-zinc-200 custom-scroll">
        {categories.map((tab) => {
          const isActive = activeCategory === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-[#3730a3] text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* IDEAS GRID */}
      {filteredIdeas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIdeas.map((idea) => {
            const isSaved = savedIdeaIds.has(idea.id) || Boolean(idea.isSaved);
            return (
              <div
                key={idea.id}
                className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col group"
              >
                {/* Image Banner */}
                <div className="h-48 bg-zinc-900 relative overflow-hidden shrink-0">
                  {idea.image ? (
                    <img
                      src={idea.image}
                      alt={idea.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-[#3730a3] to-indigo-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white/40 text-5xl">filter_vintage</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-between p-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/95 text-[11px] font-bold text-zinc-900 uppercase tracking-wider shadow-2xs">
                        {idea.category}
                      </span>
                      <button
                        onClick={() => handleToggleSave(idea)}
                        aria-label={isSaved ? 'Remove from saved' : 'Save idea'}
                        className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                          isSaved
                            ? 'bg-amber-400 text-amber-950 hover:bg-amber-500'
                            : 'bg-black/40 text-white hover:bg-black/70'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isSaved ? 'bookmark' : 'bookmark_border'}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getBudgetBadgeColor(idea.budgetImpact)}`}>
                        <span className="material-symbols-outlined text-[12px]">payments</span>
                        <span>{idea.budgetImpact}</span>
                      </span>
                      {idea.isRefined && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-[#3730a3] border border-indigo-200">
                          <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                          <span>Refined</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-2.5">
                    <h3 className="font-bold text-base text-zinc-900 leading-snug line-clamp-2">
                      {idea.title}
                    </h3>
                    <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                      {idea.description}
                    </p>

                    {/* Why It Fits Pillbox */}
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs">
                      <div className="flex items-center gap-1 text-amber-900 font-bold text-[11px] uppercase tracking-wide">
                        <span className="material-symbols-outlined text-[13px] text-amber-700">verified</span>
                        <span>Why It Fits</span>
                      </div>
                      <p className="text-amber-950 font-medium mt-0.5 line-clamp-2 leading-relaxed">
                        {idea.whyItFits}
                      </p>
                    </div>

                    {/* Tags */}
                    {idea.tags && idea.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {idea.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 text-[10.5px] font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs">
                    <button
                      onClick={() => setSelectedIdeaForModal(idea)}
                      type="button"
                      className="inline-flex items-center gap-1 font-bold text-[#3730a3] hover:text-[#28227b] cursor-pointer"
                    >
                      <span>Explore Idea</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedIdeaForRefine(idea);
                        window.scrollTo({ top: 180, behavior: 'smooth' });
                      }}
                      type="button"
                      className="inline-flex items-center gap-1 font-semibold text-zinc-500 hover:text-zinc-800 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">tune</span>
                      <span>Refine</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ZERO / EMPTY STATE */
        <div className="p-12 text-center rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-3">
          <div className="w-14 h-14 rounded-full bg-indigo-50 text-[#3730a3] flex items-center justify-center mx-auto border border-indigo-200">
            <span className="material-symbols-outlined text-3xl">bookmark_border</span>
          </div>
          <h3 className="text-base font-bold text-zinc-900">
            {activeCategory === 'Saved' ? 'No Saved Ideas Yet' : 'No Ideas Found in this Category'}
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            {activeCategory === 'Saved'
              ? 'Click the bookmark icon on any celebration idea card to build your personalized shortlist of themes, menus, and styling concepts.'
              : 'Try selecting "For You" or using the natural-language prompt above to generate fresh customized alternatives.'}
          </p>
          <button
            onClick={() => setActiveCategory('For You')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#3730a3] text-white hover:bg-[#2d2786] transition-colors cursor-pointer mt-2"
          >
            <span>Explore All Ideas</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      )}

      {/* IDEA DETAILS MODAL */}
      <IdeaDetailModal
        idea={selectedIdeaForModal}
        isOpen={Boolean(selectedIdeaForModal)}
        onClose={() => setSelectedIdeaForModal(null)}
        isSaved={selectedIdeaForModal ? (savedIdeaIds.has(selectedIdeaForModal.id) || Boolean(selectedIdeaForModal.isSaved)) : false}
        onToggleSave={handleToggleSave}
        onSelectForRefinement={(idea) => {
          setSelectedIdeaForRefine(idea);
          window.scrollTo({ top: 180, behavior: 'smooth' });
        }}
      />
    </WorkspaceLayout>
  );
};
