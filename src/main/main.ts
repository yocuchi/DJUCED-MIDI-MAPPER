// Proceso principal de Electron

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { MidiHandler } from './midi-handler';

let mainWindow: BrowserWindow | null = null;
const midiHandler = new MidiHandler();
let windowHasFocus = true; // Por defecto, asumimos que la ventana tiene foco

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: undefined, // Puedes agregar un icono aquí si lo deseas
  });

  // En desarrollo, cargar desde el sistema de archivos
  // En producción, cargar desde dist/renderer
  console.log('[main.ts] __dirname:', __dirname);
  console.log('[main.ts] NODE_ENV:', process.env.NODE_ENV);
  
  // Intentar múltiples rutas posibles
  const possiblePaths = [
    // Desarrollo: desde src/renderer
    path.join(__dirname, '../../src/renderer/index.html'),
    // Producción: desde dist/renderer (relativo a dist/main)
    path.join(__dirname, '../renderer/index.html'),
    // Alternativa: desde dist/renderer (absoluto)
    path.resolve(__dirname, '../renderer/index.html'),
    // Última opción: desde el directorio raíz del proyecto
    path.join(process.cwd(), 'dist/renderer/index.html'),
    path.join(process.cwd(), 'src/renderer/index.html'),
  ];
  
  console.log('[main.ts] Rutas posibles a probar:', possiblePaths);
  
  // Función para intentar cargar desde una ruta
  const tryLoadHtml = async (paths: string[], index: number = 0): Promise<void> => {
    if (index >= paths.length) {
      console.error('[main.ts] ❌ No se pudo cargar el HTML desde ninguna ruta');
      return;
    }
    
    const htmlPath = paths[index];
    console.log(`[main.ts] Intentando cargar HTML desde: ${htmlPath}`);
    
    try {
      const fs = require('fs');
      if (fs.existsSync(htmlPath)) {
        console.log(`[main.ts] ✓ Archivo encontrado en: ${htmlPath}`);
        await mainWindow!.loadFile(htmlPath);
        console.log(`[main.ts] ✓ HTML cargado exitosamente desde: ${htmlPath}`);
      } else {
        console.log(`[main.ts] ✗ Archivo no existe en: ${htmlPath}`);
        await tryLoadHtml(paths, index + 1);
      }
    } catch (err) {
      console.error(`[main.ts] ✗ Error cargando desde ${htmlPath}:`, err);
      await tryLoadHtml(paths, index + 1);
    }
  };
  
  // Intentar cargar el HTML
  tryLoadHtml(possiblePaths).catch(err => {
    console.error('[main.ts] Error crítico cargando HTML:', err);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    midiHandler.closeAll();
  });

  // Detectar cuando la ventana pierde o gana el foco
  mainWindow.on('blur', () => {
    windowHasFocus = false;
    console.log('[main.ts] Ventana perdió el foco - ignorando mensajes MIDI');
  });

  mainWindow.on('focus', () => {
    windowHasFocus = true;
    console.log('[main.ts] Ventana recuperó el foco - procesando mensajes MIDI');
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  midiHandler.closeAll();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers para MIDI
ipcMain.handle('midi:get-input-devices', () => {
  return midiHandler.getInputDevices();
});

ipcMain.handle('midi:get-output-devices', () => {
  return midiHandler.getOutputDevices();
});

ipcMain.handle('midi:open-input', (_, port: number) => {
  return midiHandler.openInput(port);
});

ipcMain.handle('midi:open-output', (_, port: number) => {
  return midiHandler.openOutput(port);
});

ipcMain.handle('midi:close-input', () => {
  midiHandler.closeInput();
});

ipcMain.handle('midi:close-output', () => {
  midiHandler.closeOutput();
});

ipcMain.handle('midi:send-message', (_, message: any) => {
  console.log('[IPC midi:send-message] INICIO - Recibido mensaje:', JSON.stringify(message));
  try {
    const startTime = Date.now();
    console.log('[IPC midi:send-message] Llamando a midiHandler.sendMessage...');
    midiHandler.sendMessage(message);
    const endTime = Date.now();
    console.log(`[IPC midi:send-message] sendMessage completado en ${endTime - startTime}ms`);
    console.log('[IPC midi:send-message] FIN - Éxito');
    return { success: true };
  } catch (error) {
    console.error('[IPC midi:send-message] ERROR:', error);
    console.error('[IPC midi:send-message] Stack trace:', error instanceof Error ? error.stack : 'N/A');
    throw error;
  }
});

ipcMain.handle('midi:is-output-open', () => {
  console.log('[IPC midi:is-output-open] Verificando si output está abierto...');
  const result = midiHandler.isOutputOpen();
  console.log('[IPC midi:is-output-open] Resultado:', result);
  return result;
});

// Escuchar mensajes MIDI y enviarlos al renderer solo si la ventana tiene foco
midiHandler.on('message', (message: any) => {
  if (mainWindow && windowHasFocus) {
    mainWindow.webContents.send('midi:message', message);
  }
});

// IPC Handlers para File System
import * as fs from 'fs';

ipcMain.handle('fs:read-file', (_, filePath: string) => {
  try {
    // Si es un path relativo, intentar resolverlo desde el directorio del proyecto
    let resolvedPath = filePath;
    
    if (!path.isAbsolute(filePath)) {
      // Intentar desde el directorio de trabajo actual
      const cwdPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(cwdPath)) {
        resolvedPath = cwdPath;
      } else {
        // Intentar desde el directorio donde está main.js
        const mainDir = __dirname;
        const projectRoot = path.join(mainDir, '..', '..');
        const projectPath = path.join(projectRoot, filePath);
        if (fs.existsSync(projectPath)) {
          resolvedPath = projectPath;
        } else {
          // Último intento: usar el path relativo tal cual
          resolvedPath = filePath;
        }
      }
    }
    
    console.log(`Leyendo archivo: ${filePath} -> ${resolvedPath}`);
    return fs.readFileSync(resolvedPath, 'utf-8');
  } catch (error) {
    console.error(`Error leyendo archivo "${filePath}":`, error);
    throw error;
  }
});

ipcMain.handle('fs:write-file', (_, filePath: string, content: string) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error('Error escribiendo archivo:', error);
    throw error;
  }
});

