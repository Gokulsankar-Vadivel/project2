import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OpportunitiesProvider, useOpportunities } from './context/OpportunitiesContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ExplorerView } from './components/ExplorerView';
import { AIAssistantView } from './components/AIAssistantView';
import { SavedTrackerView } from './components/SavedTrackerView';
import { NotificationsView } from './components/NotificationsView';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { OpportunityModal } from './components/OpportunityModal';
import { DiscoveryModal } from './components/DiscoveryModal';
import { AuthModal } from './components/AuthModal';
import {
  LayoutDashboard,
  Compass,
  Bot,
  BookmarkCheck,
  Bell,
  User,
  Sparkles
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [assistantPrompt, setAssistantPrompt] = useState<string>('');

  const {
    selectedOpportunity,
    setSelectedOpportunity,
    runAgentDiscovery,
    discoveryModalOpen,
    setDiscoveryModalOpen,
    unreadAlertsCount,
    savedOpportunities
  } = useOpportunities();

  const handleOpenDiscovery = () => {
    runAgentDiscovery();
  };

  const handleAskAssistant = (question: string) => {
    setAssistantPrompt(question);
    setCurrentView('assistant');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigateToExplorer={() => setCurrentView('explorer')}
            onNavigateToAssistant={() => setCurrentView('assistant')}
            onNavigateToSaved={() => setCurrentView('saved')}
            onNavigateToNotifications={() => setCurrentView('notifications')}
            onOpenDiscovery={handleOpenDiscovery}
          />
        );
      case 'explorer':
        return <ExplorerView onOpenDiscovery={handleOpenDiscovery} />;
      case 'assistant':
        return (
          <AIAssistantView
            initialPrompt={assistantPrompt}
            onClearInitialPrompt={() => setAssistantPrompt('')}
          />
        );
      case 'saved':
        return <SavedTrackerView onNavigateToExplorer={() => setCurrentView('explorer')} />;
      case 'notifications':
        return <NotificationsView />;
      case 'profile':
        return (
          <ProfileView
            onSaveSuccess={() => {
              // Optionally transition or stay
            }}
          />
        );
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardView
            onNavigateToExplorer={() => setCurrentView('explorer')}
            onNavigateToAssistant={() => setCurrentView('assistant')}
            onNavigateToSaved={() => setCurrentView('saved')}
            onNavigateToNotifications={() => setCurrentView('notifications')}
            onOpenDiscovery={handleOpenDiscovery}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/60 font-sans text-slate-800 antialiased flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenDiscovery={handleOpenDiscovery}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          onOpenDiscovery={handleOpenDiscovery}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-8">
          {renderView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[10px] font-semibold transition ${
            currentView === 'dashboard' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setCurrentView('explorer')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[10px] font-semibold transition ${
            currentView === 'explorer' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Compass className="h-4 w-4" />
          <span>Explorer</span>
        </button>

        <button
          onClick={handleOpenDiscovery}
          className="flex flex-col items-center gap-0.5 p-1 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md text-[10px] font-bold px-2.5"
        >
          <Sparkles className="h-4 w-4" />
          <span>Find</span>
        </button>

        <button
          onClick={() => setCurrentView('assistant')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[10px] font-semibold transition ${
            currentView === 'assistant' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Bot className="h-4 w-4" />
          <span>Assistant</span>
        </button>

        <button
          onClick={() => setCurrentView('saved')}
          className={`relative flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[10px] font-semibold transition ${
            currentView === 'saved' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <BookmarkCheck className="h-4 w-4" />
          <span>Tracker</span>
          {savedOpportunities.length > 0 && (
            <span className="absolute top-0 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-600 text-[8px] font-bold text-white">
              {savedOpportunities.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setCurrentView('notifications')}
          className={`relative flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[10px] font-semibold transition ${
            currentView === 'notifications' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Alerts</span>
          {unreadAlertsCount > 0 && (
            <span className="absolute top-0 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-600 text-[8px] font-bold text-white">
              {unreadAlertsCount}
            </span>
          )}
        </button>
      </nav>

      {/* Global Opportunity Detail & Eligibility Modal */}
      <OpportunityModal
        opportunity={selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
        onAskAssistant={handleAskAssistant}
      />

      {/* Multi-Agent Discovery Execution Modal */}
      <DiscoveryModal
        onCompleteViewExplorer={() => setCurrentView('explorer')}
      />

      {/* Authentication Modal */}
      <AuthModal
        onRegistrationSuccess={() => setCurrentView('profile')}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <OpportunitiesProvider>
        <MainLayout />
      </OpportunitiesProvider>
    </AuthProvider>
  );
}
