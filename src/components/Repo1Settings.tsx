import React, { useState, useEffect } from 'react';
import { Settings, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { repo1BackendService } from '../services/repo1Backend';

export default function Repo1Settings() {
  const [backendUrl, setBackendUrl] = useState('http://localhost:3000/api');
  const [apiKey, setApiKey] = useState('');
  const [useRepo1, setUseRepo1] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const savedUrl = localStorage.getItem('repo1_backend_url');
    const savedApiKey = localStorage.getItem('repo1_api_key');
    const savedUseRepo1 = localStorage.getItem('use_repo1_backend') === 'true';

    if (savedUrl) setBackendUrl(savedUrl);
    if (savedApiKey) setApiKey(savedApiKey);
    setUseRepo1(savedUseRepo1);
  }, []);

  const testConnection = async () => {
    setIsConnecting(true);
    setErrorMessage('');

    try {
      repo1BackendService.setConfig({
        baseUrl: backendUrl,
        apiKey: apiKey || undefined,
      });

      const isConnected = await repo1BackendService.testConnection();

      if (isConnected) {
        setConnectionStatus('connected');
        localStorage.setItem('repo1_backend_url', backendUrl);
        localStorage.setItem('repo1_api_key', apiKey);
      } else {
        setConnectionStatus('error');
        setErrorMessage('Connection failed. Please check the backend URL.');
      }
    } catch (error: any) {
      setConnectionStatus('error');
      setErrorMessage(error.message || 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem('repo1_backend_url', backendUrl);
    localStorage.setItem('repo1_api_key', apiKey);
    localStorage.setItem('use_repo1_backend', useRepo1.toString());

    if (useRepo1) {
      testConnection();
    }
  };

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-900">Repo1 Backend Configuration</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={useRepo1}
              onChange={(e) => setUseRepo1(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-900">
              Use Repo1 Backend for MyHome, Daft, and WordPress integration
            </span>
          </label>
        </div>

        {useRepo1 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backend URL
              </label>
              <input
                type="text"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                placeholder="http://localhost:3000/api"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                The base URL of your repo1 backend API
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key (Optional)
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter API key if required"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Required if your backend uses authentication
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={testConnection}
                disabled={isConnecting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Test Connection
                  </>
                )}
              </button>

              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save Settings
              </button>

              {connectionStatus === 'connected' && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              )}

              {connectionStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Failed</span>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{errorMessage}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <h4 className="font-semibold text-blue-900 mb-2">Setup Instructions</h4>
              <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                <li>Clone the repo1 backend from GitHub: https://github.com/4propertygraphs/repo1</li>
                <li>Install dependencies: npm install</li>
                <li>Configure your .env file with database and API credentials</li>
                <li>Start the server: npm start</li>
                <li>Enter the backend URL above and test the connection</li>
              </ol>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Connected APIs</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  MyHome API
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Daft API
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  WordPress API
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
