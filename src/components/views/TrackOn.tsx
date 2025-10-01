import React, { useState } from 'react';
import { Monitor, Wifi, HardDrive, Cpu, Eye, EyeOff, AlertTriangle, Lock } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface ConnectedDevice {
  id: string;
  ip: string;
  hostname: string;
  os: string;
  status: 'online' | 'offline';
  lastSeen: Date;
  specs: {
    cpu: string;
    ram: string;
    storage: string;
    gpu?: string;
  };
  location?: string;
}

export default function TrackOn() {
  const { state } = useApp();
  const { settings } = state;
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [isStealthMode, setIsStealthMode] = useState(false);
  const [showEULA, setShowEULA] = useState(false);
  
  // Mock data for demonstration - in real app this would come from government-approved tracking system
  const [devices] = useState<ConnectedDevice[]>([
    {
      id: '1',
      ip: '192.168.1.105',
      hostname: 'DESKTOP-ABC123',
      os: 'Windows 11 Pro',
      status: 'online',
      lastSeen: new Date(),
      specs: {
        cpu: 'Intel Core i7-12700K',
        ram: '32GB DDR4',
        storage: '1TB NVMe SSD',
        gpu: 'NVIDIA RTX 4080',
      },
      location: 'Prague, Czech Republic',
    },
    {
      id: '2',
      ip: '192.168.1.108',
      hostname: 'MacBook-Pro',
      os: 'macOS Ventura 13.2',
      status: 'online',
      lastSeen: new Date(Date.now() - 1000 * 60 * 5),
      specs: {
        cpu: 'Apple M2 Pro',
        ram: '16GB Unified Memory',
        storage: '512GB SSD',
      },
      location: 'Prague, Czech Republic',
    },
    {
      id: '3',
      ip: '192.168.1.112',
      hostname: 'WORKSTATION-XYZ',
      os: 'Ubuntu 22.04 LTS',
      status: 'offline',
      lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2),
      specs: {
        cpu: 'AMD Ryzen 9 5950X',
        ram: '64GB DDR4',
        storage: '2TB NVMe SSD',
        gpu: 'NVIDIA RTX 3090',
      },
      location: 'Brno, Czech Republic',
    },
  ]);

  const connectToDevice = async (deviceId: string) => {
    setSelectedDevice(deviceId);
    setIsStealthMode(true);
    
    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In real implementation, this would establish secure connection to device
    console.log(`Connected to device ${deviceId} in stealth mode`);
  };

  const translations = {
    en: {
      title: 'Track On',
      subtitle: 'Government-approved monitoring system (EULA Required)',
      warning: 'RESTRICTED ACCESS',
      warningDesc: 'This feature requires special authorization and EULA acceptance',
      devices: 'Connected Devices',
      deviceSpecs: 'Device Specifications',
      connectStealth: 'Connect (Stealth Mode)',
      disconnect: 'Disconnect',
      viewEULA: 'View EULA',
      status: 'Status',
      lastSeen: 'Last Seen',
      location: 'Location',
      stealthActive: 'Stealth Mode Active',
      monitoring: 'Monitoring device remotely...',
      eulaTitle: 'End User License Agreement - Track On Feature',
      eulaContent: 'This monitoring feature is approved for use by authorized personnel only. By using this feature, you acknowledge that you have proper legal authorization to monitor the specified devices. Misuse of this feature may result in legal consequences.',
      accept: 'Accept',
      decline: 'Decline',
      online: 'Online',
      offline: 'Offline',
    },
    cz: {
      title: 'Track On',
      subtitle: 'Vládou schválený monitorovací systém (vyžaduje EULA)',
      warning: 'OMEZENÝ PŘÍSTUP',
      warningDesc: 'Tato funkce vyžaduje speciální autorizaci a přijetí EULA',
      devices: 'Připojená zařízení',
      deviceSpecs: 'Specifikace zařízení',
      connectStealth: 'Připojit (Stealth režim)',
      disconnect: 'Odpojit',
      viewEULA: 'Zobrazit EULA',
      status: 'Stav',
      lastSeen: 'Naposledy viděno',
      location: 'Lokace',
      stealthActive: 'Stealth režim aktivní',
      monitoring: 'Vzdálené monitorování zařízení...',
      eulaTitle: 'Licenční smlouva s koncovým uživatelem - Funkce Track On',
      eulaContent: 'Tato monitorovací funkce je schválena pouze pro použití autorizovaným personálem. Používáním této funkce potvrzujete, že máte příslušné právní oprávnění k monitorování uvedených zařízení. Zneužití této funkce může mít právní následky.',
      accept: 'Přijmout',
      decline: 'Odmítnout',
      online: 'Online',
      offline: 'Offline',
    },
    ru: {
      title: 'Track On',
      subtitle: 'Одобренная правительством система мониторинга (требуется EULA)',
      warning: 'ОГРАНИЧЕННЫЙ ДОСТУП',
      warningDesc: 'Эта функция требует специального разрешения и принятия EULA',
      devices: 'Подключенные устройства',
      deviceSpecs: 'Характеристики устройства',
      connectStealth: 'Подключиться (Скрытый режим)',
      disconnect: 'Отключиться',
      viewEULA: 'Просмотр EULA',
      status: 'Статус',
      lastSeen: 'Последний раз в сети',
      location: 'Местоположение',
      stealthActive: 'Скрытый режим активен',
      monitoring: 'Удаленный мониторинг устройства...',
      eulaTitle: 'Лицензионное соглашение с конечным пользователем - Функция Track On',
      eulaContent: 'Эта функция мониторинга одобрена только для использования авторизованным персоналом. Используя эту функцию, вы подтверждаете, что имеете соответствующие правовые полномочия для мониторинга указанных устройств. Неправильное использование этой функции может повлечь правовые последствия.',
      accept: 'Принять',
      decline: 'Отклонить',
      online: 'В сети',
      offline: 'Не в сети',
    },
    fr: {
      title: 'Track On',
      subtitle: 'Système de surveillance approuvé par le gouvernement (EULA requis)',
      warning: 'ACCÈS RESTREINT',
      warningDesc: 'Cette fonctionnalité nécessite une autorisation spéciale et l\'acceptation du CLUF',
      devices: 'Appareils connectés',
      deviceSpecs: 'Spécifications de l\'appareil',
      connectStealth: 'Se connecter (Mode furtif)',
      disconnect: 'Se déconnecter',
      viewEULA: 'Voir le CLUF',
      status: 'Statut',
      lastSeen: 'Vu pour la dernière fois',
      location: 'Emplacement',
      stealthActive: 'Mode furtif actif',
      monitoring: 'Surveillance à distance de l\'appareil...',
      eulaTitle: 'Contrat de licence utilisateur final - Fonctionnalité Track On',
      eulaContent: 'Cette fonction de surveillance est approuvée uniquement pour une utilisation par du personnel autorisé. En utilisant cette fonction, vous reconnaissez que vous disposez de l\'autorisation légale appropriée pour surveiller les appareils spécifiés. L\'utilisation abusive de cette fonction peut entraîner des conséquences légales.',
      accept: 'Accepter',
      decline: 'Décliner',
      online: 'En ligne',
      offline: 'Hors ligne',
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

        {/* Warning Banner */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-xl mb-8">
          <div className="flex items-center gap-4">
            <Lock className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold mb-2">{t.warning}</h2>
              <p className="text-red-100">{t.warningDesc}</p>
            </div>
            <button
              onClick={() => setShowEULA(true)}
              className="ml-auto px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              {t.viewEULA}
            </button>
          </div>
        </div>

        {/* Stealth Mode Status */}
        {isStealthMode && selectedDevice && (
          <div className="bg-orange-500 text-white p-4 rounded-xl mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-6 h-6" />
              <div>
                <h3 className="font-semibold">{t.stealthActive}</h3>
                <p className="text-orange-100 text-sm">{t.monitoring}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsStealthMode(false);
                setSelectedDevice(null);
              }}
              className="px-4 py-2 bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
            >
              {t.disconnect}
            </button>
          </div>
        )}

        {/* Devices List */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">{t.devices}</h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className={`border rounded-xl p-6 transition-all ${
                    selectedDevice === device.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Monitor className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{device.hostname}</h3>
                      <p className="text-sm text-gray-600">{device.ip}</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      device.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">{t.status}:</span>
                      <span className={device.status === 'online' ? 'text-green-600' : 'text-red-600'}>
                        {device.status === 'online' ? t.online : t.offline}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">OS:</span>
                      <span className="text-gray-900">{device.os}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">{t.lastSeen}:</span>
                      <span className="text-gray-900">{device.lastSeen.toLocaleString()}</span>
                    </div>

                    {device.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">{t.location}:</span>
                        <span className="text-gray-900">{device.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Device Specs */}
                  <div className="border-t pt-4 mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">{t.deviceSpecs}</h4>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-3 h-3" />
                        <span>{device.specs.cpu}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-3 h-3" />
                        <span>{device.specs.ram}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-3 h-3" />
                        <span>{device.specs.storage}</span>
                      </div>
                      {device.specs.gpu && (
                        <div className="flex items-center gap-2">
                          <Monitor className="w-3 h-3" />
                          <span>{device.specs.gpu}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => connectToDevice(device.id)}
                    disabled={device.status === 'offline' || selectedDevice === device.id}
                    className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      selectedDevice === device.id
                        ? 'bg-orange-600 text-white'
                        : device.status === 'online'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {selectedDevice === device.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <EyeOff className="w-4 h-4" />
                        Connected
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Eye className="w-4 h-4" />
                        {t.connectStealth}
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* EULA Modal */}
      {showEULA && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h2 className="text-xl font-semibold text-gray-900">{t.eulaTitle}</h2>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              <div className="prose max-w-none text-sm text-gray-700">
                <p className="mb-4">{t.eulaContent}</p>
                
                <h3 className="text-lg font-semibold mt-6 mb-3">Terms and Conditions</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>This software is authorized for use by government-approved entities only</li>
                  <li>Monitoring activities must comply with local privacy and surveillance laws</li>
                  <li>Unauthorized use may result in criminal charges</li>
                  <li>All activities are logged and subject to audit</li>
                  <li>User must have explicit consent or legal warrant for device monitoring</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6 mb-3">Privacy Notice</h3>
                <p className="mb-4">
                  By accepting this agreement, you acknowledge that monitoring activities will be conducted
                  in accordance with applicable privacy laws and regulations. All data collected through
                  this system is subject to government security protocols.
                </p>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-900">Legal Warning</span>
                  </div>
                  <p className="text-red-800 text-sm">
                    Misuse of this monitoring capability is a serious offense and may result in
                    criminal prosecution, civil liability, and/or administrative sanctions.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowEULA(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t.decline}
              </button>
              <button
                onClick={() => setShowEULA(false)}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t.accept}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}