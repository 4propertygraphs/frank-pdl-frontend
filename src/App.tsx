import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import Sidebar from './components/Sidebar';
import LoginForm from './components/LoginForm';
import KyraFloatingChat from './components/KyraFloatingChat';
import Overview from './components/views/Overview';
import Agencies from './components/views/Agencies';
import PropertyDetail from './components/views/PropertyDetail';
import Reports from './components/views/Reports';
import ProtectData from './components/views/ProtectData';
import ShareBank from './components/views/ShareBank';
import TrackOn from './components/views/TrackOn';
import Settings from './components/views/Settings';
import { useDeviceDetection } from './utils/deviceDetection';

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
  const device = useDeviceDetection();

  if (!isAuthenticated) {
    return (
      <div className="w-screen h-screen flex items-center justify-center p-0 m-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
        <LoginForm />
      </div>
    );
  }

  const renderCurrentView = () => {
    if (selectedProperty) {
      return <PropertyDetail />;
    }

    switch (currentView) {
      case 'overview':
        return <Overview />;
      case 'agencies':
        return <Agencies />;
      case 'reports':
        return <Reports />;
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
    <div className={`flex w-screen h-screen bg-gray-100 m-0 p-0 ${device.isMobile ? 'flex-col' : ''}`}>
      <Sidebar />
      <main className={`flex-1 overflow-auto ${
        device.isMobile ? 'pt-16' : ''
      } ${device.isTV ? 'text-lg' : ''}`}>
        <div className={`w-full h-full ${
          device.isMobile ? 'p-4' :
          device.isTablet ? 'p-6' :
          device.isTV ? 'p-8' :
          'p-6'
        }`}>
          {renderCurrentView()}
        </div>
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