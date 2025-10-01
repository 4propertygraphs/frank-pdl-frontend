import React, { useEffect, useMemo, useState } from 'react';
import { Building, Search, ArrowLeft, RefreshCw } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { apiService } from '../../services/api';
import { propertySyncService } from '../../services/propertySync';
import { cloudUploadService } from '../../services/cloudUpload';

type AgencyRecord = Awaited<ReturnType<typeof apiService.getAgencies>>[number];

type PropertiesCache = Record<string, any[]>;
let fallbackKeyCache = new WeakMap<object, string>();
const usedAgencyKeys = new Set<string>();
const agencyKeyCounters = new Map<string, number>();
let fallbackKeySequence = 0;

const resetAgencyKeyCaches = () => {
  fallbackKeyCache = new WeakMap<object, string>();
  usedAgencyKeys.clear();
  agencyKeyCounters.clear();
  fallbackKeySequence = 0;
};

const ensureUniqueAgencyKey = (baseKey: string) => {
  const base = baseKey && baseKey.trim() ? baseKey.trim() : `agency-fallback-${fallbackKeySequence++}`;
  if (!usedAgencyKeys.has(base)) {
    usedAgencyKeys.add(base);
    return base;
  }

  const counterStart = agencyKeyCounters.get(base) ?? 1;
  let counter = counterStart;
  let candidateKey = `${base}__${counter}`;
  while (usedAgencyKeys.has(candidateKey)) {
    counter += 1;
    candidateKey = `${base}__${counter}`;
  }
  agencyKeyCounters.set(base, counter + 1);
  usedAgencyKeys.add(candidateKey);
  return candidateKey;
};

resetAgencyKeyCaches();

const buildAgencyKey = (agency: AgencyRecord | null | undefined) => {
  if (!agency) return '';

  const cached = fallbackKeyCache.get(agency as object);
  if (cached) return cached;

  const candidates = [
    (agency as any)?.unique_key,
    (agency as any)?.Key,
    (agency as any)?.UUID,
    (agency as any)?.SitePrefix,
    (agency as any)?.sitePrefix,
    (agency as any)?.acquaintSource?.sitePrefix,
  ];

  const candidate = candidates.find((value) => {
    if (value === undefined || value === null) return false;
    const trimmed = String(value).trim();
    if (!trimmed) return false;
    const lower = trimmed.toLowerCase();
    return lower !== 'undefined' && lower !== 'null' && lower !== 'undefined-undefined';
  });

  if (candidate) {
    const unique = ensureUniqueAgencyKey(String(candidate).trim().toLowerCase());
    fallbackKeyCache.set(agency as object, unique);
    return unique;
  }

  const fallbackId = (agency as any)?.id ?? (agency as any)?.SiteID ?? (agency as any)?.siteId;
  if (fallbackId !== undefined && fallbackId !== null) {
    const base = `agency-${String(fallbackId).trim()}`;
    const unique = ensureUniqueAgencyKey(base);
    fallbackKeyCache.set(agency as object, unique);
    return unique;
  }

  const fallbackName =
    ((agency as any)?.name ?? (agency as any)?.Name ?? (agency as any)?.OfficeName ?? '').toString().trim();

  if (fallbackName) {
    const slug = fallbackName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (slug) {
      const unique = ensureUniqueAgencyKey(`agency-${slug}`);
      fallbackKeyCache.set(agency as object, unique);
      return unique;
    }
  }

  const generated = ensureUniqueAgencyKey(`agency-fallback-${fallbackKeySequence++}`);
  fallbackKeyCache.set(agency as object, generated);
  return generated;
};


