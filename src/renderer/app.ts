// L?gica principal de la aplicaci?n

import { DeviceSelector } from './components/device-selector';
import { MappingEditor } from './components/mapping-editor';
import { TestPanel } from './components/test-panel';
import { OutputTester } from './components/output-tester';
import { ActionLibrary } from './components/action-library';
import { Instructions } from './components/instructions';
import { DjmGenerator } from './utils/djm-generator';
import { DjmParser } from './utils/djm-parser';
import { Mapping } from '../shared/types';

class App {
  private deviceSelector!: DeviceSelector;
  private mappingEditor!: MappingEditor;
  private testPanel!: TestPanel;
  private outputTester!: OutputTester;
  private actionLibrary!: ActionLibrary;
  private instructions!: Instructions;
  private djmGenerator: DjmGenerator;
  private djmParser: DjmParser;
  private currentMappingName: string = '';
  private currentMappingFile: string = '';
  private sourceFilePath: string = '';
  private outputFilePath: string = '';

  constructor() {
    this.djmGenerator = new DjmGenerator();
    this.djmParser = new DjmParser();
    this.initializeComponents();
    this.setupEventHandlers();
    this.setupTabs();
    // Inicializar información de archivos
    this.updateFileInfo();
  }

  private initializeComponents() {
    this.deviceSelector = new DeviceSelector('device-selector');
    this.mappingEditor = new MappingEditor('mapping-editor');
    this.testPanel = new TestPanel('test-panel', this.mappingEditor);
    this.outputTester = new OutputTester('output-tester');
    this.actionLibrary = new ActionLibrary('action-library');
    this.instructions = new Instructions('instructions');

    // Conectar eventos
    this.deviceSelector.onConnect(async (inputPort: number, outputPort: number) => {
      console.log('Dispositivo MIDI conectado');
      // Cargar mapeo base autom?ticamente
      await this.loadDefaultMapping(inputPort);
    });

    this.mappingEditor.onMappingChange((mappings: Mapping[]) => {
      this.testPanel.setMappings(mappings);
    });
  }

  /**
   * Actualiza el archivo origen en el test panel
   */
  private updateTestPanelSourceFile() {
    if (this.sourceFilePath) {
      const fileName = this.sourceFilePath.split(/[/\\]/).pop() || null;
      this.testPanel.setSourceFile(fileName);
    } else {
      this.testPanel.setSourceFile(null);
    }
  }

