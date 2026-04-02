import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('codeLensDesktop', {
  chooseFolder: (): Promise<string | undefined> => ipcRenderer.invoke('code-lens:choose-folder')
});
