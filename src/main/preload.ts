// Preload script para exponer APIs seguras al renderer

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // MIDI API
  midi: {
    getInputDevices: () => ipcRenderer.invoke('midi:get-input-devices'),
    getOutputDevices: () => ipcRenderer.invoke('midi:get-output-devices'),
    openInput: (port: number) => ipcRenderer.invoke('midi:open-input', port),
    openOutput: (port: number) => ipcRenderer.invoke('midi:open-output', port),
    closeInput: () => ipcRenderer.invoke('midi:close-input'),
    closeOutput: () => ipcRenderer.invoke('midi:close-output'),
    sendMessage: (message: any) => ipcRenderer.invoke('midi:send-message', message),
    isOutputOpen: () => ipcRenderer.invoke('midi:is-output-open'),
    onMessage: (callback: (message: any) => void) => {
      ipcRenderer.on('midi:message', (_, message) => callback(message));
    },
    removeMessageListener: () => {
      ipcRenderer.removeAllListeners('midi:message');
    },
  },
  
  // File system API
  fs: {
    readFile: (path: string) => ipcRenderer.invoke('fs:read-file', path),
    writeFile: (path: string, content: string) => ipcRenderer.invoke('fs:write-file', path, content),
    readDir: (path: string) => ipcRenderer.invoke('fs:read-dir', path),
    exists: (path: string) => ipcRenderer.invoke('fs:exists', path),
  },
  
  // Dialog API
  dialog: {
    showSaveDialog: (options: any) => ipcRenderer.invoke('dialog:show-save', options),
    showOpenDialog: (options: any) => ipcRenderer.invoke('dialog:show-open', options),
  },
});
