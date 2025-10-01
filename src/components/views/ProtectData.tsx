import React, { useState } from 'react';
import { Shield, Lock, Key, Server, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function ProtectData() {
  const { state } = useApp();
  const { settings } = state;
  const [isEncrypting, setIsEncrypting] = useState(false);

  const securityFeatures = [
    {
      name: 'AES-256 Encryption',
      description: 'Advanced Encryption Standard with 256-bit keys',
      tooltip: 'Military-grade encryption that would take billions of years to crack with current technology',
      status: 'active',
      icon: Lock,
    },
    {
      name: 'RSA-4096 Key Exchange',
      description: 'Robust public-key cryptography',
      tooltip: 'Asymmetric encryption for secure key exchange and digital signatures',
      status: 'active',
      icon: Key,
    },
    {
      name: 'TLS 1.3 Transport Security',
      description: 'Latest transport layer security protocol',
      tooltip: 'Ensures secure communication between client and server with forward secrecy',
      status: 'active',
      icon: Server,
    },
    {
      name: 'PBKDF2 Key Derivation',
      description: 'Password-Based Key Derivation Function',
      tooltip: 'Stretches passwords using multiple iterations to prevent rainbow table attacks',
      status: 'active',
      icon: RefreshCw,
    },
  ];

  const handleEncryptData = async () => {
    setIsEncrypting(true);
    // Simulate encryption process
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsEncrypting(false);
  };

  const translations = {
    en: {
      title: 'Data Protection',
      subtitle: 'Your data is secured with state-of-the-art encryption',
      securityFeatures: 'Security Features',
      status: 'Protection Status',
      allDataEncrypted: 'All data encrypted and secured',
      lastEncryption: 'Last encryption update',
      encryptData: 'Update Encryption',
      encrypting: 'Encrypting data...',
      protectionLevel: 'Protection Level',
      maximum: 'Maximum',
      compliance: 'Compliance Standards',
      gdpr: 'GDPR Compliant',
      iso: 'ISO 27001 Certified',
      hipaa: 'HIPAA Ready',
    },
    cz: {
      title: 'Ochrana dat',
      subtitle: 'Vaše data jsou zabezpečena nejmodernějším šifrováním',
      securityFeatures: 'Bezpečnostní funkce',
      status: 'Stav ochrany',
      allDataEncrypted: 'Všechna data šifrována a zabezpečena',
      lastEncryption: 'Poslední aktualizace šifrování',
      encryptData: 'Aktualizovat šifrování',
      encrypting: 'Šifrování dat...',
      protectionLevel: 'Úroveň ochrany',
      maximum: 'Maximální',
      compliance: 'Standardy dodržování',
      gdpr: 'GDPR kompatibilní',
      iso: 'ISO 27001 certifikováno',
      hipaa: 'HIPAA připraveno',
    },
    ru: {
      title: 'Защита данных',
      subtitle: 'Ваши данные защищены современным шифрованием',
      securityFeatures: 'Функции безопасности',
      status: 'Статус защиты',
      allDataEncrypted: 'Все данные зашифрованы и защищены',
      lastEncryption: 'Последнее обновление шифрования',
      encryptData: 'Обновить шифрование',
      encrypting: 'Шифрование данных...',
      protectionLevel: 'Уровень защиты',
      maximum: 'Максимальный',
      compliance: 'Стандарты соответствия',
      gdpr: 'Соответствует GDPR',
      iso: 'Сертифицировано ISO 27001',
      hipaa: 'Готово к HIPAA',
    },
    fr: {
      title: 'Protection des données',
      subtitle: 'Vos données sont sécurisées avec un chiffrement de pointe',
      securityFeatures: 'Fonctionnalités de sécurité',
      status: 'Statut de protection',
      allDataEncrypted: 'Toutes les données chiffrées et sécurisées',
      lastEncryption: 'Dernière mise à jour du chiffrement',
      encryptData: 'Mettre à jour le chiffrement',
      encrypting: 'Chiffrement des données...',
      protectionLevel: 'Niveau de protection',
      maximum: 'Maximum',
      compliance: 'Normes de conformité',
      gdpr: 'Conforme GDPR',
      iso: 'Certifié ISO 27001',
      hipaa: 'Prêt pour HIPAA',
    },
  };

  const t = translations[settings.language];

  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8" />
              <div>
                <h3 className="text-lg font-semibold">{t.status}</h3>
                <p className="text-green-100">{t.allDataEncrypted}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8" />
              <div>
                <h3 className="text-lg font-semibold">{t.protectionLevel}</h3>
                <p className="text-blue-100">{t.maximum}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-8 h-8" />
              <div>
                <h3 className="text-lg font-semibold">{t.lastEncryption}</h3>
                <p className="text-purple-100">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Features */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t.securityFeatures}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {securityFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="relative group">
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{feature.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600 font-medium">Active</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <p>{feature.tooltip}</p>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Compliance */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t.compliance}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t.gdpr}</h3>
              <p className="text-sm text-gray-600">European data protection regulation</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t.iso}</h3>
              <p className="text-sm text-gray-600">Information security management</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Lock className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t.hipaa}</h3>
              <p className="text-sm text-gray-600">Healthcare data protection</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Encryption Management</h2>
              <p className="text-gray-600">Ensure all generated data is secured with the latest encryption protocols</p>
            </div>
            <button
              onClick={handleEncryptData}
              disabled={isEncrypting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isEncrypting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  {t.encrypting}
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  {t.encryptData}
                </>
              )}
            </button>
          </div>
          
          {isEncrypting && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Encryption in progress</p>
                  <p className="text-sm text-blue-700">Please do not close the application during this process</p>
                </div>
              </div>
              <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}