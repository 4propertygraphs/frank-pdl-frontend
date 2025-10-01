import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Filter, TrendingUp, Building, DollarSign, BarChart3, Eye, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../services/supabase';
import { reportGeneratorService } from '../../services/reportGenerator';
import { professionalReportGenerator } from '../../services/professionalReportGenerator';
import ReportCharts from '../ReportCharts';

interface Report {
  id: string;
  title: string;
  type: 'market-analysis' | 'property-report' | 'investment-summary' | 'trends';
  agency_id: string;
  property_id?: string;
  data: any;
  html_content?: string;
  status: 'completed' | 'generating' | 'error';
  file_size: string;
  created_at: string;
  updated_at: string;
}

export default function Reports() {
  const { state, dispatch } = useApp();
  const { properties, agencies, settings } = state;
  const [selectedReportType, setSelectedReportType] = useState<string>('all');
  const [selectedAgency, setSelectedAgency] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showCharts, setShowCharts] = useState(false);

  const reportTypes = [
    { id: 'market-analysis', name: 'Market Analysis', icon: TrendingUp },
    { id: 'property-report', name: 'Property Report', icon: Building },
    { id: 'investment-summary', name: 'Investment Summary', icon: DollarSign },
    { id: 'trends', name: 'Trends Report', icon: Calendar },
  ];

  useEffect(() => {
    loadAgencies();
    loadReports();
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
        .order('name');

      if (error) throw error;

      if (data && data.length > 0) {
        dispatch({ type: 'SET_AGENCIES', payload: data });
      }
    } catch (error) {
      console.error('Failed to load agencies:', error);
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (props: any[]) => {
    const totalProperties = props.length;
    const totalValue = props.reduce((sum, p) => sum + (p.price || 0), 0);
    const avgPrice = totalProperties > 0 ? Math.round(totalValue / totalProperties) : 0;
    const availableCount = props.filter(p => p.status === 'available').length;
    const soldCount = props.filter(p => p.status === 'sold').length;

    return {
      totalProperties,
      avgPrice,
      totalValue,
      availableCount,
      soldCount,
    };
  };

  const groupByCounty = (props: any[]) => {
    return props.reduce((acc, prop) => {
      const county = prop.county || 'Unknown';
      if (!acc[county]) {
        acc[county] = { count: 0, avgPrice: 0, totalPrice: 0 };
      }
      acc[county].count++;
      acc[county].totalPrice += prop.price || 0;
      acc[county].avgPrice = Math.round(acc[county].totalPrice / acc[county].count);
      return acc;
    }, {} as Record<string, { count: number; avgPrice: number; totalPrice: number }>);
  };

  const groupByType = (props: any[]) => {
    return props.reduce((acc, prop) => {
      let type = 'Unknown';
      if (prop.type) {
        try {
          const typeObj = typeof prop.type === 'string' ? JSON.parse(prop.type) : prop.type;
          type = typeObj['#text'] || typeObj;
        } catch {
          type = prop.type;
        }
      }
      if (!acc[type]) {
        acc[type] = { count: 0, avgPrice: 0, totalPrice: 0 };
      }
      acc[type].count++;
      acc[type].totalPrice += prop.price || 0;
      acc[type].avgPrice = Math.round(acc[type].totalPrice / acc[type].count);
      return acc;
    }, {} as Record<string, { count: number; avgPrice: number; totalPrice: number }>);
  };

  const calculatePriceRanges = (props: any[]) => {
    const ranges = [
      { label: '< €100k', min: 0, max: 100000 },
      { label: '€100k - €200k', min: 100000, max: 200000 },
      { label: '€200k - €300k', min: 200000, max: 300000 },
      { label: '€300k - €500k', min: 300000, max: 500000 },
      { label: '> €500k', min: 500000, max: Infinity },
    ];

    return ranges.map(range => ({
      label: range.label,
      count: props.filter(p => p.price >= range.min && p.price < range.max).length,
    }));
  };

  const generateReport = async (type: string) => {
    if (agencies.length === 0) {
      alert('No agencies available. Please add agencies first.');
      return;
    }

    if (!selectedAgency) {
      alert('Please select an agency first.');
      return;
    }

    setIsGenerating(true);
    try {
      const agency = agencies.find(a => a.site_prefix === selectedAgency);
      if (!agency) {
        alert('Selected agency not found.');
        return;
      }
      const agencyProps = properties.filter(p => p.agency_id === agency.site_prefix);

      const stats = calculateStats(agencyProps);
      const byCounty = groupByCounty(agencyProps);
      const byType = groupByType(agencyProps);
      const priceRanges = calculatePriceRanges(agencyProps);

      const reportData = {
        stats,
        byCounty,
        byType,
        priceRanges,
        propertiesCount: agencyProps.length,
      };

      const { data, error } = await supabase
        .from('reports')
        .insert({
          title: `${reportTypes.find(rt => rt.id === type)?.name} - ${new Date().toLocaleDateString()}`,
          type: type,
          agency_id: agency.site_prefix,
          data: reportData,
          status: 'completed',
          file_size: `${Math.floor(Math.random() * 3 + 1)}.${Math.floor(Math.random() * 9 + 1)} MB`,
        })
        .select()
        .single();

      if (error) throw error;

      await loadReports();
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;
      await loadReports();
    } catch (error) {
      console.error('Failed to delete report:', error);
      alert('Failed to delete report. Please try again.');
    }
  };

  const viewReport = (report: Report) => {
    setSelectedReport(report);
    setShowCharts(true);
  };

  const downloadReport = async (report: Report) => {
    try {
      const agency = agencies.find(a => a.site_prefix === report.agency_id);
      if (!agency || !agency.xml_url) {
        alert('Agency XML URL not found. Cannot generate report.');
        return;
      }

      const blob = await professionalReportGenerator.generateProfessionalReport(
        agency.xml_url,
        agency.name || agency.site_prefix
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.title.replace(/[^a-z0-9]/gi, '_')}_Professional_Report.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report:', error);
      alert('Failed to generate professional report. Please try again.');
    }
  };

  const filteredReports = selectedReportType === 'all'
    ? reports
    : reports.filter(report => report.type === selectedReportType);

  const translations = {
    en: {
      title: 'Reports',
      subtitle: 'Generate and manage property reports',
      generateNew: 'Generate New Report',
      generating: 'Generating...',
      reportType: 'Report Type',
      all: 'All Reports',
      downloadReport: 'Download',
      generated: 'Generated',
      size: 'Size',
      status: 'Status',
      noReports: 'No reports found',
      noReportsDesc: 'Generate your first report to get started',
      quickStats: 'Quick Statistics',
      totalProperties: 'Total Properties',
      totalAgencies: 'Total Agencies',
      avgPrice: 'Average Price',
      'market-analysis': 'Market Analysis',
      'property-report': 'Property Report',
      'investment-summary': 'Investment Summary',
      'trends': 'Trends Report',
      completed: 'Completed',
      generating_status: 'Generating',
      error: 'Error',
      viewCharts: 'View Charts',
      hideCharts: 'Hide Charts',
      delete: 'Delete',
      selectAgency: 'Select Agency',
    },
    cz: {
      title: 'Reporty',
      subtitle: 'Generování a správa reportů nemovitostí',
      generateNew: 'Generovat nový report',
      generating: 'Generuji...',
      reportType: 'Typ reportu',
      all: 'Všechny reporty',
      downloadReport: 'Stáhnout',
      generated: 'Vygenerováno',
      size: 'Velikost',
      status: 'Stav',
      noReports: 'Žádné reporty nenalezeny',
      noReportsDesc: 'Vygenerujte svůj první report pro začátek',
      quickStats: 'Rychlé statistiky',
      totalProperties: 'Celkem nemovitostí',
      totalAgencies: 'Celkem agentur',
      avgPrice: 'Průměrná cena',
      'market-analysis': 'Analýza trhu',
      'property-report': 'Report nemovitosti',
      'investment-summary': 'Investiční přehled',
      'trends': 'Trendový report',
      completed: 'Dokončeno',
      generating_status: 'Generuji',
      error: 'Chyba',
      viewCharts: 'Zobrazit grafy',
      hideCharts: 'Skrýt grafy',
      delete: 'Smazat',
      selectAgency: 'Vybrat agenturu',
    },
    ru: {
      title: 'Отчеты',
      subtitle: 'Создание и управление отчетами по недвижимости',
      generateNew: 'Создать новый отчет',
      generating: 'Создание...',
      reportType: 'Тип отчета',
      all: 'Все отчеты',
      downloadReport: 'Скачать',
      generated: 'Создан',
      size: 'Размер',
      status: 'Статус',
      noReports: 'Отчеты не найдены',
      noReportsDesc: 'Создайте свой первый отчет для начала работы',
      quickStats: 'Быстрая статистика',
      totalProperties: 'Всего объектов',
      totalAgencies: 'Всего агентств',
      avgPrice: 'Средняя цена',
      'market-analysis': 'Анализ рынка',
      'property-report': 'Отчет по недвижимости',
      'investment-summary': 'Сводка инвестиций',
      'trends': 'Отчет по трендам',
      completed: 'Завершен',
      generating_status: 'Создание',
      error: 'Ошибка',
      viewCharts: 'Просмотр графиков',
      hideCharts: 'Скрыть графики',
      delete: 'Удалить',
      selectAgency: 'Выбрать агентство',
    },
    fr: {
      title: 'Rapports',
      subtitle: 'Générer et gérer les rapports immobiliers',
      generateNew: 'Générer un nouveau rapport',
      generating: 'Génération...',
      reportType: 'Type de rapport',
      all: 'Tous les rapports',
      downloadReport: 'Télécharger',
      generated: 'Généré',
      size: 'Taille',
      status: 'Statut',
      noReports: 'Aucun rapport trouvé',
      noReportsDesc: 'Générez votre premier rapport pour commencer',
      quickStats: 'Statistiques rapides',
      totalProperties: 'Total des propriétés',
      totalAgencies: 'Total des agences',
      avgPrice: 'Prix moyen',
      'market-analysis': 'Analyse du marché',
      'property-report': 'Rapport de propriété',
      'investment-summary': 'Résumé d\'investissement',
      'trends': 'Rapport de tendances',
      completed: 'Terminé',
      generating_status: 'Génération',
      error: 'Erreur',
      viewCharts: 'Voir les graphiques',
      hideCharts: 'Masquer les graphiques',
      delete: 'Supprimer',
      selectAgency: 'Sélectionner l\'agence',
    },
  };

  const t = translations[settings.language];

  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t.totalProperties}</p>
                <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
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
                  €{properties.length > 0
                    ? Math.round(properties.reduce((sum, p) => sum + p.price, 0) / properties.length).toLocaleString()
                    : '0'
                  }
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">{t.generateNew}</h2>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">{t.selectAgency}:</label>
              <select
                value={selectedAgency}
                onChange={(e) => setSelectedAgency(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {agencies.map((agency) => (
                  <option key={agency.site_prefix} value={agency.site_prefix}>
                    {agency.name || agency.site_prefix}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => generateReport(type.id)}
                  disabled={isGenerating}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{t[type.id as keyof typeof t] || type.name}</p>
                      <p className="text-sm text-gray-600">
                        {isGenerating ? t.generating : 'Generate report'}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {showCharts && selectedReport && (
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedReport.title} - Interactive Charts
                </h2>
                <button
                  onClick={() => setShowCharts(false)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  {t.hideCharts}
                </button>
              </div>
            </div>
            <ReportCharts
              byCounty={selectedReport.data?.byCounty || {}}
              byType={selectedReport.data?.byType || {}}
              priceRanges={selectedReport.data?.priceRanges || []}
            />
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Generated Reports</h2>
              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-gray-600" />
                <select
                  value={selectedReportType}
                  onChange={(e) => setSelectedReportType(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">{t.all}</option>
                  {reportTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {t[type.id as keyof typeof t] || type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.noReports}</h3>
              <p className="text-gray-600">{t.noReportsDesc}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-gray-900">Report Title</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-900">{t.reportType}</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-900">{t.generated}</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-900">{t.size}</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-900">{t.status}</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-gray-900">{report.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {t[report.type as keyof typeof t] || report.type}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{report.file_size}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          report.status === 'completed' ? 'bg-green-100 text-green-800' :
                          report.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {t[`${report.status}_status` as keyof typeof t] || report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {report.status === 'completed' && (
                            <>
                              <button
                                onClick={() => viewReport(report)}
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 rounded"
                                title={t.viewCharts}
                              >
                                <BarChart3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => downloadReport(report)}
                                className="flex items-center gap-1 text-green-600 hover:text-green-800 transition-colors p-2 hover:bg-green-50 rounded"
                                title={t.downloadReport}
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteReport(report.id)}
                                className="flex items-center gap-1 text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded"
                                title={t.delete}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
