import React, { useEffect, useMemo, useState } from 'react';
import { Building, Search, ArrowLeft, RefreshCw, Download, FileText, X, Loader2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { apiService } from '../../services/api';
import { propertySyncService } from '../../services/propertySync';
import { cloudUploadService } from '../../services/cloudUpload';
import { shareBankService } from '../../services/sharebank';

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
  const [checkedAgencies, setCheckedAgencies] = useState<Set<string>>(new Set());
  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const [checkProgress, setCheckProgress] = useState({ current: 0, total: 0 });
  const [isExporting, setIsExporting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedAgencyForReport, setSelectedAgencyForReport] = useState<string>('');
  const [selectedPropertyForReport, setSelectedPropertyForReport] = useState<string>('all');
  const [reportProgress, setReportProgress] = useState(0);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [agencyPropertiesList, setAgencyPropertiesList] = useState<any[]>([]);
  const [dbAgencies, setDbAgencies] = useState<any[]>([]);

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
    // Load agencies list and property counts from database
    if (agencies.length === 0) {
      void loadAgencies();
    }
    void loadPropertyCountsFromDatabase();
    void loadDbAgencies();
  }, []);

  const loadDbAgencies = async () => {
    try {
      const { supabase } = await import('../../services/supabase');
      const { data, error } = await supabase
        .from('agencies')
        .select('id, name, site_prefix, property_count')
        .eq('is_active', true)
        .gt('property_count', 0)
        .order('name', { ascending: true });

      if (error) {
        console.error('Failed to load agencies from database:', error);
        return;
      }

      console.log(`📋 Loaded ${data?.length || 0} agencies from database for reports:`, data);
      setDbAgencies(data || []);
    } catch (err: any) {
      console.error('Error loading agencies:', err);
    }
  };

  const loadPropertyCountsFromDatabase = async () => {
    try {
      const { supabase } = await import('../../services/supabase');
      const { data, error } = await supabase
        .from('agencies')
        .select('site_prefix, property_count')
        .gt('property_count', 0);

      if (error) {
        console.error('Failed to load property counts:', error);
        return;
      }

      if (data && data.length > 0) {
        const counts: Record<string, number> = {};
        data.forEach(agency => {
          counts[agency.site_prefix.toLowerCase()] = agency.property_count;
        });
        setPropertyCounts(counts);
        console.log(`📊 Loaded property counts for ${data.length} agencies from database`);
      }
    } catch (err: any) {
      console.error('Error loading property counts:', err);
    }
  };

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

    setCheckedAgencies((prev) => new Set(prev).add(key));

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

  const checkAllAgencies = async () => {
    setIsCheckingAll(true);
    setCheckProgress({ current: 0, total: agencies.length });

    const newPropertiesCache: PropertiesCache = { ...propertiesCache };
    const newPropertyCounts: Record<string, number> = { ...propertyCounts };
    const newCheckedAgencies = new Set<string>(checkedAgencies);

    for (let i = 0; i < agencies.length; i++) {
      const agency = agencies[i];
      const key = buildAgencyKey(agency);

      if (!key) continue;

      setCheckProgress({ current: i + 1, total: agencies.length });

      if (newPropertiesCache[key]) {
        newCheckedAgencies.add(key);
        continue;
      }

      try {
        const fetched = await cloudUploadService.getPropertiesByAgency(key);
        newPropertiesCache[key] = fetched;
        newPropertyCounts[key] = fetched.length;
        newCheckedAgencies.add(key);

        console.log(`✓ ${getDisplayName(agency)}: ${fetched.length} properties`);
      } catch (err: any) {
        console.error(`✗ ${getDisplayName(agency)}: ${err?.message ?? err}`);
        newPropertiesCache[key] = [];
        newPropertyCounts[key] = 0;
        newCheckedAgencies.add(key);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setPropertiesCache(newPropertiesCache);
    setPropertyCounts(newPropertyCounts);
    setCheckedAgencies(newCheckedAgencies);
    setIsCheckingAll(false);
    setCheckProgress({ current: 0, total: 0 });

    const agenciesWithData = Object.entries(newPropertyCounts).filter(([_, count]) => count > 0).length;
    const agenciesWithoutData = Object.entries(newPropertyCounts).filter(([_, count]) => count === 0).length;

    console.log(`\n✅ Check complete:`);
    console.log(`   Agencies with data: ${agenciesWithData}`);
    console.log(`   Agencies without data: ${agenciesWithoutData} (hidden)`);
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

  const handleExportToShareBank = async () => {
    setIsExporting(true);
    try {
      const agenciesWithProperties = filteredAgencies.map((agency) => {
        const key = buildAgencyKey(agency);
        const props = propertiesCache[key] || [];
        return {
          ...agency,
          properties: props,
          property_count: props.length,
        };
      });

      const allProperties = Object.values(propertiesCache).flat();

      const exportData = {
        agencies: agenciesWithProperties,
        properties: allProperties,
        export_date: new Date().toISOString(),
        total_agencies: agenciesWithProperties.length,
        total_properties: allProperties.length,
      };

      const exportName = `Export_${new Date().toISOString().split('T')[0]}_${agenciesWithProperties.length}_agencies_${allProperties.length}_properties`;

      await shareBankService.exportData(exportName, 'mixed', exportData);

      alert(`Successfully exported ${agenciesWithProperties.length} agencies and ${allProperties.length} properties to Share Bank!`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedAgencyForReport) {
      alert('Please select an agency');
      return;
    }

    console.log('🚀 Starting report generation for agency:', selectedAgencyForReport);
    console.log('Property selection:', selectedPropertyForReport);

    setIsGeneratingReport(true);
    setReportProgress(0);

    try {
      const { reportGeneratorService } = await import('../../services/reportGenerator');

      setReportProgress(20);
      await new Promise(resolve => setTimeout(resolve, 500));

      setReportProgress(40);
      await new Promise(resolve => setTimeout(resolve, 500));

      setReportProgress(60);
      await new Promise(resolve => setTimeout(resolve, 500));

      setReportProgress(80);
      const reportBlob = await reportGeneratorService.generateReport(
        selectedAgencyForReport,
        selectedPropertyForReport
      );

      setReportProgress(100);

      const url = URL.createObjectURL(reportBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `property-report-${Date.now()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setTimeout(() => {
        setShowReportModal(false);
        setIsGeneratingReport(false);
        setReportProgress(0);
        setSelectedAgencyForReport('');
        setSelectedPropertyForReport('all');
      }, 500);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report: ' + (error as Error).message);
      setIsGeneratingReport(false);
      setReportProgress(0);
    }
  };

  const loadAgencyPropertiesForReport = async (agencyId: string) => {
    if (!agencyId) {
      setAgencyPropertiesList([]);
      return;
    }

    console.log('🏠 Loading properties for agency UUID:', agencyId);

    try {
      const { supabase } = await import('../../services/supabase');

      const { data: agency } = await supabase
        .from('agencies')
        .select('site_prefix')
        .eq('id', agencyId)
        .maybeSingle();

      if (!agency) {
        console.error('Agency not found for ID:', agencyId);
        return;
      }

      console.log('🔑 Found site_prefix:', agency.site_prefix);

      const { data, error } = await supabase
        .from('properties')
        .select('id, title')
        .eq('agency_id', agency.site_prefix)
        .order('title', { ascending: true });

      if (error) {
        console.error('Failed to load agency properties:', error);
        return;
      }

      console.log(`✅ Loaded ${data?.length || 0} properties for report dropdown`);
      setAgencyPropertiesList(data || []);
    } catch (err: any) {
      console.error('Error loading agency properties:', err);
    }
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
              property.id?.toString().toLowerCase().includes(lower)
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
                <div className={`absolute top-2 left-2 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-lg uppercase ${
                  property.status === 'sold' ? 'bg-red-600' :
                  property.status === 'let' ? 'bg-orange-600' :
                  property.status === 'for_rent' ? 'bg-green-600' :
                  'bg-blue-600'
                }`}>
                  {property.status === 'for_sale' ? 'SALE' :
                   property.status === 'for_rent' ? 'RENT' :
                   property.status}
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
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowReportModal(true);
              if (dbAgencies.length === 0) {
                loadDbAgencies();
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Generate Report
          </button>
          <button
            onClick={handleExportToShareBank}
            disabled={isExporting || Object.keys(propertiesCache).length === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export to Share Bank
              </>
            )}
          </button>
          <button
            onClick={checkAllAgencies}
            disabled={isCheckingAll}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isCheckingAll ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Checking {checkProgress.current}/{checkProgress.total}
              </>
            ) : (
              'Check All'
            )}
          </button>
          <button onClick={loadAgencies} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            Refresh
          </button>
        </div>
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
            // Use database count first, then cached, then current properties
            const propertyCount = dbCount || cachedCount || (key === selectedAgencyKey ? properties.length : 0);
            const logoUrl = (agency as any)?.logo ?? (agency as any)?.Logo ?? null;

            if (checkedAgencies.has(key) && propertyCount === 0) {
              return null;
            }

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

      {/* Report Generation Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative">
            <button
              onClick={() => !isGeneratingReport && setShowReportModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isGeneratingReport}
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Generate Property Report</h2>
              <p className="text-gray-600">Create a comprehensive analysis report with market insights and statistics</p>
            </div>

            {!isGeneratingReport ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Agency *
                  </label>
                  <select
                    value={selectedAgencyForReport}
                    onChange={(e) => {
                      setSelectedAgencyForReport(e.target.value);
                      setSelectedPropertyForReport('all');
                      loadAgencyPropertiesForReport(e.target.value);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">
                      {dbAgencies.length === 0 ? 'Loading agencies...' : 'Choose an agency...'}
                    </option>
                    {dbAgencies.map((agency) => (
                      <option key={agency.id} value={agency.id}>
                        {agency.name || `Agency ${agency.site_prefix}`} ({agency.property_count} properties)
                      </option>
                    ))}
                  </select>
                  {dbAgencies.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">Loading agencies from database...</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Property
                  </label>
                  <select
                    value={selectedPropertyForReport}
                    onChange={(e) => setSelectedPropertyForReport(e.target.value)}
                    disabled={!selectedAgencyForReport}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="all">All Properties</option>
                    {agencyPropertiesList.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Report will include:</h3>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>• Property portfolio overview</li>
                    <li>• Market analysis by location and type</li>
                    <li>• Price trends and statistics</li>
                    <li>• Performance metrics and insights</li>
                    <li>• Visual charts and graphs</li>
                    <li>• Executive summary</li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateReport}
                    disabled={!selectedAgencyForReport}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                  >
                    Generate Report
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                    <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Generating Report...</h3>
                  <p className="text-gray-600 mb-6">Please wait while we analyze your data</p>

                  <div className="max-w-md mx-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm font-bold text-green-600">{reportProgress}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500 rounded-full"
                        style={{ width: `${reportProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
