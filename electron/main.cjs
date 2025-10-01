const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const isDev = process.env.NODE_ENV === "development";

const axios = require("axios");  // Import axios

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // Disable CSP for development
    },
  });

  // Set CSP to allow scripts
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["script-src 'self' 'unsafe-inline' 'unsafe-eval'; default-src 'self' http://localhost:* https://*"]
      }
    });
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// API Handler pro komunikaci s renderer procesem
ipcMain.handle('fetch-acquaint-data', async (event, sitePrefix, siteId = 0) => {
  if (!sitePrefix) {
    throw new Error('Missing sitePrefix');
  }

  const sanitizedId = siteId ?? 0;
  const url = `https://www.acquaintcrm.co.uk/datafeeds/standardxml/${sitePrefix}-${sanitizedId}.xml`;
  console.log('Fetching Acquaint feed from main process:', url);

  try {
    const response = await axios.get(url, { responseType: 'text' });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch Acquaint data in main process:', error);
    throw error;
  }
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit(); // Ukončení aplikace, pokud není otevřeno okno
  }
});
