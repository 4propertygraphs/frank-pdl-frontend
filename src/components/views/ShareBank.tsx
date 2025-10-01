import React, { useState, useEffect, useRef } from 'react';
import { Folder, Upload, Download, Trash2, Plus, ExternalLink, Cloud, FileJson } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { shareBankService, ShareBankFile, ShareBankExport } from '../../services/sharebank';

export default function ShareBank() {
  const { state } = useApp();
  const { settings } = state;
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [files, setFiles] = useState<ShareBankFile[]>([]);
  const [exports, setExports] = useState<ShareBankExport[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
    loadExports();
  }, [currentPath]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const loadedFiles = await shareBankService.listFiles(currentPath);
      setFiles(loadedFiles);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExports = async () => {
    try {
      const loadedExports = await shareBankService.listExports();
      setExports(loadedExports);
    } catch (error) {
      console.error('Failed to load exports:', error);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await shareBankService.createFolder(newFolderName, currentPath);
      setNewFolderName('');
      setShowNewFolderModal(false);
      await loadFiles();
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    try {
      for (const file of Array.from(files)) {
        await shareBankService.uploadFile(file, currentPath);
      }
      await loadFiles();
    } catch (error) {
      console.error('Failed to upload files:', error);
      alert('Failed to upload files');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const deleteSelectedItems = async () => {
    if (selectedItems.length === 0) return;

    if (!confirm(`Delete ${selectedItems.length} item(s)?`)) return;

    setLoading(true);
    try {
      await shareBankService.deleteFiles(selectedItems);
      setSelectedItems([]);
      await loadFiles();
    } catch (error) {
      console.error('Failed to delete items:', error);
      alert('Failed to delete items');
    } finally {
      setLoading(false);
    }
  };

  const downloadSelectedItems = async () => {
    if (selectedItems.length === 0) return;

    for (const itemId of selectedItems) {
      const file = files.find(f => f.id === itemId);
      if (!file || file.type === 'folder') continue;

      try {
        const blob = await shareBankService.downloadFile(file);
        if (!blob) continue;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to download file:', error);
      }
    }
  };

  const translations = {
    en: {
      title: 'Share Bank',
      subtitle: 'Cloud storage connected to Google Drive',
      newFolder: 'New Folder',
      upload: 'Upload Files',
      download: 'Download',
      delete: 'Delete',
      selected: 'selected',
      createFolder: 'Create Folder',
      folderName: 'Folder name',
      cancel: 'Cancel',
      create: 'Create',
      name: 'Name',
      modified: 'Modified',
      size: 'Size',
      type: 'Type',
      folder: 'Folder',
      file: 'File',
      openInDrive: 'Open in Google Drive',
      syncStatus: 'Sync Status',
      synced: 'Synced with Google Drive',
      empty: 'Your storage is empty',
      emptyDesc: 'Create folders and upload files to get started',
    },
    cz: {
      title: 'Share Bank',
      subtitle: 'Cloudové úložiště propojené s Google Drive',
      newFolder: 'Nová složka',
      upload: 'Nahrát soubory',
      download: 'Stáhnout',
      delete: 'Smazat',
      selected: 'vybráno',
      createFolder: 'Vytvořit složku',
      folderName: 'Název složky',
      cancel: 'Zrušit',
      create: 'Vytvořit',
      name: 'Název',
      modified: 'Upraveno',
      size: 'Velikost',
      type: 'Typ',
      folder: 'Složka',
      file: 'Soubor',
      openInDrive: 'Otevřít v Google Drive',
      syncStatus: 'Stav synchronizace',
      synced: 'Synchronizováno s Google Drive',
      empty: 'Vaše úložiště je prázdné',
      emptyDesc: 'Vytvořte složky a nahrajte soubory pro začátek',
    },
    ru: {
      title: 'Share Bank',
      subtitle: 'Облачное хранилище, подключенное к Google Drive',
      newFolder: 'Новая папка',
      upload: 'Загрузить файлы',
      download: 'Скачать',
      delete: 'Удалить',
      selected: 'выбрано',
      createFolder: 'Создать папку',
      folderName: 'Имя папки',
      cancel: 'Отмена',
      create: 'Создать',
      name: 'Имя',
      modified: 'Изменено',
      size: 'Размер',
      type: 'Тип',
      folder: 'Папка',
      file: 'Файл',
      openInDrive: 'Открыть в Google Drive',
      syncStatus: 'Статус синхронизации',
      synced: 'Синхронизировано с Google Drive',
      empty: 'Ваше хранилище пусто',
      emptyDesc: 'Создайте папки и загрузите файлы для начала работы',
    },
    fr: {
      title: 'Share Bank',
      subtitle: 'Stockage cloud connecté à Google Drive',
      newFolder: 'Nouveau dossier',
      upload: 'Télécharger des fichiers',
      download: 'Télécharger',
      delete: 'Supprimer',
      selected: 'sélectionné(s)',
      createFolder: 'Créer un dossier',
      folderName: 'Nom du dossier',
      cancel: 'Annuler',
      create: 'Créer',
      name: 'Nom',
      modified: 'Modifié',
      size: 'Taille',
      type: 'Type',
      folder: 'Dossier',
      file: 'Fichier',
      openInDrive: 'Ouvrir dans Google Drive',
      syncStatus: 'État de synchronisation',
      synced: 'Synchronisé avec Google Drive',
      empty: 'Votre stockage est vide',
      emptyDesc: 'Créez des dossiers et téléchargez des fichiers pour commencer',
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

        {/* Sync Status */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cloud className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">{t.syncStatus}</h3>
                <p className="text-sm text-gray-600">{t.synced}</p>
              </div>
            </div>
            <a
              href="https://drive.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {t.openInDrive}
            </a>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowNewFolderModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                <Plus className="w-4 h-4" />
                {t.newFolder}
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                <Upload className="w-4 h-4" />
                {t.upload}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {selectedItems.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {selectedItems.length} {t.selected}
                </span>
                <button
                  onClick={downloadSelectedItems}
                  className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  disabled={loading}
                >
                  <Download className="w-4 h-4" />
                  {t.download}
                </button>
                <button
                  onClick={deleteSelectedItems}
                  className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4" />
                  {t.delete}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* File List */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {files.length === 0 ? (
            <div className="text-center py-16">
              <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.empty}</h3>
              <p className="text-gray-600">{t.emptyDesc}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="w-8 px-4 py-3"></th>
                    <th className="text-left px-4 py-3 font-medium text-gray-900">{t.name}</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-900">{t.type}</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-900">{t.size}</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-900">{t.modified}</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr key={file.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(file.id)}
                          onChange={() => toggleItemSelection(file.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {file.type === 'folder' ? (
                            <Folder className="w-5 h-5 text-blue-600" />
                          ) : file.mime_type === 'application/json' ? (
                            <FileJson className="w-5 h-5 text-green-600" />
                          ) : (
                            <div className="w-5 h-5 bg-gray-300 rounded"></div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{file.name}</span>
                            {file.google_drive_url && (
                              <a
                                href={file.google_drive_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                                title="Open in Google Drive"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {file.type === 'folder' ? t.folder : t.file}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {file.size ? formatFileSize(file.size) : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(file.updated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t.createFolder}</h2>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder={t.folderName}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowNewFolderModal(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={createFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t.create}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}