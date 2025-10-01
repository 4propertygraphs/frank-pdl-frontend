import React, { useState } from 'react';
import { ArrowLeft, Image, MapPin, Bed, Bath, Square, Calendar, AlertTriangle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function PropertyDetail() {
  const { state, dispatch } = useApp();
  const { selectedProperty, settings } = state;
  const [activeTab, setActiveTab] = useState('description');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Property Market Comparison</h3>
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
                    <td className="px-6 py-4 text-sm text-gray-900">Price per sq m</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">€3,200</td>
                    <td className="px-6 py-4 text-sm text-gray-600">€3,100</td>
                    <td className="px-6 py-4"><span className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">+3%</span></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Location Score</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">8.5/10</td>
                    <td className="px-6 py-4 text-sm text-gray-600">7.4/10</td>
                    <td className="px-6 py-4"><span className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">+15%</span></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Property Age</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">25 years</td>
                    <td className="px-6 py-4 text-sm text-gray-600">18 years</td>
                    <td className="px-6 py-4"><span className="inline-flex px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">-8%</span></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Days on Market</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">12 days</td>
                    <td className="px-6 py-4 text-sm text-gray-600">28 days</td>
                    <td className="px-6 py-4"><span className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Fresh</span></td>
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
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AI-Generated Property Report</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Market Analysis</h4>
                  <p className="text-gray-700 text-sm">
                    Based on location analytics and comparable properties, this property shows strong investment potential 
                    with an estimated 12% appreciation over the next 2 years.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Price Recommendation</h4>
                  <p className="text-gray-700 text-sm">
                    Current asking price: <span className="font-bold">€{selectedProperty.price?.toLocaleString() ?? 'N/A'}</span>
                  </p>
                  <p className="text-gray-700 text-sm">
                    Estimated fair value: <span className="font-bold text-green-600">€{Math.round((selectedProperty.price || 0) * 0.95).toLocaleString()}</span>
                  </p>
                  <p className="text-gray-700 text-sm">
                    Negotiation potential: <span className="font-bold text-blue-600">5-8%</span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Investment Metrics</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">8.2</p>
                  <p className="text-sm text-gray-600">Investment Score</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">12%</p>
                  <p className="text-sm text-gray-600">Projected ROI</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">94%</p>
                  <p className="text-sm text-gray-600">Market Confidence</p>
                </div>
              </div>
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

      {/* Image Gallery - MyHome Style */}
      <div className="bg-black">
        {selectedProperty.images && selectedProperty.images.length > 0 ? (
          <div className="grid grid-cols-2 gap-1">
            {/* Main Large Image */}
            <div className="col-span-2 lg:col-span-1">
              <img
                src={selectedProperty.images[0]}
                alt={selectedProperty.title}
                className="w-full h-96 object-cover cursor-pointer"
                onClick={() => setCurrentImageIndex(0)}
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
                  className="w-full h-48 object-cover cursor-pointer"
                  onClick={() => setCurrentImageIndex(index + 1)}
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