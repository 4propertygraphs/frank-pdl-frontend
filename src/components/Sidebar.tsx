import React from 'react';
import { 
  BarChart3, 
  Building, 
  FileText, 
  Shield, 
  Database, 
  Activity, 
  Settings,
  Home
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const menuItems = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'agencies', label: 'Agencies', icon: Building },
  { id: 'protect-data', label: 'Protect Data', icon: Shield },
  { id: 'share-bank', label: 'Share Bank', icon: Database },
  { id: 'track-on', label: 'Track On', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const translations = {
  en: {
    overview: 'Overview',
    agencies: 'Agencies',
    'protect-data': 'Protect Data',
    'share-bank': 'Share Bank',
    'track-on': 'Track On',
    settings: 'Settings',
  },
  cz: {
    overview: 'Přehled',
    agencies: 'Agentury',
    'protect-data': 'Ochrana dat',
    'share-bank': 'Share Bank',
    'track-on': 'Track On',
    settings: 'Nastavení',
  },
  ru: {
    overview: 'Обзор',
    agencies: 'Агентства',
    'protect-data': 'Защита данных',
    'share-bank': 'Share Bank',
    'track-on': 'Track On',
    settings: 'Настройки',
  },
  fr: {
    overview: 'Vue d\'ensemble',
    agencies: 'Agences',
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

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <Home className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-xl font-bold">4Property</h1>
            <p className="text-sm text-gray-400">codes</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    dispatch({ type: 'SET_SELECTED_PROPERTY', payload: null });
                    dispatch({ type: 'SET_CURRENT_VIEW', payload: item.id });
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{t[item.id as keyof typeof t] || item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Status */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>Connected</span>
        </div>
      </div>
    </div>
  );
}