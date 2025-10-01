import React, { useEffect, useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { apiService } from "../../services/api";
import { Building, Users, DollarSign, TrendingUp } from "lucide-react";


const resolveAgencyLookupKey = (agency: any): string | null => {
  if (!agency) return null;

  const candidates = [
    agency?.unique_key,
    agency?.Key,
    agency?.UUID,
    agency?.sitePrefix,
    agency?.AcquiantCustomer?.SitePrefix,
  ];

  const candidate = candidates.find(
    (value) => typeof value === 'string' && value.trim().length > 0
  );
  if (candidate) {
    return (candidate as string).trim();
  }

  const fallbackId = agency?.id ?? agency?.SiteID ?? agency?.siteId;
  if (fallbackId !== undefined && fallbackId !== null) {
    const trimmed = String(fallbackId).trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return null;
};
export default function Overview() {
  const { state, dispatch } = useApp();
  const { agencies, properties, settings } = state;

  useEffect(() => {
    console.log("📊 Overview component mounted, loading data...");
    loadData();
  }, []);

  const loadData = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      // Načti agentury
      console.log("📁 Overview: Loading agencies from agencies.json...");
      const agencies = await apiService.getAgencies();
      console.log(`📁 Overview: Loaded ${agencies.length} agencies from JSON`);

      // Načti nemovitosti pro každou agenturu
      console.log("🌐 Overview: Loading properties from API...");
      const propertiesByAgency = await Promise.all(
        agencies.map((agency) => {
          const lookupKey = resolveAgencyLookupKey(agency);

          if (!lookupKey) {
            console.warn('⚠️ Overview: skipping agency with no lookup key', agency);
            return Promise.resolve({ agencyId: null, properties: [] });
          }

          return apiService
            .getPropertiesForAgency(lookupKey)
            .then((props) => ({ agencyId: lookupKey, properties: props }))
            .catch((error) => {
              console.warn(`⚠️ Overview: API failed for agency ${lookupKey}:`, error);
              return { agencyId: lookupKey, properties: [] };
            });
        })
      );

      // Sloučení a normalizace všech nemovitostí
      const allProperties = propertiesByAgency.flatMap(
        ({ agencyId, properties }) =>
          properties.map((property) => ({
            ...property,
            agency_id: agencyId,
            title: property.title || property.address || "No Address",
            price: property.price || 0,
            images: property.images || [],
            location: {
              address: property.address || "No Address",
              city: property.city || "Unknown",
              country: property.country || "Ireland",
            },
            status: property.status || "active",
            created_at: property.created_at || new Date().toISOString(),
            updated_at: property.updated_at || new Date().toISOString(),
          }))
      );

      console.log(`✅ Overview: Processed ${allProperties.length} properties from API`);

      // Uložení do stavu
      dispatch({ type: "SET_AGENCIES", payload: agencies });
      dispatch({ type: "SET_PROPERTIES", payload: allProperties });
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

  const stats = [
    {
      title: "Total Properties",
      value: properties.length.toString(),
      icon: Building,
      color: "bg-blue-500",
      change: "+12%",
      kyraInsight: "Strong portfolio growth this quarter",
    },
    {
      title: "Active Agencies",
      value: agencies.length.toString(),
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

  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
        <p className="text-gray-600">{t.subtitle}</p>
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
