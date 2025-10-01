import React from 'react';
import { Globe, Palette, Bell, Download, Save } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function Settings() {
  const { state, dispatch } = useApp();
  const { settings } = state;

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'cz', name: 'Čeština', flag: '🇨🇿' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  const themes = [
    { value: 'light', name: 'Light Theme', icon: '☀️' },
    { value: 'dark', name: 'Dark Theme', icon: '🌙' },
  ];

  const updateSetting = (key: keyof typeof settings, value: any) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: value } });
  };

  const translations = {
    en: {
      title: 'Settings',
      subtitle: 'Customize your application preferences',
      language: 'Language',
      languageDesc: 'Choose your preferred language',
      theme: 'Theme',
      themeDesc: 'Select your preferred theme',
      notifications: 'Notifications',
      notificationsDesc: 'Enable desktop notifications',
      autoUpdate: 'Auto Update',
      autoUpdateDesc: 'Automatically update property data',
      save: 'Save Settings',
      saved: 'Settings saved successfully!',
    },
    cz: {
      title: 'Nastavení',
      subtitle: 'Přizpůsobte si předvolby aplikace',
      language: 'Jazyk',
      languageDesc: 'Vyberte preferovaný jazyk',
      theme: 'Téma',
      themeDesc: 'Vyberte preferované téma',
      notifications: 'Oznámení',
      notificationsDesc: 'Povolit oznámení na ploše',
      autoUpdate: 'Automatické aktualizace',
      autoUpdateDesc: 'Automaticky aktualizovat data nemovitostí',
      save: 'Uložit nastavení',
      saved: 'Nastavení úspěšně uloženo!',
    },
    ru: {
      title: 'Настройки',
      subtitle: 'Настройте предпочтения приложения',
      language: 'Язык',
      languageDesc: 'Выберите предпочитаемый язык',
      theme: 'Тема',
      themeDesc: 'Выберите предпочитаемую тему',
      notifications: 'Уведомления',
      notificationsDesc: 'Включить уведомления на рабочем столе',
      autoUpdate: 'Автообновление',
      autoUpdateDesc: 'Автоматически обновлять данные недвижимости',
      save: 'Сохранить настройки',
      saved: 'Настройки успешно сохранены!',
    },
    fr: {
      title: 'Paramètres',
      subtitle: 'Personnalisez vos préférences d\'application',
      language: 'Langue',
      languageDesc: 'Choisissez votre langue préférée',
      theme: 'Thème',
      themeDesc: 'Sélectionnez votre thème préféré',
      notifications: 'Notifications',
      notificationsDesc: 'Activer les notifications de bureau',
      autoUpdate: 'Mise à jour automatique',
      autoUpdateDesc: 'Mettre à jour automatiquement les données immobilières',
      save: 'Sauvegarder les paramètres',
      saved: 'Paramètres sauvegardés avec succès!',
    },
  };

  const t = translations[settings.language];

  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        <div className="space-y-6">
          {/* Language Settings */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t.language}</h2>
                <p className="text-sm text-gray-600">{t.languageDesc}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => updateSetting('language', lang.code)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    settings.language === lang.code
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{lang.flag}</span>
                    <span className="font-medium">{lang.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Settings */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Palette className="w-6 h-6 text-purple-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t.theme}</h2>
                <p className="text-sm text-gray-600">{t.themeDesc}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => updateSetting('theme', theme.value)}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    settings.theme === theme.value
                      ? 'border-purple-500 bg-purple-50 text-purple-900'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{theme.icon}</span>
                    <span className="font-medium">{theme.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-green-600" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{t.notifications}</h2>
                  <p className="text-sm text-gray-600">{t.notificationsDesc}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => updateSetting('notifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Auto Update Settings */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Download className="w-6 h-6 text-orange-600" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{t.autoUpdate}</h2>
                  <p className="text-sm text-gray-600">{t.autoUpdateDesc}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoUpdate}
                  onChange={(e) => updateSetting('autoUpdate', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                // Settings are auto-saved via context, but we can show a confirmation
                const button = document.getElementById('save-button');
                if (button) {
                  button.innerHTML = `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>${t.saved}`;
                  setTimeout(() => {
                    button.innerHTML = `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                    </svg>${t.save}`;
                  }, 2000);
                }
              }}
              id="save-button"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {t.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}