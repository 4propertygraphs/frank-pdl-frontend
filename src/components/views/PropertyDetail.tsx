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
        return (
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">{selectedProperty.description}</p>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{t.features}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {selectedProperty.features.map((feature, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{t.location}</h3>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{selectedProperty.location.address}, {selectedProperty.location.city}, {selectedProperty.location.country}</span>
              </div>
            </div>
          </div>
        );
      
      case 'comparison':
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Comparison Analysis</h3>
            <div className="space-y-4">
              <div className="p-4 bg-white rounded border-l-4 border-green-500">
                <p className="text-sm text-gray-600">Price Range</p>
                <p className="font-semibold text-green-700">Within market average (+3%)</p>
              </div>
              <div className="p-4 bg-white rounded border-l-4 border-orange-500">
                <p className="text-sm text-gray-600">Location Score</p>
                <p className="font-semibold text-orange-700">Above average (+15%)</p>
              </div>
              <div className="p-4 bg-white rounded border-l-4 border-red-500">
                <p className="text-sm text-gray-600">Property Age</p>
                <p className="font-semibold text-red-700">Older than comparable (-8%)</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              * Hover over items to see detailed comparison sources
            </p>
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
                    Current asking price: <span className="font-bold">${selectedProperty.price.toLocaleString()}</span>
                  </p>
                  <p className="text-gray-700 text-sm">
                    Estimated fair value: <span className="font-bold text-green-600">${Math.round(selectedProperty.price * 0.95).toLocaleString()}</span>
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
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Change Log</h3>
            <div className="space-y-3">
              {[
                { type: 'update', message: 'Price reduced from $685,000 to $650,000', date: '2 days ago', status: 'active' },
                { type: 'update', message: 'Images updated - 3 new photos added', date: '1 week ago', status: 'completed' },
                { type: 'create', message: 'Property listed', date: '2 weeks ago', status: 'completed' },
                { type: 'update', message: 'Description updated with new features', date: '3 weeks ago', status: 'completed' },
              ].map((log, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    log.type === 'create' ? 'bg-green-500' : 
                    log.type === 'update' ? 'bg-blue-500' : 'bg-red-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{log.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{log.date}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        log.status === 'active' ? 'bg-green-100 text-green-800' :
                        log.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">Filter Options</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['All Changes', 'Price Updates', 'Image Changes', 'Description Edits', 'Status Changes'].map((filter) => (
                  <button key={filter} className="px-3 py-1 bg-white border border-blue-200 text-blue-700 text-xs rounded-full hover:bg-blue-100">
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToProperties}
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{selectedProperty.title}</h1>
        <p className="text-gray-600 flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          {selectedProperty.location.address}
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Images */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="h-96 bg-gray-200 relative">
                {selectedProperty.images && selectedProperty.images.length > 0 ? (
                  <>
                    <img
                      src={selectedProperty.images[currentImageIndex] || 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800'}
                      alt={selectedProperty.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800';
                      }}
                    />
                    {selectedProperty.images.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                        {selectedProperty.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-3 h-3 rounded-full ${
                              currentImageIndex === index ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Image thumbnails */}
              {selectedProperty.images && selectedProperty.images.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {selectedProperty.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                        currentImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${selectedProperty.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=200';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Property Details */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t.details}</h2>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-600">{t.price}</span>
                <p className="text-2xl font-bold text-blue-600">${selectedProperty.price.toLocaleString()}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">{t.type}</span>
                  <p className="font-semibold text-gray-900">{selectedProperty.type}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">{t.status}</span>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    selectedProperty.status === 'active' ? 'bg-green-100 text-green-800' :
                    selectedProperty.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedProperty.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {selectedProperty.bedrooms && (
                  <div className="text-center">
                    <Bed className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <p className="font-semibold text-gray-900">{selectedProperty.bedrooms}</p>
                    <p className="text-xs text-gray-600">{t.bedrooms}</p>
                  </div>
                )}
                {selectedProperty.bathrooms && (
                  <div className="text-center">
                    <Bath className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <p className="font-semibold text-gray-900">{selectedProperty.bathrooms}</p>
                    <p className="text-xs text-gray-600">{t.bathrooms}</p>
                  </div>
                )}
                {selectedProperty.area && (
                  <div className="text-center">
                    <Square className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <p className="font-semibold text-gray-900">{selectedProperty.area}</p>
                    <p className="text-xs text-gray-600">m²</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>{t.listed}: {new Date(selectedProperty.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{t.updated}: {new Date(selectedProperty.updated_at).toLocaleDateString()}</span>
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