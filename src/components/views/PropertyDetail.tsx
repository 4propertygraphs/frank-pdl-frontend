import React, { useState, useEffect } from 'react';
import { ArrowLeft, Image, MapPin, Bed, Bath, Square, Calendar, AlertTriangle, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { kyraAI } from '../../services/kyra';

export default function PropertyDetail() {
  const { state, dispatch } = useApp();
  const { selectedProperty, settings, properties } = state;
  const [activeTab, setActiveTab] = useState('description');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);

  useEffect(() => {
    if (selectedProperty && properties.length > 0) {
      generateAIData();
    }
  }, [selectedProperty?.id]);

  const generateAIData = async () => {
    if (!selectedProperty || properties.length === 0) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const comparison = kyraAI.generatePropertyComparison(selectedProperty, properties);
      const report = kyraAI.generatePropertyReport(selectedProperty, properties);

      setComparisonData(comparison);
      setReportData(report);
    } catch (error) {
      console.error('Failed to generate AI data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedProperty) return null;

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'comparison', label: 'Comparison' },
    { id: 'env-comparison', label: 'Env Comparison' },
    { id: 'report', label: 'Report' },
    { id: 'bug-report', label: 'Bug Report' },
  ];

  const handleBack = () => {
    dispatch({ type: 'SET_SELECTED_PROPERTY', payload: null });
  };

  const translations = {
    en: {
      backToProperties: 'Back to Properties',
      description: 'Description',
      comparison: 'Comparison',
      envcomparison: 'Env Comparison',
      report: 'Report',
      bugReport: 'Bug Report',
      features: 'Features',
      location: 'Location',
      details: 'Property Details',
      price: 'Price',
      type: 'Type',
      bedrooms: 'Bedrooms',
      bathrooms: 'Bathrooms',
      area: 'Area',
      status: 'Status',
      listed: 'Listed',
      updated: 'Updated',
    },
    cz: {
      backToProperties: 'Zpět na nemovitosti',
      description: 'Popis',
      comparison: 'Porovnání',
      report: 'Report',
      bugReport: 'Hlášení chyb',
      features: 'Vlastnosti',
      location: 'Poloha',
      details: 'Detaily nemovitosti',
      price: 'Cena',
      type: 'Typ',
      bedrooms: 'Ložnice',
      bathrooms: 'Koupelny',
      area: 'Plocha',
      status: 'Stav',
      listed: 'Uvedeno',
      updated: 'Aktualizováno',
    },
    ru: {
      backToProperties: 'Назад к объектам',
      description: 'Описание',
      comparison: 'Сравнение',
      report: 'Отчет',
      bugReport: 'Сообщить об ошибке',
      features: 'Особенности',
      location: 'Местоположение',
      details: 'Детали объекта',
      price: 'Цена',
      type: 'Тип',
      bedrooms: 'Спальни',
      bathrooms: 'Ванные',
      area: 'Площадь',
      status: 'Статус',
      listed: 'Размещено',
      updated: 'Обновлено',
    },
    fr: {
      backToProperties: 'Retour aux propriétés',
      description: 'Description',
      comparison: 'Comparaison',
      report: 'Rapport',
      bugReport: 'Signaler un bug',
      features: 'Caractéristiques',
      location: 'Emplacement',
      details: 'Détails de la propriété',
      price: 'Prix',
      type: 'Type',
      bedrooms: 'Chambres',
      bathrooms: 'Salles de bains',
      area: 'Surface',
      status: 'Statut',
      listed: 'Listé',
      updated: 'Mis à jour',
    },
  };

  const t = translations[settings.language];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'description':
        const cleanDescription = (desc: any) => {
          if (!desc) return 'No description available';
          let text = '';

          if (typeof desc === 'string') {
            text = desc;
          } else if (desc['#text']) {
            text = String(desc['#text']);
          } else {
            text = String(desc);
          }

          text = text
            .replace(/&lt;br\/&gt;/g, '\n')
            .replace(/&lt;br ?\/&gt;/g, '\n')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/<[^>]*>/g, '')
            .replace(/\n\n+/g, '\n\n')
            .trim();

          return text || 'No description available';
        };

        const description = cleanDescription(selectedProperty.description);

        const splitIntoSentences = (text: string) => {
          return text.match(/[^.!?]+[.!?]+/g) || [text];
        };

        const createParagraphs = (text: string) => {
          const sentences = splitIntoSentences(text);
          const paragraphs: string[] = [];
          let currentParagraph: string[] = [];

          sentences.forEach((sentence, index) => {
            currentParagraph.push(sentence.trim());

            if (currentParagraph.length >= 3 || index === sentences.length - 1) {
              paragraphs.push(currentParagraph.join(' '));
              currentParagraph = [];
            }
          });

          return paragraphs.filter(p => p.trim());
        };

        const paragraphs = description.includes('\n\n')
          ? description.split('\n\n').filter(p => p.trim())
          : createParagraphs(description);

        return (
          <div className="space-y-6">
            {/* Property Description */}
            <div className="bg-white">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">About This Property</h3>
              <div className="space-y-4">
                {paragraphs.map((paragraph, index) => (
                  <p key={index} className="text-gray-700 leading-relaxed text-base">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Location Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-500 mb-1">Address</span>
                  <span className="text-gray-900">{String(selectedProperty.address || 'Not specified')}</span>
                </div>
                {selectedProperty.city && (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500 mb-1">City</span>
                    <span className="text-gray-900">{String(selectedProperty.city)}</span>
                  </div>
                )}
                {selectedProperty.county && (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500 mb-1">County</span>
                    <span className="text-gray-900">{String(selectedProperty.county)}</span>
                  </div>
                )}
                {selectedProperty.postcode && (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500 mb-1">Postcode</span>
                    <span className="text-gray-900">{String(selectedProperty.postcode)}</span>
                  </div>
                )}
                {selectedProperty.country && (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500 mb-1">Country</span>
                    <span className="text-gray-900">{String(selectedProperty.country)}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        );
      
      case 'comparison':
        if (isLoading || !comparisonData) {
          return (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-gray-600">Kyra AI is analyzing market data...</p>
              </div>
            </div>
          );
        }

        const locationDiff = comparisonData.locationScore - 7.4;
        const ageDiff = Math.round(((comparisonData.propertyAge - comparisonData.marketAge) / comparisonData.marketAge) * 100);

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Property Market Comparison</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                Generated by Kyra AI
              </div>
            </div>
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Metric</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">This Property</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Market Average</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Price Comparison</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">€{selectedProperty.price?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">€{Math.round(comparisonData.marketAverage).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                        comparisonData.priceDirection === '+' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {comparisonData.priceDirection === '+' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {comparisonData.priceDirection}{comparisonData.pricePercentage}%
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Location Score</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{comparisonData.locationScore.toFixed(1)}/10</td>
                    <td className="px-6 py-4 text-sm text-gray-600">7.4/10</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        locationDiff > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {locationDiff > 0 ? '+' : ''}{Math.round(locationDiff * 100 / 7.4)}%
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Property Age</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{comparisonData.propertyAge} years</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{comparisonData.marketAge} years</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        ageDiff < 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {ageDiff > 0 ? '+' : ''}{ageDiff}%
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Days on Market</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{comparisonData.daysOnMarket} days</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{comparisonData.avgDaysOnMarket} days</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        comparisonData.daysOnMarket < comparisonData.avgDaysOnMarket
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {comparisonData.daysOnMarket < comparisonData.avgDaysOnMarket ? 'Fresh' : 'Mature'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case 'env-comparison':
        const compareData = {
          acquaint: { source: 'Music', price: '€450,000', bedrooms: 3, type: 'House' },
          daft: { source: 'Actor', price: '€448,000', bedrooms: 3, type: 'House' },
          myhome: { source: 'Agency', price: '€450,000', bedrooms: 3, type: 'House' },
          wordpress: { source: 'Direct', price: '€455,000', bedrooms: 3, type: 'Semi-Detached' }
        };

        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Environment Data Comparison</h3>
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Field</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Acquaint</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Daft</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">MyHome</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">WordPress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Source</td>
                    <td className={`px-6 py-4 text-sm ${compareData.acquaint.source !== compareData.daft.source ? 'bg-yellow-50 font-semibold text-yellow-900' : 'text-gray-600'}`}>
                      {compareData.acquaint.source}
                    </td>
                    <td className={`px-6 py-4 text-sm ${compareData.daft.source !== compareData.acquaint.source ? 'bg-yellow-50 font-semibold text-yellow-900' : 'text-gray-600'}`}>
                      {compareData.daft.source}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{compareData.myhome.source}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{compareData.wordpress.source}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Price</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{compareData.acquaint.price}</td>
                    <td className={`px-6 py-4 text-sm ${compareData.daft.price !== compareData.acquaint.price ? 'bg-yellow-50 font-semibold text-yellow-900' : 'text-gray-600'}`}>
                      {compareData.daft.price}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{compareData.myhome.price}</td>
                    <td className={`px-6 py-4 text-sm ${compareData.wordpress.price !== compareData.myhome.price ? 'bg-yellow-50 font-semibold text-yellow-900' : 'text-gray-600'}`}>
                      {compareData.wordpress.price}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Bedrooms</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{compareData.acquaint.bedrooms}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{compareData.daft.bedrooms}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{compareData.myhome.bedrooms}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{compareData.wordpress.bedrooms}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Type</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{compareData.acquaint.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{compareData.daft.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{compareData.myhome.type}</td>
                    <td className={`px-6 py-4 text-sm ${compareData.wordpress.type !== compareData.myhome.type ? 'bg-yellow-50 font-semibold text-yellow-900' : 'text-gray-600'}`}>
                      {compareData.wordpress.type}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex items-start gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-900">Highlighted differences</p>
                <p className="text-sm text-yellow-700">Yellow cells indicate data discrepancies between platforms</p>
              </div>
            </div>
          </div>
        );

      case 'report':
        if (isLoading || !reportData) {
          return (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-gray-600">Kyra AI is generating your report...</p>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">AI-Generated Property Report</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  Generated by Kyra AI
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Market Analysis</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {reportData.marketAnalysis}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Price Recommendation</h4>
                  <div className="space-y-2">
                    <p className="text-gray-700 text-sm">
                      Current asking price: <span className="font-bold">€{reportData.priceRecommendation.currentPrice?.toLocaleString()}</span>
                    </p>
                    <p className="text-gray-700 text-sm">
                      Estimated fair value: <span className="font-bold text-green-600">€{reportData.priceRecommendation.estimatedValue.toLocaleString()}</span>
                    </p>
                    <p className="text-gray-700 text-sm">
                      Negotiation potential: <span className="font-bold text-blue-600">{reportData.priceRecommendation.negotiationPotential}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Investment Metrics</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{reportData.investmentMetrics.investmentScore}</p>
                  <p className="text-sm text-gray-600 mt-1">Investment Score</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{reportData.investmentMetrics.projectedROI}%</p>
                  <p className="text-sm text-gray-600 mt-1">Projected ROI</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{reportData.investmentMetrics.marketConfidence}%</p>
                  <p className="text-sm text-gray-600 mt-1">Market Confidence</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  Key Strengths
                </h4>
                <ul className="space-y-2">
                  {reportData.strengths.map((strength: string, index: number) => (
                    <li key={index} className="text-sm text-green-800 flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h4 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  Considerations
                </h4>
                <ul className="space-y-2">
                  {reportData.concerns.map((concern: string, index: number) => (
                    <li key={index} className="text-sm text-yellow-800 flex items-start gap-2">
                      <span className="text-yellow-600 mt-0.5">•</span>
                      {concern}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6">
              <h4 className="font-semibold mb-2 text-lg">Kyra AI Recommendation</h4>
              <p className="text-blue-50 leading-relaxed">
                {reportData.recommendation}
              </p>
            </div>
          </div>
        );
      
      case 'bug-report':
        return (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md">
              <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Under Reconstruction</h3>
              <p className="text-gray-600 mb-4">
                This feature is currently being rebuilt to provide you with better property tracking and change history.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-orange-900 font-medium">Coming Soon</span>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 bg-white min-h-screen">
      {/* Header with Back Button */}
      <div className="bg-white border-b px-6 py-3">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToProperties}
        </button>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && selectedProperty.images && selectedProperty.images.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center" onClick={() => setIsLightboxOpen(false)}>
          <div className="relative w-full h-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Previous Button */}
            {lightboxImageIndex > 0 && (
              <button
                onClick={() => setLightboxImageIndex(lightboxImageIndex - 1)}
                className="absolute left-4 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Image */}
            <img
              src={selectedProperty.images[lightboxImageIndex]}
              alt={`${selectedProperty.title} ${lightboxImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1920';
              }}
            />

            {/* Next Button */}
            {lightboxImageIndex < selectedProperty.images.length - 1 && (
              <button
                onClick={() => setLightboxImageIndex(lightboxImageIndex + 1)}
                className="absolute right-4 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-full">
              {lightboxImageIndex + 1} / {selectedProperty.images.length}
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery - MyHome Style */}
      <div className="bg-black">
        {selectedProperty.images && selectedProperty.images.length > 0 ? (
          <div className="grid grid-cols-2 gap-1">
            {/* Main Large Image */}
            <div className="col-span-2 lg:col-span-1">
              <img
                src={selectedProperty.images[0]}
                alt={selectedProperty.title}
                className="w-full h-96 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => {
                  setLightboxImageIndex(0);
                  setIsLightboxOpen(true);
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800';
                }}
              />
            </div>
            {/* Grid of smaller images */}
            <div className="col-span-2 lg:col-span-1 grid grid-cols-2 gap-1">
              {selectedProperty.images.slice(1, 5).map((image, index) => (
                <img
                  key={index + 1}
                  src={image}
                  alt={`${selectedProperty.title} ${index + 2}`}
                  className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => {
                    setLightboxImageIndex(index + 1);
                    setIsLightboxOpen(true);
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=400';
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full h-96 flex items-center justify-center bg-gray-200">
            <Image className="w-16 h-16 text-gray-400" />
          </div>
        )}
      </div>

      {/* Property Info Section */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Price */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{String(selectedProperty.title)}</h1>
              <p className="text-gray-600 flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5" />
                {String(selectedProperty.address || '')}
              </p>
              <div className="text-3xl font-bold text-gray-900">€{selectedProperty.price?.toLocaleString() ?? 'N/A'}</div>
              <p className="text-sm text-gray-500 mt-1">{selectedProperty.bedrooms ?? 0} beds • {selectedProperty.bathrooms ?? 0} bath • {String(selectedProperty.type || 'Property')}</p>
            </div>

            {/* Features */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-4">{t.features}</h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <Bed className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{selectedProperty.bedrooms ?? 0}</p>
                  <p className="text-sm text-gray-600">{t.bedrooms}</p>
                </div>
                <div className="text-center">
                  <Bath className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{selectedProperty.bathrooms ?? 0}</p>
                  <p className="text-sm text-gray-600">{t.bathrooms}</p>
                </div>
                <div className="text-center">
                  <Square className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">-</p>
                  <p className="text-sm text-gray-600">{t.area}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Agent Info */}
          <div>
            <div className="bg-white border rounded-lg p-6 sticky top-6">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedProperty.agency_id?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Strong Financial Consulting</p>
                    <p className="text-sm text-gray-500">PSRA Licence: 001420</p>
                  </div>
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 mb-3">
                Call Agent: 01 293 6320
              </button>

              <button className="w-full bg-white border-2 border-blue-600 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50">
                Email Agent
              </button>

              <div className="mt-6 pt-6 border-t space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Status</span>
                  <p className="font-semibold text-gray-900 capitalize">{selectedProperty.status}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Listed</span>
                  <p className="font-semibold text-gray-900">{new Date(selectedProperty.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="border-b">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t[tab.id.replace('-', '') as keyof typeof t] || tab.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}