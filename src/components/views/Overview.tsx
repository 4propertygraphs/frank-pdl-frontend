import React, { useEffect, useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { apiService } from "../../services/api";
import { cloudUploadService } from "../../services/cloudUpload";
import { Building, Users, DollarSign, TrendingUp, Upload, Cloud } from "lucide-react";

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

  const stats = [
    {
      title: "Total Properties",
      value: (totalPropertiesFromDB || properties.length).toString(),
      icon: Building,
      color: "bg-blue-500",
      change: "+12%",
      kyraInsight: "Strong portfolio growth this quarter",
    },
    {
      title: "Active Agencies",
      value: (activeAgenciesFromDB || agencies.length).toString(),
      icon: Users,
      color: "bg-green-500",
      change: "+5%",
      kyraInsight: "Excellent agency partnerships",
    },
    {
      title: "Average Price",
      value:
        properties.length > 0
          ? `€${Math.round(
              properties.reduce((sum, p) => sum + p.price, 0) /
                properties.length
            ).toLocaleString()}`
          : "€0",
      icon: DollarSign,
      color: "bg-purple-500",
      change: "+8%",
      kyraInsight: "Above market average pricing",
    },
    {
      title: "Market Growth",
      value: "15.3%",
      icon: TrendingUp,
      color: "bg-orange-500",
      change: "+2.1%",
      kyraInsight: "Positive market momentum",
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
          return (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-sm text-green-600 font-medium mt-1">
                    {stat.change}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-lg ${stat.color} group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs text-gray-600 mt-1">{stat.kyraInsight}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {properties.slice(0, 5).map((property) => (
            <div
              key={property.id}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{property.title}</p>
                <p className="text-sm text-gray-600">
                  {property.location?.address}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  €{(property.price || 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">{property.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
