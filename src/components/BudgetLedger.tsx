/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { WorkspaceLayout } from './WorkspaceLayout';
import { useEvent } from '../context/EventContext';
import { BudgetItem } from '../types/plan';
import { persistBudgetItem, removeBudgetItem } from '../utils/storage';
import { 
  calculateTotalAllocated, 
  calculateTotalProjected, 
  calculateTotalPaid, 
  calculateForecastRemaining, 
  calculateUnallocatedBudget, 
  calculateDifference, 
  isOverAllocation, 
  formatINR 
} from '../utils/calculations';
import { BudgetItemModal } from './BudgetItemModal';

export const BudgetLedger: React.FC = () => {
  const { draft, plan, setPlan, openReplan } = useEvent();

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [costSourceFilter, setCostSourceFilter] = useState<string>('all');
  const [varianceFilter, setVarianceFilter] = useState<string>('all');

  const budgetItems = plan.budgetItems || [];
  const totalBudget = plan.budgetSummary?.totalBudget || draft.maxBudget || 1000000;

  // Derived financial calculations
  const totalAllocated = useMemo(() => calculateTotalAllocated(budgetItems), [budgetItems]);
  const totalProjected = useMemo(() => calculateTotalProjected(budgetItems), [budgetItems]);
  const totalPaid = useMemo(() => calculateTotalPaid(budgetItems), [budgetItems]);
  const forecastRemaining = useMemo(() => calculateForecastRemaining(totalBudget, totalProjected), [totalBudget, totalProjected]);
  const unallocatedBudget = useMemo(() => calculateUnallocatedBudget(totalBudget, totalAllocated), [totalBudget, totalAllocated]);

  const allocationPercent = totalBudget > 0 ? (totalAllocated / totalBudget) * 100 : 0;
  const isAllocationOverBudget = totalAllocated > totalBudget;
  const isProjectedDeficit = forecastRemaining < 0;

  // Filtered budget items
  const filteredItems = useMemo(() => {
    return budgetItems.filter(item => {
      // Search filter
      const matchesSearch = 
        item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.sourceNotes && item.sourceNotes.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Cost source filter
      if (costSourceFilter !== 'all' && item.costSource !== costSourceFilter) {
        return false;
      }

      // Variance status filter
      if (varianceFilter === 'over') {
        return isOverAllocation(item.projectedCost, item.allocatedAmount);
      }
      if (varianceFilter === 'within') {
        return !isOverAllocation(item.projectedCost, item.allocatedAmount);
      }

      return true;
    });
  }, [budgetItems, searchQuery, costSourceFilter, varianceFilter]);

  // Handle Save (Add or Edit)
  const handleSaveItem = (itemToSave: BudgetItem) => {
    const updatedPlan = persistBudgetItem(itemToSave, draft);
    setPlan({ ...updatedPlan });
  };

  // Handle Delete
  const handleDeleteItem = (itemId: string) => {
    const updatedPlan = removeBudgetItem(itemId, draft);
    setPlan({ ...updatedPlan });
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'ai_estimate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
            AI Estimate
          </span>
        );
      case 'vendor_quote':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="material-symbols-outlined text-[13px]">verified</span>
            Vendor Quote
          </span>
        );
      case 'user_estimate':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#EEF2FF] text-[#3730a3] border border-[#C7D2FE]">
            <span className="material-symbols-outlined text-[13px]">person</span>
            User Estimate
          </span>
        );
    }
  };

  return (
    <WorkspaceLayout activeTab="budget">
      {/* 1. PAGE HEADER */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
            <span>{draft.eventName || 'Grand Celebration'}</span>
            <span className="text-zinc-300">·</span>
            <span className="text-[#3730a3]">{draft.eventDate}</span>
            <span className="text-zinc-300">·</span>
            <span className="text-zinc-600 font-mono">{draft.totalGuests} Guests</span>
          </div>
          <h1 className="font-['Fraunces',serif] text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
            Budget Ledger
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1 max-w-2xl font-medium">
            Track allocations, estimated costs and payments in real time with strict price provenance.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button 
            onClick={openReplan}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-[#3730a3] font-bold text-xs sm:text-sm shadow-xs active:scale-[0.98] transition-all cursor-pointer" 
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            <span>Simulate Shock / Rebalance</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#3730a3] hover:bg-[#312E81] text-white font-bold text-xs sm:text-sm shadow-md active:scale-[0.98] transition-all cursor-pointer" 
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>+ Add Line Item</span>
          </button>
        </div>
      </section>

      {/* 2. FOUR FINANCIAL SUMMARY CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Budget */}
        <div className="p-5 rounded-2xl bg-white border border-[#E6E1DA] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Budget</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#F3EFEA] text-zinc-700 border border-[#E6E1DA]">
              {draft.budgetFlexibility === 'strict' ? 'Hard Cap' : 'Flexible'}
            </span>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-bold text-zinc-900 tracking-tight">
              {formatINR(totalBudget)}
            </div>
            <p className="text-xs text-zinc-500 mt-1 font-medium">Event spending limit</p>
          </div>
        </div>

        {/* Card 2: Projected Total */}
        <div className="p-5 rounded-2xl bg-white border border-[#E6E1DA] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Projected Total</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
              isProjectedDeficit 
                ? 'bg-rose-50 text-rose-800 border-rose-200' 
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              {isProjectedDeficit ? 'Over Budget' : 'Within Budget'}
            </span>
          </div>
          <div className="mt-3">
            <div className={`font-mono text-2xl font-bold tracking-tight ${
              isProjectedDeficit ? 'text-rose-700' : 'text-[#3730a3]'
            }`}>
              {formatINR(totalProjected)}
            </div>
            <p className="text-xs text-zinc-500 mt-1 font-medium">Expected total event cost</p>
          </div>
        </div>

        {/* Card 3: Forecast Remaining */}
        <div className="p-5 rounded-2xl bg-white border border-[#E6E1DA] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Forecast Remaining</span>
            <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
              isProjectedDeficit 
                ? 'bg-rose-50 text-rose-800 border-rose-200' 
                : 'bg-[#EEF2FF] text-[#1f108e] border-[#C7D2FE]'
            }`}>
              {isProjectedDeficit ? 'Deficit Warning' : 'Safe Buffer'}
            </span>
          </div>
          <div className="mt-3">
            <div className={`font-mono text-2xl font-bold tracking-tight ${
              isProjectedDeficit ? 'text-rose-600' : 'text-emerald-700'
            }`}>
              {formatINR(forecastRemaining)}
            </div>
            <p className="text-xs text-zinc-500 mt-1 font-medium">
              {isProjectedDeficit ? 'Projected exceeds budget limit' : 'Budget minus projected'}
            </p>
          </div>
        </div>

        {/* Card 4: Paid So Far */}
        <div className="p-5 rounded-2xl bg-white border border-[#E6E1DA] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Paid So Far</span>
            <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#F3EFEA] text-zinc-600 border border-[#E6E1DA]">
              {totalProjected > 0 ? `${((totalPaid / totalProjected) * 100).toFixed(1)}% Disbursed` : '0% Disbursed'}
            </span>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-bold text-zinc-900 tracking-tight">
              {formatINR(totalPaid)}
            </div>
            <p className="text-xs text-zinc-500 mt-1 font-medium">Recorded payment deposits</p>
          </div>
        </div>
      </section>

      {/* 3. BUDGET ALLOCATION PROGRESS SECTION */}
      <section className="p-5 rounded-2xl bg-white border border-[#E6E1DA] shadow-xs flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-zinc-900">Budget Allocation</h2>
            {isAllocationOverBudget && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                Allocations Exceed Budget!
              </span>
            )}
          </div>
          <div className="font-mono text-xs sm:text-sm font-bold text-zinc-900">
            {formatINR(totalAllocated)} <span className="text-zinc-500 font-normal">of {formatINR(totalBudget)}</span>
            <span className={`ml-1 font-bold ${isAllocationOverBudget ? 'text-rose-600' : 'text-[#3730a3]'}`}>
              ({allocationPercent.toFixed(1)}% Allocated)
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-zinc-100 overflow-hidden relative border border-zinc-200">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isAllocationOverBudget ? 'bg-rose-500' : 'bg-[#3730a3]'
            }`} 
            style={{ width: `${Math.min(100, allocationPercent)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs font-medium text-zinc-600">
          <div className="flex items-center gap-1.5">
            <span className={`material-symbols-outlined text-[17px] ${
              isAllocationOverBudget ? 'text-rose-600' : 'text-sky-600'
            }`}>
              {isAllocationOverBudget ? 'warning' : 'info'}
            </span>
            <span>
              {isAllocationOverBudget 
                ? `Allocated budget exceeds total spending ceiling by ${formatINR(Math.abs(unallocatedBudget))}.`
                : `${formatINR(unallocatedBudget)} (${Math.max(0, 100 - allocationPercent).toFixed(1)}%) of budget remains unallocated.`
              }
            </span>
          </div>
          <span className="text-zinc-400 font-mono text-[11px] hidden sm:inline">
            {budgetItems.length} line items configured
          </span>
        </div>
      </section>

      {/* 4. EXPENSE LEDGER & FILTERS */}
      <section className="p-5 rounded-2xl bg-white border border-[#E6E1DA] shadow-xs flex flex-col gap-4">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-zinc-900">Expense Ledger</h2>
            <span 
              className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F3EFEA] text-zinc-700 border border-[#E6E1DA]"
              aria-live="polite"
            >
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[17px] text-zinc-400" aria-hidden="true">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search category or item..."
                aria-label="Search expense ledger items or categories"
                className="w-full h-9 pl-8 pr-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 font-medium placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#3730a3] focus:bg-white text-xs"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search query"
                  className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[15px]" aria-hidden="true">close</span>
                </button>
              )}
            </div>

            {/* Cost Source Filter */}
            <select
              value={costSourceFilter}
              onChange={(e) => setCostSourceFilter(e.target.value)}
              aria-label="Filter expenses by cost provenance source"
              className="h-9 px-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3730a3]"
            >
              <option value="all">All Sources</option>
              <option value="user_estimate">User Estimate</option>
              <option value="vendor_quote">Vendor Quote</option>
              <option value="ai_estimate">AI Estimate</option>
            </select>

            {/* Variance Status Filter */}
            <select
              value={varianceFilter}
              onChange={(e) => setVarianceFilter(e.target.value)}
              aria-label="Filter expenses by allocation variance status"
              className="h-9 px-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3730a3]"
            >
              <option value="all">All Variances</option>
              <option value="within">Within Allocation</option>
              <option value="over">Over Allocation</option>
            </select>
          </div>
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center rounded-xl bg-zinc-50 border border-dashed border-zinc-200">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-[#3730a3] flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[24px]">receipt_long</span>
            </div>
            <h3 className="text-base font-bold text-zinc-900">
              {budgetItems.length === 0 ? 'No budget items yet' : 'No matching items found'}
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-4">
              {budgetItems.length === 0 
                ? 'Start by creating your first expense category to track projected spending vs allocations.'
                : 'Try adjusting your search query or filters to see your expenses.'}
            </p>
            {budgetItems.length === 0 ? (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#3730a3] text-white text-xs font-bold shadow-sm hover:bg-[#312E81] cursor-pointer transition-colors"
              >
                + Add budget item
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCostSourceFilter('all');
                  setVarianceFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-white border border-zinc-300 text-zinc-700 text-xs font-bold hover:bg-zinc-100 cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* DESKTOP EXPENSE TABLE */}
            <div className="hidden md:block overflow-x-auto custom-scroll">
              <div className="min-w-[960px] flex flex-col gap-2.5">
                {/* Table Header */}
                <div className="grid grid-cols-12 px-4 py-2.5 text-xs font-bold tracking-wider uppercase text-zinc-500 bg-[#F3EFEA]/80 rounded-xl border border-[#E6E1DA] items-center">
                  <div className="col-span-3">CATEGORY &amp; ITEM</div>
                  <div className="col-span-2 text-right pr-2">ALLOCATED</div>
                  <div className="col-span-2 text-right pr-2">PROJECTED COST</div>
                  <div className="col-span-1 text-right pr-2">PAID</div>
                  <div className="col-span-2 text-center">DIFFERENCE</div>
                  <div className="col-span-2 text-right pr-2">COST SOURCE</div>
                </div>

                {/* Table Rows */}
                {filteredItems.map(item => {
                  const isOver = isOverAllocation(item.projectedCost, item.allocatedAmount);
                  const diff = calculateDifference(item.projectedCost, item.allocatedAmount);

                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setEditingItem(item)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setEditingItem(item);
                        }
                      }}
                      aria-label={`Edit ${item.itemName}, allocated ${formatINR(item.allocatedAmount)}, projected ${formatINR(item.projectedCost)}`}
                      className="grid grid-cols-12 items-center px-4 py-3.5 rounded-xl bg-white border border-[#E6E1DA] hover:border-[#3730a3] hover:shadow-sm focus:outline-hidden focus:ring-2 focus:ring-[#3730a3] transition-all cursor-pointer group"
                    >
                      {/* Column 1: Category & Item */}
                      <div className="col-span-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] text-[#3730a3] border border-[#C7D2FE] flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-[19px]">
                            {item.categoryName.toLowerCase().includes('venue') ? 'castle' :
                             item.categoryName.toLowerCase().includes('cater') || item.categoryName.toLowerCase().includes('food') ? 'restaurant' :
                             item.categoryName.toLowerCase().includes('decor') ? 'palette' :
                             item.categoryName.toLowerCase().includes('photo') ? 'photo_camera' :
                             item.categoryName.toLowerCase().includes('entertain') ? 'music_note' :
                             item.categoryName.toLowerCase().includes('transport') ? 'directions_car' : 'receipt'}
                          </span>
                        </div>
                        <div className="truncate">
                          <span className="text-sm font-bold text-zinc-900 block truncate group-hover:text-[#3730a3] transition-colors">
                            {item.itemName}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-bold text-zinc-600 bg-[#F3EFEA] px-1.5 py-0.2 rounded border border-[#E6E1DA]">
                              {item.categoryName}
                            </span>
                            {item.calculationModel === 'per_guest' && (
                              <span className="text-[10px] font-mono text-zinc-500">
                                {item.guestCount} × {formatINR(item.ratePerGuest)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Column 2: Allocated Budget */}
                      <div className="col-span-2 text-right pr-2 font-mono text-sm font-bold text-zinc-900">
                        {formatINR(item.allocatedAmount)}
                      </div>

                      {/* Column 3: Projected Cost */}
                      <div className="col-span-2 text-right pr-2 font-mono text-sm font-bold text-[#3730a3]">
                        {formatINR(item.projectedCost)}
                      </div>

                      {/* Column 4: Paid */}
                      <div className="col-span-1 text-right pr-2 font-mono text-sm font-medium text-zinc-700">
                        {formatINR(item.paidAmount || 0)}
                      </div>

                      {/* Column 5: Difference */}
                      <div className="col-span-2 flex justify-center">
                        {isOver ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="material-symbols-outlined text-[13px]">arrow_upward</span>
                            +{formatINR(diff)} Over
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="material-symbols-outlined text-[13px]">check</span>
                            {diff === 0 ? 'Exact Match' : `${formatINR(Math.abs(diff))} Under`}
                          </span>
                        )}
                      </div>

                      {/* Column 6: Cost Source & Actions */}
                      <div className="col-span-2 flex items-center justify-end gap-2 pr-1">
                        {getSourceBadge(item.costSource)}
                        <span className="material-symbols-outlined text-zinc-400 group-hover:text-[#3730a3] group-hover:translate-x-0.5 transition-all text-[18px]">
                          edit
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* MOBILE EXPENSE CARDS */}
            <div className="md:hidden flex flex-col gap-3">
              {filteredItems.map(item => {
                const isOver = isOverAllocation(item.projectedCost, item.allocatedAmount);
                const diff = calculateDifference(item.projectedCost, item.allocatedAmount);

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setEditingItem(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setEditingItem(item);
                      }
                    }}
                    aria-label={`Edit ${item.itemName}, allocated ${formatINR(item.allocatedAmount)}, projected ${formatINR(item.projectedCost)}`}
                    className="p-4 rounded-xl bg-white border border-[#E6E1DA] hover:border-[#3730a3] shadow-2xs flex flex-col gap-3 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#3730a3]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-[#F3EFEA] px-2 py-0.5 rounded border border-[#E6E1DA]">
                          {item.categoryName}
                        </span>
                        <h3 className="text-sm font-bold text-zinc-900 mt-1">{item.itemName}</h3>
                        {item.sourceNotes && (
                          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{item.sourceNotes}</p>
                        )}
                      </div>
                      <div className="shrink-0">
                        {getSourceBadge(item.costSource)}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-lg bg-zinc-50 border border-zinc-100 text-xs font-medium">
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase font-bold">Allocated</span>
                        <span className="font-mono font-bold text-zinc-900">{formatINR(item.allocatedAmount)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase font-bold">Projected</span>
                        <span className="font-mono font-bold text-[#3730a3]">{formatINR(item.projectedCost)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase font-bold">Paid</span>
                        <span className="font-mono font-bold text-zinc-700">{formatINR(item.paidAmount || 0)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100">
                      <div>
                        {isOver ? (
                          <span className="text-rose-700 font-bold inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">warning</span>
                            +{formatINR(diff)} Over allocation
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            {diff === 0 ? 'Exact allocation' : `${formatINR(Math.abs(diff))} Buffer`}
                          </span>
                        )}
                      </div>
                      <span className="text-[#3730a3] font-bold text-xs flex items-center gap-1">
                        Edit <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* 5. ADD BUDGET ITEM MODAL */}
      <BudgetItemModal
        isOpen={isAddModalOpen}
        mode="add"
        eventGuests={draft.totalGuests || 150}
        onSave={handleSaveItem}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* 6. EDIT BUDGET ITEM MODAL */}
      <BudgetItemModal
        isOpen={!!editingItem}
        mode="edit"
        initialItem={editingItem}
        eventGuests={draft.totalGuests || 150}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
        onClose={() => setEditingItem(null)}
      />
    </WorkspaceLayout>
  );
};
