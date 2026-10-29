/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EventProvider, useEvent } from './context/EventContext';
import { LandingPage } from './components/LandingPage';
import { Step1Basic } from './components/Step1Basic';
import { Step2Budget } from './components/Step2Budget';
import { Step3Preferences } from './components/Step3Preferences';
import { Step4Review } from './components/Step4Review';
import { WorkspaceOverview } from './components/WorkspaceOverview';
import { BudgetLedger } from './components/BudgetLedger';
import { TimelineView } from './components/TimelineView';
import { VendorStudio } from './components/VendorStudio';
import { ExperienceThemes } from './components/ExperienceThemes';

function AppRouter() {
  const { route } = useEvent();

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
}

export default function App() {
  return (
    <EventProvider>
      <AppRouter />
    </EventProvider>
  );
}
