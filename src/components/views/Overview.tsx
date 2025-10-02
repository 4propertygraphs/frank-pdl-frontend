import React, { useEffect, useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { cloudUploadService } from "../../services/cloudUpload";
import { Upload, Cloud, Building, Users, DollarSign, Clock } from "lucide-react";

interface Stats {
  totalProperties: number;
  totalAgencies: number;
  avgPrice: number;
  lastUpdate: string;
}

export default function Overview() {
  const { state } = useApp();
  const { settings } = state;
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const { supabase } = await import('../../services/supabase');

      const { data: properties, error: propsError } = await supabase
        .from('properties')
        .select('price');

      const { data: agencies, error: agenciesError } = await supabase
        .from('agencies')
        .select('id')
        .eq('is_active', true);

      if (propsError || agenciesError) {
        console.error('Error loading stats:', propsError || agenciesError);
        setLoadingStats(false);
        return;
      }

      const totalProperties = properties?.length || 0;
      const totalAgencies = agencies?.length || 0;
      const totalValue = properties?.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0) || 0;
      const avgPrice = totalProperties > 0 ? Math.round(totalValue / totalProperties) : 0;

      const lastUpdate = localStorage.getItem('lastAutoSync');
      const lastUpdateDate = lastUpdate ? new Date(parseInt(lastUpdate)).toLocaleString() : 'Never';

      setStats({
        totalProperties,
        totalAgencies,
        avgPrice,
        lastUpdate: lastUpdateDate
      });
      setLoadingStats(false);
    } catch (err) {
      console.error('Error loading stats:', err);
      setLoadingStats(false);
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

      await loadStats();

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
      title: "Kyra Assistant",
      subtitle: "Your AI-powered property management assistant",
    },
    cz: {
      title: "Kyra Asistent",
      subtitle: "Váš AI asistent pro správu nemovitostí",
    },
  };

  const t = translations[settings.language as "en" | "cz"] || translations.en;

  const statCards = [
    {
      title: "Total Properties",
      value: loadingStats ? "..." : stats?.totalProperties.toLocaleString() || "0",
      icon: Building,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      title: "Active Agencies",
      value: loadingStats ? "..." : stats?.totalAgencies.toString() || "0",
      icon: Users,
      bgColor: "bg-green-50",
      iconColor: "text-green-600"
    },
    {
      title: "Average Price",
      value: loadingStats ? "..." : `€${stats?.avgPrice.toLocaleString() || "0"}`,
      icon: DollarSign,
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600"
    },
    {
      title: "Last Update",
      value: loadingStats ? "..." : stats?.lastUpdate || "Never",
      icon: Clock,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600"
    },
  ];

  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Database Overview</h2>
          <p className="text-gray-600 mb-6">
            Your property management system is synced with {stats?.totalProperties.toLocaleString() || 0} properties across {stats?.totalAgencies || 0} active agencies.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-blue-50 rounded-lg p-6">
              <Building className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Properties</h3>
              <p className="text-3xl font-bold text-blue-600">{stats?.totalProperties.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-600 mt-2">Total listings</p>
            </div>
            <div className="bg-green-50 rounded-lg p-6">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Agencies</h3>
              <p className="text-3xl font-bold text-green-600">{stats?.totalAgencies || 0}</p>
              <p className="text-sm text-gray-600 mt-2">Active partners</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-6">
              <DollarSign className="w-8 h-8 text-orange-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Avg Price</h3>
              <p className="text-3xl font-bold text-orange-600">€{stats?.avgPrice.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-600 mt-2">Market average</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
