import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Agency, Property, AppSettings, AIMessage } from '../types';
import { isAuthenticated } from '../services/auth';

interface AppState {
  agencies: Agency[];
  properties: Property[];
  currentView: string;
  selectedAgency: Agency | null;
  selectedProperty: Property | null;
  settings: AppSettings;
  aiMessages: AIMessage[];
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

type AppAction =
  | { type: 'SET_AGENCIES'; payload: Agency[] }
  | { type: 'SET_PROPERTIES'; payload: Property[] }
  | { type: 'SET_CURRENT_VIEW'; payload: string }
  | { type: 'SET_SELECTED_AGENCY'; payload: Agency | null }
  | { type: 'SET_SELECTED_PROPERTY'; payload: Property | null }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'ADD_AI_MESSAGE'; payload: AIMessage }
  | { type: 'CLEAR_AI_MESSAGES' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_AUTHENTICATED'; payload: boolean };

const initialState: AppState = {
  agencies: [],
  properties: [],
  currentView: 'overview',
  selectedAgency: null,
  selectedProperty: null,
  settings: {
    language: 'en',
    theme: 'dark',
    notifications: true,
    autoUpdate: true,
  },
  aiMessages: [],
  loading: false,
  error: null,
  isAuthenticated: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_AGENCIES':
      return { ...state, agencies: action.payload };
    case 'SET_PROPERTIES':
      return { ...state, properties: action.payload };
    case 'SET_CURRENT_VIEW':
      return { ...state, currentView: action.payload };
    case 'SET_SELECTED_AGENCY':
      return { ...state, selectedAgency: action.payload };
    case 'SET_SELECTED_PROPERTY':
      return { ...state, selectedProperty: action.payload };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'ADD_AI_MESSAGE':
      return { ...state, aiMessages: [...state.aiMessages, action.payload] };
    case 'CLEAR_AI_MESSAGES':
      return { ...state, aiMessages: [] };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load saved settings and check authentication on mount
  useEffect(() => {
    // Check if user is authenticated (checks for 4property_auth_token)
    const authenticated = isAuthenticated();
    if (authenticated) {
      dispatch({ type: 'SET_AUTHENTICATED', payload: true });
      console.log('Session restored from localStorage');
    }

    const savedSettings = localStorage.getItem('4property-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('4property-settings', JSON.stringify(state.settings));
  }, [state.settings]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}