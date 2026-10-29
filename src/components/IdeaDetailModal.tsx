/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PersonalizedIdea } from '../types/plan';

interface IdeaDetailModalProps {
  idea: PersonalizedIdea | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (idea: PersonalizedIdea) => void;
  onSelectForRefinement?: (idea: PersonalizedIdea) => void;
}

export const IdeaDetailModal: React.FC<IdeaDetailModalProps> = ({
  idea,
  isOpen,
  onClose,
  isSaved,
  onToggleSave,
  onSelectForRefinement
}) => {
  if (!isOpen || !idea) return null;

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

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="idea-modal-title"
    >
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-zinc-200 flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover Image & Header */}
        <div className="relative h-56 sm:h-64 bg-zinc-900 shrink-0 overflow-hidden">
          {idea.image ? (
            <img 
              src={idea.image} 
              alt={idea.title} 
              className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-500" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-[#3730a3] to-indigo-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-white/40 text-6xl">filter_vintage</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-between p-5">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-white/90 text-xs font-bold text-zinc-900 tracking-wide uppercase shadow-xs">
                {idea.category}
              </span>
              <button 
                onClick={onClose}
                aria-label="Close dialog"
                className="w-8 h-8 rounded-full bg-black/50 text-white hover:bg-black/80 flex items-center justify-center cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBudgetBadgeColor(idea.budgetImpact)}`}>
                  <span className="material-symbols-outlined text-[13px]">payments</span>
                  <span>{idea.budgetImpact}</span>
                </span>
                {idea.source === 'user_refined' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-[#3730a3] border border-indigo-200">
                    <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                    <span>Custom Refined</span>
                  </span>
                )}
              </div>
              <h2 id="idea-modal-title" className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug drop-shadow-xs">
                {idea.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Main Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Concept Overview</h3>
            <p className="text-zinc-800 leading-relaxed text-base font-normal">{idea.description}</p>
          </div>

          {/* Why It Fits */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs uppercase tracking-wide">
              <span className="material-symbols-outlined text-[16px] text-amber-700">verified</span>
              <span>Why It Fits Your Event</span>
            </div>
            <p className="text-amber-950 font-medium text-sm leading-relaxed">{idea.whyItFits}</p>
          </div>

          {/* Practical Considerations */}
          {idea.practicalConsiderations && idea.practicalConsiderations.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-zinc-600">checklist</span>
                <span>Practical Execution &amp; Logistics</span>
              </h3>
              <ul className="space-y-1.5 text-zinc-700">
                {idea.practicalConsiderations.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm">
                    <span className="material-symbols-outlined text-emerald-600 text-[16px] mt-0.5 shrink-0">check_circle</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Constraint Alignment & Conflict Vetting */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 space-y-1">
              <span className="text-[11px] font-bold uppercase text-zinc-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-emerald-600">task_alt</span>
                <span>Must-Have &amp; Accessibility</span>
              </span>
              <p className="text-xs text-zinc-800 leading-normal">
                {idea.mustHaveCompatibility || 'Coordinates seamlessly with core celebration schedule.'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 space-y-1">
              <span className="text-[11px] font-bold uppercase text-zinc-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-indigo-600">shield_with_heart</span>
                <span>Exclusion / Conflict Vetting</span>
              </span>
              <p className="text-xs text-zinc-800 leading-normal">
                {idea.potentialConflicts || 'Verified compliant with celebration constraints & zero exclusions.'}
              </p>
            </div>
          </div>

          {/* Budget Impact Explanation & Qualitative Disclaimer */}
          <div className="p-3.5 rounded-lg bg-zinc-50 border border-dashed border-zinc-300 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-700 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-zinc-500">info</span>
                <span>Budget Impact Insight: <strong className="font-semibold text-zinc-900">{idea.budgetImpact}</strong></span>
              </span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              {idea.budgetAssumptions || 'Evaluated qualitatively against your existing budget allocations and guest count. Does not alter ledger items until you book a quotation.'}
            </p>
          </div>

          {/* Tags */}
          {idea.tags && idea.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {idea.tags.map((tag, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSave(idea)}
              type="button"
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer ${
                isSaved 
                  ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200' 
                  : 'bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-100'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isSaved ? 'bookmark_remove' : 'bookmark_add'}
              </span>
              <span>{isSaved ? 'Remove from Saved' : 'Save to My Ideas'}</span>
            </button>

            {onSelectForRefinement && (
              <button
                onClick={() => {
                  onSelectForRefinement(idea);
                  onClose();
                }}
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-50 hover:bg-indigo-100 text-[#3730a3] border border-indigo-200 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">auto_awesome</span>
                <span>Refine This Idea</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-zinc-200 hover:bg-zinc-300 text-zinc-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
