/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WorkspaceLayout } from './WorkspaceLayout';
import { useEvent } from '../context/EventContext';
import { Vendor, VendorQuote, VendorStatus, EventPlan, BudgetItem } from '../types/plan';
import { formatINR } from '../utils/calculations';
import {
  persistVendor,
  removeVendor,
  persistQuote,
  removeQuote,
  applyQuoteToBudget
} from '../utils/storage';
import { AddVendorModal } from './AddVendorModal';
import { AddQuoteModal } from './AddQuoteModal';
import { QuoteComparisonWorkspace } from './QuoteComparisonWorkspace';
import {
  Building2,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Zap,
  Search,
  Filter,
  Phone,
  User,
  Link as LinkIcon,
  Edit2,
  Trash2,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export const VendorStudio: React.FC = () => {
  const { draft, plan, setPlan, openReplan } = useEvent();

  const vendors: Vendor[] = plan.vendors || [];
  const quotes: VendorQuote[] = plan.quotes || [];
  const budgetItems: BudgetItem[] = plan.budgetItems || [];
  const timelineTasks = plan.timelineTasks || [];
  const totalGuests = plan.guestSummary?.totalGuests || draft.totalGuests || 150;
  const priorities = draft.priorities || [];

  const [isAddVendorOpen, setIsAddVendorOpen] = useState<boolean>(false);
  const [vendorToEdit, setVendorToEdit] = useState<Vendor | null>(null);
  const [isAddQuoteOpen, setIsAddQuoteOpen] = useState<boolean>(false);
  const [quoteVendorInitialId, setQuoteVendorInitialId] = useState<string | undefined>(undefined);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);

  // Filters state for 35% pane
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Active Category for 65% comparison pane
  const [selectedComparisonCategory, setSelectedComparisonCategory] = useState<string>('Catering');

  // KPI Calculations
  const totalVendors = vendors.length;
  const activeQuotesCount = quotes.length;
  const needsClarificationCount = quotes.filter((q: VendorQuote) => {
    const a = q.extractedAnalysis;
    return (
      a?.taxAndTerms?.taxesIncluded === 'NOT_STATED' ||
      (a?.missingInformation && a.missingInformation.length > 0)
    );
  }).length;
  const bookedVendors = vendors.filter((v: Vendor) => v.status === 'booked');
  const bookedCommittedSpend = quotes
    .filter((q: VendorQuote) => q.reviewStatus === 'accepted')
    .reduce((sum: number, q: VendorQuote) => sum + q.quotedTotal, 0);

  // Filter vendors in pipeline
  const filteredVendors = vendors.filter((v: Vendor) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      Boolean(v.contactPerson && v.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || v.category.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Handlers
  const handleSaveVendor = (vendor: Vendor) => {
    const updatedPlan = persistVendor(vendor, draft);
    setPlan(updatedPlan);
  };

  const handleDeleteVendor = (vendorId: string) => {
    const updatedPlan = removeVendor(vendorId, draft);
    setPlan(updatedPlan);
    setVendorToDelete(null);
  };

  const handleSaveQuote = (quote: VendorQuote) => {
    const updatedPlan = persistQuote(quote, draft);
    setPlan(updatedPlan);
    setSelectedComparisonCategory(quote.category);
  };

  const handleApplyToBudget = (quoteId: string, budgetItemId: string) => {
    const updatedPlan = applyQuoteToBudget(quoteId, budgetItemId, draft);
    setPlan(updatedPlan);
  };

  const handleUpdateQuoteAnalysis = (quoteId: string, updatedQuote: VendorQuote) => {
    const updatedPlan = persistQuote(updatedQuote, draft);
    setPlan(updatedPlan);
  };

  const openNewQuoteForVendor = (vendor: Vendor) => {
    setQuoteVendorInitialId(vendor.id);
    setSelectedComparisonCategory(vendor.category);
    setIsAddQuoteOpen(true);
  };

  // Status badge styling helper
  const getStatusBadge = (status: VendorStatus) => {
    switch (status) {
      case 'booked':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'quote_received':
        return 'bg-indigo-50 text-[#3730a3] border-indigo-200';
      case 'shortlisted':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'negotiating':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'rejected':
        return 'bg-zinc-100 text-zinc-500 border-zinc-200';
      case 'contacted':
      default:
        return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  return (
    <WorkspaceLayout activeTab="vendors">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-semibold text-[#3730a3] uppercase tracking-wider">
            VENDOR STUDIO &amp; QUOTATION AUDIT
          </span>
          <h1 className="font-['Fraunces',serif] text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight mt-1">
            Vendor Studio
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Track vendor pipelines, audit quotation terms for unstated taxes &amp; hidden charges, and commit verified quotes to your budget.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openReplan}
            className="px-3.5 py-2 text-xs font-bold text-[#3730a3] bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            Simulate Rebalance
          </button>
          <button
            type="button"
            onClick={() => {
              setVendorToEdit(null);
              setIsAddVendorOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Vendor
          </button>
          <button
            type="button"
            onClick={() => {
              setQuoteVendorInitialId(undefined);
              setIsAddQuoteOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-[#3730a3] hover:bg-[#2e2882] rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <Receipt className="w-3.5 h-3.5" />
            Add Quotation
          </button>
        </div>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Vendors Tracked */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-zinc-600 mb-2">
              <span>Vendors Tracked</span>
              <Building2 className="w-4 h-4 text-[#3730a3]" />
            </div>
            <div className="font-mono text-2xl font-bold text-zinc-900">
              {totalVendors}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-100 text-xs text-zinc-500 font-medium">
            Across {new Set(vendors.map((v: Vendor) => v.category)).size} event categories
          </div>
        </div>

        {/* KPI 2: Quotes Under Review */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-zinc-600 mb-2">
              <span>Proposals Audited</span>
              <Receipt className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="font-mono text-2xl font-bold text-zinc-900">
              {activeQuotesCount}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-100 text-xs text-zinc-500 font-medium">
            {quotes.filter((q: VendorQuote) => q.reviewStatus === 'analyzed').length} forensic audits ready
          </div>
        </div>

        {/* KPI 3: Needs Clarification */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-zinc-600 mb-2">
              <span>Needs Clarification</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="font-mono text-2xl font-bold text-amber-900">
              {needsClarificationCount}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-100 text-xs text-amber-700 font-medium">
            Quotes with missing GST or terms
          </div>
        </div>

        {/* KPI 4: Bookings Recorded */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-zinc-600 mb-2">
              <span>Bookings Confirmed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="font-mono text-2xl font-bold text-zinc-900">
              {bookedVendors.length}{' '}
              <span className="text-xs font-normal text-zinc-400">
                ({formatINR(bookedCommittedSpend)})
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-100 text-xs text-emerald-800 font-medium">
            Applied to budget projected spend
          </div>
        </div>
      </div>

      {/* Main Split-Screen Workspace (35% Left / 65% Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: 35% Vendor Pipeline Directory */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <div>
              <h2 className="font-bold text-zinc-900 text-base">Vendor Directory</h2>
              <p className="text-xs text-zinc-500">Pipeline contacts &amp; status</p>
            </div>
            <span className="text-xs font-mono font-bold text-[#3730a3]">
              {filteredVendors.length} Active
            </span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendors or contacts..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3]"
            />
          </div>

          {/* Status & Category Quick Filter Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {['All', 'contacted', 'shortlisted', 'quote_received', 'booked'].map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-[#3730a3] text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {st === 'All' ? 'All Status' : st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Vendor Cards List */}
          <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
            {filteredVendors.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 border border-dashed border-zinc-200 rounded-xl">
                No vendors found matching your filter criteria.
              </div>
            ) : (
              filteredVendors.map((vendor: Vendor) => {
                const vendorQuotes = quotes.filter((q: VendorQuote) => q.vendorId === vendor.id);
                const linkedBudget = budgetItems.find((b: BudgetItem) => b.id === vendor.linkedBudgetItemId);
                const isCurrentCategory = selectedComparisonCategory.toLowerCase() === vendor.category.toLowerCase();

                return (
                  <div
                    key={vendor.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrentCategory
                        ? 'border-indigo-300 bg-indigo-50/20 shadow-xs'
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                    } flex flex-col justify-between space-y-3`}
                  >
                    <div>
                      {/* Top Row: Name, Category, Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold text-[#3730a3] uppercase">
                              {vendor.category}
                            </span>
                          </div>
                          <h3 className="font-bold text-zinc-900 text-sm mt-0.5 font-['Fraunces',serif]">
                            {vendor.name}
                          </h3>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getStatusBadge(vendor.status)}`}>
                          {vendor.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Contact & Phone */}
                      {(vendor.contactPerson || vendor.phone) && (
                        <div className="flex items-center gap-3 text-xs text-zinc-600 mt-2">
                          {vendor.contactPerson && (
                            <span className="flex items-center gap-1 truncate">
                              <User className="w-3 h-3 text-zinc-400" />
                              {vendor.contactPerson}
                            </span>
                          )}
                          {vendor.phone && (
                            <span className="flex items-center gap-1 font-mono text-[11px] truncate">
                              <Phone className="w-3 h-3 text-zinc-400" />
                              {vendor.phone}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Linked Plan Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        {linkedBudget && (
                          <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-[10px] font-mono flex items-center gap-1 border border-zinc-200 truncate max-w-[200px]" title={linkedBudget.itemName}>
                            <LinkIcon className="w-2.5 h-2.5 text-[#3730a3]" />
                            {linkedBudget.itemName}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-[#3730a3] text-[10px] font-mono font-bold border border-indigo-200">
                          {vendorQuotes.length} Quote{vendorQuotes.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setVendorToEdit(vendor);
                            setIsAddVendorOpen(true);
                          }}
                          className="text-zinc-400 hover:text-zinc-700 p-1 rounded hover:bg-zinc-100 transition-colors"
                          title="Edit vendor profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setVendorToDelete(vendor)}
                          className="text-zinc-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                          title="Delete vendor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openNewQuoteForVendor(vendor)}
                          className="text-[11px] font-semibold text-[#3730a3] hover:underline flex items-center gap-0.5 ml-1"
                        >
                          + Quote
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedComparisonCategory(vendor.category)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-zinc-700 bg-zinc-100 hover:bg-[#3730a3] hover:text-white transition-all flex items-center gap-1"
                      >
                        Compare
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: 65% Quote Comparison Workspace */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
          <QuoteComparisonWorkspace
            quotes={quotes}
            vendors={vendors}
            budgetItems={budgetItems}
            totalGuests={totalGuests}
            priorities={priorities}
            selectedCategory={selectedComparisonCategory}
            onSelectCategory={(cat) => setSelectedComparisonCategory(cat)}
            onOpenAddQuote={() => {
              setQuoteVendorInitialId(undefined);
              setIsAddQuoteOpen(true);
            }}
            onApplyToBudget={handleApplyToBudget}
            onUpdateQuoteAnalysis={handleUpdateQuoteAnalysis}
          />
        </div>
      </div>

      {/* Add / Edit Vendor Modal */}
      <AddVendorModal
        isOpen={isAddVendorOpen}
        vendorToEdit={vendorToEdit}
        budgetItems={budgetItems}
        timelineTasks={timelineTasks}
        onSave={handleSaveVendor}
        onClose={() => {
          setIsAddVendorOpen(false);
          setVendorToEdit(null);
        }}
      />

      {/* Add Quotation Modal */}
      <AddQuoteModal
        isOpen={isAddQuoteOpen}
        vendors={vendors}
        budgetItems={budgetItems}
        totalGuests={totalGuests}
        initialVendorId={quoteVendorInitialId}
        onSave={handleSaveQuote}
        onClose={() => {
          setIsAddQuoteOpen(false);
          setQuoteVendorInitialId(undefined);
        }}
      />

      {/* Delete Vendor Confirmation Modal */}
      {vendorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 max-w-sm w-full p-6 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-zinc-900 text-base">Delete {vendorToDelete.name}?</h3>
              <p className="text-xs text-zinc-500 mt-1">
                This will also remove any associated quotations. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVendorToDelete(null)}
                className="w-full px-4 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteVendor(vendorToDelete.id)}
                className="w-full px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors"
              >
                Delete Vendor
              </button>
            </div>
          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
};
