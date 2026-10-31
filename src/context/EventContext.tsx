/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { EventDraft } from '../types';
import { EventPlan } from '../types/plan';
import { getSavedDraft, saveDraft, clearDraft, clearAllData, getSavedPlan, savePlan } from '../utils/storage';
import { PRESETS } from '../data/presets';

interface EventContextType {
  draft: EventDraft;
  updateDraft: (updates: Partial<EventDraft>) => void;
  loadPreset: (presetKey: string) => void;
  resetDraft: () => void;
  clearAll: () => void;
  route: string;
  navigate: (path: string) => void;
  plan: EventPlan;
  setPlan: (planOrFn: EventPlan | ((prev: EventPlan) => EventPlan)) => void;
  refreshPlan: () => EventPlan;
  isHydrated: boolean;
  isReplanOpen: boolean;
  openReplan: () => void;
  closeReplan: () => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [draft, setDraft] = useState<EventDraft>(getSavedDraft);
  const [plan, setPlanState] = useState<EventPlan>(() => getSavedPlan());
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [isReplanOpen, setIsReplanOpen] = useState<boolean>(false);

  const [route, setRoute] = useState<string>(() => {
    if (typeof window === 'undefined') return '/';
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) return hash;
    if (window.location.pathname && window.location.pathname !== '/') {
      return window.location.pathname;
    }
    return '/';
  });

  useEffect(() => {
    setIsHydrated(true);

    // Sync hash if pathname was used
    if (!window.location.hash && window.location.pathname && window.location.pathname !== '/') {
      window.location.hash = window.location.pathname;
    }

    const handleHashChange = () => {
      const path = window.location.hash.replace(/^#/, '') || '/';
      setRoute(path);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'utsavflow_event_draft' || e.key === null) {
        setDraft(getSavedDraft());
      }
      if (e.key === 'utsavflow_event_plan' || e.key === null) {
        setPlanState(getSavedPlan());
      }
    };

    const handlePlanUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<EventPlan>;
      if (customEvent.detail) {
        setPlanState(customEvent.detail);
      } else {
        setPlanState(getSavedPlan());
      }
    };

    const handleDraftUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<EventDraft>;
      if (customEvent.detail) {
        setDraft(customEvent.detail);
      } else {
        setDraft(getSavedDraft());
      }
    };

    const handleDataCleared = () => {
      const freshDraft = getSavedDraft();
      setDraft(freshDraft);
      setPlanState(getSavedPlan(freshDraft));
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('utsavflow_plan_updated', handlePlanUpdated);
    window.addEventListener('utsavflow_draft_updated', handleDraftUpdated);
    window.addEventListener('utsavflow_data_cleared', handleDataCleared);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('utsavflow_plan_updated', handlePlanUpdated);
      window.removeEventListener('utsavflow_draft_updated', handleDraftUpdated);
      window.removeEventListener('utsavflow_data_cleared', handleDataCleared);
    };
  }, []);

  const navigate = React.useCallback((path: string) => {
    window.location.hash = path;
    setRoute(path);
    window.scrollTo(0, 0);
  }, []);

  const updateDraft = React.useCallback((updates: Partial<EventDraft>) => {
    setDraft(prev => {
      const next = { ...prev, ...updates, updatedAt: new Date().toISOString() };
      saveDraft(next);
      return next;
    });
  }, []);

  const setPlan = React.useCallback((planOrFn: EventPlan | ((prev: EventPlan) => EventPlan)) => {
    setPlanState(prev => {
      const next = typeof planOrFn === 'function' ? planOrFn(prev) : planOrFn;
      savePlan(next);
      return next;
    });
  }, []);

  const refreshPlan = React.useCallback(() => {
    const fresh = getSavedPlan(draft);
    setPlanState(fresh);
    return fresh;
  }, [draft]);

  const openReplan = React.useCallback(() => setIsReplanOpen(true), []);
  const closeReplan = React.useCallback(() => setIsReplanOpen(false), []);

  const loadPreset = React.useCallback((presetKey: string) => {
    const preset = PRESETS[presetKey];
    if (!preset) return;
    setDraft(prev => {
      const next: EventDraft = {
        ...prev,
        eventName: preset.eventName,
        occasionType: preset.occasionType,
        eventDate: preset.eventDate,
        eventLocation: preset.eventLocation,
        eventStyle: preset.eventStyle,
        maxBudget: preset.maxBudget,
        totalGuests: preset.totalGuests,
        adultGuests: preset.adultGuests,
        childGuests: preset.childGuests,
        seniorGuests: preset.seniorGuests,
        priorities: preset.priorities,
        mustHaves: preset.mustHaves,
        culturalPreferences: preset.culturalPreferences,
        accessibilityRequirements: preset.accessibilityRequirements,
        thingsToAvoid: preset.thingsToAvoid,
        updatedAt: new Date().toISOString()
      };
      saveDraft(next);
      return next;
    });
  }, []);

  const resetDraft = React.useCallback(() => {
    clearDraft();
    const fresh = getSavedDraft();
    setDraft(fresh);
  }, []);

  const clearAll = React.useCallback(() => {
    clearAllData();
    const freshDraft = getSavedDraft();
    setDraft(freshDraft);
    const freshPlan = getSavedPlan(freshDraft);
    setPlanState(freshPlan);
  }, []);

  return (
    <EventContext.Provider 
      value={{ 
        draft, 
        updateDraft, 
        loadPreset, 
        resetDraft, 
        clearAll, 
        route, 
        navigate, 
        plan, 
        setPlan, 
        refreshPlan, 
        isHydrated,
        isReplanOpen,
        openReplan,
        closeReplan
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) throw new Error('useEvent must be used within an EventProvider');
  return context;
};
