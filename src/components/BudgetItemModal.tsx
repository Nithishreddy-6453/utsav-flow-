/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { BudgetItem, CostCalculationModel, CostSource } from '../types/plan';
import { calculateProjectedCost, formatINR, isOverAllocation } from '../utils/calculations';
import { BudgetItemFormSchema } from '../schemas/budget';

interface BudgetItemModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  initialItem?: BudgetItem | null;
  eventGuests: number;
  onSave: (item: BudgetItem) => void;
  onDelete?: (itemId: string) => void;
  onClose: () => void;
}

const PREDEFINED_CATEGORIES = [
  'Venue',
  'Catering & Food',
  'Decoration & Lighting',
  'Photography & Videography',
  'Entertainment',
  'Transport',
  'Guest Accommodation',
  'Invitations',
  'Miscellaneous',
  'Custom...'
];

export const BudgetItemModal: React.FC<BudgetItemModalProps> = ({
  isOpen,
  mode,
  initialItem,
  eventGuests,
  onSave,
  onDelete,
  onClose
}) => {
  const [categorySelect, setCategorySelect] = useState<string>('Venue');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [itemName, setItemName] = useState<string>('');
  const [calculationModel, setCalculationModel] = useState<CostCalculationModel>('fixed');
  const [fixedAmount, setFixedAmount] = useState<number | string>(100000);
  const [ratePerGuest, setRatePerGuest] = useState<number | string>(1200);
  const [guestCount, setGuestCount] = useState<number | string>(eventGuests || 150);
  const [allocatedAmount, setAllocatedAmount] = useState<number | string>(100000);
  const [costSource, setCostSource] = useState<CostSource>('user_estimate');
  const [quotationReference, setQuotationReference] = useState<string>('');
  const [sourceNotes, setSourceNotes] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset form state
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialItem) {
        const isPredefined = PREDEFINED_CATEGORIES.includes(initialItem.categoryName);
        if (isPredefined && initialItem.categoryName !== 'Custom...') {
          setCategorySelect(initialItem.categoryName);
          setCustomCategory('');
        } else {
          setCategorySelect('Custom...');
          setCustomCategory(initialItem.categoryName);
        }
        setItemName(initialItem.itemName);
        setCalculationModel(initialItem.calculationModel);
        setFixedAmount(initialItem.fixedAmount);
        setRatePerGuest(initialItem.ratePerGuest);
        setGuestCount(initialItem.guestCount || eventGuests || 150);
        setAllocatedAmount(initialItem.allocatedAmount);
        setCostSource(initialItem.costSource);
        setQuotationReference(initialItem.quotationReference || '');
        setSourceNotes(initialItem.sourceNotes || '');
      } else {
        // Add mode defaults
        setCategorySelect('Venue');
        setCustomCategory('');
        setItemName('');
        setCalculationModel('fixed');
        setFixedAmount('');
        setRatePerGuest(800);
        setGuestCount(eventGuests || 150);
        setAllocatedAmount('');
        setCostSource('user_estimate');
        setQuotationReference('');
        setSourceNotes('');
      }
      setErrors({});
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
      setIsDirty(false);

      // Focus first input on mount
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, mode, initialItem, eventGuests]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        handleSafeClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDirty]);

  if (!isOpen) return null;

  // Reactive projected cost calculation
  const computedProjectedCost = calculateProjectedCost(
    calculationModel,
    Number(fixedAmount) || 0,
    Number(ratePerGuest) || 0,
    Number(guestCount) || 0
  );

  const numAllocated = Number(allocatedAmount) || 0;
  const isOver = isOverAllocation(computedProjectedCost, numAllocated);
  const variance = computedProjectedCost - numAllocated;

  const resolvedCategory = categorySelect === 'Custom...' ? customCategory.trim() : categorySelect;

  const handleSafeClose = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Discard them and close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate fields with Zod
    const formPayload = {
      categoryName: resolvedCategory,
      itemName: itemName.trim(),
      calculationModel,
      fixedAmount: Number(fixedAmount) || 0,
      ratePerGuest: Number(ratePerGuest) || 0,
      guestCount: Number(guestCount) || 1,
      allocatedAmount: Number(allocatedAmount) || 0,
      costSource,
      sourceNotes: sourceNotes.trim(),
      quotationReference: quotationReference.trim()
    };

    const result = BudgetItemFormSchema.safeParse(formPayload);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(err => {
        const path = err.path[0] as string;
        fieldErrors[path] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const categoryId = resolvedCategory.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const itemToSave: BudgetItem = {
        id: mode === 'edit' && initialItem ? initialItem.id : `bi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        categoryId,
        categoryName: resolvedCategory,
        itemName: itemName.trim(),
        calculationModel,
        fixedAmount: Number(fixedAmount) || 0,
        ratePerGuest: Number(ratePerGuest) || 0,
        guestCount: Number(guestCount) || 1,
        allocatedAmount: Number(allocatedAmount) || 0,
        projectedCost: computedProjectedCost,
        paidAmount: mode === 'edit' && initialItem ? (initialItem.paidAmount || 0) : 0,
        costSource,
        sourceNotes: sourceNotes.trim() || undefined,
        quotationReference: quotationReference.trim() || undefined,
        createdAt: mode === 'edit' && initialItem ? initialItem.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      onSave(itemToSave);
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save budget item. Please check your inputs.' });
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (mode === 'edit' && initialItem && onDelete) {
      onDelete(initialItem.id);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className="relative w-full max-w-[660px] bg-white rounded-2xl shadow-2xl border border-[#E6E1DA] overflow-hidden flex flex-col max-h-[90vh] my-auto"
      >
        {/* MODAL HEADER */}
        <header className="flex items-start justify-between px-6 py-5 border-b border-[#E6E1DA] bg-white">
          <div>
            <h2 id="modal-title" className="font-['Fraunces',serif] text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
              {mode === 'add' ? 'Add budget item' : 'Edit budget item'}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              {mode === 'add' 
                ? 'Add an expense and estimate how much it will cost.' 
                : 'Update pricing calculation, allocations, and cost source.'}
            </p>
          </div>
          <button 
            onClick={handleSafeClose}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
            type="button"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </header>

        {/* MODAL BODY (Scrollable) */}
        <form id="budget-item-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
          {errors.form && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errors.form}</span>
            </div>
          )}

          {/* SECTION 1: Expense Details */}
          <section className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-100 pb-1">
              Section 1 · Expense Details
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category-select" className="block font-bold text-zinc-800 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  id="category-select"
                  value={categorySelect}
                  onChange={(e) => {
                    setCategorySelect(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-[#C8C1B6] bg-white text-zinc-900 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3730a3]"
                >
                  {PREDEFINED_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {categorySelect === 'Custom...' && (
                <div>
                  <label htmlFor="custom-category" className="block font-bold text-zinc-800 mb-1">
                    Custom Category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="custom-category"
                    type="text"
                    value={customCategory}
                    onChange={(e) => {
                      setCustomCategory(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="e.g. Wedding Stationery"
                    className="w-full h-10 px-3 rounded-lg border border-[#C8C1B6] bg-white text-zinc-900 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3730a3]"
                  />
                  {errors.categoryName && <p className="text-rose-600 text-xs mt-1">{errors.categoryName}</p>}
                </div>
              )}

              <div className={categorySelect === 'Custom...' ? 'sm:col-span-2' : ''}>
                <label htmlFor="item-name" className="block font-bold text-zinc-800 mb-1">
                  Item Name <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={firstInputRef}
                  id="item-name"
                  type="text"
                  value={itemName}
                  onChange={(e) => {
                    setItemName(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. Grand Ballroom Rental"
                  className="w-full h-10 px-3 rounded-lg border border-[#C8C1B6] bg-white text-zinc-900 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3730a3]"
                />
                {errors.itemName && <p className="text-rose-600 text-xs mt-1">{errors.itemName}</p>}
              </div>
            </div>
          </section>

          {/* SECTION 2: Cost Calculation */}
          <section className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-100 pb-1">
              Section 2 · Cost Calculation Model
            </div>

            {/* Model Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-[#F3EFEA] rounded-xl border border-[#E6E1DA]">
              <button
                type="button"
                onClick={() => {
                  setCalculationModel('fixed');
                  setIsDirty(true);
                }}
                className={`py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                  calculationModel === 'fixed'
                    ? 'bg-white text-[#3730a3] shadow-xs border border-zinc-200'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Fixed Cost
              </button>
              <button
                type="button"
                onClick={() => {
                  setCalculationModel('per_guest');
                  setIsDirty(true);
                }}
                className={`py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                  calculationModel === 'per_guest'
                    ? 'bg-white text-[#3730a3] shadow-xs border border-zinc-200'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Per Guest
              </button>
              <button
                type="button"
                onClick={() => {
                  setCalculationModel('fixed_plus_per_guest');
                  setIsDirty(true);
                }}
                className={`py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                  calculationModel === 'fixed_plus_per_guest'
                    ? 'bg-white text-[#3730a3] shadow-xs border border-zinc-200'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Fixed + Per Guest
              </button>
            </div>

            {/* Model Dynamic Fields */}
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
              {calculationModel === 'fixed' && (
                <div>
                  <label htmlFor="fixed-amount" className="block font-bold text-zinc-800 mb-1">
                    Total Projected Cost (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="fixed-amount"
                    type="number"
                    min="0"
                    step="1000"
                    value={fixedAmount}
                    onChange={(e) => {
                      setFixedAmount(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="e.g. 150000"
                    className="w-full h-10 px-3 rounded-lg border border-[#C8C1B6] bg-white text-zinc-900 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#3730a3]"
                  />
                  {errors.fixedAmount && <p className="text-rose-600 text-xs mt-1">{errors.fixedAmount}</p>}
                </div>
              )}

              {calculationModel === 'per_guest' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="rate-per-guest" className="block font-bold text-zinc-800 mb-1">
                      Rate per Guest (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="rate-per-guest"
                      type="number"
                      min="0"
                      step="50"
                      value={ratePerGuest}
                      onChange={(e) => {
                        setRatePerGuest(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="e.g. 1200"
                      className="w-full h-10 px-3 rounded-lg border border-[#C8C1B6] bg-white text-zinc-900 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#3730a3]"
                    />
                    {errors.ratePerGuest && <p className="text-rose-600 text-xs mt-1">{errors.ratePerGuest}</p>}
                  </div>
                  <div>
                    <label htmlFor="guest-count" className="block font-bold text-zinc-800 mb-1">
                      Expected Guest Count <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="guest-count"
                      type="number"
                      min="1"
                      value={guestCount}
                      onChange={(e) => {
                        setGuestCount(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full h-10 px-3 rounded-lg border border-[#C8C1B6] bg-white text-zinc-900 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#3730a3]"
                    />
                    {errors.guestCount && <p className="text-rose-600 text-xs mt-1">{errors.guestCount}</p>}
                  </div>
                </div>
              )}

              {calculationModel === 'fixed_plus_per_guest' && (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="fixed-base" className="block font-bold text-zinc-800 mb-1">
                      Fixed Base Setup Amount (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="fixed-base"
                      type="number"
                      min="0"
                      step="1000"
                      value={fixedAmount}
                      onChange={(e) => {
                        setFixedAmount(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="e.g. 50000"
                      className="w-full h-10 px-3 rounded-lg border border-[#C8C1B6] bg-white text-zinc-900 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#3730a3]"
                    />
                    {errors.fixedAmount && <p className="text-rose-600 text-xs mt-1">{errors.fixedAmount}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="rate-per-guest-combo" className="block font-bold text-zinc-800 mb-1">
                        Rate per Guest (₹) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="rate-per-guest-combo"
                        type="number"
                        min="0"
                        step="50"
                        value={ratePerGuest}
                        onChange={(e) => {
                          setRatePerGuest(e.target.value);
                          setIsDirty(true);
                        }}
                        placeholder="e.g. 400"
                        className="w-full h-10 px-3 rounded-lg border border-[#C8C1B6] bg-white text-zinc-900 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#3730a3]"
                      />
                      {errors.ratePerGuest && <p className="text-rose-600 text-xs mt-1">{errors.ratePerGuest}</p>}
                    </div>
                    <div>
                      <label htmlFor="guest-count-combo" className="block font-bold text-zinc-800 mb-1">
                        Expected Guest Count <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="guest-count-combo"
                        type="number"
                        min="1"
                        value={guestCount}
                        onChange={(e) => {
                          setGuestCount(e.target.value);
                          setIsDirty(true);
                        }}
                        className="w-full h-10 px-3 rounded-lg border border-[#C8C1B6] bg-white text-zinc-900 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#3730a3]"
                      />
                      {errors.guestCount && <p className="text-rose-600 text-xs mt-1">{errors.guestCount}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Reactive Projected Cost Banner */}
              <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-xs font-bold text-zinc-800">
                <span>Calculated Projected Cost:</span>
                <span className="font-mono text-sm text-[#3730a3] bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {formatINR(computedProjectedCost)}
                </span>
              </div>
            </div>
          </section>

          {/* SECTION 3: Allocated Budget */}
          <section className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-100 pb-1">
              Section 3 · Allocated Budget
            </div>

            <div>
              <label htmlFor="allocated-amount" className="block font-bold text-zinc-800 mb-1">
                Allocated Budget Envelope (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                id="allocated-amount"
                type="number"
                min="0"
                step="1000"
                value={allocatedAmount}
                onChange={(e) => {
                  setAllocatedAmount(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="e.g. 120000"
                className="w-full h-10 px-3 rounded-lg border border-[#C8C1B6] bg-white text-zinc-900 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#3730a3]"
              />
              {errors.allocatedAmount && <p className="text-rose-600 text-xs mt-1">{errors.allocatedAmount}</p>}
            </div>

            {/* Difference & Variance Indicator */}
            {numAllocated > 0 && (
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                isOver 
                  ? 'bg-rose-50 border-rose-200 text-rose-900' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[17px]">
                    {isOver ? 'warning' : 'check_circle'}
                  </span>
                  <span>
                    {isOver 
                      ? `Projected cost exceeds allocation by ${formatINR(variance)}` 
                      : `Within allocation (Buffer: ${formatINR(Math.abs(variance))})`}
                  </span>
                </div>
                <span className="font-mono font-bold">
                  {isOver ? `+${formatINR(variance)}` : `-${formatINR(Math.abs(variance))}`}
                </span>
              </div>
            )}
          </section>

          {/* SECTION 4: Cost Source */}
          <section className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-100 pb-1">
              Section 4 · Cost Source &amp; Provenance
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className={`p-3 rounded-xl border cursor-pointer flex flex-col gap-1 transition-all ${
                costSource === 'user_estimate'
                  ? 'bg-indigo-50/50 border-[#3730a3] ring-1 ring-[#3730a3]'
                  : 'bg-white border-zinc-200 hover:border-zinc-300'
              }`}>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="costSource"
                    value="user_estimate"
                    checked={costSource === 'user_estimate'}
                    onChange={() => {
                      setCostSource('user_estimate');
                      setIsDirty(true);
                    }}
                    className="accent-[#3730a3]"
                  />
                  <span className="font-bold text-zinc-900 text-xs sm:text-sm">My Estimate</span>
                </div>
                <span className="text-[11px] text-zinc-500 pl-5">User-entered approximate cost</span>
              </label>

              <label className={`p-3 rounded-xl border cursor-pointer flex flex-col gap-1 transition-all ${
                costSource === 'vendor_quote'
                  ? 'bg-indigo-50/50 border-[#3730a3] ring-1 ring-[#3730a3]'
                  : 'bg-white border-zinc-200 hover:border-zinc-300'
              }`}>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="costSource"
                    value="vendor_quote"
                    checked={costSource === 'vendor_quote'}
                    onChange={() => {
                      setCostSource('vendor_quote');
                      setIsDirty(true);
                    }}
                    className="accent-[#3730a3]"
                  />
                  <span className="font-bold text-zinc-900 text-xs sm:text-sm">Vendor Quotation</span>
                </div>
                <span className="text-[11px] text-zinc-500 pl-5">Received from vendor / proposal</span>
              </label>
            </div>

            {costSource === 'vendor_quote' && (
              <div>
                <label htmlFor="quotation-ref" className="block font-bold text-zinc-800 mb-1">
                  Vendor Name or Quotation Ref
                </label>
                <input
                  id="quotation-ref"
                  type="text"
                  value={quotationReference}
                  onChange={(e) => {
                    setQuotationReference(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. Royal Caterers Quote #204"
                  className="w-full h-10 px-3 rounded-lg border border-[#C8C1B6] bg-white text-zinc-900 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3730a3]"
                />
              </div>
            )}
          </section>

          {/* SECTION 5: Notes */}
          <section className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-100 pb-1">
              Section 5 · Planning Notes
            </div>

            <div>
              <label htmlFor="source-notes" className="block font-bold text-zinc-800 mb-1">
                Assumptions, Inclusions or Restrictions (Optional)
              </label>
              <textarea
                id="source-notes"
                rows={2}
                value={sourceNotes}
                onChange={(e) => {
                  setSourceNotes(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="e.g. Includes setup, teardown and air conditioning power backup"
                className="w-full p-3 rounded-lg border border-[#C8C1B6] bg-white text-zinc-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#3730a3]"
              />
            </div>
          </section>
        </form>

        {/* MODAL FOOTER */}
        <footer className="px-6 py-4 bg-[#F3EFEA] border-t border-[#E6E1DA] flex items-center justify-between gap-3">
          {mode === 'edit' && onDelete ? (
            <div>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-rose-700">Delete permanently?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-zinc-300 text-zinc-700 text-xs font-bold cursor-pointer hover:bg-zinc-100"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[17px]">delete</span>
                  <span>Delete item</span>
                </button>
              )}
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={handleSafeClose}
              className="px-4 py-2.5 rounded-lg border border-[#C8C1B6] bg-white hover:bg-zinc-100 text-zinc-800 text-xs sm:text-sm font-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              form="budget-item-form"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-lg bg-[#3730a3] hover:bg-[#312E81] text-white text-xs sm:text-sm font-bold shadow-sm active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    {mode === 'add' ? 'add' : 'check'}
                  </span>
                  <span>{mode === 'add' ? 'Save item' : 'Save changes'}</span>
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
