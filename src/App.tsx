/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy } from 'react';
import { EventProvider, useEvent } from './context/EventContext';

const LandingPage = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const Step1Basic = lazy(() => import('./components/Step1Basic').then(m => ({ default: m.Step1Basic })));
const Step2Budget = lazy(() => import('./components/Step2Budget').then(m => ({ default: m.Step2Budget })));
const Step3Preferences = lazy(() => import('./components/Step3Preferences').then(m => ({ default: m.Step3Preferences })));
const Step4Review = lazy(() => import('./components/Step4Review').then(m => ({ default: m.Step4Review })));
const WorkspaceOverview = lazy(() => import('./components/WorkspaceOverview').then(m => ({ default: m.WorkspaceOverview })));
const BudgetLedger = lazy(() => import('./components/BudgetLedger').then(m => ({ default: m.BudgetLedger })));
const TimelineView = lazy(() => import('./components/TimelineView').then(m => ({ default: m.TimelineView })));
const VendorStudio = lazy(() => import('./components/VendorStudio').then(m => ({ default: m.VendorStudio })));
const ExperienceThemes = lazy(() => import('./components/ExperienceThemes').then(m => ({ default: m.ExperienceThemes })));

function RouteLoadingFallback() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1f108e] to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 mb-4 animate-pulse">
        <span className="material-symbols-outlined text-[28px] animate-spin">cyclone</span>
      </div>
      <h2 className="font-['Fraunces',serif] text-xl font-bold text-zinc-900 tracking-tight">
        Loading UtsavFlow...
      </h2>
      <p className="text-xs text-zinc-500 mt-1 font-medium">
        Preparing celebration workspace
      </p>
    </div>
  );
}

function AppRouter() {
  const { route } = useEvent();

  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      {(() => {
        switch (route) {
          case '/events/new/basic':
            return <Step1Basic />;
          case '/events/new/budget':
            return <Step2Budget />;
          case '/events/new/preferences':
            return <Step3Preferences />;
          case '/events/new/review':
            return <Step4Review />;
          case '/workspace/overview':
            return <WorkspaceOverview />;
          case '/workspace/budget':
            return <BudgetLedger />;
          case '/workspace/timeline':
            return <TimelineView />;
          case '/workspace/vendors':
            return <VendorStudio />;
          case '/workspace/ideas':
          case '/workspace/themes':
            return <ExperienceThemes />;
          case '/':
          default:
            return <LandingPage />;
        }
      })()}
    </Suspense>
  );
}

export default function App() {
  return (
    <EventProvider>
      <AppRouter />
    </EventProvider>
  );
}
