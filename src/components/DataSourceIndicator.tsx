import React from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface DataSourceIndicatorProps {
  sources: Array<{
    name: string;
    status: 'synced' | 'outdated' | 'error' | 'loading';
    lastSync?: string;
    color: string;
  }>;
}

export default function DataSourceIndicator({ sources }: DataSourceIndicatorProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'outdated':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'loading':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'synced':
        return 'Synced';
      case 'outdated':
        return 'Outdated';
      case 'error':
        return 'Error';
      case 'loading':
        return 'Loading';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Data Source Status</h3>
      <div className="space-y-3">
        {sources.map((source) => (
          <div key={source.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: source.color }}
              ></div>
              <span className="font-medium text-gray-900">{source.name}</span>
              {getStatusIcon(source.status)}
              <span className="text-sm text-gray-600">{getStatusText(source.status)}</span>
            </div>
            {source.lastSync && (
              <span className="text-xs text-gray-500">
                {new Date(source.lastSync).toLocaleString()}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}