export default function Agencies() {
  const { state, dispatch } = useApp();
  const { agencies, properties, selectedAgency, settings, loading, error } = state;

  const [searchTerm, setSearchTerm] = useState('');
  const [propertiesCache, setPropertiesCache] = useState<PropertiesCache>({});
  const [propertyCounts, setPropertyCounts] = useState<Record<string, number>>({});

  const selectedAgencyKey = useMemo(() => buildAgencyKey(selectedAgency), [selectedAgency]);

  const filteredAgencies = useMemo(() => {
    const lower = searchTerm.trim().toLowerCase();

    // Show all agencies - filtering only by search term
    if (!lower) return agencies;

    return agencies.filter((agency) => {
      const name =
        ((agency as any)?.name ?? (agency as any)?.Name ?? (agency as any)?.OfficeName ?? '')
          .toString()
          .toLowerCase();
      return name.includes(lower);
    });
  }, [agencies, searchTerm]);

  useEffect(() => {
    // Only load agencies list on mount (GetAgency.json)
    if (agencies.length === 0) {
      void loadAgencies();
    }
  }, []);

  const loadAgencies = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const fetchedAgencies = await apiService.getAgencies();

      resetAgencyKeyCaches();
      setPropertiesCache({});
      dispatch({ type: 'SET_SELECTED_AGENCY', payload: null });
      dispatch({ type: 'SET_SELECTED_PROPERTY', payload: null });
      dispatch({ type: 'SET_PROPERTIES', payload: [] });
      dispatch({ type: 'SET_AGENCIES', payload: fetchedAgencies as any });
    } catch (err: any) {
      dispatch({
        type: 'SET_ERROR',
        payload: `Failed to load agencies: ${err?.message ?? err}`,
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadPropertiesForAgency = async (agency: AgencyRecord) => {
    const key = buildAgencyKey(agency);
    if (!key) return;

    dispatch({ type: 'SET_SELECTED_AGENCY', payload: agency as any });
    dispatch({ type: 'SET_SELECTED_PROPERTY', payload: null });

    const cachedProperties = propertiesCache[key];
    if (cachedProperties) {
      dispatch({ type: 'SET_PROPERTIES', payload: cachedProperties as any });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const fetched = await cloudUploadService.getPropertiesByAgency(key);
      setPropertiesCache((prev) => ({ ...prev, [key]: fetched }));
      setPropertyCounts((prev) => ({ ...prev, [key]: fetched.length }));
      dispatch({ type: 'SET_PROPERTIES', payload: fetched as any });
    } catch (err: any) {
      dispatch({
        type: 'SET_ERROR',
        payload: `Failed to load properties for ${getDisplayName(agency)}: ${err?.message ?? err}`,
      });
      dispatch({ type: 'SET_PROPERTIES', payload: [] });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleForceSync = async (agency: AgencyRecord) => {
    const key = buildAgencyKey(agency);
    if (!key) {
      console.warn('Cannot sync agency without lookup key');
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Clear cache for this agency to force reload
      delete (cloudUploadService as any).propertiesByAgency[key];

      const fetched = await cloudUploadService.getPropertiesByAgency(key);
      setPropertiesCache((prev) => ({ ...prev, [key]: fetched }));
      setPropertyCounts((prev) => ({ ...prev, [key]: fetched.length }));
      dispatch({ type: 'SET_PROPERTIES', payload: fetched as any });
    } catch (err: any) {
      dispatch({
        type: 'SET_ERROR',
        payload: `Failed to sync properties for ${getDisplayName(agency)}: ${err?.message ?? err}`,
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleBackToAgencies = () => {
    dispatch({ type: 'SET_SELECTED_AGENCY', payload: null });
    dispatch({ type: 'SET_SELECTED_PROPERTY', payload: null });
    dispatch({ type: 'SET_PROPERTIES', payload: [] });
  };

  const getDisplayName = (agency: AgencyRecord) => {
    return (
      (agency as any)?.name ??
      (agency as any)?.Name ??
      (agency as any)?.OfficeName ??
      (agency as any)?.SiteName ??
      'Unknown agency'
    );
  };

  const currentLanguage = (settings.language as 'en' | 'cz') ?? 'en';
  const translations = {
    en: {
      title: 'Real Estate Agencies',
      search: 'Search agencies...',
      properties: 'Properties',
      backToAgencies: 'Back to Agencies',
      noAgencies: 'No agencies found',
      loading: 'Loading agencies...',
      error: 'Error loading data',
    },
    cz: {
      title: 'Realitni kancelare',
      search: 'Vyhledat kancelar...',
      properties: 'Nemovitosti',
      backToAgencies: 'Zpet na kancelare',
      noAgencies: 'Zadne kancelare nenalezeny',
      loading: 'Nacitani kancelari...',
      error: 'Chyba pri nacitani dat',
    },
  } as const;

  const t = translations[currentLanguage] ?? translations.en;

  if (loading && agencies.length === 0) {
    return <div className="p-6">{t.loading}</div>;
  }

  if (error && agencies.length === 0) {
    return (
      <div className="p-6">
        <p className="text-red-600">{t.error}</p>
        <p>{error}</p>
        <button onClick={loadAgencies} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
          Retry
        </button>
      </div>
    );
  }

  if (selectedAgency && properties.length > 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={handleBackToAgencies}
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.backToAgencies}
          </button>
          <h1 className="text-2xl font-bold">{getDisplayName(selectedAgency)}</h1>
          <p className="text-gray-600">{properties.length} {t.properties}</p>
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={currentLanguage === 'cz' ? 'Vyhledat nemovitost...' : 'Search properties...'}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {properties.filter((property) => {
            if (!searchTerm.trim()) return true;
            const lower = searchTerm.toLowerCase();
            return (
              property.title?.toLowerCase().includes(lower) ||
              property.address?.toLowerCase().includes(lower) ||
              property.city?.toLowerCase().includes(lower) ||
              property.id?.toLowerCase().includes(lower)
            );
          }).map((property) => (
            <div
              key={property.id}
              onClick={() => dispatch({ type: 'SET_SELECTED_PROPERTY', payload: property })}
              className="bg-white border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="aspect-square bg-gray-200 relative">
                {property.images && property.images.length > 0 ? (
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=400';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-lg">
                  {property.price && property.price < 10000 ? 'RENT' : 'SALE'}
                </div>
                <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-bold shadow-lg">
                  €{(property.price || 0).toLocaleString()}
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm line-clamp-2">{property.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">{t.title}</h1>
          {selectedAgency && (
            <button
              onClick={handleBackToAgencies}
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.backToAgencies}
            </button>
          )}
        </div>
        <button onClick={loadAgencies} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Refresh
        </button>
      </div>

      <div className="mb-6 flex">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t.search}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredAgencies.length === 0 ? (
          <div className="text-center py-12 col-span-full">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">{t.noAgencies}</p>
          </div>
        ) : (
          filteredAgencies.map((agency) => {
            const key = buildAgencyKey(agency);
            if (!key) {
              return null;
            }

            const displayName = getDisplayName(agency);
            const cachedCount = propertiesCache[key]?.length ?? 0;
            const dbCount = propertyCounts[key] || 0;
            const propertyCount = key === selectedAgencyKey ? properties.length : (cachedCount || dbCount);
            const logoUrl = (agency as any)?.logo ?? (agency as any)?.Logo ?? null;

            return (
              <div
                key={key}
                className="bg-white border rounded-lg p-4 hover:shadow transition-shadow"
              >
                <div
                  onClick={() => loadPropertiesForAgency(agency)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-gray-100 flex items-center justify-center rounded overflow-hidden">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={displayName}
                          className="w-full h-full object-cover"
                          onError={(event) => {
                            (event.target as HTMLImageElement).src =
                              'https://images.pexels.com/photos/323705/pexels-photo-323705.jpeg?auto=compress&cs=tinysrgb&w=100';
                          }}
                        />
                      ) : (
                        <Building className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{displayName}</h3>
                      <p className="text-sm text-gray-600">
                        {propertyCount} {t.properties}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleForceSync(agency);
                  }}
                  className="w-full mt-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center justify-center gap-2 transition-colors"
                  title="Force refresh from API"
                >
                  <RefreshCw className="w-4 h-4" />
                  Sync Now
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
