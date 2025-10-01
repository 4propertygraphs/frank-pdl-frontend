// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  fetchAcquaintData: (sitePrefix, siteId = 0) => {
    return ipcRenderer.invoke('fetch-acquaint-data', sitePrefix, siteId);
  },
});
