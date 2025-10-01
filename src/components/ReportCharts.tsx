import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartData {
  name: string;
  value: number;
  avgPrice?: number;
}

interface ReportChartsProps {
  byCounty: Record<string, { count: number; avgPrice: number }>;
  byType: Record<string, { count: number; avgPrice: number }>;
  priceRanges: Array<{ label: string; count: number }>;
  priceHistory?: Array<{ month: string; avgPrice: number; count: number }>;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

export function CountyBarChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
        />
        <Legend />
        <Bar dataKey="value" fill="#3b82f6" name="Properties" animationDuration={1000} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TypePieChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
          animationBegin={0}
          animationDuration={1000}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function PriceRangeChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
        />
        <Legend />
        <Bar dataKey="value" fill="#10b981" name="Count" animationDuration={1000} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PriceHistoryChart({ data }: { data: Array<{ month: string; avgPrice: number; count: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" stroke="#6b7280" />
        <YAxis yAxisId="left" stroke="#6b7280" />
        <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
        <Tooltip
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
        />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="avgPrice"
          stroke="#3b82f6"
          strokeWidth={2}
          name="Avg Price (€)"
          animationDuration={1500}
          dot={{ fill: '#3b82f6', r: 4 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="count"
          stroke="#8b5cf6"
          strokeWidth={2}
          name="Property Count"
          animationDuration={1500}
          dot={{ fill: '#8b5cf6', r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function ReportCharts({ byCounty, byType, priceRanges, priceHistory }: ReportChartsProps) {
  const countyData: ChartData[] = Object.entries(byCounty)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([name, info]) => ({ name, value: info.count, avgPrice: info.avgPrice }));

  const typeData: ChartData[] = Object.entries(byType)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([name, info]) => ({ name, value: info.count, avgPrice: info.avgPrice }));

  const priceRangeData: ChartData[] = priceRanges.map(range => ({
    name: range.label,
    value: range.count,
  }));

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Properties by County</h3>
        <CountyBarChart data={countyData} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Properties by Type</h3>
        <TypePieChart data={typeData} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Distribution</h3>
        <PriceRangeChart data={priceRangeData} />
      </div>

      {priceHistory && priceHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Trends Over Time</h3>
          <PriceHistoryChart data={priceHistory} />
        </div>
      )}
    </div>
  );
}
