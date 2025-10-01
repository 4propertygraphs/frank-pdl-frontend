import React, { useState } from 'react';
import { FileText, Download, Calendar, Filter, TrendingUp, Building, DollarSign } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface Report {
  id: string;
  title: string;
  type: 'market-analysis' | 'property-report' | 'investment-summary' | 'trends';
  generated: Date;
  size: string;
  status: 'completed' | 'generating' | 'error';
}

export default function Reports() {
  const { state } = useApp();
  const { properties, agencies, settings } = state;
  const [selectedReportType, setSelectedReportType] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTypes = [
    { id: 'market-analysis', name: 'Market Analysis', icon: TrendingUp },
    { id: 'property-report', name: 'Property Report', icon: Building },
    { id: 'investment-summary', name: 'Investment Summary', icon: DollarSign },
    { id: 'trends', name: 'Trends Report', icon: Calendar },
  ];

  const [reports, setReports] = useState<Report[]>([
    {
      id: '1',
      title: 'Q1 2024 Market Analysis',
      type: 'market-analysis',
      generated: new Date('2024-01-15'),
      size: '2.4 MB',
      status: 'completed',
    },
    {
      id: '2',
      title: 'Property Portfolio Report',
      type: 'property-report',
      generated: new Date('2024-01-20'),
      size: '1.8 MB',
      status: 'completed',
    },
    {
      id: '3',
      title: 'Investment Performance Summary',
      type: 'investment-summary',
      generated: new Date('2024-01-22'),
      size: '912 KB',
      status: 'completed',
    },
  ]);

  const generateReport = async (type: string) => {
    setIsGenerating(true);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const newReport: Report = {
      id: Date.now().toString(),
      title: `${reportTypes.find(rt => rt.id === type)?.name} - ${new Date().toLocaleDateString()}`,
      type: type as Report['type'],
      generated: new Date(),
      size: `${Math.floor(Math.random() * 3 + 1)}.${Math.floor(Math.random() * 9 + 1)} MB`,
      status: 'completed',
    };
    
    setReports([newReport, ...reports]);
    setIsGenerating(false);
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
      downloadReport: 'Download Report',
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
    },
    cz: {
      title: 'Reporty',
      subtitle: 'Generování a správa reportů nemovitostí',
      generateNew: 'Generovat nový report',
      generating: 'Generuji...',
      reportType: 'Typ reportu',
      all: 'Všechny reporty',
      downloadReport: 'Stáhnout report',
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
    },
    ru: {
      title: 'Отчеты',
      subtitle: 'Создание и управление отчетами по недвижимости',
      generateNew: 'Создать новый отчет',
      generating: 'Создание...',
      reportType: 'Тип отчета',
      all: 'Все отчеты',
      downloadReport: 'Скачать отчет',
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
    },
    fr: {
      title: 'Rapports',
      subtitle: 'Générer et gérer les rapports immobiliers',
      generateNew: 'Générer un nouveau rapport',
      generating: 'Génération...',
      reportType: 'Type de rapport',
      all: 'Tous les rapports',
      downloadReport: 'Télécharger le rapport',
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

        {/* Quick Stats */}
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
                  ${properties.length > 0 
                    ? Math.round(properties.reduce((sum, p) => sum + p.price, 0) / properties.length).toLocaleString()
                    : '0'
                  }
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Generate Report Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t.generateNew}</h2>
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

        {/* Reports List */}
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

          {filteredReports.length === 0 ? (
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
                        {report.generated.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{report.size}</td>
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
                        {report.status === 'completed' && (
                          <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors">
                            <Download className="w-4 h-4" />
                            <span className="text-sm">{t.downloadReport}</span>
                          </button>
                        )}
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