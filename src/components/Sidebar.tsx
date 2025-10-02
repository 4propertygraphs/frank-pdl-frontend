import React, { useState } from 'react';
import {
  BarChart3,
  Building,
  FileText,
  Shield,
  Database,
  Activity,
  Settings,
  Home,
  Menu,
  X
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useDeviceDetection } from '../utils/deviceDetection';

const menuItems = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'agencies', label: 'Agencies', icon: Building },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'protect-data', label: 'Protect Data', icon: Shield },
  { id: 'share-bank', label: 'Share Bank', icon: Database },
  { id: 'track-on', label: 'Track On', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const translations = {
  en: {
    overview: 'Overview',
    agencies: 'Agencies',
    reports: 'Reports',
    'protect-data': 'Protect Data',
    'share-bank': 'Share Bank',
    'track-on': 'Track On',
    settings: 'Settings',
  },
  cz: {
    overview: 'Přehled',
    agencies: 'Agentury',
    reports: 'Reporty',
    'protect-data': 'Ochrana dat',
    'share-bank': 'Share Bank',
    'track-on': 'Track On',
    settings: 'Nastavení',
  },
  ru: {
    overview: 'Обзор',
    agencies: 'Агентства',
    reports: 'Отчеты',
    'protect-data': 'Защита данных',
    'share-bank': 'Share Bank',
    'track-on': 'Track On',
    settings: 'Настройки',
  },
  fr: {
    overview: 'Vue d\'ensemble',
    agencies: 'Agences',
    reports: 'Rapports',
    'protect-data': 'Protection des données',
    'share-bank': 'Share Bank',
    'track-on': 'Track On',
    settings: 'Paramètres',
  },
};

export default function Sidebar() {
  const { state, dispatch } = useApp();
  const { currentView, settings } = state;
  const t = translations[settings.language];
  const device = useDeviceDetection();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (viewId: string) => {
    dispatch({ type: 'SET_SELECTED_PROPERTY', payload: null });
    dispatch({ type: 'SET_CURRENT_VIEW', payload: viewId });
    if (device.isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const SidebarContent = () => (
    <>
      <div className={`${device.isMobile || device.isTablet ? 'p-4' : 'p-6'} border-b border-gray-700`}>
        <div className="flex items-center gap-3">
          <Home className={`${device.isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-blue-400`} />
          <div>
            <h1 className={`${device.isMobile ? 'text-lg' : 'text-xl'} font-bold`}>4Property</h1>
            <p className={`${device.isMobile ? 'text-xs' : 'text-sm'} text-gray-400`}>codes</p>
          </div>
        </div>
      </div>

      <nav className={`flex-1 ${device.isMobile ? 'p-2' : 'p-4'} overflow-y-auto`}>
        <ul className={`${device.isMobile ? 'space-y-1' : 'space-y-2'}`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 ${
                    device.isMobile ? 'px-3 py-2 text-sm' : device.isTV ? 'px-6 py-4 text-lg' : 'px-4 py-3'
                  } rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:scale-102'
                  }`}
                >
                  <Icon className={`${device.isMobile ? 'w-4 h-4' : device.isTV ? 'w-7 h-7' : 'w-5 h-5'}`} />
                  {(!device.isMobile || isMobileMenuOpen) && (
                    <span className="truncate">{t[item.id as keyof typeof t] || item.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={`${device.isMobile ? 'p-2' : 'p-4'} border-t border-gray-700`}>
        <div className={`flex items-center gap-2 ${device.isMobile ? 'text-xs' : 'text-sm'} text-gray-400`}>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Connected</span>
        </div>
      </div>
    </>
  );

  if (device.isMobile) {
    return (
      <>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="fixed top-4 left-4 z-50 bg-gray-900 text-white p-3 rounded-lg shadow-lg lg:hidden"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {isMobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="fixed top-0 left-0 bottom-0 w-64 bg-gray-900 text-white flex flex-col z-50 lg:hidden transform transition-transform duration-300 shadow-2xl">
              <SidebarContent />
            </div>
          </>
        )}
      </>
    );
  }

  if (device.isTablet) {
    return (
      <div className="w-20 lg:w-64 bg-gray-900 text-white flex flex-col transition-all duration-300">
        <SidebarContent />
      </div>
    );
  }

  return (
    <div className={`${device.isTV ? 'w-80' : 'w-64'} bg-gray-900 text-white flex flex-col transition-all duration-300`}>
      <SidebarContent />
    </div>
  );
}