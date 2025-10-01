import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import Sidebar from './components/Sidebar';
import LoginForm from './components/LoginForm';
import KyraFloatingChat from './components/KyraFloatingChat';
import Overview from './components/views/Overview';
import Agencies from './components/views/Agencies';
import PropertyDetail from './components/views/PropertyDetail';
import ProtectData from './components/views/ProtectData';
import ShareBank from './components/views/ShareBank';
import TrackOn from './components/views/TrackOn';
import Settings from './components/views/Settings';

declare global {
  interface Window {
    electronAPI?: {
      apiCall: (endpoint: string, options: any) => Promise<any>;
      platform: string;
      versions: any;
    };
  }
}

function AppContent() {
  const { state } = useApp();
  const { currentView, selectedProperty, isAuthenticated } = state;

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const renderCurrentView = () => {
    // If a property is selected, show property detail
    if (selectedProperty) {
      return <PropertyDetail />;
    }

    switch (currentView) {
      case 'overview':
        return <Overview />;
      case 'agencies':
        return <Agencies />;
      case 'protect-data':
        return <ProtectData />;
      case 'share-bank':
        return <ShareBank />;
      case 'track-on':
        return <TrackOn />;
      case 'settings':
        return <Settings />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {renderCurrentView()}
      </main>
      <KyraFloatingChat />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;