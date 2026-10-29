/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Vendor, VendorQuote, BudgetItem, QuoteComparisonResult } from '../types/plan';
import { formatINR } from '../utils/calculations';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Scale,
  RefreshCw,
  Plus
} from 'lucide-react';

interface QuoteComparisonWorkspaceProps {
  quotes: VendorQuote[];
  vendors: Vendor[];
  budgetItems: BudgetItem[];
  totalGuests: number;
  priorities: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onOpenAddQuote: () => void;
  onApplyToBudget: (quoteId: string, budgetItemId: string) => void;
  onUpdateQuoteAnalysis: (quoteId: string, updatedQuote: VendorQuote) => void;
}

export const QuoteComparisonWorkspace: React.FC<QuoteComparisonWorkspaceProps> = ({
  quotes,
  vendors,
  budgetItems,
  totalGuests,
  priorities,
  selectedCategory,
  onSelectCategory,
  onOpenAddQuote,
  onApplyToBudget,
}) => {
  // Filter quotes by selected category (or all)
  const categoryQuotes = selectedCategory === 'All'
    ? quotes
    : quotes.filter(q => q.category.toLowerCase() === selectedCategory.toLowerCase());

  // Multi-select for side-by-side comparison (default to first 2 quotes in category)
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>(() => {
    return categoryQuotes.slice(0, 2).map(q => q.id);
  });

  const [isComparingWithAI, setIsComparingWithAI] = useState<boolean>(false);
  const [comparisonResult, setComparisonResult] = useState<QuoteComparisonResult | null>(null);
  const [copiedQuestionIndex, setCopiedQuestionIndex] = useState<string | null>(null);

  // Modal for Applying to Budget Confirmation
  const [confirmModalData, setConfirmModalData] = useState<{
    isOpen: boolean;
    quote: VendorQuote | null;
    targetBudgetItem: BudgetItem | null;
  }>({
    isOpen: false,
    quote: null,
    targetBudgetItem: null
  });

  // Selected quotes list
  const activeQuotes = quotes.filter(q => selectedQuoteIds.includes(q.id));

  const toggleSelectQuote = (id: string) => {
    setSelectedQuoteIds(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(x => x !== id);
      }
      return [...prev, id];
    });
  };

  // Run Server-Side Gemini API comparison
  const handleRunComparison = async () => {
    if (activeQuotes.length === 0) return;
    setIsComparingWithAI(true);

    try {
      const response = await fetch('/api/vendors/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          quotes: activeQuotes,
          guestCount: totalGuests,
          priorities
        })
      });

      const data = await response.json();
      if (data.success && data.comparison) {
        setComparisonResult(data.comparison);
      }
    } catch (err) {
      console.warn('Quote comparison API error, using existing client data:', err);
    } finally {
      setIsComparingWithAI(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestionIndex(id);
    setTimeout(() => setCopiedQuestionIndex(null), 2000);
  };

  const initiateApplyToBudget = (quote: VendorQuote) => {
    // Find target budget item (either explicitly linked or first matching category)
    let target = budgetItems.find(b => b.id === quote.linkedBudgetItemId);
    if (!target) {
      target = budgetItems.find(b => b.categoryName.toLowerCase().includes(quote.category.toLowerCase()));
    }
    if (!target && budgetItems.length > 0) {
      target = budgetItems[0];
    }

    setConfirmModalData({
      isOpen: true,
      quote,
      targetBudgetItem: target || null
    });
  };

  const executeApplyToBudget = () => {
    if (confirmModalData.quote && confirmModalData.targetBudgetItem) {
      onApplyToBudget(confirmModalData.quote.id, confirmModalData.targetBudgetItem.id);
      setConfirmModalData({ isOpen: false, quote: null, targetBudgetItem: null });
    }
  };

  // Categories present in quotes or standard list
  const availableCategories = ['All', 'Catering', 'Venue', 'Decor', 'Photography', 'Entertainment'];

  return (
    <div className="space-y-6">
      {/* Category selector chips & Compare Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {availableCategories.map(cat => {
            const count = cat === 'All' ? quotes.length : quotes.filter(q => q.category.toLowerCase() === cat.toLowerCase()).length;
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  onSelectCategory(cat);
                  const filtered = cat === 'All' ? quotes : quotes.filter(q => q.category.toLowerCase() === cat.toLowerCase());
                  setSelectedQuoteIds(filtered.slice(0, 2).map(q => q.id));
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#3730a3] text-white shadow-sm'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRunComparison}
            disabled={activeQuotes.length === 0 || isComparingWithAI}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              isComparingWithAI
                ? 'bg-zinc-200 text-zinc-500 cursor-wait'
                : 'bg-indigo-50 border border-indigo-200 text-[#3730a3] hover:bg-indigo-100'
            }`}
          >
            {isComparingWithAI ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Analyzing Quotes...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-[#3730a3]" />
                Forensic Quote Audit
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenAddQuote}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#3730a3] hover:bg-[#2e2882] flex items-center gap-1 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Quotation
          </button>
        </div>
      </div>

      {categoryQuotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-[#3730a3] mx-auto flex items-center justify-center">
            <Scale className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-zinc-900 text-base">No Quotations for {selectedCategory}</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Paste actual estimates received from your shortlisted {selectedCategory.toLowerCase()} vendors to audit hidden costs and calculate effective per-guest pricing.
          </p>
          <button
            type="button"
            onClick={onOpenAddQuote}
            className="px-4 py-2 bg-[#3730a3] text-white text-xs font-bold rounded-xl hover:bg-[#2e2882] transition-colors"
          >
            Record First Quotation
          </button>
        </div>
      ) : (
        <>
          {/* Quote Selection Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-500 font-medium">Select Quotes to Compare:</span>
            {categoryQuotes.map(q => {
              const isChecked = selectedQuoteIds.includes(q.id);
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => toggleSelectQuote(q.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                    isChecked
                      ? 'bg-indigo-50/80 border-[#3730a3] text-[#3730a3] font-semibold'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isChecked ? 'bg-[#3730a3]' : 'bg-zinc-300'}`} />
                  {q.vendorName}
                  <span className="font-mono text-[11px] text-zinc-500 font-normal">₹{(q.quotedTotal / 1000).toFixed(0)}k</span>
                </button>
              );
            })}
          </div>

          {/* AI Strategic Recommendation Box (if available or deterministic summary) */}
          {comparisonResult?.recommendation && (
            <div className="bg-gradient-to-r from-indigo-50/90 to-purple-50/90 border border-indigo-200/80 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-[#3730a3] text-white">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <h4 className="text-xs font-bold text-[#3730a3] uppercase tracking-wide">
                  Strategic AI Procurement Audit
                </h4>
              </div>
              <p className="text-xs text-zinc-800 leading-relaxed font-medium">
                {comparisonResult.recommendation.rationale}
              </p>
              {comparisonResult.recommendation.bestValueOption && (
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-zinc-600">
                  <span className="font-semibold text-emerald-800">
                    ✓ Best Net Value: <strong className="text-zinc-900">{comparisonResult.recommendation.bestValueOption}</strong>
                  </span>
                  {comparisonResult.recommendation.premiumOption && (
                    <span className="text-purple-800 font-semibold">
                      ★ Premium Scope: <strong className="text-zinc-900">{comparisonResult.recommendation.premiumOption}</strong>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Side-by-Side Comparison Cards */}
          <div className={`grid grid-cols-1 ${activeQuotes.length > 1 ? 'md:grid-cols-2 lg:grid-cols-' + Math.min(activeQuotes.length, 3) : ''} gap-4`}>
            {activeQuotes.map(quote => {
              const analysis = quote.extractedAnalysis;
              const isAccepted = quote.reviewStatus === 'accepted';
              const taxesIncluded = analysis?.taxAndTerms?.taxesIncluded;
              const perGuestRate = analysis?.perGuestRate || (quote.ratePerGuest && quote.ratePerGuest > 0 ? quote.ratePerGuest : Math.round(quote.quotedTotal / totalGuests));
              const trueTotal = analysis?.pricingBreakdown?.totalCalculated || quote.quotedTotal;

              return (
                <div
                  key={quote.id}
                  className={`bg-white rounded-2xl border ${
                    isAccepted
                      ? 'border-emerald-400 ring-2 ring-emerald-500/20 shadow-md'
                      : 'border-zinc-200 shadow-sm'
                  } flex flex-col justify-between overflow-hidden transition-all`}
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-zinc-100 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3730a3]">
                          {quote.category}
                        </span>
                        <h3 className="text-base font-bold text-zinc-900 font-['Fraunces',serif]">
                          {quote.vendorName}
                        </h3>
                        <p className="text-xs text-zinc-600 mt-0.5 line-clamp-1">
                          {quote.title}
                        </p>
                      </div>

                      {isAccepted ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Booked
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                          {quote.reviewStatus === 'analyzed' ? 'Audited' : 'Pending'}
                        </span>
                      )}
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-zinc-500">Sticker Total</div>
                        <div className="font-mono text-lg font-bold text-zinc-900">
                          {formatINR(quote.quotedTotal)}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-zinc-500">Effective / Guest</div>
                        <div className="font-mono text-sm font-bold text-[#3730a3]">
                          ₹{perGuestRate.toLocaleString('en-IN')}<span className="text-[10px] font-normal text-zinc-500">/hd</span>
                        </div>
                      </div>
                    </div>

                    {/* Tax & GST Status Tag */}
                    <div>
                      {taxesIncluded === true ? (
                        <div className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                          <span>All-Inclusive (18% GST already incorporated)</span>
                        </div>
                      ) : taxesIncluded === false ? (
                        <div className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                          <span>
                            Excludes GST (+18% ~{formatINR(Math.round(quote.quotedTotal * 0.18))}). Net: {formatINR(trueTotal)}
                          </span>
                        </div>
                      ) : (
                        <div className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                          <span>Taxes unstated in quote (High risk of +18% on final bill)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Facts vs Inferences Sections */}
                  <div className="p-5 space-y-4 flex-1 text-xs">
                    {/* Stated Inclusions */}
                    <div>
                      <div className="font-bold text-zinc-900 mb-1.5 flex items-center gap-1 text-[11px] uppercase tracking-wide text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Stated Inclusions (Facts)
                      </div>
                      <ul className="space-y-1">
                        {analysis?.inclusions && analysis.inclusions.length > 0 ? (
                          analysis.inclusions.slice(0, 5).map((inc, i) => (
                            <li key={i} className="text-zinc-700 flex items-start gap-1.5">
                              <span className="text-emerald-600 font-bold">•</span>
                              <span className="line-clamp-2">{inc}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-zinc-500 italic">No itemized inclusions stated</li>
                        )}
                      </ul>
                    </div>

                    {/* Stated Exclusions & Cost Risks */}
                    {(analysis?.exclusions && analysis.exclusions.length > 0) && (
                      <div>
                        <div className="font-bold text-zinc-900 mb-1.5 flex items-center gap-1 text-[11px] uppercase tracking-wide text-rose-800">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          Known Exclusions &amp; Extras
                        </div>
                        <ul className="space-y-1">
                          {analysis.exclusions.map((exc, i) => (
                            <li key={i} className="text-rose-700 flex items-start gap-1.5 font-medium">
                              <span className="text-rose-500 font-bold">•</span>
                              <span>{exc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Missing Info / Critical Gaps */}
                    {(analysis?.missingInformation && analysis.missingInformation.length > 0) && (
                      <div className="bg-amber-50/60 rounded-xl p-2.5 border border-amber-200/60 space-y-1">
                        <div className="font-bold text-amber-900 flex items-center gap-1 text-[10px] uppercase tracking-wider">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Omissions Detected
                        </div>
                        <ul className="space-y-0.5">
                          {analysis.missingInformation.slice(0, 3).map((info, i) => (
                            <li key={i} className="text-[11px] text-amber-800 flex items-start gap-1">
                              <span>⚠</span>
                              <span>{info}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Grounded Follow-up Questions */}
                    {(analysis?.followUpQuestions && analysis.followUpQuestions.length > 0) && (
                      <div className="pt-2 border-t border-zinc-100">
                        <div className="font-bold text-zinc-900 mb-1.5 flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1 text-[#3730a3]">
                            <HelpCircle className="w-3.5 h-3.5" />
                            Clarification Questions to Ask
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {analysis.followUpQuestions.length} Items
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {analysis.followUpQuestions.slice(0, 3).map((qText, i) => {
                            const qId = `${quote.id}_q_${i}`;
                            const isCopied = copiedQuestionIndex === qId;
                            return (
                              <div
                                key={i}
                                className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/80 flex items-start justify-between gap-2 group"
                              >
                                <span className="text-zinc-700 text-[11px] leading-snug">
                                  {qText}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(qText, qId)}
                                  className="text-zinc-400 hover:text-[#3730a3] p-1 rounded hover:bg-zinc-200/60 transition-colors shrink-0"
                                  title="Copy question text"
                                >
                                  {isCopied ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Action: Accept & Apply to Budget */}
                  <div className="p-4 border-t border-zinc-100 bg-zinc-50/70 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-zinc-500 font-mono truncate">
                      Valid: {quote.validUntil || '30 days'}
                    </span>
                    <button
                      type="button"
                      disabled={isAccepted}
                      onClick={() => initiateApplyToBudget(quote)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1 ${
                        isAccepted
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 cursor-default'
                          : 'bg-[#3730a3] hover:bg-[#2e2882] text-white shadow-sm'
                      }`}
                    >
                      {isAccepted ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Applied to Budget
                        </>
                      ) : (
                        <>
                          Accept &amp; Apply
                          <ArrowRight className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Side-by-side Matrix Comparison Table */}
          {activeQuotes.length > 1 && (
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-zinc-900 text-sm">Feature &amp; Commercial Comparison Matrix</h4>
                  <p className="text-xs text-zinc-500">Side-by-side audit of terms and scope commitments</p>
                </div>
                <span className="text-xs font-mono font-bold text-[#3730a3]">
                  {activeQuotes.length} Proposals Selected
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-50/70 border-b border-zinc-200 text-zinc-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-4 w-1/4">Evaluation Attribute</th>
                      {activeQuotes.map(q => (
                        <th key={q.id} className="py-2.5 px-4 font-bold text-zinc-900">
                          {q.vendorName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-700">
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-zinc-900">Quoted Sticker Price</td>
                      {activeQuotes.map(q => (
                        <td key={q.id} className="py-2.5 px-4 font-mono font-bold text-zinc-900">
                          {formatINR(q.quotedTotal)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-zinc-900">Tax Treatment</td>
                      {activeQuotes.map(q => {
                        const tax = q.extractedAnalysis?.taxAndTerms?.taxesIncluded;
                        return (
                          <td key={q.id} className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              tax === true
                                ? 'bg-emerald-50 text-emerald-800'
                                : tax === false
                                ? 'bg-rose-50 text-rose-800'
                                : 'bg-amber-50 text-amber-800'
                            }`}>
                              {tax === true ? 'All-Inclusive (18% GST covered)' : tax === false ? 'Excludes 18% GST' : 'Unstated in text'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-zinc-900">Net Calculated Exposure</td>
                      {activeQuotes.map(q => {
                        const total = q.extractedAnalysis?.pricingBreakdown?.totalCalculated || q.quotedTotal;
                        return (
                          <td key={q.id} className="py-2.5 px-4 font-mono font-bold text-[#3730a3]">
                            {formatINR(total)}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-zinc-900">Effective Rate / Guest</td>
                      {activeQuotes.map(q => {
                        const rate = q.extractedAnalysis?.perGuestRate || (q.ratePerGuest && q.ratePerGuest > 0 ? q.ratePerGuest : Math.round(q.quotedTotal / totalGuests));
                        return (
                          <td key={q.id} className="py-2.5 px-4 font-mono">
                            ₹{rate.toLocaleString('en-IN')}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-zinc-900">Payment Milestones</td>
                      {activeQuotes.map(q => (
                        <td key={q.id} className="py-2.5 px-4 text-zinc-600">
                          {q.extractedAnalysis?.taxAndTerms?.paymentTerms || 'Standard deposit on confirmation'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-zinc-900">Overtime Policy</td>
                      {activeQuotes.map(q => (
                        <td key={q.id} className="py-2.5 px-4 text-zinc-600">
                          {q.extractedAnalysis?.taxAndTerms?.overtimePolicy || 'Not specified'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirmation Modal for Applying to Budget */}
      {confirmModalData.isOpen && confirmModalData.quote && confirmModalData.targetBudgetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-base font-['Fraunces',serif]">
                  Apply Quote to Budget
                </h3>
                <p className="text-xs text-zinc-500">
                  Update projected spend with real vendor quote
                </p>
              </div>
            </div>

            <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Selected Vendor:</span>
                <span className="font-bold text-zinc-900">{confirmModalData.quote.vendorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Target Line Item:</span>
                <span className="font-bold text-zinc-900">{confirmModalData.targetBudgetItem.itemName}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-2">
                <span className="text-zinc-500">Allocated Budget Envelope:</span>
                <span className="font-mono font-bold text-zinc-900">
                  {formatINR(confirmModalData.targetBudgetItem.allocatedAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">New Projected Spend:</span>
                <span className="font-mono font-bold text-[#3730a3]">
                  {formatINR(confirmModalData.quote.quotedTotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Cost Provenance:</span>
                <span className="font-semibold text-emerald-800">vendor_quote</span>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Your allocated budget envelope of <strong>{formatINR(confirmModalData.targetBudgetItem.allocatedAmount)}</strong> will be strictly preserved. The projected spend and cost source will be updated to reflect this verified quote.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalData({ isOpen: false, quote: null, targetBudgetItem: null })}
                className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeApplyToBudget}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all shadow-sm"
              >
                Confirm &amp; Apply to Budget
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
