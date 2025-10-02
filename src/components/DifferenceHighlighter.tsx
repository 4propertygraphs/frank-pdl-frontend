import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface DifferenceHighlighterProps {
  value: any;
  referenceValue: any;
  type: 'text' | 'number' | 'currency' | 'date';
  sourceName: string;
  hasDifference: boolean;
}

export default function DifferenceHighlighter({ 
  value, 
  referenceValue, 
  type, 
  sourceName, 
  hasDifference 
}: DifferenceHighlighterProps) {
  const formatValue = (val: any, valueType: string): string => {
    if (val === undefined || val === null || val === '') {
      return '-';
    }

    switch (valueType) {
      case 'currency':
        return `€${Number(val).toLocaleString()}`;
      case 'number':
        return Number(val).toLocaleString();
      case 'date':
        return new Date(val).toLocaleDateString();
      default:
        return String(val);
    }
  };

  const getDifferencePercentage = (): number | null => {
    if (type !== 'currency' && type !== 'number') return null;
    
    const num1 = Number(value);
    const num2 = Number(referenceValue);
    
    if (isNaN(num1) || isNaN(num2) || num2 === 0) return null;
    
    return Math.round(((num1 - num2) / num2) * 100);
  };

  const percentage = getDifferencePercentage();
  const formattedValue = formatValue(value, type);

  if (!hasDifference) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-gray-600">{formattedValue}</span>
        <div className="w-2 h-2 bg-green-500 rounded-full" title="Consistent across sources"></div>
      </div>
    );
  }

  return (
    <div className="bg-red-100 border-l-4 border-red-500 px-3 py-2 rounded-r">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-red-900">{formattedValue}</span>
        <div className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-red-600" />
          {percentage !== null && (
            <span className="text-xs text-red-600 font-medium">
              {percentage > 0 ? '+' : ''}{percentage}%
            </span>
          )}
        </div>
      </div>
      {percentage !== null && Math.abs(percentage) > 5 && (
        <div className="flex items-center gap-1 mt-1">
          {percentage > 0 ? (
            <TrendingUp className="w-3 h-3 text-red-600" />
          ) : (
            <TrendingDown className="w-3 h-3 text-green-600" />
          )}
          <span className="text-xs text-red-700">
            Significant difference from {sourceName}
          </span>
        </div>
      )}
    </div>
  );
}