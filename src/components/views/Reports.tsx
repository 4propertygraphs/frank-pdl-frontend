import React, { useState, useEffect } from 'react';
import { FileText, Download, Building, DollarSign } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../services/supabase';
import { professionalReportGenerator } from '../../services/professionalReportGenerator';

export default function Reports() {
  const { state, dispatch } = useApp();
  const { properties, agencies, settings } = state;
  const [selectedAgency, setSelectedAgency] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadAgencies();
    loadProperties();
  }, []);

  useEffect(() => {
    if (agencies.length > 0 && !selectedAgency) {
      setSelectedAgency(agencies[0].site_prefix);
    }
  }, [agencies]);

  const loadAgencies = async () => {
    try {
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      if (data && data.length > 0) {
        dispatch({ type: 'SET_AGENCIES', payload: data });
      }
    } catch (error) {
      console.error('Failed to load agencies:', error);
    }
  };

  const loadProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        dispatch({ type: 'SET_PROPERTIES', payload: data });
      }
    } catch (error) {
      console.error('Failed to load properties:', error);
    }
  };


  const calculateStats = (props: any[]) => {
    const totalProperties = props.length;
    const totalValue = props.reduce((sum, p) => {
      const price = typeof p.price === 'string' ? parseFloat(p.price) : (p.price || 0);
      return sum + price;
    }, 0);
    const avgPrice = totalProperties > 0 ? Math.round(totalValue / totalProperties) : 0;

    return {
      totalProperties,
      avgPrice,
      totalValue,
    };
  };

  const downloadReport = async () => {
    if (!selectedAgency) {
      alert('Please select an agency first.');
      return;
    }

    setIsGenerating(true);
    try {
      const agency = agencies.find(a => a.site_prefix === selectedAgency);
      if (!agency || !agency.xml_url) {
        alert('Agency XML URL not found. Cannot generate report.');
        setIsGenerating(false);
        return;
      }

      const blob = await professionalReportGenerator.generateProfessionalReport(
        agency.xml_url,
        agency.name || agency.site_prefix
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `${agency.name || agency.site_prefix}_Professional_Report_${date}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report:', error);
      alert('Failed to generate professional report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const translations = {
    en: {
      title: 'Professional Reports',
      subtitle: 'Generate comprehensive property portfolio reports',
      downloadReport: 'Download Professional Report',
      generating: 'Generating Report...',
      selectAgency: 'Select Agency',
      totalProperties: 'Total Properties',
      totalAgencies: 'Total Agencies',
      avgPrice: 'Average Price',
      reportDescription: 'Generate a detailed professional report including market analysis, property breakdowns, regional distribution, and investment recommendations.',
    },
    cz: {
      title: 'Profesionální Reporty',
      subtitle: 'Generování komplexních reportů portfolia nemovitostí',
      downloadReport: 'Stáhnout Profesionální Report',
      generating: 'Generuji Report...',
      selectAgency: 'Vybrat Agenturu',
      totalProperties: 'Celkem Nemovitostí',
      totalAgencies: 'Celkem Agentur',
      avgPrice: 'Průměrná Cena',
      reportDescription: 'Vygenerujte detailní profesionální report včetně analýzy trhu, rozdělení nemovitostí, regionální distribuce a investičních doporučení.',
    },
  };

  const t = translations[settings.language];

  const filteredProperties = selectedAgency
    ? properties.filter(p => p.agency_id === selectedAgency)
    : properties;

  const statsForDisplay = calculateStats(filteredProperties);

  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t.totalProperties}</p>
                <p className="text-2xl font-bold text-gray-900">{filteredProperties.length}</p>
              </div>
              <Building className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t.totalAgencies}</p>
                <p className="text-2xl font-bold text-gray-900">{agencies.length}</p>
              </div>
              <Building className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t.avgPrice}</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{statsForDisplay.avgPrice.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="flex items-center justify-center mb-6">
            <FileText className="w-16 h-16 text-blue-600" />
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
            Generate Professional Report
          </h2>

          <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
            {t.reportDescription}
          </p>

          <div className="max-w-md mx-auto space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.selectAgency}
              </label>
              <select
                value={selectedAgency}
                onChange={(e) => setSelectedAgency(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              >
                {agencies.map((agency) => (
                  <option key={agency.site_prefix} value={agency.site_prefix}>
                    {agency.name || agency.site_prefix}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={downloadReport}
              disabled={isGenerating || !selectedAgency}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-xl"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  {t.generating}
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  {t.downloadReport}
                </>
              )}
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 text-center">Report Includes:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>Executive Summary</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>Market Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>Regional Distribution</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>Property Type Breakdown</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>Individual Property Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>Investment Recommendations</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
