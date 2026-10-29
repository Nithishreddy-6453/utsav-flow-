/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Vendor, VendorQuote, BudgetItem, QuotePricingModel } from '../types/plan';
import { QuoteFormSchema } from '../schemas/vendor';
import { analyzeQuoteDeterministically } from '../utils/quoteAnalysis';
import { X, Receipt, FileCode, IndianRupee, AlertCircle } from 'lucide-react';

interface AddQuoteModalProps {
  isOpen: boolean;
  vendors: Vendor[];
  budgetItems: BudgetItem[];
  totalGuests: number;
  initialVendorId?: string;
  onSave: (quote: VendorQuote) => void;
  onClose: () => void;
}

export const AddQuoteModal: React.FC<AddQuoteModalProps> = ({
  isOpen,
  vendors,
  budgetItems,
  totalGuests,
  initialVendorId,
  onSave,
  onClose
}) => {
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [quotedTotal, setQuotedTotal] = useState<string>('');
  const [pricingModel, setPricingModel] = useState<QuotePricingModel>('lump_sum');
  const [ratePerGuest, setRatePerGuest] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>('');
  const [linkedBudgetItemId, setLinkedBudgetItemId] = useState<string>('');
  const [rawQuoteText, setRawQuoteText] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const rawInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      const defaultVendor = initialVendorId 
        ? vendors.find(v => v.id === initialVendorId) 
        : vendors[0];

      setSelectedVendorId(defaultVendor?.id || '');
      setTitle('');
      setQuotedTotal('');
      setPricingModel('lump_sum');
      setRatePerGuest('');
      setValidUntil('');
      setLinkedBudgetItemId(defaultVendor?.linkedBudgetItemId || '');
      setRawQuoteText('');
      setErrors({});

      setTimeout(() => rawInputRef.current?.focus(), 50);
    }
  }, [isOpen, initialVendorId, vendors]);

  // When vendor changes, sync category & linked budget item
  const selectedVendor = vendors.find(v => v.id === selectedVendorId);

  // Auto-calculate rate per guest or total if per_guest model is selected
  const handleModelChange = (model: QuotePricingModel) => {
    setPricingModel(model);
    if (model === 'per_guest' && quotedTotal && totalGuests > 0 && !ratePerGuest) {
      setRatePerGuest(String(Math.round(Number(quotedTotal) / totalGuests)));
    }
  };

  const handleRatePerGuestChange = (val: string) => {
    setRatePerGuest(val);
    if (pricingModel === 'per_guest' && val && totalGuests > 0) {
      setQuotedTotal(String(Math.round(Number(val) * totalGuests)));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!selectedVendor) {
      setErrors({ vendorId: 'Please select a vendor or create one first' });
      return;
    }

    const totalNum = Number(quotedTotal);
    const guestRateNum = ratePerGuest ? Number(ratePerGuest) : undefined;

    const payload = {
      vendorId: selectedVendor.id,
      vendorName: selectedVendor.name,
      category: selectedVendor.category,
      title: title.trim() || `${selectedVendor.name} Proposal`,
      rawQuoteText: rawQuoteText.trim(),
      quotedTotal: isNaN(totalNum) ? 0 : totalNum,
      pricingModel,
      ratePerGuest: guestRateNum,
      validUntil: validUntil || undefined,
      linkedBudgetItemId: linkedBudgetItemId || undefined
    };

    const result = QuoteFormSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        const path = issue.path[0] as string;
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const newQuote: VendorQuote = {
      id: `quote_${Date.now()}`,
      vendorId: result.data.vendorId,
      vendorName: result.data.vendorName,
      category: result.data.category,
      title: result.data.title,
      rawQuoteText: result.data.rawQuoteText,
      quotedTotal: result.data.quotedTotal,
      pricingModel: result.data.pricingModel,
      ratePerGuest: result.data.ratePerGuest,
      validUntil: result.data.validUntil || undefined,
      reviewStatus: 'analyzed',
      linkedBudgetItemId: result.data.linkedBudgetItemId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Analyze immediately with deterministic parser
    newQuote.extractedAnalysis = analyzeQuoteDeterministically(newQuote, totalGuests || 150);

    onSave(newQuote);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-zinc-200 max-w-xl w-full overflow-hidden my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 id="quote-modal-title" className="text-base font-bold text-zinc-900 font-['Fraunces',serif]">
                Record Vendor Quotation
              </h2>
              <p className="text-xs text-zinc-500">Paste raw estimate text to extract facts, taxes, and hidden clauses</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Vendor Picker */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Select Vendor <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedVendorId}
              onChange={(e) => {
                setSelectedVendorId(e.target.value);
                const v = vendors.find(x => x.id === e.target.value);
                if (v?.linkedBudgetItemId) {
                  setLinkedBudgetItemId(v.linkedBudgetItemId);
                }
              }}
              className={`w-full px-3 py-2 text-sm rounded-xl border ${
                errors.vendorId ? 'border-rose-400 bg-rose-50/30' : 'border-zinc-300'
              } focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] bg-white font-medium`}
            >
              {vendors.length === 0 ? (
                <option value="">No vendors found — please add a vendor first</option>
              ) : (
                vendors.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.category}) — [{v.status}]
                  </option>
                ))
              )}
            </select>
            {errors.vendorId && <p className="mt-1 text-xs text-rose-600">{errors.vendorId}</p>}
          </div>

          {/* Proposal Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Proposal / Package Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Heritage Buffet & Live Counters, Full Day Candid + Cinematic"
              className={`w-full px-3 py-2 text-sm rounded-xl border ${
                errors.title ? 'border-rose-400 bg-rose-50/30' : 'border-zinc-300'
              } focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3]`}
            />
            {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title}</p>}
          </div>

          {/* Pricing Model & Quoted Total */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Pricing Structure
              </label>
              <select
                value={pricingModel}
                onChange={(e) => handleModelChange(e.target.value as QuotePricingModel)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] bg-white"
              >
                <option value="lump_sum">Lump Sum Total</option>
                <option value="per_guest">Per Guest Rate</option>
                <option value="hybrid">Hybrid (Fixed + Per Guest)</option>
                <option value="itemized">Itemized Schedule</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-zinc-400" />
                Sticker Quoted Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={quotedTotal}
                onChange={(e) => setQuotedTotal(e.target.value)}
                placeholder="e.g. 240000"
                className={`w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border ${
                  errors.quotedTotal ? 'border-rose-400 bg-rose-50/30' : 'border-zinc-300'
                } focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3]`}
              />
              {errors.quotedTotal && <p className="mt-1 text-xs text-rose-600">{errors.quotedTotal}</p>}
            </div>
          </div>

          {/* Per-Guest Rate (if per_guest or hybrid) */}
          {(pricingModel === 'per_guest' || pricingModel === 'hybrid') && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Rate Per Guest (₹)
              </label>
              <input
                type="number"
                min="0"
                value={ratePerGuest}
                onChange={(e) => handleRatePerGuestChange(e.target.value)}
                placeholder={`e.g. 1500 (calculated for ${totalGuests} guests)`}
                className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3]"
              />
            </div>
          )}

          {/* Valid Until & Linked Budget Item */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Quotation Valid Until
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Link to Budget Item
              </label>
              <select
                value={linkedBudgetItemId}
                onChange={(e) => setLinkedBudgetItemId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] bg-white"
              >
                <option value="">-- Unassigned --</option>
                {budgetItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.categoryName} → {item.itemName} (₹{item.allocatedAmount.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Raw Quote Text (Strict Grounding) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
                <FileCode className="w-3.5 h-3.5 text-[#3730a3]" />
                Raw Quotation Text / Transcript <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-zinc-400 font-mono">Unedited Source Copy</span>
            </div>
            <textarea
              ref={rawInputRef}
              rows={6}
              value={rawQuoteText}
              onChange={(e) => setRawQuoteText(e.target.value)}
              placeholder="Paste email proposal, WhatsApp messages, or itemized schedule here...
e.g.:
- 3 starters, 2 live counters, 4 main courses
- Bone china cutlery & service staff included
- Taxes extra (GST 18% applies)
- Advance 50% on booking"
              className={`w-full p-3 text-xs font-mono rounded-xl border ${
                errors.rawQuoteText ? 'border-rose-400 bg-rose-50/30' : 'border-zinc-300'
              } focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] leading-relaxed`}
            />
            {errors.rawQuoteText && <p className="mt-1 text-xs text-rose-600">{errors.rawQuoteText}</p>}
            <p className="mt-1 text-[11px] text-zinc-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
              Raw quote text is audited for unstated taxes, missing power/fuel, and cancellation fees.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#3730a3] hover:bg-[#2e2882] active:bg-[#252069] rounded-xl transition-all shadow-sm"
            >
              Save &amp; Analyze Quotation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
