import * as path from 'path';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { startCodeLensServer, CodeLensServer } from '../app/server';
import { logger } from '../util/logger';

let mainWindow: BrowserWindow | undefined;
let server: CodeLensServer | undefined;

async function createMainWindow(): Promise<void> {
  server = await startCodeLensServer({
    port: 4310,
    pickFolder: async () => {
      const owner = mainWindow ?? BrowserWindow.getFocusedWindow() ?? undefined;
      const result = owner
        ? await dialog.showOpenDialog(owner, {
            title: 'Choose a folder for Code Lens',
            properties: ['openDirectory']
          })
        : await dialog.showOpenDialog({
            title: 'Choose a folder for Code Lens',
            properties: ['openDirectory']
          });

      if (result.canceled || result.filePaths.length === 0) {
        return undefined;
      }

      return result.filePaths[0];
    }
  });

  const preloadPath = path.join(__dirname, 'preload.js');
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 760,
    backgroundColor: '#f9f5ee',
    webPreferences: {
      contextIsolation: true,
      preload: preloadPath
    }
  });

  await mainWindow.loadURL(`http://localhost:${server.port}`);

  mainWindow.on('closed', () => {
    mainWindow = undefined;
  });
}

ipcMain.handle('code-lens:choose-folder', async () => {
  logger.info('Folder picker requested over IPC');
  const owner = mainWindow ?? BrowserWindow.getFocusedWindow() ?? undefined;
  const result = owner
    ? await dialog.showOpenDialog(owner, {
        title: 'Choose a folder for Code Lens',
        properties: ['openDirectory']
      })
    : await dialog.showOpenDialog({
        title: 'Choose a folder for Code Lens',
        properties: ['openDirectory']
      });

  if (result.canceled || result.filePaths.length === 0) {
    logger.info('Folder picker canceled over IPC');
    return undefined;
  }

  logger.info('Folder picker resolved over IPC', { folderPath: result.filePaths[0] });
  return result.filePaths[0];
});

app.whenReady().then(async () => {
  await createMainWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    if (server) {
      await server.close();
      server = undefined;
    }
    app.quit();
  }
});