ipcMain.handle('fs:read-dir', (_, dirPath: string) => {
  try {
    // Si es un path relativo, intentar resolverlo desde el directorio del proyecto
    let resolvedPath = dirPath;
    
    if (!path.isAbsolute(dirPath)) {
      // Intentar desde el directorio de trabajo actual
      const cwdPath = path.join(process.cwd(), dirPath);
      if (fs.existsSync(cwdPath)) {
        resolvedPath = cwdPath;
      } else {
        // Intentar desde el directorio donde está main.js
        const mainDir = __dirname;
        const projectRoot = path.join(mainDir, '..', '..');
        const projectPath = path.join(projectRoot, dirPath);
        if (fs.existsSync(projectPath)) {
          resolvedPath = projectPath;
        } else {
          // Último intento: usar el path relativo tal cual
          resolvedPath = dirPath;
        }
      }
    }
    
    console.log(`Leyendo directorio: ${dirPath} -> ${resolvedPath}`);
    const files = fs.readdirSync(resolvedPath);
    console.log(`Archivos encontrados: ${files.length}`);
    return files;
  } catch (error) {
    console.error(`Error leyendo directorio "${dirPath}":`, error);
    throw error;
  }
});

ipcMain.handle('fs:exists', (_, filePath: string) => {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    console.error(`Error verificando existencia de archivo "${filePath}":`, error);
    return false;
  }
});

// IPC Handlers para Dialog
ipcMain.handle('dialog:show-save', async (_, options: any) => {
  if (mainWindow) {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
  }
  return { canceled: true };
});

ipcMain.handle('dialog:show-open', async (_, options: any) => {
  if (mainWindow) {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
  }
  return { canceled: true, filePaths: [] };
});
