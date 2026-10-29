/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useEvent } from '../context/EventContext';
import { ReplanModal } from './ReplanModal';
import { applyReplanToPlan, undoLastReplanInPlan } from '../utils/storage';

interface WorkspaceLayoutProps {
  activeTab: 'overview' | 'budget' | 'timeline' | 'vendors' | 'themes' | 'ideas';
  children: React.ReactNode;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({ activeTab, children }) => {
  const { draft, plan, setPlan, navigate, isReplanOpen, openReplan, closeReplan } = useEvent();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const handleSimulateShock = () => {
    openReplan();
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen w-full bg-[#FAF8F5] text-zinc-900 font-['Plus_Jakarta_Sans',sans-serif] antialiased relative">
      {/* MOBILE BACKDROP OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-2xs transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* PERSISTENT LEFT SIDEBAR / MOBILE DRAWER */}
      <aside 
        className={`fixed top-0 left-0 h-full w-[260px] z-50 md:z-40 flex flex-col justify-between bg-white border-r border-zinc-200 shrink-0 shadow-xl md:shadow-xs transition-transform duration-200 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        aria-label="Application Navigation"
      >
        <div className="p-4 flex flex-col gap-5 overflow-y-auto custom-scroll">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleNavClick('/')}>
              <span className="w-8 h-8 rounded-xl bg-[#3730a3] text-white flex items-center justify-center font-bold text-base shadow-sm">U</span>
              <span className="font-bold text-lg text-[#1f108e] tracking-tight">UtsavFlow</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-900 border border-amber-300">MVP</span>
            </div>

            {/* Mobile Close Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100"
              aria-label="Close navigation menu"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Event Switcher Box */}
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#3730a3] flex items-center justify-center flex-shrink-0 mt-0.5 border border-indigo-200">
                <span className="material-symbols-outlined text-[18px]">filter_vintage</span>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-zinc-900 truncate">{draft.eventName || 'Grand Celebration'}</h2>
                <p className="font-mono text-[11px] text-zinc-600 truncate mt-0.5 font-medium">Cap: ₹{draft.maxBudget?.toLocaleString('en-IN') || '8,00,000'} · {draft.totalGuests} Guests</p>
                <span className="inline-block mt-1 text-[10.5px] font-medium text-zinc-500 truncate max-w-full">{draft.eventLocation}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex flex-col gap-1.5" aria-label="Main Navigation">
            <button 
              onClick={() => handleNavClick('/workspace/overview')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer w-full text-left ${activeTab === 'overview' ? 'bg-[#3730a3] text-white shadow-sm' : 'text-zinc-700 hover:bg-zinc-100'}`}
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span>Overview</span>
            </button>

            <button 
              onClick={() => handleNavClick('/workspace/budget')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer w-full text-left ${activeTab === 'budget' ? 'bg-[#3730a3] text-white shadow-sm' : 'text-zinc-700 hover:bg-zinc-100'}`}
            >
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
              <span>Budget Ledger</span>
            </button>

            <button 
              onClick={() => handleNavClick('/workspace/timeline')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer w-full text-left ${activeTab === 'timeline' ? 'bg-[#3730a3] text-white shadow-sm' : 'text-zinc-700 hover:bg-zinc-100'}`}
            >
              <span className="material-symbols-outlined text-[20px]">timeline</span>
              <span>Timeline Flow</span>
            </button>

            <button 
              onClick={() => handleNavClick('/workspace/vendors')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer w-full text-left ${activeTab === 'vendors' ? 'bg-[#3730a3] text-white shadow-sm' : 'text-zinc-700 hover:bg-zinc-100'}`}
            >
              <span className="material-symbols-outlined text-[20px]">storefront</span>
              <span>Vendor Studio</span>
            </button>

            <button 
              onClick={() => handleNavClick('/workspace/ideas')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer w-full text-left ${activeTab === 'themes' || activeTab === 'ideas' ? 'bg-[#3730a3] text-white shadow-sm' : 'text-zinc-700 hover:bg-zinc-100'}`}
            >
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
              <span>Ideas &amp; Experience</span>
            </button>
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex flex-col gap-1.5">
          <button onClick={() => handleNavClick('/events/new/basic')} className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-700 hover:bg-zinc-200 text-xs font-bold cursor-pointer w-full text-left">
            <span className="material-symbols-outlined text-[17px]">restart_alt</span>
            <span>Restart Setup Wizard</span>
          </button>
          <div className="mt-1 pt-2 border-t border-zinc-200 flex items-center justify-between px-2 text-zinc-600">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-emerald-600">lock</span>
              <span className="text-[11px] font-bold">Local Vault · Synced</span>
            </div>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>
      </aside>

      {/* MAIN APP CANVAS */}
      <div className="flex-1 min-w-0 md:pl-[260px] flex flex-col">
        {/* TOP APP BAR */}
        <header className="sticky top-0 z-20 h-18 bg-white/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 border-b border-zinc-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              aria-label="Open navigation sidebar"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>

            <span className="text-sm font-bold text-zinc-900 capitalize">{activeTab.replace('-', ' ')}</span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold ml-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>Live AI Sync</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleSimulateShock} 
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-bold border border-zinc-300 shadow-2xs cursor-pointer active:scale-95 transition-all" 
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-amber-600">bolt</span>
              <span>Simulate Shock</span>
            </button>
            <div className="flex items-center gap-2.5 pl-3 border-l border-zinc-200">
              <div className="w-8 h-8 rounded-full bg-[#3730a3] text-white flex items-center justify-center font-bold text-xs shadow-xs">AS</div>
              <span className="hidden md:inline-block text-xs font-bold text-zinc-900">Ananya S.</span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto flex flex-col gap-6">
          {children}
        </main>
      </div>

      {/* GLOBAL REPLAN & SHOCK SIMULATION MODAL */}
      {isReplanOpen && (
        <ReplanModal
          isOpen={isReplanOpen}
          plan={plan}
          draft={draft}
          onApplyStrategy={(strat, req) => {
            const updated = applyReplanToPlan(strat, req, draft);
            setPlan(updated);
            closeReplan();
          }}
          onUndoLastReplan={() => {
            const res = undoLastReplanInPlan(draft);
            if (res.success) {
              setPlan(res.plan);
              closeReplan();
            }
          }}
          onClose={closeReplan}
        />
      )}
    </div>
  );
};
