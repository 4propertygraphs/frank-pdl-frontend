import React, { useEffect, useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { cloudUploadService } from "../../services/cloudUpload";
import { Building, Users, DollarSign, TrendingUp, Upload, Cloud, MapPin, Home, Loader2, Activity, BarChart3 } from "lucide-react";

interface DBStats {
  totalProperties: number;
  activeAgencies: number;
  avgPrice: number;
  totalValue: number;
  topAgencies: Array<{ name: string; count: number; avgPrice: number }>;
  recentProperties: Array<any>;
  countiesCounts: Record<string, number>;
  typeCounts: Record<string, number>;
  priceRanges: Array<{ label: string; count: number }>;
}

export default function Overview() {
  const { state, dispatch } = useApp();
  const { settings } = state;
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [stats, setStats] = useState<DBStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllStats();
  }, []);

  const loadAllStats = async () => {
    try {
      setLoading(true);
      const { supabase } = await import('../../services/supabase');

      const { data: agencies, error: agenciesError } = await supabase
        .from('agencies')
        .select('*')
        .eq('is_active', true);

      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (agenciesError || propertiesError) {
        console.error('Error loading data:', agenciesError || propertiesError);
        setLoading(false);
        return;
      }

      const activeAgencies = agencies?.filter(a => a.property_count > 0) || [];
      const allProperties = properties || [];

      const totalValue = allProperties.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);
      const avgPrice = allProperties.length > 0 ? Math.round(totalValue / allProperties.length) : 0;

      const topAgencies = activeAgencies
        .map(a => {
          const agencyProps = allProperties.filter(p => p.agency_id === a.agency_id);
          const agencyTotal = agencyProps.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);
          const agencyAvg = agencyProps.length > 0 ? Math.round(agencyTotal / agencyProps.length) : 0;
          return {
            name: a.name,
            count: agencyProps.length,
            avgPrice: agencyAvg
          };
        })
        .filter(a => a.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const countiesCounts: Record<string, number> = {};
      allProperties.forEach(prop => {
        let county = 'Unknown';
        if (prop.county) {
          try {
            const countyObj = typeof prop.county === 'string' ? JSON.parse(prop.county) : prop.county;
            county = countyObj['#text'] || countyObj;
          } catch {
            county = prop.county;
          }
        }
        if (!county || county === 'Unknown') {
          if (prop.title) {
            let lastPart = prop.title.split(',').map((s: string) => s.trim()).filter(Boolean).pop();
            if (lastPart) {
              lastPart = lastPart.replace(/\.$/, '');
              lastPart = lastPart.replace(/\b[A-Z]\d{2}\s*[A-Z0-9]{4}\b/g, '').trim();
              const words = lastPart.split(/\s+/);
              const filteredWords = words.filter((w: string) => !/^[A-Z]\d{2}/.test(w));
              lastPart = filteredWords.join(' ').trim();
              if (lastPart.length > 0 && lastPart.length < 50 && !/\d{2,}/.test(lastPart)) {
                county = lastPart;
              }
            }
          }
        }
        countiesCounts[county] = (countiesCounts[county] || 0) + 1;
      });

      const typeCounts: Record<string, number> = {};
      allProperties.forEach(prop => {
        let type = 'Other';
        if (prop.type) {
          try {
            if (typeof prop.type === 'string') {
              const typeObj = JSON.parse(prop.type);
              type = typeObj['#text'] || typeObj.toString();
            } else if (typeof prop.type === 'object' && prop.type['#text']) {
              type = prop.type['#text'];
            } else {
              type = String(prop.type);
            }
            if (!type || type === '' || type === '[object Object]' || type === 'ERROR' || type === 'Unknown') {
              type = 'Other';
            }
          } catch (e) {
            type = 'Other';
          }
        }
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });

      const priceRanges = [
        { label: '< €100k', min: 0, max: 100000 },
        { label: '€100k - €200k', min: 100000, max: 200000 },
        { label: '€200k - €300k', min: 200000, max: 300000 },
        { label: '€300k - €500k', min: 300000, max: 500000 },
        { label: '> €500k', min: 500000, max: Infinity },
      ].map(range => ({
        label: range.label,
        count: allProperties.filter(p => {
          const price = parseFloat(p.price) || 0;
          return price >= range.min && price < range.max;
        }).length
      }));

      setStats({
        totalProperties: allProperties.length,
        activeAgencies: activeAgencies.length,
        avgPrice,
        totalValue,
        topAgencies,
        recentProperties: allProperties.slice(0, 10),
        countiesCounts,
        typeCounts,
        priceRanges
      });

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading stats:', err);
      setLoading(false);
    }
  };

  const handleUploadToCloud = async () => {
    if (isUploading) return;

    const confirmed = window.confirm('This will sync all XML files to Supabase. Continue?');
    if (!confirmed) return;

    setIsUploading(true);
    setUploadProgress('Uploading properties to Supabase...');

    try {
      const result = await cloudUploadService.uploadAllXMLFiles();
      localStorage.setItem('lastAutoSync', Date.now().toString());
      setUploadProgress(`✅ Sync complete: ${result.success} uploaded, ${result.failed} failed`);

      await loadAllStats();

      setTimeout(() => {
        setUploadProgress("");
        setIsUploading(false);
      }, 3000);
    } catch (error: any) {
      console.error("Upload failed:", error);
      setUploadProgress(`❌ Upload failed: ${error.message}`);
      setTimeout(() => {
        setUploadProgress("");
        setIsUploading(false);
      }, 5000);
    }
  };

  const translations = {
    en: {
      title: "Dashboard Overview",
      subtitle: "Real-time insights into your property portfolio",
    },
    cz: {
      title: "Přehled dashboard",
      subtitle: "Poznatky v reálném čase o vašem portfoliu nemovitostí",
    },
  };

  const t = translations[settings.language as "en" | "cz"] || translations.en;

  if (loading) {
    return (
      <div className="flex-1 p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Loading dashboard...</h2>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex-1 p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Cloud className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">No data available</h2>
          <p className="text-gray-500 mt-2">Click "Sync All to Cloud" to load properties</p>
        </div>
      </div>
    );
  }

  const mainStats = [
    {
      title: "Total Properties",
      value: stats.totalProperties.toLocaleString(),
      icon: Building,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      title: "Active Agencies",
      value: stats.activeAgencies.toString(),
      icon: Users,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      iconColor: "text-green-600"
    },
    {
      title: "Average Price",
      value: `€${stats.avgPrice.toLocaleString()}`,
      icon: DollarSign,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600"
    },
    {
      title: "Total Value",
      value: `€${stats.totalValue.toLocaleString()}`,
      icon: TrendingUp,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600"
    },
  ];

  const topCounties = Object.entries(stats.countiesCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topTypes = Object.entries(stats.typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          {uploadProgress && (
            <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-lg border">
              {uploadProgress}
            </div>
          )}
          <button
            onClick={handleUploadToCloud}
            disabled={isUploading}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold shadow-md transition-all ${
              isUploading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg"
            }`}
          >
            {isUploading ? (
              <>
                <Cloud className="w-5 h-5 animate-pulse" />
                Syncing...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Sync All to Cloud
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {mainStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-4 rounded-xl ${stat.bgColor}`}>
                  <Icon className={`w-7 h-7 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Recent Properties
            </h2>
          </div>
          <div className="space-y-3">
            {stats.recentProperties.map((property) => (
              <div
                key={property.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-all duration-200 cursor-pointer border border-transparent hover:border-blue-200 group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <Building className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {property.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <p className="text-sm text-gray-600 truncate">
                      {property.address || 'No address'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-lg">
                    €{(parseFloat(property.price) || 0).toLocaleString()}
                  </p>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    property.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {property.status || 'unknown'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Top Agencies
            </h3>
            <div className="space-y-3">
              {stats.topAgencies.map((agency, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{agency.name}</p>
                    <p className="text-xs text-gray-500">Avg: €{agency.avgPrice.toLocaleString()}</p>
                  </div>
                  <span className="text-sm font-bold text-blue-600">{agency.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-600" />
              Price Ranges
            </h3>
            <div className="space-y-3">
              {stats.priceRanges.map((range, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{range.label}</span>
                  <span className="text-sm font-bold text-gray-900">{range.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Top 5 Counties</h2>
          </div>
          <div className="space-y-4">
            {topCounties.map(([county, count], index) => {
              const maxCount = topCounties[0][1];
              const percentage = (count / maxCount) * 100;
              return (
                <div key={county} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{county}</span>
                    <span className="text-sm font-bold text-gray-900">{count} properties</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-6">
            <Home className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Top 5 Property Types</h2>
          </div>
          <div className="space-y-4">
            {topTypes.map(([type, count], index) => {
              const maxCount = topTypes[0][1];
              const percentage = (count / maxCount) * 100;
              return (
                <div key={type} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{type}</span>
                    <span className="text-sm font-bold text-gray-900">{count} properties</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
