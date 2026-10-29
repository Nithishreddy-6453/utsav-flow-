/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Vendor, VendorStatus, BudgetItem, TimelineTask } from '../types/plan';
import { VendorFormSchema } from '../schemas/vendor';
import { X, Building2, User, Phone, Mail, Link as LinkIcon, FileText } from 'lucide-react';

interface AddVendorModalProps {
  isOpen: boolean;
  vendorToEdit?: Vendor | null;
  budgetItems: BudgetItem[];
  timelineTasks: TimelineTask[];
  onSave: (vendor: Vendor) => void;
  onClose: () => void;
}

const CATEGORIES = [
  'Catering',
  'Venue',
  'Decor',
  'Photography',
  'Entertainment',
  'Hair & Makeup',
  'Invitations & Gifts',
  'Transport',
  'Other'
];

const STATUSES: { value: VendorStatus; label: string }[] = [
  { value: 'contacted', label: 'Contacted' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'quote_received', label: 'Quote Received' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'booked', label: 'Booked' },
  { value: 'rejected', label: 'Declined / Rejected' }
];

export const AddVendorModal: React.FC<AddVendorModalProps> = ({
  isOpen,
  vendorToEdit,
  budgetItems,
  timelineTasks,
  onSave,
  onClose
}) => {
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('Catering');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [status, setStatus] = useState<VendorStatus>('contacted');
  const [notes, setNotes] = useState<string>('');
  const [linkedBudgetItemId, setLinkedBudgetItemId] = useState<string>('');
  const [linkedTimelineTaskId, setLinkedTimelineTaskId] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (vendorToEdit) {
        setName(vendorToEdit.name);
        setCategory(vendorToEdit.category || 'Catering');
        setContactPerson(vendorToEdit.contactPerson || '');
        setPhone(vendorToEdit.phone || '');
        setEmail(vendorToEdit.email || '');
        setStatus(vendorToEdit.status || 'contacted');
        setNotes(vendorToEdit.notes || '');
        setLinkedBudgetItemId(vendorToEdit.linkedBudgetItemId || '');
        setLinkedTimelineTaskId(vendorToEdit.linkedTimelineTaskId || '');
      } else {
        setName('');
        setCategory('Catering');
        setContactPerson('');
        setPhone('');
        setEmail('');
        setStatus('contacted');
        setNotes('');
        setLinkedBudgetItemId('');
        setLinkedTimelineTaskId('');
      }
      setErrors({});
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [isOpen, vendorToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const formData = {
      name: name.trim(),
      category: category.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim(),
      status,
      notes: notes.trim(),
      linkedBudgetItemId,
      linkedTimelineTaskId
    };

    const result = VendorFormSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        const path = issue.path[0] as string;
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const savedVendor: Vendor = {
      id: vendorToEdit?.id || `vendor_${Date.now()}`,
      name: result.data.name,
      category: result.data.category,
      contactPerson: result.data.contactPerson || undefined,
      phone: result.data.phone || undefined,
      email: result.data.email || undefined,
      status: result.data.status,
      notes: result.data.notes || undefined,
      linkedBudgetItemId: result.data.linkedBudgetItemId || undefined,
      linkedTimelineTaskId: result.data.linkedTimelineTaskId || undefined,
      createdAt: vendorToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(savedVendor);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-zinc-200 max-w-lg w-full overflow-hidden my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[#3730a3]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 id="modal-title" className="text-base font-bold text-zinc-900 font-['Fraunces',serif]">
                {vendorToEdit ? 'Edit Vendor Profile' : 'Add New Vendor'}
              </h2>
              <p className="text-xs text-zinc-500">Track contact details, booking status, and budget linkages</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Vendor Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Vendor / Business Name <span className="text-rose-500">*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Royal Spice Caterers, Luminary Stories"
              className={`w-full px-3 py-2 text-sm rounded-xl border ${
                errors.name ? 'border-rose-400 bg-rose-50/30' : 'border-zinc-300'
              } focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3]`}
            />
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] bg-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Pipeline Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VendorStatus)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] bg-white font-medium"
              >
                {STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact Person & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                Contact Person
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Rajesh Sharma"
                className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-zinc-400" />
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98201 XXXXX"
                className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3]"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-zinc-400" />
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@vendor.in"
              className={`w-full px-3 py-2 text-sm rounded-xl border ${
                errors.email ? 'border-rose-400 bg-rose-50/30' : 'border-zinc-300'
              } focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3]`}
            />
            {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
          </div>

          {/* Integrations: Link to Budget & Timeline */}
          <div className="pt-2 border-t border-zinc-100 space-y-3">
            <span className="text-[11px] font-mono font-semibold text-[#3730a3] uppercase tracking-wider flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5" /> Link To Workspace Plan
            </span>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Linked Budget Item (Budget Envelope)
              </label>
              <select
                value={linkedBudgetItemId}
                onChange={(e) => setLinkedBudgetItemId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] bg-white"
              >
                <option value="">-- None (General Vendor) --</option>
                {budgetItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.categoryName} → {item.itemName} (Allocated: ₹{item.allocatedAmount.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Linked Timeline Task
              </label>
              <select
                value={linkedTimelineTaskId}
                onChange={(e) => setLinkedTimelineTaskId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] bg-white"
              >
                <option value="">-- None (No task dependency) --</option>
                {timelineTasks.map(task => (
                  <option key={task.id} value={task.id}>
                    {task.phase}: {task.title} (Due: {task.dueDate})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              Notes &amp; Scope Requirements
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Specializes in vegetarian Gujarati spread. Needs 3 hours setup window before guest arrival."
              className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3]"
            />
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
              {vendorToEdit ? 'Save Changes' : 'Create Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
