/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useEvent } from '../context/EventContext';
import { WizardShell } from './WizardShell';
import { OccasionType } from '../types';

export const Step1Basic: React.FC = () => {
  const { draft, updateDraft, navigate } = useEvent();

  const [occasionType, setOccasionType] = useState<OccasionType>(draft.occasionType || 'wedding');
  const [eventName, setEventName] = useState<string>(draft.eventName || "Ananya & Rahul's Grand Wedding");
  const [eventDate, setEventDate] = useState<string>(draft.eventDate || '2026-11-14');
  const [eventCity, setEventCity] = useState<string>(draft.eventLocation || 'Bhubaneswar, Odisha');
  const [styles, setStyles] = useState<string[]>(draft.eventStyle || ['Traditional', 'Elegant']);
  const [customStyleInput, setCustomStyleInput] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleStyleToggle = (styleName: string) => {
    if (styles.includes(styleName)) {
      setStyles(styles.filter(s => s !== styleName));
    } else {
      setStyles([...styles, styleName]);
    }
  };

  const handleAddCustomStyle = () => {
    if (customStyleInput.trim() && !styles.includes(customStyleInput.trim())) {
      setStyles([...styles, customStyleInput.trim()]);
      setCustomStyleInput('');
      setShowCustomInput(false);
    }
  };

  const calculateHorizon = (dateStr: string) => {
    if (!dateStr) return 'Select target date';
    const target = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      const months = Math.floor(diffDays / 30);
      return `Target celebration date · approx. ${diffDays} days (${months} months) horizon`;
    }
    return 'Target celebration date';
  };

  // Real-time synchronization of in-progress wizard draft to localStorage
  // Guarantees persistence even if user reloads, switches tabs, or navigates via breadcrumbs
  React.useEffect(() => {
    updateDraft({
      occasionType,
      eventName: eventName.trim() || undefined,
      eventDate,
      eventLocation: eventCity.trim() || undefined,
      eventStyle: styles
    });
  }, [occasionType, eventName, eventDate, eventCity, styles, updateDraft]);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || !eventDate || !eventCity.trim()) {
      setErrorMsg('Please provide Event Name, Event Date, and Location before continuing.');
      return;
    }
    setErrorMsg('');
    updateDraft({
      occasionType,
      eventName: eventName.trim(),
      eventDate,
      eventLocation: eventCity.trim(),
      eventStyle: styles
    });
    navigate('/events/new/budget');
  };

  return (
    <WizardShell currentStep={1}>
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <h1 className="font-['Fraunces',serif] text-3xl sm:text-4xl text-zinc-900 tracking-tight font-bold">
          Let’s start with the basics
        </h1>
        <p className="mt-2 text-zinc-600 text-base font-medium">
          Tell us the foundational details of your celebration so we can tailor timelines, cultural traditions, and regional planning nuances.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50/90 backdrop-blur-md border border-rose-200 text-rose-900 text-sm font-bold flex items-center gap-3 shadow-sm">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleContinue} className="space-y-6">
        {/* Card Section 1: Event Type Selector (Indigo Tint) */}
        <div className="bg-white/60 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl p-6 sm:p-8 bg-indigo-50/20">
          <div className="flex items-center justify-between mb-3">
            <label className="block font-bold text-sm text-zinc-900">
              Event Type <span className="text-rose-600">*</span>
            </label>
            <span className="text-xs font-semibold text-zinc-600">Select one celebratory category</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {/* Wedding */}
            <div 
              onClick={() => setOccasionType('wedding')}
              className={`cursor-pointer p-4 rounded-xl border transition-all relative flex items-start gap-3.5 ${occasionType === 'wedding' ? 'bg-indigo-100/70 border-indigo-400 shadow-xs' : 'bg-white/80 border-white/40 hover:bg-white'}`}
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-200 text-[#3730a3] flex items-center justify-center shrink-0 border border-indigo-300">
                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>filter_vintage</span>
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-900">Wedding</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold uppercase tracking-wider">Multi-Day</span>
                </div>
                <p className="text-xs text-zinc-600 mt-1 leading-relaxed">Ceremonial nuptials, multi-day celebrations, sacred rituals &amp; banquet receptions.</p>
              </div>
              {occasionType === 'wedding' && (
                <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-[#3730a3] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </div>
              )}
            </div>

            {/* Birthday */}
            <div 
              onClick={() => setOccasionType('birthday')}
              className={`cursor-pointer p-4 rounded-xl border transition-all relative flex items-start gap-3.5 ${occasionType === 'birthday' ? 'bg-indigo-100/70 border-indigo-400 shadow-xs' : 'bg-white/80 border-white/40 hover:bg-white'}`}
            >
              <div className="w-10 h-10 rounded-lg bg-zinc-200 text-zinc-800 flex items-center justify-center shrink-0 border border-zinc-300">
                <span className="material-symbols-outlined text-[22px]">cake</span>
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-900">Birthday</span>
                </div>
                <p className="text-xs text-zinc-600 mt-1 leading-relaxed">Milestones, anniversary jubilees, themed birthday parties &amp; family celebrations.</p>
              </div>
              {occasionType === 'birthday' && (
                <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-[#3730a3] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </div>
              )}
            </div>

            {/* Community */}
            <div 
              onClick={() => setOccasionType('community')}
              className={`cursor-pointer p-4 rounded-xl border transition-all relative flex items-start gap-3.5 ${occasionType === 'community' ? 'bg-indigo-100/70 border-indigo-400 shadow-xs' : 'bg-white/80 border-white/40 hover:bg-white'}`}
            >
              <div className="w-10 h-10 rounded-lg bg-zinc-200 text-zinc-800 flex items-center justify-center shrink-0 border border-zinc-300">
                <span className="material-symbols-outlined text-[22px]">groups</span>
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-900">Community Event</span>
                </div>
                <p className="text-xs text-zinc-600 mt-1 leading-relaxed">Cultural utsavs, society pujas, festive melas, and neighborhood gatherings.</p>
              </div>
              {occasionType === 'community' && (
                <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-[#3730a3] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </div>
              )}
            </div>

            {/* Other */}
            <div 
              onClick={() => setOccasionType('other')}
              className={`cursor-pointer p-4 rounded-xl border transition-all relative flex items-start gap-3.5 ${occasionType === 'other' ? 'bg-indigo-100/70 border-indigo-400 shadow-xs' : 'bg-white/80 border-white/40 hover:bg-white'}`}
            >
              <div className="w-10 h-10 rounded-lg bg-zinc-200 text-zinc-800 flex items-center justify-center shrink-0 border border-zinc-300">
                <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-900">Other Event</span>
                </div>
                <p className="text-xs text-zinc-600 mt-1 leading-relaxed">Bespoke family banquets, corporate soirees, private reunions, or housewarmings.</p>
              </div>
              {occasionType === 'other' && (
                <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-[#3730a3] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card Section 2: Event Name, Date & Location (Amber Tint) */}
        <div className="bg-white/60 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl p-6 sm:p-8 bg-amber-50/20 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-zinc-900" htmlFor="event-name">
                Event Name <span className="text-rose-600">*</span>
              </label>
              <span className="text-xs font-mono font-bold text-zinc-600">{eventName.length} / 70</span>
            </div>
            <input 
              id="event-name"
              type="text"
              maxLength={70}
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="block w-full px-4 py-3 text-base font-semibold text-zinc-900 bg-white/90 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-[#3730a3] focus:outline-none shadow-2xs"
              placeholder="e.g., Ananya & Rahul’s Grand Wedding"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <div>
              <label className="block text-sm font-bold text-zinc-900 mb-2" htmlFor="event-date">
                Event Date <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input 
                  id="event-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="block w-full pl-4 pr-10 py-3 text-sm font-bold text-zinc-900 bg-white/90 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-[#3730a3] focus:outline-none shadow-2xs"
                />
              </div>
              <p className="text-xs text-emerald-800 font-bold mt-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span>{calculateHorizon(eventDate)}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-zinc-900 mb-2" htmlFor="event-city">
                Event Location / City <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input 
                  id="event-city"
                  type="text"
                  value={eventCity}
                  onChange={(e) => setEventCity(e.target.value)}
                  className="block w-full pl-4 pr-10 py-3 text-sm font-bold text-zinc-900 bg-white/90 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-[#3730a3] focus:outline-none shadow-2xs"
                  placeholder="e.g., Bhubaneswar, Odisha"
                />
              </div>
              <p className="text-xs text-zinc-600 mt-1.5 flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-[14px] text-zinc-500">hub</span>
                Drives regional seasonal logistics, vendor benchmark rates, and availability.
              </p>
            </div>
          </div>
        </div>

        {/* Card Section 3: Atmosphere & Style (Emerald Tint) */}
        <div className="bg-white/60 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl p-6 sm:p-8 bg-emerald-50/20 space-y-4">
          <label className="block text-sm font-bold text-zinc-900 mb-1">
            Desired Atmosphere &amp; Style
          </label>
          <p className="text-xs text-zinc-600 mb-3 font-semibold">Select one or more aesthetic directions to guide moodboards and theme presets.</p>
          <div className="flex flex-wrap items-center gap-2.5">
            {['Traditional', 'Elegant', 'Modern Warm', 'Intimate', 'Fun & Vibrant'].map((s) => {
              const active = styles.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStyleToggle(s)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${active ? 'bg-[#3730a3] text-white border-[#3730a3]' : 'bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-50'}`}
                >
                  {active && <span className="material-symbols-outlined text-[16px]">check</span>}
                  <span>{s}</span>
                </button>
              );
            })}
            <button 
              type="button" 
              onClick={() => setShowCustomInput(!showCustomInput)}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-dashed border-zinc-400 text-zinc-900 bg-white hover:bg-zinc-50 transition-all cursor-pointer shadow-2xs"
            >
              + Custom Style
            </button>
          </div>

          {showCustomInput && (
            <div className="mt-3 max-w-md flex items-center gap-2">
              <input 
                type="text"
                value={customStyleInput}
                onChange={(e) => setCustomStyleInput(e.target.value)}
                placeholder="e.g., Vedic Minimalist, Royal Bohemian"
                className="flex-1 px-3 py-2.5 text-xs font-semibold bg-white border border-zinc-300 rounded-xl outline-none shadow-2xs"
              />
              <button 
                type="button" 
                onClick={handleAddCustomStyle}
                className="px-4 py-2.5 rounded-xl bg-[#3730a3] text-white text-xs font-bold cursor-pointer hover:bg-[#312E81]"
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* Bottom Navigation Bar */}
        <div className="pt-6 border-t border-zinc-200 flex items-center justify-between">
          <button 
            type="button" 
            onClick={() => navigate('/')}
            className="px-5 py-3 rounded-xl border border-zinc-300 bg-white text-zinc-900 text-sm font-bold cursor-pointer hover:bg-zinc-100 transition-all shadow-xs"
          >
            Cancel to Workspace
          </button>
          <button 
            type="submit"
            className="px-8 py-3.5 rounded-xl bg-[#3730a3] text-white font-bold text-sm shadow-md hover:bg-[#312E81] flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <span>Continue to Budget &amp; Guests</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </form>
    </WizardShell>
  );
};