  private setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        
        // Remover active de todos
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Agregar active al seleccionado
        button.classList.add('active');
        const targetContent = document.getElementById(`${targetTab}-tab`);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });
  }

  private setupEventHandlers() {
    // Bot?n para guardar mapeo
    const saveBtn = document.getElementById('save-mapping-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveMapping());
    }

    // Bot?n para cargar mapeo
    const loadBtn = document.getElementById('load-mapping-btn');
    if (loadBtn) {
      loadBtn.addEventListener('click', () => this.loadMapping());
    }
  }


  private async saveMapping() {
    // Obtener mapeos actuales
    const mappings = this.mappingEditor.getMappings();
    
    if (mappings.length === 0) {
      alert('No hay mapeos para guardar');
      return;
    }

    // Obtener información del mapeo actual o solicitar datos básicos
    let name: string = this.currentMappingName || 'Nuevo Mapeo';
    let mapName: string = name;
    let description: string = 'Mapeo personalizado';

    // Si hay un archivo cargado, usar sus datos como base
    if (this.sourceFilePath) {
      try {
        const djmFile = await this.djmParser.parseFile(this.sourceFilePath);
        name = djmFile.name || name;
        mapName = djmFile.mapName || mapName;
        description = djmFile.description || description;
      } catch (error) {
        console.warn('No se pudo cargar información del archivo de origen:', error);
      }
    }

    // Crear objeto djmFile con los mapeos actuales
    const finalDjmFile = {
      name: name,
      mapName: mapName,
      description: description || '',
      version: '01',
      sysex: undefined,
      controls: mappings.map(m => m.control),
      mappings: mappings,
    };

    // Solicitar archivo de salida
    try {
      // Usar el nombre del mapeo actual o el nombre proporcionado como defaultPath
      // Agregar sufijo "_modificado" al nombre por defecto
      let baseFileName = this.currentMappingFile 
        ? this.currentMappingFile.replace(/\.djm$/, '') 
        : (name || this.currentMappingName || 'Nuevo Mapeo');
      
      // Agregar sufijo "_modificado" si no lo tiene ya
      const defaultFileName = baseFileName.endsWith('_modificado') 
        ? baseFileName 
        : `${baseFileName}_modificado`;
      
      // Actualizar el nombre de salida antes de mostrar el diálogo
      const outputFileNameEl = document.getElementById('output-file-name');
      if (outputFileNameEl) {
        outputFileNameEl.textContent = `${defaultFileName}.djm`;
        outputFileNameEl.style.color = '#888';
      }
      
      const result = await (window as any).electronAPI.dialog?.showSaveDialog({
        title: 'Guardar mapeo DJUCED',
        defaultPath: `${defaultFileName}.djm`,
        filters: [
          { name: 'Archivos DJUCED', extensions: ['djm'] },
          { name: 'Todos los archivos', extensions: ['*'] },
        ],
      });

      if (result && !result.canceled && result.filePath) {
        // Verificar si el archivo ya existe
        const fileExists = await (window as any).electronAPI.fs.exists(result.filePath);
        
        if (fileExists) {
          const overwrite = confirm(`El archivo "${result.filePath.split(/[/\\]/).pop()}" ya existe.\n\n¿Deseas sobrescribirlo?`);
          if (!overwrite) {
            return; // Usuario canceló la sobrescritura
          }
        }

        await this.djmGenerator.generateFile(finalDjmFile, result.filePath);
        const savedFileName = result.filePath.split(/[/\\]/).pop() || '';
        this.currentMappingFile = savedFileName;
        this.outputFilePath = result.filePath;
        this.updateFileInfo();
        this.updateMappingIndicator(savedFileName, mappings.length);
        alert('Mapeo guardado exitosamente');
        this.currentMappingName = name;
      }
    } catch (error) {
      console.error('Error guardando mapeo:', error);
      alert('Error guardando mapeo: ' + error);
    }
  }

  private async loadDefaultMapping(inputPort: number) {
    try {
      // Obtener el nombre del dispositivo conectado
      const inputDevices = await (window as any).electronAPI.midi.getInputDevices();
      const deviceName = inputDevices[inputPort]?.name || '';
      
      if (!deviceName) {
        console.warn('No se pudo obtener el nombre del dispositivo');
        return;
      }

      // Buscar mapeo en el directorio todos
      // Intentar diferentes paths posibles
      const possiblePaths = [
        'todos',
        './todos',
        '../todos',
        '../../todos',
      ];
      
      let todosPath: string | null = null;
      let files: string[] = [];
      
      // Intentar encontrar el directorio todos
      for (const testPath of possiblePaths) {
        try {
          const testFiles = await (window as any).electronAPI.fs.readDir(testPath);
          if (Array.isArray(testFiles) && testFiles.length > 0) {
            todosPath = testPath;
            files = testFiles;
            console.log(`Directorio 'todos' encontrado en: ${testPath} (${files.length} archivos)`);
            break;
          }
        } catch (error) {
          // Continuar con el siguiente path
          console.log(`Path '${testPath}' no disponible:`, error);
        }
      }
      
      if (!todosPath || files.length === 0) {
        console.error('No se pudo encontrar el directorio todos o está vacío');
        console.log('Paths probados:', possiblePaths);
        return;
      }
      
      // Declarar la variable mappingFile
      let mappingFile: string | undefined = undefined;
      
      console.log(`Buscando mapeo para dispositivo: "${deviceName}"`);
      console.log(`Archivos disponibles en ${todosPath}:`, files.filter(f => f.endsWith('.djm')));
      
      // Mapeo específico para dispositivos conocidos
      const deviceMapping: { [key: string]: string } = {
        'djcontrol inpulse 200 mk2': 'DJControl Inpulse 200 Mk2.djm',
        'djcontrol inpulse 200': 'DJControl Inpulse 200 Mk2.djm',
        'inpulse 200 mk2': 'DJControl Inpulse 200 Mk2.djm',
      };
      
      // Verificar si hay un mapeo específico
      const deviceKey = deviceName.toLowerCase().trim();
      console.log(`Buscando mapeo específico para clave: "${deviceKey}"`);
      
      if (deviceMapping[deviceKey]) {
        const mappedFile = deviceMapping[deviceKey];
        console.log(`Mapeo específico configurado: ${mappedFile}`);
        console.log(`¿Archivo existe en lista?`, files.includes(mappedFile));
        console.log(`Archivos .djm disponibles:`, files.filter(f => f.endsWith('.djm')));
        
        if (files.includes(mappedFile)) {
          mappingFile = mappedFile;
          console.log(`✅ Mapeo específico encontrado: ${deviceName} -> ${mappedFile}`);
        } else {
          console.warn(`⚠️ Archivo mapeado "${mappedFile}" no encontrado en el directorio`);
        }
      } else {
        console.log(`No hay mapeo específico para "${deviceKey}"`);
      }
      
      // Si no hay mapeo específico, buscar por coincidencia
      if (!mappingFile) {
        // Normalizar el nombre del dispositivo para buscar coincidencias
        const normalizedDeviceName = deviceName.toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .trim();
        
        let bestMatch: { file: string; score: number } | null = null;
      
      // Buscar archivo que coincida con el nombre del dispositivo
      for (const file of files) {
        if (file.endsWith('.djm')) {
          const fileName = file.toLowerCase()
            .replace(/\.djm$/, '')
            .trim();
          
          const normalizedFileName = fileName.replace(/[^a-z0-9]/g, '');
          
          // Coincidencia exacta (después de normalizar)
          if (normalizedFileName === normalizedDeviceName) {
            mappingFile = file;
            break;
          }
          
          // Calcular puntuación de coincidencia
          let score = 0;
          
          // Coincidencia exacta del nombre completo (sin normalizar, pero case-insensitive)
          if (fileName === deviceName.toLowerCase()) {
            score = 100;
          }
          // El nombre del archivo contiene el nombre del dispositivo
          else if (normalizedFileName.includes(normalizedDeviceName)) {
            score = 80;
          }
          // El nombre del dispositivo contiene el nombre del archivo
          else if (normalizedDeviceName.includes(normalizedFileName)) {
            score = 60;
          }
          // Coincidencias parciales importantes
          else {
            // Buscar palabras clave comunes
            const deviceWords = normalizedDeviceName.match(/\d+|[a-z]+/g) || [];
            const fileWords = normalizedFileName.match(/\d+|[a-z]+/g) || [];
            
            const matchingWords = deviceWords.filter((word: string) => 
              fileWords.some((fw: string) => fw.includes(word) || word.includes(fw))
            );
            
            if (matchingWords.length > 0) {
              score = (matchingWords.length / Math.max(deviceWords.length, fileWords.length)) * 50;
            }
          }
          
          // Guardar la mejor coincidencia
          if (score > 0 && (!bestMatch || score > bestMatch.score)) {
            bestMatch = { file, score };
          }
        }
      }
      
        // Si no hay coincidencia exacta, usar la mejor coincidencia encontrada
        if (!mappingFile && bestMatch && bestMatch.score >= 50) {
          mappingFile = bestMatch.file;
          console.log(`Coincidencia encontrada: ${deviceName} -> ${mappingFile} (puntuación: ${bestMatch.score})`);
        }
      }
      
      // Si no se encontró coincidencia, usar Master.djm como mapeo por defecto
      if (!mappingFile) {
        if (files.includes('Master.djm')) {
          mappingFile = 'Master.djm';
        } else if (files.length > 0) {
          // Si no existe Master.djm, usar el primer archivo .djm encontrado
          const firstDjmFile = files.find((f: string) => f.endsWith('.djm'));
          if (firstDjmFile) {
            mappingFile = firstDjmFile;
          }
        }
      }
      
      // Cargar el mapeo si se encontr?
      if (mappingFile) {
        try {
          const content = await (window as any).electronAPI.fs.readFile(`${todosPath}/${mappingFile}`);
          const djmFile = await this.djmParser.parseFile(`${todosPath}/${mappingFile}`, content);
          
          if (djmFile.mappings && djmFile.mappings.length > 0) {
            this.mappingEditor.setMappings(djmFile.mappings);
            this.currentMappingName = djmFile.name;
            this.currentMappingFile = mappingFile;
            this.sourceFilePath = `${todosPath}/${mappingFile}`;
            this.updateFileInfo();
            this.updateMappingIndicator(mappingFile, djmFile.mappings.length);
            this.showMappingNotification(mappingFile, djmFile.name, djmFile.mappings.length);
            // Actualizar el archivo origen en el test panel
            this.updateTestPanelSourceFile();
            console.log(`Mapeo base cargado: ${mappingFile} (${djmFile.mappings.length} mapeos)`);
          }
        } catch (error) {
          console.error(`Error cargando mapeo ${mappingFile}:`, error);
        }
      } else {
        console.log('No se encontr? ning?n mapeo base en el directorio todos/');
      }
    } catch (error) {
      console.error('Error cargando mapeo por defecto:', error);
    }
  }

  private async loadMapping() {
    try {
      const result = await (window as any).electronAPI.dialog?.showOpenDialog({
        title: 'Cargar mapeo DJUCED',
        filters: [
          { name: 'Archivos DJUCED', extensions: ['djm'] },
          { name: 'Todos los archivos', extensions: ['*'] },
        ],
      });

      if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        try {
          console.log('Intentando cargar archivo:', filePath);
          
          // Leer el contenido del archivo
          const content = await (window as any).electronAPI.fs.readFile(filePath);
          
          if (!content || content.trim().length === 0) {
            throw new Error('El archivo está vacío o no se pudo leer');
          }
          
          console.log('Archivo leído correctamente. Tamaño:', content.length, 'caracteres');
          
          // Parsear el archivo
          const djmFile = await this.djmParser.parseFile(filePath, content);
          
          console.log('Archivo parseado. Mapeos encontrados:', djmFile.mappings?.length || 0);
          
          if (djmFile.mappings && djmFile.mappings.length > 0) {
            this.mappingEditor.setMappings(djmFile.mappings);
            this.currentMappingName = djmFile.name;
            const fileName = filePath.split(/[/\\]/).pop() || '';
            this.currentMappingFile = fileName;
            this.sourceFilePath = filePath;
            this.updateFileInfo();
            this.updateMappingIndicator(fileName, djmFile.mappings.length);
            this.showMappingNotification(fileName, djmFile.name, djmFile.mappings.length);
            // Actualizar el archivo origen en el test panel
            this.updateTestPanelSourceFile();
            alert(`Mapeo cargado: ${fileName}\n${djmFile.mappings.length} mapeos encontrados`);
          } else {
            alert('El archivo no contiene mapeos válidos');
          }
        } catch (error: any) {
          console.error('Error cargando mapeo:', error);
          const errorMessage = error?.message || error?.toString() || 'Error desconocido';
          console.error('Detalles del error:', {
            message: errorMessage,
            stack: error?.stack,
            name: error?.name
          });
          alert(`Error cargando mapeo:\n${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('Error cargando mapeo:', error);
      alert('Error cargando mapeo: ' + error);
    }
  }

  private updateFileInfo() {
    const sourceFileNameEl = document.getElementById('source-file-name');
    const outputFileNameEl = document.getElementById('output-file-name');
    
    if (sourceFileNameEl) {
      if (this.sourceFilePath) {
        const fileName = this.sourceFilePath.split(/[/\\]/).pop() || this.sourceFilePath;
        sourceFileNameEl.textContent = fileName;
        sourceFileNameEl.style.color = '#4a9eff';
      } else {
        sourceFileNameEl.textContent = '-';
        sourceFileNameEl.style.color = '#888';
      }
    }
    
    if (outputFileNameEl) {
      if (this.outputFilePath) {
        const fileName = this.outputFilePath.split(/[/\\]/).pop() || this.outputFilePath;
        outputFileNameEl.textContent = fileName;
        outputFileNameEl.style.color = '#4a9eff';
      } else {
        // Mostrar el nombre por defecto que se usará al guardar
        // Agregar sufijo "_modificado" al nombre por defecto
        let baseFileName = this.currentMappingFile 
          ? this.currentMappingFile.replace(/\.djm$/, '') 
          : (this.currentMappingName || 'Nuevo Mapeo');
        
        // Agregar sufijo "_modificado" si no lo tiene ya
        const defaultFileName = baseFileName.endsWith('_modificado') 
          ? baseFileName 
          : `${baseFileName}_modificado`;
        
        outputFileNameEl.textContent = `${defaultFileName}.djm`;
        outputFileNameEl.style.color = '#888';
      }
    }
  }

  private updateMappingIndicator(fileName: string, mappingCount: number) {
    const mappingInfo = document.getElementById('current-mapping-info');
    const mappingFileName = document.getElementById('mapping-file-name');
    const mappingCountEl = document.getElementById('mapping-count');
    
    if (mappingInfo && mappingFileName && mappingCountEl) {
      mappingFileName.textContent = fileName;
      mappingCountEl.textContent = `(${mappingCount} mapeos)`;
      mappingInfo.style.display = 'inline-block';
    }
  }

  private showMappingNotification(fileName: string, mappingName: string, mappingCount: number) {
    // Crear notificación visual
    const notification = document.createElement('div');
    notification.className = 'mapping-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <strong>Mapeo cargado automáticamente:</strong>
        <div class="notification-details">
          <div><strong>Archivo:</strong> ${fileName}</div>
          <div><strong>Nombre:</strong> ${mappingName}</div>
          <div><strong>Mapeos:</strong> ${mappingCount}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Remover después de 5 segundos
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }
}

// Inicializar aplicaci?n cuando el DOM est? listo
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
