import React, { useEffect, useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { apiService } from "../../services/api";
import { cloudUploadService } from "../../services/cloudUpload";
import { Building, Users, DollarSign, TrendingUp, Upload, Cloud, Activity, MapPin, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function Overview() {
  const { state, dispatch } = useApp();
  const { agencies, properties, settings, loading } = state;
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [totalPropertiesFromDB, setTotalPropertiesFromDB] = useState<number>(0);
  const [activeAgenciesFromDB, setActiveAgenciesFromDB] = useState<number>(0);

  useEffect(() => {
    // Don't auto-load - user must click button to load data
    if (!hasLoadedOnce && properties.length === 0 && !loading) {
      console.log("📊 Overview: Ready to load data (manual action required)");
      setHasLoadedOnce(true);
    }
    // Load stats from database
    void loadStatsFromDatabase();
  }, [hasLoadedOnce, properties.length, loading]);

  const loadStatsFromDatabase = async () => {
    try {
      const { supabase } = await import('../../services/supabase');

      // Get total properties count and active agencies count
      const { data, error } = await supabase
        .from('agencies')
        .select('property_count, is_active')
        .eq('is_active', true)
        .gt('property_count', 0);

      if (error) {
        console.error('Failed to load stats from database:', error);
        return;
      }

      if (data && data.length > 0) {
        const totalProps = data.reduce((sum, agency) => sum + (agency.property_count || 0), 0);
        setTotalPropertiesFromDB(totalProps);
        setActiveAgenciesFromDB(data.length);
        console.log(`📊 Loaded stats: ${totalProps} properties from ${data.length} agencies`);
      }
    } catch (err: any) {
      console.error('Error loading stats from database:', err);
    }
  };

  useEffect(() => {
    const checkAndAutoSync = async () => {
      const lastSync = localStorage.getItem('lastAutoSync');
      const now = Date.now();
      const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;

      if (!lastSync || now - parseInt(lastSync) > twoDaysInMs) {
        console.log('🔄 Auto-sync triggered (2 days passed)');
        setUploadProgress('Auto-syncing from XML...');

        try {
          const result = await cloudUploadService.uploadAllXMLFiles();
          console.log(`✅ Auto-sync complete: ${result.success} properties`);

          localStorage.setItem('lastAutoSync', now.toString());

          const allProperties = await cloudUploadService.getPropertiesFromDatabase();
          dispatch({ type: "SET_PROPERTIES", payload: allProperties });

          setUploadProgress(`✅ Auto-synced ${result.success} properties`);
          setTimeout(() => setUploadProgress(""), 3000);
        } catch (error: any) {
          console.error('Auto-sync failed:', error);
          setUploadProgress("");
        }
      }
    };

    if (hasLoadedOnce && properties.length > 0) {
      checkAndAutoSync();
    }

    const interval = setInterval(checkAndAutoSync, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [hasLoadedOnce, properties.length]);

  const loadData = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      console.log("📁 Loading agencies...");
      const agencies = await apiService.getAgencies();

      console.log("📋 Loading properties from XML files...");
      setUploadProgress("Loading properties from XML...");

      const result = await cloudUploadService.loadAllXMLFiles();
      const allProperties = await cloudUploadService.getAllProperties();

      console.log(`✅ Loaded ${agencies.length} agencies and ${allProperties.length} properties from ${result.loaded} XML files`);
      setUploadProgress(`✅ Loaded ${allProperties.length} properties from ${result.loaded} agencies`);

      dispatch({ type: "SET_AGENCIES", payload: agencies });
      dispatch({ type: "SET_PROPERTIES", payload: allProperties });

      setTimeout(() => setUploadProgress(""), 3000);
    } catch (error: any) {
      console.error("💥 Data loading failed:", error);
      dispatch({
        type: "SET_ERROR",
        payload: `Data loading failed: ${error.message}`,
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const handleUploadToCloud = async () => {
    if (isUploading) return;

    const confirmed = window.confirm(
      `This will upload ${properties.length} properties from loaded XML files to Supabase. Continue?`
    );

    if (!confirmed) return;

    setIsUploading(true);
    setUploadProgress(`Uploading ${properties.length} properties to Supabase...`);

    try {
      const result = await cloudUploadService.uploadAllXMLFiles();

      localStorage.setItem('lastAutoSync', Date.now().toString());

      setUploadProgress(
        `✅ Sync complete: ${result.success} uploaded, ${result.failed} failed`
      );

      if (result.errors.length > 0) {
        console.error("Upload errors:", result.errors);
      }

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

  const averagePrice = properties.length > 0
    ? Math.round(properties.reduce((sum, p) => sum + p.price, 0) / properties.length)
    : 0;

  const totalValue = properties.reduce((sum, p) => sum + p.price, 0);
  const availableProperties = properties.filter(p => p.status === 'available').length;

  const stats = [
    {
      title: "Total Properties",
      value: (totalPropertiesFromDB || properties.length).toString(),
      icon: Building,
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      change: "+12%",
      trend: "up",
      kyraInsight: "Strong portfolio growth this quarter",
    },
    {
      title: "Active Agencies",
      value: (activeAgenciesFromDB || agencies.length).toString(),
      icon: Users,
      color: "bg-gradient-to-br from-green-500 to-green-600",
      change: "+5%",
      trend: "up",
      kyraInsight: "Excellent agency partnerships",
    },
    {
      title: "Average Price",
      value: averagePrice > 0 ? `€${averagePrice.toLocaleString()}` : "€0",
      icon: DollarSign,
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      change: "+8%",
      trend: "up",
      kyraInsight: "Above market average pricing",
    },
    {
      title: "Available Now",
      value: availableProperties.toString(),
      icon: TrendingUp,
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      change: "+2.1%",
      trend: "up",
      kyraInsight: "High availability for new clients",
    },
  ];

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

  if (loading && properties.length === 0) {
    return (
      <div className="flex-1 p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Cloud className="w-16 h-16 text-blue-600 animate-pulse mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Loading properties...</h2>
          <p className="text-gray-500 mt-2">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

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
                Uploading...
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === "up" ? ArrowUpRight : ArrowDownRight;
          return (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300 group cursor-pointer hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">
                    {stat.value}
                  </p>
                  <div className={`flex items-center gap-1 text-sm font-semibold ${
                    stat.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}>
                    <TrendIcon className="w-4 h-4" />
                    {stat.change}
                  </div>
                </div>
                <div
                  className={`p-4 rounded-xl ${stat.color} shadow-md group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="border-t pt-3 mt-4">
                <p className="text-xs text-gray-600 leading-relaxed">{stat.kyraInsight}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Activity - 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Recent Properties
            </h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All
            </button>
          </div>
          <div className="space-y-3">
            {properties.slice(0, 5).map((property) => (
              <div
                key={property.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-all duration-200 cursor-pointer border border-transparent hover:border-blue-200 group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <Building className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {property.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <p className="text-sm text-gray-600 truncate">
                      {property.location?.address || 'No address'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-lg">
                    €{(property.price || 0).toLocaleString()}
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

        {/* Quick Stats - 1 column */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-blue-100">Total Portfolio Value</p>
                <p className="text-2xl font-bold">€{totalValue.toLocaleString()}</p>
              </div>
            </div>
            <div className="border-t border-white/20 pt-4 mt-4">
              <p className="text-sm text-blue-100">Avg. property value increased by 8% this month</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Last Sync
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Update</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Properties Synced</span>
                <span className="text-sm font-medium text-gray-900">
                  {properties.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Next Auto-Sync</span>
                <span className="text-sm font-medium text-gray-900">2 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
